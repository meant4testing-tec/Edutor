import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { db } from './services/db';
import { Profile, Schedule, DoseStatus, View, Medicine } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import TermsModal from './components/TermsModal';
import AlarmBanner from './components/AlarmBanner';
import { DEVELOPER_NAME } from './constants';

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [termsAccepted, setTermsAccepted] = useLocalStorage('termsAccepted', false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [dueSchedules, setDueSchedules] = useState<Schedule[]>([]);
  const notifiedSchedulesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (termsAccepted && Notification.permission !== 'granted') {
      Notification.requestPermission().catch(err => {
        console.error("Error requesting notification permission:", err);
      });
    }
  }, [termsAccepted]);

  const fetchProfiles = useCallback(async (profileToSelectId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const allProfiles = await db.profiles.getAll();
      setProfiles(allProfiles);
      if (allProfiles.length > 0) {
        const idToSelect = profileToSelectId || localStorage.getItem('selectedProfileId');
        const profileToSelect = idToSelect ? allProfiles.find(p => p.id === idToSelect) : allProfiles[0];
        setSelectedProfile(profileToSelect || allProfiles[0]);
      } else {
        setSelectedProfile(null);
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
      setError("Could not load app data. This can sometimes happen in private browsing mode or if storage is disabled. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (selectedProfile?.id) {
        localStorage.setItem('selectedProfileId', selectedProfile.id);
    } else if (profiles.length === 0) {
        localStorage.removeItem('selectedProfileId');
    }
  }, [selectedProfile, profiles]);

  const handleProfileSelect = (profile: Profile | null) => {
    setSelectedProfile(profile);
    setView(View.DASHBOARD);
    setSidebarOpen(false);
  };

  const checkDueSchedules = useCallback(async () => {
    if (!termsAccepted) return;
    try {
      const now = new Date().toISOString();
      const allSchedules = await db.schedules.getAll();
      const due = allSchedules.filter(s => s.status === DoseStatus.PENDING && s.scheduledTime <= now);
      
      if (due.length > 0) {
        const schedulesWithDetails = await Promise.all(
          due.map(async (schedule) => {
            const [profile, medicine] = await Promise.all([
              db.profiles.get(schedule.profileId),
              db.medicines.get(schedule.medicineId),
            ]);
            return {
              ...schedule,
              profileName: profile?.name || 'Unknown Profile',
              medicineName: medicine?.name || 'Unknown Medicine',
            };
          })
        );

        schedulesWithDetails.forEach(s => {
          if (!notifiedSchedulesRef.current.has(s.id) && Notification.permission === 'granted') {
            new Notification('Time for your medication!', {
              body: `${s.profileName}: It's time to take ${s.medicineName}.`,
              icon: '/vite.svg', // Optional: Add an app icon
            });
            notifiedSchedulesRef.current.add(s.id);
          }
        });
        
        // Only update state if there's a change to prevent re-renders
        if (JSON.stringify(schedulesWithDetails) !== JSON.stringify(dueSchedules)) {
             setDueSchedules(schedulesWithDetails);
        }
      } else {
          if(dueSchedules.length > 0) {
            setDueSchedules([]);
          }
      }
    } catch (error) {
      console.error("Error checking for due schedules:", error);
    }
  }, [termsAccepted, dueSchedules]);
  
  useEffect(() => {
    const interval = setInterval(checkDueSchedules, 5000);
    return () => clearInterval(interval);
  }, [checkDueSchedules]);

  const handleUpdateSchedule = async (scheduleId: string, status: DoseStatus.TAKEN | DoseStatus.SKIPPED) => {
    const schedule = await db.schedules.get(scheduleId);
    if (schedule) {
      await db.schedules.update({
        ...schedule,
        status,
        actualTakenTime: status === DoseStatus.TAKEN ? new Date().toISOString() : null,
      });
      notifiedSchedulesRef.current.delete(scheduleId);
      setDueSchedules(prev => prev.filter(s => s.id !== scheduleId));
    }
  };

  const renderContent = () => {
    if (error) {
      return <div className="text-center p-8 text-red-500 dark:text-red-400">{error}</div>;
    }
      
    if (loading) {
      return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading...</div>;
    }

    if (!selectedProfile) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Welcome to Medicine Reminder</h2>
            <p className="text-gray-600 dark:text-gray-400">Create a profile from the sidebar to get started.</p>
        </div>
      );
    }

    switch (view) {
      case View.HISTORY:
        return <HistoryView profile={selectedProfile} />;
      case View.DASHBOARD:
      default:
        return <Dashboard profile={selectedProfile} />;
    }
  };
  
  const MemoizedHeader = React.memo(Header);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme}`}>
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex">
            {!termsAccepted && <TermsModal onAccept={() => setTermsAccepted(true)} />}
            {showTerms && <TermsModal onAccept={() => setShowTerms(false)} isReopened={true} />}
        
            <Sidebar 
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                view={view}
                setView={setView}
                profiles={profiles}
                selectedProfile={selectedProfile}
                onProfileSelect={handleProfileSelect}
                onProfilesUpdate={fetchProfiles}
            />

            <div className="flex-1 flex flex-col transition-all duration-300">
                <MemoizedHeader 
                    theme={theme} 
                    onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                    onShowTerms={() => setShowTerms(true)}
                    onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                />

                <main className="flex-grow pt-20 p-4 sm:p-6 lg:p-8 w-full">
                     <div className="fixed top-20 left-0 right-0 z-30 p-4 space-y-2">
                        {dueSchedules.map(schedule => (
                            <AlarmBanner key={schedule.id} schedule={schedule} onUpdate={handleUpdateSchedule} />
                        ))}
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 mt-8">
                        {termsAccepted ? renderContent() : <p className="text-center">Please accept the terms to use the app.</p>}
                    </div>
                </main>

                <footer className="text-center py-4">
                    <p className="text-xs text-gray-500 dark:text-gray-600">Powered by {DEVELOPER_NAME}</p>
                </footer>
            </div>
        </div>
    </div>
  );
};

export default App;