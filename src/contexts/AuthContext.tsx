import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface UserData {
  uid: string;
  email: string;
  role: 'admin' | 'student' | 'parent' | 'security';
  name: string;
  phone?: string;
  studentId?: string;
  parentOf?: string[];
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signup: (email: string, password: string, role: string, additionalData: any) => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string, role: string, additionalData: any) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Send email verification
    await sendEmailVerification(userCredential.user);

    // Create user document in Firestore
    const userDoc = {
      uid: userCredential.user.uid,
      email: email,
      role: role,
      name: additionalData.name,
      phone: additionalData.phone || '',
      studentId: role === 'student' ? additionalData.studentId : '',
      parentOf: role === 'parent' ? additionalData.children || [] : [],
      createdAt: new Date().toISOString(),
      emailVerified: false
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
  }

  async function login(email: string, password: string) {
    try {
      console.log('[Auth] login attempt', { email });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('[Auth] login success', { uid: firebaseUser.uid, email: firebaseUser.email });

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const role = email.includes('admin') ? 'admin' : email.includes('student') ? 'student' : 'parent';
        const newUserDoc = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || email,
          role,
          name: email.split('@')[0],
          phone: '',
          studentId: '',
          parentOf: [],
          createdAt: new Date().toISOString(),
          emailVerified: firebaseUser.emailVerified
        };

        await setDoc(userDocRef, newUserDoc);
        console.log('[Auth] created missing user Firestore document', { uid: firebaseUser.uid, role });
      } else {
        console.log('[Auth] loaded existing user Firestore document', { uid: firebaseUser.uid });
      }

      return firebaseUser;
    } catch (error) {
      console.error('[Auth] login failed', error);
      throw error;
    }
  }

  async function logout() {
    await signOut(auth);
    setUserData(null);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth] auth state changed', { uid: user?.uid, email: user?.email });
      setCurrentUser(user);

      if (user) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
          console.log('[Auth] loaded user data', { uid: user.uid, role: (userDoc.data() as UserData).role });
        } else {
          setUserData(null);
          console.warn('[Auth] user authenticated but missing Firestore user document', { uid: user.uid });
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
