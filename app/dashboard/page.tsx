'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Edit, Trash2, Search, Bookmark, Calendar, Heart, X, MapPin, Home, DollarSign } from 'lucide-react';
import { getGuestListing, clearGuestListing } from '@/lib/guest-listing';
import MasterCalendar from '@/components/MasterCalendar';

export default function ProductionDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState<'production' | 'property_owner'>('production');
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
  const [activeTab, setActiveTab] = useState('searches'); // Default to searches for all users
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [loadingSearches, setLoadingSearches] = useState(false);
  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [processingPendingSubmission, setProcessingPendingSubmission] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<string>('');
  const [deletingItemType, setDeletingItemType] = useState<'search' | 'property' | 'favorite' | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchUserProperties();
    fetchSavedSearches();
    fetchFavoriteProperties();
    handlePendingPropertySubmission();
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
        .select('full_name, email, company_name, phone, user_type')
        .eq('id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user details:', userError);
      }

      if (userDetails) {
        console.log('User details loaded:', userDetails);
        setUserType((userDetails as any).user_type || 'production');
        setUserData({
          fullName: (userDetails as any).full_name || '',
          email: (userDetails as any).email || user.email || '',
          company: (userDetails as any).company_name || '',
          phone: (userDetails as any).phone || ''
        });
      } else {
        console.log('No user details found in database, using auth metadata');
        setUserType('production');
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

  async function handlePendingPropertySubmission() {
    if (processingPendingSubmission) return;

    const pendingListing = await getGuestListing();
    if (!pendingListing) return;

    setProcessingPendingSubmission(true);
    console.log('Found pending property listing, submitting...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, cannot submit pending property');
        return;
      }

      // Import the upload function
      const { uploadMultipleImages } = await import('@/lib/s3-upload');

      // Upload images to S3 (files are already File objects from IndexedDB)
      const uploadedImageUrls = await uploadMultipleImages(pendingListing.imageFiles, 'properties');

      // Insert property
      const { data: property, error: propertyError } = await (supabase
        .from('properties') as any)
        .insert([{
          name: `${pendingListing.formData.streetAddress}, ${pendingListing.formData.city}`,
          description: `Submitted by ${pendingListing.formData.firstName} ${pendingListing.formData.lastName} (${pendingListing.formData.email})`,
          address: pendingListing.formData.streetAddress,
          city: pendingListing.formData.city,
          county: pendingListing.formData.state,
          zipcode: pendingListing.formData.zipCode,
          owner_id: user.id,
          property_type: 'Residential',
          daily_rate: '0',
          categories: pendingListing.selectedCategoryId ? [(await (supabase.from('categories') as any).select('name').eq('id', pendingListing.selectedCategoryId).single()).data?.name] : [],
          property_tags: pendingListing.propertyTags,
          images: uploadedImageUrls,
          primary_image: uploadedImageUrls[0],
          status: 'pending',
        }])
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Insert property images
      const propertyImagesData = uploadedImageUrls.map((url, index) => ({
        property_id: property.id,
        image_url: url,
        tags: [],
        display_order: index,
      }));

      const { error: imagesError } = await (supabase
        .from('property_images') as any)
        .insert(propertyImagesData);

      if (imagesError) throw imagesError;

      // Clear guest listing data
      clearGuestListing();

      // Show success message
      setMessage({
        type: 'success',
        text: 'Property submitted successfully! We will review it and get back to you soon.'
      });

      // Refresh properties list
      fetchUserProperties();

      // Clear message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);

      console.log('Property submitted successfully:', property.id);
    } catch (error: any) {
      console.error('Error submitting pending property:', error);
      setMessage({
        type: 'error',
        text: 'Failed to submit property: ' + error.message
      });
      clearGuestListing();
    } finally {
      setProcessingPendingSubmission(false);
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

  async function fetchSavedSearches() {
    setLoadingSearches(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved searches:', error);
        return;
      }

      setSavedSearches(data || []);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    } finally {
      setLoadingSearches(false);
    }
  }

  async function fetchFavoriteProperties() {
    setLoadingFavorites(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase
        .from('favorite_properties') as any)
        .select(`
          *,
          properties (
            id,
            name,
            city,
            county,
            address,
            primary_image,
            images
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorite properties:', error);
        return;
      }

      setFavoriteProperties(data || []);
    } catch (error) {
      console.error('Error loading favorite properties:', error);
    } finally {
      setLoadingFavorites(false);
    }
  }

  async function handleDeleteFavorite(favoriteId: string, propertyName: string) {
    if (!confirm(`Are you sure you want to remove "${propertyName}" from your favorites?`)) {
      return;
    }

    setDeletingItemId(favoriteId);
    setDeletingItemType('favorite');
    setDeleteProgress('Starting deletion...');

    // Give React time to render the modal
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      setDeleteProgress('🗑️ Removing from favorites...');
      const { error } = await (supabase
        .from('favorite_properties') as any)
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setDeleteProgress('✓ Removed successfully!');

      // Short delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      await fetchFavoriteProperties();
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove favorite: ' + error.message);
    } finally {
      setDeletingItemId(null);
      setDeletingItemType(null);
      setDeleteProgress('');
    }
  }

  async function handleDeleteSearch(searchId: string, searchName: string) {
    if (!confirm(`Are you sure you want to delete "${searchName}"?`)) {
      return;
    }

    setDeletingItemId(searchId);
    setDeletingItemType('search');
    setDeleteProgress('Starting deletion...');

    // Give React time to render the modal
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      setDeleteProgress('🗑️ Deleting saved search from database...');
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;

      setDeleteProgress('✓ Saved search deleted successfully!');

      // Short delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage({ type: 'success', text: 'Search deleted successfully!' });
      await fetchSavedSearches();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to delete search: ' + error.message });
    } finally {
      setDeletingItemId(null);
      setDeletingItemType(null);
      setDeleteProgress('');
    }
  }

  function handleGoToSearch(search: any) {
    // Prepare search criteria for restoration
    const searchCriteria = {
      query: search.search_text || null,
      filters: search.filters || [],
      category: null,
    };

    // Store the complete search criteria in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('restoreSearch', JSON.stringify(searchCriteria));
    }

    // Navigate to search page with a restore flag
    router.push('/search?restore=true');
  }

  async function handleViewProperty(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      setSelectedProperty(data);
      setShowPropertyModal(true);
    } catch (error) {
      console.error('Error fetching property details:', error);
      alert('Failed to load property details');
    }
  }

  async function handleDeleteProperty(propertyId: string, propertyName: string) {
    if (!confirm(`Are you sure you want to delete "${propertyName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingItemId(propertyId);
    setDeletingItemType('property');
    setDeleteProgress('Starting deletion...');

    // Give React time to render the modal
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      setDeleteProgress('🗑️ Deleting property from database...');
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      setDeleteProgress('✓ Property deleted successfully!');

      // Short delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage({ type: 'success', text: 'Property deleted successfully!' });
      await fetchUserProperties();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to delete property: ' + error.message });
    } finally {
      setDeletingItemId(null);
      setDeletingItemType(null);
      setDeleteProgress('');
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await (supabase
        .from('users') as any)
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
              {userType === 'property_owner' ? 'Property Owner Dashboard' : 'Producer Dashboard'}
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
            <nav className="flex space-x-4 sm:space-x-8 px-6 overflow-x-auto scrollbar-hide">
              {/* Only show My Locations tab for property owners */}
              {userType === 'property_owner' && (
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
              )}
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
                onClick={() => setActiveTab('favorites')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'favorites'
                    ? 'border-[#e11921] text-[#e11921]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Favorites
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
            {message.text && (
              <div className={`mb-6 p-4 rounded ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Master Calendar for Property Owners */}
            {activeTab === 'my-locations' && userType === 'property_owner' && (
              <div className="mb-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Master Calendar</h3>
                <p className="text-sm text-gray-600 mb-4">View all events across all your properties</p>
                <div className="bg-white rounded-lg shadow">
                  <MasterCalendar />
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

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

            {activeTab === 'my-locations' && userType === 'property_owner' && (
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
                  <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
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
                                <button
                                  onClick={() => handleViewProperty(property.id)}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                                >
                                  {property.name}
                                </button>
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
                                  onClick={() => router.push(`/property/${property.id}/calendar`)}
                                  className="text-purple-600 hover:text-purple-900 p-1"
                                  title="View Calendar"
                                >
                                  <Calendar className="w-4 h-4" />
                                </button>
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

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-4">
                    {userProperties.map((property) => (
                      <div key={property.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-start gap-3">
                          {property.primary_image && (
                            <img
                              src={property.primary_image}
                              alt={property.name}
                              className="w-20 h-20 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => handleViewProperty(property.id)}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block text-left w-full"
                            >
                              {property.name}
                            </button>
                            <p className="text-sm text-gray-600 truncate">{property.address}</p>
                            <p className="text-sm text-gray-500">{property.city}, {property.county}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                property.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : property.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(property.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {property.status === 'active' && (
                            <button
                              onClick={() => router.push(`/property/${property.id}`)}
                              className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/property/${property.id}/calendar`)}
                            className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
                          >
                            <Calendar className="w-4 h-4" />
                            Calendar
                          </button>
                          <button
                            onClick={() => router.push(`/edit-property/${property.id}`)}
                            className="py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(property.id, property.name)}
                            className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'searches' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Saved Searches</h2>
                  <p className="text-gray-600 mt-1">Quick access to your saved search criteria</p>
                </div>

                {loadingSearches ? (
                  <div className="text-center py-12 text-gray-500">
                    Loading your saved searches...
                  </div>
                ) : savedSearches.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">You haven't saved any searches yet.</p>
                    <p className="text-sm text-gray-400 mb-6">
                      Use the "Save Search" button on the search page to save your searches for quick access.
                    </p>
                    <Button
                      onClick={() => router.push('/search')}
                      className="bg-[#e11921] text-white hover:bg-[#bf151c]"
                    >
                      Go to Search
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedSearches.map((search) => {
                      const hasSearchText = search.search_text && search.search_text.trim();
                      const hasTags = search.tags && Array.isArray(search.tags) && search.tags.length > 0;

                      return (
                        <div key={search.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{search.name}</h3>
                              <p className="text-xs text-gray-500">
                                Saved on {new Date(search.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteSearch(search.id, search.name)}
                              className="text-gray-400 hover:text-red-600 p-1"
                              title="Delete search"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3 mb-4">
                            {/* Search Text */}
                            {hasSearchText && (
                              <div className="flex items-start text-sm">
                                <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 line-clamp-2">{search.search_text}</span>
                              </div>
                            )}

                            {/* Filter Tags */}
                            {hasTags && (
                              <div>
                                <p className="text-xs text-gray-500 mb-2">Filter Tags:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {search.tags.slice(0, 5).map((tag: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {search.tags.length > 5 && (
                                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                      +{search.tags.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Result Count */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <span className="text-sm text-gray-500">Results:</span>
                              <span className="text-lg font-semibold text-[#e11921]">
                                {search.result_count || 0}
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleGoToSearch(search)}
                            className="w-full bg-[#e11921] text-white hover:bg-[#bf151c] text-sm py-2"
                          >
                            View Results
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Favorite Properties</h2>
                  <p className="text-gray-600 mt-1">Properties you've marked as favorites</p>
                </div>

                {loadingFavorites ? (
                  <div className="text-center py-12 text-gray-500">
                    Loading your favorite properties...
                  </div>
                ) : favoriteProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">You haven't added any favorites yet.</p>
                    <p className="text-sm text-gray-400 mb-6">
                      Click the heart icon on any property page to add it to your favorites.
                    </p>
                    <Button
                      onClick={() => router.push('/search')}
                      className="bg-[#e11921] text-white hover:bg-[#bf151c]"
                    >
                      Browse Properties
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteProperties.map((favorite: any) => {
                      const property = favorite.properties;
                      if (!property) return null;

                      return (
                        <div key={favorite.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                          <div
                            className="relative h-32 sm:h-48 bg-gray-200 cursor-pointer"
                            onClick={() => router.push(`/property/${property.id}`)}
                          >
                            {property.primary_image || (property.images && property.images[0]) ? (
                              <img
                                src={property.primary_image || property.images[0]}
                                alt={property.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{property.name}</h3>
                                <p className="text-sm text-gray-600">{property.city}, {property.county}</p>
                                {property.address && (
                                  <p className="text-xs text-gray-500 mt-1">{property.address}</p>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-gray-500 mb-4">
                              Added on {new Date(favorite.created_at).toLocaleDateString()}
                            </p>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => router.push(`/property/${property.id}`)}
                                className="flex-1 bg-[#e11921] text-white hover:bg-[#bf151c] text-sm py-2"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Property
                              </Button>
                              <button
                                onClick={() => handleDeleteFavorite(favorite.id, property.name)}
                                className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded transition-colors"
                                title="Remove from favorites"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deletion Progress Modal */}
      {deletingItemId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {deletingItemType === 'search' ? 'Deleting Saved Search' : 'Deleting Property'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {deletingItemType === 'search'
                  ? 'Please wait while we delete the saved search...'
                  : 'Please wait while we delete the property...'}
              </p>
              {deleteProgress && (
                <div className="bg-gray-50 rounded p-3 text-sm font-mono text-left">
                  {deleteProgress}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {showPropertyModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Property Details</h2>
              <button
                onClick={() => setShowPropertyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Property Names */}
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Actual Property Name (Admin Only)</h3>
                  <p className="text-lg font-medium text-blue-800">
                    {selectedProperty.real_name || 'Not set'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">This name is only visible to you and admins</p>
                </div>

                {selectedProperty.status === 'active' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-900 mb-2">Public Name (Shown to Everyone)</h3>
                    <p className="text-lg font-medium text-green-800">{selectedProperty.name}</p>
                    <p className="text-xs text-green-600 mt-1">This is what people see on the website</p>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${
                  selectedProperty.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : selectedProperty.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  Status: {selectedProperty.status.charAt(0).toUpperCase() + selectedProperty.status.slice(1)}
                </span>
              </div>

              {/* Property Images */}
              {selectedProperty.images && selectedProperty.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedProperty.images.slice(0, 6).map((image: string, idx: number) => (
                      <img
                        key={idx}
                        src={image}
                        alt={`Property image ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                  {selectedProperty.images.length > 6 && (
                    <p className="text-sm text-gray-500 mt-2">
                      + {selectedProperty.images.length - 6} more images
                    </p>
                  )}
                </div>
              )}

              {/* Property Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    Location
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Address:</span> {selectedProperty.address}</p>
                    <p className="text-sm"><span className="font-medium">City:</span> {selectedProperty.city}</p>
                    <p className="text-sm"><span className="font-medium">County:</span> {selectedProperty.county}</p>
                    <p className="text-sm"><span className="font-medium">ZIP Code:</span> {selectedProperty.zipcode}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Home className="w-5 h-5 text-gray-600" />
                    Property Details
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Type:</span> {selectedProperty.property_type || 'N/A'}</p>
                    {selectedProperty.square_footage && (
                      <p className="text-sm"><span className="font-medium">Square Footage:</span> {selectedProperty.square_footage.toLocaleString()} sq ft</p>
                    )}
                    {selectedProperty.bedrooms && (
                      <p className="text-sm"><span className="font-medium">Bedrooms:</span> {selectedProperty.bedrooms}</p>
                    )}
                    {selectedProperty.bathrooms && (
                      <p className="text-sm"><span className="font-medium">Bathrooms:</span> {selectedProperty.bathrooms}</p>
                    )}
                    {selectedProperty.year_built && (
                      <p className="text-sm"><span className="font-medium">Year Built:</span> {selectedProperty.year_built}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Daily Rate */}
              {selectedProperty.daily_rate && (
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    Daily Rate
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">${selectedProperty.daily_rate}</p>
                </div>
              )}

              {/* Description */}
              {selectedProperty.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedProperty.description}</p>
                </div>
              )}

              {/* Categories */}
              {selectedProperty.categories && selectedProperty.categories.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.categories.map((category: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Tags */}
              {selectedProperty.property_tags && selectedProperty.property_tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Features & Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.property_tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Permits */}
              {selectedProperty.permits_available && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Permits</h3>
                  <p className="text-sm text-green-700 font-medium mb-2">✓ Permits Available</p>
                  {selectedProperty.permit_details && (
                    <p className="text-sm text-gray-700">{selectedProperty.permit_details}</p>
                  )}
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <p><span className="font-medium">Created:</span> {new Date(selectedProperty.created_at).toLocaleDateString()}</p>
                <p><span className="font-medium">Last Updated:</span> {new Date(selectedProperty.updated_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              {selectedProperty.status === 'active' && (
                <Button
                  onClick={() => {
                    setShowPropertyModal(false);
                    router.push(`/property/${selectedProperty.id}`);
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  View Public Page
                </Button>
              )}
              <Button
                onClick={() => {
                  setShowPropertyModal(false);
                  router.push(`/edit-property/${selectedProperty.id}`);
                }}
                className="bg-gray-600 text-white hover:bg-gray-700"
              >
                Edit Property
              </Button>
              <Button
                onClick={() => setShowPropertyModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
