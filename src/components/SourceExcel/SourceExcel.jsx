import React, { useState, useMemo, useRef } from 'react';
import './SourceExcel.css';

const DEFAULT_ASSET_PATH = '/PANB_Permits_Licenses_Monitoring_2026_v3.xlsx';
const SP_STORAGE_KEY = 'panb_developer_sharepoint_url';
const SP_AUTO_SYNC_KEY = 'panb_developer_sp_autosync';

export default function SourceExcel({
  fileName = 'PANB Permits & Licenses Monitoring 2026 v3.xlsx',
  fileSize = '1.95 MB',
  sourceType = 'default',
  targetSheets = [],
  plantRegions = {},
  parsedDataCache = {},
  isLoading = false,
  onReloadDefault,
  onProcessFile,
  onFetchSharePoint,
  onNavigateHome,
  onLaunchPermits,
  currentTheme = 'midnight'
}) {
  const [activeTab, setActiveTab] = useState('excel'); // 'excel' | 'sharepoint' | 'inspector'
  const [sharePointInput, setSharePointInput] = useState(() => {
    try {
      return localStorage.getItem(SP_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [autoSyncOnLaunch, setAutoSyncOnLaunch] = useState(() => {
    try {
      return localStorage.getItem(SP_AUTO_SYNC_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [selectedInspectSheet, setSelectedInspectSheet] = useState(targetSheets[0] || '');
  const [actionNotice, setActionNotice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Compute total compliance records across all parsed sheets
  const totalRecordsCount = useMemo(() => {
    return Object.values(parsedDataCache).reduce((sum, sheetData) => {
      if (Array.isArray(sheetData)) return sum + sheetData.length;
      if (sheetData && Array.isArray(sheetData.rows)) return sum + sheetData.rows.length;
      if (sheetData && Array.isArray(sheetData.records)) return sum + sheetData.records.length;
      return sum;
    }, 0);
  }, [parsedDataCache]);

  const showNotice = (text, type = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // 1. Reload default master Excel file
  const handleReloadMaster = async () => {
    if (onReloadDefault) {
      setIsProcessing(true);
      try {
        await onReloadDefault();
        showNotice('Default master Excel bundle reloaded successfully.', 'success');
      } catch (err) {
        showNotice(`Failed to reload default master: ${err.message}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // 2. Handle local file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onProcessFile) {
      onProcessFile(file);
      showNotice(`Uploaded and processed working file: "${file.name}".`, 'success');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onProcessFile) {
      onProcessFile(file);
      showNotice(`Dropped and processed working file: "${file.name}".`, 'success');
    }
  };

  // 3. Handle SharePoint live sync
  const handleConnectSharePoint = async () => {
    const trimmedUrl = sharePointInput.trim();
    if (!trimmedUrl) {
      showNotice('Please enter a valid SharePoint or OneDrive direct URL.', 'error');
      return;
    }

    try {
      localStorage.setItem(SP_STORAGE_KEY, trimmedUrl);
    } catch {
      // ignore
    }

    if (onFetchSharePoint) {
      setIsProcessing(true);
      try {
        await onFetchSharePoint(trimmedUrl);
        showNotice('Successfully connected to SharePoint & streamed master workbook.', 'success');
      } catch (err) {
        showNotice(`SharePoint connection failed: ${err.message}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleToggleAutoSync = (e) => {
    const checked = e.target.checked;
    setAutoSyncOnLaunch(checked);
    try {
      localStorage.setItem(SP_AUTO_SYNC_KEY, checked ? 'true' : 'false');
    } catch {
      // ignore
    }
    showNotice(
      checked
        ? 'SharePoint auto-sync on launch enabled.'
        : 'SharePoint auto-sync on launch disabled.',
      'info'
    );
  };

  // 4. Export parsed cache as JSON
  const handleExportJson = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        sourceFile: fileName,
        sourceType,
        targetSheets,
        plantRegions,
        totalRecords: totalRecordsCount,
        data: parsedDataCache
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PANB_Parsed_Dataset_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotice('Parsed dataset exported successfully as JSON.', 'success');
    } catch (err) {
      showNotice(`Failed to export JSON: ${err.message}`, 'error');
    }
  };

  // 5. Console log diagnostic dump
  const handleConsoleDump = () => {
    console.group('🛠️ PANB Developer SourceExcel Diagnostics');
    console.log('Active File:', fileName, '| Size:', fileSize, '| Source:', sourceType);
    console.log('Detected Plant Sheets:', targetSheets);
    console.log('Plant Regions Map:', plantRegions);
    console.log('Total Compliance Records:', totalRecordsCount);
    console.log('Raw Parsed Cache Object:', parsedDataCache);
    console.groupEnd();
    showNotice('Diagnostic dataset dumped to browser Developer Tools (F12 Console).', 'info');
  };

  // Get records for the currently selected sheet in inspector
  const currentInspectSheetName = selectedInspectSheet || targetSheets[0] || '';
  const currentInspectRecords = useMemo(() => {
    if (!currentInspectSheetName || !parsedDataCache[currentInspectSheetName]) return [];
    const data = parsedDataCache[currentInspectSheetName];
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.rows)) return data.rows;
    if (data && Array.isArray(data.records)) return data.records;
    return [];
  }, [currentInspectSheetName, parsedDataCache]);

  return (
    <div className="source-excel-page-container" data-theme={currentTheme}>
      {/* Developer Environment Alert Banner */}
      <div className="dev-header-banner">
        <div className="dev-banner-left">
          <div className="dev-badge-pulse">
            <span className="dev-pulse-dot"></span>
            <span>DEVELOPER CONSOLE</span>
          </div>
          <div>
            <h2 className="dev-page-title">SourceExcel Data Pipeline Management</h2>
            <p className="dev-page-subtitle">
              Internal developer console to manage default master Excel files, live SharePoint synchronization, and data parsing structures.
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

      {/* Live Active Dataset Metrics Bar */}
      <div className="dev-metrics-bar">
        <div className="dev-metric-item">
          <span className="dev-metric-label">Active Master File</span>
          <span className="dev-metric-val code-text" title={fileName}>{fileName}</span>
        </div>
        <div className="dev-metric-item">
          <span className="dev-metric-label">Data Origin</span>
          <span className={`dev-origin-pill ${sourceType}`}>
            {sourceType === 'default' && '📦 Default Master Asset'}
            {sourceType === 'sharepoint' && '☁️ SharePoint Live Stream'}
            {sourceType === 'local' && '💻 Local Custom Upload'}
          </span>
        </div>
        <div className="dev-metric-item">
          <span className="dev-metric-label">Payload Size</span>
          <span className="dev-metric-val">{fileSize || 'Unknown'}</span>
        </div>
        <div className="dev-metric-item">
          <span className="dev-metric-label">Target Plant Sheets</span>
          <span className="dev-metric-val highlight">{targetSheets.length} Operating Facilities</span>
        </div>
        <div className="dev-metric-item">
          <span className="dev-metric-label">Compliance Records</span>
          <span className="dev-metric-val highlight">{totalRecordsCount.toLocaleString()} Rows</span>
        </div>
        <div className="dev-metric-item">
          <span className="dev-metric-label">Pipeline Status</span>
          <span className="dev-metric-val status-ready">
            {isLoading || isProcessing ? '🔄 Streaming...' : '● Ready in Cache'}
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="dev-tab-nav" role="tablist">
        <button
          type="button"
          className={`dev-tab-btn ${activeTab === 'excel' ? 'active' : ''}`}
          onClick={() => setActiveTab('excel')}
          role="tab"
          aria-selected={activeTab === 'excel'}
        >
          <span>📊 Default Master Excel File</span>
        </button>
        <button
          type="button"
          className={`dev-tab-btn ${activeTab === 'sharepoint' ? 'active' : ''}`}
          onClick={() => setActiveTab('sharepoint')}
          role="tab"
          aria-selected={activeTab === 'sharepoint'}
        >
          <span>☁️ SharePoint &amp; OneDrive Live</span>
        </button>
        <button
          type="button"
          className={`dev-tab-btn ${activeTab === 'inspector' ? 'active' : ''}`}
          onClick={() => setActiveTab('inspector')}
          role="tab"
          aria-selected={activeTab === 'inspector'}
        >
          <span>🔍 Data Inspector &amp; Diagnostics</span>
        </button>
      </div>

      {/* TAB 1: Default Master Excel File Management */}
      {activeTab === 'excel' && (
        <div className="dev-tab-content">
          <div className="dev-cards-grid">
            {/* Card 1: Bundled Production Master Asset */}
            <div className="dev-card">
              <div className="dev-card-header">
                <div className="dev-card-icon-box cyan">📁</div>
                <div>
                  <h3 className="dev-card-title">Bundled Production Master Asset</h3>
                  <span className="dev-card-sub">Pre-packaged static workbook loaded on application startup</span>
                </div>
              </div>

              <div className="dev-card-body">
                <div className="dev-info-box">
                  <div className="dev-info-row">
                    <span className="info-title">Public Asset Path:</span>
                    <code className="info-code">{DEFAULT_ASSET_PATH}</code>
                  </div>
                  <div className="dev-info-row">
                    <span className="info-title">Required Sheet Prefixes:</span>
                    <span className="tag-group">
                      <span className="dev-tag">BMP</span>
                      <span className="dev-tag">MPH</span>
                      <span className="dev-tag">MPPP</span>
                      <span className="dev-tag">MPF</span>
                    </span>
                  </div>
                  <div className="dev-info-row">
                    <span className="info-title">Regional Lookup Sheet:</span>
                    <code className="info-code">SUMMARY-Permits</code>
                  </div>
                </div>

                <p className="dev-card-desc">
                  When deployed to production, this workbook serves as the baseline single source of truth for all 23 operating facilities.
                </p>
              </div>

              <div className="dev-card-footer">
                <button
                  type="button"
                  className="btn-card-action primary"
                  onClick={handleReloadMaster}
                  disabled={isLoading || isProcessing}
                >
                  {isLoading || isProcessing ? 'Loading...' : '🔄 Reload Default Master Asset'}
                </button>
                <a
                  href={DEFAULT_ASSET_PATH}
                  download="PANB_Master_Permits_Monitoring_Template.xlsx"
                  className="btn-card-action secondary"
                >
                  ⬇️ Download Master Asset Template
                </a>
              </div>
            </div>

            {/* Card 2: Upload Alternative Working Master File */}
            <div className="dev-card">
              <div className="dev-card-header">
                <div className="dev-card-icon-box emerald">📤</div>
                <div>
                  <h3 className="dev-card-title">Upload Working Master File</h3>
                  <span className="dev-card-sub">Test newly structured datasets or revised plant worksheets</span>
                </div>
              </div>

              <div className="dev-card-body">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .xlsm"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <div
                  className={`dev-dropzone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dropzone-icon">📑</div>
                  <div className="dropzone-text">
                    <strong>Click to browse</strong> or drag &amp; drop workbook here
                  </div>
                  <div className="dropzone-sub">
                    Accepts <code>.xlsx</code> or <code>.xls</code> monitoring workbooks
                  </div>
                </div>

                <div className="dev-validation-callout">
                  <span className="callout-icon">💡</span>
                  <span>
                    The developer parser will automatically validate facility prefixes (BMP, MPH, MPPP, MPF) and extract region assignments on upload.
                  </span>
                </div>
              </div>

              <div className="dev-card-footer">
                <button
                  type="button"
                  className="btn-card-action secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Excel File from Disk...
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SharePoint & OneDrive Live Integration */}
      {activeTab === 'sharepoint' && (
        <div className="dev-tab-content">
          <div className="dev-cards-grid">
            {/* Card 1: SharePoint Live URL Connection */}
            <div className="dev-card span-2">
              <div className="dev-card-header">
                <div className="dev-card-icon-box blue">☁️</div>
                <div>
                  <h3 className="dev-card-title">SharePoint / OneDrive Live Repository Link</h3>
                  <span className="dev-card-sub">Stream live compliance updates directly from enterprise cloud storage</span>
                </div>
              </div>

              <div className="dev-card-body">
                <div className="sp-input-container">
                  <label htmlFor="dev-sp-url" className="sp-input-label">
                    Direct SharePoint / OneDrive Web URL
                  </label>
                  <div className="sp-input-row">
                    <input
                      id="dev-sp-url"
                      type="url"
                      className="dev-text-input"
                      value={sharePointInput}
                      onChange={(e) => setSharePointInput(e.target.value)}
                      placeholder="https://company.sharepoint.com/:x:/r/sites/Operations/.../2026_Monitoring.xlsx?download=1"
                    />
                    <button
                      type="button"
                      className="btn-card-action primary"
                      onClick={handleConnectSharePoint}
                      disabled={isLoading || isProcessing}
                    >
                      {isLoading || isProcessing ? 'Streaming...' : '⚡ Test & Sync SharePoint'}
                    </button>
                  </div>
                  <span className="sp-input-help">
                    Enter the direct sharing URL with read permissions or <code>?download=1</code> query parameter for continuous binary streaming.
                  </span>
                </div>

                <div className="sp-options-row">
                  <label className="sp-checkbox-label">
                    <input
                      type="checkbox"
                      checked={autoSyncOnLaunch}
                      onChange={handleToggleAutoSync}
                    />
                    <span>Automatically fetch from this SharePoint repository upon application launch</span>
                  </label>
                </div>

                <div className="sp-guide-box">
                  <h4>💡 Developer SharePoint Integration Guide</h4>
                  <ul>
                    <li>
                      <strong>Direct Download Parameter:</strong> Append <code>?download=1</code> to standard OneDrive / SharePoint sharing links to ensure the raw binary stream is returned rather than the SharePoint Web Office UI.
                    </li>
                    <li>
                      <strong>CORS Configuration:</strong> Ensure your SharePoint tenant permits cross-origin requests from this host or use an enterprise reverse proxy in production.
                    </li>
                    <li>
                      <strong>Automatic Cache Fallback:</strong> If network streaming fails or times out, the portal automatically falls back safely to the bundled master Excel workbook.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Data Inspector & Diagnostics Vault */}
      {activeTab === 'inspector' && (
        <div className="dev-tab-content">
          <div className="dev-inspector-layout">
            {/* Inspector Left Column: Plant Facilities & Regions */}
            <div className="dev-inspector-sidebar">
              <div className="inspector-panel-header">
                <h4>Detected Facilities ({targetSheets.length})</h4>
                <span className="inspector-panel-sub">Select facility to inspect raw records</span>
              </div>

              <div className="facility-picker-list">
                {targetSheets.map((sheetName) => {
                  const count = (parsedDataCache[sheetName] || []).length;
                  const region = plantRegions[sheetName] || 'Unassigned';
                  const isSelected = sheetName === currentInspectSheetName;

                  return (
                    <button
                      key={sheetName}
                      type="button"
                      className={`facility-pick-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedInspectSheet(sheetName)}
                    >
                      <div className="facility-pick-top">
                        <span className="facility-sheet-name">{sheetName}</span>
                        <span className="facility-record-pill">{count} rows</span>
                      </div>
                      <span className="facility-region-sub">{region}</span>
                    </button>
                  );
                })}
              </div>

              <div className="inspector-sidebar-actions">
                <button
                  type="button"
                  className="btn-card-action secondary small"
                  onClick={handleExportJson}
                >
                  💾 Export Cache as JSON
                </button>
                <button
                  type="button"
                  className="btn-card-action secondary small"
                  onClick={handleConsoleDump}
                >
                  🖥️ Dump to DevTools Console
                </button>
              </div>
            </div>

            {/* Inspector Right Column: Raw Worksheet Data Table Preview */}
            <div className="dev-inspector-main">
              <div className="inspector-preview-header">
                <div>
                  <h4 className="preview-sheet-title">
                    Worksheet Preview: <code>{currentInspectSheetName || 'No sheet selected'}</code>
                  </h4>
                  <span className="preview-sheet-meta">
                    Region: <strong>{plantRegions[currentInspectSheetName] || 'N/A'}</strong> &bull; Total Parsed Records: <strong>{currentInspectRecords.length}</strong>
                  </span>
                </div>

                <div className="preview-header-tags">
                  <span className="dev-tag cyan">Live Cache</span>
                </div>
              </div>

              {currentInspectRecords.length === 0 ? (
                <div className="inspector-empty-state">
                  <p>No parsed records available for this worksheet.</p>
                </div>
              ) : (
                <div className="inspector-table-container">
                  <table className="inspector-data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Category / Type</th>
                        <th>Particulars / Description</th>
                        <th>Permit / Clearance No.</th>
                        <th>Issuance Date</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInspectRecords.slice(0, 25).map((row, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td><span className="cell-cat">{row.type || row.category || 'General'}</span></td>
                          <td className="cell-particulars">{row.particulars || row.title || '—'}</td>
                          <td><code>{row.permitNo || row.id || '—'}</code></td>
                          <td>{row.dateIssued || row.issuanceDate || '—'}</td>
                          <td className="cell-expiry">{row.dateExpired || row.expiryDate || '—'}</td>
                          <td>
                            <span className={`cell-status-pill ${(row.status || '').toLowerCase().includes('expired') ? 'expired' : 'valid'}`}>
                              {row.status || 'Active'}
                            </span>
                          </td>
                          <td className="cell-remarks">{row.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {currentInspectRecords.length > 25 && (
                    <div className="inspector-table-more">
                      Showing first 25 records of {currentInspectRecords.length}. Full dataset loaded in memory.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
