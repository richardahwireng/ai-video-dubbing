import React, { useState, useEffect } from "react";
import {
  Play,
  Mic,
  Globe,
  Volume2,
  Zap,
  Cpu,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import "../styles/HomePage.css";
import { Link } from "react-router-dom";
import ContactForm from "./ContactForm";

function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Play className="feature-icon" />,
      title: "Video Processing",
      description:
        "Extract audio from video files using FFmpeg with precision and speed",
      color: "purple-pink",
    },
    {
      icon: <Mic className="feature-icon" />,
      title: "Speech-to-Text",
      description:
        "Convert spoken English to text using AssemblyAI's advanced recognition",
      color: "blue-cyan",
    },
    {
      icon: <Globe className="feature-icon" />,
      title: "Language Translation",
      description:
        "Translate English text to Twi language using Google Translate API",
      color: "green-emerald",
    },
    {
      icon: <Volume2 className="feature-icon" />,
      title: "Text-to-Speech",
      description:
        "Generate natural-sounding Twi speech using Hugging Face models",
      color: "orange-red",
    },
  ];

  const stats = [
    { number: "99.9%", label: "Accuracy Rate" },
    { number: "10x", label: "Faster Processing" },
    { number: "50+", label: "Supported Formats" },
    { number: "24/7", label: "API Availability" },
  ];

  return (
    <div className="homepage">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="background-gradient"></div>
        <div className="background-circle background-circle-1"></div>
        <div className="background-circle background-circle-2"></div>
      </div>

      <div className="content-wrapper">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <Link to="/" className="logo-text">
                {" "}
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
                  // onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </a>
                <button className="mobile-cta-button">Get Started</button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="hero-section">
          <div className={`hero-content ${isVisible ? "visible" : ""}`}>
            <div className="hero-badge">
              <Zap className="badge-icon" />
              <span className="badge-text">Powered by Advanced AI</span>
            </div>

            <h1 className="hero-title">
              AI Video Dubbing
              <span className="hero-title-gradient">Made Simple</span>
            </h1>

            <p className="hero-description">
              Transform your English videos into natural-sounding Twi with our
              cutting-edge AI pipeline. Professional video dubbing powered by
              AssemblyAI, Google Translate, and Hugging Face.
            </p>

            <div className="hero-buttons">
              <Link to="upload" className="primary-button">
                <span>Start Dubbing</span>
                <ArrowRight className="button-arrow" />
              </Link>
              <button className="secondary-button">
                <Play className="play-icon" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="features-header">
            <h2 className="section-title">Powerful AI Features</h2>
            <p className="section-description">
              Every feature designed for professional-grade video dubbing with
              maximum accuracy and speed
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-card ${
                  activeFeature === index ? "active" : ""
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`feature-icon-wrapper ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-overlay"></div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Videos?</h2>
            <p className="cta-description">
              Join thousands of creators using our AI dubbing platform to reach
              global audiences
            </p>
            <div className="cta-buttons">
              <button className="cta-primary-button">Start Free Trial</button>
              <button className="cta-secondary-button">Contact Sales</button>
            </div>
          </div>
        </section>

        <section id="contact">
          <ContactForm />
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="footer-logo-text">Richard DubAI</span>
            </div>
            <p className="footer-copyright">
              &copy; {new Date().getFullYear()}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default HomePage;
