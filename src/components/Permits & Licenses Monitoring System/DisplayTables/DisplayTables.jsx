import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  FACILITY_TYPES,
  getFacilityType,
  exportTableToCsv
} from '../../../utils/ExcelParsers/excelParserPermitAndLicense';
import './DisplayTables.css';

export default function DisplayTables({
  parsedDataCache = {},
  targetSheets = [],
  plantRegions = {},
  activeSheetName: parentActiveSheetName,
  setActiveSheetName: parentSetActiveSheetName,
  fileName = 'PANB Monitoring 2026',
  fileSize = '',
  sourceType = 'default',
  initialSearch = '',
  onNavigateHome
}) {
  // Active sheet state
  const [internalActiveSheetName, setInternalActiveSheetName] = useState(() => {
    return parentActiveSheetName || (targetSheets.length > 0 ? targetSheets[0] : '');
  });

  const activeSheetName = parentActiveSheetName || internalActiveSheetName;
  const setActiveSheetName = parentSetActiveSheetName || setInternalActiveSheetName;

  // Plant Navigation & Filter State
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [plantSearchTerm, setPlantSearchTerm] = useState('');

  // View Mode: 'both' | 'permits' | 'reportorial'
  const [viewMode, setViewMode] = useState('both');

  // Table 1 (Permits & Licenses) Controls State
  const [permitsSearch, setPermitsSearch] = useState(initialSearch || '');
  const [permitsStatusFilter, setPermitsStatusFilter] = useState('ALL');
  const [permitsRegulatoryFilter, setPermitsRegulatoryFilter] = useState('ALL');
  const [permitsApplicabilityFilter, setPermitsApplicabilityFilter] = useState('ALL');
  const [permitsSort, setPermitsSort] = useState({ key: 'rowIndex', direction: 'asc' });
  const [permitsPage, setPermitsPage] = useState(1);
  const [permitsRowsPerPage, setPermitsRowsPerPage] = useState(20);

  // Table 2 (Reportorial Requirements) Controls State
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [reportFrequencyFilter, setReportFrequencyFilter] = useState('ALL');
  const [reportRegulatoryFilter, setReportRegulatoryFilter] = useState('ALL');
  const [reportSort, setReportSort] = useState({ key: 'rowIndex', direction: 'asc' });
  const [reportPage, setReportPage] = useState(1);
  const [reportRowsPerPage, setReportRowsPerPage] = useState(20);

  // Sync initialSearch if provided
  useEffect(() => {
    if (initialSearch) {
      setPermitsSearch(initialSearch);
      setPermitsPage(1);
    }
  }, [initialSearch]);

  const resetTableControls = useCallback(() => {
    setPermitsSearch('');
    setPermitsStatusFilter('ALL');
    setPermitsRegulatoryFilter('ALL');
    setPermitsApplicabilityFilter('ALL');
    setPermitsSort({ key: 'rowIndex', direction: 'asc' });
    setPermitsPage(1);

    setReportSearch('');
    setReportStatusFilter('ALL');
    setReportFrequencyFilter('ALL');
    setReportRegulatoryFilter('ALL');
    setReportSort({ key: 'rowIndex', direction: 'asc' });
    setReportPage(1);
  }, []);

  // Filter sheets for selector row
  const filteredPlantSheets = useMemo(() => {
    return targetSheets.filter((sName) => {
      // 1. Facility type filter
      if (facilityTypeFilter !== 'ALL' && !sName.startsWith(facilityTypeFilter)) {
        return false;
      }
      // 2. Region filter
      if (regionFilter !== 'ALL') {
        const r = plantRegions[sName];
        if (r !== regionFilter) return false;
      }
      // 3. Search query
      if (plantSearchTerm.trim()) {
        const q = plantSearchTerm.toLowerCase();
        return sName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [targetSheets, facilityTypeFilter, regionFilter, plantSearchTerm, plantRegions]);

  // Active sheet dataset
  const currentSheetData = useMemo(() => {
    if (!activeSheetName || !parsedDataCache[activeSheetName]) {
      return { permits: [], reportorial: [] };
    }
    return parsedDataCache[activeSheetName];
  }, [activeSheetName, parsedDataCache]);

  const activeFacility = useMemo(() => {
    return getFacilityType(activeSheetName);
  }, [activeSheetName]);

  const activeRegion = useMemo(() => {
    return plantRegions[activeSheetName] || 'North Luzon';
  }, [activeSheetName, plantRegions]);

  // Metrics for active plant
  const metrics = useMemo(() => {
    const permits = currentSheetData.permits || [];
    const reportorial = currentSheetData.reportorial || [];

    const activePermits = permits.filter((p) => p.status === 'Active').length;
    const expiringSoonPermits = permits.filter((p) => p.isExpiringSoon).length;
    const expiredPermits = permits.filter((p) => p.status === 'Expired').length;
    const noPermitCount = permits.filter((p) => p.status === 'No Permit').length;

    const onTimeReports = reportorial.filter((r) => r.status === 'Submitted On-time').length;
    const lateReports = reportorial.filter((r) => r.status === 'Late Submission').length;
    const notSubmittedReports = reportorial.filter((r) => r.status === 'Not Submitted').length;

    const totalPermits = permits.length;
    const totalReports = reportorial.length;

    const complianceRate = totalPermits > 0
      ? Math.round((activePermits / totalPermits) * 100)
      : 95;

    return {
      activePermits,
      expiringSoonPermits,
      expiredPermits,
      noPermitCount,
      onTimeReports,
      lateReports,
      notSubmittedReports,
      totalPermits,
      totalReports,
      complianceRate
    };
  }, [currentSheetData]);

  // Regulatory bodies for dropdowns
  const permitsRegulatoryBodies = useMemo(() => {
    const set = new Set();
    (currentSheetData.permits || []).forEach((p) => {
      if (p.regulatoryBody) set.add(p.regulatoryBody);
    });
    return Array.from(set).sort();
  }, [currentSheetData.permits]);

  const reportRegulatoryBodies = useMemo(() => {
    const set = new Set();
    (currentSheetData.reportorial || []).forEach((r) => {
      if (r.regulatoryBody) set.add(r.regulatoryBody);
    });
    return Array.from(set).sort();
  }, [currentSheetData.reportorial]);

  // Filtered & Sorted Table 1: Permits
  const permitsFilteredRows = useMemo(() => {
    return (currentSheetData.permits || [])
      .filter((row) => {
        if (permitsStatusFilter !== 'ALL') {
          if (permitsStatusFilter === 'Expiring Soon') {
            if (!row.isExpiringSoon) return false;
          } else if (row.status !== permitsStatusFilter) {
            return false;
          }
        }
        if (permitsRegulatoryFilter !== 'ALL' && row.regulatoryBody !== permitsRegulatoryFilter) {
          return false;
        }
        if (permitsApplicabilityFilter !== 'ALL' && row.applicability !== permitsApplicabilityFilter) {
          return false;
        }
        if (permitsSearch.trim()) {
          const q = permitsSearch.toLowerCase();
          const match =
            (row.description && row.description.toLowerCase().includes(q)) ||
            (row.serialNo && row.serialNo.toLowerCase().includes(q)) ||
            (row.remarks && row.remarks.toLowerCase().includes(q)) ||
            (row.regulatoryBody && row.regulatoryBody.toLowerCase().includes(q)) ||
            (row.itemCode && row.itemCode.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[permitsSort.key];
        let valB = b[permitsSort.key];
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';
        if (typeof valA === 'string') {
          return permitsSort.direction === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return permitsSort.direction === 'asc' ? valA - valB : valB - valA;
      });
  }, [
    currentSheetData.permits,
    permitsStatusFilter,
    permitsRegulatoryFilter,
    permitsApplicabilityFilter,
    permitsSearch,
    permitsSort
  ]);

  const permitsTotalRows = permitsFilteredRows.length;
  const permitsTotalPages = permitsRowsPerPage === 'ALL'
    ? 1
    : Math.max(1, Math.ceil(permitsTotalRows / permitsRowsPerPage));

  const permitsPaginatedRows = useMemo(() => {
    if (permitsRowsPerPage === 'ALL') return permitsFilteredRows;
    const start = (permitsPage - 1) * permitsRowsPerPage;
    return permitsFilteredRows.slice(start, start + permitsRowsPerPage);
  }, [permitsFilteredRows, permitsPage, permitsRowsPerPage]);

  const handlePermitsSort = (key) => {
    if (permitsSort.key === key) {
      setPermitsSort({
        key,
        direction: permitsSort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setPermitsSort({ key, direction: 'asc' });
    }
  };

  // Filtered & Sorted Table 2: Reportorial
  const reportFilteredRows = useMemo(() => {
    return (currentSheetData.reportorial || [])
      .filter((row) => {
        if (reportStatusFilter !== 'ALL' && row.status !== reportStatusFilter) {
          return false;
        }
        if (reportFrequencyFilter !== 'ALL' && row.frequency !== reportFrequencyFilter) {
          return false;
        }
        if (reportRegulatoryFilter !== 'ALL' && row.regulatoryBody !== reportRegulatoryFilter) {
          return false;
        }
        if (reportSearch.trim()) {
          const q = reportSearch.toLowerCase();
          const match =
            (row.description && row.description.toLowerCase().includes(q)) ||
            (row.regulatoryBody && row.regulatoryBody.toLowerCase().includes(q)) ||
            (row.remarks && row.remarks.toLowerCase().includes(q)) ||
            (row.itemCode && row.itemCode.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[reportSort.key];
        let valB = b[reportSort.key];
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';
        if (typeof valA === 'string') {
          return reportSort.direction === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return reportSort.direction === 'asc' ? valA - valB : valB - valA;
      });
  }, [
    currentSheetData.reportorial,
    reportStatusFilter,
    reportFrequencyFilter,
    reportRegulatoryFilter,
    reportSearch,
    reportSort
  ]);

  const reportTotalRows = reportFilteredRows.length;
  const reportTotalPages = reportRowsPerPage === 'ALL'
    ? 1
    : Math.max(1, Math.ceil(reportTotalRows / reportRowsPerPage));

  const reportPaginatedRows = useMemo(() => {
    if (reportRowsPerPage === 'ALL') return reportFilteredRows;
    const start = (reportPage - 1) * reportRowsPerPage;
    return reportFilteredRows.slice(start, start + reportRowsPerPage);
  }, [reportFilteredRows, reportPage, reportRowsPerPage]);

  const handleReportSort = (key) => {
    if (reportSort.key === key) {
      setReportSort({
        key,
        direction: reportSort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setReportSort({ key, direction: 'asc' });
    }
  };

  // CSV Export functions
  const handleExportPermits = () => {
    exportTableToCsv(
      permitsFilteredRows,
      [
        { header: 'Item Code', key: 'itemCode' },
        { header: 'Regulatory Body', key: 'regulatoryBody' },
        { header: 'Description', key: 'description' },
        { header: 'Applicability', key: 'applicability' },
        { header: 'ID / Serial No', key: 'serialNo' },
        { header: 'Date Issued', key: 'dateIssued' },
        { header: 'Expiration Date', key: 'expirationDate' },
        { header: 'Status', key: 'status' },
        { header: 'Days to Expire', key: 'daysToExpire' },
        { header: 'Remarks', key: 'remarks' }
      ],
      `${activeSheetName}_Permits_and_Licenses.csv`
    );
  };

  const handleExportReportorial = () => {
    exportTableToCsv(
      reportFilteredRows,
      [
        { header: 'Item Code', key: 'itemCode' },
        { header: 'Regulatory Body', key: 'regulatoryBody' },
        { header: 'Report Description', key: 'description' },
        { header: 'Frequency', key: 'frequency' },
        { header: 'Applicability', key: 'applicability' },
        { header: 'Date Submitted', key: 'dateSubmitted' },
        { header: 'Deadline', key: 'deadline' },
        { header: 'Status', key: 'status' },
        { header: 'Remarks', key: 'remarks' }
      ],
      `${activeSheetName}_Reportorial_Requirements.csv`
    );
  };

  // Badge render helpers
  const renderStatusBadge = (status, isExpiringSoon) => {
    if (isExpiringSoon) {
      return <span className="status-badge status-expiring-soon">⚠️ Expiring Soon</span>;
    }
    const clean = String(status || '').trim();
    const cls = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return <span className={`status-badge status-${cls}`}>{clean || 'N/A'}</span>;
  };

  const renderDaysToExpire = (daysStr, daysNum, isExpiringSoon) => {
    if (daysNum === null || daysNum === undefined) {
      return <span className="text-muted">—</span>;
    }
    let cls = 'days-normal';
    if (daysNum < 0) cls = 'days-danger';
    else if (isExpiringSoon) cls = 'days-warning';

    return (
      <span className={`days-badge ${cls}`}>
        {daysNum < 0 ? `${daysNum}d (Expired)` : `${daysNum}d`}
      </span>
    );
  };

  const renderFrequencyBadge = (freq) => {
    const f = String(freq || '').trim();
    return <span className="freq-badge">{f || 'Regular'}</span>;
  };

  return (
    <div className="display-tables-wrapper" aria-label="Facility Compliance Tables">
      {/* 1. Plant Selector & Multi-Level Filter Bar */}
      <section className="plant-selector-card">
        <div className="selector-top-row">
          {/* Facility Type Filter Tabs */}
          <div className="filter-pill-group">
            <span className="filter-group-label">Facility Type:</span>
            <button
              type="button"
              className={`filter-pill ${facilityTypeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFacilityTypeFilter('ALL')}
            >
              All ({targetSheets.length})
            </button>
            {Object.values(FACILITY_TYPES).map((fac) => {
              const count = targetSheets.filter((s) => s.startsWith(fac.code)).length;
              if (count === 0) return null;
              return (
                <button
                  type="button"
                  key={fac.code}
                  className={`filter-pill ${facilityTypeFilter === fac.code ? 'active' : ''}`}
                  onClick={() => setFacilityTypeFilter(fac.code)}
                >
                  <span className="pill-icon">{fac.icon}</span>
                  {fac.code} ({count})
                </button>
              );
            })}
          </div>

          {/* Region Filter Dropdown & Search */}
          <div className="selector-right-controls">
            <div className="select-control-box">
              <label htmlFor="regionSelect">Region:</label>
              <select
                id="regionSelect"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="panb-select"
              >
                <option value="ALL">All Regions (4)</option>
                <option value="North Luzon">North Luzon</option>
                <option value="South Luzon">South Luzon</option>
                <option value="Visayas">Visayas</option>
                <option value="Mindanao">Mindanao</option>
              </select>
            </div>

            <div className="plant-search-box">
              <span className="search-symbol">🔍</span>
              <input
                type="text"
                placeholder="Search plant name..."
                value={plantSearchTerm}
                onChange={(e) => setPlantSearchTerm(e.target.value)}
                className="plant-search-input"
              />
              {plantSearchTerm && (
                <button
                  type="button"
                  className="clear-btn-sm"
                  onClick={() => setPlantSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>

            {onNavigateHome && (
              <button
                type="button"
                className="btn-export-csv"
                onClick={onNavigateHome}
                title="Return to Executive Home Dashboard"
              >
                🏠 Executive View
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Plant Sheet Pills */}
        <div className="plant-pills-row">
          <span className="plants-list-label">Operating Plants:</span>
          <div className="plant-pills-scroll">
            {filteredPlantSheets.length === 0 ? (
              <span className="no-plants-match">No plants match selected filters.</span>
            ) : (
              filteredPlantSheets.map((sheetName) => {
                const isCur = activeSheetName === sheetName;
                const fac = getFacilityType(sheetName);
                return (
                  <button
                    type="button"
                    key={sheetName}
                    className={`plant-pill-btn ${isCur ? 'active' : ''}`}
                    onClick={() => {
                      setActiveSheetName(sheetName);
                      resetTableControls();
                    }}
                  >
                    <span className="pill-fac-icon">{fac.icon}</span>
                    <span className="pill-name">{sheetName}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 2. Active Plant Hero Header & KPI Banner */}
      <section className="active-plant-hero">
        <div className="hero-left-info">
          <div className="hero-tags">
            <span
              className="hero-tag-badge facility-tag"
              style={{ borderColor: activeFacility.color }}
            >
              {activeFacility.icon} {activeFacility.label} ({activeFacility.code})
            </span>
            <span className="hero-tag-badge region-tag">
              📍 {activeRegion}
            </span>
            <span className="hero-tag-badge file-source-tag">
              📁 {fileName} {fileSize ? `(${fileSize})` : ''} • {sourceType === 'default' ? 'Default Dataset' : 'Custom Upload'}
            </span>
          </div>
          <h2 className="hero-plant-name">{activeSheetName || 'No Plant Selected'}</h2>
          <p className="hero-plant-desc">
            Displaying 2 Compliance Tables: <strong>Permit and Licenses</strong> ({currentSheetData.permits.length} items) &amp; <strong>Reportorial Requirements</strong> ({currentSheetData.reportorial.length} items)
          </p>
        </div>

        {/* KPI Metric Cards */}
        <div className="hero-kpi-grid">
          <div className="kpi-card kpi-success">
            <div className="kpi-val">{metrics.activePermits}</div>
            <div className="kpi-label">Active Permits</div>
            <div className="kpi-sub">Valid compliance</div>
          </div>

          <div className="kpi-card kpi-warning">
            <div className="kpi-val">{metrics.expiringSoonPermits}</div>
            <div className="kpi-label">Expiring Soon</div>
            <div className="kpi-sub">&le; 60 days left</div>
          </div>

          <div className="kpi-card kpi-danger">
            <div className="kpi-val">{metrics.expiredPermits + metrics.noPermitCount}</div>
            <div className="kpi-label">Expired / Missing</div>
            <div className="kpi-sub">Immediate action</div>
          </div>

          <div className="kpi-card kpi-info">
            <div className="kpi-val">{metrics.onTimeReports}</div>
            <div className="kpi-label">Reports On-Time</div>
            <div className="kpi-sub">Out of {metrics.totalReports}</div>
          </div>

          <div className="kpi-card kpi-accent">
            <div className="kpi-val">{metrics.complianceRate}%</div>
            <div className="kpi-label">Compliance Rate</div>
            <div className="kpi-sub">Facility health</div>
          </div>
        </div>
      </section>

      {/* 3. View Mode Tabs (Both / Table 1 / Table 2) */}
      <div className="view-mode-tabs-bar">
        <div className="tabs-button-group">
          <button
            type="button"
            className={`tab-view-btn ${viewMode === 'both' ? 'active' : ''}`}
            onClick={() => setViewMode('both')}
          >
            📑 Both Tables (Stacked View)
          </button>
          <button
            type="button"
            className={`tab-view-btn ${viewMode === 'permits' ? 'active' : ''}`}
            onClick={() => setViewMode('permits')}
          >
            📜 Table 1: Permit and Licenses ({currentSheetData.permits.length})
          </button>
          <button
            type="button"
            className={`tab-view-btn ${viewMode === 'reportorial' ? 'active' : ''}`}
            onClick={() => setViewMode('reportorial')}
          >
            📋 Table 2: Reportorial Requirements ({currentSheetData.reportorial.length})
          </button>
        </div>

        <div className="jump-links">
          {viewMode === 'both' && (
            <>
              <a href="#table-permits" className="jump-link">↓ Jump to Permits</a>
              <a href="#table-reportorial" className="jump-link">↓ Jump to Reportorial</a>
            </>
          )}
        </div>
      </div>

      {/* 4. TABLE 1: PERMITS AND LICENSES */}
      {(viewMode === 'both' || viewMode === 'permits') && (
        <section id="table-permits" className="compliance-table-section">
          <div className="section-title-bar">
            <div className="title-with-badge">
              <div className="section-num-badge">1</div>
              <div>
                <h3 className="section-title">Permit and Licenses</h3>
                <p className="section-subtitle">
                  Operating clearances, environmental permits, safety certificates, and agency registrations
                </p>
              </div>
            </div>

            <div className="table-quick-actions">
              <button
                type="button"
                className="btn-export-csv"
                onClick={handleExportPermits}
              >
                📥 Export Table (CSV)
              </button>
            </div>
          </div>

          {/* Table 1 Filters & Controls Bar */}
          <div className="table-filters-container">
            <div className="filter-search-field">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search permit description, serial ID, remarks..."
                value={permitsSearch}
                onChange={(e) => {
                  setPermitsSearch(e.target.value);
                  setPermitsPage(1);
                }}
                className="filter-text-input"
              />
              {permitsSearch && (
                <button
                  type="button"
                  className="clear-btn-sm"
                  onClick={() => setPermitsSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filters-dropdowns-row">
              <div className="filter-item">
                <label>Status:</label>
                <select
                  value={permitsStatusFilter}
                  onChange={(e) => {
                    setPermitsStatusFilter(e.target.value);
                    setPermitsPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">⚠️ Expiring Soon (&le; 60d)</option>
                  <option value="Expired">Expired</option>
                  <option value="No Permit">No Permit</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>

              <div className="filter-item">
                <label>Regulatory Body:</label>
                <select
                  value={permitsRegulatoryFilter}
                  onChange={(e) => {
                    setPermitsRegulatoryFilter(e.target.value);
                    setPermitsPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="ALL">All Agencies ({permitsRegulatoryBodies.length})</option>
                  {permitsRegulatoryBodies.map((body) => (
                    <option key={body} value={body}>{body}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label>Applicability:</label>
                <select
                  value={permitsApplicabilityFilter}
                  onChange={(e) => {
                    setPermitsApplicabilityFilter(e.target.value);
                    setPermitsPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="ALL">All Items</option>
                  <option value="Applicable">Applicable Only</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>
              </div>

              <div className="filter-item rows-item">
                <label>Rows:</label>
                <select
                  value={permitsRowsPerPage}
                  onChange={(e) => {
                    setPermitsRowsPerPage(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                    setPermitsPage(1);
                  }}
                  className="filter-select"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value="ALL">All ({permitsTotalRows})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table 1 Data Viewport */}
          <div className="table-viewport-card">
            {permitsPaginatedRows.length === 0 ? (
              <div className="empty-results-box">
                <p>No permits match the current search &amp; filter criteria.</p>
                <button
                  type="button"
                  className="btn-reset-filters"
                  onClick={() => {
                    setPermitsSearch('');
                    setPermitsStatusFilter('ALL');
                    setPermitsRegulatoryFilter('ALL');
                    setPermitsApplicabilityFilter('ALL');
                  }}
                >
                  Reset Permit Filters
                </button>
              </div>
            ) : (
              <div className="table-scroll-wrapper">
                <table className="compliance-table">
                  <thead>
                    <tr>
                      <th className="th-num">#</th>
                      <th
                        className="sortable-th"
                        onClick={() => handlePermitsSort('regulatoryBody')}
                        title="Sort by Regulatory Body"
                      >
                        <div className="th-flex">
                          <span>Regulatory Body</span>
                          <span className="sort-indicator">
                            {permitsSort.key === 'regulatoryBody' ? (permitsSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      <th
                        className="sortable-th"
                        onClick={() => handlePermitsSort('description')}
                        title="Sort by Description"
                      >
                        <div className="th-flex">
                          <span>Permit / License Description</span>
                          <span className="sort-indicator">
                            {permitsSort.key === 'description' ? (permitsSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      <th className="th-app">Applicability</th>
                      <th className="th-id">ID / Serial No.</th>
                      <th className="th-date">Date Issued</th>
                      <th
                        className="sortable-th th-date"
                        onClick={() => handlePermitsSort('expirationDate')}
                        title="Sort by Expiration Date"
                      >
                        <div className="th-flex">
                          <span>Expiration</span>
                          <span className="sort-indicator">
                            {permitsSort.key === 'expirationDate' ? (permitsSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      <th
                        className="sortable-th th-status"
                        onClick={() => handlePermitsSort('status')}
                        title="Sort by Status"
                      >
                        <div className="th-flex">
                          <span>Status</span>
                          <span className="sort-indicator">
                            {permitsSort.key === 'status' ? (permitsSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      <th
                        className="sortable-th th-days"
                        onClick={() => handlePermitsSort('daysToExpire')}
                        title="Sort by Days to Expire"
                      >
                        <div className="th-flex">
                          <span>Days to Expire</span>
                          <span className="sort-indicator">
                            {permitsSort.key === 'daysToExpire' ? (permitsSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      <th className="th-remarks">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permitsPaginatedRows.map((row, idx) => {
                      const displayIndex = permitsRowsPerPage === 'ALL'
                        ? idx + 1
                        : (permitsPage - 1) * permitsRowsPerPage + idx + 1;

                      return (
                        <tr
                          key={row.id}
                          className={`${row.isExpiringSoon ? 'row-expiring-soon' : ''} ${row.status === 'Expired' ? 'row-expired' : ''}`}
                        >
                          <td className="td-num">{displayIndex}</td>
                          <td className="td-agency">
                            <span className="agency-pill">{row.regulatoryBody}</span>
                          </td>
                          <td className="td-desc">
                            <div className="desc-main">{row.description}</div>
                            {row.itemCode && row.itemCode !== row.description && (
                              <div className="desc-subcode">{row.itemCode}</div>
                            )}
                          </td>
                          <td className="td-app">
                            <span className={`app-tag ${row.applicability === 'Applicable' ? 'app-yes' : 'app-no'}`}>
                              {row.applicability}
                            </span>
                          </td>
                          <td className="td-id">
                            {row.serialNo ? (
                              <span className="id-code" title={row.serialNo}>{row.serialNo}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="td-date">{row.dateIssued || <span className="text-muted">—</span>}</td>
                          <td className="td-date font-mono">{row.expirationDate || <span className="text-muted">—</span>}</td>
                          <td className="td-status">{renderStatusBadge(row.status, row.isExpiringSoon)}</td>
                          <td className="td-days">{renderDaysToExpire(row.daysToExpire, row.daysToExpireNum, row.isExpiringSoon)}</td>
                          <td className="td-remarks">
                            {row.remarks ? (
                              <span className="remarks-text">{row.remarks}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table 1 Pagination Controls */}
            {permitsTotalRows > 0 && permitsRowsPerPage !== 'ALL' && (
              <div className="table-pagination">
                <div className="pagination-text">
                  Showing <strong>{(permitsPage - 1) * permitsRowsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(permitsPage * permitsRowsPerPage, permitsTotalRows)}</strong> of{' '}
                  <strong>{permitsTotalRows}</strong> permits
                </div>
                <div className="pagination-buttons">
                  <button
                    type="button"
                    className="btn-page-nav"
                    disabled={permitsPage === 1}
                    onClick={() => setPermitsPage((p) => Math.max(1, p - 1))}
                  >
                    ‹ Prev
                  </button>
                  <span className="page-indicator">
                    Page {permitsPage} of {permitsTotalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-page-nav"
                    disabled={permitsPage === permitsTotalPages}
                    onClick={() => setPermitsPage((p) => Math.min(permitsTotalPages, p + 1))}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. TABLE 2: REPORTORIAL REQUIREMENTS */}
      {(viewMode === 'both' || viewMode === 'reportorial') && (
        <section id="table-reportorial" className="compliance-table-section">
          <div className="section-title-bar">
            <div className="title-with-badge">
              <div className="section-num-badge sec-badge-blue">2</div>
              <div>
                <h3 className="section-title">Reportorial Requirements</h3>
                <p className="section-subtitle">
                  Periodic regulatory submissions (DOLE WAIR/AMR, DENR SMR/CMR, BAI Production, NWRB, DOE)
                </p>
              </div>
            </div>

            <div className="table-quick-actions">
              <button
                type="button"
                className="btn-export-csv"
                onClick={handleExportReportorial}
              >
                📥 Export Table (CSV)
              </button>
            </div>
          </div>

          {/* Table 2 Filters & Controls Bar */}
          <div className="table-filters-container">
            <div className="filter-search-field">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search report description, regulatory body, remarks..."
                value={reportSearch}
                onChange={(e) => {
                  setReportSearch(e.target.value);
                  setReportPage(1);
                }}
                className="filter-text-input"
              />
              {reportSearch && (
                <button
                  type="button"
                  className="clear-btn-sm"
                  onClick={() => setReportSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filters-dropdowns-row">
              <div className="filter-item">
                <label>Status:</label>
                <select
                  value={reportStatusFilter}
                  onChange={(e) => {
                    setReportStatusFilter(e.target.value);
                    setReportPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Submitted On-time">Submitted On-time</option>
                  <option value="Late Submission">Late Submission</option>
                  <option value="Not Submitted">Not Submitted</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>

              <div className="filter-item">
                <label>Frequency:</label>
                <select
                  value={reportFrequencyFilter}
                  onChange={(e) => {
                    setReportFrequencyFilter(e.target.value);
                    setReportPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="ALL">All Frequencies</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Semi-Annually">Semi-Annually</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>

              <div className="filter-item">
                <label>Regulatory Body:</label>
                <select
                  value={reportRegulatoryFilter}
                  onChange={(e) => {
                    setReportRegulatoryFilter(e.target.value);
                    setReportPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="ALL">All Agencies ({reportRegulatoryBodies.length})</option>
                  {reportRegulatoryBodies.map((body) => (
                    <option key={body} value={body}>{body}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item rows-item">
                <label>Rows:</label>
                <select
                  value={reportRowsPerPage}
                  onChange={(e) => {
                    setReportRowsPerPage(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                    setReportPage(1);
                  }}
                  className="filter-select"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value="ALL">All ({reportTotalRows})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table 2 Data Viewport */}
          <div className="table-viewport-card">
            {reportPaginatedRows.length === 0 ? (
              <div className="empty-results-box">
                <p>No reportorial requirements match the current search &amp; filter criteria.</p>
                <button
                  type="button"
                  className="btn-reset-filters"
                  onClick={() => {
                    setReportSearch('');
                    setReportStatusFilter('ALL');
                    setReportFrequencyFilter('ALL');
                    setReportRegulatoryFilter('ALL');
                  }}
                >
                  Reset Report Filters
                </button>
              </div>
            ) : (
              <div className="table-scroll-wrapper">
                <table className="compliance-table">
                  <thead>
                    <tr>
                      <th className="th-num">#</th>
                      <th
                        className="sortable-th"
                        onClick={() => handleReportSort('regulatoryBody')}
                        title="Sort by Regulatory Body"
                      >
                        <div className="th-flex">
                          <span>Regulatory Body</span>
                          <span className="sort-indicator">
                            {reportSort.key === 'regulatoryBody' ? (reportSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      <th
                        className="sortable-th"
                        onClick={() => handleReportSort('description')}
                        title="Sort by Report Description"
                      >
                        <div className="th-flex">
                          <span>Report Description</span>
                          <span className="sort-indicator">
                            {reportSort.key === 'description' ? (reportSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      <th
                        className="sortable-th th-freq"
                        onClick={() => handleReportSort('frequency')}
                        title="Sort by Frequency"
                      >
                        <div className="th-flex">
                          <span>Frequency</span>
                          <span className="sort-indicator">
                            {reportSort.key === 'frequency' ? (reportSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      <th className="th-app">Applicability</th>
                      <th className="th-date">Date Submitted</th>
                      <th
                        className="sortable-th th-date"
                        onClick={() => handleReportSort('deadline')}
                        title="Sort by Deadline"
                      >
                        <div className="th-flex">
                          <span>Deadline</span>
                          <span className="sort-indicator">
                            {reportSort.key === 'deadline' ? (reportSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      <th
                        className="sortable-th th-status"
                        onClick={() => handleReportSort('status')}
                        title="Sort by Status"
                      >
                        <div className="th-flex">
                          <span>Status</span>
                          <span className="sort-indicator">
                            {reportSort.key === 'status' ? (reportSort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      <th className="th-remarks">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportPaginatedRows.map((row, idx) => {
                      const displayIndex = reportRowsPerPage === 'ALL'
                        ? idx + 1
                        : (reportPage - 1) * reportRowsPerPage + idx + 1;

                      return (
                        <tr
                          key={row.id}
                          className={row.status === 'Not Submitted' ? 'row-not-submitted' : ''}
                        >
                          <td className="td-num">{displayIndex}</td>
                          <td className="td-agency">
                            <span className="agency-pill">{row.regulatoryBody}</span>
                          </td>
                          <td className="td-desc">
                            <div className="desc-main">{row.description}</div>
                            {row.itemCode && row.itemCode !== row.description && (
                              <div className="desc-subcode">{row.itemCode}</div>
                            )}
                          </td>
                          <td className="td-freq">{renderFrequencyBadge(row.frequency)}</td>
                          <td className="td-app">
                            <span className={`app-tag ${row.applicability === 'Applicable' ? 'app-yes' : 'app-no'}`}>
                              {row.applicability}
                            </span>
                          </td>
                          <td className="td-date font-mono">{row.dateSubmitted || <span className="text-muted">—</span>}</td>
                          <td className="td-date font-mono">{row.deadline || <span className="text-muted">—</span>}</td>
                          <td className="td-status">{renderStatusBadge(row.status)}</td>
                          <td className="td-remarks">
                            {row.remarks ? (
                              <span className="remarks-text">{row.remarks}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table 2 Pagination Controls */}
            {reportTotalRows > 0 && reportRowsPerPage !== 'ALL' && (
              <div className="table-pagination">
                <div className="pagination-text">
                  Showing <strong>{(reportPage - 1) * reportRowsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(reportPage * reportRowsPerPage, reportTotalRows)}</strong> of{' '}
                  <strong>{reportTotalRows}</strong> reportorial requirements
                </div>
                <div className="pagination-buttons">
                  <button
                    type="button"
                    className="btn-page-nav"
                    disabled={reportPage === 1}
                    onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                  >
                    ‹ Prev
                  </button>
                  <span className="page-indicator">
                    Page {reportPage} of {reportTotalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-page-nav"
                    disabled={reportPage === reportTotalPages}
                    onClick={() => setReportPage((p) => Math.min(reportTotalPages, p + 1))}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
