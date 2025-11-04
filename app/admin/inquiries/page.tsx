'use client';

import { useState } from 'react';
import { Search, Eye, Archive, Flag, X } from 'lucide-react';

interface Inquiry {
  id: number;
  from: string;
  email: string;
  property: string;
  date: string;
  status: 'new' | 'responded' | 'archived';
  message: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([
    {
      id: 1,
      from: 'Alice Williams',
      email: 'alice.w@email.com',
      property: 'Modern Loft Studio',
      date: '2024-02-15',
      status: 'new',
      message: 'Interested in booking for a photo shoot next week.'
    },
    {
      id: 2,
      from: 'Bob Thompson',
      email: 'bob.t@email.com',
      property: 'Downtown Office Space',
      date: '2024-02-14',
      status: 'responded',
      message: 'What are the parking arrangements?'
    },
    {
      id: 3,
      from: 'Carol Martinez',
      email: 'carol.m@email.com',
      property: 'Warehouse Studio',
      date: '2024-02-13',
      status: 'new',
      message: 'Can I schedule a site visit?'
    },
    {
      id: 4,
      from: 'David Lee',
      email: 'david.l@email.com',
      property: 'Rooftop Event Space',
      date: '2024-02-12',
      status: 'archived',
      message: 'Inquiry about weekend availability and pricing.'
    },
    {
      id: 5,
      from: 'Emma Davis',
      email: 'emma.d@email.com',
      property: 'Vintage Theater',
      date: '2024-02-11',
      status: 'new',
      message: 'Need more information about acoustics.'
    },
    {
      id: 6,
      from: 'Frank Wilson',
      email: 'frank.w@email.com',
      property: 'Industrial Warehouse',
      date: '2024-02-10',
      status: 'responded',
      message: 'What is the ceiling height?'
    },
    {
      id: 7,
      from: 'Grace Kim',
      email: 'grace.k@email.com',
      property: 'Contemporary Gallery',
      date: '2024-02-09',
      status: 'archived',
      message: 'Asking about lighting options.'
    },
    {
      id: 8,
      from: 'Henry Brown',
      email: 'henry.b@email.com',
      property: 'Outdoor Garden Venue',
      date: '2024-02-08',
      status: 'new',
      message: 'Is there weather protection available?'
    },
    {
      id: 9,
      from: 'Isabel Garcia',
      email: 'isabel.g@email.com',
      property: 'Historic Mansion',
      date: '2024-02-07',
      status: 'responded',
      message: 'Requesting full pricing breakdown.'
    },
    {
      id: 10,
      from: 'Jack Robinson',
      email: 'jack.r@email.com',
      property: 'Beach House Studio',
      date: '2024-02-06',
      status: 'archived',
      message: 'Question about beachfront access.'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleArchive = (id: number) => {
    setLoading(true);
    setTimeout(() => {
      setInquiries(inquiries.map(i =>
        i.id === id ? { ...i, status: 'archived' as const } : i
      ));
      setLoading(false);
      showSuccess('Inquiry archived successfully');
      setSelectedInquiry(null);
    }, 500);
  };

  const handleFlag = (id: number) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccess('Inquiry flagged for review');
    }, 500);
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = inquiry.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      responded: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles];
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="responded">Responded</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">From</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{inquiry.from}</div>
                      <div className="text-sm text-gray-500">{inquiry.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{inquiry.property}</td>
                  <td className="py-4 px-4 text-gray-600">{inquiry.date}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(inquiry.status)}`}>
                      {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedInquiry(inquiry)}
                        disabled={loading}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      {inquiry.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(inquiry.id)}
                          disabled={loading}
                          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50"
                          title="Archive"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleFlag(inquiry.id)}
                        disabled={loading}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                        title="Flag"
                      >
                        <Flag size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInquiries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No inquiries found matching your criteria
          </div>
        )}
      </div>

      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Inquiry Details</h3>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">From</label>
                <p className="text-gray-900">{selectedInquiry.from}</p>
                <p className="text-sm text-gray-500">{selectedInquiry.email}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Property</label>
                <p className="text-gray-900">{selectedInquiry.property}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Date</label>
                <p className="text-gray-900">{selectedInquiry.date}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedInquiry.status)}`}>
                    {selectedInquiry.status.charAt(0).toUpperCase() + selectedInquiry.status.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Message</label>
                <p className="text-gray-900 mt-1">{selectedInquiry.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
