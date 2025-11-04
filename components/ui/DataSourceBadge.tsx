import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface DataSourceBadgeProps {
  source: string;
  status: 'connected' | 'degraded' | 'offline';
  lastUpdate?: Date;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source,
  status,
  lastUpdate
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-3 w-3 text-yellow-600" />;
      case 'offline':
        return <XCircle className="h-3 w-3 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-red-50 text-red-800 border-red-200';
    }
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="ml-1">{source}</span>
      {lastUpdate && status === 'connected' && (
        <span className="ml-2 text-gray-500">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};