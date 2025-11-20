'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Edit, Trash2 } from 'lucide-react';

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
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('my-locations');
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchUserProperties();
  }, []);

  async function fetchUserData() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('No authenticated user, redirecting to home');
        router.push('/');
        return;
      }

      console.log('Authenticated user ID:', user.id);

      const { data: userDetails, error: userError } = await supabase
        .from('users')
        .select('full_name, email, company_name, phone')
        .eq('id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user details:', userError);
      }

      if (userDetails) {
        console.log('User details loaded:', userDetails);
        setUserData({
          fullName: userDetails.full_name || '',
          email: userDetails.email || user.email || '',
          company: userDetails.company_name || '',
          phone: userDetails.phone || ''
        });
      } else {
        console.log('No user details found in database, using auth metadata');
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

  async function fetchUserProperties() {
    setLoadingProperties(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        return;
      }

      setUserProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  }

  async function handleDeleteProperty(propertyId: string, propertyName: string) {
    if (!confirm(`Are you sure you want to delete "${propertyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Property deleted successfully!' });
      fetchUserProperties();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to delete property: ' + error.message });
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
          company_name: userData.company,
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'acumin-pro-wide' }}>
              Production Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Welcome back, {userData.fullName || 'User'}</p>
          </div>
          <Button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/');
            }}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Sign Out
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('my-locations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-locations'
                    ? 'border-[#e11921] text-[#e11921]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Locations
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

            {activeTab === 'my-locations' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Locations</h2>
                  <p className="text-gray-600 mt-1">Properties you've submitted for listing</p>
                </div>

                {loadingProperties ? (
                  <div className="text-center py-12 text-gray-500">
                    Loading your properties...
                  </div>
                ) : userProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">You haven't listed any properties yet.</p>
                    <Button
                      onClick={() => router.push('/list-your-property')}
                      className="bg-[#e11921] text-white hover:bg-[#bf151c]"
                    >
                      List Your First Property
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Property
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Address
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submitted
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userProperties.map((property) => (
                          <tr key={property.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {property.primary_image && (
                                  <img
                                    src={property.primary_image}
                                    alt={property.name}
                                    className="h-10 w-10 rounded object-cover mr-3"
                                  />
                                )}
                                <div className="text-sm font-medium text-gray-900">
                                  {property.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{property.address}</div>
                              <div className="text-sm text-gray-500">
                                {property.city}, {property.county}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                property.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : property.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(property.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                {property.status === 'active' && (
                                  <button
                                    onClick={() => router.push(`/property/${property.id}`)}
                                    className="text-blue-600 hover:text-blue-900 p-1"
                                    title="View Property"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => router.push(`/edit-property/${property.id}`)}
                                  className="text-gray-600 hover:text-gray-900 p-1"
                                  title="Edit Property"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProperty(property.id, property.name)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Delete Property"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
