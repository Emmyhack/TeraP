'use client';

import React, { useState, useEffect } from 'react';
import { BookOpenIcon, PhoneIcon, HeartIcon, PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Guide {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  readTime: string;
  tags: string[];
}

interface Contact {
  id: string;
  name: string;
  type: 'crisis' | 'support' | 'therapy' | 'emergency';
  phone: string;
  description: string;
  availability: string;
}

interface WellnessTool {
  id: string;
  name: string;
  type: 'breathing' | 'meditation' | 'grounding' | 'mood';
  description: string;
  duration: number;
  instructions: string[];
}

const MentalHealthResources: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guides' | 'contacts' | 'tools'>('guides');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [activeTool, setActiveTool] = useState<WellnessTool | null>(null);
  const [toolTimer, setToolTimer] = useState(0);
  const [isToolActive, setIsToolActive] = useState(false);

  const guides: Guide[] = [
    {
      id: '1',
      title: 'Understanding Anxiety',
      category: 'Mental Health',
      description: 'Learn about anxiety symptoms, causes, and coping strategies',
      content: `Anxiety is a natural response to stress, but when it becomes overwhelming, it can interfere with daily life. 

**Common Symptoms:**
- Racing thoughts
- Physical tension
- Difficulty concentrating
- Sleep disturbances

**Coping Strategies:**
1. Deep breathing exercises
2. Progressive muscle relaxation
3. Mindfulness meditation
4. Regular exercise
5. Healthy sleep habits

**When to Seek Help:**
If anxiety persists for more than 6 months or significantly impacts your daily functioning, consider speaking with a mental health professional.`,
      readTime: '5 min',
      tags: ['anxiety', 'coping', 'symptoms']
    },
    {
      id: '2',
      title: 'Managing Depression',
      category: 'Mental Health',
      description: 'Comprehensive guide to understanding and managing depression',
      content: `Depression affects millions of people worldwide and is a treatable condition.

**Understanding Depression:**
Depression is more than feeling sad - it's a persistent feeling of sadness and loss of interest that affects how you think, feel, and behave.

**Self-Care Strategies:**
1. Maintain a routine
2. Stay connected with others
3. Exercise regularly
4. Eat nutritious meals
5. Get adequate sleep
6. Practice mindfulness

**Professional Support:**
Therapy, medication, or a combination of both can be highly effective. Don't hesitate to reach out for professional help.`,
      readTime: '7 min',
      tags: ['depression', 'self-care', 'treatment']
    },
    {
      id: '3',
      title: 'Stress Management Techniques',
      category: 'Wellness',
      description: 'Practical techniques for managing daily stress',
      content: `Stress is inevitable, but how we manage it makes all the difference.

**Quick Stress Relief:**
- 4-7-8 breathing technique
- Progressive muscle relaxation
- Mindful walking
- Listening to calming music

**Long-term Strategies:**
1. Time management
2. Setting boundaries
3. Regular exercise
4. Healthy relationships
5. Adequate sleep
6. Nutrition

**Building Resilience:**
Develop coping skills, maintain social connections, and practice self-compassion to build long-term resilience against stress.`,
      readTime: '6 min',
      tags: ['stress', 'management', 'resilience']
    }
  ];

  const contacts: Contact[] = [
    {
      id: '1',
      name: 'National Suicide Prevention Lifeline',
      type: 'crisis',
      phone: '988',
      description: '24/7 crisis support for people in suicidal crisis or emotional distress',
      availability: '24/7',
    },
    {
      id: '2',
      name: 'Crisis Text Line',
      type: 'crisis',
      phone: 'Text HOME to 741741',
      description: 'Free, 24/7 crisis support via text message',
      availability: '24/7',
    },
    {
      id: '3',
      name: 'NAMI Helpline',
      type: 'support',
      phone: '1-800-950-6264',
      description: 'Information, referrals and support for mental health conditions',
      availability: 'Mon-Fri 10am-10pm ET',
    },
    {
      id: '4',
      name: 'SAMHSA National Helpline',
      type: 'support',
      phone: '1-800-662-4357',
      description: 'Treatment referral and information service',
      availability: '24/7',
    },
    {
      id: '5',
      name: 'Emergency Services',
      type: 'emergency',
      phone: '911',
      description: 'For immediate medical emergencies',
      availability: '24/7',
    }
  ];

  const wellnessTools: WellnessTool[] = [
    {
      id: '1',
      name: '4-7-8 Breathing',
      type: 'breathing',
      description: 'Calming breathing technique to reduce anxiety',
      duration: 240,
      instructions: [
        'Sit comfortably with your back straight',
        'Exhale completely through your mouth',
        'Inhale through your nose for 4 counts',
        'Hold your breath for 7 counts',
        'Exhale through your mouth for 8 counts',
        'Repeat 3-4 times'
      ]
    },
    {
      id: '2',
      name: '5-4-3-2-1 Grounding',
      type: 'grounding',
      description: 'Grounding technique using your five senses',
      duration: 300,
      instructions: [
        'Name 5 things you can see',
        'Name 4 things you can touch',
        'Name 3 things you can hear',
        'Name 2 things you can smell',
        'Name 1 thing you can taste',
        'Take deep breaths throughout'
      ]
    },
    {
      id: '3',
      name: 'Progressive Muscle Relaxation',
      type: 'meditation',
      description: 'Systematic tension and relaxation of muscle groups',
      duration: 600,
      instructions: [
        'Start with your toes, tense for 5 seconds',
        'Release and notice the relaxation',
        'Move up to your calves, repeat',
        'Continue through each muscle group',
        'End with your face and scalp',
        'Enjoy the full-body relaxation'
      ]
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isToolActive && activeTool) {
      interval = setInterval(() => {
        setToolTimer(prev => {
          if (prev >= activeTool.duration) {
            setIsToolActive(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isToolActive, activeTool]);

  const startTool = (tool: WellnessTool) => {
    if (activeTool?.id === tool.id) {
      setToolTimer(0);
      setIsToolActive(true);
    } else {
      setActiveTool(tool);
      setToolTimer(0);
      setIsToolActive(true);
    }
  };

  const pauseTool = () => {
    setIsToolActive(false);
  };

  const resetTool = () => {
    setIsToolActive(false);
    setToolTimer(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContactTypeColor = (type: Contact['type']) => {
    switch (type) {
      case 'crisis': return 'bg-red-100 text-red-800';
      case 'emergency': return 'bg-orange-100 text-orange-800';
      case 'support': return 'bg-blue-100 text-blue-800';
      case 'therapy': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mental Health Resources</h1>
        <p className="text-gray-600">Access guides, contacts, and wellness tools for your mental health journey</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'guides', label: 'Guides', icon: BookOpenIcon },
          { id: 'contacts', label: 'Contacts', icon: PhoneIcon },
          { id: 'tools', label: 'Wellness Tools', icon: HeartIcon }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Guides Tab */}
      {activeTab === 'guides' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Browse Guides</h2>
            {guides.map(guide => (
              <div
                key={guide.id}
                onClick={() => setSelectedGuide(guide)}
                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{guide.title}</h3>
                  <span className="text-sm text-gray-500">{guide.readTime}</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{guide.description}</p>
                <div className="flex flex-wrap gap-2">
                  {guide.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {selectedGuide ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedGuide.title}</h3>
                  <button
                    onClick={() => setSelectedGuide(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <div className="prose prose-sm max-w-none">
                  {selectedGuide.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 whitespace-pre-line">{paragraph}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a guide to read</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map(contact => (
            <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                <span className={`px-2 py-1 text-xs rounded ${getContactTypeColor(contact.type)}`}>
                  {contact.type}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-2xl font-bold text-indigo-600 mb-2">{contact.phone}</p>
                <p className="text-gray-600 text-sm mb-2">{contact.description}</p>
                <p className="text-gray-500 text-sm">Available: {contact.availability}</p>
              </div>
              <button
                onClick={() => window.open(`tel:${contact.phone.replace(/\D/g, '')}`)}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Call Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Wellness Tools Tab */}
      {activeTab === 'tools' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Wellness Tools</h2>
            {wellnessTools.map(tool => (
              <div
                key={tool.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  activeTool?.id === tool.id
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => {
                  setActiveTool(tool);
                  setToolTimer(0);
                  setIsToolActive(false);
                }}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{tool.description}</p>
                <p className="text-gray-500 text-xs">Duration: {Math.floor(tool.duration / 60)} minutes</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {activeTool ? (
              <div key={activeTool.id}>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{activeTool.name}</h3>
                
                {/* Timer Display */}
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-indigo-600 mb-2">
                    {formatTime(toolTimer)} / {formatTime(activeTool.duration)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(toolTimer / activeTool.duration) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    onClick={() => {
                      setToolTimer(0);
                      setIsToolActive(true);
                    }}
                    disabled={isToolActive}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>Start</span>
                  </button>
                  <button
                    onClick={pauseTool}
                    disabled={!isToolActive}
                    className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                  >
                    <PauseIcon className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={resetTool}
                    className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Instructions:</h4>
                  <ol className="space-y-2">
                    {activeTool.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <HeartIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a wellness tool to get started</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentalHealthResources;