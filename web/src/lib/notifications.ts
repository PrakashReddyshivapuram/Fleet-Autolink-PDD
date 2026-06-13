import { collection, doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { AppNotification, Vehicle, MaintenanceJob } from "@/types";

async function writeNotification(data: Omit<AppNotification, "notificationId">) {
  const ref = doc(collection(db, "notifications"));
  await setDoc(ref, { ...data, notificationId: ref.id });
}

/**
 * Notify all relevant parties when a maintenance job status changes.
 * Recipients: admin broadcast + vehicle's driver + vehicle's owner + assigned mechanic
 * (excluding the user who made the change)
 */
export async function sendJobStatusNotifications(
  job: MaintenanceJob,
  newStatus: string,
  oldStatus: string,
  vehicle: Vehicle | undefined,
  changedByUid: string,
) {
  if (oldStatus === newStatus) return;

  const vehicleName = vehicle
    ? `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`
    : "vehicle";

  const statusLabel = newStatus.replace(/_/g, " ");
  const title = `Job ${statusLabel}`;
  const message = `"${job.title}" on ${vehicleName} is now ${statusLabel}.`;

  const base: Omit<AppNotification, "notificationId" | "recipientUid"> = {
    type: "job_status",
    title,
    message,
    jobId: job.jobId,
    vehicleId: job.vehicleId,
    vehicleName,
    oldStatus,
    newStatus,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const batch = writeBatch(db);

  // Admin broadcast
  const adminRef = doc(collection(db, "notifications"));
  batch.set(adminRef, { ...base, notificationId: adminRef.id, recipientUid: "admin_broadcast" });

  // Driver assigned to this vehicle
  if (vehicle?.assignedDriverId && vehicle.assignedDriverId !== changedByUid) {
    const driverRef = doc(collection(db, "notifications"));
    batch.set(driverRef, { ...base, notificationId: driverRef.id, recipientUid: vehicle.assignedDriverId });
  }

  // Vehicle owner
  if (vehicle?.ownerId && vehicle.ownerId !== changedByUid) {
    const ownerRef = doc(collection(db, "notifications"));
    batch.set(ownerRef, { ...base, notificationId: ownerRef.id, recipientUid: vehicle.ownerId });
  }

  // Assigned mechanic (if not the one making the change)
  if (job.assignedMechanicId && job.assignedMechanicId !== changedByUid) {
    const mechRef = doc(collection(db, "notifications"));
    batch.set(mechRef, { ...base, notificationId: mechRef.id, recipientUid: job.assignedMechanicId });
  }

  await batch.commit();
}

/**
 * Notify all relevant parties when a vehicle's maintenance status changes.
 * Triggers on ANY status change involving "maintenance" (entering or leaving).
 */
export async function sendVehicleStatusNotifications(
  vehicle: Vehicle,
  newStatus: string,
  oldStatus: string,
  changedByUid: string,
) {
  if (oldStatus === newStatus) return;
  const isEnteringMaintenance = newStatus === "maintenance";
  const isLeavingMaintenance  = oldStatus === "maintenance";
  if (!isEnteringMaintenance && !isLeavingMaintenance) return;

  const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`;
  const title = isEnteringMaintenance
    ? "Vehicle sent to maintenance"
    : "Vehicle back in service";
  const message = isEnteringMaintenance
    ? `${vehicleName} has been moved to maintenance.`
    : `${vehicleName} is now ${newStatus.replace(/_/g, " ")}.`;

  const base: Omit<AppNotification, "notificationId" | "recipientUid"> = {
    type: "vehicle_status",
    title,
    message,
    vehicleId: vehicle.vehicleId,
    vehicleName,
    oldStatus,
    newStatus,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const batch = writeBatch(db);

  // Admin broadcast
  const adminRef = doc(collection(db, "notifications"));
  batch.set(adminRef, { ...base, notificationId: adminRef.id, recipientUid: "admin_broadcast" });

  // Driver
  if (vehicle.assignedDriverId && vehicle.assignedDriverId !== changedByUid) {
    const driverRef = doc(collection(db, "notifications"));
    batch.set(driverRef, { ...base, notificationId: driverRef.id, recipientUid: vehicle.assignedDriverId });
  }

  // Owner
  if (vehicle.ownerId && vehicle.ownerId !== changedByUid) {
    const ownerRef = doc(collection(db, "notifications"));
    batch.set(ownerRef, { ...base, notificationId: ownerRef.id, recipientUid: vehicle.ownerId });
  }

  await batch.commit();
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
}

export async function markAllRead(notificationIds: string[]) {
  const batch = writeBatch(db);
  notificationIds.forEach(id => batch.update(doc(db, "notifications", id), { read: true }));
  await batch.commit();
}
