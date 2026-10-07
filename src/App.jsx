import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  FACILITY_TYPES,
  DEFAULT_REGIONS,
  isTargetSheet,
  getFacilityType,
  parsePlantWorksheet,
  exportTableToCsv,
  isSharePointUrl,
  formatSharepointUrl
} from './utils/excelParser';
import HomeDashboard from './components/HomeDashboard';
import './App.css';

export default function App() {
  // Workbook & Sheets State
  const [_workbook, setWorkbook] = useState(null);
  const [targetSheets, setTargetSheets] = useState([]);
  const [activeSheetName, setActiveSheetName] = useState('');
  const [parsedDataCache, setParsedDataCache] = useState({});
  const [plantRegions, setPlantRegions] = useState(DEFAULT_REGIONS);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [sourceType, setSourceType] = useState('default'); // 'default' | 'local'
  
  // Top-Level Navigation Tabs: 'home' | 'table'
  const [activeHeaderTab, setActiveHeaderTab] = useState('home');
  
  // Loading & Alert State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Loading PANB Permits & Licenses Monitoring 2026...');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalTab, setUploadModalTab] = useState('file'); // 'file' | 'url'
  const [sharePointUrl, setSharePointUrl] = useState('');
  const [urlLoadError, setUrlLoadError] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  // Plant Navigation & Filter State
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [plantSearchTerm, setPlantSearchTerm] = useState('');

  // View Mode: 'both' | 'permits' | 'reportorial'
  const [viewMode, setViewMode] = useState('both');

  // Table 1 (Permits & Licenses) Controls State
  const [permitsSearch, setPermitsSearch] = useState('');
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

  const fileInputRef = useRef(null);

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

  // Jump from Home Dashboard to specific plant in Table tab
  const handleNavigateToTable = useCallback((plantName, searchFilter) => {
    setActiveHeaderTab('table');
    if (plantName) {
      setActiveSheetName(plantName);
    }
    if (searchFilter) {
      setPermitsSearch(searchFilter);
      setPermitsPage(1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Process ArrayBuffer from fetch or file picker
  const processWorkbookData = useCallback((data, name, sizeStr, source) => {
    try {
      setErrorMessage('');
      const wb = XLSX.read(data, { type: 'array', cellDates: true });

      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error('This workbook does not contain any readable sheets.');
      }

      // Filter sheets strictly by requested prefixes: BMP, MPH, MPPP, MPF
      const matchingSheets = wb.SheetNames.filter(name => isTargetSheet(name));

      if (matchingSheets.length === 0) {
        throw new Error(
          `No monitoring sheets found matching the required prefixes (BMP, MPH, MPPP, MPF). Found sheets: ${wb.SheetNames.slice(0, 6).join(', ')}...`
        );
      }

      // Attempt to extract Region mappings from SUMMARY-Permits sheet if present
      let extractedRegions = { ...DEFAULT_REGIONS };
      if (wb.Sheets['SUMMARY-Permits']) {
        try {
          const sumRows = XLSX.utils.sheet_to_json(wb.Sheets['SUMMARY-Permits'], { header: 1 });
          for (let i = 2; i < sumRows.length; i++) {
            const row = sumRows[i];
            if (row && row[1] && row[0]) {
              extractedRegions[String(row[1]).trim()] = String(row[0]).trim();
            }
          }
        } catch (e) {
          console.warn('Could not read SUMMARY-Permits for regions:', e);
        }
      }

      // Pre-parse sheets into cache for fast switching
      const cache = {};
      matchingSheets.forEach(sName => {
        cache[sName] = parsePlantWorksheet(wb.Sheets[sName], sName);
      });

      setWorkbook(wb);
      setTargetSheets(matchingSheets);
      setPlantRegions(extractedRegions);
      setParsedDataCache(cache);
      setFileName(name);
      setFileSize(sizeStr);
      setSourceType(source);

      // Select first matching sheet by default (e.g. BMP Pangasinan)
      setActiveSheetName(matchingSheets[0]);
      resetTableControls();
      setShowUploadModal(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Workbook parsing error:', err);
      setErrorMessage(`Failed to process spreadsheet: ${err.message}`);
      setIsLoading(false);
    }
  }, [resetTableControls]);

  const loadDefaultFile = useCallback(async () => {
    setIsLoading(true);
    setLoadingText('Loading PANB Permits & Licenses Monitoring 2026...');
    setErrorMessage('');
    setInfoMessage('');

    try {
      const response = await fetch('/PANB_Permits_Licenses_Monitoring_2026_v3.xlsx');
      if (!response.ok) {
        throw new Error(`Failed to load default file: HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      processWorkbookData(
        arrayBuffer,
        'PANB Permits & Licenses Monitoring 2026 v3.xlsx',
        (arrayBuffer.byteLength / 1024 / 1024).toFixed(2) + ' MB',
        'default'
      );
    } catch (err) {
      console.error('Error loading default file:', err);
      setErrorMessage(`Could not load default PANB file: ${err.message}. Please upload the file manually.`);
      setIsLoading(false);
    }
  }, [processWorkbookData]);

  // Auto-load default PANB 2026 file on initial mount
  useEffect(() => {
    loadDefaultFile();
  }, [loadDefaultFile]);


  // Handle local file selection
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readUploadedFile(file);
  };

  const readUploadedFile = (file) => {
    setIsLoading(true);
    setLoadingText(`Reading & parsing "${file.name}"...`);
    setErrorMessage('');
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      processWorkbookData(arrayBuffer, file.name, sizeStr, 'local');
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read the file from disk.');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle SharePoint / OneDrive URL fetch
  const handleSharePointUrl = useCallback(async () => {
    const raw = sharePointUrl.trim();
    if (!raw) {
      setUrlLoadError('Please paste a SharePoint or OneDrive link.');
      return;
    }
    if (!isSharePointUrl(raw)) {
      setUrlLoadError('URL must be from sharepoint.com, onedrive.live.com, or 1drv.ms.');
      return;
    }

    setUrlLoadError('');
    setUrlLoading(true);
    setLoadingText('Fetching file from SharePoint…');

    const downloadUrl = formatSharepointUrl(raw);

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`SharePoint returned HTTP ${response.status}. Make sure the link is set to "Anyone with the link can view".`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Received an HTML login page instead of the file. Ensure the SharePoint link allows anonymous access ("Anyone with link can view").');
      }

      const arrayBuffer = await response.arrayBuffer();
      const sizeStr = (arrayBuffer.byteLength / 1024 / 1024).toFixed(2) + ' MB';
      // Derive a friendly filename from the URL
      let urlName = 'sharepoint-file.xlsx';
      try {
        const u = new URL(downloadUrl);
        const parts = u.pathname.split('/');
        const last = parts[parts.length - 1];
        if (last && last.match(/\.xlsx?$/i)) urlName = decodeURIComponent(last);
      } catch (_) {}

      setUrlLoading(false);
      setSharePointUrl('');
      processWorkbookData(arrayBuffer, urlName, sizeStr, 'sharepoint');
    } catch (err) {
      console.error('SharePoint fetch error:', err);
      setUrlLoadError(err.message);
      setUrlLoading(false);
    }
  }, [sharePointUrl, processWorkbookData, setLoadingText]);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readUploadedFile(file);
    }
  };

  // Filtered plant sheets based on facility type, region, and plant search
  const filteredPlantSheets = useMemo(() => {
    return targetSheets.filter(sheetName => {
      const facility = getFacilityType(sheetName);
      if (facilityTypeFilter !== 'ALL' && facility.code !== facilityTypeFilter) {
        return false;
      }

      const region = plantRegions[sheetName] || 'Other';
      if (regionFilter !== 'ALL' && region !== regionFilter) {
        return false;
      }

      if (plantSearchTerm.trim()) {
        const term = plantSearchTerm.toLowerCase();
        const matchesName = sheetName.toLowerCase().includes(term);
        const matchesRegion = region.toLowerCase().includes(term);
        const matchesFacility = facility.label.toLowerCase().includes(term);
        if (!matchesName && !matchesRegion && !matchesFacility) {
          return false;
        }
      }

      return true;
    });
  }, [targetSheets, facilityTypeFilter, regionFilter, plantSearchTerm, plantRegions]);

  // Current active sheet parsed data
  const currentSheetData = useMemo(() => {
    if (!activeSheetName || !parsedDataCache[activeSheetName]) {
      return { permits: [], reportorial: [] };
    }
    return parsedDataCache[activeSheetName];
  }, [activeSheetName, parsedDataCache]);

  const activeRegion = plantRegions[activeSheetName] || 'Region Not Specified';
  const activeFacility = getFacilityType(activeSheetName);

  // Regulatory bodies list for current sheet filters
  const permitsRegulatoryBodies = useMemo(() => {
    const set = new Set();
    currentSheetData.permits.forEach(p => {
      if (p.regulatoryBody) set.add(p.regulatoryBody.trim());
    });
    return Array.from(set).sort();
  }, [currentSheetData.permits]);

  const reportRegulatoryBodies = useMemo(() => {
    const set = new Set();
    currentSheetData.reportorial.forEach(r => {
      if (r.regulatoryBody) set.add(r.regulatoryBody.trim());
    });
    return Array.from(set).sort();
  }, [currentSheetData.reportorial]);

  // Table 1: Filtered & Sorted Permits and Licenses
  const filteredPermits = useMemo(() => {
    return currentSheetData.permits.filter(row => {
      // Search term filter
      if (permitsSearch.trim()) {
        const term = permitsSearch.toLowerCase();
        const match =
          row.itemCode.toLowerCase().includes(term) ||
          row.regulatoryBody.toLowerCase().includes(term) ||
          row.description.toLowerCase().includes(term) ||
          row.serialNo.toLowerCase().includes(term) ||
          row.remarks.toLowerCase().includes(term);
        if (!match) return false;
      }

      // Status filter
      if (permitsStatusFilter !== 'ALL') {
        if (permitsStatusFilter === 'Expiring Soon') {
          if (!row.isExpiringSoon) return false;
        } else if (row.status !== permitsStatusFilter) {
          return false;
        }
      }

      // Regulatory filter
      if (permitsRegulatoryFilter !== 'ALL' && row.regulatoryBody !== permitsRegulatoryFilter) {
        return false;
      }

      // Applicability filter
      if (permitsApplicabilityFilter !== 'ALL' && row.applicability !== permitsApplicabilityFilter) {
        return false;
      }

      return true;
    });
  }, [
    currentSheetData.permits,
    permitsSearch,
    permitsStatusFilter,
    permitsRegulatoryFilter,
    permitsApplicabilityFilter
  ]);

  const sortedPermits = useMemo(() => {
    const list = [...filteredPermits];
    if (!permitsSort.key) return list;

    return list.sort((a, b) => {
      let valA = a[permitsSort.key];
      let valB = b[permitsSort.key];

      if (permitsSort.key === 'daysToExpire') {
        valA = a.daysToExpireNum !== null ? a.daysToExpireNum : 999999;
        valB = b.daysToExpireNum !== null ? b.daysToExpireNum : 999999;
        return permitsSort.direction === 'asc' ? valA - valB : valB - valA;
      }

      if (permitsSort.key === 'rowIndex') {
        return permitsSort.direction === 'asc' ? a.rowIndex - b.rowIndex : b.rowIndex - a.rowIndex;
      }

      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      return permitsSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [filteredPermits, permitsSort]);

  // Table 2: Filtered & Sorted Reportorial Requirements
  const filteredReportorial = useMemo(() => {
    return currentSheetData.reportorial.filter(row => {
      // Search term filter
      if (reportSearch.trim()) {
        const term = reportSearch.toLowerCase();
        const match =
          row.itemCode.toLowerCase().includes(term) ||
          row.regulatoryBody.toLowerCase().includes(term) ||
          row.description.toLowerCase().includes(term) ||
          row.remarks.toLowerCase().includes(term);
        if (!match) return false;
      }

      // Status filter
      if (reportStatusFilter !== 'ALL' && row.status !== reportStatusFilter) {
        return false;
      }

      // Frequency filter
      if (reportFrequencyFilter !== 'ALL' && row.frequency !== reportFrequencyFilter) {
        return false;
      }

      // Regulatory filter
      if (reportRegulatoryFilter !== 'ALL' && row.regulatoryBody !== reportRegulatoryFilter) {
        return false;
      }

      return true;
    });
  }, [
    currentSheetData.reportorial,
    reportSearch,
    reportStatusFilter,
    reportFrequencyFilter,
    reportRegulatoryFilter
  ]);

  const sortedReportorial = useMemo(() => {
    const list = [...filteredReportorial];
    if (!reportSort.key) return list;

    return list.sort((a, b) => {
      let valA = a[reportSort.key];
      let valB = b[reportSort.key];

      if (reportSort.key === 'rowIndex') {
        return reportSort.direction === 'asc' ? a.rowIndex - b.rowIndex : b.rowIndex - a.rowIndex;
      }

      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      return reportSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [filteredReportorial, reportSort]);

  // Pagination for Permits Table
  const permitsTotalRows = sortedPermits.length;
  const permitsTotalPages = permitsRowsPerPage === 'ALL' ? 1 : Math.ceil(permitsTotalRows / permitsRowsPerPage) || 1;
  const permitsPaginatedRows = useMemo(() => {
    if (permitsRowsPerPage === 'ALL') return sortedPermits;
    const start = (permitsPage - 1) * permitsRowsPerPage;
    return sortedPermits.slice(start, start + permitsRowsPerPage);
  }, [sortedPermits, permitsPage, permitsRowsPerPage]);

  // Pagination for Reportorial Table
  const reportTotalRows = sortedReportorial.length;
  const reportTotalPages = reportRowsPerPage === 'ALL' ? 1 : Math.ceil(reportTotalRows / reportRowsPerPage) || 1;
  const reportPaginatedRows = useMemo(() => {
    if (reportRowsPerPage === 'ALL') return sortedReportorial;
    const start = (reportPage - 1) * reportRowsPerPage;
    return sortedReportorial.slice(start, start + reportRowsPerPage);
  }, [sortedReportorial, reportPage, reportRowsPerPage]);

  // Summary Metrics Calculation
  const metrics = useMemo(() => {
    const permits = currentSheetData.permits || [];
    const reportorial = currentSheetData.reportorial || [];

    const activePermits = permits.filter(p => p.status === 'Active').length;
    const expiringSoonPermits = permits.filter(p => p.isExpiringSoon).length;
    const expiredPermits = permits.filter(p => p.status === 'Expired').length;
    const noPermitCount = permits.filter(p => p.status === 'No Permit').length;
    const naPermits = permits.filter(p => p.status === 'N/A' || p.applicability === 'Not Applicable').length;

    const onTimeReports = reportorial.filter(r => r.status === 'Submitted On-time').length;
    const lateReports = reportorial.filter(r => r.status === 'Late Submission').length;
    const notSubmittedReports = reportorial.filter(r => r.status === 'Not Submitted').length;
    const naReports = reportorial.filter(r => r.status === 'N/A' || r.applicability === 'Not Applicable').length;
    const applicableReports = reportorial.filter(r => r.applicability === 'Applicable').length;

    const complianceRate =
      applicableReports > 0
        ? Math.round(((onTimeReports + lateReports * 0.5) / applicableReports) * 100)
        : 100;

    return {
      totalPermits: permits.length,
      activePermits,
      expiringSoonPermits,
      expiredPermits,
      noPermitCount,
      naPermits,
      totalReports: reportorial.length,
      onTimeReports,
      lateReports,
      notSubmittedReports,
      naReports,
      complianceRate
    };
  }, [currentSheetData]);

  // Sort toggle handlers
  const handlePermitsSort = (colKey) => {
    let dir = 'asc';
    if (permitsSort.key === colKey && permitsSort.direction === 'asc') {
      dir = 'desc';
    }
    setPermitsSort({ key: colKey, direction: dir });
  };

  const handleReportSort = (colKey) => {
    let dir = 'asc';
    if (reportSort.key === colKey && reportSort.direction === 'asc') {
      dir = 'desc';
    }
    setReportSort({ key: colKey, direction: dir });
  };

  // CSV Export Handlers
  const handleExportPermits = () => {
    const headers = [
      'Regulatory Body',
      'Permit / License Description',
      'Applicability',
      'ID/Serial No.',
      'Date Issued',
      'Expiration Date',
      'Status',
      'Days to Expire',
      'Remarks'
    ];
    const exportRows = sortedPermits.map(p => ({
      'Regulatory Body': p.regulatoryBody,
      'Permit / License Description': p.description,
      'Applicability': p.applicability,
      'ID/Serial No.': p.serialNo,
      'Date Issued': p.dateIssued,
      'Expiration Date': p.expirationDate,
      'Status': p.status,
      'Days to Expire': p.daysToExpire,
      'Remarks': p.remarks
    }));
    exportTableToCsv(`${activeSheetName}_Permits_and_Licenses`, headers, exportRows);
  };

  const handleExportReportorial = () => {
    const headers = [
      'Regulatory Body',
      'Report Description',
      'Frequency',
      'Applicability',
      'Date Submitted',
      'Deadline',
      'Status',
      'Remarks'
    ];
    const exportRows = sortedReportorial.map(r => ({
      'Regulatory Body': r.regulatoryBody,
      'Report Description': r.description,
      'Frequency': r.frequency,
      'Applicability': r.applicability,
      'Date Submitted': r.dateSubmitted,
      'Deadline': r.deadline,
      'Status': r.status,
      'Remarks': r.remarks
    }));
    exportTableToCsv(`${activeSheetName}_Reportorial_Requirements`, headers, exportRows);
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status, isExpiringSoon = false) => {
    if (isExpiringSoon) {
      return (
        <span className="status-pill status-warning" title="Expiring within 60 days">
          <span className="status-dot"></span>
          Expiring Soon
        </span>
      );
    }

    switch (status) {
      case 'Active':
      case 'Submitted On-time':
        return (
          <span className="status-pill status-success">
            <span className="status-dot"></span>
            {status}
          </span>
        );
      case 'Expired':
      case 'Not Submitted':
        return (
          <span className="status-pill status-danger">
            <span className="status-dot"></span>
            {status}
          </span>
        );
      case 'Late Submission':
      case 'No Permit':
        return (
          <span className="status-pill status-warning">
            <span className="status-dot"></span>
            {status}
          </span>
        );
      case 'N/A':
      default:
        return (
          <span className="status-pill status-neutral">
            {status || 'N/A'}
          </span>
        );
    }
  };

  // Helper for Frequency Badge styling
  const renderFrequencyBadge = (freq) => {
    const lower = (freq || '').toLowerCase();
    let cls = 'freq-badge freq-periodic';
    if (lower.includes('annual') && !lower.includes('semi')) cls = 'freq-badge freq-annually';
    if (lower.includes('semi')) cls = 'freq-badge freq-semi';
    if (lower.includes('quarter')) cls = 'freq-badge freq-quarterly';
    if (lower.includes('month')) cls = 'freq-badge freq-monthly';

    return <span className={cls}>{freq || 'Periodic'}</span>;
  };

  // Helper for Days To Expire highlight
  const renderDaysToExpire = (daysStr, daysNum, isExpSoon) => {
    if (daysStr === '' || daysStr === undefined || daysStr === null) {
      return <span className="text-muted">—</span>;
    }
    if (isExpSoon) {
      return (
        <span className="days-badge days-warning">
          ⚠️ {daysStr} days
        </span>
      );
    }
    if (daysNum !== null && daysNum < 0) {
      return (
        <span className="days-badge days-danger">
          Expired ({Math.abs(daysNum)}d ago)
        </span>
      );
    }
    return <span className="days-badge days-normal">{daysStr}</span>;
  };

  return (
    <div
      className={`panb-app ${isDragOver ? 'drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Ambient background decorative glow */}
      <div className="panb-ambient-top"></div>

      {/* Main Top Header */}
      <header className="panb-header">
        <div className="header-brand-group">
          <div className="brand-logo-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="brand-titles">
            <div className="brand-badge-row">
              <span className="badge-org">PANB</span>
              <span className="badge-year">2026 Monitoring v3</span>
              <span className="badge-live-pulse">
                <span className="live-dot"></span> Live
              </span>
            </div>
            <h1 className="brand-main-title">Permits &amp; Licenses Compliance System</h1>
            <p className="brand-sub-title">
              Monitoring 23 operating facilities across North Luzon, South Luzon, Visayas, and Mindanao
            </p>
          </div>
        </div>

        {/* Header Tabs: Home - Table */}
        <nav className="header-nav-tabs" aria-label="Main Navigation">
          <button
            type="button"
            className={`header-tab-btn ${activeHeaderTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveHeaderTab('home')}
            id="tab-btn-home"
            title="Overview Executive Dashboard"
          >
            <span className="tab-btn-icon">🏠</span>
            <span className="tab-btn-text">Home</span>
          </button>
          <button
            type="button"
            className={`header-tab-btn ${activeHeaderTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveHeaderTab('table')}
            id="tab-btn-table"
            title="Detailed Plant Compliance Tables"
          >
            <span className="tab-btn-icon">📋</span>
            <span className="tab-btn-text">Table</span>
          </button>
        </nav>

        <div className="header-actions">
          <button
            className="btn-header-secondary"
            onClick={loadDefaultFile}
            title="Reload official 2026 monitoring file"
            disabled={isLoading}
          >
            🔄 Reload 2026 Data
          </button>

          <button
            className="btn-header-primary"
            onClick={() => setShowUploadModal(true)}
            title="Upload updated Excel file"
            disabled={isLoading}
          >
            📁 Upload Updated File
          </button>
        </div>
      </header>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="alert-banner alert-error">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>Error:</strong> {errorMessage}
          </div>
          <button className="alert-close" onClick={() => setErrorMessage('')}>✕</button>
        </div>
      )}

      {infoMessage && (
        <div className="alert-banner alert-info">
          <span className="alert-icon">ℹ️</span>
          <div className="alert-content">{infoMessage}</div>
          <button className="alert-close" onClick={() => setInfoMessage('')}>✕</button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <h3>{loadingText}</h3>
          <p>Parsing spreadsheet data and extracting compliance tables...</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-backdrop" onClick={() => { setShowUploadModal(false); setUrlLoadError(''); setSharePointUrl(''); }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Load Monitoring File</h3>
              <button className="modal-close-btn" onClick={() => { setShowUploadModal(false); setUrlLoadError(''); setSharePointUrl(''); }}>✕</button>
            </div>

            {/* Tab Switcher */}
            <div className="modal-tab-bar">
              <button
                className={`modal-tab-btn ${uploadModalTab === 'file' ? 'active' : ''}`}
                onClick={() => { setUploadModalTab('file'); setUrlLoadError(''); }}
              >
                📂 Upload File
              </button>
              <button
                className={`modal-tab-btn ${uploadModalTab === 'url' ? 'active' : ''}`}
                onClick={() => { setUploadModalTab('url'); setUrlLoadError(''); }}
              >
                🔗 SharePoint URL
              </button>
            </div>

            <div className="modal-body">
              {/* ── Tab 1: Local File ── */}
              {uploadModalTab === 'file' && (
                <>
                  <div
                    className="modal-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="dropzone-icon">📊</div>
                    <h4>Select or Drag &amp; Drop Spreadsheet</h4>
                    <p>Upload updated <code>.xlsx</code> or <code>.xls</code> workbook containing plant monitoring sheets.</p>
                    <button type="button" className="btn-browse-file">
                      Browse From Computer
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      style={{ display: 'none' }}
                    />
                  </div>
                </>
              )}

              {/* ── Tab 2: SharePoint / OneDrive URL ── */}
              {uploadModalTab === 'url' && (
                <div className="url-upload-panel">
                  <div className="url-upload-icon">🔗</div>
                  <h4>Paste SharePoint or OneDrive Link</h4>
                  <p className="url-upload-hint">
                    The file must be shared as <strong>"Anyone with the link can view"</strong> in SharePoint.
                    Copy the sharing link from <em>Share → Copy Link</em>.
                  </p>
                  <div className="url-input-row">
                    <input
                      type="url"
                      className="url-text-input"
                      placeholder="https://yourorg.sharepoint.com/:x:/s/…"
                      value={sharePointUrl}
                      onChange={(e) => { setSharePointUrl(e.target.value); setUrlLoadError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSharePointUrl(); }}
                      disabled={urlLoading}
                    />
                    <button
                      className="btn-load-url"
                      onClick={handleSharePointUrl}
                      disabled={urlLoading || !sharePointUrl.trim()}
                    >
                      {urlLoading ? '⏳ Loading…' : 'Load'}
                    </button>
                  </div>
                  {urlLoadError && (
                    <div className="url-error-msg">⚠️ {urlLoadError}</div>
                  )}
                  <div className="url-tips">
                    <span className="url-tip-label">Supported:</span>
                    <span className="url-tip-badge">sharepoint.com</span>
                    <span className="url-tip-badge">onedrive.live.com</span>
                    <span className="url-tip-badge">1drv.ms</span>
                  </div>
                </div>
              )}

              <div className="modal-note">
                <strong>Target Filter Rule:</strong> The app automatically scans for sheets prefixed <code>BMP</code>, <code>MPH</code>, <code>MPPP</code>, <code>MPF</code> and structures them into the 2 official compliance tables.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Home Dashboard Tab View */}
      {activeHeaderTab === 'home' && (
        <HomeDashboard
          onNavigateToTable={handleNavigateToTable}
          parsedDataCache={parsedDataCache}
          targetSheets={targetSheets}
          plantRegions={plantRegions}
          isLoading={isLoading}
        />
      )}

      {/* Table Tab View */}
      {activeHeaderTab === 'table' && !isLoading && targetSheets.length > 0 && (
        <main className="panb-main-content">
          {/* Plant Selector & Multi-Level Filter Bar */}
          <section className="plant-selector-card">
            <div className="selector-top-row">
              {/* Facility Type Filter Tabs */}
              <div className="filter-pill-group">
                <span className="filter-group-label">Facility Type:</span>
                <button
                  className={`filter-pill ${facilityTypeFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setFacilityTypeFilter('ALL')}
                >
                  All ({targetSheets.length})
                </button>
                {Object.values(FACILITY_TYPES).map(fac => {
                  const count = targetSheets.filter(s => s.startsWith(fac.code)).length;
                  if (count === 0) return null;
                  return (
                    <button
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
                    <button className="clear-btn-sm" onClick={() => setPlantSearchTerm('')}>✕</button>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Plant Sheet Pills */}
            <div className="plant-pills-row">
              <span className="plants-list-label">Operating Plants:</span>
              <div className="plant-pills-scroll">
                {filteredPlantSheets.length === 0 ? (
                  <span className="no-plants-match">No plants match selected filters.</span>
                ) : (
                  filteredPlantSheets.map(sheetName => {
                    const isCur = activeSheetName === sheetName;
                    const fac = getFacilityType(sheetName);
                    return (
                      <button
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

          {/* Active Plant Hero Header & KPI Banner */}
          <section className="active-plant-hero">
            <div className="hero-left-info">
              <div className="hero-tags">
                <span className="hero-tag-badge facility-tag" style={{ borderColor: activeFacility.color }}>
                  {activeFacility.icon} {activeFacility.label} ({activeFacility.code})
                </span>
                <span className="hero-tag-badge region-tag">
                  📍 {activeRegion}
                </span>
                <span className="hero-tag-badge file-source-tag">
                  📁 {fileName} {fileSize ? `(${fileSize})` : ''} • {sourceType === 'default' ? 'Default Dataset' : 'Custom Upload'}
                </span>
              </div>
              <h2 className="hero-plant-name">{activeSheetName}</h2>
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
                <div className="kpi-sub">&le; 60 days remaining</div>
              </div>

              <div className="kpi-card kpi-danger">
                <div className="kpi-val">{metrics.expiredPermits + metrics.noPermitCount}</div>
                <div className="kpi-label">Expired / Missing</div>
                <div className="kpi-sub">Immediate action required</div>
              </div>

              <div className="kpi-card kpi-info">
                <div className="kpi-val">{metrics.onTimeReports}</div>
                <div className="kpi-label">Reports On-Time</div>
                <div className="kpi-sub">Out of {metrics.totalReports} total</div>
              </div>

              <div className="kpi-card kpi-accent">
                <div className="kpi-val">{metrics.complianceRate}%</div>
                <div className="kpi-label">Compliance Rate</div>
                <div className="kpi-sub">Overall health score</div>
              </div>
            </div>
          </section>

          {/* View Mode Tabs (Both / Table 1 / Table 2) */}
          <div className="view-mode-tabs-bar">
            <div className="tabs-button-group">
              <button
                className={`tab-view-btn ${viewMode === 'both' ? 'active' : ''}`}
                onClick={() => setViewMode('both')}
              >
                📑 Both Tables (Stacked View)
              </button>
              <button
                className={`tab-view-btn ${viewMode === 'permits' ? 'active' : ''}`}
                onClick={() => setViewMode('permits')}
              >
                📜 Table 1: Permit and Licenses ({currentSheetData.permits.length})
              </button>
              <button
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

          {/* TABLE 1: PERMITS AND LICENSES */}
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
                  <button className="btn-export-csv" onClick={handleExportPermits}>
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
                    <button className="clear-btn-sm" onClick={() => setPermitsSearch('')}>✕</button>
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
                      {permitsRegulatoryBodies.map(body => (
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
                        className="btn-page-nav"
                        disabled={permitsPage === 1}
                        onClick={() => setPermitsPage(p => Math.max(1, p - 1))}
                      >
                        ‹ Prev
                      </button>
                      <span className="page-indicator">
                        Page {permitsPage} of {permitsTotalPages}
                      </span>
                      <button
                        className="btn-page-nav"
                        disabled={permitsPage === permitsTotalPages}
                        onClick={() => setPermitsPage(p => Math.min(permitsTotalPages, p + 1))}
                      >
                        Next ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TABLE 2: REPORTORIAL REQUIREMENTS */}
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
                  <button className="btn-export-csv" onClick={handleExportReportorial}>
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
                    <button className="clear-btn-sm" onClick={() => setReportSearch('')}>✕</button>
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
                      {reportRegulatoryBodies.map(body => (
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
                        className="btn-page-nav"
                        disabled={reportPage === 1}
                        onClick={() => setReportPage(p => Math.max(1, p - 1))}
                      >
                        ‹ Prev
                      </button>
                      <span className="page-indicator">
                        Page {reportPage} of {reportTotalPages}
                      </span>
                      <button
                        className="btn-page-nav"
                        disabled={reportPage === reportTotalPages}
                        onClick={() => setReportPage(p => Math.min(reportTotalPages, p + 1))}
                      >
                        Next ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="panb-footer">
        <div className="footer-left">
          <span>PANB Permits &amp; Licenses Monitoring System &bull; 2026</span>
          <span className="footer-separator">&bull;</span>
          <span>Target Prefixes: <strong>BMP</strong>, <strong>MPH</strong>, <strong>MPPP</strong>, <strong>MPF</strong></span>
        </div>
        <div className="footer-right">
          <span>Active Sheet: <strong>{activeSheetName || 'None'}</strong></span>
          <span className="footer-separator">&bull;</span>
          <span>Total Target Facilities: <strong>{targetSheets.length}</strong></span>
        </div>
      </footer>
    </div>
  );
}
