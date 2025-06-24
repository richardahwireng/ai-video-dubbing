import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import "../../styles/Shared/Navbar.css";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo">
          <Link to="/" className="logo-text">
            Richard DubAI
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-links">
          <a href="/" className="nav-link">
            Home
          </a>
          <a href="#features" className="nav-link">
            Features
          </a>
          <a href="#contact" className="nav-link">
            Contact
          </a>
        </div>

        {/* Desktop CTA Button */}
        <Link to="/upload" className="cta-button desktop-cta">
          Get Started
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="menu-icon" />
          ) : (
            <Menu className="menu-icon" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            <a
              href="#features"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#pricing"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="/contact"
              className="mobile-nav-link"
            >
              Contact
            </a>
            <Link to="/upload" className="mobile-cta-button">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;