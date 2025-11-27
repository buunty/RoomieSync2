import React, { useRef } from 'react';
import { Roommate, Expense, Task, TaskStatus, ExpenseCategory } from '../types';
import { Wallet, CheckCircle, AlertTriangle, TrendingUp, Database, Upload, Download, Server, HardDrive } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CATEGORY_COLORS } from '../constants';
import { exportDatabase, importDatabase, isUsingBackend } from '../services/storageService';

interface DashboardProps {
  roommates: Roommate[];
  expenses: Expense[];
  tasks: Task[];
  currentUser: Roommate;
  categoryBudgets: Record<string, number>;
  categoryLabels: Record<string, string>;
}

const Dashboard: React.FC<DashboardProps> = ({ roommates, expenses, tasks, currentUser, categoryBudgets, categoryLabels }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usingBackend = isUsingBackend();

  // Calculate House Fund Overview
  const totalCollected = expenses
    .filter(e => e.category === ExpenseCategory.CONTRIBUTION)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSpent = expenses
    .filter(e => e.category !== ExpenseCategory.CONTRIBUTION)
    .reduce((sum, e) => sum + e.amount, 0);

  const poolBalance = totalCollected - totalSpent;

  // Calculate stats per person
  const personStats = roommates.map(person => {
    // Total RENT/CONTRIBUTION paid
    const contributed = expenses
        .filter(e => e.category === ExpenseCategory.CONTRIBUTION && e.paidBy === person.id)
        .reduce((sum, e) => sum + e.amount, 0);
    
    // Total Spending Share (how much of the pool did they consume?)
    let share = 0;
    expenses.filter(e => e.category !== ExpenseCategory.CONTRIBUTION).forEach(e => {
        if(e.splitAmong.includes(person.id)) {
            share += e.amount / e.splitAmong.length;
        }
    });

    const dues = person.agreedContribution - contributed;

    return {
        name: person.name,
        contributed,
        share: Math.round(share),
        dues: dues > 0 ? dues : 0,
        target: person.agreedContribution
    };
  });

  const myStats = personStats.find(s => s.name === currentUser.name);
  const pendingTasks = tasks.filter(t => t.assignedTo === currentUser.id && t.status === TaskStatus.PENDING).length;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm("This will overwrite your current data. Are you sure you want to restore this backup?")) {
        try {
          await importDatabase(file);
          alert("Database restored successfully! The app will now reload.");
          window.location.reload();
        } catch (error) {
          alert("Failed to restore database. Invalid file.");
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h2 className="text-3xl font-bold mb-2">Welcome back, {currentUser.name}!</h2>
                <p className="text-indigo-200">Current House Fund Balance: <span className="font-bold text-white text-lg">₹{poolBalance.toLocaleString()}</span></p>
            </div>
            <div className={`mt-4 md:mt-0 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${usingBackend ? 'bg-green-500/20 text-green-200 border border-green-500/30' : 'bg-gray-700/50 text-gray-300 border border-gray-600'}`}>
                {usingBackend ? <Server className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                {usingBackend ? 'Connected to MySQL' : 'Local Storage Mode'}
            </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-indigo-800 opacity-30 skew-x-12 transform translate-x-10"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-600">Your Contribution</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">
                ₹{myStats?.contributed.toLocaleString()} <span className="text-sm font-normal text-gray-400">/ ₹{myStats?.target.toLocaleString()}</span>
            </p>
            {myStats && myStats.dues > 0 && (
                 <p className="text-xs text-red-500 mt-1 font-medium">Due: ₹{myStats.dues}</p>
            )}
            {myStats && myStats.dues <= 0 && (
                 <p className="text-xs text-green-500 mt-1 font-medium">All paid up!</p>
            )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-600">Pending Tasks</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{pendingTasks}</p>
            <p className="text-xs text-gray-400 mt-1">Assigned to you</p>
        </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-600">Total Spent</h3>
            </div>
             <p className="text-2xl font-bold text-gray-800">
                ₹{totalSpent.toLocaleString()}
            </p>
             <p className="text-xs text-gray-400 mt-1">From total pool</p>
        </div>
      </div>

      {/* Database Management */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" /> Data Sync & Backup
          </h3>
          <p className="text-sm text-gray-400">Sync data with roommates by sharing the backup file.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportDatabase}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-600"
          >
            <Download className="w-4 h-4" /> Backup Data
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" /> Restore Data
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6">Contribution vs Consumption</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={personStats} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} />
                        <Bar dataKey="contributed" fill="#10b981" name="Rent Paid" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="share" fill="#fbbf24" name="Value Consumed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Budget Health */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-800 mb-6">Budget Health</h3>
             <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {Object.values(ExpenseCategory)
                    .filter(c => c !== ExpenseCategory.CONTRIBUTION && categoryBudgets[c] > 0)
                    .map(category => {
                        const allocated = categoryBudgets[category];
                        const spent = expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0);
                        const percent = Math.min((spent / allocated) * 100, 100);
                        const color = CATEGORY_COLORS[category as ExpenseCategory];
                        const label = categoryLabels[category];
                        
                        return (
                            <div key={category}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">
                                        {category}
                                        {label && <span className="text-indigo-500 ml-1">({label})</span>}
                                    </span>
                                    <span className="text-gray-500">₹{spent} / ₹{allocated}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full rounded-full" 
                                        style={{width: `${percent}%`, backgroundColor: color}}
                                    />
                                </div>
                            </div>
                        );
                })}
                {Object.values(categoryBudgets).reduce((a: number, b: number) => a + b, 0) === 0 && (
                    <div className="text-center text-gray-400 py-8">
                        No budgets allocated yet. Go to Expenses to set limits.
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;