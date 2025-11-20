# Edit Property Page Restructuring Guide

The edit-property page needs to match the list-your-property form exactly. This requires significant changes.

## Current Issues

❌ Shows wrong fields (property_type, square_footage, bedrooms, etc.)
❌ Missing contact information fields
❌ Missing category selection
❌ Missing search filter tags
❌ Missing image upload/management
❌ Different layout from list-your-property

## What Needs to Match

The edit form should have the EXACT same fields as `/app/list-your-property/page.tsx`:

### **Required Fields:**

**Contact Information:**
- First Name
- Last Name
- Email
- Phone Number

**Property Location:**
- Street Address (with Google autocomplete)
- City
- State (dropdown)
- ZIP Code

**Property Details:**
- Category Selection (single select from categories)
- Search Filter Tags (multi-select organized by filter groups)
- Additional Notes (textarea)

**Images:**
- Current images display
- Ability to upload new images
- Ability to remove images
- Image tagging functionality

**Terms:**
- Terms and conditions checkbox

## Recommended Approach

### **Option 1: Create New Edit Page Based on List-Your-Property** ⭐ RECOMMENDED

1. **Copy list-your-property form structure**
2. **Modify for editing:**
   - Pre-fill all form fields with existing data
   - Load existing images
   - Load existing category
   - Load existing tags
   - Change submit button text to "Update Property"
   - Update the submit handler to UPDATE instead of INSERT

### **Option 2: Create Shared Form Component**

1. Create `/components/PropertyForm.tsx`
2. Use it in both list-your-property and edit-property
3. Pass mode prop: `mode="create"` or `mode="edit"`
4. Handle differences internally

## Key Code Changes Needed

### **1. Update Form State**

Replace current formData with:

```typescript
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  additionalNotes: '',
  agreeToTerms: false,
});

const [uploadedFiles, setUploadedFiles] = useState<ImageWithTags[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [availableTags, setAvailableTags] = useState<FilterTag[]>([]);
const [selectedCategoryId, setSelectedCategoryId] = useState('');
const [propertyTags, setPropertyTags] = useState<string[]>([]);
```

### **2. Fetch Property Data**

Update fetchProperty to load:

```typescript
async function fetchProperty() {
  const { data: property } = await supabase
    .from('properties')
    .select(`
      *,
      property_images (
        id,
        image_url,
        tags,
        display_order
      )
    `)
    .eq('id', propertyId)
    .single();

  // Pre-fill form
  setFormData({
    firstName: '', // Extract from description or leave empty
    lastName: '',
    email: '',
    phoneNumber: '',
    streetAddress: property.address,
    city: property.city,
    state: property.county,
    zipCode: property.zipcode,
    additionalNotes: property.description,
    agreeToTerms: true, // Already agreed
  });

  // Set category
  if (property.categories?.[0]) {
    const cat = categories.find(c => c.name === property.categories[0]);
    setSelectedCategoryId(cat?.id || '');
  }

  // Set tags
  setPropertyTags(property.property_tags || []);

  // Set images
  const images = property.property_images.map(img => ({
    file: null, // No file object for existing images
    preview: img.image_url,
    tags: img.tags || [],
    existing: true, // Mark as existing
    id: img.id,
  }));
  setUploadedFiles(images);
}
```

### **3. Update Submit Handler**

Change from INSERT to UPDATE:

```typescript
async function handleUpdate() {
  setSaving(true);

  try {
    // Upload any new images
    const newFiles = uploadedFiles.filter(f => !f.existing);
    const existingImages = uploadedFiles.filter(f => f.existing);

    let newImageUrls = [];
    if (newFiles.length > 0) {
      const { uploadMultipleImages } = await import('@/lib/s3-upload');
      const imageFiles = newFiles.map(img => img.file);
      newImageUrls = await uploadMultipleImages(imageFiles, 'properties');
    }

    const allImageUrls = [
      ...existingImages.map(img => img.preview),
      ...newImageUrls
    ];

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    // UPDATE property
    const { error } = await supabase
      .from('properties')
      .update({
        address: formData.streetAddress,
        city: formData.city,
        county: formData.state,
        zipcode: formData.zipCode,
        description: formData.additionalNotes,
        categories: selectedCategory ? [selectedCategory.name] : [],
        property_tags: propertyTags,
        images: allImageUrls,
        primary_image: allImageUrls[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId);

    if (error) throw error;

    setMessage({ type: 'success', text: 'Property updated successfully!' });
    setTimeout(() => router.push('/dashboard'), 2000);
  } catch (error: any) {
    setMessage({ type: 'error', text: error.message });
  } finally {
    setSaving(false);
  }
}
```

### **4. Add Google Maps Autocomplete**

Copy from list-your-property:

```typescript
import Script from 'next/script';

// In component:
const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
const addressInputRef = useRef<HTMLInputElement>(null);
const autocompleteRef = useRef<any>(null);

// Add Script tag in return:
<Script
  src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
  onLoad={() => {
    setGoogleMapsLoaded(true);
    initializeGoogleAutocomplete();
  }}
/>

// Add initialization function (copy from list-your-property)
```

### **5. Add Category Selection UI**

Copy the entire category selection section from list-your-property:

```typescript
{/* Category Selection */}
<section className="mb-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4">
    Select Category <span className="text-red-600">*</span>
  </h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    {categories.map((category) => (
      <button
        key={category.id}
        type="button"
        onClick={() => setSelectedCategoryId(category.id)}
        className={`
          p-4 border-2 rounded-lg transition-all
          ${selectedCategoryId === category.id
            ? 'border-red-600 bg-red-50'
            : 'border-gray-200 hover:border-red-300'
          }
        `}
      >
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-24 object-cover rounded mb-2"
        />
        <p className="text-sm font-medium text-gray-900">
          {category.name}
        </p>
      </button>
    ))}
  </div>
</section>
```

### **6. Add Filter Tags UI**

Copy the entire filter tags section from list-your-property (the collapsible filter groups).

### **7. Add Image Management UI**

Copy the image upload section but modify to:
- Show existing images
- Allow removing existing images
- Allow adding new images
- Preserve image tags

## Files to Reference

📄 `/app/list-your-property/page.tsx` - Copy form structure from here
📄 `/app/edit-property/[id]/page.tsx` - Update this file
📄 `/lib/s3-upload.ts` - Image upload utilities

## Steps to Implement

1. ✅ **Reduce top margins** (DONE)
2. ⬜ **Update form state** to match list-your-property
3. ⬜ **Copy UI sections** from list-your-property:
   - Contact information
   - Address with Google autocomplete
   - Category selection
   - Filter tags
   - Image upload/management
4. ⬜ **Update fetchProperty** to load all data
5. ⬜ **Update handleSubmit** to UPDATE instead of INSERT
6. ⬜ **Test thoroughly**

## Testing Checklist

After implementation, test:
- [ ] Form pre-fills with existing data
- [ ] Can edit all fields
- [ ] Can change category
- [ ] Can add/remove tags
- [ ] Can see existing images
- [ ] Can upload new images
- [ ] Can remove existing images
- [ ] Update saves correctly to database
- [ ] Back button works
- [ ] Loading states work
- [ ] Error handling works

## Estimated Work

This is a significant refactoring - approximately:
- **Time**: 2-4 hours
- **Lines changed**: 500-800 lines
- **Complexity**: Medium-High

The most reliable approach is to essentially rebuild the edit page using list-your-property as a template, then modify it for editing instead of creating.
