'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Web3WalletProvider } from '@/components/wallet/Web3WalletProvider';
import { ZKIdentityProvider } from '@/components/identity/ZKIdentityProvider';

// TeraP Application State
export interface AppState {
  user: {
    isTherapist: boolean;
    isVerified: boolean;
    profile: any | null;
    reputation: number;
    terapBalance: string;
    wellnessCircles: string[];
  };
  
  platform: {
    totalTherapists: number;
    totalSessions: number;
    totalCircles: number;
    daoTreasury: string;
  };
  
  ui: {
    currentPage: 'home' | 'therapy' | 'wellness' | 'dao' | 'profile';
    isLoading: boolean;
    notifications: Notification[];
    modals: {
      connectWallet: boolean;
      bookSession: boolean;
      createCircle: boolean;
      createProposal: boolean;
    };
  };
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
}

type AppAction = 
  | { type: 'SET_USER_PROFILE'; payload: any }
  | { type: 'SET_THERAPIST_STATUS'; payload: boolean }
  | { type: 'UPDATE_BALANCE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: AppState['ui']['currentPage'] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'TOGGLE_MODAL'; payload: { modal: keyof AppState['ui']['modals']; isOpen: boolean } }
  | { type: 'UPDATE_PLATFORM_STATS'; payload: Partial<AppState['platform']> };

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Convenience methods
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  toggleModal: (modal: keyof AppState['ui']['modals'], isOpen?: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

const initialState: AppState = {
  user: {
    isTherapist: false,
    isVerified: false,
    profile: null,
    reputation: 0,
    terapBalance: '0',
    wellnessCircles: [],
  },
  
  platform: {
    totalTherapists: 0,
    totalSessions: 0,
    totalCircles: 0,
    daoTreasury: '0',
  },
  
  ui: {
    currentPage: 'home',
    isLoading: false,
    notifications: [],
    modals: {
      connectWallet: false,
      bookSession: false,
      createCircle: false,
      createProposal: false,
    },
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER_PROFILE':
      return {
        ...state,
        user: {
          ...state.user,
          profile: action.payload,
        },
      };
      
    case 'SET_THERAPIST_STATUS':
      return {
        ...state,
        user: {
          ...state.user,
          isTherapist: action.payload,
        },
      };
      
    case 'UPDATE_BALANCE':
      return {
        ...state,
        user: {
          ...state.user,
          terapBalance: action.payload,
        },
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.payload,
        },
      };
      
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        ui: {
          ...state.ui,
          currentPage: action.payload,
        },
      };
      
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, action.payload],
        },
      };
      
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload),
        },
      };
      
    case 'TOGGLE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            [action.payload.modal]: action.payload.isOpen,
          },
        },
      };
      
    case 'UPDATE_PLATFORM_STATS':
      return {
        ...state,
        platform: {
          ...state.platform,
          ...action.payload,
        },
      };
      
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const fullNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: fullNotification.id });
    }, 5000);
  };
  
  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };
  
  const setLoading = (isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  };
  
  const toggleModal = (modal: keyof AppState['ui']['modals'], isOpen?: boolean) => {
    const currentState = state.ui.modals[modal];
    const newState = isOpen !== undefined ? isOpen : !currentState;
    dispatch({ type: 'TOGGLE_MODAL', payload: { modal, isOpen: newState } });
  };
  
  const contextValue: AppContextType = {
    state,
    dispatch,
    addNotification,
    removeNotification,
    setLoading,
    toggleModal,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      <Web3WalletProvider>
        <ZKIdentityProvider>
          {children}
        </ZKIdentityProvider>
      </Web3WalletProvider>
    </AppContext.Provider>
  );
}