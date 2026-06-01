import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  systolic: '',
  diastolic: '',
  sugarLevel: '',
  weight: '',
  notes: '',
};

export default function HealthTracker() {
  const { patientQuery } = useOutletContext();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const params = { params: patientQuery };
  const readOnly = user?.role === 'caregiver';

  const load = async () => {
    const { data } = await api.get('/health-logs', { params: { ...patientQuery, limit: 30 } });
    setLogs(data.logs || []);
  };

  useEffect(() => {
    load();
  }, [patientQuery]);

  const chartData = [...logs]
    .reverse()
    .map((l) => ({
      date: format(new Date(l.date), 'MM/dd'),
      systolic: l.bloodPressure?.systolic,
      diastolic: l.bloodPressure?.diastolic,
      sugar: l.sugarLevel,
      weight: l.weight,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      date: form.date,
      bloodPressure:
        form.systolic && form.diastolic
          ? { systolic: Number(form.systolic), diastolic: Number(form.diastolic) }
          : undefined,
      sugarLevel: form.sugarLevel ? Number(form.sugarLevel) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      notes: form.notes || undefined,
    };
    try {
      await api.post('/health-logs', payload);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving log');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Health Tracker</h1>
        {!readOnly && (
          <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
            + Log vitals
          </button>
        )}
      </div>

      {showForm && !readOnly && (
        <form onSubmit={handleSubmit} className="card grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Systolic (mmHg)</label>
            <input type="number" className="input" value={form.systolic} onChange={(e) => setForm({ ...form, systolic: e.target.value })} />
          </div>
          <div>
            <label className="label">Diastolic (mmHg)</label>
            <input type="number" className="input" value={form.diastolic} onChange={(e) => setForm({ ...form, diastolic: e.target.value })} />
          </div>
          <div>
            <label className="label">Blood sugar (mg/dL)</label>
            <input type="number" className="input" value={form.sugarLevel} onChange={(e) => setForm({ ...form, sugarLevel: e.target.value })} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" step="0.1" className="input" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="btn-primary">Save log</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {chartData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Trends</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="systolic" stroke="#0d9488" name="Systolic" connectNulls />
              <Line type="monotone" dataKey="diastolic" stroke="#14b8a6" name="Diastolic" connectNulls />
              <Line type="monotone" dataKey="sugar" stroke="#f59e0b" name="Sugar" connectNulls />
              <Line type="monotone" dataKey="weight" stroke="#6366f1" name="Weight" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card overflow-x-auto">
        <h2 className="font-semibold mb-4">History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b dark:border-slate-700">
              <th className="pb-2">Date</th>
              <th className="pb-2">BP</th>
              <th className="pb-2">Sugar</th>
              <th className="pb-2">Weight</th>
              <th className="pb-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-b border-slate-100 dark:border-slate-700">
                <td className="py-2">{format(new Date(log.date), 'PP')}</td>
                <td>
                  {log.bloodPressure?.systolic
                    ? `${log.bloodPressure.systolic}/${log.bloodPressure.diastolic}`
                    : '—'}
                </td>
                <td>{log.sugarLevel ?? '—'}</td>
                <td>{log.weight ? `${log.weight} kg` : '—'}</td>
                <td className="max-w-xs truncate">{log.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-slate-500 py-4 text-center">No health logs yet.</p>}
      </div>
    </div>
  );
}
