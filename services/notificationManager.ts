import { Medicine, Schedule } from '../types';
import { db } from './db';

// This is a hypothetical native bridge provided by the mobile app's WebView wrapper.
// We check for its existence before trying to use it.
const nativeNotifier = window.aistudio?.notifications;

/**
 * Schedules native notifications for all future doses of a given medicine.
 * @param medicine - The medicine object.
 * @param schedules - The array of schedules for this medicine.
 */
export const scheduleNativeNotificationsForMedicine = async (medicine: Medicine, schedules: Schedule[]): Promise<void> => {
  if (!nativeNotifier) {
    console.warn('Native notification API is not available.');
    // Optionally, you could fall back to an alert or another mechanism here.
    return;
  }
  
  const profile = await db.profiles.get(medicine.profileId);
  const profileName = profile?.name || 'A profile';

  for (const schedule of schedules) {
    const scheduleTime = new Date(schedule.scheduledTime);
    // Only schedule notifications for future events.
    if (scheduleTime.getTime() > Date.now()) {
      try {
        await nativeNotifier.schedule({
          id: schedule.id, // Use the unique schedule ID for cancellation.
          title: `Time for ${profileName}'s medication!`,
          body: `Take ${medicine.name} (${medicine.dose})`,
          at: scheduleTime,
        });
      } catch (e) {
        console.error(`Failed to schedule native notification for schedule ${schedule.id}`, e);
      }
    }
  }
};

/**
 * Cancels a single scheduled native notification.
 * @param scheduleId - The unique ID of the schedule to cancel the notification for.
 */
export const cancelNativeNotification = async (scheduleId: string): Promise<void> => {
  if (!nativeNotifier) return;
  try {
    // We cancel even if it might not exist or is in the past, the native layer handles this.
    await nativeNotifier.cancel(scheduleId);
  } catch (e) {
    console.error(`Failed to cancel native notification ${scheduleId}`, e);
  }
};

/**
 * Cancels all scheduled notifications for a specific medicine.
 * Used when a medicine is deleted or a profile is removed.
 * @param medicineId - The ID of the medicine to cancel notifications for.
 */
export const cancelAllNotificationsForMedicine = async (medicineId: string): Promise<void> => {
  if (!nativeNotifier) return;
  try {
    const schedules = await db.schedules.getByMedicineId(medicineId);
    if (schedules.length > 0) {
        const cancelPromises = schedules.map(s => nativeNotifier.cancel(s.id));
        await Promise.all(cancelPromises);
    }
  } catch (e) {
    console.error(`Failed to cancel all notifications for medicine ${medicineId}`, e);
  }
};