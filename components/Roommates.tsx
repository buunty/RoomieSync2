
import React, { useState } from 'react';
import { Roommate, Role } from '../types';
import { Trash2, UserPlus, Leaf, Shield, Banknote } from 'lucide-react';

interface RoommatesProps {
  currentUser: Roommate;
  roommates: Roommate[];
  onAddRoommate: (r: Roommate) => void;
  onDeleteRoommate: (id: string) => void;
  onQuickAddRent?: (userId: string, amount: number) => void;
}

const Roommates: React.FC<RoommatesProps> = ({ currentUser, roommates, onAddRoommate, onDeleteRoommate, onQuickAddRent }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: Role.MEMBER,
    isVegetarian: false,
    agreedContribution: 6000
  });

  const isAdmin = currentUser.role === Role.ADMIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoommate: Roommate = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      isVegetarian: formData.isVegetarian,
      avatarUrl: `https://picsum.photos/seed/${formData.name.replace(/\s/g, '')}/200/200`,
      agreedContribution: Number(formData.agreedContribution)
    };
    onAddRoommate(newRoommate);
    setIsAdding(false);
    setFormData({ name: '', email: '', role: Role.MEMBER, isVegetarian: false, agreedContribution: 6000 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Roommates</h2>
          <p className="text-gray-500">Manage members and their rent details</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">New Roommate Details</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                required
                type="email"
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              >
                <option value={Role.MEMBER}>Member</option>
                <option value={Role.ADMIN}>Admin</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent Amount (₹)</label>
              <input
                required
                type="number"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400"
                value={formData.agreedContribution}
                onChange={(e) => setFormData({ ...formData, agreedContribution: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center pt-6">
               <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={formData.isVegetarian}
                    onChange={e => setFormData({...formData, isVegetarian: e.target.checked})}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 bg-white"
                />
                <span className="text-gray-700 font-medium">Is Vegetarian?</span>
               </label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
              >
                Save Roommate
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roommates.map((person) => (
          <div key={person.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
            {/* Role Badge */}
            <div className="absolute top-0 right-0 p-4">
                {person.role === Role.ADMIN && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                        <Shield className="w-3 h-3" /> Admin
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4">
                <img
                src={person.avatarUrl}
                alt={person.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100"
                />
                <div>
                    <h3 className="font-bold text-gray-800">{person.name}</h3>
                    <p className="text-sm text-gray-500">{person.email}</p>
                    <div className="flex gap-2 mt-2">
                        {person.isVegetarian && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                <Leaf className="w-3 h-3" /> Veg
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 font-medium uppercase">Monthly Rent</p>
                    <p className="text-lg font-bold text-gray-800">₹{person.agreedContribution.toLocaleString()}</p>
                </div>
                {isAdmin && onQuickAddRent && (
                    <button 
                        onClick={() => onQuickAddRent(person.id, person.agreedContribution)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                        title="Mark rent as collected"
                    >
                        <Banknote className="w-4 h-4" /> Collect
                    </button>
                )}
            </div>

            {isAdmin && person.id !== currentUser.id && (
              <button
                onClick={() => onDeleteRoommate(person.id)}
                className="absolute bottom-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Remove Member"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Roommates;
