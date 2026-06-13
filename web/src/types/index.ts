export type UserRole = "admin" | "driver" | "mechanic" | "owner";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  assignedVehicleId?: string;
  createdAt: string;
}

export type ReminderType = "oil_change" | "tire_rotation" | "brake_check" | "inspection" | "battery" | "other";
export type ReminderStatus = "upcoming" | "overdue" | "completed";

export interface ServiceReminder {
  reminderId: string;
  vehicleId: string;
  title: string;
  type: ReminderType;
  dueDate: string;
  status: ReminderStatus;
  completedAt?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ServiceRecord {
  recordId: string;
  vehicleId: string;
  title: string;
  description?: string;
  serviceDate: string;
  cost?: number;
  odometer?: number;
  provider?: string;
  loggedBy: string;
  createdAt: string;
}

export type VehicleStatus = "active" | "maintenance" | "idle" | "retired";
export type VehicleType = "car" | "truck" | "bike" | "van" | "other";

export interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  type: VehicleType;
  status: VehicleStatus;
  ownerId: string;
  assignedDriverId?: string;
  createdAt: string;
}

export type JobStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type JobPriority = "low" | "medium" | "high" | "critical";

export interface MaintenanceJob {
  priority?: JobPriority;
  jobId: string;
  vehicleId: string;
  assignedMechanicId?: string;
  title: string;
  description: string;
  status: JobStatus;
  scheduledAt: string;
  completedAt?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type TripStatus = "active" | "ended";

export interface Trip {
  tripId: string;
  vehicleId: string;
  driverId: string;
  status: TripStatus;
  startedAt: string;
  endedAt?: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
}

export type NotificationType = "job_status" | "vehicle_status";

export interface AppNotification {
  notificationId: string;
  /** specific user UID, or "admin_broadcast" for all admins */
  recipientUid: string;
  type: NotificationType;
  title: string;
  message: string;
  jobId?: string;
  vehicleId?: string;
  vehicleName?: string;
  oldStatus?: string;
  newStatus?: string;
  read: boolean;
  createdAt: string;
}

export interface LiveLocation {
  lat: number;
  lng: number;
  driverId: string;
  vehicleId: string;
  timestamp: number;
  tripId?: string;
}
