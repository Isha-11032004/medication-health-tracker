import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Caregivers() {
  const { user, fetchMe } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [caregivers, setCaregivers] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    if (user?.role === 'patient') {
      setCaregivers(user.caregivers || []);
    } else if (user?.role === 'caregiver') {
      api.get('/caregivers/patients').then(({ data }) => setPatients(data.patients || []));
    }
  }, [user]);

  const invite = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/caregivers/invite', { email });
      setMessage('Invitation sent successfully');
      setEmail('');
      fetchMe();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send invite');
    }
  };

  const remove = async (id) => {
    if (!confirm('Remove this caregiver?')) return;
    await api.delete(`/caregivers/${id}`);
    fetchMe();
    setCaregivers((c) => c.filter((x) => (x._id || x.id) !== id));
  };

  if (user?.role === 'caregiver') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Linked patients</h1>
        <div className="grid gap-4">
          {patients.map((p) => (
            <div key={p._id} className="card">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-slate-500">{p.email}</p>
            </div>
          ))}
          {patients.length === 0 && (
            <p className="text-slate-500">No patients linked. Accept an invitation from a patient.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Caregiver access</h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm">
        Invite a family member or caregiver by email. They can view your medicines, logs, and adherence.
      </p>

      <form onSubmit={invite} className="card flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          className="input flex-1"
          placeholder="caregiver@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">Send invitation</button>
      </form>
      {message && (
        <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">Connected caregivers</h2>
        <ul className="space-y-3">
          {caregivers.map((c) => (
            <li key={c._id || c.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-slate-500">{c.email}</p>
              </div>
              <button type="button" className="text-red-600 text-sm" onClick={() => remove(c._id || c.id)}>
                Remove
              </button>
            </li>
          ))}
          {caregivers.length === 0 && <p className="text-slate-500 text-sm">No caregivers connected yet.</p>}
        </ul>
      </div>
    </div>
  );
}
