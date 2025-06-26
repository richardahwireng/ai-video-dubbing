import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Cpu, Menu, X } from 'lucide-react';
import '../styles/Layout.css';

function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMobileMenuToggle = () => setMobileMenuOpen(!mobileMenuOpen);
  const handleMobileMenuClose = () => setMobileMenuOpen(false);

  const navigationLinks = [
    { href: "/", label: "Home" },
    { href: "/#features", label: "Features" },
    { href: "/upload", label: "Upload" },
    { href: "/contact", label: "Contact" }
  ];

  const handleNavClick = (href) => {
    if (href.startsWith('/#')) {
      // Handle anchor links
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(href.substring(1));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        const element = document.querySelector(href.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(href);
    }
    handleMobileMenuClose();
  };

  return (
    <div className="layout">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="background-gradient"></div>
        <div className="background-circle background-circle-1"></div>
        <div className="background-circle background-circle-2"></div>
      </div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <Cpu className="logo-cpu" />
            </div>
            <span className="logo-text">DubAI</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="nav-links">
            {navigationLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`nav-link ${location.pathname === link.href ? 'active' : ''}`}
              >
                {link.label}
              </button>
            ))}
          </div>
          
          {/* Desktop CTA Button */}
          <button 
            className="cta-button desktop-cta"
            onClick={() => navigate('/upload')}
          >
            Get Started
          </button>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={handleMobileMenuToggle}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-content">
              {navigationLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`mobile-nav-link ${location.pathname === link.href ? 'active' : ''}`}
                >
                  {link.label}
                </button>
              ))}
              <button 
                className="mobile-cta-button"
                onClick={() => {
                  handleMobileMenuClose();
                  navigate('/upload');
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

    </div>
  );
}

export default Layout;