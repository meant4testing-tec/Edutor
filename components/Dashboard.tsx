
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Profile, Medicine, Schedule, DoseStatus } from '../types';
import { db } from '../services/db';
import AddMedicineModal from './AddMedicineModal';

interface DashboardProps {
  profile: Profile;
}

const Dashboard: React.FC<DashboardProps> = ({ profile }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const meds = await db.medicines.getByProfileId(profile.id);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const todaySchedules = await db.schedules.getByDateRange(profile.id, today.toISOString(), tomorrow.toISOString());
      
      setMedicines(meds);
      setSchedules(todaySchedules);
    } catch(e) {
        console.error("Failed to fetch dashboard data:", e);
    } finally {
        setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleUpdateSchedule = async (scheduleId: string, status: DoseStatus.TAKEN | DoseStatus.SKIPPED) => {
    const schedule = await db.schedules.get(scheduleId);
    if (schedule) {
      await db.schedules.update({
        ...schedule,
        status,
        actualTakenTime: status === DoseStatus.TAKEN ? new Date().toISOString() : null,
      });
      fetchData(); // Refresh data
    }
  };

  const medicineMap = useMemo(() => new Map(medicines.map(m => [m.id, m])), [medicines]);

  const sortedSchedules = useMemo(() => {
    const now = new Date();
    return schedules
        .map(s => {
            const isOverdue = new Date(s.scheduledTime) < now && s.status === DoseStatus.PENDING;
            return { ...s, status: isOverdue ? DoseStatus.OVERDUE : s.status };
        })
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }, [schedules]);

  const adherence = useMemo(() => {
    const taken = schedules.filter(s => s.status === DoseStatus.TAKEN).length;
    const totalPast = schedules.filter(s => new Date(s.scheduledTime) < new Date() && (s.status === DoseStatus.TAKEN || s.status === DoseStatus.SKIPPED || s.status === DoseStatus.OVERDUE)).length;
    return totalPast > 0 ? Math.round((taken / totalPast) * 100) : 100;
  }, [schedules]);
  
  const ScheduleItem: React.FC<{schedule: Schedule}> = ({ schedule }) => {
      const medicine = medicineMap.get(schedule.medicineId);
      if (!medicine) return null;

      const time = new Date(schedule.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const statusColors = {
          [DoseStatus.PENDING]: 'border-l-blue-500',
          [DoseStatus.TAKEN]: 'border-l-green-500 bg-green-500/10',
          [DoseStatus.SKIPPED]: 'border-l-yellow-500 bg-yellow-500/10',
          [DoseStatus.OVERDUE]: 'border-l-red-500 bg-red-500/10'
      };

      return (
          <div className={`p-4 rounded-lg border-l-4 ${statusColors[schedule.status]} bg-gray-50 dark:bg-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between`}>
              <div>
                  <p className="font-bold text-lg">{medicine.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{medicine.dose} - {medicine.instructions}</p>
                  <p className="text-xl font-light mt-1">{time}</p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-2">
                  {schedule.status === DoseStatus.PENDING || schedule.status === DoseStatus.OVERDUE ? (
                      <>
                          <button onClick={() => handleUpdateSchedule(schedule.id, DoseStatus.SKIPPED)} className="px-4 py-2 rounded-md bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600">Skip</button>
                          <button onClick={() => handleUpdateSchedule(schedule.id, DoseStatus.TAKEN)} className="px-4 py-2 rounded-md bg-green-500 text-white text-sm font-semibold hover:bg-green-600">Take</button>
                      </>
                  ) : (
                      <p className="font-semibold text-lg capitalize">{schedule.status}</p>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Hello, {profile.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">Here's your schedule for today.</p>
        </div>
        <div className="text-right">
            <p className="text-sm text-gray-500">Adherence</p>
            <p className={`text-3xl font-bold ${adherence > 80 ? 'text-green-500' : adherence > 50 ? 'text-yellow-500' : 'text-red-500'}`}>{adherence}%</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-semibold">Today's Doses</h2>
        {loading ? <p>Loading schedule...</p> : sortedSchedules.length > 0 ? (
            sortedSchedules.map(s => <ScheduleItem key={s.id} schedule={s}/>)
        ) : (
            <p className="text-center p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">No medications scheduled for today.</p>
        )}
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full py-3 px-4 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
      >
        + Add New Medicine
      </button>

      {isModalOpen && (
        <AddMedicineModal
          profile={profile}
          onClose={() => setIsModalOpen(false)}
          onSave={fetchData}
        />
      )}
    </div>
  );
};

export default Dashboard;
