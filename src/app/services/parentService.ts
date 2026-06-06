import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

export interface ParentProfile {
  id: string;
  uid: string;
  parentName: string;
  studentId?: string;
  studentName?: string;
  email: string;
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
  parentId?: string;
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
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return null;
  }

  return { id: snap.id, ...(snap.data() as T) };
}

async function loadDocumentByField<T>(collectionName: string, field: string, value: string): Promise<T | null> {
  const q = query(collection(db, collectionName), where(field, '==', value));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as T) };
}

export async function fetchParentProfile(uid: string): Promise<ParentProfile | null> {
  try {
    console.debug('[parentService] fetchParentProfile requested for uid=', uid);
    const docById = await loadDocumentById<ParentProfile>('parents', uid);
    if (docById) {
      console.debug('[parentService] found parent by doc id:', docById);
      return docById;
    }

    const byField = await loadDocumentByField<ParentProfile>('parents', 'uid', uid);
    console.debug('[parentService] parent lookup by uid field result:', byField);
    return byField;
  } catch (error) {
    console.error('[parentService] fetchParentProfile', error);
    return null;
  }
}

export async function fetchStudentProfile(studentId: string): Promise<StudentProfile | null> {
  try {
    console.debug('[parentService] fetchStudentProfile requested for id/uid=', studentId);
    const docById = await loadDocumentById<StudentProfile>('students', studentId);
    if (docById) {
      console.debug('[parentService] found student by doc id:', docById);
      return docById;
    }

    const byUid = await loadDocumentByField<StudentProfile>('students', 'uid', studentId);
    if (byUid) {
      console.debug('[parentService] found student by uid field:', byUid);
      return byUid;
    }

    const byStudentId = await loadDocumentByField<StudentProfile>('students', 'studentId', studentId);
    if (byStudentId) {
      console.debug('[parentService] found student by studentId field:', byStudentId);
      return byStudentId;
    }

    console.debug('[parentService] no student found for', studentId);
    return null;
  } catch (error) {
    console.error('[parentService] fetchStudentProfile', error);
    return null;
  }
}

export async function fetchStudentsByParentUid(parentUid: string): Promise<StudentProfile[]> {
  try {
    console.debug('[parentService] fetchStudentsByParentUid parentUid=', parentUid);
    const q = query(collection(db, 'students'), where('parentUid', '==', parentUid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.debug('[parentService] fetchStudentsByParentUid found 0 results');
      return [];
    }

    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<StudentProfile, 'id'>) }));
  } catch (error) {
    console.error('[parentService] fetchStudentsByParentUid', error);
    return [];
  }
}

export async function fetchStudentsByParentId(parentId: string): Promise<StudentProfile[]> {
  try {
    console.debug('[parentService] fetchStudentsByParentId parentId=', parentId);
    const q = query(collection(db, 'students'), where('parentId', '==', parentId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.debug('[parentService] fetchStudentsByParentId found 0 results');
      return [];
    }

    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<StudentProfile, 'id'>) }));
  } catch (error) {
    console.error('[parentService] fetchStudentsByParentId', error);
    return [];
  }
}

export function subscribeStudentsByParent(parentUid: string, parentId: string | undefined, onUpdate: (children: StudentProfile[]) => void) {
  console.debug('[parentService] subscribeStudentsByParent start', { parentUid, parentId });
  const studentMap = new Map<string, StudentProfile>();

  const updateChildren = () => {
    const values = Array.from(studentMap.values());
    console.debug('[parentService] updateChildren', { count: values.length });
    onUpdate(values);
  };

  const subscribeToQuery = (q: ReturnType<typeof query>, name: string) => {
    console.debug('[parentService] subscribing query', { name, parentUid, parentId });
    return onSnapshot(
      q,
      (snapshot) => {
        console.debug('[parentService] onSnapshot callback', {
          name,
          size: snapshot.size,
          changes: snapshot.docChanges().map((change) => ({ id: change.doc.id, type: change.type }))
        });

        snapshot.docChanges().forEach((change) => {
          const docData = change.doc.data() as StudentProfile;
          const student: StudentProfile = { id: change.doc.id, ...(docData as Omit<StudentProfile, 'id'>) };

          if (change.type === 'removed') {
            studentMap.delete(change.doc.id);
          } else {
            studentMap.set(change.doc.id, student);
          }
        });

        updateChildren();
      },
      (error) => {
        console.error('[parentService] onSnapshot error', { name, error });
        updateChildren();
      }
    );
  };

  const unsubscribeFunctions = [
    subscribeToQuery(query(collection(db, 'students'), where('parentUid', '==', parentUid)), 'parentUid')
  ];

  if (parentId) {
    unsubscribeFunctions.push(subscribeToQuery(query(collection(db, 'students'), where('parentId', '==', parentId)), 'parentId'));
  }

  return () => unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
}

export async function fetchStudentByParentUid(parentUid: string): Promise<StudentProfile | null> {
  try {
    console.debug('[parentService] fetchStudentByParentUid parentUid=', parentUid);
    const q = query(collection(db, 'students'), where('parentUid', '==', parentUid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.debug('[parentService] fetchStudentByParentUid found 0 results');
      return null;
    }
    const docSnap = snapshot.docs[0];
    const docData = docSnap.data() as any;
    if (docData && typeof docData === 'object' && 'id' in docData) {
      delete docData.id;
    }
    const result = { id: docSnap.id, ...docData } as StudentProfile;
    console.debug('[parentService] fetchStudentByParentUid found:', result);
    return result;
  } catch (error) {
    console.error('[parentService] fetchStudentByParentUid', error);
    return null;
  }
}
