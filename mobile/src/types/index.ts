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

// Simplified Job shape used by mobile role screens
export interface Job {
  jobId: string;
  vehicleId: string;
  mechanicId?: string;
  ownerId?: string;
  description?: string;
  type?: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  createdAt?: string;
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
