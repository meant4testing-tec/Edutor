
import React, { useState, useRef, ChangeEvent } from 'react';
import { Profile, Medicine, Schedule, Instruction, FrequencyType, DoseStatus } from '../types';
import { db } from '../services/db';
import { compressImage } from '../services/imageCompressor';

interface AddMedicineModalProps {
  profile: Profile;
  onClose: () => void;
  onSave: () => void;
}

const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ profile, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [courseDays, setCourseDays] = useState(7);
  const [instructions, setInstructions] = useState<Instruction>(Instruction.AFTER_FOOD);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(FrequencyType.TIMES_A_DAY);
  const [frequencyValue, setFrequencyValue] = useState(3);
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressedImage = await compressImage(e.target.files[0], 0.8, 1024);
        setPrescriptionImage(compressedImage);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image.");
      }
    }
  };
  
  const generateSchedules = (medicine: Medicine): Schedule[] => {
    const schedules: Schedule[] = [];
    const startDate = new Date(medicine.startDate);
    
    const [wakeHour] = profile.wakeTime.split(':').map(Number);
    const [sleepHour, sleepMinute] = profile.sleepTime.split(':').map(Number);

    for (let day = 0; day < medicine.courseDays; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);

        if (medicine.instructions === Instruction.BEFORE_SLEEP) {
            const scheduleTime = new Date(currentDate);
            scheduleTime.setHours(sleepHour, sleepMinute, 0, 0);
            schedules.push({
                id: crypto.randomUUID(),
                medicineId: medicine.id,
                profileId: medicine.profileId,
                scheduledTime: scheduleTime.toISOString(),
                status: DoseStatus.PENDING,
                actualTakenTime: null
            });
        } else if (medicine.frequencyType === FrequencyType.EVERY_X_HOURS) {
            const dosesPerDay = Math.floor(24 / medicine.frequencyValue);
            for(let i=0; i < dosesPerDay; i++) {
                const scheduleTime = new Date(currentDate);
                scheduleTime.setHours(startDate.getHours() + (i * medicine.frequencyValue), 0, 0, 0);
                if (scheduleTime.getDate() === currentDate.getDate()) {
                     schedules.push({
                        id: crypto.randomUUID(),
                        medicineId: medicine.id,
                        profileId: medicine.profileId,
                        scheduledTime: scheduleTime.toISOString(),
                        status: DoseStatus.PENDING,
                        actualTakenTime: null
                    });
                }
            }
        } else { // TIMES_A_DAY
            const wakingHoursStart = wakeHour;
            const effectiveSleepHour = sleepHour < wakeHour ? sleepHour + 24 : sleepHour;
            const duration = effectiveSleepHour - wakingHoursStart;
            
            if (medicine.frequencyValue > 0) {
                const interval = duration / medicine.frequencyValue;
                for(let i=0; i<medicine.frequencyValue; i++) {
                     const scheduleTime = new Date(currentDate);
                     const hourOffset = i * interval;
                     const totalMinutes = (wakingHoursStart * 60) + (hourOffset * 60);
                     scheduleTime.setHours(Math.floor(totalMinutes/60) % 24, (totalMinutes % 60), 0, 0);

                     schedules.push({
                        id: crypto.randomUUID(),
                        medicineId: medicine.id,
                        profileId: medicine.profileId,
                        scheduledTime: scheduleTime.toISOString(),
                        status: DoseStatus.PENDING,
                        actualTakenTime: null
                    });
                }
            }
        }
    }
    return schedules;
  };

  const handleSubmit = async () => {
    if (!name || !dose || courseDays <= 0 || frequencyValue <= 0) {
      alert('Please fill all fields correctly.');
      return;
    }

    const newMedicine: Medicine = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      name,
      dose,
      courseDays,
      instructions,
      frequencyType,
      frequencyValue,
      prescriptionImage,
      startDate: new Date().toISOString(),
      doctorName: doctorName.trim() ? doctorName.trim() : undefined
    };
    
    const newSchedules = generateSchedules(newMedicine);

    await db.medicines.add(newMedicine);
    for (const schedule of newSchedules) {
        await db.schedules.add(schedule);
    }
    
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold p-6 border-b border-gray-200 dark:border-gray-700">Add New Medicine</h2>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-medium">Medicine Name & Dose</label>
            <div className="flex space-x-2">
                <input type="text" placeholder="e.g., Ibuprofen" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-2/3 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="e.g., 200mg" value={dose} onChange={e => setDose(e.target.value)} className="mt-1 w-1/3 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </div>
           <div>
            <label className="text-sm font-medium">Doctor's Name (Optional)</label>
            <input type="text" placeholder="e.g., Dr. Smith" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Course Duration (days)</label>
                <input type="number" value={courseDays} onChange={e => setCourseDays(parseInt(e.target.value))} className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label className="text-sm font-medium">Instructions</label>
                <select value={instructions} onChange={e => setInstructions(e.target.value as Instruction)} className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    {Object.values(Instruction).map(val => <option key={val} value={val}>{val}</option>)}
                </select>
              </div>
          </div>
          <div>
            <label className="text-sm font-medium">Frequency</label>
            <div className="flex space-x-2 mt-1">
                <select value={frequencyType} onChange={e => setFrequencyType(e.target.value as FrequencyType)} className="w-1/2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                     {Object.values(FrequencyType).map(val => <option key={val} value={val}>{val}</option>)}
                </select>
                <input type="number" value={frequencyValue} onChange={e => setFrequencyValue(parseInt(e.target.value))} className="w-1/2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
            </div>
             { instructions === Instruction.BEFORE_SLEEP && <p className="text-xs text-yellow-600 mt-1">Frequency is ignored for 'Before Sleep' instructions.</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Prescription Image</label>
            <div className="mt-1 p-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center">
              {prescriptionImage ? (
                <img src={prescriptionImage} alt="Prescription" className="max-h-40 rounded-md" />
              ) : (
                <p className="text-gray-500">No image uploaded</p>
              )}
              <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-sm text-primary-600 hover:underline">
                {prescriptionImage ? 'Change Image' : 'Upload Image'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
          </div>
        </div>
        <div className="p-4 flex justify-end space-x-2 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Save Medicine</button>
        </div>
      </div>
    </div>
  );
};

export default AddMedicineModal;
