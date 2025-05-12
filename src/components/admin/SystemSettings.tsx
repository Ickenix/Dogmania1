import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Settings, Mail, Bell, Shield, Database, Server, Globe } from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoModeration: false,
    maintenanceMode: false,
    debugMode: false,
    contentApproval: false,
    userRegistration: true,
    premiumFeatures: true,
    analyticsTracking: true
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    
    // Here you would typically save the settings to your database
    // For now, we'll just simulate a delay
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Systemeinstellungen</h2>

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
          Einstellungen wurden erfolgreich gespeichert.
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Bell size={20} className="mr-2 text-purple-400" />
              Benachrichtigungen
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-purple-600 rounded border-white/20 bg-white/10"
                />
                <span className="ml-3">E-Mail-Benachrichtigungen aktivieren</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoModeration}
                  onChange={(e) => setSettings({ ...settings, autoModeration: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-purple-600 rounded border-white/20 bg-white/10"
                />
                <span className="ml-3">Automatische Moderation aktivieren</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Server size={20} className="mr-2 text-purple-400" />
              Systemmodus
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-purple-600 rounded border-white/20 bg-white/10"
                />
                <span className="ml-3">Wartungsmodus aktivieren</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.debugMode}
                  onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-purple-600 rounded border-white/20 bg-white/10"
                />
                <span className="ml-3">Debug-Modus aktivieren</span>
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield size={20} className="mr-2 text-purple-400" />
              Sicherheit & Moderation
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.contentApproval}
                  onChange={(e) => setSettings({ ...settings, contentApproval: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-purple-600 rounded border-white/20 bg-white/10"
                />
                <span className="ml-3">Inhalte vor Veröffentlichung prüfen</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.userRegistration}
                  onChange={(e) => setSettings({ ...settings, userRegistration: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-purple-600 rounded border-white/20 bg-white/10"
                />
                <span className="ml-3">Nutzerregistrierung erlauben</span>
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Globe size={20} className="mr-2 text-purple-400" />
              Plattform-Funktionen
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.premiumFeatures}
                  onChange={(e) => setSettings({ ...settings, premiumFeatures: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-purple-600 rounded border-white/20 bg-white/10"
                />
                <span className="ml-3">Premium-Funktionen aktivieren</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.analyticsTracking}
                  onChange={(e) => setSettings({ ...settings, analyticsTracking: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-purple-600 rounded border-white/20 bg-white/10"
                />
                <span className="ml-3">Analytics-Tracking aktivieren</span>
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Database size={20} className="mr-2 text-purple-400" />
              Datenbank-Informationen
            </h3>
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Verbindung:</span>
                <span className="text-green-400">Aktiv</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tabellen:</span>
                <span>32</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Speicherplatz:</span>
                <span>128 MB / 500 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Letzte Sicherung:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Einstellungen speichern
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;