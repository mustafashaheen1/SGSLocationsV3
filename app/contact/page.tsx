'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ReCaptcha, { ReCaptchaRef } from '@/components/ReCaptcha';

export default function ContactPage() {
  const [gridData, setGridData] = useState<any[]>([]);
  const [contactInfo, setContactInfo] = useState({
    email: 'paul@imagelocations.com',
    phone: '(310) 871-8004',
    address: '9663 Santa Monica Blvd. Suite 842,\nBeverly Hills, CA 90210',
  });

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
    locations: '',
    shootingDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState('');

  const [showPicker, setShowPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef<ReCaptchaRef>(null);

  useEffect(() => {
    async function fetchDynamicQuestions() {
      try {
        const { data: questions } = await supabase
          .from('contact_form_questions')
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

    async function fetchContactGrid() {
      const { data } = await supabase
        .from('contact_grid')
        .select('*')
        .eq('is_active', true)
        .order('position');

      if (data) {
        // Filter out empty slots for display
        const activeEntries = (data as any[]).filter((entry: any) => entry.entry_type !== 'empty');
        setGridData(activeEntries);
      }
    }

    async function fetchContactInfo() {
      try {
        const { data: settings } = await (supabase
          .from('site_settings') as any)
          .select('*')
          .in('key', ['general_contact_email', 'general_contact_phone', 'general_contact_address']);

        if (settings) {
          const email = (settings as any[]).find((s: any) => s.key === 'general_contact_email')?.value;
          const phone = (settings as any[]).find((s: any) => s.key === 'general_contact_phone')?.value;
          const address = (settings as any[]).find((s: any) => s.key === 'general_contact_address')?.value;

          const parseValue = (value: any): string => {
            if (!value) return '';
            if (typeof value === 'string') {
              try {
                let parsed = value;
                while (typeof parsed === 'string' && (parsed.startsWith('"') || parsed.startsWith('\\"'))) {
                  parsed = JSON.parse(parsed);
                }
                return parsed;
              } catch (e) {
                return value.replace(/^"|"$/g, '');
              }
            }
            return String(value);
          };

          setContactInfo({
            email: parseValue(email) || 'paul@imagelocations.com',
            phone: parseValue(phone) || '(310) 871-8004',
            address: parseValue(address) || '9663 Santa Monica Blvd. Suite 842,\nBeverly Hills, CA 90210',
          });
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
      }
    }

    fetchDynamicQuestions();
    fetchContactGrid();
    fetchContactInfo();
  }, []);

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


  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    const isValid = phoneRegex.test(phone.replace(/\s/g, ''));
    if (!isValid) {
      setPhoneError('Please enter a valid US phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone before submitting
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      return;
    }

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      setRecaptchaError('Please complete the reCAPTCHA verification');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Build dynamic data object
      const dynamicData: Record<string, string> = {};
      dynamicQuestions.forEach(q => {
        dynamicData[q.field_name] = dynamicAnswers[q.field_name] || null;
      });

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          property_id: null, // General inquiry (no specific property)
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          message: formData.message,
          crew_size: formData.crewSize ? parseInt(formData.crewSize) : null,
          locations: formData.locations || null,
          shooting_date: formData.shootingDate || null,
          ...dynamicData,
          recaptcha_token: recaptchaToken
        })
      });

      if (response.ok) {
        setSubmitSuccess(true);
        // Reset non-user fields
        setFormData(prev => ({
          ...prev,
          message: '',
          crewSize: '',
          locations: '',
          shootingDate: ''
        }));
        setDynamicAnswers({});
        setSelectedStart(null);
        setSelectedEnd(null);
        // Reset reCAPTCHA
        setRecaptchaToken(null);
        recaptchaRef.current?.reset();

        // Auto-hide success message after 5 seconds
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit inquiry');
      }
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData({ ...formData, [name]: formatted });
      if (phoneError) {
        setPhoneError('');
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

      const start = date < selectedStart ? date : selectedStart;
      const end = date < selectedStart ? selectedStart : date;

      setFormData(prev => ({ ...prev, shootingDate: formatDateRange(start, end) }));
      setTimeout(() => setShowPicker(false), 200);
    }
  };

  const isSelected = (date: Date) => {
    if (!date) return false;
    if (selectedStart && date.toDateString() === selectedStart.toDateString()) return true;
    if (selectedEnd && date.toDateString() === selectedEnd.toDateString()) return true;
    return false;
  };

  const isInRange = (date: Date) => {
    if (!date || !selectedStart) return false;
    const end = selectedEnd || hoverDate;
    if (!end) return false;
    return date > selectedStart && date < end;
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <>
      <style jsx global>{`
        .contact-form {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .form-control {
          display: block;
          width: 100%;
          padding: 0.375rem 0.75rem;
          font-size: 1rem;
          line-height: 1.5;
          color: #495057;
          background-color: #fff;
          background-clip: padding-box;
          border: 1px solid #ced4da;
          border-radius: 0.25rem;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }

        .form-control:focus {
          color: #495057;
          background-color: #fff;
          border-color: #80bdff;
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
        }

        .form-control::placeholder {
          color: #6c757d;
          opacity: 1;
        }

        textarea.form-control {
          min-height: 200px;
          resize: vertical;
        }

        .litepicker {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 12.8px;
          font-weight: 300;
          line-height: 19.2px;
          color: #212529;
          background: white;
          box-shadow: 0 0 5px rgba(0,0,0,.1), 0 5px 20px rgba(0,0,0,.2);
          border-radius: 5px;
          box-sizing: border-box;
          z-index: 9999;
          position: absolute;
          display: none;
        }

        .litepicker.show-picker {
          display: block;
        }

        .container__months {
          display: flex;
          flex-wrap: wrap;
        }

        .month-item {
          padding: 5px;
          width: 276px;
        }

        .month-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 5px;
        }

        .month-item-name {
          font-size: 14px;
          font-weight: 500;
          margin-right: 5px;
        }

        .month-item-year {
          font-size: 12px;
          opacity: 0.7;
        }

        .button-previous-month,
        .button-next-month {
          background: none;
          border: none;
          padding: 5px;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.3s;
        }

        .button-previous-month:hover,
        .button-next-month:hover {
          opacity: 1;
        }

        .button-previous-month svg,
        .button-next-month svg {
          width: 11px;
          height: 16px;
          fill: #333;
        }

        .month-item-weekdays-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 5px 0;
          font-weight: 500;
          font-size: 11px;
          text-transform: uppercase;
          opacity: 0.7;
        }

        .month-item-weekdays-row > div {
          text-align: center;
          padding: 5px;
        }

        .container__days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0;
        }

        .day-item {
          position: relative;
          text-align: center;
          padding: 8px 10px;
          cursor: pointer;
          text-decoration: none;
          color: #333;
          border: 0;
          background: transparent;
          transition: all 0.3s;
        }

        .day-item:hover {
          background-color: #f5f5f5;
          border-radius: 3px;
        }

        .day-item.is-today {
          background-color: #ffeaa7;
          color: #333;
          border-radius: 3px;
        }

        .day-item.is-start-date,
        .day-item.is-end-date {
          background-color: #007bff;
          color: white;
          border-radius: 3px;
        }

        .day-item.is-in-range {
          background-color: rgba(0, 123, 255, 0.15);
          border-radius: 0;
        }

        .day-item.is-start-date.is-end-date {
          border-radius: 3px;
        }

        .day-item.is-start-date {
          border-radius: 3px 0 0 3px;
        }

        .day-item.is-end-date {
          border-radius: 0 3px 3px 0;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .btn-primary {
          color: #fff;
          background-color: #dc3545;
          border-color: #dc3545;
          padding: 0.75rem 2rem;
          font-size: 1.25rem;
          line-height: 1.5;
          border-radius: 0.3rem;
          cursor: pointer;
          transition: background-color 0.15s ease-in-out;
        }

        .btn-primary:hover {
          background-color: #c82333;
          border-color: #bd2130;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }

        .col-sm-6 {
          flex: 0 0 50%;
          max-width: 50%;
          padding: 0 15px;
        }

        .row {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -15px;
        }

        @media (max-width: 768px) {
          .col-sm-6 {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }

        /* Bootstrap grid utilities */
        .col-12 {
          flex: 0 0 100%;
          max-width: 100%;
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
        }

        .col-md-4 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
        }

        .col-sm-6 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
        }

        @media (min-width: 576px) {
          .col-sm-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }

          .offset-sm-3 {
            margin-left: 25%;
          }
        }

        @media (min-width: 768px) {
          .col-md-4 {
            flex: 0 0 33.333333%;
            max-width: 33.333333%;
          }

          .offset-md-4 {
            margin-left: 33.333333%;
          }
        }

        .text-center {
          text-align: center !important;
        }

        .d-inline-block {
          display: inline-block !important;
        }

        .mt-2 {
          margin-top: 0.5rem !important;
        }

        .mb-4 {
          margin-bottom: 1.5rem !important;
        }

        .w-100 {
          width: 100% !important;
        }

        .g-recaptcha {
          display: inline-block;
        }

        /* Team Grid Styles */
        .container-fluid {
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
          margin-right: auto;
          margin-left: auto;
        }

        .il-profiles {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
        }

        .il-profile-section {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .il-image-container {
          position: relative;
          width: 100%;
          height: 0;
          padding-bottom: 71.43%;
          overflow: hidden;
          background: #f8f9fa;
        }

        .il-image-container img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .il-contact-profile-pic {
          object-fit: cover;
        }

        .il-profile-info {
          background: white;
          min-height: 100px;
        }

        .object-fit {
          object-fit: cover;
        }

        .px-1 {
          padding-left: 0.25rem !important;
          padding-right: 0.25rem !important;
        }

        .py-1 {
          padding-top: 0.25rem !important;
          padding-bottom: 0.25rem !important;
        }

        .bg-primary {
          background-color: #dc3545 !important;
        }

        .h6 {
          font-size: 1rem;
          font-weight: 500;
        }

        @media (min-width: 992px) {
          .col-lg-3 {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }

        @media (min-width: 1200px) {
          .col-xl-2 {
            flex: 0 0 16.666667%;
            max-width: 16.666667%;
          }
        }

        .h-100 {
          height: 100% !important;
        }

        .d-block {
          display: block !important;
        }

        .d-flex {
          display: flex !important;
        }

        .flex-column {
          flex-direction: column !important;
        }

        .align-items-center {
          align-items: center !important;
        }

        .justify-content-center {
          justify-content: center !important;
        }

        .position-relative {
          position: relative !important;
        }

        .p-4 {
          padding: 1.5rem !important;
        }

        .px-3 {
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }

        .py-3 {
          padding-top: 1rem !important;
          padding-bottom: 1rem !important;
        }

        .mb-0 {
          margin-bottom: 0 !important;
        }

        .fa-envelope-o:before {
          content: "✉";
          margin-right: 5px;
        }

        .fa-phone:before {
          content: "☎";
          margin-right: 5px;
        }

        /* Profile card hover overlay styles */
        .il-profile-card {
          position: relative;
          width: 100%;
          padding-bottom: 71.43%;
          overflow: hidden;
          background: #f0f0f0;
        }

        .il-profile-card img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .il-profile-info-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          padding: 15px;
          transform: translateY(100%);
          transition: transform 0.3s ease;
          text-align: center;
        }

        .il-profile-card:hover .il-profile-info-overlay {
          transform: translateY(0);
        }

        .il-profile-info-overlay h6 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #212529;
        }

        .il-profile-info-overlay p {
          margin: 2px 0;
          font-size: 13px;
          color: #666;
        }

        .il-profile-info-overlay a {
          color: #dc3545;
          font-size: 13px;
          text-decoration: none;
        }

        .il-profile-info-overlay a:hover {
          text-decoration: underline;
        }

        /* Mobile responsive fixes */
        /* Calendar picker responsive */
        @media (max-width: 767px) {
          .litepicker {
            width: calc(100vw - 32px) !important;
            left: 0 !important;
            right: 0 !important;
            max-width: 320px;
          }

          .container__months.columns-2 {
            display: flex;
            flex-direction: column !important;
          }

          .container__months.columns-2 .month-item {
            width: 100% !important;
          }

          .container__months.columns-2 .month-item:first-child {
            margin-bottom: 1rem;
          }
        }

        /* ReCAPTCHA responsive scaling */
        @media (max-width: 480px) {
          .g-recaptcha {
            transform: scale(0.85) !important;
            transform-origin: 0 0 !important;
          }

          .g-recaptcha > div {
            width: 100% !important;
          }
        }

        @media (max-width: 360px) {
          .g-recaptcha {
            transform: scale(0.75) !important;
          }
        }

        /* Form container padding on mobile */
        @media (max-width: 767px) {
          .contact-form {
            padding-top: 30px !important;
          }

          .container.mx-auto {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
      `}</style>

      <div className="contact-form bg-white pt-12 md:pt-16 lg:pt-20" style={{ minHeight: '100vh' }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-4xl pt-4 pb-8" style={{ fontWeight: 300, color: '#212529', margin: 0 }}>
            General Inquiry
          </h1>

          {submitSuccess && (
            <div style={{
              backgroundColor: '#d4edda',
              borderColor: '#c3e6cb',
              color: '#155724',
              padding: '0.75rem 1.25rem',
              marginBottom: '1rem',
              border: '1px solid transparent',
              borderRadius: '0.25rem'
            }}>
              Your inquiry has been submitted successfully! We'll get back to you soon.
            </div>
          )}

          {submitError && (
            <div style={{
              backgroundColor: '#f8d7da',
              borderColor: '#f5c6cb',
              color: '#721c24',
              padding: '0.75rem 1.25rem',
              marginBottom: '1rem',
              border: '1px solid transparent',
              borderRadius: '0.25rem'
            }}>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="first_name" className="sr-only">First Name</label>
                  <input
                    required
                    name="firstName"
                    id="first_name"
                    type="text"
                    className="form-control"
                    placeholder="First name *"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name" className="sr-only">Last Name</label>
                  <input
                    required
                    name="lastName"
                    id="last_name"
                    type="text"
                    className="form-control"
                    placeholder="Last name *"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="sr-only">Email</label>
                  <input
                    required
                    name="email"
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder="Email *"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company" className="sr-only">Company</label>
                  <input
                    required
                    name="company"
                    id="company"
                    type="text"
                    className="form-control"
                    placeholder="Company *"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="sr-only">Message</label>
                  <textarea
                    required
                    name="message"
                    className="form-control"
                    id="message"
                    rows={8}
                    placeholder="Message *"
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="phone" className="sr-only">Phone Number</label>
                  <input
                    name="phone"
                    id="phone"
                    type="text"
                    className="form-control"
                    placeholder="Phone (e.g., (555) 123-4567)"
                    value={formData.phone}
                    onChange={handleChange}
                    style={phoneError ? { borderColor: '#dc3545' } : {}}
                  />
                  {phoneError && (
                    <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {phoneError}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="crew_size" className="sr-only">Cast / Crew Size</label>
                  <input
                    name="crewSize"
                    id="crew_size"
                    type="number"
                    className="form-control"
                    placeholder="Cast / Crew Size"
                    value={formData.crewSize}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="locations" className="sr-only">Locations</label>
                  <input
                    name="locations"
                    id="locations"
                    type="text"
                    className="form-control"
                    placeholder="Locations"
                    value={formData.locations}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label htmlFor="shooting_date" className="sr-only">Shooting Date</label>
                  <input
                    ref={inputRef}
                    name="shootingDate"
                    id="shooting_date"
                    type="text"
                    className="form-control"
                    placeholder="Shooting Date"
                    value={formData.shootingDate}
                    onClick={() => setShowPicker(true)}
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />

                  <div
                    ref={pickerRef}
                    className={`litepicker ${showPicker ? 'show-picker' : ''}`}
                    style={{
                      top: '100%',
                      left: 0,
                      marginTop: '5px',
                      maxWidth: '552px',
                      width: '100%'
                    }}
                  >
                    <div className="container__main">
                      <div className="container__months columns-2">
                        <div className="month-item">
                          <div className="month-item-header">
                            <button
                              type="button"
                              className="button-previous-month"
                              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                            >
                              <svg width="11" height="16" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.919 0l2.748 2.667L5.333 8l5.334 5.333L7.919 16 0 8z" fillRule="nonzero"/>
                              </svg>
                            </button>
                            <div>
                              <strong className="month-item-name">{monthNames[currentMonth.getMonth()]}</strong>
                              <span className="month-item-year">{currentMonth.getFullYear()}</span>
                            </div>
                            <div style={{ width: '26px' }}></div>
                          </div>

                          <div className="month-item-weekdays-row">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                              <div key={day} title={day}>{day}</div>
                            ))}
                          </div>

                          <div className="container__days">
                            {getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()).map((date, idx) => (
                              date ? (
                                <a
                                  key={idx}
                                  href="#"
                                  className={`day-item ${
                                    isToday(date) ? 'is-today' : ''
                                  } ${
                                    isSelected(date) ? (selectedStart?.toDateString() === date.toDateString() ? 'is-start-date' : 'is-end-date') : ''
                                  } ${
                                    isInRange(date) ? 'is-in-range' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDateClick(date);
                                  }}
                                  onMouseEnter={() => selectedStart && !selectedEnd && setHoverDate(date)}
                                  onMouseLeave={() => setHoverDate(null)}
                                  data-time={date.getTime()}
                                >
                                  {date.getDate()}
                                </a>
                              ) : (
                                <div key={idx}></div>
                              )
                            ))}
                          </div>
                        </div>

                        <div className="month-item">
                          <div className="month-item-header">
                            <div style={{ width: '26px' }}></div>
                            <div>
                              <strong className="month-item-name">
                                {monthNames[(currentMonth.getMonth() + 1) % 12]}
                              </strong>
                              <span className="month-item-year">
                                {currentMonth.getMonth() === 11 ? currentMonth.getFullYear() + 1 : currentMonth.getFullYear()}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="button-next-month"
                              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                            >
                              <svg width="11" height="16" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.748 16L0 13.333 5.333 8 0 2.667 2.748 0l7.919 8z" fillRule="nonzero"/>
                              </svg>
                            </button>
                          </div>

                          <div className="month-item-weekdays-row">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                              <div key={day} title={day}>{day}</div>
                            ))}
                          </div>

                          <div className="container__days">
                            {getDaysInMonth(
                              currentMonth.getMonth() === 11 ? currentMonth.getFullYear() + 1 : currentMonth.getFullYear(),
                              (currentMonth.getMonth() + 1) % 12
                            ).map((date, idx) => (
                              date ? (
                                <a
                                  key={idx}
                                  href="#"
                                  className={`day-item ${
                                    isToday(date) ? 'is-today' : ''
                                  } ${
                                    isSelected(date) ? (selectedStart?.toDateString() === date.toDateString() ? 'is-start-date' : 'is-end-date') : ''
                                  } ${
                                    isInRange(date) ? 'is-in-range' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDateClick(date);
                                  }}
                                  onMouseEnter={() => selectedStart && !selectedEnd && setHoverDate(date)}
                                  onMouseLeave={() => setHoverDate(null)}
                                  data-time={date.getTime()}
                                >
                                  {date.getDate()}
                                </a>
                              ) : (
                                <div key={idx}></div>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Questions */}
                {dynamicQuestions.map((question) => (
                  <div key={question.id} className="form-group">
                    <label htmlFor={question.field_name} style={{ fontSize: '14px', fontWeight: 500 }}>
                      {question.question_text} {question.is_required && '*'}
                    </label>
                    <select
                      required={question.is_required}
                      className="form-control"
                      name={question.field_name}
                      id={question.field_name}
                      value={dynamicAnswers[question.field_name] || ''}
                      onChange={(e) => {
                        setDynamicAnswers(prev => ({
                          ...prev,
                          [question.field_name]: e.target.value
                        }));
                      }}
                    >
                      <option value="" disabled>
                        {question.question_text.includes('?') ? question.question_text : `Select ${question.question_text.toLowerCase()}`}
                      </option>
                      {question.options && question.options.map((option: any) => (
                        <option key={option.id} value={option.option_value}>
                          {option.option_label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="mt-4">
                  <h6 className="text-xl mb-2" style={{ color: '#dc3545', fontWeight: 500 }}>
                    General Contact:
                  </h6>
                  <p style={{ lineHeight: 1.5, fontSize: '14px' }}>
                    {contactInfo.email}<br />
                    {contactInfo.phone}<br />
                    {contactInfo.address.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < contactInfo.address.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              {/* Full Width reCAPTCHA Section - Centered */}
              <div className="col-12">
                <div className="form-group mt-2 text-center">
                  <ReCaptcha
                    ref={recaptchaRef}
                    onVerify={(token) => {
                      setRecaptchaToken(token);
                      setRecaptchaError('');
                    }}
                    onExpired={() => {
                      setRecaptchaToken(null);
                      setRecaptchaError('reCAPTCHA expired, please verify again');
                    }}
                    onError={() => {
                      setRecaptchaToken(null);
                      setRecaptchaError('reCAPTCHA error, please try again');
                    }}
                  />
                  {recaptchaError && (
                    <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      {recaptchaError}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button - Centered with Bootstrap offsets */}
              <div className="col-md-4 offset-md-4 col-sm-6 offset-sm-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg il-submit-btn w-100 mb-4"
                  style={{
                    backgroundColor: '#dc3545',
                    borderColor: '#dc3545',
                    fontSize: '1.25rem',
                    padding: '0.75rem',
                    fontWeight: 400,
                    borderRadius: '0.3rem',
                    width: '100%',
                    opacity: isSubmitting ? 0.6 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </form>

          {/* Team/Partner Grid Section - CMS Managed */}
          <div className="container-fluid il-profiles" style={{ marginTop: '3rem' }}>
            <div className="row px-1">
              {gridData.map((entry) => (
                <div key={entry.position} className="px-1 py-1 col-xl-2 col-lg-3 col-md-4 col-sm-6">
                  {entry.entry_type === 'team' && (
                    <div className="il-profile-section">
                      <div className="il-profile-card">
                        {entry.image_url && (
                          <img
                            src={entry.image_url}
                            alt={entry.name || 'Team Member'}
                            onError={(e) => {
                              e.currentTarget.src = `https://via.placeholder.com/231x165/808080/ffffff?text=${encodeURIComponent(entry.name || 'Team')}`;
                            }}
                          />
                        )}
                        <div className="il-profile-info-overlay">
                          {entry.name && <h6>{entry.name}</h6>}
                          {entry.title && <p>{entry.title}</p>}
                          {entry.email && <a href={`mailto:${entry.email}`}>{entry.email}</a>}
                        </div>
                      </div>
                    </div>
                  )}

                  {entry.entry_type === 'company' && (
                    <>
                      {/* Company - only link if URL is not # or empty */}
                      {entry.external_url && entry.external_url !== '#' ? (
                        <a href={entry.external_url} className="d-block" target="_blank" rel="noopener noreferrer">
                          <div className="il-profile-card">
                            {entry.image_url && (
                              <img
                                src={entry.image_url}
                                alt={entry.company_name || 'Company'}
                                onError={(e) => {
                                  e.currentTarget.src = `https://via.placeholder.com/231x165/333/ffffff?text=${encodeURIComponent(entry.company_name || 'Company')}`;
                                }}
                              />
                            )}
                          </div>
                        </a>
                      ) : (
                        <div className="il-profile-card">
                          {entry.image_url && (
                            <img
                              src={entry.image_url}
                              alt={entry.company_name || 'Company'}
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/231x165/333/ffffff?text=${encodeURIComponent(entry.company_name || 'Company')}`;
                              }}
                            />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
