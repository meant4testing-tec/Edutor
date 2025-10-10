
import React, { useState, useRef, ChangeEvent } from 'react';
import { Profile } from '../types';
import { db } from '../services/db';
import { compressImage } from '../services/imageCompressor';

interface ProfileSelectorProps {
  profiles: Profile[];
  selectedProfile: Profile | null;
  onProfileSelect: (profile: Profile) => void;
  onProfilesUpdate: () => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({ profiles, selectedProfile, onProfileSelect, onProfilesUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPicture, setNewPicture] = useState<string | null>(null);
  const [newWakeTime, setNewWakeTime] = useState('07:00');
  const [newSleepTime, setNewSleepTime] = useState('22:00');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressedImage = await compressImage(e.target.files[0]);
        setNewPicture(compressedImage);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image. Please try another one.");
      }
    }
  };

  const handleAddProfile = async () => {
    if (!newName.trim()) {
      alert("Please enter a name.");
      return;
    }
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      picture: newPicture || `https://picsum.photos/seed/${newName}/200`,
      wakeTime: newWakeTime,
      sleepTime: newSleepTime,
    };
    await db.profiles.add(newProfile);
    onProfilesUpdate();
    setIsAdding(false);
    setNewName('');
    setNewPicture(null);
    setNewWakeTime('07:00');
    setNewSleepTime('22:00');
  };
  
  const AddProfileIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
  );

  const AddProfileForm = () => (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Profile Name"
        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="text-sm font-medium">Wake-up Time</label>
            <input type="time" value={newWakeTime} onChange={e => setNewWakeTime(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
        </div>
        <div>
            <label className="text-sm font-medium">Sleep Time</label>
            <input type="time" value={newSleepTime} onChange={e => setNewSleepTime(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
         <img src={newPicture || 'https://picsum.photos/seed/placeholder/200'} alt="Profile preview" className="w-16 h-16 rounded-full object-cover bg-gray-200 dark:bg-gray-600"/>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-grow px-3 py-2 text-sm text-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md"
        >
          {newPicture ? 'Change Picture' : 'Upload Picture'}
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      </div>
      <div className="flex justify-end space-x-2">
        <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
        <button onClick={handleAddProfile} className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md">Save</button>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold">Profiles</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
           <AddProfileIcon />
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {profiles.map(profile => (
          <div
            key={profile.id}
            onClick={() => onProfileSelect(profile)}
            className={`flex items-center p-3 cursor-pointer transition-colors ${
              selectedProfile?.id === profile.id
                ? 'bg-primary-100 dark:bg-primary-900/50'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
          >
            <img src={profile.picture} alt={profile.name} className="w-10 h-10 rounded-full object-cover mr-3" />
            <span className="font-medium">{profile.name}</span>
          </div>
        ))}
         {profiles.length === 0 && !isAdding && (
            <p className="text-center text-gray-500 dark:text-gray-400 p-4">No profiles found. Add one to start!</p>
        )}
      </div>
      {isAdding && <AddProfileForm />}
    </div>
  );
};

export default ProfileSelector;
