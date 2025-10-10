
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { db } from './services/db';
import { Profile, Schedule, DoseStatus, View } from './types';
import Header from './components/Header';
import ProfileSelector from './components/ProfileSelector';
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
  const [showTerms, setShowTerms] = useState(false);
  const [dueSchedules, setDueSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const allProfiles = await db.profiles.getAll();
      setProfiles(allProfiles);
      if (allProfiles.length > 0) {
        const lastSelectedProfileId = localStorage.getItem('selectedProfileId');
        const profileToSelect = lastSelectedProfileId ? allProfiles.find(p => p.id === lastSelectedProfileId) : allProfiles[0];
        setSelectedProfile(profileToSelect || allProfiles[0]);
      } else {
        setSelectedProfile(null);
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
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
    }
  }, [selectedProfile]);

  const handleProfileSelect = (profile: Profile | null) => {
    setSelectedProfile(profile);
    setView(View.DASHBOARD);
  };

  const checkDueSchedules = useCallback(async () => {
    if (!termsAccepted) return;
    try {
      const now = new Date().toISOString();
      const pendingSchedules = await db.schedules.getAll();
      const due = pendingSchedules.filter(s => s.status === DoseStatus.PENDING && s.scheduledTime <= now);
      if (due.length > 0) {
        const profilesForDueSchedules = await Promise.all(
          due.map(s => db.profiles.get(s.profileId))
        );
        const dueWithProfile = due.map((schedule, index) => ({
            ...schedule,
            profileName: profilesForDueSchedules[index]?.name || 'Unknown Profile'
        }));
        
        // Only update if there's a change to prevent re-renders
        if (JSON.stringify(dueWithProfile) !== JSON.stringify(dueSchedules)) {
             setDueSchedules(dueWithProfile);
        }
      } else {
          setDueSchedules([]);
      }
    } catch (error) {
      console.error("Error checking for due schedules:", error);
    }
  }, [termsAccepted, dueSchedules]);
  
  useEffect(() => {
    const interval = setInterval(checkDueSchedules, 5000); // Check every 5 seconds
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
      setDueSchedules(prev => prev.filter(s => s.id !== scheduleId));
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading...</div>;
    }

    if (!selectedProfile) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Welcome to Medicine Reminder</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">Please create a profile to get started.</p>
            <ProfileSelector profiles={profiles} onProfileSelect={handleProfileSelect} onProfilesUpdate={fetchProfiles} selectedProfile={null} />
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
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
        {!termsAccepted && <TermsModal onAccept={() => setTermsAccepted(true)} />}
        {showTerms && <TermsModal onAccept={() => setShowTerms(false)} isReopened={true} />}
        
        <div className="fixed top-0 left-0 right-0 z-30 p-4 space-y-2">
            {dueSchedules.map(schedule => (
                <AlarmBanner key={schedule.id} schedule={schedule} onUpdate={handleUpdateSchedule} />
            ))}
        </div>
        
        <MemoizedHeader 
            theme={theme} 
            onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            onShowTerms={() => setShowTerms(true)}
            view={view}
            setView={setView}
            />
        
        <main className="flex-grow pt-28 md:pt-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
                <ProfileSelector profiles={profiles} selectedProfile={selectedProfile} onProfileSelect={handleProfileSelect} onProfilesUpdate={fetchProfiles} />
            </div>
            <div className="lg:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
                    {termsAccepted ? renderContent() : <p className="text-center">Please accept the terms to use the app.</p>}
                </div>
            </div>
            </div>
        </main>
        <footer className="text-center py-4">
            <p className="text-xs text-gray-500 dark:text-gray-600">Powered by {DEVELOPER_NAME}</p>
        </footer>
        </div>
    </div>
  );
};

export default App;
