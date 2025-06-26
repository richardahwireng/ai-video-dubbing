import React, { useState, useEffect } from "react";
import { Play, Mic, Globe, Volume2 } from "lucide-react";
import "../styles/Features.css";

function Features() {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
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

  return (
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
  );
}

export default Features;