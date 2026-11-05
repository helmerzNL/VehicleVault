import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sliders,
  Sparkles,
  Users,
  Bell,
  Radio,
  Database,
  FileSpreadsheet,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import { GeneralSettingsTab } from '../components/settings/GeneralSettingsTab.js';
import { AiSettingsTab } from '../components/settings/AiSettingsTab.js';
import { UsersSettingsTab } from '../components/settings/UsersSettingsTab.js';
import { NotificationsSettingsTab } from '../components/settings/NotificationsSettingsTab.js';
import { HomeAssistantSettingsTab } from '../components/settings/HomeAssistantSettingsTab.js';
import { BackupSettingsTab } from '../components/settings/BackupSettingsTab.js';
import { ImportSettingsTab } from '../components/settings/ImportSettingsTab.js';

export const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const validTabs = ['general', 'ai', 'users', 'notifications', 'homeassistant', 'backup', 'import'] as const;
  type TabType = typeof validTabs[number];

  const normalizeTab = (t: string | null): TabType => {
    if (t === 'ha') return 'homeassistant';
    if (t && (validTabs as readonly string[]).includes(t)) return t as TabType;
    return 'general';
  };

  const [activeTab, setActiveTab] = useState<TabType>(normalizeTab(searchParams.get('tab')));

  useEffect(() => {
    const tParam = searchParams.get('tab');
    if (tParam) {
      setActiveTab(normalizeTab(tParam));
    }
  }, [searchParams]);

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {lang === 'nl' ? 'Instellingen & Beheer' : 'Settings & Management'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {lang === 'nl'
            ? 'Configureer systeemparameters, AI-bonherkenning, gebruikers, meldingen, integraties en gegevensimport.'
            : 'Configure system settings, AI receipt scanner, users, notifications, integrations, and data imports.'}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        <button
          onClick={() => handleTabClick('general')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
            activeTab === 'general'
              ? 'bg-accent-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{lang === 'nl' ? 'Algemeen' : 'General'}</span>
        </button>

        <button
          onClick={() => handleTabClick('ai')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
            activeTab === 'ai'
              ? 'bg-accent-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{lang === 'nl' ? 'AI Bonherkenning' : 'AI Receipt Scanner'}</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => handleTabClick('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
              activeTab === 'users'
                ? 'bg-accent-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{lang === 'nl' ? 'Server Gebruikers (Admin)' : 'Server Users (Admin)'}</span>
          </button>
        )}

        <button
          onClick={() => handleTabClick('notifications')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
            activeTab === 'notifications'
              ? 'bg-accent-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{lang === 'nl' ? 'Meldingen' : 'Notifications'}</span>
        </button>

        <button
          onClick={() => handleTabClick('homeassistant')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
            activeTab === 'homeassistant'
              ? 'bg-accent-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Home Assistant</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => handleTabClick('backup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
              activeTab === 'backup'
                ? 'bg-accent-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{lang === 'nl' ? 'Database & Backups' : 'Database & Backups'}</span>
          </button>
        )}

        <button
          onClick={() => handleTabClick('import')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-2 transition shrink-0 ${
            activeTab === 'import'
              ? 'bg-accent-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{lang === 'nl' ? 'Gegevens Importeren' : 'Import Data'}</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'general' && <GeneralSettingsTab />}
      {activeTab === 'ai' && <AiSettingsTab />}
      {activeTab === 'users' && (isAdmin ? <UsersSettingsTab /> : <GeneralSettingsTab />)}
      {activeTab === 'notifications' && <NotificationsSettingsTab />}
      {activeTab === 'homeassistant' && (
        <HomeAssistantSettingsTab onNavigateToUsers={() => handleTabClick('general')} />
      )}
      {activeTab === 'backup' && (isAdmin ? <BackupSettingsTab /> : <GeneralSettingsTab />)}
      {activeTab === 'import' && <ImportSettingsTab />}
    </div>
  );
};
export default Settings;
