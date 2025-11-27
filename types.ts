
export enum Role {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export enum ExpenseCategory {
  CONTRIBUTION = 'Contribution', // Money added to the pot
  RENT = 'Rent', // Paying landlord (expense)
  GROCERY = 'Grocery',
  VEG = 'Veg',
  NON_VEG = 'Non-Veg',
  PETROL = 'Petrol',
  UTILITIES = 'Utilities',
  OTHER = 'Other'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

export interface Roommate {
  id: string;
  name: string;
  email: string;
  role: Role;
  isVegetarian: boolean;
  avatarUrl?: string;
  agreedContribution: number; // The amount they are supposed to pay (e.g. 6000)
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string; // Roommate ID
  category: ExpenseCategory | string; // Allow custom category strings
  date: string;
  splitAmong: string[]; // Array of Roommate IDs
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string; // Roommate ID
  dueDate: string;
  status: TaskStatus;
  description?: string;
  lastReminded?: string; // Timestamp of last reminder
}

export enum MessageType {
  TEXT = 'TEXT',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED'
}

export interface ChatMessage {
  id: string;
  senderId: string; // Roommate ID or 'SYSTEM'
  content: string;
  timestamp: string;
  type: MessageType;
  relatedTaskId?: string;
  relatedTaskTitle?: string;
  relatedTaskStatus?: TaskStatus;
}

export interface AppState {
  currentUser: Roommate | null;
  roommates: Roommate[];
  expenses: Expense[];
  tasks: Task[];
  messages: ChatMessage[];
  categoryBudgets: Record<string, number>; // Map of ExpenseCategory -> Amount Allocated
  categoryLabels: Record<string, string>; // Map of ExpenseCategory -> Custom Name (e.g. 'Rent' -> 'Bunty Rent')
}
