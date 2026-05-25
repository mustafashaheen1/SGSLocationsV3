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

function exportPDF(properties: Property[], fields: ExportField[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const usableW = pageW - margin * 2;
  const labelW = 48;
  const valueW = usableW - labelW;
  const exportDate = new Date().toLocaleDateString();
  let currentPage = 1;
  let y = margin;

  const drawPageHeader = () => {
    doc.setFillColor(204, 85, 0);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SGS LOCATIONS — Properties Export', margin, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(exportDate, pageW - margin, 13, { align: 'right' });
    y = 26;
  };

  const drawFooter = () => {
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total: ${properties.length} properties`, margin, pageH - 6);
    doc.text(`Page ${currentPage}`, pageW - margin, pageH - 6, { align: 'right' });
  };

  const checkPageBreak = (neededH: number) => {
    if (y + neededH > pageH - 14) {
      drawFooter();
      doc.addPage();
      currentPage++;
      drawPageHeader();
    }
  };

  drawPageHeader();

  properties.forEach((prop, idx) => {
    // Property section header bar
    const displayName =
      getCellValue(fields.find(f => f.key === 'public_name') ?? EXPORT_FIELDS.find(f => f.key === 'public_name')!, prop) ||
      prop.real_name ||
      prop.name ||
      `Property ${idx + 1}`;

    checkPageBreak(12);

    // Accent bar + light background
    doc.setFillColor(255, 243, 235);
    doc.rect(margin, y, usableW, 9, 'F');
    doc.setFillColor(204, 85, 0);
    doc.rect(margin, y, 3, 9, 'F');

    doc.setTextColor(140, 50, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}.  ${displayName}`, margin + 6, y + 6);
    y += 12;

    // Key-value rows
    doc.setFontSize(9);
    fields.forEach(field => {
      const val = getCellValue(field, prop);
      if (!val) return;

      const lines: string[] = doc.splitTextToSize(val, valueW);
      const blockH = lines.length * 5 + 1;

      checkPageBreak(blockH);

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(90, 90, 90);
      doc.text(`${field.label}:`, margin, y + 4);

      // Value
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(lines, margin + labelW, y + 4);

      y += blockH;
    });

    y += 4;

    // Thin divider between properties (skip after last)
    if (idx < properties.length - 1) {
      checkPageBreak(6);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y - 1, pageW - margin, y - 1);
      y += 3;
    }
  });

  drawFooter();

  downloadBlob(doc.output('blob'), `properties-${Date.now()}.pdf`);
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
