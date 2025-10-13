import React, { useEffect, useState } from 'react';
import { Schedule, DoseStatus, Medicine } from '../types';
import { db } from '../services/db';

interface AlarmBannerProps {
  schedule: Schedule;
  onUpdate: (scheduleId: string, status: DoseStatus.TAKEN | DoseStatus.SKIPPED) => void;
}

const AlarmBanner: React.FC<AlarmBannerProps> = ({ schedule, onUpdate }) => {
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let audioContext: AudioContext | null = null;
        let oscillator: OscillatorNode | null = null;
        
        const playSound = () => {
            try {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 1);

            } catch (error) {
                console.error("Could not play sound:", error);
            }
        };

        const getMedicine = async () => {
             const med = await db.medicines.get(schedule.medicineId);
             setMedicine(med);
        };
        getMedicine();
        playSound();
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        const interval = setInterval(playSound, 5000);

        return () => {
             clearInterval(interval);
             if (oscillator) {
                oscillator.stop();
             }
             if (audioContext && audioContext.state !== 'closed') {
                audioContext.close();
             }
        }
    }, [schedule.id, schedule.medicineId]);
    
    const handleCopyToClipboard = () => {
        if (!medicine) return;
        
        const time = new Date(schedule.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let message = `Reminder for ${schedule.profileName}:\n`;
        message += `- Medicine: ${medicine.name}\n`;
        message += `- Dose: ${medicine.dose}\n`;
        message += `- Time: ${time}\n`;
        message += `- Instruction: ${medicine.instructions}\n`;
        if (medicine.customInstructions) {
            message += `- Usage: ${medicine.customInstructions}`;
        }

        navigator.clipboard.writeText(message).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (!medicine) {
        return null; // Or a loading state
    }

  return (
    <div className="bg-red-500 text-white p-4 rounded-lg shadow-2xl animate-pulse max-w-2xl mx-auto">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-lg">Time for your medication!</h3>
                <p>{schedule.profileName}: Take {medicine.name} ({medicine.dose}) now.</p>
            </div>
            <div className="flex space-x-2 flex-shrink-0 ml-2">
                 <button onClick={() => onUpdate(schedule.id, DoseStatus.SKIPPED)} className="px-3 py-1 bg-white/20 hover:bg-white/40 rounded-md text-sm">Skip</button>
                 <button onClick={() => onUpdate(schedule.id, DoseStatus.TAKEN)} className="px-3 py-1 bg-white text-red-500 font-bold rounded-md hover:bg-gray-200 text-sm">Take</button>
            </div>
        </div>
        <div className="mt-2 text-right">
             <button onClick={handleCopyToClipboard} className="px-3 py-1 bg-white/20 hover:bg-white/40 rounded-md text-sm">
                {copied ? 'Copied!' : 'Copy Reminder'}
             </button>
        </div>
    </div>
  );
};

export default AlarmBanner;
