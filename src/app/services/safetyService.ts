import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  AlertDocument,
  LocationHistoryDocument,
  LocationDocument,
  NotificationDocument,
  StudentDocument
} from '../types/firestore';

export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export async function updateStudentLocation(
  studentUid: string,
  studentName: string,
  registrationNumber: string,
  lat: number,
  lng: number
): Promise<void> {
  const timestamp = new Date().toLocaleString();
  const googleMapsUrl = buildGoogleMapsUrl(lat, lng);

  // 1. Update student document's lastLocation
  try {
    const studentRef = doc(db, 'students', studentUid);
    await updateDoc(studentRef, {
      lastLocation: { lat, lng, timestamp }
    }).catch(async () => {
      await setDoc(studentRef, { lastLocation: { lat, lng, timestamp } }, { merge: true });
    });
  } catch (e) {
    console.error('[safetyService] update student lastLocation failed', e);
  }

  // 2. Set current position in 'locations' collection
  try {
    const locationDoc: Omit<LocationDocument, 'id'> = {
      studentId: studentUid,
      latitude: lat,
      longitude: lng,
      googleMapsUrl,
      timestamp,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'locations', studentUid), locationDoc, { merge: true });
  } catch (e) {
    console.error('[safetyService] update locations doc failed', e);
  }

  // 3. Add point to 'locationHistory' collection
  try {
    const historyDoc: Omit<LocationHistoryDocument, 'id'> = {
      studentId: studentUid,
      studentName: studentName || 'Student',
      registrationNumber: registrationNumber || '',
      latitude: lat,
      longitude: lng,
      googleMapsUrl,
      timestamp,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'locationHistory'), historyDoc);
  } catch (e) {
    console.error('[safetyService] append locationHistory failed', e);
  }
}

export async function triggerStudentSOS(
  student: StudentDocument,
  coords: { lat: number; lng: number }
): Promise<string> {
  const timestamp = new Date().toLocaleString();
  const studentUid = student.uid || student.id;
  const studentName = student.name || student.studentName || 'Student';
  const regNumber = student.registrationNumber || '';
  const parentId = student.parentId || student.parentUid || '';
  const parentName = student.parentName || '';
  const googleMapsUrl = buildGoogleMapsUrl(coords.lat, coords.lng);

  const alertData: Omit<AlertDocument, 'id'> = {
    studentId: studentUid,
    studentName,
    registrationNumber: regNumber,
    parentId,
    parentName,
    type: 'emergency',
    message: `SOS Emergency Alert: ${studentName} (${regNumber || 'Student'}) triggered an SOS emergency at campus!`,
    latitude: coords.lat,
    longitude: coords.lng,
    location: { lat: coords.lat, lng: coords.lng },
    googleMapsUrl,
    status: 'active',
    timestamp
  };

  // 1. Create alert in 'alerts' collection
  const alertRef = await addDoc(collection(db, 'alerts'), {
    ...alertData,
    createdAt: serverTimestamp()
  });

  // 2. Also mirror to 'sosAlerts' collection
  try {
    await setDoc(doc(db, 'sosAlerts', alertRef.id), {
      ...alertData,
      id: alertRef.id,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('[safetyService] mirror to sosAlerts error', e);
  }

  // 3. Update student emergencyStatus to active
  try {
    await updateDoc(doc(db, 'students', studentUid), {
      emergencyStatus: 'active',
      lastLocation: { lat: coords.lat, lng: coords.lng, timestamp }
    });
  } catch (e) {
    console.error('[safetyService] update student emergencyStatus error', e);
  }

  // 4. Also record to location history
  try {
    await addDoc(collection(db, 'locationHistory'), {
      studentId: studentUid,
      studentName,
      registrationNumber: regNumber,
      latitude: coords.lat,
      longitude: coords.lng,
      googleMapsUrl,
      timestamp,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.error('[safetyService] locationHistory add error', e);
  }

  // 5. Send notification to linked Parent
  if (parentId) {
    try {
      const parentNotification: Omit<NotificationDocument, 'id'> = {
        recipientId: parentId,
        studentId: studentUid,
        studentName,
        registrationNumber: regNumber,
        type: 'sos',
        title: 'EMERGENCY SOS ALERT!',
        message: `Your child ${studentName} (${regNumber}) has triggered an SOS alert! Current location is recorded.`,
        timestamp,
        read: false,
        googleMapsUrl,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'notifications'), parentNotification);
    } catch (e) {
      console.error('[safetyService] parent notification error', e);
    }
  }

  // 6. Send notification to Admin
  try {
    const adminNotification: Omit<NotificationDocument, 'id'> = {
      recipientId: 'admin',
      studentId: studentUid,
      studentName,
      registrationNumber: regNumber,
      type: 'sos',
      title: 'CAMPUS EMERGENCY SOS',
      message: `${studentName} (${regNumber}) triggered an active SOS emergency! Immediate response required.`,
      timestamp,
      read: false,
      googleMapsUrl,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'notifications'), adminNotification);
  } catch (e) {
    console.error('[safetyService] admin notification error', e);
  }

  return alertRef.id;
}

export async function resolveSOSAlert(
  alertId: string,
  studentId?: string,
  resolvedByName: string = 'Campus Security'
): Promise<void> {
  const timestamp = new Date().toLocaleString();

  // 1. Update in 'alerts' collection
  try {
    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, {
      status: 'resolved',
      resolvedAt: timestamp,
      resolvedBy: resolvedByName
    });
  } catch (e) {
    console.error('[safetyService] resolve alerts doc error', e);
  }

  // 2. Update in 'sosAlerts' collection
  try {
    const sosRef = doc(db, 'sosAlerts', alertId);
    await updateDoc(sosRef, {
      status: 'resolved',
      resolvedAt: timestamp,
      resolvedBy: resolvedByName
    });
  } catch (e) {
    console.warn('[safetyService] resolve sosAlerts doc error', e);
  }

  // 3. Reset student emergency status
  if (studentId) {
    try {
      await updateDoc(doc(db, 'students', studentId), {
        emergencyStatus: 'inactive'
      });
    } catch (e) {
      console.error('[safetyService] reset student emergencyStatus error', e);
    }
  }
}

export function subscribeStudentLocationHistory(
  studentId: string,
  onUpdate: (history: LocationHistoryDocument[]) => void
) {
  const q = query(
    collection(db, 'locationHistory'),
    where('studentId', '==', studentId),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as LocationHistoryDocument[];

      // Sort client-side by timestamp descending to avoid compound index requirements
      items.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      onUpdate(items);
    },
    (err) => {
      console.error('[safetyService] subscribeStudentLocationHistory error', err);
      onUpdate([]);
    }
  );
}

export function subscribeNotifications(
  recipientId: string,
  onUpdate: (notifications: NotificationDocument[]) => void
) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', 'in', [recipientId, 'all'])
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as NotificationDocument[];

      items.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      onUpdate(items);
    },
    (err) => {
      console.error('[safetyService] subscribeNotifications error', err);
      onUpdate([]);
    }
  );
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (e) {
    console.error('[safetyService] markNotificationAsRead error', e);
  }
}

export async function markAllNotificationsAsRead(recipientId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', 'in', [recipientId, 'all']),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    const updates = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
    await Promise.all(updates);
  } catch (e) {
    console.error('[safetyService] markAllNotificationsAsRead error', e);
  }
}
