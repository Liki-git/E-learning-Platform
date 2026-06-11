import Logo from "./Logo";

const testimonials = [
  {
    quote: "AI-powered insights and personalized learning paths have helped me improve faster than ever before!",
    author: "Akash S",
    year: "2025",
  },
  {
    quote: "The personalized AI feedback felt like having a private tutor 24/7. My grades have never been better!",
    author: "Sarah M",
    year: "2026",
  },
  {
    quote: "Traditional classes felt too fast, but the AI-customized pace let me actually master the concepts.",
    author: "Priya R",
    year: "2025",
  },
];

import ThemeImage from "./ThemeImage";

const ForgotPasswordSide = ({ index = 0 }) => {
  const testimonial = testimonials[index] || testimonials[0];

  return (
    <aside className="forgot-side">
      <Logo size="lg" />
      <div className="forgot-side__illustration">
        <ThemeImage name="forgot" lightSrc="/images/forgot-student.png" alt="Students learning online" />
      </div>
      
      <blockquote className="forgot-side__quote">
        <img src="/images/avatar-testimonial.png" alt="" className="forgot-side__avatar" />
        
        {/* ADDED: This wrapper container element group */}
        <div className="forgot-side__quote-content">
          <p>&ldquo;{testimonial.quote}&rdquo;</p>
          <footer>
            - {testimonial.author}
            <span> Student of LISHA Academy - {testimonial.year}</span>
          </footer>
        </div>
      </blockquote>
    </aside>
  );
};

export default ForgotPasswordSide;