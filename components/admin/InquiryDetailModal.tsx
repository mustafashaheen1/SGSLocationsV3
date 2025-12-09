'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Inquiry } from '@/lib/supabase';

interface InquiryDetailModalProps {
  inquiry: Inquiry;
  onClose: () => void;
  onStatusUpdate: (inquiryId: string, newStatus: string) => Promise<void>;
  canUpdateStatus?: boolean;
}

export default function InquiryDetailModal({
  inquiry,
  onClose,
  onStatusUpdate,
  canUpdateStatus = true
}: InquiryDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(inquiry.status);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await onStatusUpdate(inquiry.id, newStatus);
      setStatus(newStatus as 'new' | 'responded' | 'archived');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      responded: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.new;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Inquiry Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Property Info */}
          {inquiry.properties && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Property</h3>
              <div className="flex items-center gap-3">
                {inquiry.properties.primary_image && (
                  <img
                    src={inquiry.properties.primary_image}
                    alt={inquiry.properties.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{inquiry.properties.name}</p>
                  <p className="text-sm text-gray-600">
                    {inquiry.properties.address}, {inquiry.properties.city}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <p className="text-gray-900">{inquiry.first_name || inquiry.user_name?.split(' ')[0] || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <p className="text-gray-900">{inquiry.last_name || inquiry.user_name?.split(' ').slice(1).join(' ') || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{inquiry.user_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{inquiry.user_phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Company</label>
                <p className="text-gray-900">{inquiry.company || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Crew Size</label>
                <p className="text-gray-900">{inquiry.crew_size || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Project Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Locations</label>
                <p className="text-gray-900">{inquiry.locations || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Shooting Date</label>
                <p className="text-gray-900">{inquiry.shooting_date || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Project Type</label>
                <p className="text-gray-900">{inquiry.project_type || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">How Did You Hear</label>
                <p className="text-gray-900">{inquiry.how_did_you_hear || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-gray-900 whitespace-pre-wrap">{inquiry.message}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
            {canUpdateStatus ? (
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#e11921] focus:border-[#e11921] disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="new">New</option>
                <option value="responded">Responded</option>
                <option value="archived">Archived</option>
              </select>
            ) : (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(status)}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="text-sm text-gray-500 border-t pt-4 space-y-1">
            <p><strong>Submitted:</strong> {new Date(inquiry.created_at).toLocaleString()}</p>
            {inquiry.responded_at && (
              <p><strong>Responded:</strong> {new Date(inquiry.responded_at).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
