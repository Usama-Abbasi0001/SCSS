import { useState, useEffect } from 'react';
import { ShieldAlert, Users, FileText, CheckCircle, Clock, Image as ImageIcon, X } from 'lucide-react';
import { collection, onSnapshot, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import StatCard from '../../components/dashboard/StatCard';
import { HarassmentIncidentDocument } from '../../types/firestore';

export default function AdminHarassmentDashboard() {
  const [incidents, setIncidents] = useState<HarassmentIncidentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'harassment_incidents'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incidentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HarassmentIncidentDocument[];
      
      incidentsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setIncidents(incidentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching incidents: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const pendingCount = incidents.filter(i => i.status === 'pending').length;
  const reviewCount = incidents.filter(i => i.status === 'under_review').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    try {
      const incidentRef = doc(db, 'harassment_incidents', incidentId);
      await updateDoc(incidentRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status: ", error);
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20">Pending</span>;
      case 'under_review':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">Under Review</span>;
      case 'resolved':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Resolved</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
          Harassment Detection & Reporting
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Monitor and manage harassment reports. Ensure a safe campus environment by addressing incidents promptly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Incidents" value={incidents.length} icon={FileText} color="blue" />
        <StatCard title="Pending Review" value={pendingCount} icon={Clock} color="red" />
        <StatCard title="Under Investigation" value={reviewCount} icon={Users} color="orange" />
        <StatCard title="Resolved Cases" value={resolvedCount} icon={CheckCircle} color="green" />
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/30 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Incident Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Incident ID</th>
                <th className="px-6 py-4 font-medium">Student Info</th>
                <th className="px-6 py-4 font-medium">Type & Location</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Evidence</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-rose-500"></div>
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No incidents reported yet.
                  </td>
                </tr>
              ) : incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{incident.id.substring(0,8)}...</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-200">{incident.studentName}</p>
                    <p className="text-xs text-slate-500">{incident.rollNumber || 'N/A'} • {incident.department || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-200">{incident.incidentType}</p>
                    <p className="text-xs text-slate-500">{incident.location}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{incident.dateTime}</td>
                  <td className="px-6 py-4">
                    {incident.evidenceUrl ? (
                      <button 
                        onClick={() => setSelectedEvidenceUrl(incident.evidenceUrl || null)}
                        className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-1.5 rounded-lg"
                      >
                        <ImageIcon className="w-4 h-4" /> View
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(incident.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      value={incident.status}
                      onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                      className="text-xs font-medium text-cyan-400 bg-slate-900 border border-cyan-400/30 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Modal */}
      {selectedEvidenceUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" /> Attached Evidence
              </h3>
              <button 
                onClick={() => setSelectedEvidenceUrl(null)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950">
              <img 
                src={selectedEvidenceUrl} 
                alt="Evidence" 
                className="max-w-full max-h-[70vh] object-contain rounded border border-slate-800" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
