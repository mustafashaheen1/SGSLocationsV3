'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
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

  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDate; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handleDateClick = (date: Date) => {
    if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
      setSelectedDates({ start: date, end: null });
    } else {
      if (date < selectedDates.start) {
        setSelectedDates({ start: date, end: selectedDates.start });
      } else {
        setSelectedDates({ start: selectedDates.start, end: date });
      }

      const range = date < selectedDates.start
        ? `${formatDate(date)} - ${formatDate(selectedDates.start)}`
        : `${formatDate(selectedDates.start)} - ${formatDate(date)}`;

      setFormData(prev => ({ ...prev, shootingDate: range }));
      setTimeout(() => setShowCalendar(false), 200);
    }
  };

  const isInRange = (date: Date) => {
    if (!selectedDates.start) return false;

    const end = selectedDates.end || hoverDate;
    if (!end) return date.getTime() === selectedDates.start.getTime();

    const start = selectedDates.start;
    const dateTime = date.getTime();
    return dateTime >= Math.min(start.getTime(), end.getTime()) &&
           dateTime <= Math.max(start.getTime(), end.getTime());
  };

  const getDayCount = () => {
    if (!selectedDates.start) return 0;
    const end = selectedDates.end || hoverDate;
    if (!end) return 1;

    const diffTime = Math.abs(end.getTime() - selectedDates.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

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

        .calendar-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ced4da;
          border-top: none;
          border-radius: 0 0 4px 4px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 1000;
          padding: 15px;
        }

        .calendar-day {
          width: 14.28%;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          border: none;
          background: transparent;
          position: relative;
        }

        .calendar-day:hover {
          background: #f0f0f0;
        }

        .calendar-day.selected {
          background: #007bff;
          color: white;
        }

        .calendar-day.in-range {
          background: #cce5ff;
          color: #004085;
        }

        .calendar-day.start-date,
        .calendar-day.end-date {
          background: #007bff;
          color: white;
        }

        .day-count {
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 12px;
          white-space: nowrap;
        }
      `}</style>

      <div className="contact-form bg-white" style={{ paddingTop: '60px', minHeight: '100vh' }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-4xl pt-4 pb-8" style={{
            fontWeight: 300,
            color: '#212529',
            margin: 0
          }}>
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
                    name="shootingDate"
                    id="shooting_date"
                    type="text"
                    className="form-control"
                    placeholder="Shooting Date"
                    value={formData.shootingDate}
                    onClick={() => setShowCalendar(true)}
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />

                  {showCalendar && (
                    <div ref={calendarRef} className="calendar-dropdown">
                      <div className="mb-3 p-2 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                        {selectedDates.start && selectedDates.end
                          ? `${formatDate(selectedDates.start)} - ${formatDate(selectedDates.end)}`
                          : selectedDates.start
                          ? `${formatDate(selectedDates.start)} - Select end date`
                          : 'Select date range'
                        }
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="p-1"
                        >
                          <ChevronLeft size={20} />
                        </button>

                        <h3 className="font-semibold">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>

                        <button
                          type="button"
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          className="p-1"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-0 text-center">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-xs font-semibold p-2 text-gray-500">
                            {day}
                          </div>
                        ))}

                        {getDaysInMonth(currentMonth).map((date, index) => (
                          <div key={index} className="relative">
                            {date ? (
                              <button
                                type="button"
                                className={`calendar-day ${
                                  isInRange(date) ? 'in-range' : ''
                                } ${
                                  selectedDates.start && date.getTime() === selectedDates.start.getTime() ? 'start-date' : ''
                                } ${
                                  selectedDates.end && date.getTime() === selectedDates.end.getTime() ? 'end-date' : ''
                                }`}
                                onClick={() => handleDateClick(date)}
                                onMouseEnter={() => setHoverDate(date)}
                                onMouseLeave={() => setHoverDate(null)}
                              >
                                {date.getDate()}
                                {selectedDates.start && !selectedDates.end && hoverDate === date && (
                                  <span className="day-count">{getDayCount()} days</span>
                                )}
                              </button>
                            ) : (
                              <div className="calendar-day" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

              <div className="col-12">
                <div className="form-group mt-4 text-center">
                  <div className="inline-block">
                    <div className="border border-gray-300 p-3 rounded inline-flex items-center bg-gray-50">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">I'm not a robot</span>
                      <span className="ml-8 text-xs text-gray-500">reCAPTCHA</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 text-center">
                <div style={{ maxWidth: '33.33%', margin: '0 auto' }}>
                  <button type="submit" className="btn btn-primary w-full mb-8">
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="container-fluid px-0">
            <div className="flex flex-wrap -mx-1">
              <div className="w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 px-1 py-1">
                <div className="bg-[#dc3545] text-white p-4 h-full flex flex-col items-center justify-center text-center" style={{ fontSize: '14px', aspectRatio: '1/1' }}>
                  <p>Paul@ImageLocations.com</p>
                  <p>(310) 871-8004</p>
                  <p>9663 Santa Monica Blvd,<br />Suite 842 Beverly Hills,<br />CA, 90210</p>
                </div>
              </div>

              {[...Array(23)].map((_, i) => (
                <div key={i} className="w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 px-1 py-1">
                  <div className="bg-gray-200" style={{ aspectRatio: '1/1' }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
