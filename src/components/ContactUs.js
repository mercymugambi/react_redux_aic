import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

function ContactForm() {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    purpose: 'Prayer Request',
    subject: '',
    message: '',
    followUp: false,
    contactMethod: 'Email',
  });

  // State to check if the screen is mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT_CONTACT_FORM', payload: formData });
    alert("Thank you for reaching out! We'll get back to you soon.");
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      purpose: 'Prayer Request',
      subject: '',
      message: '',
      followUp: false,
      contactMethod: 'Email',
    });
  };

  return (
    <div className="relative flex justify-center items-center px-4 mt-0 mb-20">
      {/* Form Container */}
      <div className="max-w-3xl w-full p-8 shadow-2xl rounded-lg border border-black relative z-10 mt-32 p-15">
        {/* Image with fade effect inside the form container */}
        <div className="absolute inset-0">
          <img 
            src={isMobile ? "/assets/contact-mobile.png" : "/assets/contact.png"} 
            alt="Contact" 
            className="mb-10 w-full h-full object-cover opacity-50" 
          />
        </div>
        
        {/* Form starts here */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-transparent relative z-20 mt-20"> {/* Set z-index to bring form elements above the image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black">
                Full Name <span className="text-red">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-black rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black">
                Email Address <span className="text-red">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-black rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black">Phone Number (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-black rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black">
                Purpose of Contact <span className="text-red">*</span>
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-black rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo"
                required
              >
                <option>Prayer Request</option>
                <option>General Inquiry</option>
                <option>Event Information</option>
                <option>Complaint</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black">
              Subject <span className="text-red">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-black rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black">
              Message <span className="text-red">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-black rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo"
              rows="4"
              required
            ></textarea>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="followUp"
              checked={formData.followUp}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-black rounded shadow-lg focus:ring-indigo"
            />
            <label className="ml-2 block text-sm text-black">Would you like a follow-up?</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-black">
              Preferred Contact Method <span className="text-red">*</span>
            </label>
            <select
              name="contactMethod"
              value={formData.contactMethod}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-black rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo"
              required
            >
              <option>Email</option>
              <option>Phone</option>
              <option>No Preference</option>
            </select>
          </div>
          <div className="text-center">
            <button
              type="submit"
              className="px-6 py-2 text-white bg-black rounded-md shadow-lg hover:bg-indigo focus:outline-none"
            >
              Submit Your Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactForm;
