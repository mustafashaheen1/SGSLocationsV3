'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ContactPage() {
  const [gridData, setGridData] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    message: '',
    phone: '',
    crewSize: '',
    locations: '',
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

  useEffect(() => {
    async function fetchContactGrid() {
      const { data } = await supabase
        .from('contact_grid')
        .select('*')
        .eq('is_active', true)
        .order('position');

      if (data) {
        // Filter out empty slots for display
        const activeEntries = data.filter(entry => entry.entry_type !== 'empty');
        setGridData(activeEntries);
      }
    }

    fetchContactGrid();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
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
      `}</style>

      <div className="contact-form bg-white" style={{ paddingTop: '60px', minHeight: '100vh' }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-4xl pt-4 pb-8" style={{ fontWeight: 300, color: '#212529', margin: 0 }}>
            Book A Location
          </h1>

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
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
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
                      width: '552px'
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

                <div className="form-group">
                  <label htmlFor="project_type" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Project Type *
                  </label>
                  <select
                    required
                    className="form-control"
                    name="projectType"
                    id="project_type"
                    value={formData.projectType}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select project type</option>
                    <option value="motion">Motion</option>
                    <option value="stills">Stills</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="how_did_you_hear_from_us" style={{ fontSize: '14px', fontWeight: 500 }}>
                    How did you hear about us? *
                  </label>
                  <select
                    required
                    className="form-control"
                    name="howDidYouHear"
                    id="how_did_you_hear_from_us"
                    value={formData.howDidYouHear}
                    onChange={handleChange}
                  >
                    <option value="" disabled>How did you hear about us?</option>
                    <option value="google">Google</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="referral">Referral</option>
                    <option value="returning-client">Returning Client</option>
                  </select>
                </div>

                <div className="mt-4">
                  <h6 className="text-xl mb-2" style={{ color: '#dc3545', fontWeight: 500 }}>
                    General Contact:
                  </h6>
                  <p style={{ lineHeight: 1.5, fontSize: '14px' }}>
                    paul@imagelocations.com<br />
                    (310) 871-8004<br />
                    9663 Santa Monica Blvd. Suite 842,<br />
                    Beverly Hills, CA 90210
                  </p>
                </div>
              </div>

              {/* Full Width reCAPTCHA Section - Centered */}
              <div className="col-12">
                <div className="form-group mt-2 text-center">
                  <div className="text-center">
                    <div className="d-inline-block">
                      <div
                        className="g-recaptcha"
                        style={{
                          transform: 'scale(1)',
                          transformOrigin: '0 0',
                          width: '304px',
                          height: '78px',
                          margin: '0 auto'
                        }}
                      >
                        <div style={{
                          width: '304px',
                          height: '78px',
                          border: '1px solid #d3d3d3',
                          borderRadius: '3px',
                          backgroundColor: '#f9f9f9',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 13px'
                        }}>
                          <input type="checkbox" style={{ marginRight: '12px' }} />
                          <label style={{
                            flex: 1,
                            fontSize: '14px',
                            color: '#000',
                            lineHeight: 'normal'
                          }}>
                            I'm not a robot
                          </label>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            fontSize: '10px',
                            color: '#555',
                            lineHeight: '10px'
                          }}>
                            <div style={{ marginBottom: '2px' }}>reCAPTCHA</div>
                            <div style={{ fontSize: '8px' }}>
                              <a href="#" style={{ color: '#555' }}>Privacy</a> -
                              <a href="#" style={{ color: '#555' }}> Terms</a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button - Centered with Bootstrap offsets */}
              <div className="col-md-4 offset-md-4 col-sm-6 offset-sm-3">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg il-submit-btn w-100 mb-4"
                  style={{
                    backgroundColor: '#dc3545',
                    borderColor: '#dc3545',
                    fontSize: '1.25rem',
                    padding: '0.75rem',
                    fontWeight: 400,
                    borderRadius: '0.3rem',
                    width: '100%'
                  }}
                >
                  Submit
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
