import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiShield,
  FiVideo,
  FiBookOpen,
  FiBarChart2,
  FiCpu,
  FiUserPlus,
  FiAward,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";
import { LuIndianRupee } from "react-icons/lu";
import Logo from "../components/Logo";
import PageShell from "../components/PageShell";
import AppNavbar from "../components/AppNavbar";
import Reveal from "../components/Reveal";
import ThemeImage from "../components/ThemeImage";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { courseImageUrl, resolveMediaUrl } from "../utils/mediaUrl";

const features = [
  { title: "User Authentication & Roles", desc: "Secure multi-role access control.", icon: <FiShield aria-hidden="true" /> },
  { title: "Live Classes & Webinars", desc: "Real-time interactive sessions.", icon: <FiVideo aria-hidden="true" /> },
  { title: "Assignment Submission", desc: "Digital homework & grading.", icon: <FiBookOpen aria-hidden="true" /> },
  { title: "Progress Tracking", desc: "Visual dashboards & analytics.", icon: <FiBarChart2 aria-hidden="true" /> },
  { title: "AI Recommendations", desc: "Personalized course suggestions.", icon: <FiCpu aria-hidden="true" /> },
  { title: "Affordable prices", desc: "Lowest and secure subscription.", icon: <LuIndianRupee aria-hidden="true" /> },
];

const pricingPlans = [
  {
    name: "Free",
    price: "₹ 0",
    period: "/ month",
    features: [
      "Access to 50+ free courses",
      "Basic progress tracking",
      "Community forums",
      "Mobile app access",
      "Email support",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro Learning",
    price: "₹ 2999",
    period: "/ month",
    features: [
      "Access to all 500+ courses",
      "Advanced analytics dashboard",
      "Download courses offline",
      "Live classes & webinars",
      "Priority support",
      "Certificates of completion",
      "AI-powered recommendations",
      "No ads",
    ],
    cta: "Start free trial →",
    highlight: true,
  },
  {
    name: "Enterprise LMS",
    price: "₹ 8999",
    period: "/ month",
    features: [
      "Admin dashboard",
      "Team management (up to 50 users)",
      "API access",
      "Dedicated account manager",
      "Unlimited storage",
      "Custom integrations",
      "Advanced reporting",
    ],
    cta: "Get Started",
    highlight: false,
  },
];

const testimonials = [
  {
    quote: "LISHA Academy transformed how our team learns. The AI recommendations are spot-on!",
    name: "Jessica Williams",
    role: "Product Manager at Microsoft",
    avatar: "/images/avatar-testimonial.png",
  },
  {
    quote: "Best investment for my career. Completed 5 certifications in 3 months.",
    name: "David Chen",
    role: "Cloud Architect at IBM",
    avatar: "/images/avatar-testimonial.png",
  },
  {
    quote: "The live classes feel like being in a real classroom. Highly recommend!",
    name: "Sarah Johnson",
    role: "UX Designer at Apple",
    avatar: "/images/avatar-testimonial.png",
  },
];

const partners = [
  { name: "Google", logo: "/images/partners/google.png" },
  { name: "Microsoft", logo: "/images/partners/microsoft.png" },
  { name: "AWS", logo: "/images/partners/aws.png" },
  { name: "Salesforce", logo: "/images/partners/salesforce.png" },
  { name: "Adobe", logo: "/images/partners/adobe.png" },
  { name: "Infosys", logo: "/images/partners/infosys.png" },
  { name: "J.P. Morgan", logo: "/images/partners/jpmorgan.png" },
  { name: "TCS", logo: "/images/partners/tcs.png" },
];

const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const { user } = useAuth();
  const location = useLocation();
  const isLoggedIn = Boolean(user);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data } = await api.get("/courses", { params: { limit: 6, page: 1 } });
        setCourses((data.courses || []).slice(0, 6));
      } catch {
        setCourses([]);
      }
    };
    loadCourses();
    if (user?.role === "student") {
      api.get("/enrollments/recent").then(({ data }) => setRecentActivity(data.activity || [])).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (location.hash) {
      const timer = setTimeout(() => {
        const el = document.querySelector(location.hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location, courses, recentActivity]);

  return (
    <PageShell className="page-shell--home">
      <div className="home">
      <AppNavbar active="/home" />

      <Reveal>
      <section className="hero">
        <div className="hero__content">
          <h1>Learn Without Limits</h1>
          <p>Join thousands of learners around the world and build the skills you need to succeed.</p>
          {isLoggedIn ? (
            <a href="#courses" className="btn btn--primary btn--lg">Get Started →</a>
          ) : (
            <div className="hero__cta-row">
              <Link to="/signup" className="btn btn--primary btn--lg">Sign Up Free →</Link>
              <Link to="/login" className="btn btn--outline btn--lg">Log In</Link>
            </div>
          )}
          <div className="hero__stats">
            <div><strong>10K+</strong><span>Students</span></div>
            <div><strong>500+</strong><span>Courses</span></div>
            <div><strong>300+</strong><span>Instructors</span></div>
          </div>
        </div>
        <div className="hero__visual">
          <ThemeImage name="hero" lightSrc="/images/home-hero.png" alt="Live class session" className="hero__image" />
        </div>
      </section>
      </Reveal>

      <section className="partners">
        <h2 className="partners__title">Trusted by learners worldwide</h2>
        <div className="partners__logos">
          {partners.map((partner) => (
            <div key={partner.name} className="partners__logo" title={partner.name}>
              <img src={partner.logo} alt={`${partner.name} logo`} />
            </div>
          ))}
        </div>
      </section>

      {isLoggedIn && user?.role === "student" && recentActivity.length > 0 && (
        <section className="section recent-activity-section">
          <h2 className="section__title">Continue where you left off</h2>
          <div className="recent-activity-grid">
            {recentActivity.map((item) => (
              <Link key={item.id} to={`/student/learn/${item.course?.id}`} className="recent-activity-card">
                <img src={courseImageUrl(item.course?.image)} alt="" />
                <div>
                  <h3>{item.course?.title}</h3>
                  <p>{item.progress}% complete · {item.course?.instructorName}</p>
                  <div className="progress-bar"><div style={{ width: `${item.progress}%` }} /></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Reveal delay={80}>
      <section id="about" className="section features-section features-section--green">
        <h2 className="section__title">Powerful Features</h2>
        <p className="section__sub">Everything you need for a complete learning experience</p>
        <div className="features-grid">
          {features.map((f) => (
            <article key={f.title} className="feature-card">
              <span className="feature-card__icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>
      </Reveal>

      <Reveal delay={120}>
      <section id="courses" className="section courses-section">
        <h2 className="section__title">Explore Courses</h2>
        <p className="section__sub">Discover courses tailored to your learning goals</p>
        <div className="courses-grid">
          {courses.map((course) => (
            <article key={course.id} className="course-card">
              <div className="course-card__image">
                <img src={courseImageUrl(course.image)} alt={course.title} />
              </div>
              <div className="course-card__body">
                <h3>{course.title}</h3>
                <div className="course-card__mentor">
                  <img
                    src={resolveMediaUrl(course.instructorAvatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.mentor || "I")}&background=2e7d32&color=fff&size=64`}
                    alt={course.mentor}
                    className="course-card__avatar-img"
                  />
                  <span>{course.mentor}</span>
                  {course.rating > 0 && <span className="course-card__rating">★ {course.rating}</span>}
                </div>
                <div className="course-card__meta">
                  <span>{course.lessons} lessons</span>
                  <span className="course-card__level">{course.level}</span>
                </div>
                {isLoggedIn && user?.role === "student" ? (
                  <Link to={`/student/courses/${course.id}`} className="btn btn--primary btn--full">Enroll Now</Link>
                ) : isLoggedIn ? (
                  <span className="btn btn--outline btn--full disabled" style={{ cursor: "not-allowed", textAlign: "center" }}>Log in as student to enroll</span>
                ) : (
                  <Link to="/login" className="btn btn--primary btn--full">Log in to enroll</Link>
                )}
              </div>
            </article>
          ))}
        </div>
        <div className="courses-section__cta">
          {isLoggedIn ? (
            <Link to="/courses" className="btn btn--primary btn--lg">View all courses →</Link>
          ) : (
            <Link to="/login" className="btn btn--primary btn--lg">Log in to view all courses →</Link>
          )}
        </div>
      </section>
      </Reveal>

      <Reveal delay={160}>
      <section id="pricing" className="section pricing-section">
        <h2 className="section__title">Simple, Transparent Pricing</h2>
        <p className="section__sub">Choose the plan that fits your learning journey</p>
        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <article key={plan.name} className={`pricing-card${plan.highlight ? " pricing-card--highlight" : ""}`}>
              <h3>{plan.name}</h3>
              <div className="pricing-card__price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </div>
              <button type="button" className="btn btn--primary btn--full">{plan.cta}</button>
              <ul>
                {plan.features.map((item) => (
                  <li key={item}><span className="check-icon">✓</span> {item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      </Reveal>

      <Reveal delay={200}>
      <section className="section testimonials-section">
        <h2 className="section__title">Success Stories</h2>
        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <article key={t.name} className="testimonial-card">
              <div className="testimonial-card__stars">★★★★★</div>
              <p>&ldquo;{t.quote}&rdquo;</p>
              <footer className="testimonial-card__footer">
                <img src={t.avatar} alt={t.name} className="testimonial-card__avatar-img" />
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </section>
      </Reveal>

      <Reveal delay={240}>
      <section className="how-it-works">
        <div className="how-it-works__visual">
          <ThemeImage name="howItWorks" lightSrc="/images/how-it-works.png" alt="Students learning" className="how-it-works__img" />
        </div>
        <div className="how-it-works__steps">
          {[
            { step: 1, icon: <FiUserPlus aria-hidden="true" />, title: "Sign Up", desc: "Create your account in just few minutes!" },
            { step: 2, icon: <FiBookOpen aria-hidden="true" />, title: "Enroll in courses", desc: "Choose from our wide range of courses" },
            { step: 3, icon: <FiAward aria-hidden="true" />, title: "Learn & Earn", desc: "Learn at your own pace & earn certificates" },
          ].map((item) => (
            <div key={item.step} className="how-step">
              <div className="how-step__icon-wrap">
                <span className="how-step__num">{item.step}</span>
                <span className="how-step__icon">{item.icon}</span>
              </div>
              <div>
                <strong>{item.title}</strong>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      <footer id="contact" className="site-footer">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Logo />
            <p>Empowering learners worldwide with smart, accessible online education.</p>
            <ul className="site-footer__contact">
              <li><FiMail size={14} aria-hidden="true" /> support@lishaacademy.com</li>
              <li><FiPhone size={14} aria-hidden="true" /> +91 9043933854</li>
              <li><FiMapPin size={14} aria-hidden="true" /> Chennai, Tamil Nadu, India</li>
            </ul>
          </div>
          <div>
            <h4>Platform</h4>
            <ul>
              <li><a href={isLoggedIn ? "#courses" : "/signup"}>Browse Courses</a></li>
              <li><a href={isLoggedIn ? "#courses" : "/signup"}>Become Instructor</a></li>
              <li><a href={isLoggedIn ? "#pricing" : "/signup"}>Enterprise</a></li>
              <li><a href="#contact">Success Stories</a></li>
              <li><a href={isLoggedIn ? "#pricing" : "/signup"}>Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4>Resources</h4>
            <ul>
              <li><a href="#contact">Help Centre</a></li>
              <li><a href="#contact">Blog</a></li>
              <li><a href="#contact">Community</a></li>
              <li><a href="#contact">Webinars</a></li>
              <li><a href="#contact">Communication</a></li>
            </ul>
          </div>
          <div className="site-footer__cta">
            <h4>Start Learning Today</h4>
            <Link to="/signup" className="btn btn--primary">Join Now →</Link>
            <div className="site-footer__social">
              <a href="#contact" aria-label="Instagram">IG</a>
              <a href="#contact" aria-label="Twitter">X</a>
              <a href="#contact" aria-label="LinkedIn">in</a>
              <a href="#contact" aria-label="YouTube">YT</a>
              <a href="#contact" aria-label="WhatsApp">WA</a>
            </div>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© 2026 LISHA Academy. All rights reserved.</span>
          <div>
            <a href="#contact">Privacy Policy</a>
            <a href="#contact">Terms of Service</a>
            <a href="#contact">Cookie Settings</a>
          </div>
        </div>
        {user && (
          <p className="site-footer__user">
            Logged in as {user.fullName} ({user.role})
          </p>
        )}
      </footer>
      </div>
    </PageShell>
  );
};

export default HomePage;
