import { useState, useEffect } from "react";
import {
  collection, onSnapshot, updateDoc, deleteDoc,
  doc, query, where, setDoc, FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle, MaintenanceJob, AppUser, Trip, ServiceReminder, ServiceRecord } from "@/types";

export function useVehicles(ownerId?: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const q = ownerId
      ? query(collection(db, "vehicles"), where("ownerId", "==", ownerId))
      : collection(db, "vehicles");

    const unsub = onSnapshot(
      q,
      (snap) => {
        setVehicles(snap.docs.map((d) => d.data() as Vehicle));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error("useVehicles:", err.code, err.message);
        setError("Failed to load vehicles. Check your connection.");
        setLoading(false);
      }
    );
    return unsub;
  }, [ownerId]);

  const updateVehicle = async (vehicleId: string, data: Partial<Vehicle>) => {
    await updateDoc(doc(db, "vehicles", vehicleId), data);
  };

  const deleteVehicle = async (vehicleId: string) => {
    await deleteDoc(doc(db, "vehicles", vehicleId));
  };

  return { vehicles, loading, error, updateVehicle, deleteVehicle };
}

export function useJobs(mechanicId?: string, vehicleId?: string, vehicleIds?: string[]) {
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    let q;
    if (mechanicId) {
      q = query(collection(db, "jobs"), where("assignedMechanicId", "==", mechanicId));
    } else if (vehicleId) {
      q = query(collection(db, "jobs"), where("vehicleId", "==", vehicleId));
    } else if (vehicleIds) {
      if (vehicleIds.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }
      q = query(collection(db, "jobs"), where("vehicleId", "in", vehicleIds.slice(0, 10)));
    } else {
      q = collection(db, "jobs");
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        setJobs(snap.docs.map((d) => d.data() as MaintenanceJob));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error("useJobs:", err.code, err.message);
        setError("Failed to load jobs. Check your connection.");
        setLoading(false);
      }
    );
    return unsub;
  }, [mechanicId, vehicleId, JSON.stringify(vehicleIds)]);

  const addJob = async (data: Omit<MaintenanceJob, "jobId" | "createdAt">) => {
    const ref = doc(collection(db, "jobs"));
    await setDoc(ref, { ...data, jobId: ref.id, createdAt: new Date().toISOString() });
  };

  const updateJob = async (jobId: string, data: Partial<MaintenanceJob>) => {
    await updateDoc(doc(db, "jobs", jobId), data);
  };

  return { jobs, loading, error, addJob, updateJob };
}

export function useUsers(role?: string) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const q = role
      ? query(collection(db, "users"), where("role", "==", role))
      : collection(db, "users");

    const unsub = onSnapshot(
      q,
      (snap) => {
        setUsers(snap.docs.map((d) => d.data() as AppUser));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error("useUsers:", err.code, err.message);
        setError("Failed to load users. Check your connection.");
        setLoading(false);
      }
    );
    return unsub;
  }, [role]);

  return { users, loading, error };
}

export function useTrips(driverId?: string) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const q = driverId
      ? query(collection(db, "trips"), where("driverId", "==", driverId))
      : collection(db, "trips");

    const unsub = onSnapshot(
      q,
      (snap) => {
        setTrips(snap.docs.map((d) => d.data() as Trip));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error("useTrips:", err.code, err.message);
        setError("Failed to load trips. Check your connection.");
        setLoading(false);
      }
    );
    return unsub;
  }, [driverId]);

  const startTrip = async (vehicleId: string, driverId: string, lat: number, lng: number) => {
    const ref = doc(collection(db, "trips"));
    const trip: Trip = {
      tripId: ref.id,
      vehicleId,
      driverId,
      status: "active",
      startedAt: new Date().toISOString(),
      startLat: lat,
      startLng: lng,
    };
    await setDoc(ref, trip);
    return ref.id;
  };

  const endTrip = async (tripId: string, endLat?: number, endLng?: number) => {
    await updateDoc(doc(db, "trips", tripId), {
      status: "ended",
      endedAt: new Date().toISOString(),
      ...(endLat !== undefined && endLng !== undefined ? { endLat, endLng } : {}),
    });
  };

  return { trips, loading, error, startTrip, endTrip };
}

export function useServiceReminders(vehicleId?: string) {
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = vehicleId
      ? query(collection(db, "serviceReminders"), where("vehicleId", "==", vehicleId))
      : collection(db, "serviceReminders");
    const unsub = onSnapshot(q, snap => {
      setReminders(snap.docs.map(d => d.data() as ServiceReminder));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [vehicleId]);

  const addReminder = async (data: Omit<ServiceReminder, "reminderId" | "createdAt">) => {
    const ref = doc(collection(db, "serviceReminders"));
    await setDoc(ref, { ...data, reminderId: ref.id, createdAt: new Date().toISOString() });
  };

  const updateReminder = async (reminderId: string, data: Partial<ServiceReminder>) => {
    await updateDoc(doc(db, "serviceReminders", reminderId), data);
  };

  return { reminders, loading, addReminder, updateReminder };
}

export function useServiceRecords(vehicleId?: string) {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = vehicleId
      ? query(collection(db, "serviceRecords"), where("vehicleId", "==", vehicleId))
      : collection(db, "serviceRecords");
    const unsub = onSnapshot(q, snap => {
      setRecords(snap.docs.map(d => d.data() as ServiceRecord));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [vehicleId]);

  const addRecord = async (data: Omit<ServiceRecord, "recordId" | "createdAt">) => {
    const ref = doc(collection(db, "serviceRecords"));
    await setDoc(ref, { ...data, recordId: ref.id, createdAt: new Date().toISOString() });
  };

  return { records, loading, addRecord };
}
