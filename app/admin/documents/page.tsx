'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Trash2, FileText, Building } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { deleteDocumentFromS3 } from '@/lib/s3-upload';
import Link from 'next/link';

interface Document {
  id: string;
  production_company_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  document_type: string;
  uploaded_by: string | null;
  created_at: string;
  production_companies: {
    id: string;
    name: string;
  };
}

export default function DocumentDirectoryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const documentTypes = [
    'all',
    'Contract',
    'Agreement',
    'Invoice',
    'Receipt',
    'Script',
    'Storyboard',
    'Release Form',
    'Permit',
    'Insurance',
    'Other'
  ];

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
          production_companies!inner(
            id,
            name
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

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Contract: 'bg-blue-100 text-blue-800',
      Agreement: 'bg-purple-100 text-purple-800',
      Invoice: 'bg-green-100 text-green-800',
      Receipt: 'bg-emerald-100 text-emerald-800',
      Script: 'bg-yellow-100 text-yellow-800',
      Storyboard: 'bg-orange-100 text-orange-800',
      'Release Form': 'bg-pink-100 text-pink-800',
      Permit: 'bg-indigo-100 text-indigo-800',
      Insurance: 'bg-red-100 text-red-800',
      Other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.Other;
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      // Delete from S3
      await deleteDocumentFromS3(doc.file_url);

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      showSuccess('Document deleted successfully');
      fetchDocuments();
    } catch (error: any) {
      alert('Error deleting document: ' + error.message);
    }
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, '_blank');
  };

  const filteredDocuments = documents.filter(doc => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      doc.title.toLowerCase().includes(searchLower) ||
      doc.production_companies.name.toLowerCase().includes(searchLower) ||
      doc.file_name.toLowerCase().includes(searchLower) ||
      doc.document_type.toLowerCase().includes(searchLower);

    const matchesType = filterType === 'all' || doc.document_type === filterType;

    return matchesSearch && matchesType;
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
        <div className="mb-6 flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by document title, company name, or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          >
            {documentTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
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
                  {searchTerm || filterType !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Upload documents from production company pages'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Production Company</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
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
                            href={`/admin/production-companies/${doc.production_company_id}`}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <Building size={16} />
                            {doc.production_companies.name}
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs rounded ${getTypeColor(doc.document_type)}`}>
                            {doc.document_type}
                          </span>
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
    </div>
  );
}
