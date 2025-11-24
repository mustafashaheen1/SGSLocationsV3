# Document Management System - Complete Implementation Guide

## ✅ Completed So Far

### 1. Database Schema
**File**: `create-production-companies-schema.sql`
- ✅ Created `production_companies` table
- ✅ Created `documents` table with foreign key relationship
- ✅ Added RLS policies for security
- ✅ Added indexes for performance
- ✅ Included sample data for testing

**To Apply**: Run the SQL in Supabase SQL Editor

### 2. S3 Upload Functions
**File**: `lib/s3-upload.ts`
- ✅ Added `uploadDocumentToS3(file, subfolder)` - Uploads documents to S3 /documents folder
- ✅ Added `deleteDocumentFromS3(url)` - Deletes documents from S3

### 3. Production Companies List Page
**File**: `app/admin/production-companies/page.tsx`
- ✅ Lists all production companies
- ✅ Search functionality
- ✅ Add/Edit company modal
- ✅ Delete company with confirmation
- ✅ Toggle active/inactive status
- ✅ Link to company profile (documents)

## 📋 Remaining Implementation

### Step 1: Create Company Profile Page
**Location**: `app/admin/production-companies/[id]/page.tsx`

This page should:
- Display company details at the top
- Show all documents for this company in a table
- Allow uploading new documents
- Allow deleting documents
- Download document button

**Key Features**:
```typescript
interface Document {
  id: string;
  production_company_id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  document_type: string;
  created_at: string;
}

// Fetch company details
const { data: company } = await supabase
  .from('production_companies')
  .select('*')
  .eq('id', params.id)
  .single();

// Fetch documents for this company
const { data: documents } = await supabase
  .from('documents')
  .select('*')
  .eq('production_company_id', params.id)
  .order('created_at', { ascending: false });

// Upload document
const handleUpload = async (file: File) => {
  // 1. Upload to S3
  const fileUrl = await uploadDocumentToS3(file);

  // 2. Save to database
  const { error } = await supabase
    .from('documents')
    .insert([{
      production_company_id: params.id,
      title: formData.title,
      description: formData.description,
      file_url: fileUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      document_type: formData.document_type,
      uploaded_by: adminEmail,
    }]);
};

// Delete document
const handleDelete = async (doc: Document) => {
  // 1. Delete from S3
  await deleteDocumentFromS3(doc.file_url);

  // 2. Delete from database
  await supabase
    .from('documents')
    .delete()
    .eq('id', doc.id);
};
```

**UI Layout**:
```
┌────────────────────────────────────────┐
│ Company Info Card                      │
│ - Name, Contact, Email, Phone          │
│ - Edit Company Button                  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Documents Section                      │
│ - Upload Document Button               │
│ - Documents Table:                     │
│   * Title | Type | Size | Date | Actions│
└────────────────────────────────────────┘
```

**Document Types** (Dropdown):
- Contract
- Agreement
- Invoice
- Receipt
- Script
- Storyboard
- Release Form
- Permit
- Insurance
- Other

### Step 2: Create Documents Directory Page
**Location**: `app/admin/documents/page.tsx`

This page should:
- Show ALL documents from all production companies
- Search by document title OR company name
- Filter by document type
- Sort by date, company, or title
- View/Download/Delete actions

**Key Features**:
```typescript
// Fetch all documents with company info (JOIN)
const { data: documents } = await supabase
  .from('documents')
  .select(`
    *,
    production_companies!inner(
      id,
      name
    )
  `)
  .order('created_at', { ascending: false });

// Search filter
const filteredDocs = documents.filter(doc => {
  const searchLower = searchTerm.toLowerCase();
  return (
    doc.title.toLowerCase().includes(searchLower) ||
    doc.production_companies.name.toLowerCase().includes(searchLower) ||
    doc.document_type.toLowerCase().includes(searchLower)
  );
});
```

**UI Layout**:
```
┌────────────────────────────────────────┐
│ Search Bar + Filter by Type            │
└────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Documents Table                                         │
│ Title | Company | Type | Size | Uploaded | Actions     │
│ ----- | ------- | ---- | ---- | -------- | -------     │
│ Contract A | Paramount | Contract | 2.5MB | Jan 1 | View Delete │
│ Invoice #123 | Netflix | Invoice | 1.2MB | Jan 2 | View Delete │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Update Admin Navigation
**File**: `app/admin/layout.tsx`

Add to `menuItems` array:
```typescript
{
  label: 'Documents',
  icon: FileText, // or FolderOpen
  subItems: [
    { href: '/admin/production-companies', label: 'Production Companies' },
    { href: '/admin/documents', label: 'Document Directory' },
  ]
},
```

### Step 4: Add to imports in layout
```typescript
import { FolderOpen } from 'lucide-react';
```

## 🎨 UI Components to Use

### File Upload Component
```typescript
<div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
  <input
    type="file"
    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
    onChange={handleFileChange}
    className="hidden"
    id="file-upload"
  />
  <label
    htmlFor="file-upload"
    className="cursor-pointer flex flex-col items-center"
  >
    <Upload className="w-12 h-12 text-gray-400 mb-2" />
    <span className="text-sm text-gray-600">
      Click to upload or drag and drop
    </span>
    <span className="text-xs text-gray-500 mt-1">
      PDF, DOC, DOCX, XLS, XLSX (Max 10MB)
    </span>
  </label>
</div>
```

### Document Type Badge
```typescript
const getTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    Contract: 'bg-blue-100 text-blue-800',
    Invoice: 'bg-green-100 text-green-800',
    Agreement: 'bg-purple-100 text-purple-800',
    Script: 'bg-yellow-100 text-yellow-800',
    default: 'bg-gray-100 text-gray-800',
  };
  return colors[type] || colors.default;
};

<span className={`px-2 py-1 text-xs rounded ${getTypeColor(doc.document_type)}`}>
  {doc.document_type}
</span>
```

### File Size Formatter
```typescript
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
```

## 🔒 Security Considerations

1. **File Type Validation**
   - Only allow specific file types (PDF, DOC, DOCX, XLS, XLSX, TXT)
   - Check file extension AND MIME type

2. **File Size Limits**
   - Limit to 10MB per file
   - Check before upload

3. **RLS Policies**
   - Already configured in SQL schema
   - Only authenticated admins can upload/delete
   - Public can view active documents

4. **S3 Security**
   - Files in `/documents` folder
   - Public-read ACL for easy access
   - Consider signed URLs for private documents if needed

## 📊 Database Relationships

```
production_companies (1) ──── (Many) documents
                                       │
                                       └─ Cascade Delete
                                          (Deleting company deletes all docs)
```

## 🚀 Testing Checklist

After implementation, test:
- [ ] Create a production company
- [ ] Upload a document to the company
- [ ] View document in company profile
- [ ] View document in documents directory
- [ ] Search documents by company name
- [ ] Search documents by title
- [ ] Delete a document (check S3 too)
- [ ] Delete a company (documents should be deleted)
- [ ] Edit company details
- [ ] Toggle company active status

## 📝 Additional Features (Future Enhancement)

1. **Document Versions**
   - Track document versions
   - Keep history of uploads

2. **Document Categories**
   - Tag documents with multiple categories
   - Filter by tags

3. **Expiration Dates**
   - Set expiration on contracts
   - Send notifications before expiry

4. **Document Sharing**
   - Generate shareable links
   - Set expiration on links

5. **Audit Log**
   - Track who uploaded/deleted documents
   - Track all changes

## 🎯 Quick Implementation Steps

1. **Run SQL** in Supabase Dashboard
2. **Create company profile page** (`/admin/production-companies/[id]/page.tsx`)
3. **Create documents directory page** (`/admin/documents/page.tsx`)
4. **Update admin navigation** to include new pages
5. **Test thoroughly** with sample data
6. **Deploy** and enjoy!

---

**Current Status**: ✅ 50% Complete
- Database: ✅
- S3 Functions: ✅
- Companies List: ✅
- Company Profile: ⏳ TODO
- Documents Directory: ⏳ TODO
- Navigation: ⏳ TODO
