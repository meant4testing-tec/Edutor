import React, { useState, useRef, useEffect } from 'react';
import { APP_NAME } from '../constants';
import { Profile } from '../types';

interface HeaderProps {
  theme: string;
  onToggleTheme: () => void;
  profiles: Profile[];
  selectedProfile: Profile | null;
  onProfileSelect: (profile: Profile) => void;
  onManageProfiles: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, profiles, selectedProfile, onProfileSelect, onManageProfiles }) => {
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const SunIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
    const MoonIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>);
    const UserGroupIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md z-40">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">{APP_NAME}</h1>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <img 
                        src={selectedProfile?.picture || 'https://ui-avatars.com/api/?name=?&background=dbeafe&color=1d4ed8'} 
                        alt={selectedProfile?.name || 'No profile'}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="hidden sm:inline font-semibold text-sm">{selectedProfile?.name || 'No Profile'}</span>
                </button>

                {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 overflow-hidden">
                        <div className="p-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-1">Switch Profile</p>
                            {profiles.filter(p => p.id !== selectedProfile?.id).map(p => (
                                <button key={p.id} onClick={() => { onProfileSelect(p); setProfileMenuOpen(false); }} className="w-full text-left flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <img src={p.picture} alt={p.name} className="w-8 h-8 rounded-full object-cover mr-3" />
                                    <span>{p.name}</span>
                                </button>
                            ))}
                            {profiles.length <= 1 && <p className="text-xs text-gray-400 px-2 py-2">No other profiles to switch to.</p>}
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                            <button onClick={() => { onManageProfiles(); setProfileMenuOpen(false); }} className="w-full text-left flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <UserGroupIcon /> Manage Profiles
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
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