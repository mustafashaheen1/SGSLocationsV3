'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Camera, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { uploadMultipleImages } from '@/lib/s3-upload';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [smugmugUrl, setSmugmugUrl] = useState('');
  const [importingFromSmugmug, setImportingFromSmugmug] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [smugmugAuthorized, setSmugmugAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: 'Texas',
    zipcode: '',
    category_id: '',
    is_featured: false,
    is_exclusive: false,
  });

  useEffect(() => {
    fetchCategories();
    checkSmugMugAuth();
  }, []);

  async function checkSmugMugAuth() {
    try {
      const response = await fetch('/api/smugmug/check-auth');
      const data = await response.json();
      setSmugmugAuthorized(data.authorized);
    } catch (error) {
      console.error('Error checking SmugMug auth:', error);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function handleSmugMugAuthorize() {
    setAuthorizing(true);
    try {
      const response = await fetch('/api/smugmug/request-token');
      const data = await response.json();

      if (data.authUrl) {
        sessionStorage.setItem('smugmug_request_token_secret', data.requestTokenSecret);

        window.open(data.authUrl, 'SmugMug Authorization', 'width=800,height=600');

        const pollInterval = setInterval(async () => {
          const authCheck = await fetch('/api/smugmug/check-auth');
          const authData = await authCheck.json();

          if (authData.authorized) {
            clearInterval(pollInterval);
            setSmugmugAuthorized(true);
            setAuthorizing(false);
            alert('✓ SmugMug authorized successfully!');
          }
        }, 2000);

        setTimeout(() => clearInterval(pollInterval), 300000);
      }
    } catch (error: any) {
      console.error('Authorization error:', error);
      alert('Failed to start authorization: ' + error.message);
      setAuthorizing(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedImages(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function removeImage(index: number) {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSmugmugImport() {
    if (!smugmugUrl) {
      alert('Please enter a SmugMug album URL or album key');
      return;
    }

    setImportingFromSmugmug(true);
    setImportProgress('Processing...');

    try {
      let albumKey = smugmugUrl.trim();

      if (albumKey.includes('smugmug.com')) {
        setImportProgress('Extracting album key from URL...');

        const keyResponse = await fetch('/api/get-smugmug-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: albumKey }),
        });

        if (!keyResponse.ok) {
          const errorData = await keyResponse.json();
          throw new Error(errorData.suggestion || errorData.error || 'Could not extract album key');
        }

        const keyData = await keyResponse.json();
        albumKey = keyData.albumKey;
        console.log('✓ Extracted album key:', albumKey);
      } else {
        console.log('Using provided album key:', albumKey);
      }

      setImportProgress(`Fetching images from album ${albumKey}...`);

      const response = await fetch('/api/import-smugmug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumKey: albumKey,
          propertyId: null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import images');
      }

      const data = await response.json();

      setImportProgress(`✓ Successfully imported ${data.imported} of ${data.total} images!`);

      const newImageUrls = data.urls;
      setImagePreviews(prev => [...prev, ...newImageUrls]);

      const placeholderFiles = newImageUrls.map((url: string) => {
        return { name: url, uploaded: true } as any;
      });
      setUploadedImages(prev => [...prev, ...placeholderFiles]);

      setTimeout(() => {
        setImportProgress('');
        setSmugmugUrl('');
      }, 3000);
    } catch (error: any) {
      console.error('SmugMug import error:', error);
      setImportProgress('');
      alert(error.message || 'Failed to import from SmugMug');
    } finally {
      setImportingFromSmugmug(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.city || !formData.category_id) {
      alert('Please fill in all required fields');
      return;
    }

    if (uploadedImages.length < 10) {
      alert('Please upload at least 10 property images');
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find(cat => cat.id === formData.category_id);
      if (!selectedCategory) {
        throw new Error('Invalid category selected');
      }

      console.log(`Uploading ${uploadedImages.length} images...`);
      const imageUrls = await uploadMultipleImages(uploadedImages, 'properties');
      console.log('Images uploaded successfully');

      const { error } = await supabase.from('properties').insert([{
        name: formData.name,
        description: formData.description || null,
        address: formData.address,
        city: formData.city,
        county: formData.state,
        zipcode: formData.zipcode || null,
        property_type: 'Residential',
        square_footage: null,
        lot_size: null,
        bedrooms: null,
        bathrooms: null,
        parking_spaces: null,
        year_built: null,
        features: [],
        categories: [selectedCategory.name],
        permits_available: false,
        permit_details: null,
        daily_rate: 0,
        images: imageUrls,
        primary_image: imageUrls[0],
        status: 'active',
        owner_id: null,
        is_featured: formData.is_featured,
        is_exclusive: formData.is_exclusive,
      }]);

      if (error) throw error;

      alert('Property added successfully!');
      router.push('/admin/properties');
    } catch (error: any) {
      console.error('Error adding property:', error);
      alert('Error adding property: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add New Property</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Property Name *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Modern Downtown Loft"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Detailed property description..."
              rows={4}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Address *</label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="123 Main Street"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">City *</label>
            <Input
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Dallas"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">State *</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#e11921] focus:border-[#e11921]"
              required
            >
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">ZIP Code</label>
            <Input
              name="zipcode"
              value={formData.zipcode}
              onChange={handleInputChange}
              placeholder="75201"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#e11921] focus:border-[#e11921]"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#e11921] border-gray-300 rounded focus:ring-[#e11921]"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Featured Property</span>
                  <span className="text-xs text-gray-600">Display prominently on homepage</span>
                </div>
              </label>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_exclusive"
                  checked={formData.is_exclusive}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#e11921] border-gray-300 rounded focus:ring-[#e11921]"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Exclusive Property</span>
                  <span className="text-xs text-gray-600">Mark as exclusive listing</span>
                </div>
              </label>
            </div>
          </div>

          <div className="col-span-2">
            <div className="mb-8 p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Import from SmugMug
              </h3>

              {checkingAuth ? (
                <p className="text-sm text-gray-600">Checking authorization status...</p>
              ) : !smugmugAuthorized ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm font-medium text-yellow-900 mb-2">
                      🔐 Authorization Required
                    </p>
                    <p className="text-sm text-yellow-800 mb-3">
                      You need to authorize SGS Locations to access your SmugMug account. This is a one-time setup.
                    </p>
                    <Button
                      type="button"
                      onClick={handleSmugMugAuthorize}
                      disabled={authorizing}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      {authorizing ? 'Authorizing...' : 'Authorize SmugMug Access'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded mb-4">
                    <p className="text-sm font-medium text-green-900">
                      ✓ SmugMug Authorized
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SmugMug Album URL or Album Key
                    </label>
                    <Input
                      placeholder="Full URL or just the album key (e.g., ABC123xyz)"
                      value={smugmugUrl}
                      onChange={(e) => setSmugmugUrl(e.target.value)}
                    />
                    <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                      <p className="text-xs text-gray-700 font-medium mb-1">💡 How to find your album key:</p>
                      <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                        <li>Open your SmugMug album in a browser</li>
                        <li>Right-click → "View Page Source"</li>
                        <li>Press Ctrl+F (Cmd+F on Mac) and search for: <code className="bg-gray-100 px-1 rounded">"AlbumKey"</code></li>
                        <li>Copy the key value (e.g., "AlbumKey":"ABC123xyz")</li>
                        <li>Paste just the key part (ABC123xyz) or the full URL here</li>
                      </ol>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSmugmugImport}
                    disabled={!smugmugUrl || importingFromSmugmug}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {importingFromSmugmug ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Import Photos from SmugMug
                    </>
                  )}
                </Button>

                  {importProgress && (
                    <div className={`p-3 rounded ${
                      importProgress.includes('✓') ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <p className={`text-sm ${
                        importProgress.includes('✓') ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        {importProgress}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <label className="block text-sm font-medium mb-2">
              Property Images * (Minimum 10 images required)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="imageUpload"
              />
              <label htmlFor="imageUpload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to upload images or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, or WebP • Minimum 10 images • No maximum limit
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {uploadedImages.length} / 10 minimum uploaded
                </p>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    Uploaded Images: {uploadedImages.length}
                    {uploadedImages.length < 10 && (
                      <span className="text-red-600 ml-2">
                        (Need {10 - uploadedImages.length} more)
                      </span>
                    )}
                    {uploadedImages.length >= 10 && (
                      <span className="text-green-600 ml-2">✓ Minimum met</span>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={loading || uploadedImages.length < 10}
            className="bg-[#e11921] hover:bg-red-700"
          >
            {loading ? 'Adding Property...' : 'Add Property'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {uploadedImages.length < 10 && (
          <p className="text-sm text-red-600">
            * Please upload at least 10 images before submitting
          </p>
        )}
      </form>
    </div>
  );
}
