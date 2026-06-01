import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Clock,
  Calendar,
  TrendingUp,
  Lightbulb,
  ListChecks,
  Pill,
  ArrowRight,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAlarm } from '../context/AlarmContext';
import { format } from 'date-fns';
import {
  todayStr,
  normalizeTime,
  getDoseLogForTime,
} from '../utils/timeHelpers';
import {
  getNextDose,
  getNextAppointment,
  getPendingDosesCount,
  generateSmartInsight,
  flattenTodayDoses,
} from '../utils/dashboardInsights';

export default function Dashboard() {
  const { patientQuery } = useOutletContext();
  const { user } = useAuth();
  const { refreshSchedule } = useAlarm();
  const [todayMeds, setTodayMeds] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingKey, setLoggingKey] = useState(null);
  const [toast, setToast] = useState('');

  const params = { params: patientQuery };

  const loadDashboard = useCallback(async () => {
    const [medsRes, aptRes, weeklyRes] = await Promise.all([
      api.get('/medications/today', params),
      api.get('/appointments', params),
      api.get('/reports/weekly-adherence', params),
    ]);
    setTodayMeds(medsRes.data.medications || []);
    setAppointments(aptRes.data.appointments || []);
    setWeekly(weeklyRes.data.weekly);
    setSummary(medsRes.data.summary || null);
    refreshSchedule?.();
  }, [patientQuery, refreshSchedule]);

  useEffect(() => {
    (async () => {
      try {
        await loadDashboard();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadDashboard]);

  const nextDose = useMemo(() => getNextDose(todayMeds), [todayMeds]);
  const nextApt = useMemo(() => getNextAppointment(appointments), [appointments]);
  const pendingCount = useMemo(() => getPendingDosesCount(todayMeds), [todayMeds]);
  const insight = useMemo(
    () => generateSmartInsight(weekly, todayMeds),
    [weekly, todayMeds]
  );

  const takenTodayCount = summary?.taken ?? 0;
  const missedTodayCount = summary?.missed ?? 0;
  const pendingTodayCount = Math.max(0, (summary?.scheduled ?? 0) - takenTodayCount - missedTodayCount);

  const logDose = async (med, timeStr, status) => {
    const slot = normalizeTime(timeStr);
    setLoggingKey(`${med._id}-${slot}`);
    try {
      await api.post(`/medications/${med._id}/dose`, {
        date: todayStr(),
        time: slot,
        status,
        logId: getDoseLogForTime(med, slot)?._id,
      });
      await loadDashboard();
      setToast(`${med.name}: ${status === 'taken' ? 'Taken' : 'Missed'}`);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to update dose'));
    } finally {
      setLoggingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-medical-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Good day, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {toast && (
        <div className="p-3 rounded-lg bg-green-100 text-green-800 text-sm font-medium">{toast}</div>
      )}

      {/* Smart insight cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Next dose */}
        <div
          className={`card transition hover:shadow-md hover:-translate-y-0.5 ${
            nextDose?.within30Min
              ? 'ring-2 ring-amber-400 bg-amber-50/50 dark:bg-amber-900/20'
              : ''
          }`}
        >
          <div className="flex items-center gap-2 text-medical-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Next dose</span>
          </div>
          {nextDose ? (
            <>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{nextDose.name}</p>
              <p className="text-sm text-slate-500">{nextDose.dosage}</p>
              <p
                className={`mt-2 text-sm font-medium ${
                  nextDose.within30Min ? 'text-amber-600' : 'text-medical-600'
                }`}
              >
                {nextDose.isNow ? 'Due now' : nextDose.remaining} · {nextDose.time}
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">No more doses scheduled today.</p>
          )}
        </div>

        {/* Upcoming appointment */}
        <div
          className={`card transition hover:shadow-md hover:-translate-y-0.5 ${
            nextApt?.isToday ? 'ring-2 ring-medical-400 bg-medical-50/50' : ''
          }`}
        >
          <div className="flex items-center gap-2 text-medical-600 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Appointment</span>
          </div>
          {nextApt ? (
            <>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{nextApt.doctorName}</p>
              <p className="text-sm text-slate-500 mt-1">
                {format(nextApt.at, 'PP')} at {format(nextApt.at, 'HH:mm')}
              </p>
              <p className="text-sm text-medical-600 font-medium mt-1">{nextApt.remaining}</p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">No upcoming appointments.</p>
          )}
          <Link
            to="/appointments"
            className="inline-flex items-center gap-1 text-xs text-medical-600 mt-2 hover:underline"
          >
            View calendar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Weekly Adherence (Percentage Only) */}
        <div className="card transition hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Weekly adherence</span>
          </div>
          <p className="text-4xl font-bold text-slate-800 dark:text-white">
            {weekly?.weekAdherencePercent ?? 0}%
          </p>
          <p className="text-sm text-slate-500 mt-1">Overall weekly adherence rate</p>
        </div>
      </div>

      {/* Today's progress counters */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Progress</h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Taken today */}
          <div className="card bg-green-50/20 border border-green-100/50 py-4 px-5">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Taken Today</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{takenTodayCount}</p>
          </div>

          {/* Missed today */}
          <div className="card bg-red-50/20 border border-red-100/50 py-4 px-5">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Missed Today</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{missedTodayCount}</p>
          </div>

          {/* Pending today */}
          <div className="card bg-amber-50/20 border border-amber-100/50 py-4 px-5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Today</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{pendingTodayCount}</p>
          </div>
        </div>
      </div>

      {/* Smart insight */}
      <div className="card bg-gradient-to-br from-medical-50 to-white dark:from-slate-800 dark:to-slate-900 transition hover:shadow-md">
        <div className="flex items-center gap-2 text-medical-700 dark:text-medical-300 mb-3">
          <Lightbulb className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">Smart health insight</span>
        </div>
        <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{insight}</p>
      </div>

      {/* Today's medicines with alarm-friendly buttons */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-medical-600" />
            <h2 className="text-lg font-semibold">Today&apos;s medicines</h2>
          </div>
          <Link
            to="/medications"
            className="text-medical-600 text-sm hover:underline flex items-center gap-1"
          >
            Add medicine <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {todayMeds.length === 0 ? (
          <div className="card text-center py-10 text-slate-500">
            <p>No medicines for today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMeds.map((med) => (
              <article
                key={med._id}
                className="card border-l-4 border-l-medical-500 hover:shadow-md transition"
              >
                <p className="font-semibold">{med.name}</p>
                <p className="text-sm text-slate-500 mb-3">{med.dosage}</p>
                {user?.role === 'patient' &&
                  (med.times || []).map((raw) => {
                    const t = normalizeTime(raw);
                    const log = getDoseLogForTime(med, t);
                    const status = log?.status;
                    const busy = loggingKey === `${med._id}-${t}`;
                    return (
                      <div
                        key={t}
                        className="flex flex-wrap items-center gap-2 py-2 border-t border-slate-100 dark:border-slate-700 first:border-0"
                      >
                        <span className="font-mono font-semibold w-14">{t}</span>
                        {status === 'taken' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                            Taken
                          </span>
                        )}
                        {status === 'missed' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            Missed
                          </span>
                        )}
                        {!status || status === 'pending' ? (
                          <div className="flex gap-2 ml-auto">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => logDose(med, t, 'taken')}
                              className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-50"
                            >
                              Taken
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => logDose(med, t, 'missed')}
                              className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
                            >
                              Missed
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
