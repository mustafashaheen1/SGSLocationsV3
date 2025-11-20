'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    county: '',
    zipcode: '',
    property_type: '',
    square_footage: '',
    lot_size: '',
    bedrooms: '',
    bathrooms: '',
    parking_spaces: '',
    year_built: '',
    daily_rate: '',
    permit_details: '',
    permits_available: false,
  });

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  async function fetchProperty() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching property:', error);
        setMessage({ type: 'error', text: 'Property not found or you do not have permission to edit it.' });
        return;
      }

      setProperty(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        county: data.county || '',
        zipcode: data.zipcode || '',
        property_type: data.property_type || '',
        square_footage: data.square_footage?.toString() || '',
        lot_size: data.lot_size?.toString() || '',
        bedrooms: data.bedrooms?.toString() || '',
        bathrooms: data.bathrooms?.toString() || '',
        parking_spaces: data.parking_spaces?.toString() || '',
        year_built: data.year_built?.toString() || '',
        daily_rate: data.daily_rate?.toString() || '',
        permit_details: data.permit_details || '',
        permits_available: data.permits_available || false,
      });
    } catch (error) {
      console.error('Error loading property:', error);
      setMessage({ type: 'error', text: 'Failed to load property.' });
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  async function handleSave() {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'You must be logged in to edit properties.' });
        return;
      }

      const { error } = await supabase
        .from('properties')
        .update({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          county: formData.county,
          zipcode: formData.zipcode,
          property_type: formData.property_type,
          square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
          lot_size: formData.lot_size ? parseInt(formData.lot_size) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
          year_built: formData.year_built ? parseInt(formData.year_built) : null,
          daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
          permit_details: formData.permit_details,
          permits_available: formData.permits_available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId)
        .eq('owner_id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Property updated successfully!' });
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error updating property:', error);
      setMessage({ type: 'error', text: 'Failed to update property: ' + error.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading property...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{message.text || 'Property not found'}</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: '110px' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
          <p className="text-gray-600 mt-1">Update your property details</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Name
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Property name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/County
                  </label>
                  <Input
                    name="county"
                    value={formData.county}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <Input
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <Input
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleInputChange}
                    placeholder="e.g., Residential, Commercial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Square Footage
                  </label>
                  <Input
                    type="number"
                    name="square_footage"
                    value={formData.square_footage}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lot Size (sq ft)
                  </label>
                  <Input
                    type="number"
                    name="lot_size"
                    value={formData.lot_size}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <Input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parking Spaces
                  </label>
                  <Input
                    type="number"
                    name="parking_spaces"
                    value={formData.parking_spaces}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Built
                  </label>
                  <Input
                    type="number"
                    name="year_built"
                    value={formData.year_built}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Rate ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    name="daily_rate"
                    value={formData.daily_rate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Permits */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filming Permits</h2>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="permits_available"
                    checked={formData.permits_available}
                    onChange={handleInputChange}
                    className="w-4 h-4 accent-red-600 focus:ring-red-500 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Permits Available</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permit Details
                  </label>
                  <textarea
                    name="permit_details"
                    value={formData.permit_details}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                    placeholder="Any additional information about permits..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#e11921] text-white hover:bg-[#bf151c]"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
