import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { Bell, X, Check, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

const NotificationBell = () => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      setupRealtimeSubscription();

      // Close dropdown when clicking outside
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [session]);

  function setupRealtimeSubscription() {
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${session?.user.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function fetchNotifications() {
    setIsLoading(true);
    setError(null);

    try {
      // Check connection before attempting to fetch
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error('Unable to connect to the database. Please check your connection.');
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session?.user.id)
        .eq('is_read', false);

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' Jahre';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' Monate';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' Tage';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' Stunden';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' Minuten';
    
    return Math.floor(seconds) + ' Sekunden';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} className="text-blue-400" />;
      default:
        return <Bell size={16} className="text-purple-400" />;
    }
  };

  if (!session) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Benachrichtigungen"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-blue-900/50 backdrop-blur-lg rounded-xl shadow-xl overflow-hidden z-50 max-h-[80vh] flex flex-col"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Benachrichtigungen</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Alle als gelesen markieren
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-grow">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 text-sm">{error}</p>
                  <button
                    onClick={fetchNotifications}
                    className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Erneut versuchen
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  Keine Benachrichtigungen
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 border-b border-white/10 hover:bg-white/5 transition-colors ${
                      !notification.is_read ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-1">{notification.title}</p>
                          <p className="text-sm text-gray-400">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            vor {getTimeAgo(notification.created_at)}
                          </p>
                          {notification.action_url && (
                            <Link 
                              to={notification.action_url}
                              className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block"
                              onClick={() => {
                                setShowDropdown(false);
                                markAsRead(notification.id);
                              }}
                            >
                              Anzeigen
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-purple-400 hover:text-purple-300"
                            aria-label="Als gelesen markieren"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          aria-label="Löschen"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;