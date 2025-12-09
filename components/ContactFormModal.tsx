'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoginModal from './LoginModal';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName?: string;
  propertyId?: string;
}

export default function ContactFormModal({ isOpen, onClose, propertyName, propertyId }: ContactFormModalProps) {
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
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
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

  // Check authentication and auto-fill user data
  useEffect(() => {
    async function checkAuthAndFetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        // Fetch user details from users table
        const { data: userData } = await (supabase
          .from('users') as any)
          .select('full_name, email, phone, company_name')
          .eq('id', user.id)
          .single();

        if (userData) {
          const [firstName, ...lastNameParts] = (userData.full_name || '').split(' ');
          setFormData(prev => ({
            ...prev,
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            email: userData.email || user.email || '',
            phone: userData.phone || '',
            company: userData.company_name || ''
          }));
        }
      }
    }

    if (isOpen) {
      checkAuthAndFetchUser();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Use a small delay to ensure the modal is fully closed before resetting
      const timeoutId = setTimeout(() => {
        setFormData({
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
        setSelectedStart(null);
        setSelectedEnd(null);
        setShowPicker(false);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, propertyName]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Check authentication in real-time
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        setIsSubmitting(false);
        setShowLoginModal(true);
        return;
      }

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          company: formData.company,
          phone: formData.phone,
          message: formData.message,
          crew_size: formData.crewSize,
          locations: formData.locations,
          shooting_date: formData.shootingDate,
          project_type: formData.projectType,
          how_did_you_hear: formData.howDidYouHear
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
      }, 2000);

    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
                    className={`w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${user ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="First name *"
                    value={formData.firstName}
                    onChange={handleChange}
                    readOnly={!!user}
                    disabled={!!user}
                  />
                </div>

                <div>
                  <input
                    required
                    name="lastName"
                    type="text"
                    className={`w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${user ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="Last name *"
                    value={formData.lastName}
                    onChange={handleChange}
                    readOnly={!!user}
                    disabled={!!user}
                  />
                </div>

                <div>
                  <input
                    required
                    name="email"
                    type="email"
                    className={`w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${user ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="Email *"
                    value={formData.email}
                    onChange={handleChange}
                    readOnly={!!user}
                    disabled={!!user}
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

            {/* Error/Success Messages */}
            {submitError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded text-sm">
                Inquiry submitted successfully! We'll get back to you soon.
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Send Inquiry'}
              </button>
            </div>
          </form>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onSuccess={async () => {
              setShowLoginModal(false);
              // Recheck authentication after login
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                setUser(user);
                const { data: userData } = await (supabase
                  .from('users') as any)
                  .select('full_name, email, phone, company_name')
                  .eq('id', user.id)
                  .single();

                if (userData) {
                  const [firstName, ...lastNameParts] = (userData.full_name || '').split(' ');
                  setFormData(prev => ({
                    ...prev,
                    firstName: firstName || '',
                    lastName: lastNameParts.join(' ') || '',
                    email: userData.email || user.email || '',
                    phone: userData.phone || '',
                    company: userData.company_name || ''
                  }));
                }
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
