import { Roommate, Expense, Task, ChatMessage } from '../types';
import { INITIAL_ROOMMATES } from '../constants';

// --- CONFIGURATION ---
// Set this to true ONLY if you have the Node.js backend running locally with MySQL
// If set to false, it uses Browser LocalStorage (Data will not persist across devices)
const USE_BACKEND = false; 
const API_URL = 'http://localhost:3000/api';

const KEYS = {
  ROOMMATES: 'roomiesync_roommates',
  EXPENSES: 'roomiesync_expenses',
  TASKS: 'roomiesync_tasks',
  MESSAGES: 'roomiesync_messages',
  USER: 'roomiesync_current_user',
  BUDGETS: 'roomiesync_budgets',
  BUDGET_LABELS: 'roomiesync_budget_labels'
};

export const isUsingBackend = () => USE_BACKEND;

// --- HELPER FOR API CALLS ---
const apiFetch = async (endpoint: string, options?: RequestInit) => {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (!res.ok) throw new Error('API Request Failed');
    return await res.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    // If backend fails, we throw so the caller knows (or handle gracefully)
    // For this app, returning null triggers empty state which is better than crashing
    return null;
  }
};

// --- ASYNC STORAGE METHODS ---

export const getRoommates = async (): Promise<Roommate[]> => {
  if (USE_BACKEND) {
    const data = await apiFetch('/roommates');
    return data || [];
  }
  const stored = localStorage.getItem(KEYS.ROOMMATES);
  if (!stored) {
    localStorage.setItem(KEYS.ROOMMATES, JSON.stringify(INITIAL_ROOMMATES));
    return INITIAL_ROOMMATES;
  }
  return JSON.parse(stored);
};

export const saveRoommates = async (roommates: Roommate[]) => {
  if (USE_BACKEND) {
    for (const r of roommates) {
        await apiFetch('/roommates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(r)
        });
    }
    return;
  }
  localStorage.setItem(KEYS.ROOMMATES, JSON.stringify(roommates));
};

export const getExpenses = async (): Promise<Expense[]> => {
  if (USE_BACKEND) {
    const data = await apiFetch('/expenses');
    return data || [];
  }
  const stored = localStorage.getItem(KEYS.EXPENSES);
  return stored ? JSON.parse(stored) : [];
};

export const saveExpenses = async (expenses: Expense[]) => {
  if (USE_BACKEND) {
      const latest = expenses[expenses.length - 1];
      if (latest) {
          await apiFetch('/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(latest)
          });
      }
      return;
  }
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
};

export const getTasks = async (): Promise<Task[]> => {
  if (USE_BACKEND) {
    const data = await apiFetch('/tasks');
    return data || [];
  }
  const stored = localStorage.getItem(KEYS.TASKS);
  return stored ? JSON.parse(stored) : [];
};

export const saveTasks = async (tasks: Task[]) => {
  if (USE_BACKEND) {
      for (const t of tasks) {
          await apiFetch('/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t)
          });
      }
      return;
  }
  localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
};

export const getMessages = async (): Promise<ChatMessage[]> => {
  if (USE_BACKEND) {
    const data = await apiFetch('/messages');
    return data || [];
  }
  const stored = localStorage.getItem(KEYS.MESSAGES);
  return stored ? JSON.parse(stored) : [];
};

export const saveMessages = async (messages: ChatMessage[]) => {
  if (USE_BACKEND) {
      const latest = messages[messages.length - 1];
      if(latest) {
          await apiFetch('/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(latest)
          });
      }
      return;
  }
  localStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
};

export const getBudgets = async (): Promise<Record<string, number>> => {
  if (USE_BACKEND) {
      const data = await apiFetch('/budgets');
      return data || {};
  }
  const stored = localStorage.getItem(KEYS.BUDGETS);
  return stored ? JSON.parse(stored) : {};
};

export const saveBudgets = async (budgets: Record<string, number>) => {
  if (USE_BACKEND) {
      await apiFetch('/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(budgets)
      });
      return;
  }
  localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
};

export const getBudgetLabels = async (): Promise<Record<string, string>> => {
  if (USE_BACKEND) {
      const data = await apiFetch('/budget_labels');
      return data || {};
  }
  const stored = localStorage.getItem(KEYS.BUDGET_LABELS);
  return stored ? JSON.parse(stored) : {};
};

export const saveBudgetLabels = async (labels: Record<string, string>) => {
  if (USE_BACKEND) {
      await apiFetch('/budget_labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(labels)
      });
      return;
  }
  localStorage.setItem(KEYS.BUDGET_LABELS, JSON.stringify(labels));
};

// User session is always local for this simple app
export const getCurrentUser = async (): Promise<Roommate | null> => {
  const stored = localStorage.getItem(KEYS.USER);
  return stored ? JSON.parse(stored) : null;
};

export const saveCurrentUser = async (user: Roommate | null) => {
  if (user) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.USER);
  }
};

// --- DATABASE SYNC FEATURES ---

export const exportDatabase = async () => {
  const data = {
    roommates: await getRoommates(),
    expenses: await getExpenses(),
    tasks: await getTasks(),
    messages: await getMessages(),
    budgets: await getBudgets(),
    budgetLabels: await getBudgetLabels(),
    exportedAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `RoomieSync_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importDatabase = async (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (data.roommates && Array.isArray(data.roommates)) {
          localStorage.setItem(KEYS.ROOMMATES, JSON.stringify(data.roommates));
          localStorage.setItem(KEYS.EXPENSES, JSON.stringify(data.expenses || []));
          localStorage.setItem(KEYS.TASKS, JSON.stringify(data.tasks || []));
          localStorage.setItem(KEYS.MESSAGES, JSON.stringify(data.messages || []));
          localStorage.setItem(KEYS.BUDGETS, JSON.stringify(data.budgets || {}));
          localStorage.setItem(KEYS.BUDGET_LABELS, JSON.stringify(data.budgetLabels || {}));
          resolve(true);
        } else {
          reject(new Error("Invalid backup file format"));
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsText(file);
  });
};