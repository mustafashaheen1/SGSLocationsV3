'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

const TEXAS_COUNTIES = [
  'Dallas', 'Tarrant', 'Collin', 'Denton', 'Rockwall', 'Kaufman', 'Ellis', 'Johnson',
  'Parker', 'Wise', 'Hood', 'Somervell', 'Hunt'
];

export default function ListYourPropertyPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    internationalPhone: '',
    streetAddress: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    listedElsewhere: '',
    propertyRole: '',
    propertyRoleOther: '',
    listedForSale: '',
    requestedUse: [] as string[],
    listedWith: [] as string[],
    howDidYouHear: [] as string[],
    additionalNotes: '',
    agreeToTerms: false,
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    if (value.length >= 6) {
      formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
    } else if (value.length >= 3) {
      formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  const handleCheckboxChange = (category: 'requestedUse' | 'listedWith' | 'howDidYouHear', value: string) => {
    setFormData(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
    if (errors[category]) {
      setErrors(prev => ({ ...prev, [category]: '' }));
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(file => {
      const isValid = file.type === 'image/jpeg' || file.type === 'image/png';
      return isValid;
    });
    setUploadedFiles(prev => [...prev, ...validFiles]);
    if (errors.files) {
      setErrors(prev => ({ ...prev, files: '' }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!formData.listedElsewhere) newErrors.listedElsewhere = 'This field is required';
    if (!formData.propertyRole) newErrors.propertyRole = 'This field is required';
    if (!formData.listedForSale) newErrors.listedForSale = 'This field is required';
    if (formData.requestedUse.length === 0) newErrors.requestedUse = 'Select at least one option';
    if (formData.listedWith.length === 0) newErrors.listedWith = 'Select at least one option';
    if (formData.howDidYouHear.length === 0) newErrors.howDidYouHear = 'Select at least one option';
    if (uploadedFiles.length < 4) newErrors.files = 'Please upload at least 4 images';
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
      console.log('Uploaded files:', uploadedFiles);
      alert('Form submitted successfully! Check console for details.');
    } else {
      alert('Please fill in all required fields.');
    }
  };

  return (
    <main className="min-h-screen bg-white pt-[110px]">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-red-600 mb-2">List Your Property</h1>
          <p className="text-lg text-gray-600">
            Be a part of the largest location database in the Dallas-Fort Worth area
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT COLUMN */}
            <div>
              {/* Contact Information */}
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="firstName" className="block font-medium text-gray-700 text-sm mb-1">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block font-medium text-gray-700 text-sm mb-1">
                      Last Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block font-medium text-gray-700 text-sm mb-1">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="mb-4">
                  <label htmlFor="phoneNumber" className="block font-medium text-gray-700 text-sm mb-1">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="(555) 555-5555"
                    maxLength={14}
                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phoneNumber && <p className="text-red-600 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label htmlFor="internationalPhone" className="block font-medium text-gray-700 text-sm mb-1">
                    International Phone
                  </label>
                  <input
                    type="tel"
                    id="internationalPhone"
                    name="internationalPhone"
                    value={formData.internationalPhone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </section>

              {/* Property Address */}
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Property Address</h2>

                <div className="mb-4">
                  <label htmlFor="streetAddress" className="block font-medium text-gray-700 text-sm mb-1">
                    Street Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                      errors.streetAddress ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.streetAddress && <p className="text-red-600 text-sm mt-1">{errors.streetAddress}</p>}
                </div>

                <div className="mb-4">
                  <label htmlFor="addressLine2" className="block font-medium text-gray-700 text-sm mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="city" className="block font-medium text-gray-700 text-sm mb-1">
                      City <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block font-medium text-gray-700 text-sm mb-1">
                      ZIP Code <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      maxLength={10}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                        errors.zipCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.zipCode && <p className="text-red-600 text-sm mt-1">{errors.zipCode}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="state" className="block font-medium text-gray-700 text-sm mb-1">
                    State <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select County</option>
                    {TEXAS_COUNTIES.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
                </div>
              </section>

              {/* Radio Questions */}
              <section className="mb-6">
                <div className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    Is this location listed on any other location platforms such as Airbnb or Peerspace? <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="listedElsewhere"
                        value="yes"
                        checked={formData.listedElsewhere === 'yes'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="listedElsewhere"
                        value="no"
                        checked={formData.listedElsewhere === 'no'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                  {errors.listedElsewhere && <p className="text-red-600 text-sm mt-1">{errors.listedElsewhere}</p>}
                </div>

                <div className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    Are you currently: <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="propertyRole"
                        value="owner"
                        checked={formData.propertyRole === 'owner'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">Property Owner</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="propertyRole"
                        value="manager"
                        checked={formData.propertyRole === 'manager'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">Property Manager</span>
                    </label>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="propertyRole"
                      value="other"
                      checked={formData.propertyRole === 'other'}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2">Other</span>
                  </label>
                  {formData.propertyRole === 'other' && (
                    <input
                      type="text"
                      name="propertyRoleOther"
                      value={formData.propertyRoleOther}
                      onChange={handleInputChange}
                      placeholder="Specify Other"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                    />
                  )}
                  {errors.propertyRole && <p className="text-red-600 text-sm mt-1">{errors.propertyRole}</p>}
                </div>

                <div className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    Is this location currently listed for sale? <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="listedForSale"
                        value="yes"
                        checked={formData.listedForSale === 'yes'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="listedForSale"
                        value="no"
                        checked={formData.listedForSale === 'no'}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                  {errors.listedForSale && <p className="text-red-600 text-sm mt-1">{errors.listedForSale}</p>}
                </div>
              </section>

              {/* Checkbox Sections */}
              <section className="mb-6">
                <div className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    I request that my property be considered for location and event use as follows: (check all that apply) <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Still & Print Photography', 'TV & Motion Pictures', 'Corporate Events', 'Long or Short Term Lease'].map(option => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requestedUse.includes(option)}
                          onChange={() => handleCheckboxChange('requestedUse', option)}
                          className="w-4 h-4 accent-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="ml-2 text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.requestedUse && <p className="text-red-600 text-sm mt-1">{errors.requestedUse}</p>}
                </div>

                <div className="mb-6">
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    I request that my property be listed with: (check all that apply) <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['SGS Locations', 'Wedding Estates (Wedding Photography)', 'FilmHere.com (Student Films)'].map(option => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.listedWith.includes(option)}
                          onChange={() => handleCheckboxChange('listedWith', option)}
                          className="w-4 h-4 accent-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="ml-2 text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.listedWith && <p className="text-red-600 text-sm mt-1">{errors.listedWith}</p>}
                </div>

                <div>
                  <label className="block font-medium text-gray-700 text-sm mb-3">
                    How did you hear about us? <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Online Search', 'Currently Listed Property Owner', 'Production Referral', 'Other'].map(option => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.howDidYouHear.includes(option)}
                          onChange={() => handleCheckboxChange('howDidYouHear', option)}
                          className="w-4 h-4 accent-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="ml-2 text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.howDidYouHear && <p className="text-red-600 text-sm mt-1">{errors.howDidYouHear}</p>}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div>
              {/* Image Upload */}
              <section className="mb-6">
                <label className="block font-medium text-gray-700 text-sm mb-1">
                  Please Include 4-8 Images
                </label>
                <p className="text-sm text-gray-500 mb-2">(Only JPGs and PNGs accepted.)</p>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className={`border-2 border-dashed rounded bg-gray-50 min-h-[350px] flex flex-col items-center justify-center p-8 cursor-pointer transition-colors ${
                    isDragging ? 'border-blue-500 bg-blue-50' : errors.files ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">Drop files here to upload</p>
                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 w-full">
                      <p className="font-medium text-gray-700 mb-2 text-sm">{uploadedFiles.length} file(s) selected:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {uploadedFiles.map((file, index) => (
                          <li key={index} className="truncate">{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {errors.files && <p className="text-red-600 text-sm mt-1">{errors.files}</p>}
              </section>

              {/* Additional Notes */}
              <section className="mb-6">
                <label htmlFor="additionalNotes" className="block font-medium text-gray-700 text-sm mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  rows={8}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                />
              </section>

              {/* Terms and Conditions */}
              <section className="mb-6">
                <label className="block font-semibold text-gray-700 mb-2">Terms and Conditions</label>
                <div className="max-h-[300px] overflow-y-auto border border-gray-300 rounded p-4 bg-gray-50 text-sm leading-relaxed">
                  <p className="mb-4">
                    SGS Locations, with unparalleled professionalism, represents the most exclusive locations for location shooting of motion pictures, television shows, commercials, still photography and location use for special events.
                  </p>
                  <p className="mb-4">
                    If you are interested in listing and hosting your property for the entertainment industry location rental, for special events, or weddings, we encourage you to submit photographs of your property for our consideration.
                  </p>
                  <p className="mb-4">
                    If we agree to represent your property, we will contact you and provide a representation agreement.
                  </p>
                  <p className="mb-2 font-semibold">By submitting your online application, you represent that:</p>
                  <ol className="list-decimal pl-5 space-y-2 mb-4">
                    <li>You are the owner of the property or that you have the legal authority to act on behalf of the owner.</li>
                    <li>You are the owner or copyright holder of all photographs submitted with your application.</li>
                    <li>All photographs submitted remain the property of the photographer, and you grant SGS Locations the right to use the images without compensation.</li>
                    <li>You understand that submission does not create a representative relationship, unless SGS Locations expressly accepts your application.</li>
                    <li>By submitting photographs, you grant permission to SGS Locations to utilize the photographs for considering whether to represent your property.</li>
                    <li>Upon acceptance and entry into a representation agreement, SGS Locations may use, display, copy, post, publish, exhibit and/or distribute for marketing purposes.</li>
                    <li>Any photographs submitted will not be returned to you.</li>
                  </ol>
                </div>
              </section>

              {/* Agreement Checkbox */}
              <section className="mb-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }));
                      if (errors.agreeToTerms) {
                        setErrors(prev => ({ ...prev, agreeToTerms: '' }));
                      }
                    }}
                    className={`w-4 h-4 accent-red-600 focus:ring-red-500 rounded mt-1 ${
                      errors.agreeToTerms ? 'border-red-500' : ''
                    }`}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to the foregoing terms <span className="text-red-600">*</span>
                  </span>
                </label>
                {errors.agreeToTerms && <p className="text-red-600 text-sm mt-1">{errors.agreeToTerms}</p>}
              </section>

              {/* Please Note */}
              <section className="text-sm text-gray-600 mt-4">
                <p className="font-bold text-gray-900 mb-1">PLEASE NOTE</p>
                <p className="mb-1"><span className="text-red-600">*</span> Indicates required fields</p>
                <p>All submissions are subject to review & approval by SGS Locations</p>
              </section>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-center md:justify-end">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-12 rounded text-lg transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
