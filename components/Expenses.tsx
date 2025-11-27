
import React, { useState, useMemo, useEffect } from 'react';
import { Expense, Roommate, ExpenseCategory, Role } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { Download, Wand2, TrendingUp, TrendingDown, Wallet, Settings, Save, Tag, Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { parseExpenseFromText } from '../services/geminiService';

interface ExpensesProps {
  expenses: Expense[];
  roommates: Roommate[];
  currentUser: Roommate;
  onAddExpense: (e: Expense) => void;
  categoryBudgets: Record<string, number>;
  categoryLabels: Record<string, string>;
  onUpdateBudgets: (b: Record<string, number>, l: Record<string, string>) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, roommates, currentUser, onAddExpense, categoryBudgets, categoryLabels, onUpdateBudgets }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);
  const [transactionType, setTransactionType] = useState<'EXPENSE' | 'COLLECTION'>('EXPENSE');
  const [aiLoading, setAiLoading] = useState(false);
  const [naturalText, setNaturalText] = useState('');
  const [tempBudgets, setTempBudgets] = useState(categoryBudgets);
  const [tempLabels, setTempLabels] = useState(categoryLabels);
  
  // Reporting State
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: ExpenseCategory.GROCERY as string,
    splitAmong: roommates.map(r => r.id),
    paidBy: currentUser.id
  });

  // Sync temp budgets when props change
  useEffect(() => {
    setTempBudgets(categoryBudgets);
    setTempLabels(categoryLabels);
  }, [categoryBudgets, categoryLabels]);

  // When switching to Collection and changing PaidBy, auto-fill amount
  useEffect(() => {
    if (transactionType === 'COLLECTION') {
        const payer = roommates.find(r => r.id === formData.paidBy);
        if (payer) {
            setFormData(prev => ({ ...prev, amount: payer.agreedContribution.toString() }));
        }
    }
  }, [formData.paidBy, transactionType, roommates]);

  // Calculate totals
  const totalCollected = useMemo(() => 
    expenses.filter(e => e.category === ExpenseCategory.CONTRIBUTION).reduce((sum, e) => sum + e.amount, 0), 
  [expenses]);

  const totalSpent = useMemo(() => 
    expenses.filter(e => e.category !== ExpenseCategory.CONTRIBUTION).reduce((sum, e) => sum + e.amount, 0), 
  [expenses]);
  
  const totalAllocated = Object.values(categoryBudgets).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const unallocatedBalance = totalCollected - totalAllocated;

  // Chart Data (Expenses Only)
  const expenseChartData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.filter(e => e.category !== ExpenseCategory.CONTRIBUTION).forEach(e => {
        data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const handleCategoryChange = (category: string) => {
    // Smart logic: if Non-Veg, uncheck vegetarians
    let newSplit = [...formData.splitAmong];
    if (category === ExpenseCategory.NON_VEG) {
        const vegIds = roommates.filter(r => r.isVegetarian).map(r => r.id);
        newSplit = newSplit.filter(id => !vegIds.includes(id));
    }
    setFormData({ ...formData, category, splitAmong: newSplit });
  };

  const handleAiParse = async () => {
    if(!naturalText) return;
    setAiLoading(true);
    const result = await parseExpenseFromText(naturalText);
    setAiLoading(false);
    
    if (result) {
        const newCategory = (result.category as string) || ExpenseCategory.OTHER;
        let newSplit = roommates.map(r => r.id);
        if (newCategory === ExpenseCategory.NON_VEG) {
             const vegIds = roommates.filter(r => r.isVegetarian).map(r => r.id);
             newSplit = newSplit.filter(id => !vegIds.includes(id));
        }

        setFormData({
            ...formData,
            title: result.title || '',
            amount: result.amount?.toString() || '',
            category: newCategory,
            splitAmong: newSplit
        });
        setTransactionType('EXPENSE');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const category = transactionType === 'COLLECTION' ? ExpenseCategory.CONTRIBUTION : formData.category;
    const title = transactionType === 'COLLECTION' ? 'Rent/Contribution' : formData.title;

    const newExpense: Expense = {
        id: Date.now().toString(),
        title: title,
        amount: parseFloat(formData.amount),
        paidBy: formData.paidBy,
        category: category,
        date: new Date().toISOString(),
        splitAmong: transactionType === 'COLLECTION' ? [formData.paidBy] : formData.splitAmong
    };
    onAddExpense(newExpense);
    setIsAdding(false);
    setFormData({ ...formData, title: '', amount: '', splitAmong: roommates.map(r => r.id) });
    setNaturalText('');
  };

  const saveBudgets = () => {
      onUpdateBudgets(tempBudgets, tempLabels);
      setIsEditingBudgets(false);
  };

  const addCustomBudget = () => {
      const id = `Custom-${Date.now()}`;
      setTempBudgets(prev => ({ ...prev, [id]: 0 }));
      setTempLabels(prev => ({ ...prev, [id]: '' }));
  };

  const removeBudget = (key: string) => {
      const newBudgets = { ...tempBudgets };
      delete newBudgets[key];
      setTempBudgets(newBudgets);
      
      const newLabels = { ...tempLabels };
      delete newLabels[key];
      setTempLabels(newLabels);
  };

  const getCategoryStats = (category: string) => {
      const spent = expenses
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0);
      const allocated = categoryBudgets[category] || 0;
      return { spent, allocated, remaining: allocated - spent };
  };

  const handleDownloadReport = () => {
    const [year, month] = reportMonth.split('-');
    const selectedDate = new Date(parseInt(year), parseInt(month) - 1);
    const monthName = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Filter expenses for selected month
    const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(month) - 1;
    });

    if (monthlyExpenses.length === 0) {
        alert(`No transactions found for ${monthName}`);
        return;
    }

    // Calculations
    const totalIn = monthlyExpenses.filter(e => e.category === ExpenseCategory.CONTRIBUTION).reduce((a, b) => a + b.amount, 0);
    const totalOut = monthlyExpenses.filter(e => e.category !== ExpenseCategory.CONTRIBUTION).reduce((a, b) => a + b.amount, 0);
    
    // Build CSV Content
    let csv = `ROOMIESYNC MONTHLY REPORT - ${monthName.toUpperCase()}\n\n`;
    
    // Summary Section
    csv += `SUMMARY\n`;
    csv += `Total Collected,Rs. ${totalIn}\n`;
    csv += `Total Spent,Rs. ${totalOut}\n`;
    csv += `Net Balance for Month,Rs. ${totalIn - totalOut}\n\n`;

    // Category Breakdown Section
    csv += `CATEGORY BREAKDOWN\n`;
    csv += `Category,Spent\n`;
    const catStats: Record<string, number> = {};
    monthlyExpenses.filter(e => e.category !== ExpenseCategory.CONTRIBUTION).forEach(e => {
        catStats[e.category] = (catStats[e.category] || 0) + e.amount;
    });
    Object.entries(catStats).forEach(([cat, amount]) => {
        csv += `${cat},Rs. ${amount}\n`;
    });
    csv += `\n`;

    // Transaction Details Section
    csv += `TRANSACTION DETAILS\n`;
    csv += `Date,Title,Category,Paid By,Amount,Type\n`;
    
    monthlyExpenses.forEach(e => {
        const date = new Date(e.date).toLocaleDateString();
        const payer = roommates.find(r => r.id === e.paidBy)?.name || 'Unknown';
        const type = e.category === ExpenseCategory.CONTRIBUTION ? 'INCOME' : 'EXPENSE';
        // Handle commas in titles to prevent CSV breaking
        const cleanTitle = e.title.replace(/,/g, ' ');
        csv += `${date},${cleanTitle},${e.category},${payer},Rs. ${e.amount},${type}\n`;
    });

    // Trigger Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RoomieSync_Report_${reportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Combine standard categories and any custom keys found in budgets
  const displayCategories = useMemo(() => {
    const standard = Object.values(ExpenseCategory).filter(c => c !== ExpenseCategory.CONTRIBUTION);
    const custom = Object.keys(isEditingBudgets ? tempBudgets : categoryBudgets).filter(k => !standard.includes(k as any) && k !== ExpenseCategory.CONTRIBUTION);
    return [...standard, ...custom];
  }, [categoryBudgets, tempBudgets, isEditingBudgets]);

  return (
    <div className="space-y-8">
      {/* House Fund Overview */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-indigo-600" /> House Fund Status
                </h2>
                <p className="text-gray-500 text-sm">Total Collected: <span className="font-semibold text-green-600">₹{totalCollected.toLocaleString()}</span></p>
            </div>
            {currentUser.role === Role.ADMIN && (
                <div className="flex gap-2">
                    {isEditingBudgets && (
                        <button 
                            onClick={addCustomBudget}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        >
                            <Plus className="w-4 h-4"/> Add Custom Fund
                        </button>
                    )}
                    <button 
                        onClick={() => isEditingBudgets ? saveBudgets() : setIsEditingBudgets(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditingBudgets ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        {isEditingBudgets ? <Save className="w-4 h-4"/> : <Settings className="w-4 h-4"/>}
                        {isEditingBudgets ? 'Save Allocations' : 'Manage Budgets'}
                    </button>
                </div>
            )}
        </div>
        
        {/* Budget Allocations */}
        <div className="bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">Allocated Funds</h3>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    Unallocated: ₹{unallocatedBalance.toLocaleString()}
                </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayCategories.map(category => {
                        const { spent, allocated, remaining } = getCategoryStats(category);
                        const percentUsed = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
                        const customLabel = isEditingBudgets ? tempLabels[category] : categoryLabels[category];
                        const isCustomKey = category.startsWith('Custom-');
                        
                        return (
                            <div key={category} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 relative group">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: CATEGORY_COLORS[category as ExpenseCategory] || '#94a3b8'}}></div>
                                            <span className="font-medium text-gray-700 truncate" title={category}>
                                                {isCustomKey ? (customLabel || 'Custom Fund') : category}
                                            </span>
                                            {isEditingBudgets && isCustomKey && (
                                                <button onClick={() => removeBudget(category)} className="text-red-400 hover:text-red-600 ml-auto">
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            )}
                                        </div>
                                        
                                        {!isEditingBudgets && customLabel && !isCustomKey && (
                                            <span className="text-xs text-indigo-500 font-medium ml-5">{customLabel}</span>
                                        )}

                                        {isEditingBudgets && (
                                            <div className="flex items-center gap-1 mt-1 ml-5">
                                                <Tag className="w-3 h-3 text-gray-400" />
                                                <select
                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 bg-white text-gray-800"
                                                    value={tempLabels[category] || ''}
                                                    onChange={(e) => setTempLabels({...tempLabels, [category]: e.target.value})}
                                                >
                                                    <option value="">-- Assign To --</option>
                                                    {roommates.map(r => (
                                                        <option key={r.id} value={r.name}>{r.name}</option>
                                                    ))}
                                                    <option value="General Fund">General Fund</option>
                                                    <option value="Maintenance">Maintenance</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {isEditingBudgets ? (
                                        <div className="flex flex-col items-end gap-1 ml-2">
                                            <span className="text-xs text-gray-400">Limit:</span>
                                            <input 
                                                type="number" 
                                                className="w-20 px-2 py-1 text-right text-sm border rounded focus:ring-1 focus:ring-indigo-500 font-bold bg-white text-gray-900"
                                                value={tempBudgets[category] || ''}
                                                onChange={(e) => setTempBudgets({...tempBudgets, [category]: Number(e.target.value)})}
                                                placeholder="0"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded whitespace-nowrap ml-2">
                                            Limit: ₹{allocated.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {!isEditingBudgets && (
                                    <>
                                        <div className="flex justify-between items-end mt-1">
                                             <span className="text-2xl font-bold text-gray-800">₹{remaining.toLocaleString()}</span>
                                             <span className="text-xs text-gray-400 mb-1">left</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${percentUsed}%`, 
                                                    backgroundColor: CATEGORY_COLORS[category as ExpenseCategory] || '#94a3b8'
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                            <span>Spent: ₹{spent.toLocaleString()}</span>
                                            <span>{Math.round(percentUsed)}%</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <h3 className="font-bold text-gray-700">Spending Breakdown</h3>
                 <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 font-medium hidden sm:inline">Export:</span>
                    <input 
                        type="month" 
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                        className="bg-white border border-gray-300 text-sm rounded-md px-2 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button 
                        onClick={handleDownloadReport} 
                        className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                        title="Download CSV Report"
                    >
                        <Download className="w-3.5 h-3.5" /> 
                        <span className="hidden sm:inline">Download CSV</span>
                    </button>
                 </div>
            </div>
            {totalSpent > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-48 col-span-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expenseChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {expenseChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as ExpenseCategory] || '#94a3b8'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="col-span-1 flex flex-col justify-center space-y-2">
                        {expenseChartData.sort((a,b) => b.value - a.value).map(item => (
                             <div key={item.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: CATEGORY_COLORS[item.name as ExpenseCategory] || '#94a3b8'}}></div>
                                    <span className="text-gray-600">{categoryLabels[item.name] || item.name}</span>
                                </div>
                                <span className="font-semibold text-gray-800">₹{item.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">No spending yet</div>
            )}
        </div>
        
        <div className="flex flex-col gap-4">
             <button 
                onClick={() => { setTransactionType('EXPENSE'); setIsAdding(true); }}
                className="flex-1 bg-red-600 text-white rounded-xl p-4 shadow-lg hover:bg-red-700 transition-all flex flex-col items-center justify-center gap-2"
            >
                <div className="p-3 bg-red-500 rounded-full">
                    <TrendingDown className="w-6 h-6" />
                </div>
                <span className="font-bold text-lg">Add Expense</span>
                <span className="text-xs text-red-100 opacity-80">Subtract from pool</span>
             </button>

             <button 
                onClick={() => { setTransactionType('COLLECTION'); setIsAdding(true); }}
                className="flex-1 bg-green-600 text-white rounded-xl p-4 shadow-lg hover:bg-green-700 transition-all flex flex-col items-center justify-center gap-2"
            >
                <div className="p-3 bg-green-500 rounded-full">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <span className="font-bold text-lg">Collect Money</span>
                <span className="text-xs text-green-100 opacity-80">Add to pool</span>
             </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-indigo-100 animate-fade-in relative">
            <div className="absolute top-4 right-4">
                 <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                {transactionType === 'EXPENSE' ? <TrendingDown className="text-red-500" /> : <TrendingUp className="text-green-500" />}
                {transactionType === 'EXPENSE' ? 'Add New Expense' : 'Record Money Collection'}
            </h3>

            {transactionType === 'EXPENSE' && (
                <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Wand2 className="w-3 h-3" /> AI Quick Fill
                    </label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="e.g. Bought Petrol for 500" 
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 text-sm text-gray-900 placeholder-gray-400"
                            value={naturalText}
                            onChange={(e) => setNaturalText(e.target.value)}
                        />
                        <button 
                            onClick={handleAiParse}
                            disabled={aiLoading || !naturalText}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            {aiLoading ? '...' : 'Scan'}
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transactionType === 'EXPENSE' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input required type="text" placeholder="e.g. Weekly Veggies" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
                    </div>
                ) : (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Roommate Paying</label>
                        <select 
                            value={formData.paidBy} 
                            onChange={e => setFormData({...formData, paidBy: e.target.value})} 
                            className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        >
                            {roommates.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                         <p className="text-xs text-gray-400 mt-1">This will automatically set amount to their agreed rent.</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                    <input required type="number" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
                </div>

                {transactionType === 'EXPENSE' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select 
                                value={formData.category} 
                                onChange={e => handleCategoryChange(e.target.value)} 
                                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                            >
                                {displayCategories.map(c => (
                                    <option key={c} value={c}>
                                        {c.startsWith('Custom-') ? (categoryLabels[c] || 'Custom Fund') : c}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Paid By (Who swiped card?)</label>
                             <select value={formData.paidBy} onChange={e => setFormData({...formData, paidBy: e.target.value})} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
                                {roommates.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Split Among (Who consumed?)</label>
                            <div className="flex flex-wrap gap-2">
                                {roommates.map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => {
                                            const current = formData.splitAmong;
                                            const next = current.includes(r.id) ? current.filter(id => id !== r.id) : [...current, r.id];
                                            setFormData({...formData, splitAmong: next});
                                        }}
                                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                            formData.splitAmong.includes(r.id) 
                                            ? 'bg-indigo-600 text-white border-indigo-600' 
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {r.name} {r.isVegetarian && '(Veg)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                     <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                     <button 
                        type="submit" 
                        className={`px-6 py-2 text-white rounded-lg shadow-md ${transactionType === 'EXPENSE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                     >
                        {transactionType === 'EXPENSE' ? 'Confirm Expense' : 'Confirm Collection'}
                     </button>
                </div>
            </form>
        </div>
      )}

      {/* Transaction List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
             <h3 className="font-semibold text-gray-700">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-white border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Person</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {expenses.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No transactions recorded yet.</td></tr>
                    ) : (
                        expenses.slice().reverse().map(expense => {
                            const isContribution = expense.category === ExpenseCategory.CONTRIBUTION;
                            return (
                                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isContribution ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {isContribution ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                         </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-800">{expense.title}</p>
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 mt-1 inline-block">
                                            {expense.category.startsWith('Custom-') ? (categoryLabels[expense.category] || 'Custom') : expense.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {roommates.find(r => r.id === expense.paidBy)?.name}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${isContribution ? 'text-green-600' : 'text-gray-800'}`}>
                                        {isContribution ? '+' : '-'} ₹{expense.amount.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
