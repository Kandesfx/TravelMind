import React from 'react';

export default function GlassCard({ children, className = '', style = {}, hover = true }) {
  const baseStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '16px',
    boxShadow: 'var(--card-shadow)',
    padding: '1.5rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...style
  };

  const handleMouseEnter = (e) => {
    if (hover) {
      e.currentTarget.style.borderColor = 'var(--card-border-hover)';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
    }
  };

  const handleMouseLeave = (e) => {
    if (hover) {
      e.currentTarget.style.borderColor = 'var(--card-border)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--card-shadow)';
    }
  };

  return (
    <div
      style={baseStyle}
      className={`glass-panel ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
