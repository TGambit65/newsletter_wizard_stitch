import { Clock, RefreshCw, X } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleDate: string;
  scheduleTime: string;
  scheduling: boolean;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onSchedule: () => void;
}

export function ScheduleModal({
  isOpen,
  onClose,
  scheduleDate,
  scheduleTime,
  scheduling,
  onDateChange,
  onTimeChange,
  onSchedule,
}: ScheduleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5" /> Schedule Newsletter
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => onDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Time
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <p className="text-xs text-neutral-500 mt-4">
            Note: Scheduled sends require a background cron job to be configured. For MVP, the schedule is stored but manual sending may be needed.
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={onSchedule}
              disabled={scheduling || !scheduleDate || !scheduleTime}
              className="flex-1 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {scheduling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
