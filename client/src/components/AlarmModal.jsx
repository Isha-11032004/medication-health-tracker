import { Pill, Calendar, BellOff } from 'lucide-react';
import { useAlarm } from '../context/AlarmContext';

export default function AlarmModal() {
  const { activeAlarm, stopAlarm } = useAlarm();

  if (!activeAlarm) return null;

  const isMed = activeAlarm.type === 'medication';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pulse-slow">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-4 border-amber-400 ring-4 ring-amber-200"
        role="alertdialog"
        aria-labelledby="alarm-title"
      >
        <div className="flex items-center gap-3 text-amber-600 mb-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full animate-bounce">
            {isMed ? <Pill className="w-8 h-8" /> : <Calendar className="w-8 h-8" />}
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide">Alarm</p>
            <h2 id="alarm-title" className="text-xl font-bold text-slate-900 dark:text-white">
              {isMed ? 'Medication time!' : 'Appointment reminder'}
            </h2>
          </div>
        </div>

        <div className="bg-medical-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {activeAlarm.title}
          </p>
          {activeAlarm.subtitle && (
            <p className="text-slate-600 dark:text-slate-400 mt-1">{activeAlarm.subtitle}</p>
          )}
          <p className="text-2xl font-mono font-bold text-medical-700 mt-2">{activeAlarm.time}</p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={stopAlarm}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-semibold transition"
          >
            <BellOff className="w-5 h-5" /> Stop Alarm
          </button>
        </div>
      </div>
    </div>
  );
}
