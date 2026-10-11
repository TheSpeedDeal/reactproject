import React, { useState } from 'react';
import './SourceExcel.css';

export default function SourceExcel({
  modules = [],
  moduleDatasets = {},
  onSwitchModuleFile,
  onUploadModuleFile,
  onReloadDefault,
  onNavigateHome,
  onLaunchPermits,
  currentTheme = 'midnight'
}) {
  const [actionNotice, setActionNotice] = useState(null);

  const showNotice = (text, type = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleFileUpload = (moduleId, e) => {
    const file = e.target.files?.[0];
    if (file && onUploadModuleFile) {
      onUploadModuleFile(moduleId, file);
      showNotice(`Uploaded "${file.name}" for ${moduleId}.`, 'success');
    }
    e.target.value = '';
  };

  const handleSwitch = (moduleId, fileId, fileName) => {
    if (onSwitchModuleFile) {
      onSwitchModuleFile(moduleId, fileId);
      showNotice(`Active spreadsheet switched to "${fileName}".`, 'info');
    }
  };

  return (
    <div className="dev-console-container" data-theme={currentTheme}>
      {/* Header Banner */}
      <div className="dev-banner">
        <div className="dev-banner-left">
          <div className="dev-badge">
            <span className="dev-pulse-dot"></span>
            <span>DATA SOURCES</span>
          </div>
          <div>
            <h2 className="dev-page-title">SourceExcel Data Pipeline Management</h2>
            <p className="dev-page-subtitle">
              Manage master Excel workbooks per module. Upload custom sheets, switch between multiple datasets, and monitor active pipeline metrics.
            </p>
          </div>
        </div>

        <div className="dev-banner-actions">
          <button
            type="button"
            className="btn-dev-action secondary"
            onClick={onNavigateHome}
            title="Return to Central Operations Hub"
          >
            ← Central Hub
          </button>
          <button
            type="button"
            className="btn-dev-action primary"
            onClick={onLaunchPermits}
            title="Launch Permits Monitoring System with current dataset"
          >
            Launch Permits System →
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className={`dev-notice-toast ${actionNotice.type}`} role="status">
          <span>
            {actionNotice.type === 'success' && '✅ '}
            {actionNotice.type === 'error' && '⚠️ '}
            {actionNotice.type === 'info' && 'ℹ️ '}
            {actionNotice.text}
          </span>
          <button type="button" onClick={() => setActionNotice(null)}>✕</button>
        </div>
      )}

      {/* Module Master Datasets List */}
      <div className="modules-source-list">
        {modules.map((mod) => {
          const modData = moduleDatasets[mod.id] || {
            activeFileId: 'default',
            files: [
              {
                id: 'default',
                name: `${mod.name} 2026 Master.xlsx`,
                sizeStr: '1.20 MB',
                origin: 'default',
                targetSheets: ['Summary', 'Monitoring'],
                totalRecords: 0,
                status: 'Ready in Cache'
              }
            ]
          };

          const filesList = modData.files || [];
          const activeFile =
            filesList.find((f) => f.id === modData.activeFileId) ||
            filesList[0] || {
              id: 'none',
              name: 'No active workbook',
              sizeStr: '—',
              origin: 'default',
              targetSheets: [],
              totalRecords: 0,
              status: 'Standby'
            };

          const sheetCount = Array.isArray(activeFile.targetSheets)
            ? activeFile.targetSheets.length
            : typeof activeFile.targetSheets === 'number'
            ? activeFile.targetSheets
            : 0;

          const recordCount = typeof activeFile.totalRecords === 'number'
            ? activeFile.totalRecords
            : 0;

          return (
            <div className="module-source-card" key={mod.id}>
              {/* Module Header Bar */}
              <div className="module-source-header">
                <div className="module-title-left">
                  <span className="module-source-icon">{mod.icon}</span>
                  <div>
                    <div className="module-title-row">
                      <h3 className="module-source-name">{mod.name}</h3>
                      <span className={`module-source-status-badge ${mod.badgeClass || (mod.isActive ? 'live' : 'roadmap')}`}>
                        {mod.status}
                      </span>
                    </div>
                    <p className="module-source-desc">{mod.desc}</p>
                  </div>
                </div>

                <div className="module-source-actions">
                  {/* File Switcher Dropdown (visible if multiple files uploaded) */}
                  {filesList.length > 1 && (
                    <div className="module-switcher-dropdown-wrap">
                      <label htmlFor={`switch-select-${mod.id}`} className="switcher-label">
                        Active Excel:
                      </label>
                      <select
                        id={`switch-select-${mod.id}`}
                        className="module-file-select"
                        value={activeFile.id}
                        onChange={(e) => {
                          const chosen = filesList.find((f) => f.id === e.target.value);
                          handleSwitch(mod.id, e.target.value, chosen?.name || 'Selected File');
                        }}
                      >
                        {filesList.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.sizeStr} • {f.totalRecords?.toLocaleString() || 0} rows)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Upload Excel Button */}
                  <label className="btn-module-upload" title={`Upload a new Excel workbook for ${mod.name}`}>
                    <span>📤</span>
                    <span>Upload Excel</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .xlsm"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(mod.id, e)}
                    />
                  </label>

                  {/* Reset to Default Button */}
                  {activeFile.origin !== 'default' && (
                    <button
                      type="button"
                      className="btn-module-reset"
                      onClick={() => {
                        const defaultFile = filesList.find((f) => f.origin === 'default') || filesList[filesList.length - 1];
                        if (defaultFile) {
                          handleSwitch(mod.id, defaultFile.id, defaultFile.name);
                        }
                      }}
                      title="Reset back to default master template"
                    >
                      🔄 Reset Default
                    </button>
                  )}
                </div>
              </div>

              {/* The Horizontal Metrics Bar (Exact Second Image Style) */}
              <div className="dev-metrics-bar module-bar">
                <div className="dev-metric-item">
                  <span className="dev-metric-label">ACTIVE MASTER FILE</span>
                  <span className="dev-metric-val code-text" title={activeFile.name}>
                    {activeFile.name}
                  </span>
                </div>

                <div className="dev-metric-item">
                  <span className="dev-metric-label">DATA ORIGIN</span>
                  <span className={`dev-origin-pill ${activeFile.origin}`}>
                    {activeFile.origin === 'default'
                      ? '📦 Default Master Asset'
                      : '💻 Local Custom Upload'}
                  </span>
                </div>

                <div className="dev-metric-item">
                  <span className="dev-metric-label">PAYLOAD SIZE</span>
                  <span className="dev-metric-val">{activeFile.sizeStr || '—'}</span>
                </div>

                <div className="dev-metric-item">
                  <span className="dev-metric-label">TARGET PLANT SHEETS</span>
                  <span className="dev-metric-val highlight">
                    {sheetCount > 0 ? `${sheetCount} Operating Facilities` : 'Template Ready'}
                  </span>
                </div>

                <div className="dev-metric-item">
                  <span className="dev-metric-label">COMPLIANCE RECORDS</span>
                  <span className="dev-metric-val highlight">
                    {recordCount > 0 ? `${recordCount.toLocaleString()} Rows` : '0 Rows'}
                  </span>
                </div>

                <div className="dev-metric-item">
                  <span className="dev-metric-label">PIPELINE STATUS</span>
                  <span className="dev-metric-val status-ready">
                    ● {activeFile.status || 'Ready in Cache'}
                  </span>
                </div>
              </div>

              {/* Multiple Uploads Switcher Tray */}
              {filesList.length > 1 && (
                <div className="module-uploaded-files-tray">
                  <span className="tray-label">Switch Active Excel ({filesList.length} Available):</span>
                  <div className="tray-chips">
                    {filesList.map((f) => {
                      const isActive = f.id === activeFile.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          className={`file-chip ${isActive ? 'active' : ''}`}
                          onClick={() => handleSwitch(mod.id, f.id, f.name)}
                          title={`Click to activate: ${f.name}`}
                        >
                          <span className="chip-icon">{isActive ? '✓' : '📄'}</span>
                          <span className="chip-name">{f.name}</span>
                          <span className="chip-meta">({f.sizeStr} • {f.totalRecords?.toLocaleString() || 0} rows)</span>
                          {isActive && <span className="chip-active-badge">Active</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
