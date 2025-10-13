
import React from 'react';
import { View, Profile } from '../types';
import ProfileSelector from './ProfileSelector';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    view: View;
    setView: (view: View) => void;
    profiles: Profile[];
    selectedProfile: Profile | null;
    onProfileSelect: (profile: Profile) => void;
    onProfilesUpdate: (profileIdToSelect?: string) => void;
}

// FIX: Cannot find namespace 'JSX'.
const NavButton: React.FC<{ currentView: View, targetView: View, onClick: () => void, children: React.ReactNode, icon: React.ReactNode }> = ({ currentView, targetView, onClick, children, icon }) => {
    const isActive = currentView === targetView;
    return (
        <button
            onClick={onClick}
            className={`flex items-center w-full text-left px-4 py-3 rounded-lg text-md font-medium transition-colors ${
                isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            <span className="mr-3">{icon}</span>
            {children}
        </button>
    )
};

const DashboardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
const HistoryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);


const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, view, setView, ...profileSelectorProps }) => {
    
    const handleNavigation = (targetView: View) => {
        setView(targetView);
        onClose();
    }

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity lg:hidden ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            ></div>
            
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full bg-gray-50 dark:bg-gray-800 shadow-lg z-50 w-72 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 lg:static lg:shadow-none lg:w-80 lg:flex-shrink-0`}
            >
                <div className="p-4 h-full flex flex-col">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400 px-2">Navigation</h2>
                        <nav className="mt-4 space-y-2">
                             <NavButton currentView={view} targetView={View.DASHBOARD} onClick={() => handleNavigation(View.DASHBOARD)} icon={<DashboardIcon />}>Dashboard</NavButton>
                             <NavButton currentView={view} targetView={View.HISTORY} onClick={() => handleNavigation(View.HISTORY)} icon={<HistoryIcon />}>History</NavButton>
                        </nav>
                    </div>

                    <div className="flex-grow overflow-y-auto">
                        <ProfileSelector {...profileSelectorProps} />
                    </div>

                    <button
                        onClick={onClose}
                        className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                        aria-label="Close sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;