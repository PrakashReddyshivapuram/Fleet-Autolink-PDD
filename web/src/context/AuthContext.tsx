import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AppUser, UserRole } from "@/types";

interface GoogleSignInResult {
  needsProfile: boolean;
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<GoogleSignInResult>;
  completeGoogleProfile: (uid: string, name: string, role: UserRole, phone?: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole, phone?: string) => Promise<void>;
  updateProfile: (data: Partial<Pick<AppUser, "name" | "phone" | "address">>) => Promise<void>;
  logout: () => Promise<void>;
}

const googleProvider = new GoogleAuthProvider();
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) setAppUser(snap.data() as AppUser);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
        }
      } else {
        setUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async (): Promise<GoogleSignInResult> => {
    const result = await signInWithPopup(auth, googleProvider);
    const snap = await getDoc(doc(db, "users", result.user.uid));
    const base = {
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
    };
    if (snap.exists()) {
      setAppUser(snap.data() as AppUser);
      return { needsProfile: false, ...base };
    }
    return { needsProfile: true, ...base };
  };

  const completeGoogleProfile = async (uid: string, name: string, role: UserRole, phone = "") => {
    const newUser: AppUser = {
      uid, name,
      email: auth.currentUser?.email || "",
      role, phone,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", uid), newUser);
    setAppUser(newUser);
  };

  const register = async (email: string, password: string, name: string, role: UserRole, phone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const newUser: AppUser = {
      uid: cred.user.uid, name, email, role,
      phone: phone || "", createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", cred.user.uid), newUser);
    setAppUser(newUser);
  };

  const updateProfile = async (data: Partial<Pick<AppUser, "name" | "phone" | "address">>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), data);
    setAppUser(prev => prev ? { ...prev, ...data } : prev);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, login, loginWithGoogle, completeGoogleProfile, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
