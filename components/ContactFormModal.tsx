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
  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>([]);
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    message: '',
    phone: '',
    crewSize: '',
    locations: propertyName || '',
    shootingDate: ''
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
  const [phoneError, setPhoneError] = useState('');
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
    async function fetchDynamicQuestions() {
      try {
        const { data: questions } = await (supabase
          .from('contact_form_questions') as any)
          .select(`
            *,
            contact_form_question_options (
              id,
              option_value,
              option_label,
              display_order
            )
          `)
          .order('display_order');

        if (questions) {
          const formatted = questions.map((q: any) => ({
            ...q,
            options: (q.contact_form_question_options || [])
              .sort((a: any, b: any) => a.display_order - b.display_order)
          }));
          setDynamicQuestions(formatted);
        }
      } catch (error) {
        console.error('Error fetching dynamic questions:', error);
      }
    }

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

        // Check for pending inquiry after login/register
        const pendingData = sessionStorage.getItem('pendingInquiry');
        if (pendingData) {
          try {
            const { formData: savedFormData, propertyId: savedPropertyId, propertyName: savedPropertyName } = JSON.parse(pendingData);

            // Only restore if we're on the same property page
            if (savedPropertyId === propertyId) {
              sessionStorage.removeItem('pendingInquiry');

              // Restore form data
              setFormData(savedFormData);

              // Restore selected dates if they exist
              if (savedFormData.shootingDate) {
                const dateMatch = savedFormData.shootingDate.match(/(\d+)\s+(\w+),\s+(\d+)\s+-\s+(\d+)\s+(\w+),\s+(\d+)/);
                if (dateMatch) {
                  const [_, startDay, startMonth, startYear, endDay, endMonth, endYear] = dateMatch;
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const startMonthIndex = monthNames.indexOf(startMonth);
                  const endMonthIndex = monthNames.indexOf(endMonth);

                  if (startMonthIndex !== -1 && endMonthIndex !== -1) {
                    setSelectedStart(new Date(parseInt(startYear), startMonthIndex, parseInt(startDay)));
                    setSelectedEnd(new Date(parseInt(endYear), endMonthIndex, parseInt(endDay)));
                  }
                }
              }

              // Show success message
              setSubmitSuccess(false);
              setSubmitError('');
            }
          } catch (error) {
            console.error('Error restoring pending inquiry:', error);
            sessionStorage.removeItem('pendingInquiry');
          }
        }
      }
    }

    if (isOpen) {
      fetchDynamicQuestions();
      checkAuthAndFetchUser();
    }
  }, [isOpen, propertyId]);

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
          shootingDate: ''
        });
        setDynamicAnswers({});
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

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  // Validate US phone number
  const validatePhoneNumber = (phone: string) => {
    if (!phone) {
      setPhoneError('');
      return true; // Phone is optional
    }

    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    const isValid = phoneRegex.test(phone.replace(/\s/g, ''));

    if (!isValid) {
      setPhoneError('Please enter a valid US phone number');
      return false;
    }

    setPhoneError('');
    return true;
  };

  // Handle phone input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
    validatePhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone before submitting
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      return;
    }

    // Validate shooting date is not in the past
    if (formData.shootingDate) {
      // Extract the start date from the shooting date range
      const dateMatch = formData.shootingDate.match(/(\d+)\s+(\w+),\s+(\d+)/);
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
        const shootingDate = new Date(parseInt(year), monthIndex, parseInt(day));
        shootingDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (shootingDate < today) {
          setSubmitError('Cannot submit inquiry for past shooting dates. Please select a future date.');
          return;
        }
      }
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Check authentication in real-time
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.user) {
        // Store inquiry data for later submission after login/register
        sessionStorage.setItem('pendingInquiry', JSON.stringify({
          formData,
          propertyId,
          propertyName,
          returnUrl: window.location.pathname
        }));
        setIsSubmitting(false);
        setShowLoginModal(true);
        return;
      }

      // Build dynamic data object
      const dynamicData: Record<string, string | null> = {};
      dynamicQuestions.forEach(q => {
        dynamicData[q.field_name] = dynamicAnswers[q.field_name] || null;
      });

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
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
          ...dynamicData
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
    // Prevent selecting past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return; // Don't allow selecting past dates
    }

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

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
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
                    type="tel"
                    className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
                      phoneError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Phone (XXX) XXX-XXXX"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    maxLength={14}
                  />
                  {phoneError && (
                    <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                  )}
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
                    className={`w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
                      propertyId ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="Locations"
                    value={formData.locations}
                    onChange={handleChange}
                    readOnly={!!propertyId}
                    disabled={!!propertyId}
                  />
                  {propertyId && (
                    <p className="text-xs text-gray-500 mt-1">
                      This is the property you're inquiring about
                    </p>
                  )}
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
                              disabled={isPastDate(date)}
                              className={`p-1 rounded ${
                                isPastDate(date)
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'hover:bg-red-100'
                              } ${
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

                {/* Dynamic Questions */}
                {dynamicQuestions.map((question) => (
                  <div key={question.id}>
                    <select
                      required={question.is_required}
                      name={question.field_name}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                      value={dynamicAnswers[question.field_name] || ''}
                      onChange={(e) => {
                        setDynamicAnswers(prev => ({
                          ...prev,
                          [question.field_name]: e.target.value
                        }));
                      }}
                    >
                      <option value="" disabled>
                        {question.question_text} {question.is_required && '*'}
                      </option>
                      {question.options && question.options.map((option: any) => (
                        <option key={option.id} value={option.option_value}>
                          {option.option_label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
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
                    // Only update phone and company if user hasn't filled them in yet
                    phone: prev.phone || userData.phone || '',
                    company: prev.company || userData.company_name || ''
                  }));
                }

                // Auto-submit the inquiry after successful login
                // Small delay to ensure state is updated
                setTimeout(() => {
                  const form = document.querySelector('form') as HTMLFormElement;
                  if (form) {
                    form.requestSubmit();
                  }
                }, 100);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
