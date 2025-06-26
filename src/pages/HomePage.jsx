import React from "react";
import "../styles/HomePage.css";
import { ContactForm, CTA, Features, Hero } from "../components";
import { Footer, Navbar } from "../components/Shared";


function HomePage() {
  return (
    <div className="homepage">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="background-gradient"></div>
        <div className="background-circle background-circle-1"></div>
        <div className="background-circle background-circle-2"></div>
      </div>

      <div className="content-wrapper">
        <Navbar />

        <Hero />
        <Features />
        <CTA />
        <section id="contact">
          <ContactForm />
        </section>
        <Footer />
      </div>
    </div>
  );
}

export default HomePage;