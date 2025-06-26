import React from "react";
import { Link } from "react-router-dom";
import "../styles/CTA.css";

function CTA() {
  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2 className="cta-title">Ready to Transform Your Videos?</h2>
        <p className="cta-description">
          Join thousands of creators using our AI dubbing platform to reach
          global audiences
        </p>
        <div className="cta-buttons">
          <Link to="/upload" className="cta-primary-button">
            Start Free Trial
          </Link>
          <Link to="/contact" className="cta-secondary-button">
            Contact Sales
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CTA;