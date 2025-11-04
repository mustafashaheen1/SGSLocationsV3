'use client';

import { useState } from 'react';
import { Search, Edit, Ban, Trash2 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  type: 'Production Professional' | 'Property Owner';
  joined: string;
  status: 'active' | 'suspended';
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'John Smith', email: 'john.smith@email.com', type: 'Property Owner', joined: '2023-06-15', status: 'active' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah.j@email.com', type: 'Production Professional', joined: '2023-07-20', status: 'active' },
    { id: 3, name: 'Mike Davis', email: 'mike.davis@email.com', type: 'Property Owner', joined: '2023-08-10', status: 'active' },
    { id: 4, name: 'Emily Chen', email: 'emily.chen@email.com', type: 'Production Professional', joined: '2023-09-05', status: 'active' },
    { id: 5, name: 'David Wilson', email: 'david.w@email.com', type: 'Property Owner', joined: '2023-10-12', status: 'active' },
    { id: 6, name: 'Lisa Brown', email: 'lisa.brown@email.com', type: 'Production Professional', joined: '2023-11-08', status: 'suspended' },
    { id: 7, name: 'James Taylor', email: 'james.t@email.com', type: 'Property Owner', joined: '2023-12-01', status: 'active' },
    { id: 8, name: 'Maria Garcia', email: 'maria.garcia@email.com', type: 'Production Professional', joined: '2024-01-10', status: 'active' },
    { id: 9, name: 'Robert Martinez', email: 'robert.m@email.com', type: 'Property Owner', joined: '2024-01-15', status: 'active' },
    { id: 10, name: 'Jennifer Lee', email: 'jennifer.lee@email.com', type: 'Production Professional', joined: '2024-01-20', status: 'active' },
    { id: 11, name: 'William Anderson', email: 'will.anderson@email.com', type: 'Property Owner', joined: '2024-01-25', status: 'active' },
    { id: 12, name: 'Jessica Moore', email: 'jessica.m@email.com', type: 'Production Professional', joined: '2024-02-01', status: 'active' },
    { id: 13, name: 'Daniel White', email: 'daniel.white@email.com', type: 'Property Owner', joined: '2024-02-05', status: 'active' },
    { id: 14, name: 'Ashley Harris', email: 'ashley.h@email.com', type: 'Production Professional', joined: '2024-02-10', status: 'active' },
    { id: 15, name: 'Christopher Clark', email: 'chris.clark@email.com', type: 'Property Owner', joined: '2024-02-12', status: 'active' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSuspend = (id: number) => {
    if (confirm('Are you sure you want to suspend this user?')) {
      setLoading(true);
      setTimeout(() => {
        setUsers(users.map(u =>
          u.id === id ? { ...u, status: 'suspended' as const } : u
        ));
        setLoading(false);
        showSuccess('User suspended successfully');
      }, 500);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setLoading(true);
      setTimeout(() => {
        setUsers(users.filter(u => u.id !== id));
        setLoading(false);
        showSuccess('User deleted successfully');
      }, 500);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || user.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="Production Professional">Production Professional</option>
            <option value="Property Owner">Property Owner</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      {user.status === 'suspended' && (
                        <span className="text-xs text-red-600 font-medium">Suspended</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{user.email}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.type === 'Production Professional'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{user.joined}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        disabled={loading}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleSuspend(user.id)}
                          disabled={loading}
                          className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors disabled:opacity-50"
                          title="Suspend"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={loading}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
