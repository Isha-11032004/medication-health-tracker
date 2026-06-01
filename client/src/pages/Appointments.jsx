import { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const emptyForm = {
  doctorName: '',
  date: '',
  time: '09:00',
  location: '',
  notes: '',
};

export default function Appointments() {
  const { patientQuery } = useOutletContext();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const params = { params: patientQuery };
  const readOnly = user?.role === 'caregiver';

  const load = async () => {
    const { data } = await api.get('/appointments', params);
    setAppointments(data.appointments || []);
  };

  useEffect(() => {
    load();
  }, [patientQuery]);

  const events = useMemo(
    () =>
      appointments.map((apt) => {
        const [h, m] = apt.time.split(':').map(Number);
        const start = new Date(apt.date);
        start.setHours(h, m, 0, 0);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        return {
          id: apt._id,
          title: apt.doctorName,
          start,
          end,
          resource: apt,
        };
      }),
    [appointments]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/appointments/${editingId}`, form);
      } else {
        await api.post('/appointments', form);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving appointment');
    }
  };

  const handleSelectEvent = (event) => {
    if (readOnly) return;
    const apt = event.resource;
    setForm({
      doctorName: apt.doctorName,
      date: apt.date?.split('T')[0],
      time: apt.time,
      location: apt.location || '',
      notes: apt.notes || '',
    });
    setEditingId(apt._id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!editingId || !confirm('Delete this appointment?')) return;
    try {
      await api.delete(`/appointments/${editingId}`);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete appointment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Appointments</h1>
        {!readOnly && (
          <button type="button" className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
            + Add appointment
          </button>
        )}
      </div>

      {showForm && !readOnly && (
        <form onSubmit={handleSubmit} className="card grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Doctor name</label>
            <input className="input" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Time</label>
            <input type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="btn-primary">Save</button>
            {editingId && (
              <button type="button" className="text-red-600 px-4" onClick={handleDelete}>
                Delete
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card" style={{ height: 500 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          views={['month', 'week', 'day', 'agenda']}
          popup
        />
      </div>
    </div>
  );
}
