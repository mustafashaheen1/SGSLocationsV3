'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProductionDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    company: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [stats, setStats] = useState({
    savedLocations: 0,
    activeSearches: 0,
    sentInquiries: 0,
    responseRate: 0
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('saved-locations');

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  async function fetchUserData() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/');
        return;
      }

      const { data: userDetails, error: userError } = await supabase
        .from('users')
        .select('full_name, email, company, phone')
        .eq('id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user details:', userError);
      }

      if (userDetails) {
        setUserData({
          fullName: userDetails.full_name || '',
          email: userDetails.email || user.email || '',
          company: userDetails.company || '',
          phone: userDetails.phone || ''
        });
      } else {
        setUserData({
          fullName: user.user_metadata?.full_name || '',
          email: user.email || '',
          company: '',
          phone: ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: savedCount } = await supabase
        .from('saved_properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: inquiriesCount } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        savedLocations: savedCount || 0,
        activeSearches: 0,
        sentInquiries: inquiriesCount || 0,
        responseRate: 85
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: userData.fullName,
          company: userData.company,
          phone: userData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setMessage({ type: '', text: '' });

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'All password fields are required' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: '110px' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'acumin-pro-wide' }}>
            Production Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back, {userData.fullName || 'User'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Saved Locations</p>
            <p className="text-3xl font-bold text-gray-900">{stats.savedLocations}</p>
            <p className="text-gray-500 text-xs mt-1">Across 5 collections</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Active Searches</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeSearches}</p>
            <p className="text-gray-500 text-xs mt-1">10 new matches</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Sent Inquiries</p>
            <p className="text-3xl font-bold text-gray-900">{stats.sentInquiries}</p>
            <p className="text-gray-500 text-xs mt-1">3 pending responses</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Response Rate</p>
            <p className="text-3xl font-bold text-gray-900">{stats.responseRate}%</p>
            <p className="text-green-600 text-xs mt-1">↑ 5% this month</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('saved-locations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'saved-locations'
                    ? 'border-[#e11921] text-[#e11921]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Saved Locations
              </button>
              <button
                onClick={() => setActiveTab('searches')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'searches'
                    ? 'border-[#e11921] text-[#e11921]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Searches
              </button>
              <button
                onClick={() => setActiveTab('inquiries')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inquiries'
                    ? 'border-[#e11921] text-[#e11921]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Inquiries
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-[#e11921] text-[#e11921]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Account Settings
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'settings' && (
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

                {message.text && (
                  <div className={`mb-6 p-4 rounded ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <Input
                        value={userData.fullName}
                        onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                        placeholder="John Smith"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        value={userData.email}
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <Input
                        value={userData.company}
                        onChange={(e) => setUserData({ ...userData, company: e.target.value })}
                        placeholder="DFW Productions LLC"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <Input
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="mt-6 bg-gray-900 text-white hover:bg-gray-800"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>

                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password (min 8 characters)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="bg-[#e11921] text-white hover:bg-[#bf151c]"
                    >
                      {saving ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'saved-locations' && (
              <div className="text-center py-12 text-gray-500">
                Saved locations will appear here
              </div>
            )}

            {activeTab === 'searches' && (
              <div className="text-center py-12 text-gray-500">
                Saved searches will appear here
              </div>
            )}

            {activeTab === 'inquiries' && (
              <div className="text-center py-12 text-gray-500">
                Your inquiries will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
