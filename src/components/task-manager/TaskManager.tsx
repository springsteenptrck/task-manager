'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Tag, AlertCircle, Mic, MicOff, Trash2, CheckCircle } from 'lucide-react';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import TaskCalendar from './TaskCalendar';

interface Task {
  id?: number;
  text: string;
  category: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate: string;
  dueDateTimestamp: number;
  completed?: boolean;
  createdAt?: string;
}

// Define the SpeechRecognition type
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechRecognition: new () => SpeechRecognition;
  }
}

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { add, getAll, update, remove, error, isInitialized } = useIndexedDB<Task>('tasks');

  // Load tasks from IndexedDB on component mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await getAll();
        setTasks(storedTasks.sort((a, b) => 
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        ));
      } catch (err) {
        console.error('Error loading tasks:', err);
      }
    };
    loadTasks();
  }, [getAll]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
      }
    };
  }, []);

  const processNaturalLanguage = useCallback((text: string): Omit<Task, 'id'> => {
    const priorities = ['urgent', 'high', 'medium', 'low'] as const;
    // Updated date pattern to handle more formats
    const datePattern = /(today|tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{4})?)/i;
    const timePattern = /(\d{1,2}:\d{2}(?:am|pm)?|\d{1,2}(?:am|pm))/i;
  
    const priority = (priorities.find(p => text.toLowerCase().includes(p)) || 'medium') as Task['priority'];
    const dateMatch = text.match(datePattern);
    const date = dateMatch?.[1].toLowerCase() || 'today';
    const timeMatch = text.match(timePattern);
    const time = timeMatch?.[1] || '';
    
    let category = 'General';
    if (text.match(/call|meet|zoom|chat/i)) category = 'Meeting';
    if (text.match(/review|check|analyze/i)) category = 'Review';
    if (text.match(/create|make|build|develop/i)) category = 'Development';
    if (text.match(/email|send|write/i)) category = 'Communication';
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    const currentYear = today.getFullYear();
  
    const daysOfWeek = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };
  
    // Handle specific month and day format
    const monthNames = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
  
    if (date.match(/^(?:january|february|march|april|may|june|july|august|september|october|november|december)/i)) {
      const parts = date.replace(/(?:st|nd|rd|th)/, '').split(/[,\s]+/);
      const month = monthNames[parts[0].toLowerCase() as keyof typeof monthNames];
      const day = parseInt(parts[1]);
      const year = parts[2] ? parseInt(parts[2]) : currentYear;
      
      targetDate.setFullYear(year);
      targetDate.setMonth(month);
      targetDate.setDate(day);
    } else if (date.includes('/')) {
      const [month, day, year] = date.split('/').map(num => parseInt(num));
      targetDate.setMonth(month - 1);
      targetDate.setDate(day);
      if (year) targetDate.setFullYear(year);
    } else if (date === 'tomorrow') {
      targetDate.setDate(today.getDate() + 1);
    } else if (date === 'next week') {
      targetDate.setDate(today.getDate() + 7);
    } else if (Object.keys(daysOfWeek).includes(date)) {
      const targetDay = daysOfWeek[date as keyof typeof daysOfWeek];
      const currentDay = today.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      targetDate.setDate(today.getDate() + daysToAdd);
    }
  
    if (time) {
      const [hours, minutes] = time.toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)?.slice(1) || [];
      if (hours) {
        let hour = parseInt(hours);
        const minute = parseInt(minutes || '0');
        const period = time.toLowerCase().includes('pm');
        
        if (period && hour !== 12) hour += 12;
        if (!period && hour === 12) hour = 0;
        
        targetDate.setHours(hour, minute, 0, 0);
      }
    }
  
    const formattedDate = targetDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  
    return {
      text,
      category,
      priority,
      dueDate: `${formattedDate}${time ? ' at ' + time : ''}`,
      dueDateTimestamp: targetDate.getTime(),
      completed: false,
      createdAt: new Date().toISOString()
    };
  }, []);

  const processTask = useCallback(async (text: string) => {
    if (!text.trim()) {
      setProcessing(false);
      return;
    }

    setProcessing(true);
    try {
      const newTask = processNaturalLanguage(text);
      const savedTask = await add(newTask);
      setTasks(prev => [savedTask, ...prev]);
      setInputText('');
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Failed to save task. Please try again.');
    } finally {
      setProcessing(false);
      setIsListening(false);
    }
  }, [add, processNaturalLanguage]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    processTask(inputText);
  }, [inputText, processTask]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setInputText(text);
        processTask(text);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setProcessing(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, processTask]);


  const handleEditTask = async (task: Task) => {
    try {
      const updatedTask = { ...task, ...processNaturalLanguage(task.text) };
      await update(task.id!, updatedTask);
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await remove(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const getPriorityColor = (priority: Task['priority']): string => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || colors.medium;
  };

  if (!isInitialized) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
          <p>Initializing database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>Error: {error}</p>
          <p>Please make sure your browser supports IndexedDB.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <TaskCalendar
        tasks={tasks}
        onEditTask={handleEditTask}
        onDeleteTask={(task) => task.id && handleDeleteTask(task.id)}
      />
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Smart Task Manager</h1>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your task or click the microphone to speak"
              className="flex-1 p-4 border rounded-lg pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={processing || isListening}
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`px-4 py-2 rounded transition-colors ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              type="submit"
              disabled={processing || isListening}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {processing ? 'Processing...' : 'Add Task'}
            </button>
          </div>
        </form>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
            <p className="text-sm text-blue-700">
              Click the microphone button and speak your task. Try phrases like: 
              &quot;Urgent: Review project proposal by tomorrow 5pm&quot; or 
              &quot;Schedule team meeting next week&quot;
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {tasks
            .filter(task => 
              task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task.priority.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task.dueDate.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(task => (
            <div 
              key={task.id} 
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow bg-white ${
                task.completed ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={task.completed ? 'line-through text-gray-500' : ''}>
                    {task.text}
                  </h3>
                  
                  <div className="flex gap-2 mt-1">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Tag className="h-4 w-4" />
                      {task.category}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {task.dueDate}
                    </span>
                    <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => task.id && handleDeleteTask(task.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskManager; 