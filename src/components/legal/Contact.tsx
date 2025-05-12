import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, CheckCircle, Mail, MessageSquare, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Contact = () => {
  const { session } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'general',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (session) {
      fetchUserProfile();
    }
  }, [session]);

  async function fetchUserProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      
      setUserProfile(data);
      setFormData(prev => ({
        ...prev,
        name: data.full_name || data.username || '',
        email: session?.user.email || ''
      }));
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create support ticket
      const { error: submitError } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: session?.user?.id || null,
          name: formData.name,
          email: formData.email,
          topic: formData.topic,
          message: formData.message,
          status: 'open'
        }]);

      if (submitError) throw submitError;

      // Send confirmation notification if user is logged in
      if (session?.user?.id) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([{
            user_id: session.user.id,
            title: 'Support-Anfrage eingegangen',
            message: 'Deine Support-Anfrage wurde erfolgreich übermittelt. Wir werden uns so schnell wie möglich bei dir melden.',
            type: 'support',
            is_read: false
          }]);

        if (notificationError) console.error('Error creating notification:', notificationError);
      }

      setSuccess(true);
      setFormData({
        name: userProfile?.full_name || userProfile?.username || '',
        email: session?.user?.email || '',
        topic: 'general',
        message: ''
      });
    } catch (err) {
      console.error('Error submitting support ticket:', err);
      setError('Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Support & Kontakt</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <Mail className="text-purple-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">E-Mail</h3>
          <p className="text-gray-300 mb-4">Schreibe uns direkt eine E-Mail</p>
          <a href="mailto:support@dogmania.de" className="text-purple-400 hover:text-purple-300 transition-colors">
            support@dogmania.de
          </a>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <MessageSquare className="text-purple-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Live-Chat</h3>
          <p className="text-gray-300 mb-4">Chatte mit unserem Support-Team</p>
          <button className="text-purple-400 hover:text-purple-300 transition-colors">
            Chat starten
          </button>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <Clock className="text-purple-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Öffnungszeiten</h3>
          <p className="text-gray-300 mb-4">Unser Support ist für dich da</p>
          <p className="text-sm text-gray-400">
            Montag - Freitag<br />
            9:00 - 18:00 Uhr
          </p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Kontaktformular</h2>
          <p className="text-gray-300">
            Hast du Fragen oder Anregungen? Wir freuen uns auf deine Nachricht!
          </p>
        </div>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
            <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />
            <h3 className="text-xl font-semibold mb-2">Nachricht gesendet!</h3>
            <p className="text-gray-300 mb-6">
              Vielen Dank für deine Nachricht. Wir haben eine Bestätigung an deine E-Mail-Adresse gesendet und werden uns so schnellstmöglich bei dir melden.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
            >
              Neue Anfrage stellen
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center">
                <AlertTriangle size={20} className="mr-2" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={!!session}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  E-Mail
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={!!session}
                />
              </div>
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium mb-2">
                Thema
              </label>
              <select
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="general">Allgemeine Anfrage</option>
                <option value="technical">Technisches Problem</option>
                <option value="trainer">Frage zu Trainern</option>
                <option value="course">Kursfrage</option>
                <option value="billing">Zahlungen & Abonnement</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Nachricht
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={20} className="mr-2" />
                  Nachricht senden
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Contact;