import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, Check, X, AlertTriangle, Plus, User, MapPin } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';

interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  user: {
    username: string;
    avatar_url: string;
    id: string;
  };
}

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface TrainerBookingsProps {
  trainerId?: string;
}

const TrainerBookings: React.FC<TrainerBookingsProps> = ({ trainerId }) => {
  const { session } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00'
  });
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled

  useEffect(() => {
    if (trainerId) {
      fetchBookings();
      fetchTimeSlots();
      setupRealtimeSubscription();
    }
  }, [trainerId, currentWeekStart, filter]);

  function setupRealtimeSubscription() {
    const bookingsSubscription = supabase
      .channel('bookings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `trainer_id=eq.${trainerId}`
      }, () => {
        fetchBookings();
      })
      .subscribe();

    const availabilitySubscription = supabase
      .channel('availability_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'availability',
        filter: `trainer_id=eq.${trainerId}`
      }, () => {
        fetchTimeSlots();
      })
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
      availabilitySubscription.unsubscribe();
    };
  }

  async function fetchBookings() {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          user:user_id (id, username, avatar_url)
        `)
        .eq('trainer_id', trainerId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
        
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTimeSlots() {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  }

  async function addTimeSlot() {
    try {
      const { error } = await supabase
        .from('availability')
        .insert({
          trainer_id: trainerId,
          date: newSlot.date,
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          is_available: true
        });

      if (error) throw error;
      fetchTimeSlots();
      setShowAddSlot(false);
    } catch (error) {
      console.error('Error adding time slot:', error);
    }
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  }

  async function deleteTimeSlot(slotId: string) {
    try {
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
      fetchTimeSlots();
    } catch (error) {
      console.error('Error deleting time slot:', error);
    }
  }

  const navigateToPreviousWeek = () => {
    setCurrentWeekStart(prevDate => subMonths(prevDate, 1));
  };

  const navigateToNextWeek = () => {
    setCurrentWeekStart(prevDate => addMonths(prevDate, 1));
  };

  const navigateToCurrentWeek = () => {
    setCurrentWeekStart(startOfMonth(new Date()));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'confirmed':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      case 'completed':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ausstehend';
      case 'confirmed':
        return 'Bestätigt';
      case 'cancelled':
        return 'Abgesagt';
      case 'completed':
        return 'Abgeschlossen';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Buchungen & Verfügbarkeit</h2>
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Alle Buchungen</option>
            <option value="pending">Ausstehend</option>
            <option value="confirmed">Bestätigt</option>
            <option value="completed">Abgeschlossen</option>
            <option value="cancelled">Abgesagt</option>
          </select>
          <button
            onClick={() => setShowAddSlot(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Zeitfenster hinzufügen
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
        <button
          onClick={navigateToPreviousWeek}
          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          Vorheriger Monat
        </button>
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold">
            {format(currentWeekStart, 'MMMM yyyy', { locale: de })}
          </h3>
          <button
            onClick={navigateToCurrentWeek}
            className="text-sm text-purple-400 hover:text-purple-300 mt-1"
          >
            Aktueller Monat
          </button>
        </div>
        <button
          onClick={navigateToNextWeek}
          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          Nächster Monat
        </button>
      </div>

      {/* Calendar View */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <div className="grid grid-cols-7 gap-4">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="text-center font-medium">
              {day}
            </div>
          ))}
          {eachDayOfInterval({
            start: startOfMonth(currentWeekStart),
            end: endOfMonth(currentWeekStart)
          }).map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayBookings = bookings.filter(b => b.date === dateStr);
            const daySlots = timeSlots.filter(s => s.date === dateStr);
            const isToday = isSameDay(date, new Date());
            const isCurrentMonth = isSameMonth(date, currentWeekStart);
            
            // Calculate the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
            const dayOfWeek = date.getDay();
            // Adjust for the first day of the month
            const isFirstDay = date.getDate() === 1;
            // Calculate the offset for the first day of the month
            const firstDayOffset = isFirstDay ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1) : 0;
            
            // If it's the first day of the month and not a Monday, add empty cells
            if (isFirstDay && firstDayOffset > 0 && index === 0) {
              const emptyCells = Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[100px]"></div>
              ));
              return [...emptyCells, (
                <div
                  key={dateStr}
                  className={`min-h-[100px] bg-white/5 rounded-lg p-2 ${
                    isToday ? 'ring-2 ring-purple-500' : ''
                  } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                >
                  <div className="text-sm mb-2 font-medium">
                    {format(date, 'd')}
                  </div>
                  
                  {/* Available time slots */}
                  {daySlots.map(slot => (
                    <div
                      key={slot.id}
                      className="relative mb-1 text-xs bg-purple-500/20 text-purple-300 rounded px-2 py-1 flex justify-between items-center"
                    >
                      <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                      <button
                        onClick={() => deleteTimeSlot(slot.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Bookings */}
                  {dayBookings.map(booking => (
                    <div
                      key={booking.id}
                      className={`text-xs rounded px-2 py-1 mb-1 ${getStatusColor(booking.status)}`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
                        <span className="font-medium">{getStatusLabel(booking.status)}</span>
                      </div>
                      <div className="mt-1 truncate">{booking.user.username}</div>
                    </div>
                  ))}
                </div>
              )];
            }
            
            return (
              <div
                key={dateStr}
                className={`min-h-[100px] bg-white/5 rounded-lg p-2 ${
                  isToday ? 'ring-2 ring-purple-500' : ''
                } ${!isCurrentMonth ? 'opacity-50' : ''}`}
              >
                <div className="text-sm mb-2 font-medium">
                  {format(date, 'd')}
                </div>
                
                {/* Available time slots */}
                {daySlots.map(slot => (
                  <div
                    key={slot.id}
                    className="relative mb-1 text-xs bg-purple-500/20 text-purple-300 rounded px-2 py-1 flex justify-between items-center"
                  >
                    <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                    <button
                      onClick={() => deleteTimeSlot(slot.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {/* Bookings */}
                {dayBookings.map(booking => (
                  <div
                    key={booking.id}
                    className={`text-xs rounded px-2 py-1 mb-1 ${getStatusColor(booking.status)}`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
                      <span className="font-medium">{getStatusLabel(booking.status)}</span>
                    </div>
                    <div className="mt-1 truncate">{booking.user.username}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Aktuelle Buchungen</h3>
        {bookings.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-8 text-center">
            <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Keine Buchungen</h3>
            <p className="text-gray-400">
              Du hast aktuell keine {filter !== 'all' ? getStatusLabel(filter).toLowerCase() : ''} Buchungen für diese Woche.
            </p>
          </div>
        ) : (
          bookings.map(booking => (
            <div
              key={booking.id}
              className={`bg-white/5 backdrop-blur-lg rounded-lg p-4 border-l-4 ${
                booking.status === 'pending' ? 'border-yellow-500' :
                booking.status === 'confirmed' ? 'border-green-500' :
                booking.status === 'cancelled' ? 'border-red-500' :
                'border-purple-500'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    {booking.user.avatar_url ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${booking.user.avatar_url}`}
                        alt={booking.user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-purple-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{booking.user.username}</h4>
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar size={14} className="mr-1" />
                      {format(new Date(booking.date), 'EEEE, d. MMMM yyyy', { locale: de })}
                      <Clock size={14} className="ml-3 mr-1" />
                      {booking.start_time} • {booking.end_time} Uhr
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                  
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        title="Bestätigen"
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Ablehnen"
                      >
                        <X size={20} />
                      </button>
                    </>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                      className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                      title="Als abgeschlossen markieren"
                    >
                      <Check size={20} />
                    </button>
                  )}
                </div>
              </div>
              
              {booking.notes && (
                <div className="mt-4 bg-white/5 rounded-lg p-3">
                  <p className="text-sm text-gray-300">{booking.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Time Slot Modal */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Zeitfenster hinzufügen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Datum</label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Von</label>
                  <input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bis</label>
                  <input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddSlot(false)}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={addTimeSlot}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerBookings;