import { useEffect, useState } from "react";
import {
  collection, query, where, orderBy, onSnapshot, limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppNotification, UserRole } from "@/types";
import { markNotificationRead, markAllRead } from "@/lib/notifications";

export function useNotifications(uid: string | undefined, role: UserRole | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!uid || !role) return;

    const col = collection(db, "notifications");
    let q;

    if (role === "admin") {
      q = query(
        col,
        where("recipientUid", "in", [uid, "admin_broadcast"]),
        orderBy("createdAt", "desc"),
        limit(50),
      );
    } else {
      q = query(
        col,
        where("recipientUid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(50),
      );
    }

    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => d.data() as AppNotification));
    });

    return unsub;
  }, [uid, role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (notificationId: string) => markNotificationRead(notificationId);
  const markAllAsRead = () =>
    markAllRead(notifications.filter(n => !n.read).map(n => n.notificationId));

  return { notifications, unreadCount, markRead, markAllAsRead };
}
