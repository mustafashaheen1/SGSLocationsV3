'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName?: string;
}

export default function ContactFormModal({ isOpen, onClose, propertyName }: ContactFormModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    message: '',
    phone: '',
    crewSize: '',
    locations: propertyName || '',
    shootingDate: '',
    projectType: '',
    howDidYouHear: ''
  });

  const [showPicker, setShowPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Update locations when propertyName changes
  useEffect(() => {
    if (propertyName) {
      setFormData(prev => ({ ...prev, locations: propertyName }));
    }
  }, [propertyName]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside date picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: Add your form submission logic here
    alert('Thank you for your inquiry! We will get back to you soon.');
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatDateRange = (start: Date, end: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${start.getDate()} ${months[start.getMonth()]}, ${start.getFullYear()} - ${end.getDate()} ${months[end.getMonth()]}, ${end.getFullYear()}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handleDateClick = (date: Date) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(date);
      setSelectedEnd(null);
    } else {
      if (date < selectedStart) {
        setSelectedEnd(selectedStart);
        setSelectedStart(date);
      } else {
        setSelectedEnd(date);
      }
    }
  };

  useEffect(() => {
    if (selectedStart && selectedEnd) {
      setFormData(prev => ({
        ...prev,
        shootingDate: formatDateRange(selectedStart, selectedEnd)
      }));
      setShowPicker(false);
    }
  }, [selectedStart, selectedEnd]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return (selectedStart && date.toDateString() === selectedStart.toDateString()) ||
           (selectedEnd && date.toDateString() === selectedEnd.toDateString());
  };

  const isInRange = (date: Date) => {
    if (!selectedStart) return false;
    if (!selectedEnd && !hoverDate) return false;
    const end = selectedEnd || hoverDate;
    if (!end) return false;
    return date > selectedStart && date < end;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-light text-gray-900">
            {propertyName ? `Inquire About ${propertyName}` : 'Contact Us'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <input
                    required
                    name="firstName"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="First name *"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <input
                    required
                    name="lastName"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="Last name *"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <input
                    required
                    name="email"
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="Email *"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <input
                    required
                    name="company"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="Company *"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <textarea
                    required
                    name="message"
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                    placeholder="Message *"
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <input
                    name="phone"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <input
                    name="crewSize"
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="Cast / Crew Size"
                    value={formData.crewSize}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <input
                    name="locations"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="Locations"
                    value={formData.locations}
                    onChange={handleChange}
                  />
                </div>

                <div className="relative">
                  <input
                    ref={inputRef}
                    name="shootingDate"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none cursor-pointer"
                    placeholder="Shooting Date"
                    value={formData.shootingDate}
                    onClick={() => setShowPicker(true)}
                    readOnly
                  />

                  {/* Date Picker (simplified - you may want to use a library like react-datepicker) */}
                  {showPicker && (
                    <div
                      ref={pickerRef}
                      className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 z-10"
                      style={{ width: '280px' }}
                    >
                      <div className="text-center mb-2">
                        <strong>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</strong>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => (
                          <div key={day} className="font-semibold text-gray-600">{day}</div>
                        ))}
                        {getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()).map((date, idx) => (
                          date ? (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleDateClick(date)}
                              className={`p-1 rounded hover:bg-red-100 ${
                                isSelected(date) ? 'bg-red-500 text-white' : ''
                              } ${isInRange(date) ? 'bg-red-100' : ''}`}
                            >
                              {date.getDate()}
                            </button>
                          ) : (
                            <div key={idx}></div>
                          )
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <select
                    required
                    name="projectType"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    value={formData.projectType}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Project Type *</option>
                    <option value="motion">Motion</option>
                    <option value="stills">Stills</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                <div>
                  <select
                    required
                    name="howDidYouHear"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    value={formData.howDidYouHear}
                    onChange={handleChange}
                  >
                    <option value="" disabled>How did you hear about us? *</option>
                    <option value="google">Google</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="referral">Referral</option>
                    <option value="returning-client">Returning Client</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Send Inquiry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
