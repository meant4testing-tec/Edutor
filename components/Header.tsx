
import React from 'react';
import { APP_NAME } from '../constants';
import { View } from '../types';

interface HeaderProps {
  theme: string;
  onToggleTheme: () => void;
  onShowTerms: () => void;
  view: View;
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, onShowTerms, view, setView }) => {
    const SunIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );

    const MoonIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    );

    const NavButton: React.FC<{ currentView: View, targetView: View, onClick: () => void, children: React.ReactNode }> = ({ currentView, targetView, onClick, children }) => {
        const isActive = currentView === targetView;
        return (
            <button
                onClick={onClick}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
                {children}
            </button>
        )
    };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">{APP_NAME}</h1>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <NavButton currentView={view} targetView={View.DASHBOARD} onClick={() => setView(View.DASHBOARD)}>Dashboard</NavButton>
                <NavButton currentView={view} targetView={View.HISTORY} onClick={() => setView(View.HISTORY)}>History</NavButton>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onShowTerms}
              className="text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Terms of Use
            </button>
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
        <div className="md:hidden flex items-center justify-center pb-2">
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <NavButton currentView={view} targetView={View.DASHBOARD} onClick={() => setView(View.DASHBOARD)}>Dashboard</NavButton>
                <NavButton currentView={view} targetView={View.HISTORY} onClick={() => setView(View.HISTORY)}>History</NavButton>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
   