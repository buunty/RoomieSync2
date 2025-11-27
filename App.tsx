import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Roommates from './components/Roommates';
import Expenses from './components/Expenses';
import Tasks from './components/Tasks';
import Chat from './components/Chat';
import { AppState, Roommate, Expense, Task, ExpenseCategory, ChatMessage, MessageType, TaskStatus } from './types';
import { 
  getRoommates, saveRoommates, 
  getExpenses, saveExpenses, 
  getTasks, saveTasks, 
  getMessages, saveMessages,
  getBudgets, saveBudgets,
  getBudgetLabels, saveBudgetLabels,
  getCurrentUser, saveCurrentUser 
} from './services/storageService';
import { Lock } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<AppState>({
    currentUser: null,
    roommates: [],
    expenses: [],
    tasks: [],
    messages: [],
    categoryBudgets: {},
    categoryLabels: {}
  });

  // Load initial data (Async)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          currentUser, 
          roommates, 
          expenses, 
          tasks, 
          messages, 
          categoryBudgets, 
          categoryLabels
        ] = await Promise.all([
          getCurrentUser(),
          getRoommates(),
          getExpenses(),
          getTasks(),
          getMessages(),
          getBudgets(),
          getBudgetLabels()
        ]);

        setState({
          currentUser,
          roommates,
          expenses,
          tasks,
          messages,
          categoryBudgets,
          categoryLabels
        });
      } catch (error) {
        console.error("Failed to load application data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogin = async (userId: string) => {
    const user = state.roommates.find(r => r.id === userId) || null;
    await saveCurrentUser(user);
    setState(prev => ({ ...prev, currentUser: user }));
  };

  const handleLogout = async () => {
    await saveCurrentUser(null);
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const handleAddRoommate = async (newRoommate: Roommate) => {
    const updated = [...state.roommates, newRoommate];
    await saveRoommates(updated);
    setState(prev => ({ ...prev, roommates: updated }));
  };

  const handleDeleteRoommate = async (id: string) => {
    const updated = state.roommates.filter(r => r.id !== id);
    await saveRoommates(updated);
    setState(prev => ({ ...prev, roommates: updated }));
  };

  const handleAddExpense = async (newExpense: Expense) => {
    const updated = [...state.expenses, newExpense];
    await saveExpenses(updated);
    setState(prev => ({ ...prev, expenses: updated }));
  };

  const handleQuickAddRent = async (userId: string, amount: number) => {
      const payer = state.roommates.find(r => r.id === userId);
      if(!payer) return;

      const newExpense: Expense = {
        id: Date.now().toString(),
        title: 'Monthly Rent/Contribution',
        amount: amount,
        paidBy: userId,
        category: ExpenseCategory.CONTRIBUTION,
        date: new Date().toISOString(),
        splitAmong: [userId]
      };
      await handleAddExpense(newExpense);
      alert(`Collected ₹${amount} from ${payer.name}`);
  };

  const addChatMessage = async (msg: ChatMessage) => {
      const updatedMessages = [...state.messages, msg];
      await saveMessages(updatedMessages);
      setState(prev => ({ ...prev, messages: updatedMessages }));
  };

  const handleAddTask = async (newTask: Task) => {
    const updated = [...state.tasks, newTask];
    await saveTasks(updated);
    setState(prev => ({ ...prev, tasks: updated }));

    const assignee = state.roommates.find(r => r.id === newTask.assignedTo);
    const systemMsg: ChatMessage = {
        id: Date.now().toString(),
        senderId: state.currentUser?.id || 'SYSTEM',
        content: `Assigned task "${newTask.title}" to ${assignee?.name}`,
        timestamp: new Date().toISOString(),
        type: MessageType.TASK_ASSIGNED,
        relatedTaskId: newTask.id,
        relatedTaskTitle: newTask.title,
        relatedTaskStatus: TaskStatus.PENDING
    };
    await addChatMessage(systemMsg);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const oldTask = state.tasks.find(t => t.id === updatedTask.id);
    const updated = state.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    await saveTasks(updated);
    setState(prev => ({ ...prev, tasks: updated }));

    if (oldTask && oldTask.status !== TaskStatus.COMPLETED && updatedTask.status === TaskStatus.COMPLETED) {
         const systemMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: state.currentUser?.id || 'SYSTEM',
            content: `Completed task "${updatedTask.title}"`,
            timestamp: new Date().toISOString(),
            type: MessageType.TASK_UPDATED,
            relatedTaskId: updatedTask.id,
            relatedTaskTitle: updatedTask.title,
            relatedTaskStatus: TaskStatus.COMPLETED
        };
        await addChatMessage(systemMsg);
    }
  };

  const handleUpdateBudgets = async (newBudgets: Record<string, number>, newLabels: Record<string, string>) => {
    await saveBudgets(newBudgets);
    await saveBudgetLabels(newLabels);
    setState(prev => ({ ...prev, categoryBudgets: newBudgets, categoryLabels: newLabels }));
  };

  const handleSendMessage = async (text: string) => {
      if(!state.currentUser) return;
      const msg: ChatMessage = {
          id: Date.now().toString(),
          senderId: state.currentUser.id,
          content: text,
          timestamp: new Date().toISOString(),
          type: MessageType.TEXT
      };
      await addChatMessage(msg);
  };

  // Loading Screen
  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-indigo-600 font-bold text-xl animate-pulse">Loading RoomieSync...</div>
          </div>
      );
  }

  // Auth Screen
  if (!state.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to RoomieSync</h1>
            <p className="text-gray-500 mb-8">Select your profile to continue</p>
            
            <div className="space-y-3">
                {state.roommates.map(user => (
                    <button
                        key={user.id}
                        onClick={() => handleLogin(user.id)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                        <span className="font-medium text-gray-700 group-hover:text-indigo-700">{user.name}</span>
                        {user.role === 'ADMIN' && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full ml-auto">Admin</span>}
                    </button>
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        currentUser={state.currentUser}
        onLogout={handleLogout}
      >
        {activeTab === 'dashboard' && (
            <Dashboard 
                roommates={state.roommates} 
                expenses={state.expenses} 
                tasks={state.tasks}
                currentUser={state.currentUser}
                categoryBudgets={state.categoryBudgets}
                categoryLabels={state.categoryLabels}
            />
        )}
        {activeTab === 'roommates' && (
            <Roommates 
                currentUser={state.currentUser} 
                roommates={state.roommates} 
                onAddRoommate={handleAddRoommate}
                onDeleteRoommate={handleDeleteRoommate}
                onQuickAddRent={handleQuickAddRent}
            />
        )}
        {activeTab === 'expenses' && (
            <Expenses 
                expenses={state.expenses} 
                roommates={state.roommates} 
                currentUser={state.currentUser}
                onAddExpense={handleAddExpense}
                categoryBudgets={state.categoryBudgets}
                categoryLabels={state.categoryLabels}
                onUpdateBudgets={handleUpdateBudgets}
            />
        )}
        {activeTab === 'tasks' && (
            <Tasks 
                tasks={state.tasks} 
                roommates={state.roommates}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
            />
        )}
        {activeTab === 'chat' && (
            <Chat 
                messages={state.messages}
                currentUser={state.currentUser}
                roommates={state.roommates}
                onSendMessage={handleSendMessage}
                onAssignTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                tasks={state.tasks}
            />
        )}
      </Layout>
    </HashRouter>
  );
};

export default App;