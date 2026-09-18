import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
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
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function setUserOnline(uid: string, role: string) {
  await setDoc(
    doc(db, 'userStatus', uid),
    {
      status: 'active',
      isOnline: true,
      lastActive: serverTimestamp(),
      lastLogin: serverTimestamp(),
      role
    },
    { merge: true }
  );
}

async function setUserOffline(uid: string) {
  await setDoc(
    doc(db, 'userStatus', uid),
    {
      status: 'inactive',
      isOnline: false,
      lastActive: serverTimestamp()
    },
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

    let heartbeatInterval: any = null;
    let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (!firebaseUser) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
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
      await setUserOnline(firebaseUser.uid, profile.role).catch(() => {});

      // Heartbeat interval every 60 seconds while session is open
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        setUserOnline(firebaseUser.uid, profile.role).catch(() => {});
      }, 60000);

      // Before unload to set inactive
      beforeUnloadHandler = () => {
        setUserOffline(firebaseUser.uid).catch(() => {});
      };
      window.addEventListener('beforeunload', beforeUnloadHandler);

      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (beforeUnloadHandler) window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await loadUserProfile(credential.user);
      if (!profile) {
        throw new Error('User profile not found in Firestore.');
      }
      await setUserOnline(credential.user.uid, profile.role);
      setUser(profile);
      return profile;
    } catch (error: any) {
      // Auto-create demo accounts if they don't exist
      if (
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password'
      ) {
        const isDemoAdmin = email === 'admin@demo.com' && password === 'admin123';
        const isDemoStudent = email === 'student@demo.com' && password === 'student123';
        const isDemoParent = email === 'parent@demo.com' && password === 'parent123';
        
        if (isDemoAdmin || isDemoStudent || isDemoParent) {
          console.log('[Auth] Auto-creating missing demo account for', email);
          try {
            const role = isDemoAdmin ? 'admin' : isDemoStudent ? 'student' : 'parent';
            const name = role.charAt(0).toUpperCase() + role.slice(1) + ' Demo';
            
            // Try to create the demo user directly
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            
            const baseProfile: any = {
              uid: credential.user.uid,
              name,
              email,
              role,
              status: 'active',
              createdAt: serverTimestamp()
            };
            
            await setDoc(doc(db, 'users', credential.user.uid), baseProfile);
            await setUserOnline(credential.user.uid, role);
            
            const profile = { id: credential.user.uid, ...baseProfile, createdAt: new Date() };
            setUser(profile as UserProfile);
            return profile as UserProfile;
          } catch (createError) {
             console.error('[Auth] Failed to auto-create demo user:', createError);
             throw error; // Throw original login error if creation fails
          }
        }
      }
      throw error;
    }
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

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
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
    <AuthContext.Provider value={{ user, loading, login, signup, resetPassword, logout }}>
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
