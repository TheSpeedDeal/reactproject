import React, { useState, useRef, useEffect } from 'react';
import { THEMES } from '../../utils/themeConfig';
import './ThemeSelector.css';

export default function ThemeSelector({
  currentTheme = 'light',
  onSelectTheme,
  variant = 'main-header'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeThemeObj = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleThemePick = (themeId) => {
    if (onSelectTheme) {
      onSelectTheme(themeId);
    }
    setIsOpen(false);
  };

  const isChrome = variant === 'dashboard-chrome';

  return (
    <div
      className={`theme-selector-wrapper ${isChrome ? 'variant-chrome' : 'variant-header'}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className={`theme-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={`Change visual theme (Currently: ${activeThemeObj.name})`}
        id={isChrome ? 'pbi-theme-selector-btn' : 'main-theme-selector-btn'}
      >
        <span className="theme-trigger-icon" aria-hidden="true">
          {activeThemeObj.icon}
        </span>
        <span className="theme-trigger-label">
          {isChrome ? 'Theme' : activeThemeObj.name}
        </span>
        <span
          className="theme-trigger-swatch"
          style={{ backgroundColor: activeThemeObj.accentColor }}
          aria-hidden="true"
        />
        <span className="theme-trigger-chevron" aria-hidden="true">
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

      {isOpen && (
        <div className="theme-dropdown-panel" role="menu" aria-label="Theme selection menu">
          <div className="theme-dropdown-header">
            <div className="theme-header-title-row">
              <span className="theme-header-icon">🎨</span>
              <span className="theme-header-title">UI Appearance Themes</span>
            </div>
            <p className="theme-header-subtitle">
              Select a visual style for the dashboard &amp; monitoring system
            </p>
          </div>

          <div className="theme-options-grid">
            {THEMES.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleThemePick(theme.id)}
                  role="menuitem"
                  id={`theme-option-${theme.id}`}
                >
                  <div className="theme-card-left">
                    <span className="theme-card-icon">{theme.icon}</span>
                    <div className="theme-card-info">
                      <div className="theme-card-name-row">
                        <span className="theme-card-name">{theme.name}</span>
                        <span className={`theme-badge-category ${theme.category.toLowerCase()}`}>
                          {theme.category}
                        </span>
                      </div>
                      <span className="theme-card-desc">{theme.description}</span>
                    </div>
                  </div>

                  <div className="theme-card-right">
                    {/* Visual Preview Dots */}
                    <div className="theme-swatch-cluster" title={`Accent: ${theme.accentColor}`}>
                      <span
                        className="swatch-dot bg-dot"
                        style={{ backgroundColor: theme.bgPreview }}
                      />
                      <span
                        className="swatch-dot card-dot"
                        style={{ backgroundColor: theme.cardPreview }}
                      />
                      <span
                        className="swatch-dot accent-dot"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                    </div>

                    {isSelected && (
                      <span className="theme-check-badge" aria-label="Selected">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="theme-dropdown-footer">
            <span className="theme-footer-note">
              ⚡ Changes apply instantly &amp; are saved in your browser
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
