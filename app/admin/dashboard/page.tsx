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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Get admin session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No active session');
        setLoading(false);
        return;
      }

      const { directFetch } = await import('@/lib/supabase');

      // Fetch ALL properties count (for total)
      const { data: allProperties } = await directFetch('properties', {
        select: 'id',
        authToken: session.access_token
      });

      // Fetch pending properties count
      const { data: pendingProperties } = await directFetch('properties', {
        select: 'id',
        eq: { status: 'pending' },
        authToken: session.access_token
      });

      // Fetch users count
      const { data: users } = await directFetch('users', {
        select: 'id',
        authToken: session.access_token
      });

      // Fetch new inquiries count
      const { data: inquiries } = await directFetch('inquiries', {
        select: 'id',
        eq: { status: 'new' },
        authToken: session.access_token
      });

      // Calculate total views across all properties
      const { data: viewsData } = await directFetch('properties', {
        select: 'view_count',
        authToken: session.access_token
      });

      const totalViews = (viewsData as any[])?.reduce((sum: number, prop: any) => sum + (prop.view_count || 0), 0) || 0;

      // Count total image downloads
      const { data: downloads } = await directFetch('image_downloads', {
        select: 'id',
        authToken: session.access_token
      });

      setStats({
        totalProperties: (allProperties as any[])?.length || 0,
        pendingProperties: (pendingProperties as any[])?.length || 0,
        totalUsers: (users as any[])?.length || 0,
        totalInquiries: (inquiries as any[])?.length || 0,
        totalViews: totalViews,
        totalDownloads: (downloads as any[])?.length || 0,
      });
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
    </div>
  );
}
