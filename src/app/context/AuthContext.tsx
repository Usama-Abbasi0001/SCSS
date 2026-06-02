import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'parent' | 'student';
  createdAt?: any;
  linkedStudentId?: string;
  deviceId?: string;
}

interface SignupProfile {
  name: string;
  phone?: string;
  studentId?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (
    email: string,
    password: string,
    role: 'admin' | 'parent' | 'student',
    profile: SignupProfile
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function setUserOnline(uid: string, role: string) {
  await setDoc(
    doc(db, 'userStatus', uid),
    { status: 'active', lastActive: serverTimestamp(), role },
    { merge: true }
  );
}

async function setUserOffline(uid: string) {
  await setDoc(
    doc(db, 'userStatus', uid),
    { status: 'inactive', lastActive: serverTimestamp() },
    { merge: true }
  );
}

async function loadUserProfile(firebaseUser: FirebaseUser | null): Promise<UserProfile | null> {
  if (!firebaseUser) {
    return null;
  }

  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  if (!userDoc.exists()) {
    return null;
  }

  return { id: userDoc.id, uid: userDoc.id, ...(userDoc.data() as Omit<UserProfile, 'uid' | 'id'>) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateStatus = async (uid: string, status: 'active' | 'inactive', role?: string) => {
      try {
        if (status === 'active' && role) {
          await setUserOnline(uid, role);
        } else {
          await setUserOffline(uid);
        }
      } catch (e) {
        console.error('[Auth] updateStatus error', e);
      }
    };

    let visibilityHandler: (() => void) | null = null;
    let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profile = await loadUserProfile(firebaseUser);
      if (!profile) {
        await signOut(auth);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(profile);

      // Mark user as active in Firestore
      updateStatus(firebaseUser.uid, 'active', profile.role);

      // Visibility handler to mark inactive when user leaves page
      visibilityHandler = () => {
        if (document.hidden) {
          updateStatus(firebaseUser.uid, 'inactive', profile.role);
        } else {
          updateStatus(firebaseUser.uid, 'active', profile.role);
        }
      };
      document.addEventListener('visibilitychange', visibilityHandler);

      // Before unload to set inactive
      beforeUnloadHandler = () => {
        // best-effort, may not complete before unload
        updateStatus(firebaseUser.uid, 'inactive', profile.role);
      };
      window.addEventListener('beforeunload', beforeUnloadHandler);

      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
      if (beforeUnloadHandler) window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await loadUserProfile(credential.user);
    if (!profile) {
      throw new Error('User profile not found in Firestore.');
    }
    await setUserOnline(credential.user.uid, profile.role);
    setUser(profile);
    return profile;
  }; 

  const signup = async (
    email: string,
    password: string,
    role: 'admin' | 'parent' | 'student',
    profile: SignupProfile
  ) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    // Build the base profile object required by the app
    const baseProfile: any = {
      uid: credential.user.uid,
      name: profile.name,
      email,
      role,
      status: 'active',
      createdAt: serverTimestamp()
    };

    // Only include linkedStudentId when provided and non-empty
    if ((profile as any).linkedStudentId) {
      baseProfile.linkedStudentId = (profile as any).linkedStudentId;
    }

    // Persist minimal, required user profile to Firestore `users` collection
    await setDoc(doc(db, 'users', credential.user.uid), baseProfile);
    await setUserOnline(credential.user.uid, role);

    // Update local context with the created profile (use client-side Date for createdAt copy)
    setUser({ id: credential.user.uid, uid: credential.user.uid, name: profile.name, email, role, createdAt: new Date(), ...(baseProfile.linkedStudentId ? { linkedStudentId: baseProfile.linkedStudentId } : {}) } as UserProfile);
  };

  const logout = async () => {
    try {
      if (user?.uid) {
        await setUserOffline(user.uid);
      }
    } catch (e) {
      console.error('[Auth] set userStatus inactive failed', e);
    }
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
