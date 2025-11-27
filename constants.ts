import { Role, Roommate, ExpenseCategory } from './types';

export const INITIAL_ROOMMATES: Roommate[] = [
  {
    id: '1',
    name: 'Admin Alice',
    email: 'alice@example.com',
    role: Role.ADMIN,
    isVegetarian: false,
    avatarUrl: 'https://picsum.photos/seed/alice/200/200',
    agreedContribution: 6000
  },
  {
    id: '2',
    name: 'Bob Builder',
    email: 'bob@example.com',
    role: Role.MEMBER,
    isVegetarian: true,
    avatarUrl: 'https://picsum.photos/seed/bob/200/200',
    agreedContribution: 6000
  },
  {
    id: '3',
    name: 'Charlie Chef',
    email: 'charlie@example.com',
    role: Role.MEMBER,
    isVegetarian: false,
    avatarUrl: 'https://picsum.photos/seed/charlie/200/200',
    agreedContribution: 6000
  }
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.CONTRIBUTION]: '#10b981', // Green for money in
  [ExpenseCategory.RENT]: '#6366f1', // Indigo
  [ExpenseCategory.GROCERY]: '#8b5cf6', // Violet
  [ExpenseCategory.VEG]: '#84cc16', // Lime
  [ExpenseCategory.NON_VEG]: '#ef4444', // Red
  [ExpenseCategory.PETROL]: '#f59e0b', // Amber
  [ExpenseCategory.UTILITIES]: '#0ea5e9', // Sky
  [ExpenseCategory.OTHER]: '#64748b' // Slate
};