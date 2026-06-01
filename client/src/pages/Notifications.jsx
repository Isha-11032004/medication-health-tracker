import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const load = async () => {
    const { data } = await api.get('/notifications');
    setNotifications(data.notifications || []);
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button type="button" className="btn-secondary text-sm" onClick={markAllRead}>
          Mark all read
        </button>
      </div>

      <ul className="space-y-3">
        {notifications.map((n) => (
          <li
            key={n._id}
            className={`card cursor-pointer transition ${
              !n.read ? 'border-l-4 border-l-medical-500' : 'opacity-75'
            }`}
            onClick={() => !n.read && markRead(n._id)}
          >
            <div className="flex justify-between">
              <p className="font-medium">{n.title}</p>
              <span className="text-xs text-slate-400 capitalize">{n.type}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{n.message}</p>
            <p className="text-xs text-slate-400 mt-2">{format(new Date(n.createdAt), 'PPp')}</p>
          </li>
        ))}
        {notifications.length === 0 && (
          <p className="text-slate-500 text-center py-8">No notifications yet.</p>
        )}
      </ul>
    </div>
  );
}
