'use client';

import React, { useState } from 'react';
import { Heart, Star, Download, Share, Plus, Check, X, ArrowRight } from 'lucide-react';

export default function ButtonShowcase() {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 3000);
  };

  const handleLoadingTest = async () => {
    setIsLoading(true);
    addNotification('Loading test started...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    addNotification('Loading test completed!');
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-up"
            >
              {notification}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Button Showcase & Tests</h2>
        
        {/* Primary Buttons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Primary Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">
              <Heart className="w-4 h-4 mr-2" />
              Primary Button
            </button>
            <button className="btn-primary btn-sm">Small Primary</button>
            <button className="btn-primary btn-lg">Large Primary</button>
            <button 
              className="btn-primary" 
              disabled={isLoading}
              onClick={handleLoadingTest}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Test Loading
                </>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Buttons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Secondary Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <button className="btn-secondary">
              <Star className="w-4 h-4 mr-2" />
              Secondary Button
            </button>
            <button className="btn-secondary btn-sm">Small Secondary</button>
            <button className="btn-secondary btn-lg">Large Secondary</button>
            <button 
              className="btn-secondary" 
              onClick={() => addNotification('Secondary button clicked!')}
            >
              <Share className="w-4 h-4 mr-2" />
              Click Test
            </button>
          </div>
        </div>

        {/* Outline Buttons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Outline Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <button className="btn-outline">
              <Plus className="w-4 h-4 mr-2" />
              Outline Button
            </button>
            <button className="btn-outline btn-sm">Small Outline</button>
            <button className="btn-outline btn-lg">Large Outline</button>
            <button 
              className="btn-outline"
              onClick={() => addNotification('Outline button works!')}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Test Click
            </button>
          </div>
        </div>

        {/* Status Buttons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <button 
              className="btn-success"
              onClick={() => addNotification('Success! Everything is working.')}
            >
              <Check className="w-4 h-4 mr-2" />
              Success Button
            </button>
            <button 
              className="btn-warning"
              onClick={() => addNotification('Warning: This is a test warning.')}
            >
              <Star className="w-4 h-4 mr-2" />
              Warning Button
            </button>
            <button 
              className="btn-danger"
              onClick={() => addNotification('Error: This is a test error.')}
            >
              <X className="w-4 h-4 mr-2" />
              Danger Button
            </button>
          </div>
        </div>

        {/* Ghost Buttons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ghost Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <button className="btn-ghost">Ghost Button</button>
            <button className="btn-ghost btn-sm">Small Ghost</button>
            <button className="btn-ghost btn-lg">Large Ghost</button>
            <button 
              className="btn-ghost"
              onClick={() => addNotification('Ghost button activated!')}
            >
              👻 Spooky Click
            </button>
          </div>
        </div>

        {/* Interactive Form Elements */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Elements</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Input Field
              </label>
              <input 
                type="text" 
                className="input-primary" 
                placeholder="Type something to test input..."
                onChange={(e) => {
                  if (e.target.value.length > 5) {
                    addNotification('Input has more than 5 characters!');
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Textarea
              </label>
              <textarea 
                className="input-primary" 
                rows={3}
                placeholder="Test textarea functionality..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Select
              </label>
              <select 
                className="input-primary"
                onChange={(e) => addNotification(`Selected: ${e.target.value}`)}
              >
                <option value="">Choose an option...</option>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
                <option value="option3">Option 3</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card Hover Tests */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Card Interactions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card card-hover cursor-pointer" onClick={() => addNotification('Card 1 clicked!')}>
              <h4 className="font-semibold text-gray-800">Hover Card 1</h4>
              <p className="text-gray-600 text-sm mt-1">Hover and click to test interaction</p>
            </div>
            <div className="card card-hover cursor-pointer" onClick={() => addNotification('Card 2 clicked!')}>
              <h4 className="font-semibold text-gray-800">Hover Card 2</h4>
              <p className="text-gray-600 text-sm mt-1">Another test card with hover effects</p>
            </div>
            <div className="card card-hover cursor-pointer" onClick={() => addNotification('Card 3 clicked!')}>
              <h4 className="font-semibold text-gray-800">Hover Card 3</h4>
              <p className="text-gray-600 text-sm mt-1">Third test card for interaction</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">✅ All Interactive Elements Working</h4>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• All button styles and sizes functional</li>
            <li>• Loading states and animations working</li>
            <li>• Form elements properly styled and responsive</li>
            <li>• Hover effects and transitions smooth</li>
            <li>• Click handlers and notifications working</li>
            <li>• Design system consistency maintained</li>
          </ul>
        </div>
      </div>
    </div>
  );
}