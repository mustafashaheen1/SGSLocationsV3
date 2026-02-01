'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { uploadImageToS3 } from '@/lib/s3-upload';
import { Lock, Upload, X, Info, Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEmails, setSavingEmails] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [emailSettings, setEmailSettings] = useState({
    propertyInquiryEmail: '',
    generalInquiryEmail: '',
  });

  const [logoSettings, setLogoSettings] = useState({
    logoUrl: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // AI Photo Analysis State
  const [aiPhotoAnalysisEnabled, setAiPhotoAnalysisEnabled] = useState(false);
  const [savingAiSetting, setSavingAiSetting] = useState(false);

  useEffect(() => {
    checkAdminAndFetchEmail();
  }, []);

  async function checkAdminAndFetchEmail() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/admin/login');
      return;
    }

    // Use directFetch WITH authToken for RLS-protected admins table
    const { directFetch } = await import('@/lib/supabase');
    const { data: admin } = await directFetch('admins', {
      select: '*',
      eq: { email: session.user.email || '' },
      single: true,
      authToken: session.access_token
    });

    if (!admin) {
      router.push('/admin/login');
      return;
    }

    setAdminEmail(session.user.email || '');

    // Fetch email settings
    await fetchEmailSettings();

    // Fetch logo settings
    await fetchLogoSettings();

    // Fetch AI Photo Analysis setting
    await fetchAiPhotoAnalysisSetting();

    setLoading(false);
  }

  async function fetchEmailSettings() {
    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No session token available');
        return;
      }

      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const { settings } = data;

        const propertyEmail = settings?.find((s: any) => s.setting_key === 'property_inquiry_email');
        const generalEmail = settings?.find((s: any) => s.setting_key === 'general_inquiry_email');

        setEmailSettings({
          propertyInquiryEmail: propertyEmail?.setting_value || '',
          generalInquiryEmail: generalEmail?.setting_value || '',
        });
      } else {
        const error = await response.json();
        console.error('Failed to fetch email settings:', error);
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    }
  }

  async function fetchLogoSettings() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No session token available');
        return;
      }

      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const { settings } = data;

        const logo = settings?.find((s: any) => s.setting_key === 'site_logo_url');

        setLogoSettings({
          logoUrl: logo?.setting_value || '',
        });
        setLogoPreview(logo?.setting_value || '');
      }
    } catch (error) {
      console.error('Error fetching logo settings:', error);
    }
  }

  async function fetchAiPhotoAnalysisSetting() {
    try {
      const { data } = await (supabase
        .from('site_settings') as any)
        .select('*')
        .eq('key', 'ai_photo_analysis_enabled')
        .maybeSingle();

      if (data && data.value !== null && data.value !== undefined) {
        const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setAiPhotoAnalysisEnabled(value === true || value === 'true');
      }
    } catch (error) {
      console.error('Error fetching AI Photo Analysis setting:', error);
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSaveAiPhotoAnalysis = async () => {
    setSavingAiSetting(true);
    try {
      const { error } = await (supabase
        .from('site_settings') as any)
        .upsert({
          key: 'ai_photo_analysis_enabled',
          value: JSON.stringify(aiPhotoAnalysisEnabled),
          page: 'admin',
          section: 'settings',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      showMessage('success', 'AI Photo Analysis setting updated successfully!');
    } catch (error: any) {
      showMessage('error', 'Error saving: ' + error.message);
    } finally {
      setSavingAiSetting(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailSettings({
      ...emailSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      showMessage('error', 'Please select a logo image');
      return;
    }

    setUploadingLogo(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showMessage('error', 'Authentication error. Please refresh and try again.');
        setUploadingLogo(false);
        return;
      }

      // Upload to S3
      const logoUrl = await uploadImageToS3(logoFile, 'site-logo');

      // Save to database
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          settings: [
            { setting_key: 'site_logo_url', setting_value: logoUrl }
          ]
        })
      });

      if (response.ok) {
        setLogoSettings({ logoUrl });
        setLogoPreview(logoUrl);
        setLogoFile(null);
        showMessage('success', 'Logo uploaded successfully!');
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to upload logo');
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      showMessage('error', 'An error occurred: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the site logo?')) {
      return;
    }

    setUploadingLogo(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showMessage('error', 'Authentication error. Please refresh and try again.');
        setUploadingLogo(false);
        return;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          settings: [
            { setting_key: 'site_logo_url', setting_value: '' }
          ]
        })
      });

      if (response.ok) {
        setLogoSettings({ logoUrl: '' });
        setLogoPreview('');
        setLogoFile(null);
        showMessage('success', 'Logo removed successfully!');
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to remove logo');
      }
    } catch (error: any) {
      console.error('Error removing logo:', error);
      showMessage('error', 'An error occurred: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleEmailSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!emailSettings.propertyInquiryEmail || !emailSettings.generalInquiryEmail) {
      showMessage('error', 'Please fill in all email fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailSettings.propertyInquiryEmail) || !emailRegex.test(emailSettings.generalInquiryEmail)) {
      showMessage('error', 'Please enter valid email addresses');
      return;
    }

    setSavingEmails(true);

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showMessage('error', 'Authentication error. Please refresh and try again.');
        setSavingEmails(false);
        return;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          settings: [
            { setting_key: 'property_inquiry_email', setting_value: emailSettings.propertyInquiryEmail },
            { setting_key: 'general_inquiry_email', setting_value: emailSettings.generalInquiryEmail }
          ]
        })
      });

      if (response.ok) {
        showMessage('success', 'Email settings updated successfully!');
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to update email settings');
      }
    } catch (error: any) {
      console.error('Error updating email settings:', error);
      showMessage('error', 'An error occurred: ' + error.message);
    } finally {
      setSavingEmails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showMessage('error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New password and confirmation do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      showMessage('error', 'New password must be different from current password');
      return;
    }

    setSaving(true);

    try {
      // Step 1: Verify current password by attempting to sign in
      // This ensures the user knows their current password before changing it
      console.log('Verifying current password...');
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: passwordData.currentPassword,
      });

      if (signInError || !authData.user) {
        console.error('Current password verification failed:', signInError);
        showMessage('error', 'Current password is incorrect');
        setSaving(false);
        return;
      }

      console.log('Current password verified successfully');

      // Step 2: Update the password in Supabase Auth
      // This updates the password used for admin panel login
      console.log('Updating password...');
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        console.error('Password update failed:', updateError);
        showMessage('error', 'Failed to update password: ' + updateError.message);
        setSaving(false);
        return;
      }

      console.log('Password updated successfully');
      showMessage('success', 'Password updated successfully! You can now use your new password to login.');

      // Clear the form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

    } catch (error: any) {
      console.error('Error during password change:', error);
      showMessage('error', 'An error occurred: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-brand-hover'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={adminEmail}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Site Logo Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Site Logo</h3>
        <p className="text-sm text-gray-600 mb-6">Upload a custom logo to replace the default camera icon across the website and in emails</p>

        <div className="space-y-4">
          {/* Current Logo Preview */}
          {logoPreview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Logo
              </label>
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="Site Logo"
                  className="h-16 max-w-xs object-contain border border-gray-300 rounded p-2 bg-white"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/200x60?text=Logo+Not+Found';
                  }}
                />
                <button
                  onClick={handleRemoveLogo}
                  disabled={uploadingLogo}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-brand text-white rounded-full p-1"
                  title="Remove logo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Upload New Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </label>

            {!logoFile ? (
              <div
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-500 transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload logo image</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG (recommended: transparent background)</p>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                      setLogoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            ) : (
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-16 max-w-xs object-contain border border-gray-300 rounded p-2 bg-white"
                />
                <button
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(logoSettings.logoUrl || '');
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-brand text-white rounded-full p-1"
                  title="Cancel upload"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {logoFile && (
            <div className="pt-2">
              <button
                onClick={handleLogoUpload}
                disabled={uploadingLogo}
                className="w-full md:w-auto px-6 py-2 bg-brand hover:bg-brand-hover disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Email Notification Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Email Notification Settings</h3>
        <p className="text-sm text-gray-600 mb-6">Configure where inquiry notifications are sent</p>

        <form onSubmit={handleEmailSettingsSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Inquiry Email *
            </label>
            <input
              type="email"
              name="propertyInquiryEmail"
              value={emailSettings.propertyInquiryEmail}
              onChange={handleEmailSettingChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Email address to receive notifications for property-specific inquiries
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Inquiry Email *
            </label>
            <input
              type="email"
              name="generalInquiryEmail"
              value={emailSettings.generalInquiryEmail}
              onChange={handleEmailSettingChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Email address to receive notifications for general contact form inquiries
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={savingEmails}
              className="w-full md:w-auto px-6 py-2 bg-brand hover:bg-brand-hover disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {savingEmails ? 'Saving...' : 'Save Email Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* AI Photo Analysis Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI Photo Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">Control whether AI analyzes photos uploaded by admins</p>
          </div>
          <button
            onClick={handleSaveAiPhotoAnalysis}
            disabled={savingAiSetting}
            className="px-4 py-2 bg-brand hover:bg-brand-hover disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingAiSetting ? 'Saving...' : 'Save Setting'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Enable AI Photo Analysis</h4>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, AI will automatically analyze and tag photos uploaded through the admin panel.
                When disabled, photos will be uploaded without AI analysis.
              </p>
              <p className="text-xs text-brand mt-2 font-medium">
                Default: OFF (AI analysis disabled)
              </p>
            </div>
            <button
              onClick={() => setAiPhotoAnalysisEnabled(!aiPhotoAnalysisEnabled)}
              className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ml-4 ${
                aiPhotoAnalysisEnabled ? 'bg-brand' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={aiPhotoAnalysisEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  aiPhotoAnalysisEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Current Status</h4>
                <p className="text-sm text-blue-700 mt-1">
                  AI Photo Analysis is currently <span className="font-bold">{aiPhotoAnalysisEnabled ? 'ENABLED' : 'DISABLED'}</span>
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  {aiPhotoAnalysisEnabled
                    ? 'Photos uploaded through the admin panel will be analyzed by AI for automatic tagging and categorization.'
                    : 'Photos uploaded through the admin panel will NOT be analyzed by AI. Manual tagging will be required.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-gray-700" />
          <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password *
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto px-6 py-2 bg-brand hover:bg-brand-hover disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
