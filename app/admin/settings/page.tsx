'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState({
    newBookings: true,
    propertyApprovals: true,
    userRegistrations: false,
    inquiries: true,
    systemUpdates: false,
  });

  const [priceRanges, setPriceRanges] = useState({
    minDailyRate: '100',
    maxDailyRate: '5000',
    defaultRate: '500',
  });

  const [contactInfo, setContactInfo] = useState({
    general_contact_email: '',
    general_contact_phone: '',
    general_contact_address: '',
  });

  const [categories, setCategories] = useState([
    'Modern Loft',
    'Warehouse',
    'Office Space',
    'Event Venue',
    'Historic Building',
    'Outdoor Space',
    'Studio',
    'Industrial',
    'Residential',
    'Commercial',
  ]);

  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const { data: settings } = await (supabase
        .from('site_settings') as any)
        .select('*')
        .in('key', ['general_contact_email', 'general_contact_phone', 'general_contact_address']);

      if (settings) {
        const email = (settings as any[]).find((s: any) => s.key === 'general_contact_email')?.value;
        const phone = (settings as any[]).find((s: any) => s.key === 'general_contact_phone')?.value;
        const address = (settings as any[]).find((s: any) => s.key === 'general_contact_address')?.value;

        setContactInfo({
          general_contact_email: parseValue(email) || 'paul@imagelocations.com',
          general_contact_phone: parseValue(phone) || '(310) 871-8004',
          general_contact_address: parseValue(address) || '9663 Santa Monica Blvd. Suite 842,\nBeverly Hills, CA 90210',
        });
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseValue = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') {
      try {
        let parsed = value;
        while (typeof parsed === 'string' && (parsed.startsWith('"') || parsed.startsWith('\\"'))) {
          parsed = JSON.parse(parsed);
        }
        return parsed;
      } catch (e) {
        return value.replace(/^"|"$/g, '');
      }
    }
    return String(value);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleContactInfoChange = (key: keyof typeof contactInfo, value: string) => {
    setContactInfo({ ...contactInfo, [key]: value });
  };

  const handleSaveContactInfo = async () => {
    setSaving(true);
    try {
      // Update or insert each setting
      for (const [key, value] of Object.entries(contactInfo)) {
        const { error } = await (supabase
          .from('site_settings') as any)
          .upsert({
            key: key,
            value: JSON.stringify(value),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
      }

      showSuccess('Contact information updated successfully');
    } catch (error) {
      console.error('Error saving contact info:', error);
      alert('Failed to save contact information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof emailNotifications) => {
    setEmailNotifications({ ...emailNotifications, [key]: !emailNotifications[key] });
    showSuccess('Notification settings updated');
  };

  const handlePriceRangeChange = (key: keyof typeof priceRanges, value: string) => {
    setPriceRanges({ ...priceRanges, [key]: value });
  };

  const handleSavePriceRanges = () => {
    showSuccess('Price ranges updated successfully');
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
      showSuccess('Category added successfully');
    }
  };

  const handleEditCategory = (index: number) => {
    setEditingCategory(index);
    setEditValue(categories[index]);
  };

  const handleSaveEdit = () => {
    if (editingCategory !== null && editValue.trim()) {
      const updated = [...categories];
      updated[editingCategory] = editValue.trim();
      setCategories(updated);
      setEditingCategory(null);
      setEditValue('');
      showSuccess('Category updated successfully');
    }
  };

  const handleDeleteCategory = (index: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter((_, i) => i !== index));
      showSuccess('Category deleted successfully');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e11921] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Contact Page Information Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Page Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Contact Email
            </label>
            <input
              type="email"
              value={contactInfo.general_contact_email}
              onChange={(e) => handleContactInfoChange('general_contact_email', e.target.value)}
              placeholder="paul@imagelocations.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Contact Phone
            </label>
            <input
              type="tel"
              value={contactInfo.general_contact_phone}
              onChange={(e) => handleContactInfoChange('general_contact_phone', e.target.value)}
              placeholder="(310) 871-8004"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Contact Address
            </label>
            <textarea
              value={contactInfo.general_contact_address}
              onChange={(e) => handleContactInfoChange('general_contact_address', e.target.value)}
              placeholder="9663 Santa Monica Blvd. Suite 842,&#10;Beverly Hills, CA 90210"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            <p className="mt-1 text-sm text-gray-500">Use line breaks to separate address lines</p>
          </div>
          <button
            onClick={handleSaveContactInfo}
            disabled={saving}
            className="w-full md:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Contact Information'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Email Notifications</h3>
        <div className="space-y-4">
          {Object.entries(emailNotifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
              <div>
                <h4 className="font-medium text-gray-900">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </h4>
                <p className="text-sm text-gray-500">
                  Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </p>
              </div>
              <button
                onClick={() => handleToggle(key as keyof typeof emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-red-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Default Price Ranges</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Daily Rate ($)
            </label>
            <input
              type="number"
              value={priceRanges.minDailyRate}
              onChange={(e) => handlePriceRangeChange('minDailyRate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Daily Rate ($)
            </label>
            <input
              type="number"
              value={priceRanges.maxDailyRate}
              onChange={(e) => handlePriceRangeChange('maxDailyRate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Rate ($)
            </label>
            <input
              type="number"
              value={priceRanges.defaultRate}
              onChange={(e) => handlePriceRangeChange('defaultRate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <button
            onClick={handleSavePriceRanges}
            className="w-full md:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Save Price Ranges
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Property Categories</h3>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="Add new category..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map((category, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              {editingCategory === index ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                  onBlur={handleSaveEdit}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  autoFocus
                />
              ) : (
                <>
                  <span className="font-medium text-gray-900">{category}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCategory(index)}
                      className="p-1 text-blue-600 hover:text-blue-700"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(index)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
