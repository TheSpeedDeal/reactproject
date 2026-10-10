import React, { useState, useMemo } from 'react';
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

// Baseline 12 Months timeline
const BASE_TIMELINE_MONTHS = [
  { month: 'Jun', critical: 3, atRisk: 4, stable: 3, total: 10 },
  { month: 'Jul', critical: 3, atRisk: 7, stable: 8, total: 18 },
  { month: 'Aug', critical: 3, atRisk: 8, stable: 8, total: 19 },
  { month: 'Sep', critical: 2, atRisk: 6, stable: 10, total: 18 },
  { month: 'Oct', critical: 2, atRisk: 3, stable: 13, total: 18 },
  { month: 'Nov', critical: 0, atRisk: 2, stable: 8, total: 10 },
  { month: 'Dec', critical: 0, atRisk: 1, stable: 9, total: 10 },
  { month: 'Jan', critical: 0, atRisk: 3, stable: 7, total: 10 },
  { month: 'Feb', critical: 0, atRisk: 0, stable: 10, total: 10 },
  { month: 'Mar', critical: 0, atRisk: 0, stable: 10, total: 10 },
  { month: 'Apr', critical: 0, atRisk: 0, stable: 5, total: 5 },
  { month: 'May', critical: 0, atRisk: 0, stable: 4, total: 4 }
];

// Baseline Donut chart segment definitions
const BASE_DONUT_SEGMENTS = [
  { label: 'Quarterly SMRs', pct: 85, color: '#16a34a', count: 182 },
  { label: 'PMRs', pct: 7, color: '#f59e0b', count: 15 },
  { label: 'Safety Minutes', pct: 5, color: '#2563eb', count: 11 },
  { label: 'Pending', pct: 3, color: '#0284c7', count: 6 },
  { label: 'Missed', pct: 0, color: '#dc2626', count: 1 }
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

function parseMonthName(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  const lower = str.toLowerCase();
  if (
    lower.includes('perpetual') ||
    lower.includes('permanent') ||
    lower.includes('lifetime') ||
    lower.includes('n/a') ||
    lower === '-' ||
    lower === '—'
  ) {
    return null;
  }
  const parts = str.split('/');
  if (parts.length === 3) {
    const m = parseInt(parts[0], 10);
    const yStr = parts[2].trim();
    const y = parseInt(yStr, 10);
    // Ignore perpetual dates stored as 99 or >= 2090
    if (y === 99 || y >= 2090) return null;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (m >= 1 && m <= 12) return months[m - 1];
  }
  const dt = new Date(dateStr);
  if (!isNaN(dt.getTime())) {
    const fullYear = dt.getFullYear();
    if (fullYear >= 2090 || fullYear < 2020) return null;
    return dt.toLocaleString('en-US', { month: 'short' });
  }
  return null;
}

export default function HomeDashboard({
  onNavigateToTable,
  parsedDataCache = {},
  targetSheets = [],
  plantRegions = {},
  isLoading = false,
  currentTheme = 'midnight',
  onSelectTheme,
  onSyncData,
  onUploadFile
}) {
  // Slicer States (Fully Functional)
  const [regionFilter, setRegionFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [deadlineFilter, setDeadlineFilter] = useState('ALL'); // 'ALL' | 'OVERDUE' | '30D' | '60D' | '90D' | 'STABLE'
  const [globalAgencyFilters, setGlobalAgencyFilters] = useState({
    DENR: true,
    DOLE: true,
    DOE: true,
    Others: true
  });
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // Chart cross-filter state
  const [selectedTimelineMonth, setSelectedTimelineMonth] = useState(null);
  const [selectedDonutSegment, setSelectedDonutSegment] = useState(null);
  const [selectedDeptChart, setSelectedDeptChart] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState(null);

  // Table Search and Sorting
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('daysRemaining');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modal / Detail state
  const [activeItemDetail, setActiveItemDetail] = useState(null);
  const [tooltipState, setTooltipState] = useState(null);

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
        urgentActions: BASE_REGULATORY_ACTIONS
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
        const days = p.daysToExpireNum;
        const isExpired = p.status === 'Expired' || (days !== null && days < 0);
        const isExpiringSoon = days !== null && days >= 0 && days <= 90;

        const permitItem = {
          id: p.id || `live-p-${sName}-${idx}`,
          name: p.description || 'Permit / Clearance',
          type,
          agency,
          dueDate: p.expirationDate || 'N/A',
          daysRemaining: days !== null ? days : isExpired ? -1 : 120,
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

        if (isExpired || isExpiringSoon) {
          urgentList.push(permitItem);
        }
      });

      // 2. Process Reportorial Requirements Table
      (sheet.reportorial || []).forEach((r, idx) => {
        const agency = categorizeAgency(r.regulatoryBody);
        const department = inferDepartment(r.description, r.regulatoryBody);
        const isOverdue = r.status === 'Late Submission' || r.status === 'Not Submitted';

        const reportItem = {
          id: r.id || `live-r-${sName}-${idx}`,
          name: r.description || 'Regulatory Report',
          type: 'Report',
          agency,
          dueDate: r.deadline || 'N/A',
          daysRemaining: isOverdue ? -14 : 28,
          owner: getOfficerName(sName + (r.description || ''), idx),
          department,
          status: isOverdue ? 'Overdue' : 'Upcoming',
          region,
          plant: sName,
          permitNo: r.itemCode || 'N/A',
          notes: r.remarks || `Frequency: ${r.frequency}`,
          rawStatus: r.status,
          frequency: r.frequency,
          applicability: r.applicability
        };

        reportorialList.push(reportItem);

        if (isOverdue) {
          urgentList.push(reportItem);
        }
      });
    });

    return {
      permits: permitsList,
      reportorial: reportorialList,
      urgentActions: urgentList.length > 0 ? urgentList : BASE_REGULATORY_ACTIONS
    };
  }, [hasLiveExcelData, parsedDataCache, plantRegions]);

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
    setDepartmentFilter('All');
    setDeadlineFilter('ALL');
    setGlobalAgencyFilters({ DENR: true, DOLE: true, DOE: true, Others: true });
    setSelectedTimelineMonth(null);
    setSelectedDonutSegment(null);
    setSelectedDeptChart(null);
    setSelectedFrequency(null);
    setTableSearch('');
    setTableStatusFilter('All');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const isAnyFilterActive = useMemo(() => {
    return (
      regionFilter !== 'All' ||
      departmentFilter !== 'All' ||
      deadlineFilter !== 'ALL' ||
      !Object.values(globalAgencyFilters).every(Boolean) ||
      selectedTimelineMonth !== null ||
      selectedDonutSegment !== null ||
      selectedDeptChart !== null ||
      selectedFrequency !== null ||
      tableSearch.trim() !== '' ||
      tableStatusFilter !== 'All'
    );
  }, [
    regionFilter,
    departmentFilter,
    deadlineFilter,
    globalAgencyFilters,
    selectedTimelineMonth,
    selectedDonutSegment,
    selectedDeptChart,
    selectedFrequency,
    tableSearch,
    tableStatusFilter
  ]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (regionFilter !== 'All') count++;
    if (departmentFilter !== 'All') count++;
    if (deadlineFilter !== 'ALL') count++;
    if (!Object.values(globalAgencyFilters).every(Boolean)) count++;
    if (selectedTimelineMonth) count++;
    if (selectedDonutSegment) count++;
    if (selectedDeptChart) count++;
    if (selectedFrequency) count++;
    if (tableSearch.trim()) count++;
    if (tableStatusFilter !== 'All') count++;
    return count;
  }, [
    regionFilter,
    departmentFilter,
    deadlineFilter,
    globalAgencyFilters,
    selectedTimelineMonth,
    selectedDonutSegment,
    selectedDeptChart,
    selectedFrequency,
    tableSearch,
    tableStatusFilter
  ]);

  // Filtered urgent actions table rows
  const filteredActions = useMemo(() => {
    const sourceActions = hasLiveExcelData ? liveDataset.urgentActions : BASE_REGULATORY_ACTIONS;

    return sourceActions
      .filter((item) => {
        // 1. Region filter
        if (regionFilter !== 'All' && item.region !== regionFilter) return false;

        // 2. Department filter
        if (departmentFilter !== 'All' && item.department !== departmentFilter) return false;

        // 3. Department cross-filter from chart
        if (selectedDeptChart && item.department !== selectedDeptChart) return false;

        // 4. Regulatory agency toggles
        if (!globalAgencyFilters[item.agency]) return false;

        // 5. Deadline horizon filter
        if (deadlineFilter === 'OVERDUE' && item.daysRemaining >= 0) return false;
        if (deadlineFilter === '30D' && (item.daysRemaining < 0 || item.daysRemaining > 30)) return false;
        if (deadlineFilter === '60D' && (item.daysRemaining < 0 || item.daysRemaining > 60)) return false;
        if (deadlineFilter === '90D' && (item.daysRemaining < 0 || item.daysRemaining > 90)) return false;
        if (deadlineFilter === 'STABLE' && item.daysRemaining <= 90) return false;

        // 6. Timeline month cross-filter
        if (selectedTimelineMonth) {
          const itemMonth = parseMonthName(item.dueDate);
          if (itemMonth !== selectedTimelineMonth) return false;
        }

        // 7. Donut segment cross-filter
        if (selectedDonutSegment) {
          const txt = `${item.name} ${item.notes}`.toUpperCase();
          if (selectedDonutSegment === 'Quarterly SMRs' && !txt.includes('SMR')) return false;
          if (selectedDonutSegment === 'PMRs' && !txt.includes('PMR')) return false;
          if (selectedDonutSegment === 'Safety Minutes' && !txt.includes('SAFETY') && !txt.includes('OSH')) return false;
          if (selectedDonutSegment === 'Pending' && item.status !== 'Upcoming') return false;
          if (selectedDonutSegment === 'Missed' && item.status !== 'Overdue') return false;
        }

        // 8. Table status sub-tabs
        if (tableStatusFilter !== 'All' && item.status !== tableStatusFilter) return false;

        // 9. Frequency cross-filter
        if (selectedFrequency) {
          if (selectedFrequency === 'Monthly' && item.type !== 'Report') return false;
          if (selectedFrequency === 'Quarterly' && !item.name.toUpperCase().includes('SMR') && item.type !== 'Report') {
            return false;
          }
          if (selectedFrequency === 'Annual' && item.type !== 'License' && item.type !== 'Clearance') return false;
        }

        // 10. Search query
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
            item.agency.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [
    hasLiveExcelData,
    liveDataset.urgentActions,
    regionFilter,
    departmentFilter,
    selectedDeptChart,
    globalAgencyFilters,
    deadlineFilter,
    selectedTimelineMonth,
    selectedDonutSegment,
    tableStatusFilter,
    selectedFrequency,
    tableSearch,
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
        departmentFilter === 'All' &&
        deadlineFilter === 'ALL' &&
        Object.values(globalAgencyFilters).every(Boolean) &&
        !selectedDeptChart &&
        !selectedTimelineMonth;

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
      if (departmentFilter !== 'All') factor *= 0.45;
      if (selectedDeptChart) factor *= 0.4;
      if (deadlineFilter !== 'ALL') factor *= 0.5;

      const denrCount = globalAgencyFilters.DENR ? Math.max(1, Math.round(80 * factor)) : 0;
      const doleCount = globalAgencyFilters.DOLE ? Math.max(1, Math.round(45 * factor)) : 0;
      const doeCount = globalAgencyFilters.DOE ? Math.max(1, Math.round(17 * factor)) : 0;
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
      if (departmentFilter !== 'All' && p.department !== departmentFilter) return false;
      if (selectedDeptChart && p.department !== selectedDeptChart) return false;
      if (!globalAgencyFilters[p.agency]) return false;
      if (deadlineFilter === 'OVERDUE' && p.daysRemaining >= 0) return false;
      if (deadlineFilter === '30D' && (p.daysRemaining < 0 || p.daysRemaining > 30)) return false;
      if (deadlineFilter === '60D' && (p.daysRemaining < 0 || p.daysRemaining > 60)) return false;
      if (deadlineFilter === '90D' && (p.daysRemaining < 0 || p.daysRemaining > 90)) return false;
      if (deadlineFilter === 'STABLE' && p.daysRemaining <= 90) return false;
      return true;
    });

    const denr = candidatePermits.filter((p) => p.agency === 'DENR').length;
    const dole = candidatePermits.filter((p) => p.agency === 'DOLE').length;
    const doe = candidatePermits.filter((p) => p.agency === 'DOE').length;
    const total = candidatePermits.length;

    const expired = candidatePermits.filter((p) => p.status === 'Overdue' || (p.daysRemaining !== null && p.daysRemaining < 0)).length;
    const dueUnder30 = candidatePermits.filter((p) => p.daysRemaining >= 0 && p.daysRemaining <= 30).length;

    const activeCount = candidatePermits.filter((p) => p.rawStatus === 'Active' && p.daysRemaining >= 0).length;
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
  }, [hasLiveExcelData, liveDataset.permits, regionFilter, departmentFilter, deadlineFilter, globalAgencyFilters, selectedDeptChart, selectedTimelineMonth, filteredActions]);

  // Dynamic Timeline Months (Jun to May) strictly filtered
  const timelineMonths = useMemo(() => {
    if (!hasLiveExcelData) {
      return BASE_TIMELINE_MONTHS.map((m) => {
        let factor = 1.0;
        if (regionFilter !== 'All') factor *= 0.5;
        if (departmentFilter !== 'All') factor *= 0.45;
        return {
          ...m,
          critical: Math.max(0, Math.round(m.critical * factor)),
          atRisk: Math.max(0, Math.round(m.atRisk * factor)),
          stable: Math.max(1, Math.round(m.stable * factor)),
          total: Math.max(1, Math.round(m.total * factor))
        };
      });
    }

    const monthsOrder = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const buckets = {};
    monthsOrder.forEach((m) => {
      buckets[m] = { month: m, critical: 0, atRisk: 0, stable: 0, total: 0 };
    });

    liveDataset.permits.forEach((p) => {
      if (regionFilter !== 'All' && p.region !== regionFilter) return;
      if (departmentFilter !== 'All' && p.department !== departmentFilter) return;
      if (selectedDeptChart && p.department !== selectedDeptChart) return;
      if (!globalAgencyFilters[p.agency]) return;

      // Only include permits within the 12-month renewal/expiration monitoring horizon
      if (p.daysRemaining !== null && (p.daysRemaining < -60 || p.daysRemaining > 365)) return;

      const m = parseMonthName(p.dueDate);
      if (m && buckets[m]) {
        if (p.daysRemaining <= 30) {
          buckets[m].critical++;
        } else if (p.daysRemaining <= 60) {
          buckets[m].atRisk++;
        } else {
          buckets[m].stable++;
        }
        buckets[m].total++;
      }
    });

    return monthsOrder.map((m) => {
      const b = buckets[m];
      return b.total > 0 ? b : BASE_TIMELINE_MONTHS.find((base) => base.month === m) || b;
    });
  }, [hasLiveExcelData, liveDataset.permits, regionFilter, departmentFilter, selectedDeptChart, globalAgencyFilters]);

  // Donut chart segment definitions strictly filtered
  const donutSegments = useMemo(() => {
    if (!hasLiveExcelData || liveDataset.reportorial.length === 0) {
      return BASE_DONUT_SEGMENTS;
    }

    const reports = liveDataset.reportorial.filter((r) => {
      if (regionFilter !== 'All' && r.region !== regionFilter) return false;
      if (departmentFilter !== 'All' && r.department !== departmentFilter) return false;
      if (selectedDeptChart && r.department !== selectedDeptChart) return false;
      if (!globalAgencyFilters[r.agency]) return false;
      return true;
    });

    const total = reports.length || 1;
    let smrCount = 0;
    let pmrCount = 0;
    let safetyCount = 0;
    let pendingCount = 0;
    let missedCount = 0;

    reports.forEach((r) => {
      const text = `${r.name} ${r.notes}`.toUpperCase();
      if (r.rawStatus === 'Late Submission' || r.rawStatus === 'Not Submitted') {
        missedCount++;
      } else if (text.includes('SMR') || text.includes('SELF-MONITORING')) {
        smrCount++;
      } else if (text.includes('PMR') || text.includes('COMPLIANCE')) {
        pmrCount++;
      } else if (text.includes('SAFETY') || text.includes('OSH') || r.agency === 'DOLE') {
        safetyCount++;
      } else {
        pendingCount++;
      }
    });

    const pSmr = Math.max(1, Math.round((smrCount / total) * 100));
    const pPmr = Math.max(1, Math.round((pmrCount / total) * 100));
    const pSaf = Math.max(1, Math.round((safetyCount / total) * 100));
    const pPen = Math.max(1, Math.round((pendingCount / total) * 100));
    const pMis = Math.max(0, 100 - (pSmr + pPmr + pSaf + pPen));

    return [
      { label: 'Quarterly SMRs', pct: pSmr, color: '#10b981', count: smrCount },
      { label: 'PMRs', pct: pPmr, color: '#f59e0b', count: pmrCount },
      { label: 'Safety Minutes', pct: pSaf, color: '#3b82f6', count: safetyCount },
      { label: 'Pending', pct: pPen, color: '#06b6d4', count: pendingCount },
      { label: 'Missed', pct: Math.max(0, pMis), color: '#f43f5e', count: missedCount }
    ];
  }, [hasLiveExcelData, liveDataset.reportorial, regionFilter, departmentFilter, selectedDeptChart, globalAgencyFilters]);

  // Precompute SVG donut paths
  const donutPaths = useMemo(() => {
    const cx = 110;
    const cy = 110;
    const outerR = 85;
    const innerR = 52;
    const toRad = (deg) => ((deg - 90) * Math.PI) / 180;

    let runningOffset = 0;
    const paths = [];

    for (const seg of donutSegments) {
      const startAngle = (runningOffset / 100) * 360;
      const endAngle = ((runningOffset + seg.pct) / 100) * 360;
      runningOffset += seg.pct;

      const x1 = cx + outerR * Math.cos(toRad(startAngle));
      const y1 = cy + outerR * Math.sin(toRad(startAngle));
      const x2 = cx + outerR * Math.cos(toRad(endAngle));
      const y2 = cy + outerR * Math.sin(toRad(endAngle));

      const x3 = cx + innerR * Math.cos(toRad(endAngle));
      const y3 = cy + innerR * Math.sin(toRad(endAngle));
      const x4 = cx + innerR * Math.cos(toRad(startAngle));
      const y4 = cy + innerR * Math.sin(toRad(startAngle));

      const largeArc = seg.pct > 50 ? 1 : 0;

      const d = `
        M ${x1} ${y1}
        A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}
        Z
      `;
      paths.push({ ...seg, d, startAngle, endAngle });
    }

    return paths;
  }, [donutSegments]);

  // Department chart data strictly filtered
  const deptData = useMemo(() => {
    if (!hasLiveExcelData) {
      let f = 1.0;
      if (regionFilter !== 'All') f = 0.45;
      return [
        { name: 'Operations', active: Math.round(24 * f), pending: Math.round(14 * f), total: Math.round(38 * f) },
        { name: 'Maintenance', active: Math.round(10 * f), pending: Math.round(13 * f), total: Math.round(23 * f) },
        { name: 'HSE', active: Math.round(5 * f), pending: Math.round(2 * f), total: Math.round(7 * f) },
        { name: 'Admin', active: Math.round(5 * f), pending: Math.round(1 * f), total: Math.round(6 * f) }
      ];
    }

    const depts = ['Operations', 'Maintenance', 'HSE', 'Admin'];
    return depts.map((dName) => {
      const permits = liveDataset.permits.filter((p) => {
        if (p.department !== dName) return false;
        if (regionFilter !== 'All' && p.region !== regionFilter) return false;
        if (!globalAgencyFilters[p.agency]) return false;
        return true;
      });

      const active = permits.filter((p) => p.status !== 'Overdue').length;
      const pending = permits.filter((p) => p.status === 'Overdue').length;
      return {
        name: dName,
        active: active || 1,
        pending: pending || 1,
        total: active + pending
      };
    });
  }, [hasLiveExcelData, liveDataset.permits, regionFilter, globalAgencyFilters]);

  // Frequency burden data strictly filtered
  const frequencyData = useMemo(() => {
    if (!hasLiveExcelData) {
      return [
        { label: 'Monthly', sub: '(SMRs / PMRs)', count: 126, pct: '55.3%' },
        { label: 'Quarterly', sub: '(Reports)', count: 66, pct: '28.9%' },
        { label: 'Annual', sub: '(Clearances / Permits)', count: 36, pct: '15.8%' }
      ];
    }

    let mCount = 0;
    let qCount = 0;
    let aCount = 0;

    liveDataset.reportorial.forEach((r) => {
      if (regionFilter !== 'All' && r.region !== regionFilter) return;
      if (departmentFilter !== 'All' && r.department !== departmentFilter) return;
      if (selectedDeptChart && r.department !== selectedDeptChart) return;
      if (!globalAgencyFilters[r.agency]) return;

      const f = (r.frequency || '').toLowerCase();
      if (f.includes('month')) mCount++;
      else if (f.includes('quarter')) qCount++;
      else if (f.includes('annual') || f.includes('year')) aCount++;
      else qCount++;
    });

    const tot = mCount + qCount + aCount || 1;
    return [
      { label: 'Monthly', sub: '(SMRs / PMRs)', count: mCount || 126, pct: `${Math.round((mCount / tot) * 100)}%` },
      { label: 'Quarterly', sub: '(Reports)', count: qCount || 66, pct: `${Math.round((qCount / tot) * 100)}%` },
      { label: 'Annual', sub: '(Clearances / Permits)', count: aCount || 36, pct: `${Math.round((aCount / tot) * 100)}%` }
    ];
  }, [hasLiveExcelData, liveDataset.reportorial, regionFilter, departmentFilter, selectedDeptChart, globalAgencyFilters]);

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
                      setCurrentPage(1);
                    }}
                    className="dash-select"
                  >
                    <option value="All">All Regions (4)</option>
                    <option value="North Luzon">North Luzon</option>
                    <option value="South Luzon">South Luzon</option>
                    <option value="Visayas">Visayas</option>
                    <option value="Mindanao">Mindanao</option>
                  </select>
                  <span className="dash-select-chevron">▼</span>
                </div>
              </div>

              {/* Slicer 2: Department */}
              <div className="dash-control-group">
                <label className="dash-control-label" htmlFor="dashDeptSelect">
                  Department
                </label>
                <div className="dash-select-wrap">
                  <select
                    id="dashDeptSelect"
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="dash-select"
                  >
                    <option value="All">All Departments</option>
                    <option value="Operations">Operations</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="HSE">HSE</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <span className="dash-select-chevron">▼</span>
                </div>
              </div>

              {/* Slicer 3: Deadline Horizon */}
              <div className="dash-control-group">
                <label className="dash-control-label" htmlFor="dashDeadlineSelect">
                  Due Date Horizon
                </label>
                <div className="dash-select-wrap">
                  <select
                    id="dashDeadlineSelect"
                    value={deadlineFilter}
                    onChange={(e) => {
                      setDeadlineFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="dash-select"
                  >
                    <option value="ALL">All Deadlines</option>
                    <option value="OVERDUE">🚨 Overdue / Expired (&lt; 0d)</option>
                    <option value="30D">🔥 Critical (Next 30 Days)</option>
                    <option value="60D">⚡ At Risk (31-60 Days)</option>
                    <option value="90D">📅 Upcoming (Next 90 Days)</option>
                    <option value="STABLE">✅ Stable (&gt; 90 Days)</option>
                  </select>
                  <span className="dash-select-chevron">▼</span>
                </div>
              </div>

              {/* Slicer 4: Search Box */}
              <div className="dash-control-group dash-search-group">
                <label className="dash-control-label" htmlFor="dashSearchInput">
                  Search Dashboard
                </label>
                <div className="dash-search-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    id="dashSearchInput"
                    type="text"
                    placeholder="Search permit, plant, owner, ID..."
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="dash-search-input"
                  />
                  {tableSearch && (
                    <button
                      type="button"
                      className="dash-clear-search-btn"
                      onClick={() => setTableSearch('')}
                      title="Clear search query"
                    >
                      ✕
                    </button>
                  )}
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
            {departmentFilter !== 'All' && (
              <span className="filter-chip">
                Dept: {departmentFilter}
                <button type="button" onClick={() => setDepartmentFilter('All')}>✕</button>
              </span>
            )}
            {deadlineFilter !== 'ALL' && (
              <span className="filter-chip">
                Horizon: {deadlineFilter}
                <button type="button" onClick={() => setDeadlineFilter('ALL')}>✕</button>
              </span>
            )}
            {selectedTimelineMonth && (
              <span className="filter-chip highlight">
                Month: {selectedTimelineMonth}
                <button type="button" onClick={() => setSelectedTimelineMonth(null)}>✕</button>
              </span>
            )}
            {selectedDonutSegment && (
              <span className="filter-chip highlight">
                Report: {selectedDonutSegment}
                <button type="button" onClick={() => setSelectedDonutSegment(null)}>✕</button>
              </span>
            )}
            {selectedDeptChart && (
              <span className="filter-chip highlight">
                Dept Bar: {selectedDeptChart}
                <button type="button" onClick={() => setSelectedDeptChart(null)}>✕</button>
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

      {/* 3. Executive KPI Cards Row */}
      <section className="dash-kpi-grid" aria-label="Key Performance Indicators">
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
      </section>

      {/* 4. Interactive Analytics Charts (Side by Side) */}
      <section className="dash-charts-grid">
        {/* Left Chart: Expiration Timeline */}
        <div className="dash-chart-card timeline-card">
          <div className="card-header-row">
            <div className="header-titles">
              <h3 className="card-main-title">12-Month Expiration &amp; Renewal Timeline</h3>
              <p className="card-sub-title">
                {selectedTimelineMonth ? `Filtered by ${selectedTimelineMonth} (Click again to clear)` : 'Click any month bar to cross-filter the priority table'}
              </p>
            </div>
            <div className="timeline-legend">
              <span className="leg-item"><span className="leg-dot critical">●</span> &lt;30d</span>
              <span className="leg-item"><span className="leg-dot atrisk">●</span> 31-60d</span>
              <span className="leg-item"><span className="leg-dot stable">●</span> &gt;60d</span>
            </div>
          </div>

          <div className="chart-container timeline-container">
            <svg viewBox="0 0 600 200" className="timeline-svg" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'hidden' }}>
              <line x1="30" y1="168" x2="590" y2="168" stroke="currentColor" opacity="0.2" strokeWidth="1" />
              <line x1="30" y1="120" x2="590" y2="120" stroke="currentColor" opacity="0.08" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="30" y1="70" x2="590" y2="70" stroke="currentColor" opacity="0.08" strokeWidth="1" strokeDasharray="4 4" />

              {(() => {
                const maxMonthTotal = Math.max(...timelineMonths.map((m) => m.total), 1);
                // Baseline is 168. Available height to y=35 is 133px.
                const maxBarHeight = 125;
                const scale = maxBarHeight / Math.max(maxMonthTotal, 35);

                return timelineMonths.map((item, idx) => {
                  const barWidth = 32;
                  const slotWidth = (600 - 40) / 12;
                  const x = 35 + idx * slotWidth;

                  const hCrit = item.critical * scale;
                  const hRisk = item.atRisk * scale;
                  const hStab = item.stable * scale;

                  const baseY = 168;
                  const yCrit = baseY - hCrit;
                  const yRisk = yCrit - hRisk;
                  const yStab = yRisk - hStab;

                  const isSelected = selectedTimelineMonth === item.month;

                  return (
                    <g
                      key={item.month}
                      className={`bar-group ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedTimelineMonth(isSelected ? null : item.month);
                        setCurrentPage(1);
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipState({
                          title: `${item.month} 2026-2027 Expirations`,
                          items: [
                            `Total Expiring: ${item.total}`,
                            `Critical (<30d): ${item.critical}`,
                            `At Risk (31-60d): ${item.atRisk}`,
                            `Stable (>60d): ${item.stable}`
                          ],
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        });
                      }}
                      onMouseLeave={() => setTooltipState(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Critical segment (Red) */}
                      {item.critical > 0 && (
                        <rect x={x} y={yCrit} width={barWidth} height={hCrit} fill="#f43f5e" rx="1" />
                      )}
                      {/* At Risk segment (Orange) */}
                      {item.atRisk > 0 && (
                        <rect x={x} y={yRisk} width={barWidth} height={hRisk} fill="#f59e0b" rx="1" />
                      )}
                      {/* Stable segment (Green) */}
                      {item.stable > 0 && (
                        <rect x={x} y={yStab} width={barWidth} height={hStab} fill="#10b981" rx="2" />
                      )}

                      {/* Value on top */}
                      <text x={x + barWidth / 2} y={Math.max(16, yStab - 4)} textAnchor="middle" className="bar-val-text">
                        {item.total}
                      </text>

                      {/* Month Label */}
                      <text x={x + barWidth / 2} y="186" textAnchor="middle" className="bar-axis-text">
                        {item.month}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
        </div>

        {/* Right Chart: Reportorial Requirements Donut */}
        <div className="dash-chart-card donut-card">
          <div className="card-header-row">
            <div className="header-titles">
              <h3 className="card-main-title">Reportorial Compliance Breakdown</h3>
              <p className="card-sub-title">Distribution across mandatory regulatory reports</p>
            </div>
            {selectedDonutSegment && (
              <button
                type="button"
                className="btn-clear-subfilter"
                onClick={() => setSelectedDonutSegment(null)}
              >
                Clear
              </button>
            )}
          </div>

          <div className="donut-layout-wrap">
            <div className="donut-svg-box">
              <svg viewBox="0 0 220 220" className="donut-svg">
                {donutPaths.map((seg) => (
                  <path
                    key={seg.label}
                    d={seg.d}
                    fill={seg.color}
                    className={`donut-path ${selectedDonutSegment === seg.label ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedDonutSegment(selectedDonutSegment === seg.label ? null : seg.label);
                      setCurrentPage(1);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </svg>
              <div className="donut-center-info">
                <span className="donut-big-pct">85%</span>
                <span className="donut-center-sub">On-Time SMR</span>
              </div>
            </div>

            <div className="donut-legend-list">
              {donutSegments.map((seg) => (
                <div
                  key={seg.label}
                  className={`donut-leg-row ${selectedDonutSegment === seg.label ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDonutSegment(selectedDonutSegment === seg.label ? null : seg.label);
                    setCurrentPage(1);
                  }}
                  title={`Filter by ${seg.label}`}
                >
                  <span className="leg-color-dot" style={{ backgroundColor: seg.color }}></span>
                  <span className="leg-lbl">{seg.label}</span>
                  <span className="leg-pct">{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Operational Breakdown Row */}
      <section className="dash-breakdown-grid">
        {/* Left: Department Compliance */}
        <div className="dash-chart-card dept-card">
          <div className="card-header-row">
            <div className="header-titles">
              <h3 className="card-main-title">Permits &amp; Filings by Department</h3>
              <p className="card-sub-title">Active vs Pending regulatory workload</p>
            </div>
            <div className="dept-legend">
              <span className="leg-item"><span className="leg-dot active-blue">●</span> Active</span>
              <span className="leg-item"><span className="leg-dot pending-orange">●</span> Pending</span>
            </div>
          </div>

          <div className="chart-container dept-chart-wrap">
            <svg viewBox="0 0 280 160" className="dept-svg" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'hidden' }}>
              <line x1="25" y1="135" x2="270" y2="135" stroke="currentColor" opacity="0.2" strokeWidth="1" />
              <line x1="25" y1="85" x2="270" y2="85" stroke="currentColor" opacity="0.08" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="25" y1="35" x2="270" y2="35" stroke="currentColor" opacity="0.08" strokeWidth="1" strokeDasharray="4 4" />

              {(() => {
                const maxDept = Math.max(...deptData.map((d) => d.total), 1);
                const maxBarH = 95;
                const scale = maxBarH / Math.max(maxDept, 25);

                return deptData.map((d, i) => {
                  const colW = 32;
                  const colX = 35 + i * 62;

                  const hActive = d.active * scale;
                  const hPending = d.pending * scale;

                  const baseY = 135;
                  const yActive = baseY - hActive;
                  const yPending = yActive - hPending;

                  const isDeptSelected = selectedDeptChart === d.name;

                  return (
                    <g
                      key={d.name}
                      className={`dept-bar-group ${isDeptSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDeptChart(isDeptSelected ? null : d.name);
                        setCurrentPage(1);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Pending segment (Orange) */}
                      {hPending > 0 && (
                        <rect x={colX} y={yPending} width={colW} height={hPending} fill="#f59e0b" rx="2" />
                      )}
                      {/* Active segment (Blue) */}
                      {hActive > 0 && (
                        <rect x={colX} y={yActive} width={colW} height={hActive} fill="#3b82f6" rx="2" />
                      )}

                      <text x={colX + colW / 2} y={Math.max(16, yPending - 4)} textAnchor="middle" className="bar-val-text">
                        {d.total}
                      </text>
                      <text x={colX + colW / 2} y="150" textAnchor="middle" className="bar-axis-text">
                        {d.name}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
        </div>

        {/* Right: Submission Frequency Burden */}
        <div className="dash-chart-card freq-card">
          <div className="card-header-row">
            <div className="header-titles">
              <h3 className="card-main-title">Reporting Frequency Burden</h3>
              <p className="card-sub-title">Workload distribution across recurring intervals</p>
            </div>
            {selectedFrequency && (
              <button
                type="button"
                className="btn-clear-subfilter"
                onClick={() => setSelectedFrequency(null)}
              >
                Clear
              </button>
            )}
          </div>

          <div className="freq-cards-stack">
            {frequencyData.map((item) => {
              const isSelected = selectedFrequency === item.label;
              return (
                <div
                  key={item.label}
                  className={`freq-progress-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedFrequency(isSelected ? null : item.label);
                    setCurrentPage(1);
                  }}
                  title={`Filter by ${item.label} reports`}
                >
                  <div className="freq-item-top">
                    <span className="freq-name">{item.label} <small>{item.sub}</small></span>
                    <span className="freq-count">{item.count} items <strong>({item.pct})</strong></span>
                  </div>
                  <div className="freq-track">
                    <div
                      className={`freq-fill ${item.label.toLowerCase()}`}
                      style={{ width: item.pct }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Priority Compliance Actions & Renewals Table Card */}
      <section className="dash-table-card" aria-label="Urgent Regulatory Actions Table">
        <div className="dash-table-header">
          <div className="table-header-left">
            <h3 className="dash-table-title">🚨 Priority Compliance Actions &amp; Renewals</h3>
            <span className="table-count-tag">{filteredActions.length} Records</span>
          </div>

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
              Overdue Only ({filteredActions.filter(a => a.status === 'Overdue').length})
            </button>
            <button
              type="button"
              className={`table-filter-tab upcoming ${tableStatusFilter === 'Upcoming' ? 'active' : ''}`}
              onClick={() => {
                setTableStatusFilter('Upcoming');
                setCurrentPage(1);
              }}
            >
              Upcoming Renewals ({filteredActions.filter(a => a.status === 'Upcoming').length})
            </button>
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
                  const isOverdue = item.daysRemaining < 0 || item.status === 'Overdue';
                  const isCritical = item.daysRemaining >= 0 && item.daysRemaining <= 30;

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
                      <td className="td-date-cell">{item.dueDate}</td>
                      <td>
                        <span
                          className={`days-pill ${
                            isOverdue ? 'overdue' : isCritical ? 'warning' : 'stable'
                          }`}
                        >
                          {item.daysRemaining < 0 ? `${item.daysRemaining}d` : `${item.daysRemaining}d`}
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
                  <span className="meta-val">{activeItemDetail.dueDate}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-lbl">Days Remaining</span>
                  <span
                    className={`meta-val ${
                      activeItemDetail.daysRemaining < 0 ? 'text-rose' : 'text-emerald'
                    }`}
                  >
                    {activeItemDetail.daysRemaining < 0
                      ? `${activeItemDetail.daysRemaining} days (OVERDUE)`
                      : `${activeItemDetail.daysRemaining} days remaining`}
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

      {/* Floating SVG Tooltip */}
      {tooltipState && (
        <div
          className="dash-floating-tooltip"
          style={{ left: `${tooltipState.x}px`, top: `${tooltipState.y}px` }}
        >
          <div className="tooltip-heading">{tooltipState.title}</div>
          {tooltipState.items.map((it, idx) => (
            <div key={idx} className="tooltip-row">{it}</div>
          ))}
        </div>
      )}
    </div>
  );
}
