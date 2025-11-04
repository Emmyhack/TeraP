import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface RealDataIndicatorProps {
  isConnected: boolean;
  dataSource: string;
  lastUpdate?: Date;
}

export const RealDataIndicator: React.FC<RealDataIndicatorProps> = ({
  isConnected,
  dataSource,
  lastUpdate
}) => {
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
      isConnected 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {isConnected ? (
        <Wifi className="h-3 w-3 mr-1" />
      ) : (
        <WifiOff className="h-3 w-3 mr-1" />
      )}
      <span className="mr-2">
        {isConnected ? 'LIVE' : 'OFFLINE'}
      </span>
      <span className="text-gray-600">
        {dataSource}
      </span>
      {lastUpdate && (
        <span className="ml-2 text-gray-500">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};