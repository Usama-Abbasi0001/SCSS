import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { AlertDocument } from '../../types/firestore';

export default function ActiveAlerts() {
  const [alerts, setAlerts] = useState<AlertDocument[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'alerts'), where('status', '==', 'active'));
    const unsub = onSnapshot(q, (snap) => {
      setAlerts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as AlertDocument)));
    });

    return () => unsub();
  }, []);

  const filtered = alerts.filter((a) => {
    if (filter && a.type !== filter) return false;
    if (search && !a.studentName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Active Alerts</h1>
          <p className="text-slate-400 mt-2">All students with currently active alerts.</p>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 px-3 py-2">
            <option value="">All Types</option>
            <option value="emergency">Emergency</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student" className="rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 px-3 py-2" />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-slate-400">No active alerts match your filters.</div>
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="rounded-3xl border border-rose-500/10 bg-slate-900/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{a.studentName}</h3>
                  <p className="text-sm text-slate-300">Parent: {a.parentName || 'N/A'}</p>
                </div>
                <div className="text-sm text-slate-400">{a.timestamp}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-300">Type: <span className="font-medium">{a.type}</span></p>
                  <p className="text-slate-300 mt-2">Message: {a.message}</p>
                </div>
                <div>
                  <p className="text-slate-300">Location: {a.location ? `${a.location.lat.toFixed(4)}, ${a.location.lng.toFixed(4)}` : '—'}</p>
                  <p className="text-slate-300 mt-2">Status: <span className="font-medium">{a.status}</span></p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
