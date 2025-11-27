
import React, { useState } from 'react';
import { Task, Roommate, TaskStatus } from '../types';
import { Calendar, Bell, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import { generateReminderMessage } from '../services/geminiService';

interface TasksProps {
  tasks: Task[];
  roommates: Roommate[];
  onAddTask: (t: Task) => void;
  onUpdateTask: (t: Task) => void;
}

const Tasks: React.FC<TasksProps> = ({ tasks, roommates, onAddTask, onUpdateTask }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [loadingReminderId, setLoadingReminderId] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<{id: string, msg: string} | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    assignedTo: roommates[0]?.id || '',
    dueDate: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: Date.now().toString(),
      title: formData.title,
      assignedTo: formData.assignedTo,
      dueDate: formData.dueDate,
      status: TaskStatus.PENDING,
      description: formData.description
    };
    onAddTask(newTask);
    setIsAdding(false);
    setFormData({ title: '', assignedTo: roommates[0]?.id || '', dueDate: '', description: '' });
  };

  const handleSendReminder = async (task: Task) => {
    setLoadingReminderId(task.id);
    const assignee = roommates.find(r => r.id === task.assignedTo);
    
    // Calculate days overdue
    const diff = new Date().getTime() - new Date(task.dueDate).getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    
    const message = await generateReminderMessage(task.title, assignee?.name || 'Roommate', days > 0 ? days : 1);
    
    // Update task with last reminded time
    onUpdateTask({
        ...task,
        lastReminded: new Date().toISOString()
    });

    setLastNotification({ id: task.id, msg: `Sent to ${assignee?.name}: "${message}"` });
    setLoadingReminderId(null);
    
    // Clear toast after 5s
    setTimeout(() => setLastNotification(null), 5000);
  };

  const isOverdue = (dateStr: string) => {
    return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
  };

  const formatLastReminded = (isoString?: string) => {
      if (!isoString) return null;
      const date = new Date(isoString);
      return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {lastNotification && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 animate-fade-in z-50 max-w-sm">
              <Send className="w-5 h-5 text-green-400" />
              <p className="text-sm">{lastNotification.msg}</p>
          </div>
      )}

      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Tasks & Chores</h2>
            <p className="text-gray-500">Keep the house clean and organized</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-lg">
           <Calendar className="w-4 h-4" /> Assign Task
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-fade-in">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input 
                  required 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" 
                  placeholder="e.g. Clean the Kitchen" 
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select 
                  value={formData.assignedTo} 
                  onChange={e => setFormData({...formData, assignedTo: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                    {roommates.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input 
                  required 
                  type="date" 
                  value={formData.dueDate} 
                  onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" 
                />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Assign</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {tasks.map(task => {
            const assignee = roommates.find(r => r.id === task.assignedTo);
            const overdue = isOverdue(task.dueDate) && task.status !== TaskStatus.COMPLETED;
            const lastRemindedText = formatLastReminded(task.lastReminded);

            return (
                <div key={task.id} className={`bg-white p-5 rounded-xl border-l-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-md ${
                    task.status === TaskStatus.COMPLETED ? 'border-green-500 opacity-75' : overdue ? 'border-red-500' : 'border-indigo-500'
                }`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                            {task.status === TaskStatus.COMPLETED ? <CheckCircle className="w-6 h-6"/> : <Clock className="w-6 h-6"/>}
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${task.status === TaskStatus.COMPLETED ? 'line-through text-gray-500' : 'text-gray-800'}`}>{task.title}</h3>
                            <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <span className="font-medium text-indigo-600">@{assignee?.name}</span>
                                </span>
                                <span>•</span>
                                <span className={overdue ? 'text-red-500 font-bold flex items-center gap-1' : ''}>
                                    {overdue && <AlertCircle className="w-3 h-3" />} Due {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                             {lastRemindedText && (
                                <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block border border-orange-100">
                                    <span className="font-semibold">Last Alert Sent:</span> {lastRemindedText}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {task.status !== TaskStatus.COMPLETED && (
                            <>
                                <button 
                                    onClick={() => onUpdateTask({...task, status: TaskStatus.COMPLETED})}
                                    className="flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors"
                                >
                                    Mark Done
                                </button>
                                {overdue && (
                                    <button 
                                        onClick={() => handleSendReminder(task)}
                                        disabled={loadingReminderId === task.id}
                                        className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Bell className="w-4 h-4" /> 
                                        {loadingReminderId === task.id ? 'Sending...' : 'Remind'}
                                    </button>
                                )}
                            </>
                        )}
                         {task.status === TaskStatus.COMPLETED && (
                             <span className="text-green-600 font-medium px-4">Completed</span>
                         )}
                    </div>
                </div>
            )
        })}
        {tasks.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400">No tasks assigned yet. Time to relax! 🎉</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
