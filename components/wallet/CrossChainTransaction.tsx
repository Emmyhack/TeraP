/**
 * "Pay from another chain" helper.
 *
 * TeraPCore implements ZetaChain's UniversalContract. A booking from a connected EVM chain is
 * a GatewayEVM.depositAndCall(TeraPCore, amount, asset, payload) where
 *   payload = abi.encode(uint8 action = 1, abi.encode(address therapist, uint256 durationMinutes, uint256 scheduledAt, string notes))
 * The gateway swaps the deposit into its ZRC-20 and TeraPCore.onCall books the session for the
 * sender. This component builds that payload and, when an EVM wallet on a source chain is
 * connected, can submit the real depositAndCall.
 */
'use client';

import React, { useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { AlertCircle, Check, Copy, ExternalLink, Loader2, Send } from 'lucide-react';
import { useWeb3Wallet } from '@/components/wallet/Web3WalletProvider';
import { ADDRESSES, CHAIN, SUPPORTED_CHAINS } from '@/config/contracts';

const ACTION_BOOK_SESSION = 1;

/** Minimal GatewayEVM fragment, see protocol-contracts/contracts/evm/GatewayEVM.sol */
const GATEWAY_EVM_ABI = [
  'function depositAndCall(address receiver, uint256 amount, address asset, bytes payload, (address revertAddress, bool callOnRevert, address abortAddress, bytes revertMessage, uint256 onRevertGasLimit) revertOptions)',
];
const ERC20_ABI = ['function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) returns (bool)', 'function decimals() view returns (uint8)'];

/** ZetaChain LCD endpoints used to look up the cross-chain tx (CCTX) for an inbound hash. */
const CCTX_LOOKUP: Record<number, string> = {
  7001: 'https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/crosschain/inboundHashToCctxData',
  7000: 'https://zetachain.blockpi.network/lcd/v1/public/zeta-chain/crosschain/inboundHashToCctxData',
};

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm';

interface Props {
  /** Pre-fill the therapist address (e.g. from the booking screen). */
  therapist?: string;
  /** Pre-fill the duration in minutes. */
  durationMinutes?: number;
}

export function CrossChainTransaction({ therapist: initialTherapist = '', durationMinutes: initialDuration = 60 }: Props) {
  const { isConnected, chainId, signer, address } = useWeb3Wallet();
  const [therapist, setTherapist] = useState(initialTherapist);
  const [duration, setDuration] = useState(String(initialDuration));
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Optional real send
  const [gateway, setGateway] = useState('');
  const [asset, setAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const onZetaChain = chainId !== null && Boolean(SUPPORTED_CHAINS[chainId]);
  const scheduledUnix = scheduledAt ? Math.floor(new Date(scheduledAt).getTime() / 1000) : 0;

  const encoded = useMemo(() => {
    if (!ethers.isAddress(therapist)) return { payload: '', error: 'Enter a valid therapist address.' };
    const minutes = Number(duration);
    if (!Number.isInteger(minutes) || minutes <= 0) return { payload: '', error: 'Duration must be a whole number of minutes.' };
    const coder = ethers.AbiCoder.defaultAbiCoder();
    const inner = coder.encode(['address', 'uint256', 'uint256', 'string'], [therapist, BigInt(minutes), BigInt(scheduledUnix), notes]);
    return { payload: coder.encode(['uint8', 'bytes'], [ACTION_BOOK_SESSION, inner]), error: null };
  }, [therapist, duration, scheduledUnix, notes]);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const sendDepositAndCall = async () => {
    if (!signer || !address || !encoded.payload) return;
    setSendError(null);
    setTxHash(null);
    if (!ethers.isAddress(gateway) || !ethers.isAddress(asset)) {
      setSendError('Enter the GatewayEVM and ERC-20 asset addresses for your current chain.');
      return;
    }
    setSending(true);
    try {
      const token = new ethers.Contract(asset, ERC20_ABI, signer);
      const decimals = Number(await token.decimals());
      const value = ethers.parseUnits(amount || '0', decimals);
      if (value <= 0n) throw new Error('Amount must be greater than zero.');
      const allowance: bigint = await token.allowance(address, gateway);
      if (allowance < value) await (await token.approve(gateway, value)).wait();
      const gw = new ethers.Contract(gateway, GATEWAY_EVM_ABI, signer);
      const revertOptions = { revertAddress: address, callOnRevert: false, abortAddress: address, revertMessage: '0x', onRevertGasLimit: 0n };
      const tx = await gw.depositAndCall(ADDRESSES.TeraPCore, value, asset, encoded.payload, revertOptions);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      const err = e as { code?: string; shortMessage?: string; message?: string };
      setSendError(err.code === 'ACTION_REJECTED' ? 'Transaction rejected in wallet.' : err.shortMessage || err.message || 'Transaction failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Send className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-semibold text-gray-900">Pay from another chain</h3>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Bookings from other chains go through the ZetaChain gateway: call <code className="font-mono">depositAndCall</code> on your chain&apos;s GatewayEVM
        with TeraPCore as the receiver and the message below. The deposit arrives as a ZRC-20 on {CHAIN.name} and
        <code className="font-mono"> TeraPCore.onCall</code> books the session for your address.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Field label="Therapist address">
          <input type="text" value={therapist} onChange={(e) => setTherapist(e.target.value.trim())} placeholder="0x..." className={inputCls} />
        </Field>
        <Field label="Duration (minutes)">
          <input type="number" min="1" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Scheduled at (optional, 0 = now)">
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Notes (stored on-chain, encrypt first)">
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" className={inputCls} />
        </Field>
      </div>

      <div className="space-y-3 mb-6">
        <HexRow label="Receiver (TeraPCore)" value={ADDRESSES.TeraPCore || 'not configured'} onCopy={copy} copied={copied} />
        <HexRow label={`ZetaChain gateway (${CHAIN.name})`} value={ADDRESSES.Gateway} onCopy={copy} copied={copied} />
        <HexRow
          label="Message: abi.encode(uint8 1, abi.encode(address, uint256, uint256, string))"
          value={encoded.payload || encoded.error || ''}
          onCopy={copy}
          copied={copied}
          disabled={!encoded.payload}
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-2">Send it now</h4>
        {!isConnected ? (
          <p className="text-sm text-gray-500">Connect an EVM wallet on the source chain (Ethereum, Base, BSC, ...) to submit depositAndCall from here.</p>
        ) : onZetaChain ? (
          <p className="text-sm text-amber-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />You are on {SUPPORTED_CHAINS[chainId as number].name}. Book directly instead, or switch your wallet to the chain you want to pay from.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label={`GatewayEVM on chain ${chainId}`}>
                <input type="text" value={gateway} onChange={(e) => setGateway(e.target.value.trim())} placeholder="0x..." className={inputCls} />
              </Field>
              <Field label="ERC-20 asset to deposit">
                <input type="text" value={asset} onChange={(e) => setAsset(e.target.value.trim())} placeholder="0x... (USDC, etc.)" className={inputCls} />
              </Field>
              <Field label="Amount">
                <input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className={inputCls} />
              </Field>
            </div>
            <p className="text-xs text-gray-500">The asset must be a ZetaChain-supported token whose ZRC-20 TeraPCore accepts as payment. Approval is requested first if needed.</p>
            <button
              onClick={sendDepositAndCall}
              disabled={sending || !encoded.payload || !ADDRESSES.TeraPCore}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Confirm in wallet...' : 'depositAndCall'}
            </button>
            {sendError && <p className="text-sm text-red-600">{sendError}</p>}
            {txHash && (
              <p className="text-sm text-gray-700 flex items-center gap-2">
                Submitted: <code className="font-mono">{txHash.slice(0, 12)}...</code>
                {CCTX_LOOKUP[CHAIN.id] && (
                  <a href={`${CCTX_LOOKUP[CHAIN.id]}/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline flex items-center gap-1">
                    track CCTX <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function HexRow({ label, value, onCopy, copied, disabled }: { label: string; value: string; onCopy: (label: string, value: string) => void; copied: string | null; disabled?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <button onClick={() => onCopy(label, value)} disabled={disabled} className="text-xs text-primary-600 hover:underline flex items-center gap-1 disabled:opacity-40">
          {copied === label ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied === label ? 'Copied' : 'Copy'}
        </button>
      </div>
      <code className="block font-mono text-xs text-gray-800 break-all">{value}</code>
    </div>
  );
}

export default CrossChainTransaction;
