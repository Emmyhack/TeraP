'use client';

import React from 'react';
import { useApp } from '@/stores/AppProvider';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function NotificationContainer() {
  const { state, removeNotification } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success': return 'bg-accent-50 border-accent-200 text-accent-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-accent-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm w-full">
      {state.ui.notifications.map((notification) => {
        const Icon = getIcon(notification.type);
        return (
          <div
            key={notification.id}
            className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm animate-slide-up ${getColorClasses(notification.type)}`}
          >
            <div className="flex items-start space-x-3">
              <Icon className={`w-5 h-5 mt-0.5 ${getIconColor(notification.type)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {notification.title}
                </p>
                <p className="text-sm opacity-90 mt-1">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-current opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}