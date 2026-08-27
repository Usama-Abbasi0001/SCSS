import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

export interface ParentProfile {
  id: string;
  uid: string;
  name?: string;
  parentName?: string;
  studentId?: string;
  studentName?: string;
  email: string;
  phone?: string;
  contactNumber?: string;
  address?: string;
  area?: string;
  cnic?: string;
  role: 'parent';
  children?: string[];
  linkedStudentId?: string;
  [key: string]: any;
}

export interface StudentProfile {
  id: string;
  uid?: string;
  studentId?: string;
  studentName?: string;
  name?: string;
  registrationNumber?: string;
  phone?: string;
  address?: string;
  grade?: string;
  class?: string;
  parentId?: string;
  parentUid?: string;
  parentName?: string;
  deviceId?: string;
  email?: string;
  emergencyStatus?: string;
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  deviceBattery?: number;
  [key: string]: any;
}

async function loadDocumentById<T>(collectionName: string, id: string): Promise<T | null> {
  try {
    const ref = doc(db, collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return null;
    }
    return { id: snap.id, ...(snap.data() as T) };
  } catch (err) {
    return null;
  }
}

async function loadDocumentByField<T>(collectionName: string, field: string, value: string): Promise<T | null> {
  try {
    const q = query(collection(db, collectionName), where(field, '==', value));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...(docSnap.data() as T) };
  } catch (err) {
    return null;
  }
}

export async function fetchParentProfile(uid: string): Promise<ParentProfile | null> {
  try {
    const docById = await loadDocumentById<ParentProfile>('parents', uid);
    if (docById) {
      return docById;
    }

    const byField = await loadDocumentByField<ParentProfile>('parents', 'uid', uid);
    if (byField) {
      return byField;
    }

    // Fallback: check users collection
    const userDoc = await loadDocumentById<ParentProfile>('users', uid);
    return userDoc;
  } catch (error) {
    console.error('[parentService] fetchParentProfile', error);
    return null;
  }
}

export async function fetchStudentProfile(studentId: string): Promise<StudentProfile | null> {
  try {
    const docById = await loadDocumentById<StudentProfile>('students', studentId);
    if (docById) {
      return docById;
    }

    const byUid = await loadDocumentByField<StudentProfile>('students', 'uid', studentId);
    if (byUid) {
      return byUid;
    }

    const byStudentId = await loadDocumentByField<StudentProfile>('students', 'studentId', studentId);
    if (byStudentId) {
      return byStudentId;
    }

    return null;
  } catch (error) {
    console.error('[parentService] fetchStudentProfile', error);
    return null;
  }
}

export function subscribeStudentsByParent(
  parentUid: string,
  parentId: string | undefined,
  onUpdate: (children: StudentProfile[]) => void
) {
  const studentMap = new Map<string, StudentProfile>();

  const updateChildren = () => {
    const values = Array.from(studentMap.values());
    onUpdate(values);
  };

  const handleSnapshot = (snapshot: any) => {
    snapshot.docChanges().forEach((change: any) => {
      const docData = change.doc.data() as StudentProfile;
      const student: StudentProfile = {
        id: change.doc.id,
        ...(docData as Omit<StudentProfile, 'id'>)
      };

      if (change.type === 'removed') {
        studentMap.delete(change.doc.id);
      } else {
        studentMap.set(change.doc.id, student);
      }
    });

    updateChildren();
  };

  const unsubs: Array<() => void> = [];

  // Query 1: where parentUid == parentUid
  try {
    const q1 = query(collection(db, 'students'), where('parentUid', '==', parentUid));
    unsubs.push(onSnapshot(q1, handleSnapshot, (err) => console.error('[parentService] q1 error', err)));
  } catch (e) {
    console.error(e);
  }

  // Query 2: where parentId == parentUid or parentId
  if (parentId && parentId !== parentUid) {
    try {
      const q2 = query(collection(db, 'students'), where('parentId', '==', parentId));
      unsubs.push(onSnapshot(q2, handleSnapshot, (err) => console.error('[parentService] q2 error', err)));
    } catch (e) {
      console.error(e);
    }
  } else {
    try {
      const q2 = query(collection(db, 'students'), where('parentId', '==', parentUid));
      unsubs.push(onSnapshot(q2, handleSnapshot, (err) => console.error('[parentService] q2 error', err)));
    } catch (e) {
      console.error(e);
    }
  }

  return () => unsubs.forEach((unsub) => unsub());
}
