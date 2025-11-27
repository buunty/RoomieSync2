
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, MessageType, Roommate, Task, TaskStatus } from '../types';
import { Send, CheckCircle, Clock, Bell, User } from 'lucide-react';

interface ChatProps {
  messages: ChatMessage[];
  currentUser: Roommate;
  roommates: Roommate[];
  onSendMessage: (text: string) => void;
  onAssignTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  tasks: Task[]; // Need access to verify task status for UI
}

const Chat: React.FC<ChatProps> = ({ messages, currentUser, roommates, onSendMessage, onAssignTask, onUpdateTask, tasks }) => {
  const [inputText, setInputText] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Task Form State
  const [taskData, setTaskData] = useState({
    title: '',
    assignedTo: roommates[0]?.id || '',
    dueDate: '',
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const requestNotificationPermission = () => {
    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
    });
  };

  // Notification Logic (Sound + System Notification)
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    
    // Only notify if I am NOT the sender
    if (lastMessage.senderId !== currentUser.id) {
       // 1. Play Sound
       const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
       audio.play().catch(e => console.log('Audio play failed (interaction needed first)', e));

       // 2. Send System Notification (Phone/Desktop)
       if (Notification.permission === 'granted') {
           const senderName = roommates.find(r => r.id === lastMessage.senderId)?.name || 'Roommate';
           const title = lastMessage.type === MessageType.TASK_ASSIGNED ? 'New Task Assigned' : `Message from ${senderName}`;
           
           new Notification(title, {
               body: lastMessage.content,
               icon: '/vite.svg' // Fallback icon
           });
       }
    }
  }, [messages, currentUser.id, roommates]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title,
      assignedTo: taskData.assignedTo,
      dueDate: taskData.dueDate,
      status: TaskStatus.PENDING
    };
    onAssignTask(newTask);
    setShowTaskForm(false);
    setTaskData({ title: '', assignedTo: roommates[0]?.id || '', dueDate: '' });
  };

  // Helper to find actual task status if it exists in current tasks
  const getTaskStatus = (taskId: string | undefined, snapshotStatus: TaskStatus | undefined) => {
      if(!taskId) return snapshotStatus;
      const realTask = tasks.find(t => t.id === taskId);
      return realTask ? realTask.status : snapshotStatus;
  };

  const handleMarkComplete = (taskId: string | undefined) => {
      if(!taskId) return;
      const task = tasks.find(t => t.id === taskId);
      if(task && task.status !== TaskStatus.COMPLETED) {
          onUpdateTask({ ...task, status: TaskStatus.COMPLETED });
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" /> Roommate Chat
            </h2>
            <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">Task assignments and updates appear here</p>
                {notificationPermission === 'default' && (
                    <button onClick={requestNotificationPermission} className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full hover:bg-indigo-200 transition-colors">
                        Enable Notifications
                    </button>
                )}
            </div>
        </div>
        <button 
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
            + Assign Task
        </button>
      </div>

      {/* Task Assignment Modal (Embedded) */}
      {showTaskForm && (
        <div className="bg-indigo-50 p-4 border-b border-indigo-100 animate-fade-in">
            <h3 className="text-sm font-bold text-indigo-800 mb-2">Assign New Task</h3>
            <form onSubmit={handleTaskSubmit} className="flex flex-col md:flex-row gap-2">
                <input 
                    required
                    type="text" 
                    placeholder="Task Title (e.g. Clean Vessels)"
                    className="flex-1 px-3 py-2 rounded border border-indigo-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400"
                    value={taskData.title}
                    onChange={e => setTaskData({...taskData, title: e.target.value})}
                />
                <select 
                    className="px-3 py-2 rounded border border-indigo-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={taskData.assignedTo}
                    onChange={e => setTaskData({...taskData, assignedTo: e.target.value})}
                >
                    {roommates.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <input 
                    required
                    type="date"
                    className="px-3 py-2 rounded border border-indigo-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={taskData.dueDate}
                    onChange={e => setTaskData({...taskData, dueDate: e.target.value})}
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700">
                    Assign
                </button>
                <button type="button" onClick={() => setShowTaskForm(false)} className="text-gray-500 px-2 text-sm hover:text-gray-700">Cancel</button>
            </form>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const sender = roommates.find(r => r.id === msg.senderId);
            
            if (msg.type === MessageType.TASK_ASSIGNED) {
                // Task Card Style
                const currentStatus = getTaskStatus(msg.relatedTaskId, msg.relatedTaskStatus);
                const isCompleted = currentStatus === TaskStatus.COMPLETED;

                return (
                    <div key={msg.id} className="flex justify-center my-4 animate-fade-in">
                        <div className={`w-full max-w-md bg-white border-l-4 ${isCompleted ? 'border-green-500' : 'border-indigo-500'} rounded-r-lg shadow-md p-4`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                    {isCompleted ? 'Task Completed' : 'New Task Assignment'}
                                </span>
                                <span className="text-xs text-gray-300">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            
                            <h4 className={`text-lg font-bold ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                {msg.relatedTaskTitle}
                            </h4>
                            
                            <p className="text-sm text-gray-600 mt-1">
                                <span className="font-semibold text-indigo-600">{sender?.name}</span> assigned to <span className="font-semibold text-indigo-600">{roommates.find(r => msg.content.includes(r.name))?.name || 'someone'}</span>
                            </p>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {isCompleted ? (
                                        <span className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded">
                                            <CheckCircle className="w-4 h-4" /> Completed
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-orange-600 font-bold text-sm bg-orange-50 px-2 py-1 rounded">
                                            <Clock className="w-4 h-4" /> Incomplete
                                        </span>
                                    )}
                                </div>
                                {!isCompleted && (
                                    <button 
                                        onClick={() => handleMarkComplete(msg.relatedTaskId)}
                                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
                                    >
                                        Mark Done
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            } else if (msg.type === MessageType.TASK_UPDATED) {
                 return (
                    <div key={msg.id} className="flex justify-center my-2 opacity-75">
                         <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full flex items-center gap-2">
                             <CheckCircle className="w-3 h-3" /> {msg.content}
                         </div>
                    </div>
                 );
            }

            // Standard Text Message
            return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                        isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'
                    }`}>
                        {!isMe && <p className="text-xs font-bold mb-1 opacity-70">{sender?.name}</p>}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input
            type="text"
            className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none placeholder-gray-500"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
        />
        <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
        >
            <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
