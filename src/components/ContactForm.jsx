import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import '../styles/ContactForm.css';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSubmitStatus(''), 3000);
    }, 1500);
  };

  return (
    <div className="contact-form-landing">
      <div className="form-wrapper">
        {/* Header Section */}
        <div  className="form-landing-header">
          <div className="header-badge">
            <MessageSquare className="badge-icon" />
            <span className="badge-text">Get In Touch</span>
          </div>
          
          <h1 className="landing-title">
            Contact Our Team
            <span className="title-gradient">We're Here to Help</span>
          </h1>
          
          <p className="landing-description">
            Have questions about our AI dubbing platform? Need technical support? 
            Want to discuss enterprise solutions? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Form */}
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-title">Send us a Message</h2>
            <p className="form-description">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject" className="form-label">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="What's this about?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows="6"
                className="form-textarea"
                placeholder="Tell us how we can help you..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Message</span>
                  <Send className="send-icon" />
                </>
              )}
            </button>

            {submitStatus === 'success' && (
              <div className="success-message">
                <div className="success-icon">✓</div>
                <span>Message sent successfully! We'll get back to you soon.</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactForm;