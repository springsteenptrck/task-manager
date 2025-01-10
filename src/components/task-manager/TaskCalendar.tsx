// TaskCalendar.tsx
'use client';

import React, { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, PencilIcon, Trash2 } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";

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

interface TaskCalendarProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

const TaskCalendar = ({ tasks, onEditTask, onDeleteTask }: TaskCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editText, setEditText] = useState('');

  const getTasksForDate = (date: Date): Task[] => {
    if (!date) return [];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return tasks.filter(task => {
      const taskDate = new Date(task.dueDateTimestamp);
      return taskDate >= startOfDay && taskDate <= endOfDay;
    });
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const handleEditStart = (task: Task) => {
    setEditingTask(task);
    setEditText(task.text);
  };

  const handleEditSubmit = () => {
    if (!editingTask || !editText.trim()) return;
    onEditTask({ ...editingTask, text: editText });
    setEditingTask(null);
    setEditText('');
  };

  const handleEditCancel = () => {
    setEditingTask(null);
    setEditText('');
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

  const formatTaskTime = (dueDate: string): string => {
    const timeMatch = dueDate.match(/at (.+)$/);
    return timeMatch ? timeMatch[1] : '';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <CalendarIcon className="mr-2 h-5 w-5" />
        <h2 className="text-xl font-semibold">Task Calendar</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{ 
              hasTask: (date) => getTasksForDate(date).length > 0,
              today: (date) => isSameDay(date, new Date())
            }}
            modifiersClassNames={{
              hasTask: "bg-blue-50 font-bold hover:bg-blue-100",
              today: "bg-yellow-50"
            }}
            fromDate={new Date()}
            defaultMonth={selectedDate}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-lg">
            Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
          </h3>
          
          {selectedDateTasks.length > 0 ? (
            <div className="space-y-2">
              {selectedDateTasks.map(task => (
                <div 
                  key={task.id}
                  className={`p-3 rounded-md border ${
                    task.completed ? 'opacity-75' : ''
                  }`}
                >
                  {editingTask?.id === task.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleEditSubmit}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className={task.completed ? 'line-through text-gray-500' : ''}>
                            {task.text}
                          </p>
                          {formatTaskTime(task.dueDate) && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                              {formatTaskTime(task.dueDate)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                            {task.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditStart(task)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tasks scheduled for this date</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCalendar;