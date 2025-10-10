
import React, { useEffect, useState, useMemo } from 'react';
import { Schedule, DoseStatus } from '../types';
import { db } from '../services/db';

interface AlarmBannerProps {
  schedule: Schedule;
  onUpdate: (scheduleId: string, status: DoseStatus.TAKEN | DoseStatus.SKIPPED) => void;
}

const AlarmBanner: React.FC<AlarmBannerProps> = ({ schedule, onUpdate }) => {
    const [medicineName, setMedicineName] = useState('Loading...');

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
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 pitch
                gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 1);

            } catch (error) {
                console.error("Could not play sound:", error);
            }
        };

        const getMedicineName = async () => {
             const medicine = await db.medicines.get(schedule.medicineId);
             setMedicineName(medicine?.name || 'Unknown Medicine');
        };
        getMedicineName();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schedule.id]);

  return (
    <div className="bg-red-500 text-white p-4 rounded-lg shadow-2xl animate-pulse">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="font-bold text-lg">Time for your medication!</h3>
                <p>{schedule.profileName}: Take {medicineName} now.</p>
            </div>
            <div className="flex space-x-2">
                 <button onClick={() => onUpdate(schedule.id, DoseStatus.SKIPPED)} className="px-3 py-1 bg-white/20 hover:bg-white/40 rounded-md text-sm">Skip</button>
                 <button onClick={() => onUpdate(schedule.id, DoseStatus.TAKEN)} className="px-3 py-1 bg-white text-red-500 font-bold rounded-md hover:bg-gray-200 text-sm">Take</button>
            </div>
        </div>
    </div>
  );
};

export default AlarmBanner;
   