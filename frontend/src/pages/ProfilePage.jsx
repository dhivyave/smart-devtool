import { useState } from 'react';
import { UserProfile } from '@clerk/clerk-react';
import {
  User, ShieldCheck, Settings, Bell
} from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import { useToast } from '../components/Toast';


const ProfilePage = () => {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'preferences'

  // Preference switches
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(true);
  const [notifyOnWeeklyReport, setNotifyOnWeeklyReport] = useState(false);

  const handleSavePreferences = () => {
    toast.success('Preferences saved successfully!');
  };

  return (
    <div className="page-enter p-6 md:p-8 max-w-5xl mx-auto space-y-8 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <User size={22} className="text-slate-400" />
          Settings Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure account details, API integrations, and developer preferences.</p>
      </div>

      {/* Profile Navigation Tabs - Prevents clipping */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-1.5 rounded-2xl gap-1">
        {[
          { id: 'account', label: 'Clerk Profile', icon: ShieldCheck },
          { id: 'preferences', label: 'Preferences', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-purple-500/10 dark:bg-blue-500/10 text-purple-600 dark:text-blue-400 border border-purple-500/10 dark:border-blue-500/10'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-150 dark:hover:bg-slate-900 border border-transparent'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[400px]">
        {/* Removed stats tab */}

        {/* Account Details tab — Embed Clerk directly with styled container to avoid layout clipping */}
        {activeTab === 'account' && (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="max-w-full overflow-x-auto">
              <UserProfile
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'bg-transparent shadow-none border-0 w-full',
                    navbar: 'hidden', // hides inner nav links to avoid clipping
                    pageScrollBox: 'p-0 max-w-full',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    profileSectionTitle: 'border-b border-slate-100 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100',
                    profileSectionTitleText: 'text-xs font-bold uppercase tracking-wider',
                    formFieldLabel: 'text-2xs font-bold text-slate-400 uppercase tracking-wider',
                    formFieldInput: 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:ring-purple-500/25 dark:focus:ring-blue-500/25',
                    formButtonPrimary: 'bg-purple-600 dark:bg-blue-600 hover:bg-purple-500 dark:hover:bg-blue-500 text-xs font-bold uppercase tracking-wider py-2.5 px-6 rounded-xl cursor-pointer shadow-md',
                    accordionTriggerButton: 'text-slate-700 dark:text-slate-300 text-xs font-semibold',
                    profilePage__security: 'text-slate-900 dark:text-slate-150',
                  }
                }}
              />
            </div>
          </div>
        )}



        {/* Preferences tab */}
        {activeTab === 'preferences' && (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Console Settings</h3>
              <p className="text-2xs text-slate-500">Configure visual themes, prompt modes, and updates notifications.</p>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-650 dark:text-slate-350">
              
              {/* Theme preference */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl">
                <div>
                  <h4 className="text-slate-850 dark:text-white font-bold">Theme Choice</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-none">Toggle between Light and Dark modes.</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl text-2xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </button>
              </div>

              {/* Notification preferences */}
              <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 p-4 rounded-xl">
                <h4 className="text-slate-850 dark:text-white font-bold flex items-center gap-1.5 mb-2">
                  <Bell size={13} className="text-purple-500 dark:text-blue-500" />
                  Notifications Channels
                </h4>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnSuccess}
                    onChange={e => setNotifyOnSuccess(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 dark:text-blue-600 focus:ring-purple-500 dark:focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-slate-800 dark:text-slate-250">Notify on successful client mappings</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Show notifications when API analysis generation resolves.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={notifyOnWeeklyReport}
                    onChange={e => setNotifyOnWeeklyReport(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 dark:text-blue-600 focus:ring-purple-500 dark:focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-slate-800 dark:text-slate-250">Email weekly usage analytics reports</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Send a compilation dashboard log metrics to account email.</p>
                  </div>
                </label>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
              <button
                onClick={handleSavePreferences}
                className="bg-purple-600 dark:bg-blue-600 hover:bg-purple-500 dark:hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProfilePage;
