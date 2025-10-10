
export interface Profile {
  id: string;
  name: string;
  picture: string; // base64 encoded image
  wakeTime: string; // HH:mm format
  sleepTime: string; // HH:mm format
}

export interface Medicine {
  id: string;
  profileId: string;
  name: string;
  dose: string;
  courseDays: number;
  instructions: Instruction;
  frequencyType: FrequencyType;
  frequencyValue: number; // e.g., 3 for "3 times a day", 8 for "every 8 hours"
  prescriptionImage: string | null; // base64 encoded image
  startDate: string; // ISO string
  doctorName?: string;
}

export interface Schedule {
  id: string;
  medicineId: string;
  profileId: string;
  scheduledTime: string; // ISO string
  status: DoseStatus;
  actualTakenTime: string | null; // ISO string
  profileName?: string;
}

export enum DoseStatus {
  PENDING = 'pending',
  TAKEN = 'taken',
  SKIPPED = 'skipped',
  OVERDUE = 'overdue',
}

export enum Instruction {
  BEFORE_FOOD = 'Before Food',
  AFTER_FOOD = 'After Food',
  BEFORE_SLEEP = 'Before Sleep',
  WITH_FOOD = 'With Food',
  EMPTY_STOMACH = 'Empty Stomach'
}

export enum FrequencyType {
  TIMES_A_DAY = 'Times a day',
  EVERY_X_HOURS = 'Every X hours',
}

export enum View {
  DASHBOARD = 'dashboard',
  HISTORY = 'history',
}
