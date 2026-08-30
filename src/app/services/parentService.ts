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
  onUpdate: (children: StudentProfile[]) => void,
  parentProfile?: ParentProfile | null
) {
  const studentMap = new Map<string, StudentProfile>();

  const updateChildren = () => {
    const values = Array.from(studentMap.values());
    onUpdate(values);
  };

  // Immediate initial call so UI never gets stuck
  updateChildren();

  const handleSnapshot = (snapshot: any) => {
    snapshot.docs.forEach((docSnap: any) => {
      const docData = docSnap.data() as StudentProfile;
      studentMap.set(docSnap.id, {
        id: docSnap.id,
        ...(docData as Omit<StudentProfile, 'id'>)
      });
    });

    snapshot.docChanges().forEach((change: any) => {
      if (change.type === 'removed') {
        studentMap.delete(change.doc.id);
      }
    });

    updateChildren();
  };

  const unsubs: Array<() => void> = [];

  // Direct fast fetch for any known linked student IDs
  const directStudentIds = new Set<string>();
  if (parentProfile?.linkedStudentId) directStudentIds.add(parentProfile.linkedStudentId);
  if (parentProfile?.studentId) directStudentIds.add(parentProfile.studentId);
  if (Array.isArray(parentProfile?.children)) {
    parentProfile.children.forEach((c) => c && directStudentIds.add(c));
  }

  directStudentIds.forEach(async (studentId) => {
    try {
      const singleDoc = await getDoc(doc(db, 'students', studentId));
      if (singleDoc.exists()) {
        studentMap.set(singleDoc.id, {
          id: singleDoc.id,
          ...(singleDoc.data() as Omit<StudentProfile, 'id'>)
        });
        updateChildren();
      }
    } catch (e) {
      console.warn('[parentService] initial getDoc error', e);
    }
  });

  // Query 1: where parentUid == parentUid
  try {
    const q1 = query(collection(db, 'students'), where('parentUid', '==', parentUid));
    unsubs.push(
      onSnapshot(
        q1,
        handleSnapshot,
        (err) => {
          console.warn('[parentService] q1 error', err);
          updateChildren();
        }
      )
    );
  } catch (e) {
    console.error(e);
    updateChildren();
  }

  // Query 2: where parentId == parentUid or parentId
  const targetParentId = parentId && parentId !== parentUid ? parentId : parentUid;
  try {
    const q2 = query(collection(db, 'students'), where('parentId', '==', targetParentId));
    unsubs.push(
      onSnapshot(
        q2,
        handleSnapshot,
        (err) => {
          console.warn('[parentService] q2 error', err);
          updateChildren();
        }
      )
    );
  } catch (e) {
    console.error(e);
    updateChildren();
  }

  // Direct Doc Listener 3: If parent document has linkedStudentId or studentId or children
  directStudentIds.forEach((studentId) => {
    try {
      const docUnsub = onSnapshot(
        doc(db, 'students', studentId),
        (docSnap) => {
          if (docSnap.exists()) {
            studentMap.set(docSnap.id, {
              id: docSnap.id,
              ...(docSnap.data() as Omit<StudentProfile, 'id'>)
            });
            updateChildren();
          }
        },
        (err) => {
          console.warn('[parentService] direct doc listener error', err);
          updateChildren();
        }
      );
      unsubs.push(docUnsub);
    } catch (e) {
      console.error(e);
    }
  });

  // Safety fallback: if no child found in 2 seconds, refresh
  const timer = setTimeout(() => {
    updateChildren();
  }, 1500);

  return () => {
    clearTimeout(timer);
    unsubs.forEach((unsub) => unsub());
  };
}
