'use client';

import { Building2, Users, Mail, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Properties', value: '65', icon: Building2, color: 'bg-blue-500' },
    { label: 'Pending', value: '3', icon: Clock, color: 'bg-yellow-500' },
    { label: 'Users', value: '142', icon: Users, color: 'bg-green-500' },
    { label: 'Inquiries', value: '8', icon: Mail, color: 'bg-red-500' },
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'New property listing',
      property: 'Modern Loft Studio',
      user: 'John Smith',
      time: '10 minutes ago',
    },
    {
      id: 2,
      action: 'User registration',
      property: null,
      user: 'Sarah Johnson',
      time: '1 hour ago',
    },
    {
      id: 3,
      action: 'Inquiry received',
      property: 'Downtown Office Space',
      user: 'Mike Davis',
      time: '2 hours ago',
    },
    {
      id: 4,
      action: 'Property approved',
      property: 'Warehouse Studio',
      user: 'Admin',
      time: '3 hours ago',
    },
    {
      id: 5,
      action: 'New booking request',
      property: 'Rooftop Event Space',
      user: 'Emily Chen',
      time: '5 hours ago',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{activity.action}</p>
                  {activity.property && (
                    <p className="text-gray-600 text-sm mt-1">Property: {activity.property}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">By: {activity.user}</p>
                </div>
                <span className="text-gray-500 text-sm whitespace-nowrap ml-4">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Listings</span>
              <span className="font-bold text-gray-900">62</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Inactive Listings</span>
              <span className="font-bold text-gray-900">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Bookings</span>
              <span className="font-bold text-gray-900">248</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue This Month</span>
              <span className="font-bold text-green-600">$18,450</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Services</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Email Service</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Storage</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                78% Used
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
