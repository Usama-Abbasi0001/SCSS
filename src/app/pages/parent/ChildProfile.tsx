import { useEffect, useState } from 'react';
import { User, Phone, MapPin, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { ParentDocument, StudentDocument } from '../../types/firestore';

export default function ChildProfile() {
  const { user } = useAuth();
  const [parent, setParent] = useState<ParentDocument | null>(null);
  const [children, setChildren] = useState<StudentDocument[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setParent(null);
      return;
    }

    let active = true;
    let unsubscribe = () => {};

    const parentRef = doc(db, 'parents', user.id);
    const parentSubscription = onSnapshot(parentRef, async (snapshot) => {
      if (!active) {
        return;
      }

      if (snapshot.exists()) {
        setParent({ id: snapshot.id, ...snapshot.data() } as ParentDocument);
        return;
      }

      const fallbackQuery = query(collection(db, 'parents'), where('uid', '==', user.id));
      const fallbackSnapshot = await getDocs(fallbackQuery);
      if (!active) {
        return;
      }

      if (fallbackSnapshot.docs.length > 0) {
        const docData = fallbackSnapshot.docs[0];
        setParent({ id: docData.id, ...docData.data() } as ParentDocument);
      } else {
        setParent(null);
      }
    });

    unsubscribe = () => parentSubscription();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setChildren([]);
      return;
    }

    const studentMap = new Map<string, StudentDocument>();
    let active = true;
    let unsubscribe = () => {};

    const setupSubscriptions = async () => {
      const parentProfile = await getDoc(doc(db, 'parents', user.id));
      const parentId = parentProfile.exists() ? parentProfile.id : parent?.id;

      const updateChildren = () => {
        if (!active) return;
        setChildren(Array.from(studentMap.values()));
      };

      const subscribeQuery = (q: ReturnType<typeof query>) =>
        onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const docData = change.doc.data() as StudentDocument;
            const childRecord: StudentDocument = { id: change.doc.id, ...(docData as Omit<StudentDocument, 'id'>) };
            if (change.type === 'removed') {
              studentMap.delete(change.doc.id);
            } else {
              studentMap.set(change.doc.id, childRecord);
            }
          });
          updateChildren();
        });

      const subscriptions = [subscribeQuery(query(collection(db, 'students'), where('parentUid', '==', user.id)))];
      if (parentId) {
        subscriptions.push(subscribeQuery(query(collection(db, 'students'), where('parentId', '==', parentId))));
      }

      unsubscribe = () => subscriptions.forEach((unsub) => unsub());
    };

    setupSubscriptions();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.id, parent?.id]);

  if (!parent) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Child Profile</h1>
          <p className="text-slate-300 mt-2">No parent record found for this account.</p>
        </div>
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Child Profile</h1>
          <p className="text-slate-300 mt-2">No linked student found for this parent.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Child Profile</h1>
        <p className="text-slate-300 mt-2">View your linked student details.</p>
      </div>

      <div className="grid gap-6">
        {children.map((child) => (
          <div key={child.id} className="max-w-3xl rounded-3xl border border-slate-800 bg-slate-950/95 shadow-sm shadow-slate-950/20 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-32" />
            <div className="px-8 pb-8">
              <div className="flex items-end gap-6 -mt-16 mb-6">
                <div className="w-32 h-32 bg-slate-900 rounded-2xl shadow-lg flex items-center justify-center border-4 border-slate-800">
                  <span className="text-purple-600 font-bold text-4xl">
                    {child.name?.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="pb-4">
                  <h2 className="text-2xl font-bold text-white">{child.name}</h2>
                  <p className="text-slate-300">{child.registrationNumber}</p>
                  <span
                    className={`inline-block mt-2 text-[11px] font-medium px-3 py-1 rounded-full ${
                      child.emergencyStatus === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    Status: {child.emergencyStatus || 'inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <Phone className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm text-slate-400">Phone Number</p>
                      <p className="font-medium text-slate-100">{child.phone || 'Not available'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <MapPin className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm text-slate-400">Address</p>
                      <p className="font-medium text-slate-100">{child.address || 'Not available'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <User className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm text-slate-400">Parent Name</p>
                      <p className="font-medium text-slate-100">{child.parentName || 'Not linked'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <Shield className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm text-slate-400">Safety Device</p>
                      <p className="font-medium text-purple-600 font-mono">{child.deviceId || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
                  <h3 className="font-semibold text-white mb-4">Last Known Location</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Latitude</span>
                      <span className="font-mono text-sm text-slate-100">{child.lastLocation?.lat?.toFixed(6) ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Longitude</span>
                      <span className="font-mono text-sm text-slate-100">{child.lastLocation?.lng?.toFixed(6) ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Updated</span>
                      <span className="text-sm text-slate-100">{child.lastLocation?.timestamp ?? 'No update'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-purple-900 mb-2">Safety Monitoring</h3>
                  <p className="text-sm text-purple-700">
                    Your child’s safety device is active and transmitting location data. You will be immediately notified of any emergency alerts.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-purple-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span>Monitoring Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
