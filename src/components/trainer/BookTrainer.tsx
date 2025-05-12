import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, MapPin, Star, X, Check } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BookTrainerProps {
  trainerId: string;
  trainerName: string;
  onClose: () => void;
}

const BookTrainer: React.FC<BookTrainerProps> = ({ trainerId, trainerName, onClose }) => {
  const { session } = useAuth();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDog, setSelectedDog] = useState<string>('');
  const [dogs, setDogs] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchTimeSlots();
    if (session) {
      fetchUserDogs();
    }
  }, [selectedDate, trainerId, session]);

  async function fetchTimeSlots() {
    try {
      const startDate = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const endDate = format(addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('is_available', true)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserDogs() {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name')
        .eq('owner_id', session?.user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setDogs(data || []);
      if (data && data.length > 0) {
        setSelectedDog(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
    }
  }

  async function handleBooking() {
    if (!selectedSlot || !session) return;

    try {
      setBookingLoading(true);

      // Create booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: session.user.id,
          trainer_id: trainerId,
          date: selectedSlot.date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          notes: notes,
          status: 'pending'
        });

      if (bookingError) throw bookingError;

      // Update availability
      const { error: availabilityError } = await supabase
        .from('availability')
        .update({ is_available: false })
        .eq('id', selectedSlot.id);

      if (availabilityError) throw availabilityError;

      // Create notification for trainer
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .select('user_id')
        .eq('id', trainerId)
        .single();

      if (trainerError) throw trainerError;

      if (trainerData) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: trainerData.user_id,
            title: 'Neue Buchungsanfrage',
            message: `Ein neuer Termin wurde für ${format(new Date(selectedSlot.date), 'dd.MM.yyyy')} um ${selectedSlot.start_time.slice(0, 5)} Uhr angefragt.`,
            type: 'booking',
            action_url: '/trainer/bookings'
          });

        if (notificationError) throw notificationError;
      }

      setBookingSuccess(true);
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setBookingLoading(false);
    }
  }

  const navigateToPreviousWeek = () => {
    const prevWeek = new Date(selectedDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setSelectedDate(prevWeek);
  };

  const navigateToNextWeek = () => {
    const nextWeek = new Date(selectedDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setSelectedDate(nextWeek);
  };

  const groupSlotsByDate = () => {
    const grouped: Record<string, TimeSlot[]> = {};
    
    timeSlots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    
    return grouped;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Training buchen bei {trainerName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {bookingSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Buchung erfolgreich!</h3>
              <p className="text-gray-300 mb-6">
                Deine Buchungsanfrage wurde erfolgreich übermittelt. Der Trainer wird deine Anfrage prüfen und bestätigen.
              </p>
              <button
                onClick={onClose}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Schließen
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={navigateToPreviousWeek}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Vorherige Woche
                </button>
                <div className="text-center">
                  <h3 className="font-semibold">
                    {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'd. MMMM', { locale: de })} - {format(addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6), 'd. MMMM yyyy', { locale: de })}
                  </h3>
                </div>
                <button
                  onClick={navigateToNextWeek}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Nächste Woche
                </button>
              </div>

              {/* Calendar View */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <div key={day} className="text-center font-medium">
                    {day}
                  </div>
                ))}
                
                {Array.from({ length: 7 }).map((_, index) => {
                  const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), index);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const daySlots = groupSlotsByDate()[dateStr] || [];
                  
                  return (
                    <div
                      key={dateStr}
                      className="bg-white/5 rounded-lg p-2 min-h-[100px]"
                    >
                      <div className="text-sm mb-2 text-center">
                        {format(date, 'd. MMM', { locale: de })}
                      </div>
                      
                      <div className="space-y-1">
                        {daySlots.length === 0 ? (
                          <div className="text-xs text-gray-400 text-center">Keine Termine</div>
                        ) : (
                          daySlots.map(slot => (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlot(slot)}
                              className={`w-full text-xs rounded px-2 py-1 transition-colors ${
                                selectedSlot?.id === slot.id
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white/10 hover:bg-white/20'
                              }`}
                            >
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedSlot && (
                <div className="space-y-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Ausgewählter Termin</h3>
                    <div className="flex items-center text-sm text-gray-300 mb-2">
                      <Calendar size={16} className="mr-2 text-purple-400" />
                      {format(new Date(selectedSlot.date), 'EEEE, d. MMMM yyyy', { locale: de })}
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <Clock size={16} className="mr-2 text-purple-400" />
                      {selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)} Uhr
                    </div>
                  </div>

                  {dogs.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Für welchen Hund ist das Training?</label>
                      <select
                        value={selectedDog}
                        onChange={(e) => setSelectedDog(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {dogs.map(dog => (
                          <option key={dog.id} value={dog.id}>{dog.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Notizen für den Trainer</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Beschreibe kurz, worum es beim Training gehen soll..."
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot || bookingLoading}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {bookingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Wird gebucht...
                    </>
                  ) : (
                    <>
                      <Calendar size={18} className="mr-2" />
                      Termin buchen
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookTrainer;