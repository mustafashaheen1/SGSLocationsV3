'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { uploadMultipleImages } from '@/lib/s3-upload';

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    county: '',
    zipcode: '',
    property_type: 'Residential',
    square_footage: '',
    lot_size: '',
    bedrooms: '',
    bathrooms: '',
    parking_spaces: '',
    year_built: '',
    features: [] as string[],
    categories: [] as string[],
    permits_available: false,
    permit_details: '',
    daily_rate: '',
  });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.city || !formData.daily_rate) {
      alert('Please fill in all required fields');
      return;
    }

    if (uploadedImages.length === 0) {
      alert('Please upload at least one property image');
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await uploadMultipleImages(uploadedImages, 'properties');

      const { error } = await supabase.from('properties').insert([{
        name: formData.name,
        description: formData.description || null,
        address: formData.address,
        city: formData.city,
        county: formData.county || null,
        zipcode: formData.zipcode || null,
        property_type: formData.property_type,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        lot_size: formData.lot_size ? parseFloat(formData.lot_size) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        features: formData.features,
        categories: formData.categories,
        permits_available: formData.permits_available,
        permit_details: formData.permit_details || null,
        daily_rate: parseFloat(formData.daily_rate),
        images: imageUrls,
        primary_image: imageUrls[0],
        status: 'active',
        owner_id: null,
      }]);

      if (error) throw error;

      alert('Property added successfully!');
      router.push('/admin/properties');
    } catch (error: any) {
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
            <label className="block text-sm font-medium mb-2">County</label>
            <Input
              name="county"
              value={formData.county}
              onChange={handleInputChange}
              placeholder="Dallas County"
            />
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
            <label className="block text-sm font-medium mb-2">Property Type</label>
            <select
              name="property_type"
              value={formData.property_type}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
              <option value="Land">Land</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Square Footage</label>
            <Input
              name="square_footage"
              type="number"
              value={formData.square_footage}
              onChange={handleInputChange}
              placeholder="2500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Lot Size (acres)</label>
            <Input
              name="lot_size"
              type="number"
              step="0.01"
              value={formData.lot_size}
              onChange={handleInputChange}
              placeholder="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bedrooms</label>
            <Input
              name="bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={handleInputChange}
              placeholder="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bathrooms</label>
            <Input
              name="bathrooms"
              type="number"
              step="0.5"
              value={formData.bathrooms}
              onChange={handleInputChange}
              placeholder="2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Parking Spaces</label>
            <Input
              name="parking_spaces"
              type="number"
              value={formData.parking_spaces}
              onChange={handleInputChange}
              placeholder="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Year Built</label>
            <Input
              name="year_built"
              type="number"
              value={formData.year_built}
              onChange={handleInputChange}
              placeholder="2020"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Daily Rate *</label>
            <Input
              name="daily_rate"
              type="number"
              step="0.01"
              value={formData.daily_rate}
              onChange={handleInputChange}
              placeholder="2500.00"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="permits_available"
                checked={formData.permits_available}
                onChange={handleInputChange}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Film Permits Available</span>
            </label>
          </div>

          {formData.permits_available && (
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Permit Details</label>
              <Textarea
                name="permit_details"
                value={formData.permit_details}
                onChange={handleInputChange}
                placeholder="Details about film permits..."
                rows={3}
              />
            </div>
          )}

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Property Images *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="imageUpload"
              />
              <label htmlFor="imageUpload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload images or drag and drop</p>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, WebP (Max 10 images)</p>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="bg-[#e11921] hover:bg-red-700">
            {loading ? 'Adding Property...' : 'Add Property'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
