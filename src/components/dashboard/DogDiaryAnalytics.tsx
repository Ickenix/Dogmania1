import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, Smile, Tag, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import DogDiaryMoodChart from './DogDiaryMoodChart';

interface DiaryEntry {
  id: string;
  dog_id: string;
  title: string;
  content: string | null;
  entry_date: string;
  entry_type: string;
  mood_rating: number;
  image_url: string | null;
  created_at: string;
}

interface DogDiaryAnalyticsProps {
  dogId: string;
  dogName: string;
}

const DogDiaryAnalytics: React.FC<DogDiaryAnalyticsProps> = ({ dogId, dogName }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month');

  useEffect(() => {
    if (dogId) {
      fetchEntries();
    }
  }, [dogId, timeRange, currentDate]);

  async function fetchEntries() {
    if (!dogId) {
      console.error('No dog ID provided');
      setLoading(false);
      return;
    }

    try {
      let startDate, endDate;
      
      if (timeRange === 'month') {
        startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      } else {
        const year = currentDate.getFullYear();
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
      }
      
      const { data, error } = await supabase
        .from('diary_entries')
        .select('id, dog_id, title, content, entry_date, entry_type, mood_rating, image_url, created_at')
        .eq('dog_id', dogId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching diary entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  const getMoodEmoji = (rating: number) => {
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😊';
      case 4: return '😃';
      case 5: return '🥰';
      default: return '😊';
    }
  };

  const getEntryTypeName = (type: string) => {
    switch (type) {
      case 'training': return 'Training';
      case 'health': return 'Health';
      case 'nutrition': return 'Nutrition';
      case 'behavior': return 'Behavior';
      case 'experience': return 'Experience';
      case 'other': return 'Other';
      default: return type;
    }
  };

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'training': return 'bg-blue-500/20 text-blue-400';
      case 'health': return 'bg-green-500/20 text-green-400';
      case 'nutrition': return 'bg-yellow-500/20 text-yellow-400';
      case 'behavior': return 'bg-red-500/20 text-red-400';
      case 'experience': return 'bg-purple-500/20 text-purple-400';
      case 'other': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const calculateAverageMood = () => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, entry) => acc + entry.mood_rating, 0);
    return sum / entries.length;
  };

  const getMostCommonCategory = () => {
    if (entries.length === 0) return null;
    
    const categoryCounts: Record<string, number> = {};
    entries.forEach(entry => {
      categoryCounts[entry.entry_type] = (categoryCounts[entry.entry_type] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostCommonCategory = '';
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCategory = category;
      }
    });
    
    return { category: mostCommonCategory, count: maxCount };
  };

  const getMoodTrend = () => {
    if (entries.length < 2) return 'stable';
    
    const firstHalf = entries.slice(0, Math.floor(entries.length / 2));
    const secondHalf = entries.slice(Math.floor(entries.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((acc, entry) => acc + entry.mood_rating, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((acc, entry) => acc + entry.mood_rating, 0) / secondHalf.length;
    
    const difference = secondHalfAvg - firstHalfAvg;
    
    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
  };

  const getMoodTrendIcon = () => {
    const trend = getMoodTrend();
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '📊';
  };

  const getMoodByDay = () => {
    const moodByDay: Record<string, number[]> = {
      'Mo': [],
      'Di': [],
      'Mi': [],
      'Do': [],
      'Fr': [],
      'Sa': [],
      'So': []
    };
    
    entries.forEach(entry => {
      const date = new Date(entry.entry_date);
      const dayOfWeek = format(date, 'EEEEEE', { locale: de });
      moodByDay[dayOfWeek].push(entry.mood_rating);
    });
    
    const averageMoodByDay: Record<string, number> = {};
    
    Object.entries(moodByDay).forEach(([day, moods]) => {
      if (moods.length === 0) {
        averageMoodByDay[day] = 0;
      } else {
        const sum = moods.reduce((acc, mood) => acc + mood, 0);
        averageMoodByDay[day] = sum / moods.length;
      }
    });
    
    return averageMoodByDay;
  };

  const getCategoryDistribution = () => {
    const distribution: Record<string, number> = {};
    
    entries.forEach(entry => {
      distribution[entry.entry_type] = (distribution[entry.entry_type] || 0) + 1;
    });
    
    return distribution;
  };

  const navigatePrevious = () => {
    if (timeRange === 'month') {
      setCurrentDate(prevDate => subMonths(prevDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    }
  };

  const navigateNext = () => {
    if (timeRange === 'month') {
      setCurrentDate(prevDate => addMonths(prevDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
    }
  };

  const navigateToCurrentDate = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const averageMood = calculateAverageMood();
  const mostCommonCategory = getMostCommonCategory();
  const moodByDay = getMoodByDay();
  const categoryDistribution = getCategoryDistribution();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mood Analysis for {dogName}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeRange === 'month' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeRange === 'year' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-xl font-semibold">
            {timeRange === 'month' 
              ? format(currentDate, 'MMMM yyyy', { locale: de })
              : format(currentDate, 'yyyy', { locale: de })}
          </h3>
          <div className="flex items-center">
            <button
              onClick={navigateToCurrentDate}
              className="text-sm text-purple-400 hover:text-purple-300 mr-4"
            >
              Today
            </button>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Smile size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No data available</h3>
            <p className="text-gray-400">
              No diary entries found for this time period.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Average Mood</h4>
                <div className="flex items-center">
                  <span className="text-3xl mr-2">{getMoodEmoji(Math.round(averageMood))}</span>
                  <span className="text-2xl font-bold">{averageMood.toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {getMoodTrendIcon()} Trend: {getMoodTrend() === 'improving' ? 'Improving' : getMoodTrend() === 'declining' ? 'Declining' : 'Stable'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Most Common Category</h4>
                {mostCommonCategory && (
                  <>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm ${getEntryTypeColor(mostCommonCategory.category)}`}>
                        {getEntryTypeName(mostCommonCategory.category)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      {mostCommonCategory.count} entries in this category
                    </p>
                  </>
                )}
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Entries</h4>
                <div className="text-2xl font-bold">
                  {entries.length}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  <Calendar size={14} className="inline mr-1" />
                  {timeRange === 'month' ? 'this month' : 'this year'}
                </p>
              </div>
            </div>
            
            {/* Mood by Day of Week */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Mood by Day of Week</h4>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(moodByDay).map(([day, avgMood]) => (
                  <div key={day} className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-sm font-medium mb-2">{day}</div>
                    {avgMood > 0 ? (
                      <>
                        <div className="text-2xl mb-1">{getMoodEmoji(Math.round(avgMood))}</div>
                        <div className="text-xs text-gray-400">{avgMood.toFixed(1)}</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400 py-4">No data</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Category Distribution */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Category Distribution</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(categoryDistribution).map(([category, count]) => (
                  <div key={category} className="bg-white/5 rounded-lg p-3">
                    <div className={`px-3 py-1 rounded-full text-sm inline-block mb-2 ${getEntryTypeColor(category)}`}>
                      {getEntryTypeName(category)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">{count}</span>
                      <span className="text-xs text-gray-400">
                        {Math.round((count / entries.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full mt-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(count / entries.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mood Timeline */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Mood Timeline</h4>
              <DogDiaryMoodChart entries={entries} days={timeRange === 'month' ? 30 : 365} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DogDiaryAnalytics;