import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  addDoc
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
  const now = new Date().toLocaleString();
  const karachi = { lat: 24.8607, lng: 67.0011 };

  // 1. Seed Devices
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

  // 2. Seed Student
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

  const studentData = {
    uid: studentUid,
    studentId: studentUid,
    name: 'Ali Khan',
    registrationNumber: 'SC-2026-001',
    phone: '+923001234567',
    address: 'Main Campus Hostel Block B, Karachi',
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
  };

  await setDoc(doc(db, 'students', studentUid), studentData, { merge: true });
  details.push(`students/${studentUid}`);

  await setDoc(
    doc(db, 'userStatus', studentUid),
    {
      status: 'active',
      isOnline: true,
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

  // 3. Seed Parent
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

  await setDoc(
    doc(db, 'parents', parentUid),
    {
      uid: parentUid,
      name: 'Amir Khan',
      parentName: 'Amir Khan',
      email: DEMO_CREDENTIALS.parent.email,
      phone: '+923009876543',
      contactNumber: '+923009876543',
      address: 'Gulshan-e-Iqbal Block 6, Karachi',
      cnic: '42101-1234567-1',
      linkedStudentId: studentUid,
      studentId: studentUid,
      studentName: 'Ali Khan',
      children: [studentUid],
      createdAt: now
    },
    { merge: true }
  );
  details.push(`parents/${parentUid}`);

  // Link student to parent
  await setDoc(
    doc(db, 'students', studentUid),
    { parentId: parentUid, parentUid: parentUid, parentName: 'Amir Khan' },
    { merge: true }
  );

  await setDoc(
    doc(db, 'userStatus', parentUid),
    {
      status: 'active',
      isOnline: true,
      lastActive: serverTimestamp(),
      role: 'parent'
    },
    { merge: true }
  );
  details.push(`userStatus/${parentUid}`);

  // 4. Seed Location History
  const historyPoints = [
    { offsetLat: 0.0, offsetLng: 0.0, label: 'Campus Library' },
    { offsetLat: 0.003, offsetLng: 0.002, label: 'Science Complex' },
    { offsetLat: 0.005, offsetLng: -0.003, label: 'Sports Arena' }
  ];

  for (const p of historyPoints) {
    const pLat = karachi.lat + p.offsetLat;
    const pLng = karachi.lng + p.offsetLng;
    await addDoc(collection(db, 'locationHistory'), {
      studentId: studentUid,
      studentName: 'Ali Khan',
      registrationNumber: 'SC-2026-001',
      latitude: pLat,
      longitude: pLng,
      googleMapsUrl: `https://www.google.com/maps?q=${pLat},${pLng}`,
      timestamp: now,
      createdAt: serverTimestamp()
    });
  }
  details.push('locationHistory (3 points)');

  // 5. Seed Alert
  const alertId = 'demo-alert-001';
  const alertLat = karachi.lat + 0.002;
  const alertLng = karachi.lng + 0.002;
  const alertMapsUrl = `https://www.google.com/maps?q=${alertLat},${alertLng}`;

  await setDoc(
    doc(db, 'alerts', alertId),
    {
      studentId: studentUid,
      studentName: 'Ali Khan',
      registrationNumber: 'SC-2026-001',
      parentId: parentUid,
      parentName: 'Amir Khan',
      type: 'emergency',
      message: 'Demo emergency alert — safe to test and resolve',
      status: 'active',
      timestamp: now,
      latitude: alertLat,
      longitude: alertLng,
      location: { lat: alertLat, lng: alertLng },
      googleMapsUrl: alertMapsUrl
    },
    { merge: true }
  );
  details.push(`alerts/${alertId}`);

  // 6. Seed Notifications
  await addDoc(collection(db, 'notifications'), {
    recipientId: parentUid,
    studentId: studentUid,
    studentName: 'Ali Khan',
    registrationNumber: 'SC-2026-001',
    type: 'sos',
    title: 'EMERGENCY SOS ALERT!',
    message: 'Ali Khan (SC-2026-001) triggered a safety emergency beacon.',
    timestamp: now,
    read: false,
    googleMapsUrl: alertMapsUrl,
    createdAt: serverTimestamp()
  });

  await addDoc(collection(db, 'notifications'), {
    recipientId: 'admin',
    studentId: studentUid,
    studentName: 'Ali Khan',
    registrationNumber: 'SC-2026-001',
    type: 'sos',
    title: 'CAMPUS EMERGENCY SOS',
    message: 'Ali Khan (SC-2026-001) activated an emergency alarm!',
    timestamp: now,
    read: false,
    googleMapsUrl: alertMapsUrl,
    createdAt: serverTimestamp()
  });
  details.push('notifications (parent & admin)');

  await setDoc(
    doc(db, 'config', 'app'),
    {
      seedVersion: 2,
      seededAt: serverTimestamp(),
      demoStudentUid: studentUid,
      demoParentUid: parentUid
    },
    { merge: true }
  );
  details.push('config/app');

  return {
    ok: true,
    message: 'Firestore collections, demo data, and notifications created successfully.',
    details,
    credentials: DEMO_CREDENTIALS
  };
}
