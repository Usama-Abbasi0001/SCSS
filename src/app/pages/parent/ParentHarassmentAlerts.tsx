import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, FileText, Image as ImageIcon, X } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { HarassmentIncidentDocument } from '../../types/firestore';

export default function ParentHarassmentAlerts() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<HarassmentIncidentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'harassment_incidents'),
      where('parentId', '==', user.uid)
    );

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
      console.error("Error fetching child incidents:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20">Pending Review</span>;
      case 'under_review':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">Under Investigation</span>;
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
          Harassment Alerts
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Monitor harassment reports and incidents related to your child. We ensure full transparency while handling these matters.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/30 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            Incident History
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {loading ? (
             <div className="flex items-center justify-center py-12 text-slate-400">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
             </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No Incidents Reported</h3>
              <p className="text-slate-500 mt-2">There are no harassment reports associated with your child.</p>
            </div>
          ) : (
            incidents.map((incident) => (
              <div key={incident.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden hover:border-slate-700 transition-colors">
                <div className="p-5 border-b border-slate-800/50 flex justify-between items-start bg-slate-900/80">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">{incident.incidentType}</h3>
                      {getStatusBadge(incident.status)}
                    </div>
                    <p className="text-sm text-slate-400">
                      Reported for <span className="font-medium text-slate-200">{incident.studentName}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-300">{incident.dateTime}</p>
                    <p className="text-xs text-slate-500 mt-1">ID: {incident.id.substring(0,8)}...</p>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Description</h4>
                  <p className="text-slate-400 text-sm mb-4">{incident.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Location:</span>
                      <span className="text-slate-300 font-medium">{incident.location}</span>
                    </div>
                    
                    {incident.evidenceUrl && (
                      <button 
                        onClick={() => setSelectedEvidenceUrl(incident.evidenceUrl || null)}
                        className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-1.5 rounded-lg"
                      >
                        <ImageIcon className="w-4 h-4" /> View Evidence
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
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
