'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function ListPropertyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    propertyType: '',
    address: '',
    city: '',
    county: '',
    zipcode: '',
    description: '',
    squareFootage: '',
    lotSize: '',
    bedrooms: '',
    bathrooms: '',
    parkingSpaces: '',
    yearBuilt: '',
    features: [] as string[],
    categories: [] as string[],
    permitsAvailable: false,
    permitDetails: '',
    dailyRate: '',
    images: [] as string[],
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const featureOptions = [
    'Pool', 'Kitchen', 'Parking', 'Garage', 'Patio Balconies',
    'Fireplace', 'Garden', 'Driveway', 'Deck', 'Hardwood Floors'
  ];

  const categoryOptions = [
    'Modern', 'New', 'Historical', 'Luxury', 'Industrial',
    'Commercial', 'Residential', 'Natural'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleArrayValue = (field: 'features' | 'categories', value: string) => {
    const current = formData[field];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to list a property',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    const { error } = await supabase.from('properties').insert({
      name: formData.name,
      property_type: formData.propertyType,
      address: formData.address,
      city: formData.city,
      county: formData.county,
      zipcode: formData.zipcode,
      description: formData.description,
      square_footage: formData.squareFootage ? parseInt(formData.squareFootage) : null,
      lot_size: formData.lotSize ? parseFloat(formData.lotSize) : null,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
      parking_spaces: formData.parkingSpaces ? parseInt(formData.parkingSpaces) : null,
      year_built: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
      features: formData.features,
      categories: formData.categories,
      permits_available: formData.permitsAvailable,
      permit_details: formData.permitDetails,
      daily_rate: parseFloat(formData.dailyRate),
      images: formData.images,
      primary_image: formData.images[0] || null,
      owner_id: user.id,
      status: 'pending',
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Your property has been submitted for review',
      });
      router.push('/dashboard');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-[110px]">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Property</h1>
          <p className="text-gray-600 mb-8">Step {currentStep} of {totalSteps}</p>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div
              className="bg-[#dc2626] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Basic Information</h2>

              <div>
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Modern Downtown Loft"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Select value={formData.propertyType} onValueChange={(value) => setFormData({ ...formData, propertyType: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Residential">Residential</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Dallas"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="zipcode">ZIP Code</Label>
                  <Input
                    id="zipcode"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleInputChange}
                    placeholder="75201"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  name="county"
                  value={formData.county}
                  onChange={handleInputChange}
                  placeholder="Dallas County"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Property Details</h2>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your property..."
                  rows={5}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="squareFootage">Square Footage</Label>
                  <Input
                    id="squareFootage"
                    name="squareFootage"
                    type="number"
                    value={formData.squareFootage}
                    onChange={handleInputChange}
                    placeholder="2500"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lotSize">Lot Size (acres)</Label>
                  <Input
                    id="lotSize"
                    name="lotSize"
                    type="number"
                    step="0.01"
                    value={formData.lotSize}
                    onChange={handleInputChange}
                    placeholder="0.5"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    placeholder="3"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    placeholder="2.5"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="parkingSpaces">Parking</Label>
                  <Input
                    id="parkingSpaces"
                    name="parkingSpaces"
                    type="number"
                    value={formData.parkingSpaces}
                    onChange={handleInputChange}
                    placeholder="2"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  name="yearBuilt"
                  type="number"
                  value={formData.yearBuilt}
                  onChange={handleInputChange}
                  placeholder="2020"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="mb-3 block">Features</Label>
                <div className="grid grid-cols-2 gap-3">
                  {featureOptions.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={formData.features.includes(feature)}
                        onCheckedChange={() => toggleArrayValue('features', feature)}
                      />
                      <label htmlFor={feature} className="text-sm cursor-pointer">
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Categories</Label>
                <div className="grid grid-cols-2 gap-3">
                  {categoryOptions.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={formData.categories.includes(category)}
                        onCheckedChange={() => toggleArrayValue('categories', category)}
                      />
                      <label htmlFor={category} className="text-sm cursor-pointer">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Photos</h2>
              <p className="text-gray-600">Add photos of your property (You can add image URLs for now)</p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-700 mb-2">Drag and drop photos here</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                <Input
                  placeholder="Paste image URL (e.g., https://...)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value;
                      if (value) {
                        setFormData({ ...formData, images: [...formData.images, value] });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                      <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Pricing & Permits</h2>

              <div>
                <Label htmlFor="dailyRate">Daily Rate ($)</Label>
                <Input
                  id="dailyRate"
                  name="dailyRate"
                  type="number"
                  value={formData.dailyRate}
                  onChange={handleInputChange}
                  placeholder="1500"
                  className="mt-1"
                />
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="permitsAvailable"
                  checked={formData.permitsAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, permitsAvailable: checked as boolean })}
                />
                <div>
                  <label htmlFor="permitsAvailable" className="font-medium cursor-pointer">
                    Film permits available
                  </label>
                  <p className="text-sm text-gray-500">Check if your property has filming permits</p>
                </div>
              </div>

              {formData.permitsAvailable && (
                <div>
                  <Label htmlFor="permitDetails">Permit Details</Label>
                  <Textarea
                    id="permitDetails"
                    name="permitDetails"
                    value={formData.permitDetails}
                    onChange={handleInputChange}
                    placeholder="Provide details about available permits..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Review & Submit</h2>
              <p className="text-gray-600">Please review your listing before submitting</p>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-1">Property Name</h3>
                  <p className="text-gray-900">{formData.name || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-1">Address</h3>
                  <p className="text-gray-900">{formData.address}, {formData.city}, TX {formData.zipcode}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-1">Daily Rate</h3>
                  <p className="text-gray-900">${formData.dailyRate}/day</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-1">Features</h3>
                  <p className="text-gray-900">{formData.features.join(', ') || 'None selected'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-[#dc2626] hover:bg-[#b91c1c]"
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-[#dc2626] hover:bg-[#b91c1c]"
              >
                Submit Listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
