import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Plus, Edit2, Trash2, Clock, CheckCircle, Circle, ChevronLeft, ChevronRight, AlertCircle, X, Save, GripVertical, MoreVertical } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskForm from './TaskForm';

interface TrainingTask {
  id: string;
  user_id: string;
  dog_id: string;
  day_of_week: string;
  task_title: string;
  category: string;
  description: string;
  time: string;
  duration: number;
  completed: boolean;
  order?: number;
}

interface Dog {
  id: string;
  name: string;
}

interface TrainingPlanProps {
  dogId?: string;
}

const DAYS_OF_WEEK = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const CATEGORIES = [
  { id: 'obedience', name: 'Grundgehorsam', color: 'text-blue-400' },
  { id: 'socialization', name: 'Sozialisierung', color: 'text-green-400' },
  { id: 'tricks', name: 'Tricks', color: 'text-purple-400' },
  { id: 'agility', name: 'Agility', color: 'text-yellow-400' },
  { id: 'recall', name: 'Rückruf', color: 'text-red-400' },
  { id: 'other', name: 'Sonstiges', color: 'text-gray-400' }
];

const SortableTask = ({ task, onEdit, onDelete, onToggleComplete }: { 
  task: TrainingTask; 
  onEdit: (task: TrainingTask) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const getCategoryColor = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category ? category.color : 'text-gray-400';
  };
  
  const getCategoryName = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-white/5 backdrop-blur-lg rounded-lg p-4 mb-2 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="cursor-move touch-none" {...attributes} {...listeners}>
          <GripVertical className="text-gray-400" size={20} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">{task.task_title}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onToggleComplete(task.id, !task.completed)}
                className={`p-1 rounded-full transition-colors ${
                  task.completed 
                    ? 'text-green-400 hover:bg-green-500/20' 
                    : 'text-gray-400 hover:bg-white/10'
                }`}
                aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
              >
                {task.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
              </button>
              
              <button
                onClick={() => onEdit(task)}
                className="p-1 text-gray-400 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Edit task"
              >
                <Edit2 size={18} />
              </button>
              
              <button
                onClick={() => onDelete(task.id)}
                className="p-1 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
                aria-label="Delete task"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            <div className={`px-3 py-1 rounded-full text-xs bg-white/5 ${getCategoryColor(task.category)}`}>
              {getCategoryName(task.category)}
            </div>
            
            <div className="flex items-center text-xs text-gray-400">
              <Clock size={12} className="mr-1" />
              {task.time} • {task.duration} Min.
            </div>
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-300">{task.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const TrainingPlan: React.FC<TrainingPlanProps> = ({ dogId: propDogId }) => {
  const { session } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [tasks, setTasks] = useState<TrainingTask[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(propDogId || null);
  const [selectedDay, setSelectedDay] = useState<string>(DAYS_OF_WEEK[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TrainingTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // For drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (session) {
      fetchUserDogs();
    }
  }, [session]);

  useEffect(() => {
    if (selectedDogId) {
      fetchTasks();
    }
  }, [selectedDogId]);

  async function fetchUserDogs() {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name')
        .eq('owner_id', session?.user.id);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setDogs(data);
        if (!selectedDogId) {
          setSelectedDogId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTasks() {
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('order', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }

  async function handleSaveTask(task: Omit<TrainingTask, 'id' | 'user_id'>) {
    if (!session || !selectedDogId) return;
    
    try {
      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from('training_plans')
          .update({
            task_title: task.task_title,
            category: task.category,
            description: task.description,
            time: task.time,
            duration: task.duration,
            day_of_week: task.day_of_week
          })
          .eq('id', editingTask.id);
          
        if (error) throw error;
      } else {
        // Get max order for the day
        const dayTasks = tasks.filter(t => t.day_of_week === task.day_of_week);
        const maxOrder = dayTasks.length > 0 
          ? Math.max(...dayTasks.map(t => t.order || 0)) 
          : 0;
        
        // Create new task
        const { error } = await supabase
          .from('training_plans')
          .insert({
            user_id: session.user.id,
            dog_id: selectedDogId,
            task_title: task.task_title,
            category: task.category,
            description: task.description,
            time: task.time,
            duration: task.duration,
            day_of_week: task.day_of_week,
            completed: false,
            order: maxOrder + 1
          });
          
        if (error) throw error;
      }
      
      fetchTasks();
      setShowForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Möchtest du diese Aufgabe wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', taskId);
        
      if (error) throw error;
      
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  async function handleToggleComplete(taskId: string, completed: boolean) {
    try {
      const { error } = await supabase
        .from('training_plans')
        .update({ completed })
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, completed } : task
        )
      );
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Find the tasks being reordered
    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);
    
    if (!activeTask || !overTask || activeTask.day_of_week !== overTask.day_of_week) return;
    
    // Get the tasks for this day
    const dayTasks = tasks.filter(t => t.day_of_week === activeTask.day_of_week);
    
    // Find the indices
    const oldIndex = dayTasks.findIndex(t => t.id === active.id);
    const newIndex = dayTasks.findIndex(t => t.id === over.id);
    
    // Reorder the day's tasks
    const newDayTasks = arrayMove(dayTasks, oldIndex, newIndex);
    
    // Update the order property
    const updatedDayTasks = newDayTasks.map((task, index) => ({
      ...task,
      order: index + 1
    }));
    
    // Update the full tasks array
    const updatedTasks = tasks.map(task => {
      if (task.day_of_week === activeTask.day_of_week) {
        const updatedTask = updatedDayTasks.find(t => t.id === task.id);
        return updatedTask || task;
      }
      return task;
    });
    
    // Update local state
    setTasks(updatedTasks);
    
    // Update in database
    try {
      // Update each task's order
      for (const task of updatedDayTasks) {
        await supabase
          .from('training_plans')
          .update({ order: task.order })
          .eq('id', task.id);
      }
    } catch (error) {
      console.error('Error updating task order:', error);
      // Revert to original order on error
      fetchTasks();
    }
  }

  const getTasksByDay = (day: string) => {
    return tasks
      .filter(task => task.day_of_week === day)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getCompletionPercentage = (day: string) => {
    const dayTasks = getTasksByDay(day);
    if (dayTasks.length === 0) return 0;
    
    const completedTasks = dayTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / dayTasks.length) * 100);
  };

  const navigateToPreviousWeek = () => {
    setCurrentWeekStart(prevDate => addDays(prevDate, -7));
  };

  const navigateToNextWeek = () => {
    setCurrentWeekStart(prevDate => addDays(prevDate, 7));
  };

  const formatWeekDay = (day: string, index: number) => {
    const date = addDays(currentWeekStart, index);
    return `${day}, ${format(date, 'd. MMM', { locale: de })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (dogs.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Kein Hund gefunden</h3>
        <p className="text-gray-400 mb-6">
          Bitte füge zuerst einen Hund zu deinem Profil hinzu, um einen Trainingsplan zu erstellen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold mb-2">Trainingsplan</h2>
        
        <div className="flex flex-wrap gap-3">
          {dogs.map(dog => (
            <button
              key={dog.id}
              onClick={() => setSelectedDogId(dog.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedDogId === dog.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {dog.name}
            </button>
          ))}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 flex items-center justify-between">
        <button
          onClick={navigateToPreviousWeek}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h3 className="font-semibold">
          {format(currentWeekStart, 'dd. MMMM', { locale: de })} - {format(addDays(currentWeekStart, 6), 'dd. MMMM yyyy', { locale: de })}
        </h3>
        
        <button
          onClick={navigateToNextWeek}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Next week"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Mobile View - Day Selector and Tasks */}
      {isMobile && (
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 overflow-x-auto">
            <div className="flex space-x-2">
              {DAYS_OF_WEEK.map((day, index) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors ${
                    selectedDay === day
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">{day}</div>
                    <div className="text-xs text-gray-400">{format(addDays(currentWeekStart, index), 'd.MM')}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{formatWeekDay(selectedDay, DAYS_OF_WEEK.indexOf(selectedDay))}</h3>
              
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowForm(true);
                  setSelectedDay(selectedDay);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Aufgabe
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Fortschritt</span>
                <span>{getCompletionPercentage(selectedDay)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getCompletionPercentage(selectedDay)}%` }}
                />
              </div>
            </div>
            
            {/* Tasks */}
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={getTasksByDay(selectedDay).map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {getTasksByDay(selectedDay).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Keine Aufgaben für diesen Tag
                  </div>
                ) : (
                  getTasksByDay(selectedDay).map(task => (
                    <SortableTask
                      key={task.id}
                      task={task}
                      onEdit={setEditingTask}
                      onDelete={handleDeleteTask}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))
                )}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}

      {/* Desktop View - Week Grid */}
      {!isMobile && (
        <div className="grid grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day, index) => (
            <div key={day} className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{day}</h3>
                <div className="text-sm text-gray-400">
                  {format(addDays(currentWeekStart, index), 'd. MMM', { locale: de })}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Fortschritt</span>
                  <span>{getCompletionPercentage(day)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getCompletionPercentage(day)}%` }}
                  />
                </div>
              </div>
              
              {/* Tasks */}
              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={getTasksByDay(day).map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {getTasksByDay(day).map(task => (
                      <SortableTask
                        key={task.id}
                        task={task}
                        onEdit={setEditingTask}
                        onDelete={handleDeleteTask}
                        onToggleComplete={handleToggleComplete}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
              
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowForm(true);
                  setSelectedDay(day);
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus size={18} className="mr-2" />
                Aufgabe hinzufügen
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Task Form Modal */}
      <AnimatePresence>
        {showForm && (
          <TaskForm
            onClose={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
            onSave={handleSaveTask}
            task={editingTask}
            selectedDay={selectedDay}
            categories={CATEGORIES}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainingPlan;