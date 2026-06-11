const Logo = ({ size = "md" }) => (
  <div className={`brand-logo brand-logo--${size}`}>
    <img src="/images/logo.png" alt="LISHA Academy logo" className="brand-logo__img" />
    <div className="brand-logo__text">
      <strong className="brand-logo__name">
        <span className="brand-logo__part">LI</span>
        <span className="brand-logo__part brand-logo__part--accent">SHA</span>
        <span className="brand-logo__part"> ACADEMY</span>
      </strong>
      <span className="brand-logo__tagline">e-learning platform</span>
    </div>
  </div>
);

export default Logo;
