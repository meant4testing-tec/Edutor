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
  const [customInstructions, setCustomInstructions] = useState('');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(FrequencyType.TIMES_A_DAY);
  const [frequencyValue, setFrequencyValue] = useState(3);
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [medicineImage, setMedicineImage] = useState<string | null>(null);
  const prescriptionFileInputRef = useRef<HTMLInputElement>(null);
  const medicineFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, type: 'prescription' | 'medicine') => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressedImage = await compressImage(e.target.files[0], 0.8, 1024);
        if (type === 'prescription') {
            setPrescriptionImage(compressedImage);
        } else {
            setMedicineImage(compressedImage);
        }
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
      alert('Please fill all required fields correctly.');
      return;
    }

    const newMedicine: Medicine = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      name,
      dose,
      courseDays,
      instructions,
      customInstructions: customInstructions.trim() ? customInstructions.trim() : undefined,
      frequencyType,
      frequencyValue,
      prescriptionImage: prescriptionImage || undefined,
      medicineImage: medicineImage || undefined,
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

  const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => (
    <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input {...props} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700" />
    </div>
  );

  const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string, children: React.ReactNode}> = ({label, children, ...props}) => (
    <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <select {...props} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
            {children}
        </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold p-6 border-b border-gray-200 dark:border-gray-700">Add New Medicine for {profile.name}</h2>
        <div className="p-6 space-y-6 overflow-y-auto">
          
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-primary-600 dark:text-primary-400">Medicine Details</legend>
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2"><FormInput label="Medicine Name *" type="text" placeholder="e.g., Ibuprofen" value={name} onChange={e => setName(e.target.value)} /></div>
                <div><FormInput label="Dose *" type="text" placeholder="e.g., 200mg" value={dose} onChange={e => setDose(e.target.value)} /></div>
            </div>
            <FormInput label="Doctor's Name (Optional)" type="text" placeholder="e.g., Dr. Smith" value={doctorName} onChange={e => setDoctorName(e.target.value)} />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-primary-600 dark:text-primary-400">Schedule & Instructions</legend>
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Course Duration (days) *" type="number" placeholder="e.g., 7" value={courseDays} onChange={e => setCourseDays(parseInt(e.target.value))} />
                <FormSelect label="Instructions *" value={instructions} onChange={e => setInstructions(e.target.value as Instruction)}>
                    {Object.values(Instruction).map(val => <option key={val} value={val}>{val}</option>)}
                </FormSelect>
            </div>
             <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Instructions (if any)</label>
                <textarea placeholder="e.g., Dissolve in a glass of warm water." value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} rows={2} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Frequency *</label>
              <div className="flex space-x-2 mt-1">
                  <select value={frequencyType} onChange={e => setFrequencyType(e.target.value as FrequencyType)} className="w-1/2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                       {Object.values(FrequencyType).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                  <input type="number" placeholder={frequencyType === FrequencyType.TIMES_A_DAY ? "e.g., 3" : "e.g., 8"} value={frequencyValue} onChange={e => setFrequencyValue(parseInt(e.target.value))} className="w-1/2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700" />
              </div>
              { instructions === Instruction.BEFORE_SLEEP && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Frequency is ignored for 'Before Sleep' instructions.</p>}
            </div>
          </fieldset>
         
          <fieldset>
             <legend className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">Attachments</legend>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { type: 'medicine', title: 'Medicine Image', file: medicineImage, ref: medicineFileInputRef, handler: (e: ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'medicine') },
                { type: 'prescription', title: 'Prescription Image', file: prescriptionImage, ref: prescriptionFileInputRef, handler: (e: ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'prescription') }
              ].map(item => (
                <div key={item.type}>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.title}</label>
                  <div className="mt-1 p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center h-32 bg-gray-50 dark:bg-gray-700/50">
                    {item.file ? <img src={item.file} alt={item.title} className="max-h-20 rounded-md object-contain" /> : <p className="text-gray-500 text-xs text-center">No image uploaded</p>}
                    <button onClick={() => item.ref.current?.click()} className="mt-2 text-sm text-primary-600 hover:underline">Upload Image</button>
                    <input type="file" ref={item.ref} onChange={item.handler} accept="image/*" className="hidden" />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

        </div>
        <div className="p-4 flex justify-end space-x-2 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white font-bold rounded-md hover:bg-primary-700">Save Medicine</button>
        </div>
      </div>
    </div>
  );
};

export default AddMedicineModal;
