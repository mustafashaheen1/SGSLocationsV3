'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Download, Trash2, FileText, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadDocumentToS3, deleteDocumentFromS3 } from '@/lib/s3-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface ProductionCompany {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  document_type: string;
  uploaded_by: string | null;
  created_at: string;
}

export default function ProductionCompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<ProductionCompany | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Upload form state - changed to support multiple files
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
  });

  useEffect(() => {
    if (params.id) {
      fetchCompanyAndDocuments();
    }
  }, [params.id]);

  async function fetchCompanyAndDocuments() {
    setLoading(true);
    try {
      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('production_companies')
        .select('*')
        .eq('id', params.id)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Fetch documents for this company
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('production_company_id', params.id)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading company data');
    } finally {
      setLoading(false);
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      // Validate each file size (10MB max)
      const validFiles = selectedFiles.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
          return false;
        }
        return true;
      });

      // Append new files to existing files instead of replacing
      setUploadForm({ files: [...uploadForm.files, ...validFiles] });
    }

    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);

    // Validate each file size (10MB max)
    const validFiles = droppedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    // Append new files to existing files instead of replacing
    setUploadForm({ files: [...uploadForm.files, ...validFiles] });
  };

  const removeFile = (index: number) => {
    const newFiles = uploadForm.files.filter((_, i) => i !== index);
    setUploadForm({ files: newFiles });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadForm.files.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setUploading(true);
    try {
      // Get current user email
      const { data: { user } } = await supabase.auth.getUser();

      // Get existing documents for this production company to check for duplicates
      const { data: existingDocs } = await supabase
        .from('documents')
        .select('file_name')
        .eq('production_company_id', params.id);

      const existingFileNames = new Set((existingDocs as any[])?.map((doc: any) => doc.file_name) || []);

      let successCount = 0;
      let failCount = 0;
      let duplicateCount = 0;
      const duplicateFiles: string[] = [];

      // Upload each file
      for (const file of uploadForm.files) {
        try {
          // Check for duplicate file name
          if (existingFileNames.has(file.name)) {
            duplicateFiles.push(file.name);
            duplicateCount++;
            continue;
          }

          // Upload file to S3
          const fileUrl = await uploadDocumentToS3(file);

          // Use filename as title (without extension)
          const fileName = file.name;
          const title = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

          // Save document to database
          const { error } = await (supabase
            .from('documents') as any)
            .insert([{
              production_company_id: params.id,
              title: title,
              description: null,
              file_url: fileUrl,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
              document_type: 'Document',
              uploaded_by: user?.email || null,
            }]);

          if (error) throw error;
          successCount++;
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          failCount++;
        }
      }

      // Show appropriate message
      let message = '';
      if (successCount > 0) {
        message = `${successCount} document(s) uploaded successfully`;
      }
      if (failCount > 0) {
        message += message ? `, ${failCount} failed` : `${failCount} upload(s) failed`;
      }
      if (duplicateCount > 0) {
        const duplicateList = duplicateFiles.join(', ');
        alert(`Cannot upload duplicate files:\n${duplicateList}\n\nThese files already exist for this production company.`);
        if (message) {
          message += ` (${duplicateCount} duplicate(s) skipped)`;
        }
      }

      if (successCount > 0) {
        showSuccess(message);
      } else if (failCount > 0 && duplicateCount === 0) {
        alert('All uploads failed. Please try again.');
      }

      setShowUploadModal(false);
      setUploadForm({ files: [] });
      fetchCompanyAndDocuments();
    } catch (error: any) {
      alert('Error uploading documents: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      // Delete from S3 first
      console.log('Deleting from S3:', doc.file_url);
      await deleteDocumentFromS3(doc.file_url);
      console.log('✓ File deleted from S3 successfully');

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) {
        console.error('Database deletion error:', error);
        throw error;
      }

      console.log('✓ Document deleted from database successfully');
      showSuccess('Document deleted successfully from storage and database');
      fetchCompanyAndDocuments();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('Error deleting document: ' + error.message);
    }
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Company not found</p>
        <Link href="/admin/production-companies">
          <Button>Back to Companies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/production-companies')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">{company.name}</h1>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-[#e11921] hover:bg-[#bf151c]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Company Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Company Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {company.contact_person && (
            <div>
              <span className="text-sm text-gray-600">Contact Person</span>
              <p className="font-medium">{company.contact_person}</p>
            </div>
          )}
          {company.email && (
            <div>
              <span className="text-sm text-gray-600">Email</span>
              <p className="font-medium">{company.email}</p>
            </div>
          )}
          {company.phone && (
            <div>
              <span className="text-sm text-gray-600">Phone</span>
              <p className="font-medium">{company.phone}</p>
            </div>
          )}
          {company.website && (
            <div>
              <span className="text-sm text-gray-600">Website</span>
              <p className="font-medium">
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {company.website}
                </a>
              </p>
            </div>
          )}
          {company.notes && (
            <div className="col-span-2">
              <span className="text-sm text-gray-600">Notes</span>
              <p className="font-medium">{company.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Documents ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg font-medium">No documents uploaded yet</p>
            <p className="text-sm mt-2">Click "Upload Document" to add your first document</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">File Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Uploaded</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{doc.title}</div>
                      {doc.description && (
                        <div className="text-sm text-gray-500">{doc.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{doc.file_name}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Upload Document</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Documents <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Select multiple files at once. Document titles will be automatically extracted from filenames.
                  </p>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                      isDragging
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      multiple
                      required={uploadForm.files.length === 0}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className={`w-12 h-12 mb-2 ${isDragging ? 'text-red-500' : 'text-gray-400'}`} />
                      {uploadForm.files.length > 0 ? (
                        <div className="text-center w-full">
                          <span className="text-sm text-green-600 font-medium">
                            {uploadForm.files.length} file(s) selected
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Click or drag to add more files
                          </p>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm text-gray-600">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            PDF, DOC, DOCX, XLS, XLSX, TXT (Max 10MB per file)
                          </span>
                          <span className="text-xs text-gray-500 mt-1 font-medium">
                            Multiple files supported
                          </span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Display selected files */}
                  {uploadForm.files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                      {uploadForm.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                            title="Remove file"
                          >
                            <X size={16} className="text-gray-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#e11921] hover:bg-[#bf151c]"
                    disabled={uploading}
                  >
                    {uploading
                      ? 'Uploading...'
                      : uploadForm.files.length > 1
                        ? `Upload ${uploadForm.files.length} Documents`
                        : 'Upload Document'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
