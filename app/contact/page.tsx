'use client';

import { useState, useRef, useEffect } from 'react';

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

  const [showPicker, setShowPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
