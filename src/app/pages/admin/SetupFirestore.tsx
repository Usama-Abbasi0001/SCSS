import { useState } from 'react';
import { Database, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { seedFirestoreDatabase, DEMO_CREDENTIALS } from '../../utils/seedFirestore';

export default function SetupFirestore() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof seedFirestoreDatabase>> | null>(null);
  const [error, setError] = useState('');

  const handleSeed = async () => {
    if (!confirm('Create demo collections and sample data in your Firebase project?')) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await seedFirestoreDatabase();
      setResult(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Seed failed. Check Firestore rules and that you are logged in as admin.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const text = [
      `Student: ${DEMO_CREDENTIALS.student.email} / ${DEMO_CREDENTIALS.student.password}`,
      `Parent: ${DEMO_CREDENTIALS.parent.email} / ${DEMO_CREDENTIALS.parent.password}`
    ].join('\n');
    void navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Setup Firestore</h1>
        <p className="text-slate-400 mt-2">
          One-click demo data for collections: devices, users, students, parents, userStatus, alerts, config.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 space-y-4">
        <p className="text-sm text-slate-300">
          You must be logged in as <strong className="text-white">admin</strong>. Firestore security rules must allow admin writes
          (deploy <code className="text-sky-300">firebase/firestore.rules</code>) or use test mode temporarily.
        </p>

        <button
          type="button"
          onClick={handleSeed}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          <Database className="h-4 w-4" />
          {loading ? 'Creating collections…' : 'Create demo Firestore data'}
        </button>

        {error && (
          <div className="flex gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-300" />
            <p>{error}</p>
          </div>
        )}

        {result?.ok && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-300" />
              <p>{result.message}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Documents created</p>
              <ul className="text-sm text-slate-300 space-y-1 font-mono">
                {result.details.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-sm font-semibold text-white mb-2">Demo login (copy)</p>
              <p className="text-sm text-slate-300">Student: {DEMO_CREDENTIALS.student.email}</p>
              <p className="text-sm text-slate-300">Password: {DEMO_CREDENTIALS.student.password}</p>
              <p className="text-sm text-slate-300 mt-2">Parent: {DEMO_CREDENTIALS.parent.email}</p>
              <p className="text-sm text-slate-300">Password: {DEMO_CREDENTIALS.parent.password}</p>
              <button
                type="button"
                onClick={copyCredentials}
                className="mt-3 inline-flex items-center gap-2 text-xs text-sky-300 hover:text-sky-200"
              >
                <Copy className="h-3 w-3" />
                Copy credentials
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
