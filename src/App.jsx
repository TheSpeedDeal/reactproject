import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  DEFAULT_REGIONS,
  isTargetSheet,
  parsePlantWorksheet,
  parseSummarySheets
} from './utils/ExcelParsers/excelParserPermitAndLicense';
import ThemeSelector from './components/ThemeSelector/ThemeSelector';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from './utils/themeConfig';
import PermitsMonitoringSystem from './components/Permits & Licenses Monitoring System/PermitsMonitoringSystem';
import SourceExcel from './components/SourceExcel/SourceExcel';
import './App.css';

// Enterprise Systems & Roadmap Modules Configuration
// To add new modules in the future, simply update this array!
const ENTERPRISE_MODULES = [
  {
    id: 'permits',
    name: 'Permits and Licenses',
    icon: '📜',
    status: 'Active System',
    badgeClass: 'live',
    isActive: true,
    desc: 'Comprehensive compliance tracking for operating clearances, environmental discharge permits, DOLE registrations, local government permits, and regulatory deadlines across all 23 facilities.',
    capabilities: [
      'Interactive Slicer Controls',
      'Priority Compliance Actions',
      'Full 23-Plant Display Tables',
      'Executive KPI Health Metrics',
      'CSV Data Export'
    ],
    metrics: '1,450 Permits • 23 Facilities • 94% Rate',
    highlights: [
      'Automated expiration horizon alerting for 30/60/90-day compliance deadlines',
      'Integrated cross-filtering across 23 plants and 4 geographic regions',
      'Instant priority action tracking with detail drill-down'
    ]
  },
  {
    id: 'ccr',
    name: 'CCR Generation and Disposal Monitoring',
    icon: '♻️',
    status: 'Phase 2 • Upcoming',
    badgeClass: 'roadmap',
    isActive: false,
    desc: 'Coal Combustion Residuals (CCR) generation tracking, ash storage pond monitoring, fly ash & bottom ash commercial utilization, and environmental disposal compliance under DAO standards.',
    capabilities: [
      'Daily CCR Generation Metrics',
      'Fly Ash & Bottom Ash Utilization',
      'Ash Storage Facility Capacities',
      'Transporter & Hauler Clearances'
    ],
    metrics: 'Target: 100% Traceability',
    highlights: [
      'Real-time tracking of generated vs disposed coal combustion residuals',
      'Commercial off-taker and cement manufacturer consignment logs',
      'Environmental containment pond water quality testing archives'
    ]
  },
  {
    id: 'energy',
    name: 'Energy Monitoring',
    icon: '⚡',
    status: 'Phase 3 • Upcoming',
    badgeClass: 'roadmap',
    isActive: false,
    desc: 'Department of Energy (DOE) energy conservation compliance (RA 11285), facility power generation heat rates, auxiliary consumption metrics, and grid synchronization logging.',
    capabilities: [
      'DOE RA 11285 Compliance Vault',
      'Net Generation & Auxiliary Power',
      'Heat Rate & Efficiency Tracking',
      'ERC COC Renewal Workflows'
    ],
    metrics: 'Target: Optimal Heat Rate',
    highlights: [
      'Automated filing of annual energy consumption reports under RA 11285',
      'Continuous auxiliary load and station service monitoring',
      'Grid reliability and Certificate of Compliance (COC) lifecycle management'
    ]
  },
  {
    id: 'nov',
    name: 'Notice of Violation Monitoring',
    icon: '⚠️',
    status: 'Phase 4 • Upcoming',
    badgeClass: 'roadmap',
    isActive: false,
    desc: 'Centralized registry for government inspection findings, DENR/LLDA/DOLE notices of violation, technical conference schedules, and corrective action resolution milestones.',
    capabilities: [
      'NOV & Show Cause Docketing',
      'Technical Conference Calendar',
      'Corrective Action Commitments',
      'Penalty & Resolution Tracking'
    ],
    metrics: 'Target: Zero Active Violations',
    highlights: [
      'End-to-end audit trail from NOV receipt to official resolution and closure',
      'Automated deadline alerts for regulatory response commitments',
      'Corrective and preventive action (CAPA) evidence upload repository'
    ]
  },
  {
    id: 'solid_waste',
    name: 'Solid Waste Monitoring',
    icon: '🗑️',
    status: 'Phase 5 • Upcoming',
    badgeClass: 'roadmap',
    isActive: false,
    desc: 'Ecological Solid Waste Management Act (RA 9003) governance: plant waste segregation audits, MRF recovery rate tracking, scrap inventory, and accredited hauler manifests.',
    capabilities: [
      'RA 9003 Segregation Audits',
      'Material Recovery Facility Logs',
      'Scrap & Recyclable Consignments',
      'Accredited Hauler Manifests'
    ],
    metrics: 'Target: >85% Waste Diversion',
    highlights: [
      'Quarterly waste diversion rate computations against ecological targets',
      'Accredited scrap buyer chain-of-custody documentation',
      'LGU compliance certificate archive for solid waste generation'
    ]
  },
  {
    id: 'tree_planting',
    name: 'Tree Planting & Clean-up Drive',
    icon: '🌱',
    status: 'Phase 6 • Upcoming',
    badgeClass: 'roadmap',
    isActive: false,
    desc: 'Corporate environmental stewardship & National Greening Program commitments: seedling planting campaigns, survival rate field monitoring, and community river clean-up initiatives.',
    capabilities: [
      'Seedling Planting Inventory',
      'Survival Rate Audit Logs',
      'Adopt-an-Estero Clean-up Drives',
      'Community CSR Photo Archives'
    ],
    metrics: 'Target: 50,000 Seedlings / Year',
    highlights: [
      'GPS mapping and survival rate validation for reforestation plots',
      'Adopted waterbody clean-up tonnage tracking and community engagement logs',
      'DENR National Greening Program (NGP) compliance certification'
    ]
  },
  {
    id: 'water',
    name: 'Water Monitoring',
    icon: '💧',
    status: 'Phase 7 • Upcoming',
    badgeClass: 'roadmap',
    isActive: false,
    desc: 'Clean Water Act (RA 9275) industrial effluent tracking: wastewater treatment plant (WWTP) parameters, laboratory discharge testing (BOD, COD, TSS), and deep well abstraction metering.',
    capabilities: [
      'WWTP Lab Analysis Vault (BOD/COD)',
      'Effluent Discharge Volume Logs',
      'NWRB Deep Well Abstraction Meters',
      'DENR SMR Water Quality Annex'
    ],
    metrics: 'Target: 100% Effluent Compliance',
    highlights: [
      'Continuous logging of effluent parameters against DENR DAO 2016-08 standards',
      'Groundwater extraction metering against NWRB water permit allocations',
      'Automated quarterly SMR Water Quality Annex data consolidation'
    ]
  }
];

// Alias for FUTURE_MODULES so any existing references remain compatible
const FUTURE_MODULES = ENTERPRISE_MODULES;

// Default initial datasets per module
const INITIAL_MODULE_DATASETS = {
  permits: {
    activeFileId: 'default-permits',
    files: [
      {
        id: 'default-permits',
        name: 'PANB Permits & Licenses Monitoring 2026 v3.xlsx',
        sizeStr: '1.95 MB',
        origin: 'default',
        targetSheets: ['BMP-BATAAN', 'BMP-TARLAC', 'BMP-ISABELA', 'MPH-PAL', 'MPPP-PAG', 'MPF-TOLEDO'],
        plantRegions: DEFAULT_REGIONS,
        parsedDataCache: {},
        totalRecords: 1450,
        uploadedAt: 'Baseline Master',
        status: 'Ready in Cache'
      }
    ]
  },
  ccr: {
    activeFileId: 'default-ccr',
    files: [
      {
        id: 'default-ccr',
        name: 'PANB CCR Generation & Disposal Master 2026.xlsx',
        sizeStr: '0.85 MB',
        origin: 'default',
        targetSheets: ['CCR-BATAAN', 'CCR-TARLAC', 'CCR-ISABELA', 'ASH-DISPOSAL-LOGS'],
        totalRecords: 480,
        uploadedAt: 'Baseline Schema',
        status: 'Ready in Cache'
      }
    ]
  },
  energy: {
    activeFileId: 'default-energy',
    files: [
      {
        id: 'default-energy',
        name: 'PANB Energy Conservation & Heat Rate Monitoring 2026.xlsx',
        sizeStr: '1.12 MB',
        origin: 'default',
        targetSheets: ['ENERGY-GRID-SYNC', 'HEAT-RATE-ANALYSIS', 'DOE-RA11285-METRICS'],
        totalRecords: 620,
        uploadedAt: 'Baseline Schema',
        status: 'Ready in Cache'
      }
    ]
  },
  nov: {
    activeFileId: 'default-nov',
    files: [
      {
        id: 'default-nov',
        name: 'PANB Notice of Violation & CAPA Master 2026.xlsx',
        sizeStr: '0.45 MB',
        origin: 'default',
        targetSheets: ['NOV-DOCKET', 'TECH-CONFERENCE-LOG', 'CAPA-RESOLUTIONS'],
        totalRecords: 145,
        uploadedAt: 'Baseline Schema',
        status: 'Ready in Cache'
      }
    ]
  },
  solid_waste: {
    activeFileId: 'default-solid_waste',
    files: [
      {
        id: 'default-solid_waste',
        name: 'PANB Solid Waste Management & Segregation 2026.xlsx',
        sizeStr: '0.72 MB',
        origin: 'default',
        targetSheets: ['MRF-DIVERSION-RATES', 'HAULER-MANIFESTS', 'SCRAP-INVENTORY'],
        totalRecords: 390,
        uploadedAt: 'Baseline Schema',
        status: 'Ready in Cache'
      }
    ]
  },
  tree_planting: {
    activeFileId: 'default-tree_planting',
    files: [
      {
        id: 'default-tree_planting',
        name: 'PANB NGP Tree Planting & Estero Clean-Up 2026.xlsx',
        sizeStr: '0.98 MB',
        origin: 'default',
        targetSheets: ['PLANTING-INVENTORY', 'SURVIVAL-RATE-AUDIT', 'CLEANUP-TONNAGE'],
        totalRecords: 510,
        uploadedAt: 'Baseline Schema',
        status: 'Ready in Cache'
      }
    ]
  },
  water: {
    activeFileId: 'default-water',
    files: [
      {
        id: 'default-water',
        name: 'PANB Clean Water Act Effluent & Abstraction 2026.xlsx',
        sizeStr: '1.30 MB',
        origin: 'default',
        targetSheets: ['WWTP-LAB-ANALYSIS', 'EFFLUENT-DISCHARGE', 'DEEPWELL-ABSTRACTION'],
        totalRecords: 890,
        uploadedAt: 'Baseline Schema',
        status: 'Ready in Cache'
      }
    ]
  }
};

export default function App() {
  // Main Top-Level Navigation: 'hub' (Central Hub) | 'permits' (Permits & Licenses System) | 'sourceExcel' (Data Sources)
  const [activeMainModule, setActiveMainModule] = useState('hub');
  const [permitsView, setPermitsView] = useState('home'); // 'home' | 'tables'
  const [targetPlant, setTargetPlant] = useState('');
  const [targetSearch, setTargetSearch] = useState('');

  // Module-by-Module Master Datasets State
  const [moduleDatasets, setModuleDatasets] = useState(INITIAL_MODULE_DATASETS);

  // Active Permits Workbook & Sheets State
  const [_workbook, setWorkbook] = useState(null);
  const [targetSheets, setTargetSheets] = useState([]);
  const [activeSheetName, setActiveSheetName] = useState('');
  const [parsedDataCache, setParsedDataCache] = useState({});
  const [summaryData, setSummaryData] = useState({ permitsSummary: null, reportorialSummary: null });
  const [plantRegions, setPlantRegions] = useState(DEFAULT_REGIONS);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [sourceType, setSourceType] = useState('default');

  // UI Theme State
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const handleThemeChange = useCallback((newTheme) => {
    setCurrentTheme(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // Loading & Alert State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initializing PANB Central Enterprise Hub...');
  const [errorMessage, setErrorMessage] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [appSettings, setAppSettings] = useState(null);

  // Load appsettings.json on initialization for environment configuration
  useEffect(() => {
    fetch('/api/appsettings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAppSettings(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load /api/appsettings:', err);
      });
  }, []);

  // Future feature preview modal
  const [previewModule, setPreviewModule] = useState(null);

  const fileInputRef = useRef(null);
  const lastUploadedPermitsFileRef = useRef(null);
  const gridScrollRef = useRef(null);
  const [isMouseDownDragging, setIsMouseDownDragging] = useState(false);
  const dragInfoRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false
  });

  const handleScrollGrid = useCallback((direction) => {
    if (gridScrollRef.current) {
      const scrollAmount = 340;
      gridScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleGridWheel = useCallback((e) => {
    if (gridScrollRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        gridScrollRef.current.scrollLeft += e.deltaY;
      }
    }
  }, []);

  const handleGridMouseDown = useCallback((e) => {
    if (e.button !== 0 || !gridScrollRef.current) return;
    dragInfoRef.current = {
      isDown: true,
      startX: e.pageX - gridScrollRef.current.offsetLeft,
      scrollLeft: gridScrollRef.current.scrollLeft,
      hasMoved: false
    };
    setIsMouseDownDragging(true);
  }, []);

  const handleGridMouseMove = useCallback((e) => {
    if (!dragInfoRef.current.isDown || !gridScrollRef.current) return;
    const currentX = e.pageX - gridScrollRef.current.offsetLeft;
    const walk = currentX - dragInfoRef.current.startX;
    if (Math.abs(walk) > 4) {
      dragInfoRef.current.hasMoved = true;
      e.preventDefault();
      gridScrollRef.current.scrollLeft = dragInfoRef.current.scrollLeft - walk;
    }
  }, []);

  const handleGridMouseUp = useCallback(() => {
    if (dragInfoRef.current.isDown) {
      dragInfoRef.current.isDown = false;
      setIsMouseDownDragging(false);
      setTimeout(() => {
        if (dragInfoRef.current) {
          dragInfoRef.current.hasMoved = false;
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragInfoRef.current.isDown) {
        dragInfoRef.current.isDown = false;
        setIsMouseDownDragging(false);
        setTimeout(() => {
          if (dragInfoRef.current) {
            dragInfoRef.current.hasMoved = false;
          }
        }, 100);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Process ArrayBuffer from fetch or file picker
  const processWorkbookData = useCallback((data, name, sizeStr, source) => {
    try {
      setErrorMessage('');
      const wb = XLSX.read(data, { type: 'array', cellDates: true });

      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error('This workbook does not contain any readable sheets.');
      }

      const matchingSheets = wb.SheetNames.filter((sName) => isTargetSheet(sName));

      if (matchingSheets.length === 0) {
        throw new Error(
          `No monitoring sheets found matching required prefixes (BMP, MPH, MPPP, MPF). Found sheets: ${wb.SheetNames.slice(0, 6).join(', ')}...`
        );
      }

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

      const cache = {};
      matchingSheets.forEach((sName) => {
        cache[sName] = parsePlantWorksheet(wb.Sheets[sName], sName);
      });

      const parsedSummary = parseSummarySheets(wb);

      const totalRecs = Object.values(cache).reduce((sum, s) => sum + (Array.isArray(s) ? s.length : 0), 0);

      setWorkbook(wb);
      setTargetSheets(matchingSheets);
      setPlantRegions(extractedRegions);
      setParsedDataCache(cache);
      setSummaryData(parsedSummary);
      setFileName(name);
      setFileSize(sizeStr);
      setSourceType(source);
      setActiveSheetName(matchingSheets[0]);
      setShowUploadModal(false);
      setIsLoading(false);

      // Record active file in moduleDatasets for permits
      const fileId = source === 'default' ? 'default-permits' : `file-${Date.now()}`;
      const fileRecord = {
        id: fileId,
        name,
        sizeStr,
        origin: source,
        targetSheets: matchingSheets,
        plantRegions: extractedRegions,
        parsedDataCache: cache,
        summaryData: parsedSummary,
        totalRecords: totalRecs,
        uploadedAt: source === 'default' ? 'Baseline Master' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Ready in Cache',
        workbook: wb,
        arrayBuffer
      };

      setModuleDatasets((prev) => {
        const existing = prev.permits?.files || [];
        const isDefault = source === 'default';
        let updatedFiles;
        if (isDefault) {
          updatedFiles = [fileRecord, ...existing.filter((f) => f.id !== 'default-permits')];
        } else {
          updatedFiles = [fileRecord, ...existing.filter((f) => f.id !== fileId)];
        }
        return {
          ...prev,
          permits: {
            activeFileId: fileId,
            files: updatedFiles
          }
        };
      });
    } catch (err) {
      console.error('Workbook parsing error:', err);
      setErrorMessage(`Failed to process spreadsheet: ${err.message}`);
      setIsLoading(false);
    }
  }, []);

  const loadDefaultFile = useCallback(async () => {
    setIsLoading(true);
    setLoadingText('Loading PANB Monitoring Workbook 2026...');
    setErrorMessage('');

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
      setErrorMessage(`Could not load default PANB file: ${err.message}.`);
      setIsLoading(false);
    }
  }, [processWorkbookData]);

  // Reusable local file processor (used by both file picker and SourceExcel dropzone)
  const handleProcessLocalFile = useCallback((file) => {
    if (!file) return;
    setIsLoading(true);
    setLoadingText(`Reading "${file.name}"...`);
    setErrorMessage('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      const arrayBuffer = evt.target.result;
      const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      lastUploadedPermitsFileRef.current = {
        file,
        arrayBuffer,
        name: file.name,
        sizeStr
      };
      processWorkbookData(arrayBuffer, file.name, sizeStr, 'local');
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read file from disk.');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, [processWorkbookData]);

  // Synchronize / Reload Data: re-syncs the uploaded file if active, or reloads default
  const handleSyncData = useCallback(async () => {
    if (lastUploadedPermitsFileRef.current) {
      const { file, arrayBuffer, name, sizeStr } = lastUploadedPermitsFileRef.current;
      setIsLoading(true);
      setLoadingText(`Re-syncing "${name}"...`);
      setErrorMessage('');

      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const freshBuffer = evt.target.result;
          lastUploadedPermitsFileRef.current.arrayBuffer = freshBuffer;
          processWorkbookData(freshBuffer, name, sizeStr, 'local');
        };
        reader.onerror = () => {
          if (arrayBuffer) {
            processWorkbookData(arrayBuffer, name, sizeStr, 'local');
          } else {
            setErrorMessage('Failed to re-read uploaded file.');
            setIsLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      if (arrayBuffer) {
        processWorkbookData(arrayBuffer, name, sizeStr, 'local');
        return;
      }
    }

    // Default: reload the official baseline 2026 dataset
    await loadDefaultFile();
  }, [loadDefaultFile, processWorkbookData]);

  // Local file upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessLocalFile(file);
  };

  // Switch active spreadsheet for any module
  const handleSwitchModuleFile = useCallback((moduleId, fileId) => {
    setModuleDatasets((prev) => {
      const mod = prev[moduleId];
      if (!mod) return prev;
      const targetFile = mod.files?.find((f) => f.id === fileId);
      if (!targetFile) return prev;

      if (moduleId === 'permits') {
        setFileName(targetFile.name);
        setFileSize(targetFile.sizeStr);
        setSourceType(targetFile.origin);
        if (targetFile.targetSheets && targetFile.targetSheets.length > 0) {
          setTargetSheets(targetFile.targetSheets);
          setActiveSheetName(targetFile.targetSheets[0]);
        }
        if (targetFile.plantRegions) setPlantRegions(targetFile.plantRegions);
        if (targetFile.parsedDataCache) setParsedDataCache(targetFile.parsedDataCache);
        if (targetFile.summaryData) setSummaryData(targetFile.summaryData);
        if (targetFile.workbook) setWorkbook(targetFile.workbook);
        if (targetFile.origin === 'local') {
          lastUploadedPermitsFileRef.current = {
            arrayBuffer: targetFile.arrayBuffer,
            name: targetFile.name,
            sizeStr: targetFile.sizeStr
          };
        } else if (targetFile.origin === 'default') {
          lastUploadedPermitsFileRef.current = null;
        }
      }

      return {
        ...prev,
        [moduleId]: {
          ...mod,
          activeFileId: fileId
        }
      };
    });
  }, []);

  // Upload an Excel file for any module
  const handleUploadModuleFile = useCallback(async (moduleId, file) => {
    if (!file) return;
    if (moduleId === 'permits') {
      handleProcessLocalFile(file);
      return;
    }

    setIsLoading(true);
    setLoadingText(`Reading "${file.name}" for ${moduleId}...`);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetNames = wb.SheetNames || [];
      let totalRows = 0;
      sheetNames.forEach((s) => {
        const sheet = wb.Sheets[s];
        if (sheet) {
          const rows = XLSX.utils.sheet_to_json(sheet);
          totalRows += rows.length;
        }
      });

      const fileId = `file-${Date.now()}`;
      const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      const fileRecord = {
        id: fileId,
        name: file.name,
        sizeStr,
        origin: 'local',
        targetSheets: sheetNames,
        plantRegions: {},
        parsedDataCache: {},
        totalRecords: totalRows,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Ready in Cache',
        workbook: wb
      };

      setModuleDatasets((prev) => {
        const existing = prev[moduleId]?.files || [];
        return {
          ...prev,
          [moduleId]: {
            activeFileId: fileId,
            files: [fileRecord, ...existing]
          }
        };
      });
      setIsLoading(false);
    } catch (err) {
      console.error('Error parsing module file:', err);
      setErrorMessage(`Failed to parse file for ${moduleId}: ${err.message}`);
      setIsLoading(false);
    }
  }, [handleProcessLocalFile]);

  // Initial mount load
  useEffect(() => {
    loadDefaultFile();
  }, [loadDefaultFile]);

  // Launch into Permits & Licenses Monitoring System
  const launchPermitsSystem = (view = 'home') => {
    setPermitsView(view);
    setActiveMainModule('permits');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToTable = (plantName, actionName) => {
    if (plantName) setTargetPlant(plantName);
    if (actionName) setTargetSearch(actionName);
    setPermitsView('tables');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setPermitsView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSummary = () => {
    setPermitsView('summary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateTables = () => {
    setPermitsView('tables');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentActiveModule = useMemo(() => {
    return ENTERPRISE_MODULES.find((m) => m.id === activeMainModule);
  }, [activeMainModule]);

  return (
    <div className={`panb-app ${activeMainModule === 'hub' ? 'hub-mode' : ''}`} data-theme={currentTheme}>
      <div className="panb-ambient-top" aria-hidden="true"></div>

      {/* 1. Global Central Enterprise Header */}
      <header className="panb-header">
        <div
          className="header-brand-group"
          onClick={() => setActiveMainModule('hub')}
          title="Return to Central Operations Hub"
        >
          <div className="brand-logo-icon">
            {activeMainModule === 'hub'
              ? '🏢'
              : activeMainModule === 'sourceExcel'
              ? '📊'
              : (currentActiveModule?.icon || '📜')}
          </div>
          <div className="brand-titles">
            <div className="brand-badge-row">
              <span className="badge-org">PANB ENTERPRISE</span>
              <span className="badge-year">
                {activeMainModule === 'hub'
                  ? '2026 Operations Portal'
                  : activeMainModule === 'sourceExcel'
                  ? 'Master Data Sources'
                  : (currentActiveModule?.name || 'Monitoring System')}
              </span>
              <span className="badge-live-pulse">
                <span className="live-dot"></span>
                {activeMainModule === 'hub'
                  ? 'Central Hub Live'
                  : activeMainModule === 'sourceExcel'
                  ? 'Data Pipeline Active'
                  : (currentActiveModule?.status || 'Active System')}
              </span>
            </div>
            <h1 className="brand-main-title">
              {activeMainModule === 'hub'
                ? 'Operations & Regulatory Compliance Portal'
                : activeMainModule === 'sourceExcel'
                ? 'SourceExcel • Module Master Spreadsheets'
                : (currentActiveModule?.name || 'Operations Portal')}
            </h1>
            <p className="brand-sub-title">
              {activeMainModule === 'hub'
                ? 'Central intelligence hub • 23 industrial operating facilities • Enterprise regulatory monitoring'
                : activeMainModule === 'sourceExcel'
                ? 'Configure master Excel workbooks • Upload sheets per module • Switch active workbooks'
                : `Comprehensive regulatory monitoring for ${targetSheets.length || 23} operating facilities`}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs when inside Permits module */}
        {activeMainModule === 'permits' && (
          <nav className="header-view-tabs" aria-label="Permits System Views">
            <button
              type="button"
              className={`header-tab-btn ${permitsView === 'home' ? 'active' : ''}`}
              onClick={handleNavigateHome}
              title="Executive Compliance Dashboard"
            >
              <span>🏠 Executive Dashboard</span>
            </button>
            <button
              type="button"
              className={`header-tab-btn ${permitsView === 'summary' ? 'active' : ''}`}
              onClick={handleNavigateSummary}
              title="Cross-Facility Compliance Summary Matrix"
            >
              <span>📊 Compliance Summary</span>
            </button>
            <button
              type="button"
              className={`header-tab-btn ${permitsView === 'tables' ? 'active' : ''}`}
              onClick={handleNavigateTables}
              title="Facility Display Tables"
            >
              <span>📋 Facility Display Tables</span>
            </button>
          </nav>
        )}

        {/* Actions Bar */}
        <div className="header-actions">
          {activeMainModule !== 'hub' && (
            <button
              type="button"
              className="btn-header-back-hub"
              onClick={() => setActiveMainModule('hub')}
              title="Return to Central Operations Hub"
            >
              ← Back to Central Hub
            </button>
          )}

          <button
            type="button"
            className={`btn-header-dev ${activeMainModule === 'sourceExcel' ? 'active' : ''}`}
            onClick={() => setActiveMainModule(activeMainModule === 'sourceExcel' ? 'hub' : 'sourceExcel')}
            title="Manage Module Master Excel Spreadsheets"
          >
            <span>📊</span>
            <span>SourceExcel</span>
          </button>

          <ThemeSelector
            currentTheme={currentTheme}
            onSelectTheme={handleThemeChange}
            variant="main-header"
          />
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="global-error-banner" role="alert">
          <span>⚠️ {errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')}>✕</button>
        </div>
      )}

      {/* 2. Main View 1: Central Operations Hub (Only Displays the Modular Features Hub) */}
      {activeMainModule === 'hub' && (
        <main className="central-hub-container">
          {/* Modular Systems & Future Features Grid */}
          <section className="hub-modules-section">
            <div className="hub-section-header">
              <div>
                <h3 className="hub-section-title">Enterprise Systems &amp; Modular Features Hub</h3>
                <span className="hub-section-subtitle">
                  Operational compliance systems and upcoming architectural roadmap modules
                </span>
              </div>

              <div className="hub-scroll-controls">
                <span className="hub-scroll-hint">
                  <span className="hub-scroll-icon">↔</span> Drag or Scroll Left / Right
                </span>
                <div className="hub-nav-arrow-group">
                  <button
                    type="button"
                    className="btn-hub-scroll"
                    onClick={() => handleScrollGrid('left')}
                    title="Scroll Left"
                    aria-label="Scroll Left"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="btn-hub-scroll"
                    onClick={() => handleScrollGrid('right')}
                    title="Scroll Right"
                    aria-label="Scroll Right"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={gridScrollRef}
              onWheel={handleGridWheel}
              onMouseDown={handleGridMouseDown}
              onMouseMove={handleGridMouseMove}
              onMouseUp={handleGridMouseUp}
              onMouseLeave={handleGridMouseUp}
              className={`hub-modules-grid ${isMouseDownDragging ? 'is-dragging' : ''}`}
            >
              {ENTERPRISE_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className={`module-card ${mod.isActive ? 'active-system' : 'roadmap-system'}`}
                  onClick={(e) => {
                    if (dragInfoRef.current.hasMoved) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    if (mod.isActive) {
                      launchPermitsSystem('home');
                    } else {
                      setPreviewModule(mod);
                    }
                  }}
                  style={{ cursor: isMouseDownDragging ? 'grabbing' : 'pointer' }}
                  title={mod.isActive ? `Launch ${mod.name}` : `Click to view architectural scope for ${mod.name}`}
                >
                  <div className="module-card-top">
                    <div className="module-icon-box">{mod.icon}</div>
                    <span className={`module-status-badge ${mod.badgeClass || (mod.isActive ? 'live' : 'roadmap')}`}>
                      {mod.isActive ? '● Active System' : mod.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="module-title">{mod.name}</h4>
                    <p className="module-desc">{mod.desc}</p>
                    <div className="module-capabilities-list">
                      {mod.capabilities.map((cap) => (
                        <span key={cap} className="cap-tag">{cap}</span>
                      ))}
                    </div>
                  </div>

                  <div className="module-card-footer">
                    <span className="module-metrics-text">{mod.metrics}</span>
                    {mod.isActive ? (
                      <button
                        type="button"
                        className="btn-launch-module"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (dragInfoRef.current.hasMoved) return;
                          launchPermitsSystem('home');
                        }}
                      >
                        Launch System →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-explore-module"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (dragInfoRef.current.hasMoved) return;
                          setPreviewModule(mod);
                        }}
                      >
                        View Architecture &amp; Scope 🔍
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* 3. Main View 2: Permits & Licenses Monitoring System (Active Module Page) */}
      {activeMainModule === 'permits' && (
        <PermitsMonitoringSystem
          parsedDataCache={parsedDataCache}
          summaryData={summaryData}
          targetSheets={targetSheets}
          plantRegions={plantRegions}
          isLoading={isLoading}
          currentTheme={currentTheme}
          onSelectTheme={handleThemeChange}
          fileName={fileName}
          fileSize={fileSize}
          sourceType={sourceType}
          subTab={permitsView}
          onNavigateToTable={handleNavigateToTable}
          onNavigateHome={handleNavigateHome}
          onNavigateSummary={handleNavigateSummary}
          targetPlant={targetPlant}
          setTargetPlant={setTargetPlant}
          targetSearch={targetSearch}
          onSyncData={handleSyncData}
          onUploadFile={() => setShowUploadModal(true)}
        />
      )}

      {/* 3. Main View 3: SourceExcel (Master Data Spreadsheets per Module) */}
      {activeMainModule === 'sourceExcel' && (
        <main className="source-excel-main-wrapper">
          <SourceExcel
            modules={ENTERPRISE_MODULES}
            moduleDatasets={moduleDatasets}
            onSwitchModuleFile={handleSwitchModuleFile}
            onUploadModuleFile={handleUploadModuleFile}
            onReloadDefault={loadDefaultFile}
            onNavigateHome={() => setActiveMainModule('hub')}
            onLaunchPermits={() => launchPermitsSystem('home')}
            currentTheme={currentTheme}
          />
        </main>
      )}

      {/* 4. Future Feature Scope Modal */}
      {previewModule && (
        <div className="modal-overlay" onClick={() => setPreviewModule(null)}>
          <div
            className="modal-card roadmap-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="module-status-badge roadmap">{previewModule.status}</span>
                <h3 style={{ marginTop: '0.4rem' }}>{previewModule.icon} {previewModule.name}</h3>
                <p>Enterprise Architectural Scope &bull; Future Expansion Feature</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setPreviewModule(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                {previewModule.desc}
              </p>

              <div>
                <strong style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--theme-accent)' }}>
                  Planned Core Capabilities:
                </strong>
                <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.84rem', lineHeight: '1.6', color: 'var(--text-body)' }}>
                  {previewModule.capabilities.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--theme-accent)' }}>
                  Key Architectural Highlights:
                </strong>
                <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.84rem', lineHeight: '1.6', color: 'var(--text-body)' }}>
                  {previewModule.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPreviewModule(null)}
              >
                Close Preview
              </button>
              <button
                type="button"
                className="btn-launch-module"
                onClick={() => {
                  setPreviewModule(null);
                  launchPermitsSystem('home');
                }}
              >
                Return to Live System →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Upload File Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div
            className="modal-card upload-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Upload Plant Monitoring Spreadsheet</h3>
                <p>Upload a local Excel master workbook (.xlsx, .xls) to update the compliance cache.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                className="modal-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="dropzone-icon">📊</div>
                <h4>Select or Drag &amp; Drop Spreadsheet</h4>
                <p>Upload an updated workbook containing plant monitoring sheets.</p>
                <button type="button" className="btn-browse-file">
                  Browse From Computer
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    handleFileUpload(e);
                    setShowUploadModal(false);
                  }}
                  accept=".xlsx, .xls"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <footer className="panb-footer">
        <div className="footer-left">
          <span>PANB Operations &amp; Regulatory Compliance Portal &bull; 2026</span>
          <span className="footer-separator">&bull;</span>
          <span>Target Prefixes: <strong>BMP</strong>, <strong>MPH</strong>, <strong>MPPP</strong>, <strong>MPF</strong></span>
        </div>
        <div className="footer-right">
          <span>Active Dataset: <strong>{fileName || '2026 Monitoring v3'}</strong></span>
          <span className="footer-separator">&bull;</span>
          <span>Facilities: <strong>{targetSheets.length || 23} Operating Plants</strong></span>
        </div>
      </footer>
    </div>
  );
}
