import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  signInWithCredential, GoogleAuthProvider, signOut, User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AppUser, UserRole } from "@/types";

export interface GoogleSignInResult {
  needsProfile: boolean;
  uid: string;
  displayName: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogleCredential: (idToken: string) => Promise<GoogleSignInResult>;
  completeGoogleProfile: (uid: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 10000);
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          setAppUser(snap.exists() ? (snap.data() as AppUser) : null);
        } catch {
          setAppUser(null);
        }
      } else {
        setUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginWithGoogleCredential = async (idToken: string): Promise<GoogleSignInResult> => {
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result     = await signInWithCredential(auth, credential);
      const snap       = await getDoc(doc(db, "users", result.user.uid));
      if (snap.exists()) {
        setAppUser(snap.data() as AppUser);
        setLoading(false);
        return { needsProfile: false, uid: result.user.uid, displayName: result.user.displayName, email: result.user.email };
      }
      // New Google user — caller must show role-picker, then call completeGoogleProfile
      setLoading(false);
      return { needsProfile: true, uid: result.user.uid, displayName: result.user.displayName, email: result.user.email };
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const completeGoogleProfile = async (uid: string, name: string, role: UserRole) => {
    setLoading(true);
    try {
      const newUser: AppUser = {
        uid, name,
        email: auth.currentUser?.email ?? "",
        role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", uid), newUser);
      setAppUser(newUser);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, login, loginWithGoogleCredential, completeGoogleProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
