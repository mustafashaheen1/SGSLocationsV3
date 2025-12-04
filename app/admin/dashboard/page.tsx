'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, Mail, Clock, Eye, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MasterCalendar from '@/components/MasterCalendar';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    pendingProperties: 0,
    totalUsers: 0,
    totalInquiries: 0,
    totalViews: 0,
    totalDownloads: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: pendingCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: inquiriesCount } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Calculate total views across all properties
      const { data: viewsData } = await supabase
        .from('properties')
        .select('view_count');

      const totalViews = (viewsData as any[])?.reduce((sum: number, prop: any) => sum + (prop.view_count || 0), 0) || 0;

      // Count total image downloads
      const { count: downloadsCount } = await supabase
        .from('image_downloads')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalProperties: propertiesCount || 0,
        pendingProperties: pendingCount || 0,
        totalUsers: usersCount || 0,
        totalInquiries: inquiriesCount || 0,
        totalViews: totalViews,
        totalDownloads: downloadsCount || 0,
      });

      // Fetch recent properties - NO USER JOIN
      const { data: recentProps } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2);

      setRecentActivity(recentProps || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const statsData = [
    { label: 'Total Properties', value: stats.totalProperties.toString(), icon: Building2, color: 'bg-blue-500' },
    { label: 'Pending', value: stats.pendingProperties.toString(), icon: Clock, color: 'bg-yellow-500' },
    { label: 'Users', value: stats.totalUsers.toString(), icon: Users, color: 'bg-green-500' },
    { label: 'Inquiries', value: stats.totalInquiries.toString(), icon: Mail, color: 'bg-red-500' },
    { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'bg-purple-500' },
    { label: 'Image Downloads', value: stats.totalDownloads.toLocaleString(), icon: Download, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Master Calendar Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <MasterCalendar />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsData.map((stat) => {
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
          <h3 className="text-xl font-bold text-gray-900">Recent Properties</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{item.name}</p>
                    <p className="text-gray-600 text-sm mt-1">
                      {item.city}, Texas • {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No recent properties found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
