import React from 'react';
import { APP_NAME } from '../constants';

interface HeaderProps {
  theme: string;
  onToggleTheme: () => void;
  onShowTerms: () => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, onShowTerms, onToggleSidebar }) => {
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

    const MenuIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md z-40">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
                onClick={onToggleSidebar}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-2"
                aria-label="Toggle sidebar"
            >
                <MenuIcon />
            </button>
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">{APP_NAME}</h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onShowTerms}
              className="hidden sm:block text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
      </div>
    </header>
  );
};

export default Header;
