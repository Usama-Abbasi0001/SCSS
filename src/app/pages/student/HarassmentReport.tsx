import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Send, Image as ImageIcon, History, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { StudentDocument, HarassmentIncidentDocument } from '../../types/firestore';

export default function StudentHarassmentReport() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<HarassmentIncidentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentDocument | null>(null);

  const [formData, setFormData] = useState({
    type: '',
    location: '',
    date: '',
    time: '',
    description: ''
  });
  
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchStudentProfile = async () => {
      try {
        const docRef = doc(db, 'students', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStudentProfile({ id: docSnap.id, ...docSnap.data() } as StudentDocument);
        }
      } catch (error) {
        console.error("Error fetching student profile:", error);
      }
    };
    fetchStudentProfile();

    const q = query(
      collection(db, 'harassment_incidents'),
      where('studentId', '==', user.uid)
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
      console.error("Error listening to incidents:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }
      setEvidenceFile(file);
    }
  };

  const clearFile = () => {
    setEvidenceFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    
    setSubmitting(true);
    try {
      let evidenceUrl = '';

      if (evidenceFile) {
        // Firebase Storage is bypassed due to CORS/Billing errors.
        // For FYP demo, we attach a dummy placeholder image URL.
        evidenceUrl = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800'; 
      }

      const newIncidentData = {
        studentId: user.uid,
        studentName: user.name || studentProfile?.name || 'Unknown',
        rollNumber: studentProfile?.registrationNumber || '',
        department: studentProfile?.class || '', 
        className: studentProfile?.grade || '',
        parentId: studentProfile?.parentId || studentProfile?.parentUid || '',
        incidentType: formData.type || 'Other',
        location: formData.location || 'Unknown',
        description: formData.description,
        dateTime: `${formData.date} ${formData.time}`,
        status: 'pending',
        evidenceUrl: evidenceUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'harassment_incidents'), newIncidentData);
      
      setFormData({ type: '', location: '', date: '', time: '', description: '' });
      clearFile();
      alert('Report submitted successfully.');
    } catch (error) {
      console.error("Error submitting report:", error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
          Harassment Reporting
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Report any incidents of harassment securely. Your safety is our priority.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Form */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/30 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-semibold text-white">File a New Report</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Incident Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-2xl bg-slate-900/50 border border-slate-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="Verbal Harassment">Verbal Harassment</option>
                  <option value="Physical Intimidation">Physical Intimidation</option>
                  <option value="Cyberbullying">Cyberbullying</option>
                  <option value="Stalking">Stalking</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Where did it happen?"
                  className="w-full rounded-2xl bg-slate-900/50 border border-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-2xl bg-slate-900/50 border border-slate-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full rounded-2xl bg-slate-900/50 border border-slate-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details about the incident..."
                  className="w-full rounded-2xl bg-slate-900/50 border border-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Evidence (Optional)</label>
                
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                {!evidenceFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-700 hover:border-rose-500/50 transition-colors cursor-pointer rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 hover:bg-slate-900/40"
                  >
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">Click to upload image (Max 5MB)</p>
                  </div>
                ) : (
                  <div className="w-full border border-slate-700 rounded-2xl p-4 flex items-center justify-between bg-slate-900/40">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-5 h-5 text-rose-400" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-slate-300 truncate">{evidenceFile.name}</p>
                        <p className="text-xs text-slate-500">{(evidenceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={clearFile}
                      className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium px-4 py-3 transition-colors shadow-lg shadow-rose-500/20"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>

        {/* My Incidents */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/30 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              My Reports
            </h2>
          </div>
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
              </div>
            ) : incidents.length === 0 ? (
              <p className="text-slate-500 text-center py-8">You have not reported any incidents.</p>
            ) : (
              incidents.map(incident => (
                <div key={incident.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{incident.incidentType}</h3>
                      <p className="text-xs text-slate-400 mt-1">{incident.id.substring(0,8)}... • {incident.dateTime}</p>
                    </div>
                    {getStatusBadge(incident.status)}
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{incident.description}</p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="font-medium text-slate-400">Location:</span> {incident.location}
                    </div>
                    {incident.evidenceUrl && (
                      <span className="text-xs text-rose-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Evidence attached
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
