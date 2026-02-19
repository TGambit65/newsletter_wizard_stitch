import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

interface ProfileSettingsProps {
  fullName: string;
  email: string;
  saving: boolean;
  onFullNameChange: (value: string) => void;
  onSave: () => void;
}

export function ProfileSettings({
  fullName,
  email,
  saving,
  onFullNameChange,
  onSave,
}: ProfileSettingsProps) {
  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Profile Settings</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-background-dark border border-neutral-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-3 bg-neutral-100 dark:bg-background-dark border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-500 cursor-not-allowed"
          />
          <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
        </div>

        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Appearance Settings */}
        <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-white/10">
          <h3 className="text-base font-medium text-neutral-900 dark:text-white mb-1">Appearance</h3>
          <p className="text-sm text-neutral-500 mb-4">Choose your preferred theme</p>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
