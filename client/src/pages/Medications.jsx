import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '',
  dosage: '',
  frequency: 'once_daily',
  times: ['08:00'],
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  instructions: '',
};

export default function Medications() {
  const { patientQuery } = useOutletContext();
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const params = { params: patientQuery };
  const readOnly = user?.role === 'caregiver';

  const load = async () => {
    const { data } = await api.get('/medications', params);
    setMedications(data.medications || []);
  };

  useEffect(() => {
    load();
  }, [patientQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      endDate: form.endDate || undefined,
      times: form.times.filter(Boolean),
    };
    try {
      if (editingId) {
        await api.put(`/medications/${editingId}`, payload);
      } else {
        await api.post('/medications', payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving medication');
    }
  };

  const handleEdit = (med) => {
    setForm({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      times: med.times?.length ? med.times : ['08:00'],
      startDate: med.startDate?.split('T')[0],
      endDate: med.endDate?.split('T')[0] || '',
      instructions: med.instructions || '',
    });
    setEditingId(med._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this medication?')) return;
    try {
      await api.delete(`/medications/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete medication');
    }
  };

  const addTimeSlot = () => setForm({ ...form, times: [...form.times, '12:00'] });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Medications</h1>
        {!readOnly && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(emptyForm);
            }}
          >
            + Add medicine
          </button>
        )}
      </div>

      {showForm && !readOnly && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-semibold">{editingId ? 'Edit' : 'New'} medication</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Dosage</label>
              <input className="input" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} required placeholder="e.g. 500mg" />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                <option value="once_daily">Once daily</option>
                <option value="twice_daily">Twice daily</option>
                <option value="three_times">Three times daily</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="label">Start date</label>
              <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="label">End date (optional)</label>
              <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Reminder times</label>
            {form.times.map((t, i) => (
              <input
                key={i}
                type="time"
                className="input mb-2"
                value={t}
                onChange={(e) => {
                  const times = [...form.times];
                  times[i] = e.target.value;
                  setForm({ ...form, times });
                }}
                required
              />
            ))}
            <button type="button" onClick={addTimeSlot} className="text-sm text-medical-600">
              + Add time
            </button>
          </div>
          <div>
            <label className="label">Instructions</label>
            <textarea className="input" rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {medications.map((med) => (
          <div key={med._id} className="card flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{med.name}</h3>
              <p className="text-medical-600">{med.dosage}</p>
              <p className="text-sm text-slate-500 mt-1">
                {med.times?.join(', ')} · {med.frequency.replace(/_/g, ' ')}
              </p>
              {med.instructions && <p className="text-sm mt-2 text-slate-600">{med.instructions}</p>}
            </div>
            {!readOnly && (
              <div className="flex gap-2">
                <button type="button" className="btn-secondary text-sm" onClick={() => handleEdit(med)}>
                  Edit
                </button>
                <button type="button" className="text-sm text-red-600 px-2" onClick={() => handleDelete(med._id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {medications.length === 0 && (
          <p className="text-slate-500 text-center py-8">No medications added yet.</p>
        )}
      </div>
    </div>
  );
}
