import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';

export default function Reports() {
  const { patientQuery } = useOutletContext();
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const params = { params: patientQuery };

  useEffect(() => {
    const load = async () => {
      const [aRes, lRes] = await Promise.all([
        api.get('/reports/analytics', params),
        api.get('/medications/logs', params),
      ]);
      setAnalytics(aRes.data.analytics);
      setLogs(lRes.data.logs || []);
    };
    load();
  }, [patientQuery]);

  const download = async (type) => {
    const token = localStorage.getItem('token');
    const qs = new URLSearchParams(patientQuery).toString();
    const url = `/api/reports/export/${type}${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = type === 'pdf' ? 'health-report.pdf' : 'medication-adherence.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{analytics?.taken ?? 0}</p>
          <p className="text-sm text-slate-500">Taken</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-500">{analytics?.missed ?? 0}</p>
          <p className="text-sm text-slate-500">Missed</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-500">{analytics?.pending ?? 0}</p>
          <p className="text-sm text-slate-500">Pending</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-medical-600">{analytics?.adherencePercent ?? 0}%</p>
          <p className="text-sm text-slate-500">Adherence</p>
        </div>
      </div>

      <div className="card flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => download('csv')}>
          Export CSV
        </button>
        <button type="button" className="btn-secondary" onClick={() => download('pdf')}>
          Export PDF
        </button>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-semibold mb-4">Adherence history</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2">Medication</th>
              <th className="pb-2">Scheduled</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 50).map((log, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                <td className="py-2">{log.medicationName}</td>
                <td>{format(new Date(log.scheduledAt), 'PPp')}</td>
                <td>
                  <span
                    className={`px-2 py-0.5 rounded text-xs capitalize ${
                      log.status === 'taken'
                        ? 'bg-green-100 text-green-700'
                        : log.status === 'missed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-slate-500 py-4 text-center">No dose logs yet.</p>}
      </div>
    </div>
  );
}
