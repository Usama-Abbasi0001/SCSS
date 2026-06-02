import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { db, FIREBASE_API_KEY } from '../../config/firebase';
import { createAuthUserWithoutLogin } from './adminAuth';

export const DEMO_CREDENTIALS = {
  student: {
    email: 'student+esp32-001@smartcampus.local',
    password: 'DemoStudent123!'
  },
  parent: {
    email: 'parent.demo@smartcampus.local',
    password: 'DemoParent123!'
  }
} as const;

export interface SeedResult {
  ok: boolean;
  message: string;
  details: string[];
  credentials?: typeof DEMO_CREDENTIALS;
}

async function findUidByEmail(email: string): Promise<string | null> {
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return (data.uid as string) || snap.docs[0].id;
}

async function ensureAuthUser(email: string, password: string): Promise<string> {
  try {
    const created = await createAuthUserWithoutLogin(FIREBASE_API_KEY, email, password);
    return created.localId as string;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('EMAIL_EXISTS')) {
      const existing = await findUidByEmail(email);
      if (existing) return existing;
    }
    throw err;
  }
}

export async function seedFirestoreDatabase(): Promise<SeedResult> {
  const details: string[] = [];
  const now = new Date().toISOString();
  const karachi = { lat: 24.8607, lng: 67.0011 };

  const deviceIds = ['ESP32-001', 'ESP32-002', 'ESP32-003'];
  for (const deviceId of deviceIds) {
    await setDoc(
      doc(db, 'devices', deviceId),
      {
        name: `Campus Tracker ${deviceId}`,
        status: 'active',
        assignedTo: deviceId === 'ESP32-001' ? '' : ''
      },
      { merge: true }
    );
    details.push(`devices/${deviceId}`);
  }

  const studentUid = await ensureAuthUser(
    DEMO_CREDENTIALS.student.email,
    DEMO_CREDENTIALS.student.password
  );

  await setDoc(
    doc(db, 'users', studentUid),
    {
      uid: studentUid,
      name: 'Ali Khan',
      email: DEMO_CREDENTIALS.student.email,
      role: 'student',
      status: 'active',
      deviceId: 'ESP32-001',
      linkedStudentId: studentUid,
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
  details.push(`users/${studentUid} (student)`);

  await setDoc(
    doc(db, 'students', studentUid),
    {
      uid: studentUid,
      name: 'Ali Khan',
      registrationNumber: 'SC-2026-001',
      phone: '+923001234567',
      address: 'Main Campus, Karachi',
      parentName: 'Amir Khan',
      deviceId: 'ESP32-001',
      email: DEMO_CREDENTIALS.student.email,
      emergencyStatus: 'inactive',
      lastLocation: {
        lat: karachi.lat,
        lng: karachi.lng,
        timestamp: now
      },
      createdAt: now
    },
    { merge: true }
  );
  details.push(`students/${studentUid}`);

  await setDoc(
    doc(db, 'userStatus', studentUid),
    {
      status: 'active',
      lastActive: serverTimestamp(),
      role: 'student'
    },
    { merge: true }
  );
  details.push(`userStatus/${studentUid}`);

  await setDoc(
    doc(db, 'devices', 'ESP32-001'),
    { name: 'Campus Tracker ESP32-001', status: 'active', assignedTo: studentUid },
    { merge: true }
  );

  const parentUid = await ensureAuthUser(
    DEMO_CREDENTIALS.parent.email,
    DEMO_CREDENTIALS.parent.password
  );

  await setDoc(
    doc(db, 'users', parentUid),
    {
      uid: parentUid,
      name: 'Amir Khan',
      email: DEMO_CREDENTIALS.parent.email,
      role: 'parent',
      status: 'active',
      linkedStudentId: studentUid,
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
  details.push(`users/${parentUid} (parent)`);

  const parentDocId = `parent-${parentUid}`;
  await setDoc(
    doc(db, 'parents', parentDocId),
    {
      uid: parentUid,
      name: 'Amir Khan',
      email: DEMO_CREDENTIALS.parent.email,
      phone: '+923009876543',
      address: 'Gulshan, Karachi',
      cnic: '42101-1234567-1',
      linkedStudentId: studentUid,
      children: [studentUid],
      createdAt: now
    },
    { merge: true }
  );
  details.push(`parents/${parentDocId}`);

  await setDoc(
    doc(db, 'students', studentUid),
    { parentId: parentDocId, parentName: 'Amir Khan' },
    { merge: true }
  );

  await setDoc(
    doc(db, 'userStatus', parentUid),
    {
      status: 'inactive',
      lastActive: serverTimestamp(),
      role: 'parent'
    },
    { merge: true }
  );
  details.push(`userStatus/${parentUid}`);

  const alertId = 'demo-alert-001';
  await setDoc(
    doc(db, 'alerts', alertId),
    {
      studentId: studentUid,
      studentName: 'Ali Khan',
      parentName: 'Amir Khan',
      type: 'emergency',
      message: 'Demo emergency alert — safe to resolve or delete',
      status: 'active',
      timestamp: now,
      location: { lat: karachi.lat + 0.01, lng: karachi.lng + 0.01 }
    },
    { merge: true }
  );
  details.push(`alerts/${alertId}`);

  await setDoc(
    doc(db, 'config', 'app'),
    {
      seedVersion: 1,
      seededAt: serverTimestamp(),
      demoStudentUid: studentUid,
      demoParentUid: parentUid
    },
    { merge: true }
  );
  details.push('config/app');

  return {
    ok: true,
    message: 'Firestore collections and demo data created successfully.',
    details,
    credentials: DEMO_CREDENTIALS
  };
}
