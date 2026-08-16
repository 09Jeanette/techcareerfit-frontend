import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="floating-orb orb-one" />
      <div className="floating-orb orb-two" />
      <div className="floating-orb orb-three" />

      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Career clarity for future-ready tech talent</span>
          <h1>Build a standout profile and land your next role.</h1>
          <p>
            TechCareerFit helps you upload your CV, analyze job fit, track applications,
            and get practical recommendations for the next step in your career journey.
          </p>

          <div className="hero-actions d-flex gap-3 flex-wrap">
            <Link className="btn btn-primary btn-lg" to="/register">Get Started</Link>
            <Link className="btn btn-outline-dark btn-lg" to="/login">Login</Link>
          </div>

          <div className="hero-stats row g-3">
            <div className="col-sm-4">
              <div className="stat-box">
                <strong>92%</strong>
                <span>ATS match</span>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="stat-box">
                <strong>1,500+</strong>
                <span>skills tracked</span>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="stat-box">
                <strong>24/7</strong>
                <span>career guidance</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-card glass-card">
            <div className="card-header-row">
              <span className="chip chip-light">Live report</span>
              <span className="chip chip-orange">ATS score</span>
            </div>

            <div className="score-ring">
              <div className="score-value">92</div>
            </div>

            <div className="mock-list">
              <div className="mock-row">
                <span>Core skills</span>
                <span className="success-pill">Matched</span>
              </div>
              <div className="mock-row">
                <span>Portfolio gap</span>
                <span className="warning-pill">2 missing</span>
              </div>
              <div className="mock-row">
                <span>Interview prep</span>
                <span className="neutral-pill">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-section">
        <div className="section-heading text-center">
          <span className="eyebrow">Why TechCareerFit</span>
          <h2>Everything you need, in one smart workspace.</h2>
        </div>

        <div className="feature-grid row g-4">
          <div className="col-md-4">
            <div className="feature-card glass-card">
              <div className="icon-badge">CV</div>
              <h3>CV Upload & Parsing</h3>
              <p>Upload your resume and let the platform extract key skills, qualifications, and experience.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="feature-card glass-card">
              <div className="icon-badge">ATS</div>
              <h3>Job Match Analysis</h3>
              <p>Compare your CV against job descriptions and discover exactly where to improve.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="feature-card glass-card">
              <div className="icon-badge">APP</div>
              <h3>Application Tracking</h3>
              <p>Keep your job applications organized and manage your next steps without losing momentum.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-strip glass-card">
        <div>
          <span className="eyebrow">Start your next chapter</span>
          <h3>Turn your career goals into a practical plan.</h3>
        </div>
        <Link className="btn btn-primary btn-lg" to="/register">Create account</Link>
      </section>
    </div>
  );
}
