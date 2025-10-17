import React, { useState } from 'react';
import { Profile } from '../types';
import { db } from '../services/db';
import ProfileForm from './ProfileForm';

interface ManageProfilesModalProps {
    profiles: Profile[];
    onProfilesUpdate: (profileIdToSelect?: string) => void;
    onClose: () => void;
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

const ManageProfilesModal: React.FC<ManageProfilesModalProps> = ({ profiles, onProfilesUpdate, onClose }) => {
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
                onProfilesUpdate();
            } catch(e) {
                console.error("Failed to delete profile", e);
                alert("An error occurred while deleting the profile.");
            }
        }
    };

    const handleEdit = (profile: Profile) => {
        setProfileToEdit(profile);
        setMode('edit');
    };
    
    const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>);
    const DeleteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">Manage Profiles</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-4">
                    {mode === 'view' && (
                        <>
                            {profiles.map(profile => (
                                <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <div className="flex items-center overflow-hidden">
                                        <img src={profile.picture} alt={profile.name} className="w-12 h-12 rounded-full object-cover mr-4 flex-shrink-0" />
                                        <div className="truncate">
                                            <span className="font-medium block truncate text-lg">{profile.name}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{calculateAge(profile.dob)} old</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => handleEdit(profile)} className="p-2 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50" aria-label={`Edit ${profile.name}`}><EditIcon /></button>
                                        <button onClick={() => handleDeleteProfile(profile.id)} className="p-2 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50" aria-label={`Delete ${profile.name}`}><DeleteIcon /></button>
                                    </div>
                                </div>
                            ))}
                             <button onClick={() => setMode('add')} className="w-full mt-4 py-3 px-4 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                <span>Add New Profile</span>
                            </button>
                        </>
                    )}
                    {mode === 'add' && <ProfileForm onSave={handleSaveProfile} onCancel={() => setMode('view')} />}
                    {mode === 'edit' && profileToEdit && <ProfileForm existingProfile={profileToEdit} onSave={handleSaveProfile} onCancel={() => { setMode('view'); setProfileToEdit(null); }} />}
                </div>
            </div>
        </div>
    );
};

export default ManageProfilesModal;
