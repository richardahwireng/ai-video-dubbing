import React, { useState, useEffect } from "react";
import { Play, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/Hero.css";

function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { number: "99.9%", label: "Accuracy Rate" },
    { number: "10x", label: "Faster Processing" },
    { number: "50+", label: "Supported Formats" },
    { number: "24/7", label: "API Availability" },
  ];

  return (
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
  );
}

export default Hero;