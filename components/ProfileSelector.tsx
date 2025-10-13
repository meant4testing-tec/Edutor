import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Profile } from '../types';
import { db } from '../services/db';
import { compressImage } from '../services/imageCompressor';

interface ProfileFormProps {
    onSave: (profile: Profile) => void;
    onCancel: () => void;
    existingProfile?: Profile | null;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSave, onCancel, existingProfile }) => {
    const [name, setName] = useState(existingProfile?.name || '');
    const [picture, setPicture] = useState<string | null>(existingProfile?.picture || null);
    const [dob, setDob] = useState(existingProfile?.dob || '');
    const [wakeTime, setWakeTime] = useState(existingProfile?.wakeTime || '07:00');
    const [sleepTime, setSleepTime] = useState(existingProfile?.sleepTime || '22:00');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const compressedImage = await compressImage(e.target.files[0]);
                setPicture(compressedImage);
            } catch (error) {
                console.error("Error compressing image:", error);
                alert("Failed to process image. Please try another one.");
            }
        }
    };

    const handleSubmit = () => {
        if (!name.trim() || !dob) {
            alert("Please enter a name and date of birth.");
            return;
        }
        const profileData: Profile = {
            id: existingProfile?.id || crypto.randomUUID(),
            name: name.trim(),
            picture: picture || `https://ui-avatars.com/api/?name=${name.trim()}&background=random`,
            dob,
            wakeTime,
            sleepTime,
        };
        onSave(profileData);
    };

    return (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-semibold">{existingProfile ? 'Edit Profile' : 'Add New Profile'}</h3>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
             <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Wake-up Time</label>
                    <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </div>
                <div>
                    <label className="text-sm font-medium">Sleep Time</label>
                    <input type="time" value={sleepTime} onChange={e => setSleepTime(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <img src={picture || 'https://ui-avatars.com/api/?name=?'} alt="Profile preview" className="w-16 h-16 rounded-full object-cover bg-gray-200 dark:bg-gray-600" />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-grow px-3 py-2 text-sm text-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md"
                >
                    {picture ? 'Change Picture' : 'Upload Picture'}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
            <div className="flex justify-end space-x-2">
                <button onClick={onCancel} className="px-4 py-2 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                <button onClick={handleSubmit} className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md">Save</button>
            </div>
        </div>
    );
};


interface ProfileSelectorProps {
    profiles: Profile[];
    selectedProfile: Profile | null;
    onProfileSelect: (profile: Profile) => void;
    onProfilesUpdate: (profileIdToSelect?: string) => void;
}

const calculateAge = (dob: string): string => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
    }
    return `${years}y ${months}m`;
};

const ProfileSelector: React.FC<ProfileSelectorProps> = ({ profiles, selectedProfile, onProfileSelect, onProfilesUpdate }) => {
    const [mode, setMode] = useState<'view' | 'add' | 'edit'>('view');
    const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);
    
    const handleSaveProfile = async (profile: Profile) => {
        if (mode === 'add') {
            await db.profiles.add(profile);
        } else {
            await db.profiles.update(profile);
        }
        onProfilesUpdate(profile.id);
        setMode('view');
        setProfileToEdit(null);
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (window.confirm("Are you sure you want to delete this profile and all their medication data? This action cannot be undone.")) {
            try {
                const medsToDelete = await db.medicines.getByProfileId(profileId);
                for(const med of medsToDelete) {
                    const schedulesToDelete = await db.schedules.getByMedicineId(med.id);
                    for(const schedule of schedulesToDelete) {
                        await db.schedules.delete(schedule.id);
                    }
                    await db.medicines.delete(med.id);
                }
                await db.profiles.delete(profileId);
                
                // If the deleted profile was selected, select the first available profile or none.
                const newSelectedProfileId = selectedProfile?.id === profileId ? (profiles.find(p => p.id !== profileId)?.id) : selectedProfile?.id;
                onProfilesUpdate(newSelectedProfileId);

            } catch(e) {
                console.error("Failed to delete profile", e);
                alert("An error occurred while deleting the profile.");
            }
        }
    };

    const handleEdit = (profile: Profile, e: React.MouseEvent) => {
        e.stopPropagation();
        setProfileToEdit(profile);
        setMode('edit');
    };
    
    const AddProfileIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>);
    const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>);
    const DeleteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);


    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="p-4 flex justify-between items-center">
                <h2 className="text-lg font-bold">Profiles</h2>
                <button onClick={() => setMode('add')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Add Profile">
                    <AddProfileIcon />
                </button>
            </div>
            <div className="max-h-60 overflow-y-auto">
                {profiles.map(profile => (
                    <div
                        key={profile.id}
                        onClick={() => onProfileSelect(profile)}
                        className={`flex items-center justify-between p-3 cursor-pointer group transition-colors ${
                            selectedProfile?.id === profile.id
                                ? 'bg-primary-100 dark:bg-primary-900/50'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        <div className="flex items-center overflow-hidden">
                            <img src={profile.picture} alt={profile.name} className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0" />
                            <div className="truncate">
                                <span className="font-medium block truncate">{profile.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{calculateAge(profile.dob)}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => handleEdit(profile, e)} className="p-1.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700" aria-label={`Edit ${profile.name}`}><EditIcon /></button>
                             <button onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id)}} className="p-1.5 rounded-full hover:bg-red-200 dark:hover:bg-red-700" aria-label={`Delete ${profile.name}`}><DeleteIcon /></button>
                        </div>
                    </div>
                ))}
                {profiles.length === 0 && mode === 'view' && (
                    <p className="text-center text-gray-500 dark:text-gray-400 p-4">No profiles found. Add one to start!</p>
                )}
            </div>
            {mode === 'add' && <ProfileForm onSave={handleSaveProfile} onCancel={() => setMode('view')} />}
            {mode === 'edit' && profileToEdit && <ProfileForm existingProfile={profileToEdit} onSave={handleSaveProfile} onCancel={() => { setMode('view'); setProfileToEdit(null); }} />}
        </div>
    );
};

export default ProfileSelector;