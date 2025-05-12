import React, { useState, useEffect } from 'react';
import { X, Clock, Tag, Save } from 'lucide-react';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TaskFormProps {
  onClose: () => void;
  onSave: (task: {
    task_title: string;
    category: string;
    description: string;
    time: string;
    duration: number;
    day_of_week: string;
  }) => void;
  task: {
    id: string;
    task_title: string;
    category: string;
    description: string;
    time: string;
    duration: number;
    day_of_week: string;
  } | null;
  selectedDay: string;
  categories: Category[];
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSave, task, selectedDay, categories }) => {
  const [title, setTitle] = useState(task?.task_title || '');
  const [category, setCategory] = useState(task?.category || categories[0].id);
  const [description, setDescription] = useState(task?.description || '');
  const [time, setTime] = useState(task?.time || '12:00');
  const [duration, setDuration] = useState(task?.duration?.toString() || '30');
  const [day, setDay] = useState(task?.day_of_week || selectedDay);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }
    
    if (!time) {
      newErrors.time = 'Uhrzeit ist erforderlich';
    }
    
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      newErrors.duration = 'Gültige Dauer ist erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSave({
      task_title: title,
      category,
      description,
      time,
      duration: Number(duration),
      day_of_week: day
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">
            {task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Titel*</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 bg-white/10 border ${
                errors.title ? 'border-red-500' : 'border-white/20'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="z.B. Sitz-Training"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Kategorie</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    category === cat.id
                      ? 'bg-purple-600 text-white'
                      : `bg-white/10 hover:bg-white/20 ${cat.color}`
                  }`}
                >
                  <Tag size={16} className="mr-2" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Uhrzeit*</label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 bg-white/10 border ${
                    errors.time ? 'border-red-500' : 'border-white/20'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
                {errors.time && (
                  <p className="mt-1 text-sm text-red-500">{errors.time}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Dauer (Min.)*</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                className={`w-full px-4 py-2 bg-white/10 border ${
                  errors.duration ? 'border-red-500' : 'border-white/20'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Tag</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Beschreibe die Trainingsaufgabe..."
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
            >
              <Save size={18} className="mr-2" />
              Speichern
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TaskForm;