const PageShell = ({ children, className = "" }) => {
  const isHome = className.includes("page-shell--home");

  return (
    <div className={`page-shell ${className}`.trim()}>
      {isHome && (
        <>
          <div className="edge-decor edge-decor--top-arc" aria-hidden="true" />
          <div className="edge-decor edge-decor--left-pill" aria-hidden="true" />
          <div className="edge-decor edge-decor--right-pill" aria-hidden="true" />
        </>
      )}
      <div className="edge-decor edge-decor--left" aria-hidden="true" />
      <div className="edge-decor edge-decor--right" aria-hidden="true" />
      <div className="page-shell__content">{children}</div>
    </div>
  );
};

export default PageShell;
