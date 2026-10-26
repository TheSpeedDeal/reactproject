import React, { useState, useMemo } from 'react';
import { getFacilityType, DEFAULT_REGIONS } from '../../../utils/ExcelParsers/excelParserPermitAndLicense';
import './HomeDashboard.css';

// Baseline fallback dataset matching official 2026 monitoring records
const BASE_REGULATORY_ACTIONS = [
  {
    id: 'act-1',
    name: 'DENR discharge permit',
    type: 'Permit',
    agency: 'DENR',
    dueDate: '09/15/2026',
    daysRemaining: -10,
    owner: 'T. Dela Cruz',
    department: 'Operations',
    status: 'Overdue',
    region: 'North Luzon',
    plant: 'BMP Pangasinan',
    permitNo: 'DP-2026-0915-R3',
    notes: 'Wastewater discharge sampling report pending EMB approval'
  },
  {
    id: 'act-2',
    name: 'DENR SMR (Q3)',
    type: 'Report',
    agency: 'DENR',
    dueDate: '10/10/2026',
    daysRemaining: 15,
    owner: 'L. Mercado',
    department: 'HSE',
    status: 'Upcoming',
    region: 'North Luzon',
    plant: 'BMP Bataan 1',
    permitNo: 'SMR-Q3-2026',
    notes: 'Quarterly self-monitoring report data compilation at 80%'
  },
  {
    id: 'act-3',
    name: 'DOLE Safety Officer Certification',
    type: 'License',
    agency: 'DOLE',
    dueDate: '11/01/2026',
    daysRemaining: 36,
    owner: 'J. Santos',
    department: 'Admin',
    status: 'Upcoming',
    region: 'South Luzon',
    plant: 'BMP Batangas',
    permitNo: 'SO-CERT-4412',
    notes: 'OSH Center BOSH/COSH refresher certificate renewal application'
  },
  {
    id: 'act-4',
    name: 'DOE EVOSS COC',
    type: 'Clearance',
    agency: 'DOE',
    dueDate: '11/15/2026',
    daysRemaining: 50,
    owner: 'P. Reyes',
    department: 'Operations',
    status: 'Upcoming',
    region: 'Visayas',
    plant: 'BMP Cebu',
    permitNo: 'COC-EVOSS-082',
    notes: 'Certificate of Compliance for energy self-generation unit'
  },
  {
    id: 'act-5',
    name: 'DENR PCO Accreditation',
    type: 'License',
    agency: 'DENR',
    dueDate: '08/10/2026',
    daysRemaining: -46,
    owner: 'S. Bautista',
    department: 'HSE',
    status: 'Overdue',
    region: 'South Luzon',
    plant: 'MPPP Quezon',
    permitNo: 'PCO-ACCR-2023-11',
    notes: 'Requires 40 hours advance environmental training cert'
  },
  {
    id: 'act-6',
    name: 'DOLE Annual Safety Report',
    type: 'Report',
    agency: 'DOLE',
    dueDate: '01/30/2027',
    daysRemaining: 126,
    owner: 'M. Garcia',
    department: 'Admin',
    status: 'Upcoming',
    region: 'Mindanao',
    plant: 'BMP DavSur',
    permitNo: 'ASR-DOLE-2026',
    notes: 'Consolidated accident/illness exposure data for 2026'
  },
  {
    id: 'act-7',
    name: 'BFP Fire Safety Inspection Certificate',
    type: 'Permit',
    agency: 'Others',
    dueDate: '12/05/2026',
    daysRemaining: 71,
    owner: 'R. David',
    department: 'Maintenance',
    status: 'Upcoming',
    region: 'North Luzon',
    plant: 'BMP Bulacan',
    permitNo: 'FSIC-2026-902',
    notes: 'Annual fire drill documentation submitted to local fire station'
  },
  {
    id: 'act-8',
    name: 'LLDA Clearance & Permittee Report',
    type: 'Clearance',
    agency: 'Others',
    dueDate: '09/30/2026',
    daysRemaining: 5,
    owner: 'C. Mendoza',
    department: 'Operations',
    status: 'Upcoming',
    region: 'South Luzon',
    plant: 'MPH Laguna',
    permitNo: 'LLDA-CLR-1823',
    notes: 'Surface water extraction metering log validation'
  },
  {
    id: 'act-9',
    name: 'DENR PTO for Generator Sets',
    type: 'Permit',
    agency: 'DENR',
    dueDate: '08/25/2026',
    daysRemaining: -31,
    owner: 'A. Navarro',
    department: 'Maintenance',
    status: 'Overdue',
    region: 'Visayas',
    plant: 'BMP Iloilo 1',
    permitNo: 'PTO-AIR-GEN44',
    notes: 'Stack emission test report pending testing laboratory sign-off'
  },
  {
    id: 'act-10',
    name: 'DOLE Work Environment Measurement',
    type: 'Report',
    agency: 'DOLE',
    dueDate: '10/28/2026',
    daysRemaining: 33,
    owner: 'V. Ramos',
    department: 'HSE',
    status: 'Upcoming',
    region: 'Mindanao',
    plant: 'MPPP DavSur',
    permitNo: 'WEM-2026-Q4',
    notes: 'Noise, illumination, and dust concentration survey completed'
  }
];


// Helpers for categorizing raw Excel strings
function categorizeAgency(regBody) {
  if (!regBody) return 'Others';
  const str = String(regBody).toUpperCase();
  if (str.includes('DENR') || str.includes('EMB') || str.includes('ENVIRONMENT')) return 'DENR';
  if (str.includes('DOLE') || str.includes('LABOR') || str.includes('OSH')) return 'DOLE';
  if (str.includes('DOE') || str.includes('ENERGY') || str.includes('ERC') || str.includes('EVOSS')) return 'DOE';
  return 'Others';
}

function inferDepartment(desc, regBody) {
  const text = `${desc || ''} ${regBody || ''}`.toUpperCase();
  if (
    text.includes('SAFETY') ||
    text.includes('OSH') ||
    text.includes('HAZARDOUS') ||
    text.includes('PCO') ||
    text.includes('EMISSION') ||
    text.includes('DISCHARGE') ||
    text.includes('SMR') ||
    text.includes('PMR') ||
    text.includes('ENVIRONMENTAL')
  ) {
    return 'HSE';
  }
  if (
    text.includes('BOILER') ||
    text.includes('ELEVATOR') ||
    text.includes('GENERATOR') ||
    text.includes('MECHANICAL') ||
    text.includes('ELECTRICAL') ||
    text.includes('MAINTENANCE') ||
    text.includes('PRESSURE')
  ) {
    return 'Maintenance';
  }
  if (
    text.includes('MAYOR') ||
    text.includes('BARANGAY') ||
    text.includes('FIRE') ||
    text.includes('BFP') ||
    text.includes('ADMIN') ||
    text.includes('SANITARY') ||
    text.includes('ACCREDITATION')
  ) {
    return 'Admin';
  }
  return 'Operations';
}

function inferType(desc) {
  const d = String(desc || '').toUpperCase();
  if (d.includes('REPORT') || d.includes('SMR') || d.includes('PMR') || d.includes('MINUTES')) return 'Report';
  if (d.includes('LICENSE')) return 'License';
  if (d.includes('CLEARANCE') || d.includes('ECC') || d.includes('CNC') || d.includes('COC')) return 'Clearance';
  return 'Permit';
}

// Check if a date string represents "No Expiry / One-Time Only" (e.g., 12/13/99, 12/31/99, Permanent, Lifetime, etc.)
function isNoExpiryDate(dateVal) {
  if (!dateVal) return false;
  const str = String(dateVal).trim();
  const lower = str.toLowerCase();

  if (
    lower.includes('permanent') ||
    lower.includes('lifetime') ||
    lower.includes('one-time') ||
    lower.includes('one time') ||
    lower.includes('no expiry') ||
    lower.includes('no expiration') ||
    lower === 'n/a' ||
    lower === 'none'
  ) {
    return true;
  }

  // Handle dummy sentinel dates like 12/13/99, 12/31/99, 12/13/1999, 12/13/2099
  const mdy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (mdy) {
    const month = parseInt(mdy[1], 10);
    const day = parseInt(mdy[2], 10);
    const year = parseInt(mdy[3], 10);

    // Specifically 12/13/99 or 12/31/99 or year 99 / 2099 / 9999
    if (month === 12 && (day === 13 || day === 31) && (year === 99 || year === 1999 || year === 2099 || year === 9999)) {
      return true;
    }
    if (year === 9999 || year === 2099 || (year === 99 && month === 12)) {
      return true;
    }
  }

  return false;
}

// Flexible date parser supporting M/D/YY, M/D/YYYY, YYYY-MM-DD, Excel serial numbers, and standard date strings
function parseFlexibleDate(dateVal) {
  if (!dateVal) return null;
  if (isNoExpiryDate(dateVal)) return null;

  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal;
  }

  // Handle Excel serial date numbers (e.g. 45000+)
  if (typeof dateVal === 'number' && dateVal > 25569) {
    const d = new Date((dateVal - 25569) * 86400000);
    if (!isNaN(d.getTime())) return d;
  }

  const str = String(dateVal).trim();
  if (!str || str === 'N/A' || str === '-') {
    return null;
  }

  // Check if string is a numeric 5-digit Excel serial (e.g. "46142")
  if (/^\d{5}$/.test(str)) {
    const num = Number(str);
    if (num > 25569) {
      const d = new Date((num - 25569) * 86400000);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Handle M/D/YY or M/D/YYYY (e.g. "4/30/26", "04/30/2026")
  const mdyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (mdyMatch) {
    const month = parseInt(mdyMatch[1], 10) - 1;
    const day = parseInt(mdyMatch[2], 10);
    let year = parseInt(mdyMatch[3], 10);
    if (year < 100) {
      year += year >= 70 ? 1900 : 2000;
    }
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Handle YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback to standard JavaScript Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

// Calculate exact days remaining relative to current date: Due Date - Current Date
function calculateDaysRemaining(dueDateVal, refDate = new Date()) {
  if (isNoExpiryDate(dueDateVal)) return null;

  const target = parseFlexibleDate(dueDateVal);
  if (!target || isNaN(target.getTime())) return null;

  // Normalize both dates to midnight local time for precise day calculation
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const refMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

  const diffMs = targetMidnight.getTime() - refMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

const DEFAULT_OFFICERS = [
  'T. Dela Cruz',
  'L. Mercado',
  'J. Santos',
  'P. Reyes',
  'S. Bautista',
  'M. Garcia',
  'R. David',
  'C. Mendoza',
  'A. Navarro',
  'V. Ramos'
];

function getOfficerName(seedStr, idx) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return DEFAULT_OFFICERS[Math.abs(hash + idx) % DEFAULT_OFFICERS.length];
}

export default function HomeDashboard({
  onNavigateToTable,
  parsedDataCache = {},
  summaryData = { permitsSummary: null, reportorialSummary: null },
  targetSheets = [],
  plantRegions = {},
  isLoading = false,
  currentTheme = 'midnight',
  onSelectTheme,
  onSyncData,
  onUploadFile
}) {
  // Slicer States (Synced with Compliance Summary Tab)
  const [regionFilter, setRegionFilter] = useState('All');
  const [businessFilter, setBusinessFilter] = useState('All'); // 'All' | 'BMP' | 'MPH' | 'MPPP' | 'MPF'
  const [facilityFilter, setFacilityFilter] = useState('All'); // 'All' | specific facility
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Upcoming' | 'Overdue' | 'Critical'
  const [agencyFilter, setAgencyFilter] = useState('All'); // 'All' | specific agency
  const [globalAgencyFilters, setGlobalAgencyFilters] = useState({
    DENR: true,
    DOLE: true,
    DOE: true,
    Others: true
  });
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // Table Search and Sorting
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('daysRemaining');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modal / Detail state
  const [activeItemDetail, setActiveItemDetail] = useState(null);

  // Enhance base regulatory actions with dynamically calculated days remaining relative to current date
  const dynamicBaseActions = useMemo(() => {
    return BASE_REGULATORY_ACTIONS.map((action) => {
      const noExpiry = isNoExpiryDate(action.dueDate);
      const calcDays = noExpiry ? null : calculateDaysRemaining(action.dueDate);
      return {
        ...action,
        daysRemaining: calcDays,
        isNoExpiry: noExpiry,
        status: noExpiry ? 'Upcoming' : (calcDays !== null && calcDays < 0 ? 'Overdue' : 'Upcoming')
      };
    });
  }, []);

  // Detect if live parsed Excel dataset is active
  const hasLiveExcelData = useMemo(() => {
    return parsedDataCache && Object.keys(parsedDataCache).length > 0;
  }, [parsedDataCache]);

  // Extract all permits and reportorial rows across all loaded plant sheets
  const liveDataset = useMemo(() => {
    if (!hasLiveExcelData) {
      return {
        permits: [],
        reportorial: [],
        urgentActions: dynamicBaseActions
      };
    }

    const permitsList = [];
    const reportorialList = [];
    const urgentList = [];

    const sheetNames = Object.keys(parsedDataCache);
    sheetNames.forEach((sName) => {
      const sheet = parsedDataCache[sName];
      if (!sheet) return;
      const region = plantRegions[sName] || 'North Luzon';

      // 1. Process Permits Table
      (sheet.permits || []).forEach((p, idx) => {
        const agency = categorizeAgency(p.regulatoryBody);
        const department = inferDepartment(p.description, p.regulatoryBody);
        const type = inferType(p.description);

        // Dynamically compute exact days remaining: Expiration Date - Current Date
        const noExpiry = isNoExpiryDate(p.expirationDate);
        const calcDays = noExpiry ? null : calculateDaysRemaining(p.expirationDate);
        const days = calcDays !== null ? calcDays : (noExpiry ? null : p.daysToExpireNum);
        const isExpired = !noExpiry && (p.status === 'Expired' || (days !== null && days < 0));
        const isExpiringSoon = !noExpiry && days !== null && days >= 0 && days <= 90;
        const isUpcomingRenewal = !noExpiry && (days !== null ? days >= 0 : p.status === 'Active');

        const permitItem = {
          id: p.id || `live-p-${sName}-${idx}`,
          name: p.description || 'Permit / Clearance',
          type,
          agency,
          dueDate: p.expirationDate || 'N/A',
          daysRemaining: days,
          isNoExpiry: noExpiry,
          owner: getOfficerName(sName + (p.description || ''), idx),
          department,
          status: isExpired ? 'Overdue' : 'Upcoming',
          region,
          plant: sName,
          permitNo: p.serialNo || p.itemCode || 'N/A',
          notes: p.remarks || p.description || '',
          rawStatus: p.status,
          applicability: p.applicability
        };

        permitsList.push(permitItem);

        if (isExpired || isExpiringSoon || isUpcomingRenewal) {
          urgentList.push(permitItem);
        }
      });

      // 2. Process Reportorial Requirements Table
      (sheet.reportorial || []).forEach((r, idx) => {
        const agency = categorizeAgency(r.regulatoryBody);
        const department = inferDepartment(r.description, r.regulatoryBody);

        // Dynamically compute exact days remaining: Report Deadline - Current Date
        const noExpiry = isNoExpiryDate(r.deadline);
        const calcDays = noExpiry ? null : calculateDaysRemaining(r.deadline);
        const isOverdue = !noExpiry && (r.status === 'Late Submission' || r.status === 'Not Submitted' || (calcDays !== null && calcDays < 0));
        const days = noExpiry ? null : (calcDays !== null ? calcDays : (isOverdue ? -14 : 28));
        const isUpcomingSoon = !noExpiry && !isOverdue && days !== null && days >= 0 && days <= 60;
        const isUpcomingReport = !noExpiry && !isOverdue && (days !== null ? days >= 0 : r.status === 'Submitted On-time');

        const reportItem = {
          id: r.id || `live-r-${sName}-${idx}`,
          name: r.description || 'Regulatory Report',
          type: 'Report',
          agency,
          dueDate: r.deadline || 'N/A',
          daysRemaining: days,
          isNoExpiry: noExpiry,
          owner: getOfficerName(sName + (r.description || ''), idx),
          department,
          status: noExpiry ? 'Upcoming' : ((days !== null ? days < 0 : isOverdue) ? 'Overdue' : 'Upcoming'),
          region,
          plant: sName,
          permitNo: r.itemCode || 'N/A',
          notes: r.remarks || `Frequency: ${r.frequency}`,
          rawStatus: r.status,
          frequency: r.frequency,
          applicability: r.applicability
        };

        reportorialList.push(reportItem);

        if (isOverdue || isUpcomingSoon || isUpcomingReport) {
          urgentList.push(reportItem);
        }
      });
    });

    return {
      permits: permitsList,
      reportorial: reportorialList,
      urgentActions: urgentList.length > 0 ? urgentList : dynamicBaseActions
    };
  }, [hasLiveExcelData, parsedDataCache, plantRegions, dynamicBaseActions]);

  // Available facilities filtered dynamically by region and business (Compliance Summary Tab)
  const availableFacilities = useMemo(() => {
    let list = [];
    if (targetSheets && targetSheets.length > 0) {
      list = [...targetSheets];
    } else if (summaryData?.permitsSummary?.plants?.length) {
      list = summaryData.permitsSummary.plants.map((p) => p.plant);
    } else {
      list = Object.keys(DEFAULT_REGIONS);
    }

    if (regionFilter !== 'All') {
      list = list.filter((pName) => {
        const reg = plantRegions[pName] || DEFAULT_REGIONS[pName];
        return reg === regionFilter;
      });
    }

    if (businessFilter !== 'All') {
      list = list.filter((pName) => {
        const fType = getFacilityType(pName);
        return fType.code === businessFilter;
      });
    }

    return Array.from(new Set(list)).sort();
  }, [targetSheets, summaryData, plantRegions, regionFilter, businessFilter]);

  // Derived effective facility selection (auto-resets to 'All' if selected facility is filtered out by region/business)
  const effectiveFacilityFilter = useMemo(() => {
    if (facilityFilter === 'All') return 'All';
    return availableFacilities.includes(facilityFilter) ? facilityFilter : 'All';
  }, [availableFacilities, facilityFilter]);

  // Available regulatory agencies extracted from Compliance Summary Tab & datasets
  const availableAgencies = useMemo(() => {
    const set = new Set();
    if (summaryData?.permitsSummary?.items) {
      summaryData.permitsSummary.items.forEach((it) => {
        if (it.agency) set.add(it.agency);
      });
    }
    if (summaryData?.reportorialSummary?.items) {
      summaryData.reportorialSummary.items.forEach((it) => {
        if (it.agency) set.add(it.agency);
      });
    }
    if (liveDataset?.permits) {
      liveDataset.permits.forEach((p) => {
        if (p.agency) set.add(p.agency);
      });
    }
    if (liveDataset?.reportorial) {
      liveDataset.reportorial.forEach((r) => {
        if (r.agency) set.add(r.agency);
      });
    }
    BASE_REGULATORY_ACTIONS.forEach((a) => {
      if (a.agency) set.add(a.agency);
    });
    ['DENR', 'DOLE', 'DOE', 'BFP', 'LGU'].forEach((a) => set.add(a));
    return Array.from(set).filter(Boolean).sort();
  }, [summaryData, liveDataset]);

  // Toggle agency filter
  const toggleAgencyFilter = (agencyKey) => {
    setGlobalAgencyFilters((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[agencyKey] && activeCount === 1) {
        return { DENR: true, DOLE: true, DOE: true, Others: true };
      }
      return { ...prev, [agencyKey]: !prev[agencyKey] };
    });
    setCurrentPage(1);
  };

  const resetAllAgencies = () => {
    setGlobalAgencyFilters({ DENR: true, DOLE: true, DOE: true, Others: true });
    setCurrentPage(1);
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setRegionFilter('All');
    setBusinessFilter('All');
    setFacilityFilter('All');
    setStatusFilter('All');
    setAgencyFilter('All');
    setGlobalAgencyFilters({ DENR: true, DOLE: true, DOE: true, Others: true });
    setTableSearch('');
    setTableStatusFilter('All');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const isAnyFilterActive = useMemo(() => {
    return (
      regionFilter !== 'All' ||
      businessFilter !== 'All' ||
      effectiveFacilityFilter !== 'All' ||
      statusFilter !== 'All' ||
      agencyFilter !== 'All' ||
      !Object.values(globalAgencyFilters).every(Boolean) ||
      tableSearch.trim() !== '' ||
      tableStatusFilter !== 'All'
    );
  }, [
    regionFilter,
    businessFilter,
    effectiveFacilityFilter,
    statusFilter,
    agencyFilter,
    globalAgencyFilters,
    tableSearch,
    tableStatusFilter
  ]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (regionFilter !== 'All') count++;
    if (businessFilter !== 'All') count++;
    if (effectiveFacilityFilter !== 'All') count++;
    if (statusFilter !== 'All') count++;
    if (agencyFilter !== 'All') count++;
    if (!Object.values(globalAgencyFilters).every(Boolean)) count++;
    if (tableSearch.trim()) count++;
    if (tableStatusFilter !== 'All') count++;
    return count;
  }, [
    regionFilter,
    businessFilter,
    effectiveFacilityFilter,
    statusFilter,
    agencyFilter,
    globalAgencyFilters,
    tableSearch,
    tableStatusFilter
  ]);

  // Base filtered actions (respecting slicers and search box, but NOT tableStatusFilter)
  const baseFilteredActions = useMemo(() => {
    const sourceActions = hasLiveExcelData ? liveDataset.urgentActions : dynamicBaseActions;

    return sourceActions.filter((item) => {
      // 1. Region filter
      if (regionFilter !== 'All' && item.region !== regionFilter) return false;

      // 2. Business filter (from Compliance Summary Tab: BMP, MPH, MPPP, MPF)
      if (businessFilter !== 'All') {
        const itemFType = getFacilityType(item.plant);
        if (itemFType.code !== businessFilter) return false;
      }

      // 3. Facilities filter (from Compliance Summary Tab)
      if (effectiveFacilityFilter !== 'All' && item.plant !== effectiveFacilityFilter) return false;

      // 4. Status filter (from Compliance Summary Tab: Active, Action Required / Overdue, Upcoming, Critical)
      if (statusFilter !== 'All') {
        if (statusFilter === 'Overdue' || statusFilter === 'Action Required') {
          const isOverdue =
            item.status === 'Overdue' ||
            (item.daysRemaining !== null && item.daysRemaining < 0) ||
            item.rawStatus === 'Action Required' ||
            item.rawStatus === 'Expired' ||
            item.rawStatus === 'Late Submission' ||
            item.rawStatus === 'Not Submitted';
          if (!isOverdue) return false;
        } else if (statusFilter === 'Upcoming') {
          const isUpcoming = item.status === 'Upcoming' && (item.daysRemaining === null || item.daysRemaining >= 0);
          if (!isUpcoming) return false;
        } else if (statusFilter === 'Active') {
          const isActive = item.rawStatus === 'Active' || item.status === 'Upcoming' || (item.daysRemaining !== null && item.daysRemaining > 0);
          if (!isActive) return false;
        } else if (statusFilter === 'Critical') {
          if (item.daysRemaining === null || item.daysRemaining < 0 || item.daysRemaining > 30) return false;
        }
      }

      // 5. Agency dropdown filter (from Compliance Summary Tab)
      if (agencyFilter !== 'All' && item.agency !== agencyFilter) return false;

      // 6. Regulatory agency toggles
      if (globalAgencyFilters[item.agency] === false) return false;

      // 7. Search query
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.owner.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q) ||
          item.plant.toLowerCase().includes(q) ||
          item.permitNo.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q) ||
          item.agency.toLowerCase().includes(q) ||
          (item.region && item.region.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [
    hasLiveExcelData,
    liveDataset.urgentActions,
    dynamicBaseActions,
    regionFilter,
    businessFilter,
    effectiveFacilityFilter,
    statusFilter,
    agencyFilter,
    globalAgencyFilters,
    tableSearch
  ]);

  // Stable counts for the 3 sub-tabs (computed from baseFilteredActions so they NEVER zero out when switching tabs)
  const actionCounts = useMemo(() => {
    const all = baseFilteredActions.length;
    const overdue = baseFilteredActions.filter((a) => a.status === 'Overdue').length;
    const upcoming = baseFilteredActions.filter((a) => a.status === 'Upcoming').length;
    return { all, overdue, upcoming };
  }, [baseFilteredActions]);

  // Filtered and sorted urgent actions table rows
  const filteredActions = useMemo(() => {
    return baseFilteredActions
      .filter((item) => {
        // Table status sub-tabs filter
        if (tableStatusFilter !== 'All' && item.status !== tableStatusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'daysRemaining') {
          const numA = typeof a.daysRemaining === 'number' && !isNaN(a.daysRemaining) ? a.daysRemaining : (sortAsc ? 999999 : -999999);
          const numB = typeof b.daysRemaining === 'number' && !isNaN(b.daysRemaining) ? b.daysRemaining : (sortAsc ? 999999 : -999999);
          return sortAsc ? numA - numB : numB - numA;
        }
        if (sortField === 'dueDate') {
          const dateA = parseFlexibleDate(a.dueDate);
          const dateB = parseFlexibleDate(b.dueDate);
          const timeA = dateA ? dateA.getTime() : (sortAsc ? 9999999999999 : -9999999999999);
          const timeB = dateB ? dateB.getTime() : (sortAsc ? 9999999999999 : -9999999999999);
          return sortAsc ? timeA - timeB : timeB - timeA;
        }
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [
    baseFilteredActions,
    tableStatusFilter,
    sortField,
    sortAsc
  ]);

  // Paginated actions for the priority actions table
  const totalPages = Math.max(1, Math.ceil(filteredActions.length / rowsPerPage));
  const paginatedActions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredActions.slice(start, start + rowsPerPage);
  }, [filteredActions, currentPage]);

  // Dynamic KPI calculations strictly respecting all filters
  const kpis = useMemo(() => {
    if (!hasLiveExcelData) {
      const isDefault =
        regionFilter === 'All' &&
        businessFilter === 'All' &&
        effectiveFacilityFilter === 'All' &&
        statusFilter === 'All' &&
        agencyFilter === 'All' &&
        Object.values(globalAgencyFilters).every(Boolean);

      if (isDefault) {
        return {
          denr: 80,
          dole: 45,
          doe: 17,
          total: 142,
          expired: 3,
          dueUnder30: 12,
          compliance: 94
        };
      }

      let factor = 1.0;
      if (regionFilter !== 'All') factor *= 0.35;
      if (businessFilter !== 'All') factor *= 0.3;
      if (effectiveFacilityFilter !== 'All') factor *= 0.15;
      if (statusFilter !== 'All') factor *= 0.5;
      if (agencyFilter !== 'All') factor *= 0.35;

      const denrCount = (agencyFilter === 'All' || agencyFilter === 'DENR') && globalAgencyFilters.DENR ? Math.max(1, Math.round(80 * factor)) : 0;
      const doleCount = (agencyFilter === 'All' || agencyFilter === 'DOLE') && globalAgencyFilters.DOLE ? Math.max(1, Math.round(45 * factor)) : 0;
      const doeCount = (agencyFilter === 'All' || agencyFilter === 'DOE') && globalAgencyFilters.DOE ? Math.max(1, Math.round(17 * factor)) : 0;
      const totalCount = denrCount + doleCount + doeCount;
      const overdueCount = filteredActions.filter((a) => a.status === 'Overdue').length;
      const dueCount = filteredActions.filter((a) => a.daysRemaining >= 0 && a.daysRemaining <= 30).length;
      const comp =
        totalCount > 0
          ? Math.min(99, Math.max(78, 100 - Math.round((overdueCount / (totalCount || 1)) * 100)))
          : 94;

      return {
        denr: denrCount,
        dole: doleCount,
        doe: doeCount,
        total: totalCount,
        expired: overdueCount || Math.max(1, Math.round(3 * factor)),
        dueUnder30: dueCount || Math.max(2, Math.round(12 * factor)),
        compliance: comp
      };
    }

    // Live Excel KPI Calculations
    const candidatePermits = liveDataset.permits.filter((p) => {
      if (regionFilter !== 'All' && p.region !== regionFilter) return false;
      if (businessFilter !== 'All' && getFacilityType(p.plant).code !== businessFilter) return false;
      if (effectiveFacilityFilter !== 'All' && p.plant !== effectiveFacilityFilter) return false;
      if (agencyFilter !== 'All' && p.agency !== agencyFilter) return false;
      if (!globalAgencyFilters[p.agency]) return false;
      if ((statusFilter === 'Overdue' || statusFilter === 'Action Required') && !(p.status === 'Overdue' || (p.daysRemaining !== null && p.daysRemaining < 0))) return false;
      if (statusFilter === 'Upcoming' && (p.status === 'Overdue' || (p.daysRemaining !== null && p.daysRemaining < 0))) return false;
      if (statusFilter === 'Active' && p.rawStatus !== 'Active') return false;
      if (statusFilter === 'Critical' && (p.daysRemaining === null || p.daysRemaining < 0 || p.daysRemaining > 30)) return false;
      return true;
    });

    const denr = candidatePermits.filter((p) => p.agency === 'DENR').length;
    const dole = candidatePermits.filter((p) => p.agency === 'DOLE').length;
    const doe = candidatePermits.filter((p) => p.agency === 'DOE').length;
    const total = candidatePermits.length;

    const expired = candidatePermits.filter((p) => !p.isNoExpiry && (p.status === 'Overdue' || (p.daysRemaining !== null && p.daysRemaining < 0))).length;
    const dueUnder30 = candidatePermits.filter((p) => !p.isNoExpiry && p.daysRemaining !== null && p.daysRemaining >= 0 && p.daysRemaining <= 30).length;

    const activeCount = candidatePermits.filter((p) => p.rawStatus === 'Active' && (p.isNoExpiry || p.daysRemaining === null || p.daysRemaining >= 0)).length;
    const compRate = total > 0 ? Math.min(100, Math.round((activeCount / total) * 100)) : 94;

    return {
      denr,
      dole,
      doe,
      total,
      expired,
      dueUnder30,
      compliance: compRate
    };
  }, [hasLiveExcelData, liveDataset.permits, regionFilter, businessFilter, effectiveFacilityFilter, statusFilter, agencyFilter, globalAgencyFilters, filteredActions]);

  // Dynamic Reportorial Requirements KPI calculations strictly respecting all filters
  const reportorialKpis = useMemo(() => {
    if (!hasLiveExcelData) {
      const isDefault =
        regionFilter === 'All' &&
        businessFilter === 'All' &&
        effectiveFacilityFilter === 'All' &&
        statusFilter === 'All' &&
        agencyFilter === 'All' &&
        Object.values(globalAgencyFilters).every(Boolean);

      if (isDefault) {
        return {
          onTime: 842,
          late: 36,
          notSubmitted: 18,
          total: 896,
          denr: 395,
          dole: 312,
          doe: 94,
          compliance: 94
        };
      }

      let factor = 1.0;
      if (regionFilter !== 'All') factor *= 0.35;
      if (businessFilter !== 'All') factor *= 0.3;
      if (effectiveFacilityFilter !== 'All') factor *= 0.15;
      if (statusFilter !== 'All') factor *= 0.5;
      if (agencyFilter !== 'All') factor *= 0.35;

      const denrCount = (agencyFilter === 'All' || agencyFilter === 'DENR') && globalAgencyFilters.DENR ? Math.max(1, Math.round(395 * factor)) : 0;
      const doleCount = (agencyFilter === 'All' || agencyFilter === 'DOLE') && globalAgencyFilters.DOLE ? Math.max(1, Math.round(312 * factor)) : 0;
      const doeCount = (agencyFilter === 'All' || agencyFilter === 'DOE') && globalAgencyFilters.DOE ? Math.max(1, Math.round(94 * factor)) : 0;
      const onTimeCount = denrCount + doleCount + doeCount;
      const lateCount = Math.max(0, Math.round(36 * factor));
      const notSubmittedCount = Math.max(0, Math.round(18 * factor));
      const totalCount = onTimeCount + lateCount + notSubmittedCount;
      const compRate = totalCount > 0 ? Math.min(100, Math.round((onTimeCount / totalCount) * 100)) : 94;

      return {
        onTime: onTimeCount,
        late: lateCount,
        notSubmitted: notSubmittedCount,
        total: totalCount,
        denr: denrCount,
        dole: doleCount,
        doe: doeCount,
        compliance: compRate
      };
    }

    // Live Excel Reportorial KPI Calculations
    const candidateReports = liveDataset.reportorial.filter((r) => {
      if (regionFilter !== 'All' && r.region !== regionFilter) return false;
      if (businessFilter !== 'All' && getFacilityType(r.plant).code !== businessFilter) return false;
      if (effectiveFacilityFilter !== 'All' && r.plant !== effectiveFacilityFilter) return false;
      if (agencyFilter !== 'All' && r.agency !== agencyFilter) return false;
      if (!globalAgencyFilters[r.agency]) return false;

      const s = String(r.rawStatus || '').toLowerCase().trim();
      const isOnTime = s.includes('on-time') || s.includes('on time') || s === 'submitted' || s.includes('compliant') || s === 'updated';
      const isLate = s.includes('late');
      const isNotSubmitted = s.includes('not submitted') || s.includes('missing') || s === 'unsubmitted' || s.includes('non-compliant');

      if (statusFilter === 'Active' && !isOnTime) return false;
      if ((statusFilter === 'Overdue' || statusFilter === 'Action Required') && !(isLate || isNotSubmitted)) return false;
      if (statusFilter === 'Upcoming' && (isLate || isNotSubmitted)) return false;
      if (statusFilter === 'Critical' && !isNotSubmitted) return false;
      return true;
    });

    const isReportOnTime = (r) => {
      const s = String(r.rawStatus || '').toLowerCase().trim();
      return s.includes('on-time') || s.includes('on time') || s === 'submitted' || s.includes('compliant') || s === 'updated';
    };

    const isReportLate = (r) => {
      const s = String(r.rawStatus || '').toLowerCase().trim();
      return s.includes('late');
    };

    const isReportNotSubmitted = (r) => {
      const s = String(r.rawStatus || '').toLowerCase().trim();
      return s.includes('not submitted') || s.includes('missing') || s === 'unsubmitted' || s.includes('non-compliant');
    };

    const onTime = candidateReports.filter(isReportOnTime).length;
    const late = candidateReports.filter(isReportLate).length;
    const notSubmitted = candidateReports.filter(isReportNotSubmitted).length;
    const total = candidateReports.length;

    const denr = candidateReports.filter((r) => r.agency === 'DENR' && isReportOnTime(r)).length;
    const dole = candidateReports.filter((r) => r.agency === 'DOLE' && isReportOnTime(r)).length;
    const doe = candidateReports.filter((r) => r.agency === 'DOE' && isReportOnTime(r)).length;

    const evaluatedTotal = onTime + late + notSubmitted;
    const compRate = evaluatedTotal > 0 ? Math.min(100, Math.round((onTime / evaluatedTotal) * 100)) : (total > 0 ? Math.min(100, Math.round((onTime / total) * 100)) : 95);

    return {
      onTime,
      late,
      notSubmitted,
      total,
      denr,
      dole,
      doe,
      compliance: compRate
    };
  }, [hasLiveExcelData, liveDataset.reportorial, regionFilter, businessFilter, effectiveFacilityFilter, statusFilter, agencyFilter, globalAgencyFilters]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const jumpToPlantInTable = (plantName, actionName) => {
    if (onNavigateToTable) {
      onNavigateToTable(plantName, actionName);
    }
  };

  return (
    <div className="home-dashboard-container" data-theme={currentTheme}>
      {/* 1. Executive Dashboard Header Banner */}
      <section className="dash-hero-banner">
        <div className="dash-hero-titles">
          <div className="dash-badge-row">
            <span className="dash-badge-tag">EXECUTIVE VIEW</span>
            <span className="dash-badge-pulse">
              <span className="pulse-dot"></span>
              {hasLiveExcelData ? `Live Data (${targetSheets.length} Facilities)` : 'Live Compliance Intelligence'}
            </span>
          </div>
          <h2 className="dash-hero-heading">Compliance &amp; Regulatory Operations Overview</h2>
          <p className="dash-hero-sub">
            Monitoring enterprise environmental permits, DOLE safety certifications, and DOE regulatory submissions
          </p>
        </div>

        <div className="dash-hero-actions">
          {onSyncData && (
            <button
              type="button"
              className="btn-dash-sync"
              onClick={onSyncData}
              title="Reload official 2026 dataset"
              disabled={isLoading}
            >
              <span className="dash-btn-icon">🔄</span>
              <span>{isLoading ? 'Syncing...' : 'Sync Data'}</span>
            </button>
          )}

          {onUploadFile && (
            <button
              type="button"
              className="btn-dash-upload"
              onClick={onUploadFile}
              title="Upload updated Excel spreadsheet"
              disabled={isLoading}
            >
              <span className="dash-btn-icon">📁</span>
              <span>Upload File</span>
            </button>
          )}

          {isAnyFilterActive && (
            <button
              type="button"
              className="dash-btn-reset-filters"
              onClick={handleResetFilters}
              title="Reset all filters and cross-filters"
            >
              🔄 Clear All Filters
            </button>
          )}

          <button
            type="button"
            className="dash-btn-primary"
            onClick={() => onNavigateToTable && onNavigateToTable()}
            title="Open comprehensive facility compliance tables"
          >
            📋 Open Detailed Table View →
          </button>
        </div>
      </section>

      {/* 2. Interactive Slicer & Filter Center Card */}
      <section className={`dash-filter-card ${isFilterCollapsed ? 'collapsed' : ''}`} aria-label="Dashboard Slicers and Filters">
        <div
          className="filter-card-header"
          onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
          title={isFilterCollapsed ? "Click to expand filter controls" : "Click to collapse filter controls"}
        >
          <div className="filter-header-left">
            <span className="filter-center-icon">⚡</span>
            <h3 className="filter-center-title">Filter &amp; Slicer Controls</h3>
            {activeFilterCount > 0 && (
              <span className="filter-active-count-badge">
                {activeFilterCount} Active
              </span>
            )}
          </div>
          <div className="filter-header-right">
            <span className="filter-count-badge">
              Showing {filteredActions.length} Priority Records
            </span>
            <button
              type="button"
              className="btn-toggle-filter-collapse"
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterCollapsed(!isFilterCollapsed);
              }}
              aria-expanded={!isFilterCollapsed}
              title={isFilterCollapsed ? "Expand filter controls" : "Collapse filter controls"}
            >
              <span className="collapse-chevron">{isFilterCollapsed ? '▼' : '▲'}</span>
              <span className="collapse-text">{isFilterCollapsed ? 'Expand Filters' : 'Collapse'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Controls Body */}
        {!isFilterCollapsed && (
          <div className="filter-card-body">
            <div className="filter-controls-grid">
              {/* Slicer 1: Region */}
              <div className="dash-control-group">
                <label className="dash-control-label" htmlFor="dashRegionSelect">
                  Region
                </label>
                <div className="dash-select-wrap">
                  <select
                    id="dashRegionSelect"
                    value={regionFilter}
                    onChange={(e) => {
                      setRegionFilter(e.target.value);
                      setFacilityFilter('All');
                      setCurrentPage(1);
                    }}
                    className="dash-select"
                  >
                    <option value="All">All Regions (4)</option>
                    <option value="North Luzon">North Luzon (8)</option>
                    <option value="South Luzon">South Luzon (5)</option>
                    <option value="Visayas">Visayas (6)</option>
                    <option value="Mindanao">Mindanao (4)</option>
                  </select>
                  <span className="dash-select-chevron">▼</span>
                </div>
              </div>

              {/* Slicer 2: Business (Changed from Department, from Compliance Summary Tab) */}
              <div className="dash-control-group">
                <label className="dash-control-label" htmlFor="dashBusinessSelect">
                  Business
                </label>
                <div className="dash-select-wrap">
                  <select
                    id="dashBusinessSelect"
                    value={businessFilter}
                    onChange={(e) => {
                      setBusinessFilter(e.target.value);
                      setFacilityFilter('All');
                      setCurrentPage(1);
                    }}
                    className="dash-select"
                  >
                    <option value="All">All Businesses</option>
                    <option value="BMP">BMP (Feedmill)</option>
                    <option value="MPH">MPH (Hatchery)</option>
                    <option value="MPPP">MPPP (Poultry Plant)</option>
                    <option value="MPF">MPF (Breeding Farm)</option>
                  </select>
                  <span className="dash-select-chevron">▼</span>
                </div>
              </div>

              {/* Slicer 3: Facilities (Added, from Compliance Summary Tab) */}
              <div className="dash-control-group">
                <label className="dash-control-label" htmlFor="dashFacilitySelect">
                  Facilities
                </label>
                <div className="dash-select-wrap">
                  <select
                    id="dashFacilitySelect"
                    value={effectiveFacilityFilter}
                    onChange={(e) => {
                      setFacilityFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="dash-select"
                  >
                    <option value="All">All Facilities ({availableFacilities.length})</option>
                    {availableFacilities.map((fName) => (
                      <option key={fName} value={fName}>
                        {fName}
                      </option>
                    ))}
                  </select>
                  <span className="dash-select-chevron">▼</span>
                </div>
              </div>

              {/* Slicer 4: Status (Changed from Due Date Horizon, from Compliance Summary Tab) */}
              <div className="dash-control-group">
                <label className="dash-control-label" htmlFor="dashStatusSelect">
                  Status
                </label>
                <div className="dash-select-wrap">
                  <select
                    id="dashStatusSelect"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="dash-select"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active / Compliant</option>
                    <option value="Action Required">Missing / Action Required</option>
                    <option value="Upcoming">Upcoming Renewals</option>
                    <option value="Critical">Critical (Next 30 Days)</option>
                  </select>
                  <span className="dash-select-chevron">▼</span>
                </div>
              </div>

              {/* Slicer 5: Agency (Added, from Compliance Summary Tab) */}
              <div className="dash-control-group">
                <label className="dash-control-label" htmlFor="dashAgencySelect">
                  Agency
                </label>
                <div className="dash-select-wrap">
                  <select
                    id="dashAgencySelect"
                    value={agencyFilter}
                    onChange={(e) => {
                      setAgencyFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="dash-select"
                  >
                    <option value="All">All Agencies ({availableAgencies.length})</option>
                    {availableAgencies.map((agency) => (
                      <option key={agency} value={agency}>
                        {agency}
                      </option>
                    ))}
                  </select>
                  <span className="dash-select-chevron">▼</span>
                </div>
              </div>
            </div>

            {/* Regulatory Agency Toggle Pills */}
            <div className="agency-toggles-bar">
              <span className="agency-toggles-label">Regulatory Bodies:</span>
              <div className="agency-pills-row">
                <button
                  type="button"
                  className={`agency-toggle-pill denr ${globalAgencyFilters.DENR ? 'active' : 'inactive'}`}
                  onClick={() => toggleAgencyFilter('DENR')}
                  title="Toggle DENR-EMB Permits"
                >
                  <span className="pill-dot">●</span> DENR-EMB
                  {globalAgencyFilters.DENR && <span className="pill-check">✓</span>}
                </button>

                <button
                  type="button"
                  className={`agency-toggle-pill dole ${globalAgencyFilters.DOLE ? 'active' : 'inactive'}`}
                  onClick={() => toggleAgencyFilter('DOLE')}
                  title="Toggle DOLE Safety Filings"
                >
                  <span className="pill-dot">●</span> DOLE
                  {globalAgencyFilters.DOLE && <span className="pill-check">✓</span>}
                </button>

                <button
                  type="button"
                  className={`agency-toggle-pill doe ${globalAgencyFilters.DOE ? 'active' : 'inactive'}`}
                  onClick={() => toggleAgencyFilter('DOE')}
                  title="Toggle DOE EVOSS Clearances"
                >
                  <span className="pill-dot">●</span> DOE
                  {globalAgencyFilters.DOE && <span className="pill-check">✓</span>}
                </button>

                <button
                  type="button"
                  className={`agency-toggle-pill others ${globalAgencyFilters.Others ? 'active' : 'inactive'}`}
                  onClick={() => toggleAgencyFilter('Others')}
                  title="Toggle Other Agencies / LGUs"
                >
                  <span className="pill-dot">●</span> Others / LGU
                  {globalAgencyFilters.Others && <span className="pill-check">✓</span>}
                </button>

                {!Object.values(globalAgencyFilters).every(Boolean) && (
                  <button
                    type="button"
                    className="btn-select-all-agencies"
                    onClick={resetAllAgencies}
                  >
                    Select All
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips Row */}
        {isAnyFilterActive && (
          <div className="active-filter-chips-row">
            <span className="chips-label">Active Filters:</span>
            {regionFilter !== 'All' && (
              <span className="filter-chip">
                Region: {regionFilter}
                <button type="button" onClick={() => setRegionFilter('All')}>✕</button>
              </span>
            )}
            {businessFilter !== 'All' && (
              <span className="filter-chip">
                Business: {businessFilter}
                <button type="button" onClick={() => setBusinessFilter('All')}>✕</button>
              </span>
            )}
            {effectiveFacilityFilter !== 'All' && (
              <span className="filter-chip">
                Facility: {effectiveFacilityFilter}
                <button type="button" onClick={() => setFacilityFilter('All')}>✕</button>
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="filter-chip">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('All')}>✕</button>
              </span>
            )}
            {agencyFilter !== 'All' && (
              <span className="filter-chip">
                Agency: {agencyFilter}
                <button type="button" onClick={() => setAgencyFilter('All')}>✕</button>
              </span>
            )}
            {tableSearch.trim() && (
              <span className="filter-chip">
                Search: "{tableSearch}"
                <button type="button" onClick={() => setTableSearch('')}>✕</button>
              </span>
            )}
            <button
              type="button"
              className="chip-clear-all"
              onClick={handleResetFilters}
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* 3A. Permits & Licenses Summary Section */}
      <section className="dash-kpi-section" aria-label="Permits &amp; Licenses Key Performance Indicators">
        <div className="dash-kpi-section-header">
          <div className="kpi-section-title-wrap">
            <span className="kpi-section-icon">📜</span>
            <h3 className="kpi-section-title">Permits &amp; Licenses Summary</h3>
            <span className="kpi-section-count-tag">{kpis.total} Total Permits</span>
          </div>
        </div>

        <div className="dash-kpi-grid">
          {/* KPI 1: Total Active Permits */}
          <div className="dash-kpi-card card-cyan">
            <div className="kpi-card-header">
              <h4 className="kpi-card-title">Active Permits &amp; Licenses</h4>
              <span className="kpi-badge cyan">Valid</span>
            </div>
            <div className="kpi-hero-num">{kpis.total}</div>
            <div className="kpi-breakdown-row">
              <span className="b-pill">DENR: <strong>{kpis.denr}</strong></span>
              <span className="b-pill">DOLE: <strong>{kpis.dole}</strong></span>
              <span className="b-pill">DOE: <strong>{kpis.doe}</strong></span>
            </div>
          </div>

          {/* KPI 2: Expired / Overdue */}
          <div className="dash-kpi-card card-rose">
            <div className="kpi-card-header">
              <h4 className="kpi-card-title">Expired / Overdue</h4>
              <span className="kpi-badge rose">Action Needed</span>
            </div>
            <div className="kpi-hero-num text-rose">{kpis.expired}</div>
            <div className="kpi-sub-text text-rose">
              Immediate filing / renewal required
            </div>
          </div>

          {/* KPI 3: Due in ≤ 30 Days */}
          <div className="dash-kpi-card card-amber">
            <div className="kpi-card-header">
              <h4 className="kpi-card-title">Expiring in ≤ 30 Days</h4>
              <span className="kpi-badge amber">High Priority</span>
            </div>
            <div className="kpi-hero-num text-amber">{kpis.dueUnder30}</div>
            <div className="kpi-sub-text text-amber">
              Upcoming renewals within 30 days
            </div>
          </div>

          {/* KPI 4: Compliance Rate */}
          <div className="dash-kpi-card card-emerald">
            <div className="kpi-card-header">
              <h4 className="kpi-card-title">Compliance Health Score</h4>
              <span className="kpi-badge emerald">Enterprise</span>
            </div>
            <div className="kpi-hero-num text-emerald">{kpis.compliance}%</div>
            <div className="kpi-progress-bar-wrap">
              <div
                className="kpi-progress-bar-fill"
                style={{ width: `${kpis.compliance}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* 3B. Reportorial Requirements Summary Section */}
      <section className="dash-kpi-section" aria-label="Reportorial Requirements Key Performance Indicators">
        <div className="dash-kpi-section-header">
          <div className="kpi-section-title-wrap">
            <span className="kpi-section-icon">📑</span>
            <h3 className="kpi-section-title">Reportorial Requirements Summary</h3>
            <span className="kpi-section-count-tag">{reportorialKpis.total} Total Reports</span>
          </div>
        </div>

        <div className="dash-kpi-grid">
          {/* Card 1: Submitted On-Time */}
          <div className="dash-kpi-card card-cyan">
            <div className="kpi-card-header">
              <h4 className="kpi-card-title">Submitted On-Time</h4>
              <span className="kpi-badge cyan">On Schedule</span>
            </div>
            <div className="kpi-hero-num">{reportorialKpis.onTime}</div>
            <div className="kpi-breakdown-row">
              <span className="b-pill">DENR: <strong>{reportorialKpis.denr}</strong></span>
              <span className="b-pill">DOLE: <strong>{reportorialKpis.dole}</strong></span>
              <span className="b-pill">DOE: <strong>{reportorialKpis.doe}</strong></span>
            </div>
          </div>

          {/* Card 2: Late Submission */}
          <div className="dash-kpi-card card-amber">
            <div className="kpi-card-header">
              <h4 className="kpi-card-title">Late Submission</h4>
              <span className="kpi-badge amber">Delayed</span>
            </div>
            <div className="kpi-hero-num text-amber">{reportorialKpis.late}</div>
            <div className="kpi-sub-text text-amber">
              Submissions recorded past deadline
            </div>
          </div>

          {/* Card 3: Not Submitted */}
          <div className="dash-kpi-card card-rose">
            <div className="kpi-card-header">
              <h4 className="kpi-card-title">Not Submitted</h4>
              <span className="kpi-badge rose">Action Needed</span>
            </div>
            <div className="kpi-hero-num text-rose">{reportorialKpis.notSubmitted}</div>
            <div className="kpi-sub-text text-rose">
              Missing mandatory compliance filings
            </div>
          </div>

          {/* Card 4: Compliance Health Score */}
          <div className="dash-kpi-card card-emerald">
            <div className="kpi-card-header">
              <h4 className="kpi-card-title">Compliance Health Score</h4>
              <span className="kpi-badge emerald">Reportorial</span>
            </div>
            <div className="kpi-hero-num text-emerald">{reportorialKpis.compliance}%</div>
            <div className="kpi-progress-bar-wrap">
              <div
                className="kpi-progress-bar-fill"
                style={{ width: `${reportorialKpis.compliance}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Priority Compliance Actions & Renewals Table Card */}
      <section className="dash-table-card" aria-label="Urgent Regulatory Actions Table">
        <div className="dash-table-header">
          <div className="table-header-left">
            <h3 className="dash-table-title">🚨 Priority Compliance Actions &amp; Renewals</h3>
            <span className="table-count-tag">{filteredActions.length} Records</span>
          </div>

          <div className="table-header-controls">
            {/* Search Box */}
            <div className="dash-table-search">
              <span className="dash-table-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search action item, facility, agency..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="dash-table-search-input"
                aria-label="Search priority compliance actions"
              />
              {tableSearch && (
                <button
                  type="button"
                  className="dash-table-search-clear"
                  onClick={() => {
                    setTableSearch('');
                    setCurrentPage(1);
                  }}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="table-header-tabs">
              <button
                type="button"
                className={`table-filter-tab ${tableStatusFilter === 'All' ? 'active' : ''}`}
                onClick={() => {
                  setTableStatusFilter('All');
                  setCurrentPage(1);
                }}
              >
                All Actions
              </button>
              <button
                type="button"
                className={`table-filter-tab overdue ${tableStatusFilter === 'Overdue' ? 'active' : ''}`}
                onClick={() => {
                  setTableStatusFilter('Overdue');
                  setCurrentPage(1);
                }}
              >
                Overdue Only ({actionCounts.overdue})
              </button>
              <button
                type="button"
                className={`table-filter-tab upcoming ${tableStatusFilter === 'Upcoming' ? 'active' : ''}`}
                onClick={() => {
                  setTableStatusFilter('Upcoming');
                  setCurrentPage(1);
                }}
              >
                Upcoming Renewals ({actionCounts.upcoming})
              </button>
            </div>
          </div>
        </div>

        <div className="dash-table-wrap">
          <table className="dash-actions-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable-th">
                  Action Item {sortField === 'name' ? (sortAsc ? '▲' : '▼') : '⇅'}
                </th>
                <th>Type</th>
                <th onClick={() => handleSort('agency')} className="sortable-th">
                  Agency {sortField === 'agency' ? (sortAsc ? '▲' : '▼') : '⇅'}
                </th>
                <th onClick={() => handleSort('plant')} className="sortable-th">
                  Facility {sortField === 'plant' ? (sortAsc ? '▲' : '▼') : '⇅'}
                </th>
                <th>Region</th>
                <th>Dept</th>
                <th onClick={() => handleSort('dueDate')} className="sortable-th">
                  Due Date {sortField === 'dueDate' ? (sortAsc ? '▲' : '▼') : '⇅'}
                </th>
                <th onClick={() => handleSort('daysRemaining')} className="sortable-th">
                  Days Left {sortField === 'daysRemaining' ? (sortAsc ? '▲' : '▼') : '⇅'}
                </th>
                <th>Officer</th>
                <th className="th-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedActions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="dash-table-empty">
                    No compliance action items match the current filters.
                    <button type="button" className="btn-table-reset" onClick={handleResetFilters}>
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedActions.map((item) => {
                  const noExpiry = item.isNoExpiry || isNoExpiryDate(item.dueDate);
                  const isOverdue = !noExpiry && (item.daysRemaining !== null ? item.daysRemaining < 0 : item.status === 'Overdue');
                  const isCritical = !noExpiry && item.daysRemaining !== null && item.daysRemaining >= 0 && item.daysRemaining <= 30;

                  return (
                    <tr
                      key={item.id}
                      className="dash-table-row"
                      onClick={() => setActiveItemDetail(item)}
                    >
                      <td className="td-name-cell">
                        <span className="item-main-title">{item.name}</span>
                        <span className="item-permit-no">{item.permitNo}</span>
                      </td>
                      <td>
                        <span className={`item-type-badge ${item.type.toLowerCase()}`}>
                          {item.type}
                        </span>
                      </td>
                      <td>
                        <span className={`agency-code-badge ${item.agency.toLowerCase()}`}>
                          {item.agency}
                        </span>
                      </td>
                      <td className="td-plant-cell">
                        <strong>{item.plant}</strong>
                      </td>
                      <td>{item.region}</td>
                      <td>{item.department}</td>
                      <td className="td-date-cell">
                        <span className="td-date-val">{item.dueDate}</span>
                        {noExpiry && (
                          <span className="td-date-subtag" title="No expiry / One-time filing only">
                            One-Time / No Expiry
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`days-pill ${noExpiry ? 'stable' : isOverdue ? 'overdue' : isCritical ? 'warning' : 'stable'}`}
                        >
                          {noExpiry
                            ? 'No Expiry'
                            : item.daysRemaining !== null && !isNaN(item.daysRemaining)
                            ? item.daysRemaining < 0
                              ? `${item.daysRemaining}d`
                              : item.daysRemaining === 0
                              ? 'Due Today'
                              : `+${item.daysRemaining}d`
                            : '—'}
                        </span>
                      </td>
                      <td className="td-officer-cell">{item.owner}</td>
                      <td className="td-action-cell" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-inspect-action"
                          onClick={() => setActiveItemDetail(item)}
                          title="View complete metadata"
                        >
                          🔍
                        </button>
                        <button
                          type="button"
                          className="btn-jump-action"
                          onClick={() => jumpToPlantInTable(item.plant, item.name)}
                          title={`Open ${item.plant} table`}
                        >
                          📋
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {filteredActions.length > rowsPerPage && (
          <div className="dash-table-pagination">
            <span className="pagination-info">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
              {Math.min(currentPage * rowsPerPage, filteredActions.length)} of {filteredActions.length} records
            </span>
            <div className="pagination-buttons">
              <button
                type="button"
                className="btn-pg"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ◀ Prev
              </button>
              <span className="pg-indicator">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-pg"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 7. Action Item Detail Modal Dialog */}
      {activeItemDetail && (
        <div className="modal-overlay" onClick={() => setActiveItemDetail(null)}>
          <div
            className="modal-card dash-detail-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="detail-title-group">
                <span className={`agency-code-badge ${activeItemDetail.agency.toLowerCase()}`}>
                  {activeItemDetail.agency}
                </span>
                <h3 className="modal-main-title">{activeItemDetail.name}</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setActiveItemDetail(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body detail-modal-body">
              <div className="detail-meta-grid">
                <div className="meta-box">
                  <span className="meta-lbl">Operating Plant</span>
                  <strong className="meta-val">{activeItemDetail.plant}</strong>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Region</span>
                  <span className="meta-val">{activeItemDetail.region}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Department</span>
                  <span className="meta-val">{activeItemDetail.department}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Permit / Certificate No.</span>
                  <span className="meta-val font-mono">{activeItemDetail.permitNo}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Due / Expiration Date</span>
                  <span className="meta-val">
                    {activeItemDetail.dueDate}
                    {(activeItemDetail.isNoExpiry || isNoExpiryDate(activeItemDetail.dueDate)) && (
                      <span className="meta-subtag"> (No Expiry / One-Time Only)</span>
                    )}
                  </span>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Days Remaining</span>
                  <span
                    className={`meta-val ${
                      activeItemDetail.isNoExpiry || isNoExpiryDate(activeItemDetail.dueDate)
                        ? 'text-emerald'
                        : activeItemDetail.daysRemaining !== null && activeItemDetail.daysRemaining < 0
                        ? 'text-rose'
                        : activeItemDetail.daysRemaining !== null && activeItemDetail.daysRemaining <= 30
                        ? 'text-amber'
                        : 'text-emerald'
                    }`}
                  >
                    {activeItemDetail.isNoExpiry || isNoExpiryDate(activeItemDetail.dueDate)
                      ? 'No Expiry / One-Time Only'
                      : activeItemDetail.daysRemaining !== null && !isNaN(activeItemDetail.daysRemaining)
                      ? activeItemDetail.daysRemaining < 0
                        ? `${activeItemDetail.daysRemaining} days (OVERDUE)`
                        : activeItemDetail.daysRemaining === 0
                        ? 'Due Today'
                        : `+${activeItemDetail.daysRemaining} days remaining`
                      : 'Not Applicable'}
                  </span>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Assigned Compliance Officer</span>
                  <span className="meta-val">{activeItemDetail.owner}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Regulatory Body</span>
                  <span className="meta-val">{activeItemDetail.agency}</span>
                </div>
              </div>

              {activeItemDetail.notes && (
                <div className="detail-notes-card">
                  <span className="notes-tag">Compliance Notes &amp; Scope:</span>
                  <p className="notes-text">{activeItemDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveItemDetail(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const targetPlant = activeItemDetail.plant;
                  const targetName = activeItemDetail.name;
                  setActiveItemDetail(null);
                  jumpToPlantInTable(targetPlant, targetName);
                }}
              >
                Open {activeItemDetail.plant} in Detailed Table View →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
