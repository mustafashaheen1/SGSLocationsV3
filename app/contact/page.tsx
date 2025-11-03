'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null as Date | null, to: null as Date | null });

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

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
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

                <div className="form-group">
                  <label htmlFor="shooting_date" className="sr-only">Shooting Date</label>
                  <input
                    name="shootingDate"
                    id="shooting_date"
                    type="text"
                    className="form-control"
                    placeholder="Shooting Date"
                    value={formData.shootingDate}
                    onClick={() => setShowDatePicker(true)}
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />
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

            {/* Date Picker Modal */}
            {showDatePicker && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full">
                  <div className="mb-4">
                    <input
                      type="text"
                      className="form-control"
                      value={dateRange.from && dateRange.to
                        ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
                        : 'Select date range'
                      }
                      readOnly
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">From Date</h3>
                      <input
                        type="date"
                        className="form-control"
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          setDateRange(prev => ({ ...prev, from: date }));
                        }}
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">To Date</h3>
                      <input
                        type="date"
                        className="form-control"
                        min={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          setDateRange(prev => ({ ...prev, to: date }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDatePicker(false);
                        setDateRange({ from: null, to: null });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (dateRange.from && dateRange.to) {
                          const formattedDate = `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
                          setFormData(prev => ({ ...prev, shootingDate: formattedDate }));
                          setShowDatePicker(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
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
