'use client';

import { useState } from 'react';
import Image from 'next/image';
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
    castCrewSize: '',
    locations: '',
    shootingDate: '',
    projectType: '',
    howDidYouHear: ''
  });

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

  const teamMembers = [
    { name: 'Paul@ImageLocations.com', phone: '(310) 871-8004', address: '9663 Santa Monica Blvd,\nSuite 842 Beverly Hills,\nCA, 90210', bgColor: '#e11921', textColor: 'white' },
    { name: 'Alex Rodriguez', image: '/team/alex.jpg' },
    { name: 'List MY HOME', bgColor: '#8bc34a', logo: true },
    { name: 'Sarah Johnson', image: '/team/sarah.jpg' },
    { name: 'Mike Chen', image: '/team/mike.jpg' },
    { name: 'CREW PARKING', bgColor: '#ffc107', logo: true },
    { name: 'Jessica Williams', image: '/team/jessica.jpg' },
    { name: 'Camilla More\nLocation Supervisor\ninfo@imagelocations.com', image: '/team/camilla.jpg', hasText: true },
    { name: 'SKY STUDIO', image: '/logos/sky-studio.jpg' },
    { name: 'Mansion Hunters', image: '/logos/mansion-hunters.jpg' },
    { name: 'Facebook', bgColor: '#3b5998', logo: true },
    { name: 'David Brown', image: '/team/david.jpg' },
    { name: 'Robert Smith', image: '/team/robert.jpg' },
    { name: 'Audrey Rodriguez\nAccounting\naudrey@imagelocations.com', image: '/team/audrey.jpg', hasText: true },
    { name: 'Bloomberg', bgColor: '#000', logo: true },
    { name: 'Wedding Estates', bgColor: '#40c4c4', logo: true },
    { name: 'Tom Anderson', image: '/team/tom.jpg' },
    { name: 'Inc 5000', bgColor: '#fff', logo: true },
    { name: 'JOBS.FILM', bgColor: '#000', logo: true },
    { name: 'Member Favorite', bgColor: '#2196f3', logo: true },
    { name: 'St Jude', bgColor: '#cddc39', logo: true },
    { name: 'Instagram', bgColor: '#125688', logo: true },
    { name: 'Pinterest', bgColor: '#bd081c', logo: true }
  ];

  return (
    <>
      <style jsx global>{`
        .contact-page {
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
          color: #212529;
        }

        .contact-form-input {
          width: 100%;
          padding: 8px 12px;
          font-size: 16px;
          font-family: acumin-pro-wide, sans-serif;
          font-weight: 300;
          color: #495057;
          background-color: #fff;
          border: 1px solid #ced4da;
          border-radius: 0;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }

        .contact-form-input:focus {
          color: #495057;
          background-color: #fff;
          border-color: #80bdff;
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
        }

        .contact-form-input::placeholder {
          color: #6c757d;
          opacity: 1;
        }

        .contact-textarea {
          min-height: 200px;
          resize: vertical;
        }

        .contact-submit-btn {
          background-color: #e11921;
          color: white;
          border: none;
          padding: 12px 32px;
          font-size: 18px;
          font-weight: 400;
          font-family: acumin-pro-wide, sans-serif;
          width: 100%;
          cursor: pointer;
          transition: background-color 0.15s ease-in-out;
          border-radius: 4px;
        }

        .contact-submit-btn:hover {
          background-color: #c41e26;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 0;
          margin-top: 60px;
        }

        .team-member-card {
          position: relative;
          padding-bottom: 100%;
          overflow: hidden;
          background: #f8f9fa;
        }

        .team-member-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          text-align: center;
        }

        .form-label {
          display: block;
          margin-bottom: 5px;
          font-size: 14px;
          color: #495057;
          font-weight: 400;
        }

        .required-star {
          color: #e11921;
        }
      `}</style>

      <div className="contact-page min-h-screen bg-white" style={{ paddingTop: '80px' }}>
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <h1 className="text-4xl mb-8" style={{
            fontFamily: 'acumin-pro-wide, sans-serif',
            fontWeight: 300,
            color: '#212529'
          }}>
            Book A Location
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">
                        First name <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="contact-form-input"
                        placeholder="First name *"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Last name <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="contact-form-input"
                        placeholder="Last name *"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Email <span className="required-star">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="contact-form-input"
                        placeholder="Email *"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Company <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="contact-form-input"
                        placeholder="Company *"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Message <span className="required-star">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="contact-form-input contact-textarea"
                        placeholder="Message *"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="contact-form-input"
                        placeholder="Phone"
                      />
                    </div>

                    <div>
                      <label className="form-label">Cast / Crew Size</label>
                      <input
                        type="text"
                        name="castCrewSize"
                        value={formData.castCrewSize}
                        onChange={handleChange}
                        className="contact-form-input"
                        placeholder="Cast / Crew Size"
                      />
                    </div>

                    <div>
                      <label className="form-label">Locations</label>
                      <input
                        type="text"
                        name="locations"
                        value={formData.locations}
                        onChange={handleChange}
                        className="contact-form-input"
                        placeholder="Locations"
                      />
                    </div>

                    <div>
                      <label className="form-label">Shooting Date</label>
                      <input
                        type="text"
                        name="shootingDate"
                        value={formData.shootingDate}
                        onChange={handleChange}
                        className="contact-form-input"
                        placeholder="Shooting Date"
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Project Type <span className="required-star">*</span>
                      </label>
                      <select
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleChange}
                        className="contact-form-input"
                        required
                      >
                        <option value="">Select project type</option>
                        <option value="feature">Feature Film</option>
                        <option value="tv">TV Series</option>
                        <option value="commercial">Commercial</option>
                        <option value="music-video">Music Video</option>
                        <option value="photo-shoot">Photo Shoot</option>
                        <option value="documentary">Documentary</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">
                        How did you hear about us? <span className="required-star">*</span>
                      </label>
                      <select
                        name="howDidYouHear"
                        value={formData.howDidYouHear}
                        onChange={handleChange}
                        className="contact-form-input"
                        required
                      >
                        <option value="">How did you hear about us?</option>
                        <option value="google">Google Search</option>
                        <option value="social">Social Media</option>
                        <option value="referral">Referral</option>
                        <option value="film-commission">Film Commission</option>
                        <option value="previous-client">Previous Client</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 mb-6">
                  <div className="flex items-center p-3 bg-gray-50 border border-gray-300 rounded">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-sm">I'm not a robot</span>
                    <div className="ml-auto text-xs text-gray-500">
                      reCAPTCHA
                    </div>
                  </div>
                </div>

                <button type="submit" className="contact-submit-btn">
                  Submit
                </button>
              </form>
            </div>

            <div className="lg:col-span-1">
              <div className="p-6">
                <h2 className="text-2xl mb-4" style={{
                  color: '#e11921',
                  fontFamily: 'acumin-pro-wide, sans-serif',
                  fontWeight: 400
                }}>
                  General Contact:
                </h2>
                <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
                  paul@imagelocations.com<br />
                  (310) 871-8004<br />
                  9663 Santa Monica Blvd. Suite 842,<br />
                  Beverly Hills, CA 90210
                </p>
              </div>
            </div>
          </div>

          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="team-member-card"
                style={{
                  backgroundColor: member.bgColor || '#f8f9fa'
                }}
              >
                <div className="team-member-content">
                  {member.image ? (
                    <div className="w-full h-full relative">
                      <div className="bg-gray-200 w-full h-full" />
                      {member.hasText && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white bg-opacity-90">
                          <p className="text-sm" style={{ color: member.name.includes('Camilla') ? '#e11921' : '#495057' }}>
                            {member.name.split('\n').map((line, i) => (
                              <span key={i}>
                                {line}
                                {i < member.name.split('\n').length - 1 && <br />}
                              </span>
                            ))}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : member.address ? (
                    <div className="text-white text-center">
                      <p className="mb-2">{member.name}</p>
                      <p className="text-sm">{member.phone}</p>
                      <p className="text-xs mt-2">
                        {member.address.split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            {i < member.address.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>
                  ) : member.logo ? (
                    <div className="text-2xl font-bold" style={{ color: member.textColor || '#fff' }}>
                      {member.name}
                    </div>
                  ) : (
                    <p>{member.name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/" className="inline-flex items-center gap-2">
              <Camera className="w-10 h-10 text-[#e11921]" />
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                IMAGE<sup className="text-xs">™</sup>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
