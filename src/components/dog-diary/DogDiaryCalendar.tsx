import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DogDiaryCalendarProps {
  entries: any[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  onEditEntry: (entry: any) => void;
  onDeleteEntry: (id: string) => void;
  getCategoryColor: (category: string) => string;
  getCategoryName: (category: string) => string;
}

const DogDiaryCalendar: React.FC<DogDiaryCalendarProps> = ({
  entries,
  currentMonth,
  setCurrentMonth,
  onEditEntry,
  onDeleteEntry,
  getCategoryColor,
  getCategoryName
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const getEntriesForDay = (date: Date) => {
    return entries.filter(entry => isSameDay(new Date(entry.date), date));
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Week days */}
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, dayIdx) => {
          const dayEntries = getEntriesForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toString()}
              className={`
                min-h-[100px] p-2 rounded-lg border border-white/10
                ${isCurrentMonth ? 'bg-white/5' : 'bg-white/2'}
                ${isCurrentDay ? 'ring-2 ring-purple-500' : ''}
              `}
            >
              <div className="text-sm mb-2">
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayEntries.map(entry => (
                  <div
                    key={entry.id}
                    className={`
                      ${getCategoryColor(entry.category)}
                      p-1 rounded text-xs cursor-pointer
                      hover:opacity-80 transition-opacity
                    `}
                    onClick={() => onEditEntry(entry)}
                    title={entry.title}
                  >
                    {entry.title.length > 15 ? entry.title.substring(0, 15) + '...' : entry.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DogDiaryCalendar;