'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Trash2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { deleteDocumentFromS3 } from '@/lib/s3-upload';
import Link from 'next/link';

interface Document {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  document_type: string;
  uploaded_by: string | null;
  created_at: string;
  properties: {
    id: string;
    name: string;
    city: string;
    county: string;
  };
}

export default function DocumentDirectoryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<string>('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          properties!inner(
            id,
            name,
            city,
            county
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
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

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingDocId(doc.id);
    setDeleteProgress('Starting deletion...');

    // Give React time to render the modal
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Delete from S3 first
      setDeleteProgress('🗑️ Deleting file from S3 storage...');
      console.log('Deleting from S3:', doc.file_url);
      await deleteDocumentFromS3(doc.file_url);
      console.log('✓ File deleted from S3 successfully');

      // Delete from database
      setDeleteProgress('🗄️ Removing from database...');
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) {
        console.error('Database deletion error:', error);
        throw error;
      }

      console.log('✓ Document deleted from database successfully');
      setDeleteProgress('✓ Document deleted successfully!');

      // Short delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      showSuccess('Document deleted successfully from storage and database');
      await fetchDocuments();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('Error deleting document: ' + error.message);
    } finally {
      setDeletingDocId(null);
      setDeleteProgress('');
    }
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, '_blank');
  };

  const filteredDocuments = documents.filter(doc => {
    const searchLower = searchTerm.toLowerCase();
    return (
      doc.title.toLowerCase().includes(searchLower) ||
      doc.properties.name.toLowerCase().includes(searchLower) ||
      doc.properties.city.toLowerCase().includes(searchLower) ||
      doc.file_name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Document Directory</h1>
        <div className="text-sm text-gray-600">
          {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by document title, property name, or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-600">Loading documents...</p>
          </div>
        ) : (
          <>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-lg font-medium">No documents found</p>
                <p className="text-sm mt-2">
                  {searchTerm
                    ? 'Try adjusting your search'
                    : 'Upload documents from production company pages'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">File Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Uploaded</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{doc.title}</div>
                          {doc.description && (
                            <div className="text-sm text-gray-500">{doc.description}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/property/${doc.property_id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <div className="font-medium">{doc.properties.name}</div>
                            <div className="text-xs text-gray-500">{doc.properties.city}, {doc.properties.county}</div>
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{doc.file_name}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(doc.created_at).toLocaleDateString()}
                          {doc.uploaded_by && (
                            <div className="text-xs text-gray-500">by {doc.uploaded_by}</div>
                          )}
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
                              onClick={() => handleDelete(doc)}
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
          </>
        )}
      </div>

      {/* Deletion Progress Modal */}
      {deletingDocId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Deleting Document</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please wait while we delete the document from storage and database...
              </p>
              {deleteProgress && (
                <div className="bg-gray-50 rounded p-3 text-sm font-mono text-left">
                  {deleteProgress}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
