'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import jsPDF from 'jspdf';

interface Property {
  id: string;
  name: string;
  real_name?: string;
  public_name?: string;
  sub_heading?: string;
  description?: string;
  address?: string;
  city: string;
  county?: string;
  zipcode?: string;
  property_type?: string;
  status: string;
  is_featured: boolean;
  is_exclusive?: boolean;
  view_count?: number;
  property_tags?: string[];
  notes?: string;
  latitude?: string;
  longitude?: string;
  albumkey?: string;
  created_at: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  primary_image?: string;
  images?: string[];
  [key: string]: any;
}

interface ExportField {
  label: string;
  key: string;
  defaultOn?: boolean;
  format?: (val: any, prop: Property) => string;
}

const EXPORT_FIELDS: ExportField[] = [
  { label: 'Public Name',      key: 'public_name',    defaultOn: true },
  { label: 'Internal Code',    key: 'name' },
  { label: 'Real Name',        key: 'real_name' },
  { label: 'Sub Heading',      key: 'sub_heading' },
  { label: 'Description',      key: 'description' },
  { label: 'Address',          key: 'address',        defaultOn: true },
  { label: 'City',             key: 'city',           defaultOn: true },
  { label: 'State',            key: 'county',         defaultOn: true },
  { label: 'Zip Code',         key: 'zipcode',        defaultOn: true },
  { label: 'Status',           key: 'status',         defaultOn: true },
  { label: 'Featured',         key: 'is_featured',    format: (v) => v ? 'Yes' : 'No' },
  { label: 'Exclusive',        key: 'is_exclusive',   format: (v) => v ? 'Yes' : 'No' },
  { label: 'View Count',       key: 'view_count' },
  { label: 'Tags',             key: 'property_tags',  format: (v) => Array.isArray(v) ? v.join(', ') : '' },
  { label: 'Notes',            key: 'notes' },
  { label: 'Latitude',         key: 'latitude' },
  { label: 'Longitude',        key: 'longitude' },
  { label: 'Album Key',        key: 'albumkey' },
  { label: 'Created At',       key: 'created_at',     defaultOn: true, format: (v) => v ? new Date(v).toLocaleDateString() : '' },
  { label: 'Owner Name',       key: 'owner_name',     defaultOn: true },
  { label: 'Owner Email',      key: 'owner_email' },
  { label: 'Owner Phone',      key: 'owner_phone' },
  { label: 'Primary Image URL',key: 'primary_image' },
  { label: 'Image Count',      key: '_image_count',   format: (_, p) => String(p.images?.length ?? 0) },
];

function getCellValue(field: ExportField, prop: Property): string {
  const raw = field.key === '_image_count' ? null : prop[field.key];
  if (field.format) return field.format(raw, prop);
  if (Array.isArray(raw)) return raw.join(', ');
  if (raw === null || raw === undefined) return '';
  return String(raw);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(properties: Property[], fields: ExportField[]) {
  const rows = [
    fields.map(f => f.label),
    ...properties.map(p => fields.map(f => getCellValue(f, p))),
  ];
  const csv = rows
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `properties-${Date.now()}.csv`);
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + '…';
}

function exportPDF(properties: Property[], fields: ExportField[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const usableW = pageW - margin * 2;
  const colW = Math.max(15, usableW / fields.length);
  const headerH = 6;
  const rowH = 5;
  const exportDate = new Date().toLocaleDateString();

  const drawPageHeader = () => {
    doc.setFillColor(204, 85, 0);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SGS LOCATIONS — Properties Export', margin, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(exportDate, pageW - margin, 12, { align: 'right' });
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, usableW, headerH, 'F');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    fields.forEach((f, i) => {
      const x = margin + i * colW;
      doc.text(truncateText(f.label, Math.floor(colW / 2)), x + 1, y + 4);
    });
    return y + headerH;
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${pageNum} of ${totalPages}`, pageW - margin, pageH - 4, { align: 'right' });
    doc.text(`Total: ${properties.length} properties`, margin, pageH - 4);
  };

  // Pre-calculate total pages (approximate)
  const rowsPerPage = Math.floor((pageH - 18 - headerH - 10) / rowH);
  const totalPages = Math.ceil(properties.length / rowsPerPage) || 1;

  drawPageHeader();
  let currentPage = 1;
  let y = drawTableHeader(20);

  properties.forEach((prop, idx) => {
    if (y + rowH > pageH - 10) {
      drawFooter(currentPage, totalPages);
      doc.addPage();
      currentPage++;
      drawPageHeader();
      y = drawTableHeader(20);
    }

    // Alternating row background
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, usableW, rowH, 'F');
    }

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    fields.forEach((f, i) => {
      const val = getCellValue(f, prop);
      const x = margin + i * colW;
      doc.text(truncateText(val, Math.floor(colW / 2.5)), x + 1, y + 3.5);
    });

    y += rowH;
  });

  drawFooter(currentPage, totalPages);

  const blob = doc.output('blob');
  downloadBlob(blob, `properties-${Date.now()}.pdf`);
}

interface Props {
  properties: Property[];
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_FIELDS = new Set(EXPORT_FIELDS.filter(f => f.defaultOn).map(f => f.key));

export default function PropertyExportModal({ properties, isOpen, onClose }: Props) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(DEFAULT_FIELDS));
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const toggleField = (key: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedFields(new Set(EXPORT_FIELDS.map(f => f.key)));
  const clearAll = () => setSelectedFields(new Set());

  const handleExport = async () => {
    if (selectedFields.size === 0) return;
    setExporting(true);
    try {
      const fields = EXPORT_FIELDS.filter(f => selectedFields.has(f.key));
      if (format === 'csv') {
        exportCSV(properties, fields);
      } else {
        exportPDF(properties, fields);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Export Properties</h2>
            <p className="text-sm text-gray-500 mt-0.5">Exporting {properties.length} properties</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format toggle */}
        <div className="px-6 pt-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Format</p>
          <div className="flex gap-2">
            {(['csv', 'pdf'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  format === f
                    ? 'bg-[#cc5500] text-white border-[#cc5500]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Field selection */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Fields <span className="text-gray-400 font-normal">({selectedFields.size} selected)</span>
            </p>
            <div className="flex gap-3 text-xs">
              <button onClick={selectAll} className="text-[#cc5500] hover:underline">Select All</button>
              <button onClick={clearAll} className="text-gray-500 hover:underline">Clear All</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
            {EXPORT_FIELDS.map(f => (
              <label key={f.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={selectedFields.has(f.key)}
                  onChange={() => toggleField(f.key)}
                  className="accent-[#cc5500] w-3.5 h-3.5 flex-shrink-0"
                />
                {f.label}
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedFields.size === 0 || exporting}
            className="px-5 py-2 text-sm font-medium text-white bg-[#cc5500] rounded-lg hover:bg-[#b34a00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Exporting…
              </>
            ) : (
              `Export ${format.toUpperCase()}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
