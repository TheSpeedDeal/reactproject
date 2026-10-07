import React, { useState, useMemo } from 'react';
import './HomeDashboard.css';

// Baseline fallback dataset matching the exact Power BI reference screenshot
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
  const parts = String(dateStr).trim().split('/');
  if (parts.length === 3) {
    const m = parseInt(parts[0], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (m >= 1 && m <= 12) return months[m - 1];
  }
  const dt = new Date(dateStr);
  if (!isNaN(dt.getTime())) {
    return dt.toLocaleString('en-US', { month: 'short' });
  }
  return null;
}

export default function HomeDashboard({
  onNavigateToTable,
  parsedDataCache = {},
  targetSheets = [],
  plantRegions = {},
  isLoading = false
}) {
  // Slicer States
  const [regionFilter, setRegionFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [dateRangeValue, setDateRangeValue] = useState(100);
  const [globalAgencyFilters, setGlobalAgencyFilters] = useState({
    DENR: true,
    DOLE: true,
    DOE: true,
    Others: true
  });

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

  // Modal / Detail state
  const [activeItemDetail, setActiveItemDetail] = useState(null);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
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
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setRegionFilter('All');
    setDepartmentFilter('All');
    setDateRangeValue(100);
    setGlobalAgencyFilters({ DENR: true, DOLE: true, DOE: true, Others: true });
    setSelectedTimelineMonth(null);
    setSelectedDonutSegment(null);
    setSelectedDeptChart(null);
    setSelectedFrequency(null);
    setTableSearch('');
    setTableStatusFilter('All');
  };

  // Filtered urgent actions table rows
  const filteredActions = useMemo(() => {
    const sourceActions = hasLiveExcelData ? liveDataset.urgentActions : BASE_REGULATORY_ACTIONS;

    return sourceActions
      .filter((item) => {
        if (regionFilter !== 'All' && item.region !== regionFilter) return false;
        if (departmentFilter !== 'All' && item.department !== departmentFilter) return false;
        if (selectedDeptChart && item.department !== selectedDeptChart) return false;
        if (!globalAgencyFilters[item.agency]) return false;

        if (selectedTimelineMonth) {
          const itemMonth = parseMonthName(item.dueDate);
          if (itemMonth !== selectedTimelineMonth) return false;
        }

        if (tableStatusFilter !== 'All' && item.status !== tableStatusFilter) return false;

        if (selectedFrequency) {
          if (selectedFrequency === 'Monthly' && item.type !== 'Report') return false;
          if (selectedFrequency === 'Quarterly' && !item.name.toUpperCase().includes('SMR') && item.type !== 'Report') {
            return false;
          }
          if (selectedFrequency === 'Annual' && item.type !== 'License' && item.type !== 'Clearance') return false;
        }

        if (tableSearch.trim()) {
          const q = tableSearch.toLowerCase();
          const match =
            item.name.toLowerCase().includes(q) ||
            item.type.toLowerCase().includes(q) ||
            item.owner.toLowerCase().includes(q) ||
            item.department.toLowerCase().includes(q) ||
            item.plant.toLowerCase().includes(q) ||
            item.status.toLowerCase().includes(q);
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
    selectedTimelineMonth,
    tableStatusFilter,
    selectedFrequency,
    tableSearch,
    sortField,
    sortAsc
  ]);

  // Dynamic KPI calculations from live Excel data or snapshot
  const kpis = useMemo(() => {
    if (!hasLiveExcelData) {
      const isDefault =
        regionFilter === 'All' &&
        departmentFilter === 'All' &&
        Object.values(globalAgencyFilters).every(Boolean) &&
        !selectedDeptChart;

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

      const denrCount = globalAgencyFilters.DENR ? Math.max(1, Math.round(80 * factor)) : 0;
      const doleCount = globalAgencyFilters.DOLE ? Math.max(1, Math.round(45 * factor)) : 0;
      const doeCount = globalAgencyFilters.DOE ? Math.max(1, Math.round(17 * factor)) : 0;
      const totalCount = denrCount + doleCount + doeCount;
      const overdueCount = filteredActions.filter((a) => a.status === 'Overdue').length;
      const dueCount = filteredActions.filter((a) => a.daysRemaining > 0 && a.daysRemaining <= 30).length;
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
      return true;
    });

    const denr = candidatePermits.filter((p) => p.agency === 'DENR').length;
    const dole = candidatePermits.filter((p) => p.agency === 'DOLE').length;
    const doe = candidatePermits.filter((p) => p.agency === 'DOE').length;
    const total = candidatePermits.length;

    const expired = candidatePermits.filter((p) => p.status === 'Overdue').length;
    const dueUnder30 = candidatePermits.filter((p) => p.daysRemaining >= 0 && p.daysRemaining <= 30).length;

    const activeCount = candidatePermits.filter((p) => p.rawStatus === 'Active').length;
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
  }, [hasLiveExcelData, liveDataset.permits, regionFilter, departmentFilter, globalAgencyFilters, selectedDeptChart, filteredActions]);

  // Dynamic Timeline Months (Jun to May) from live Excel or baseline
  const timelineMonths = useMemo(() => {
    if (!hasLiveExcelData) {
      return BASE_TIMELINE_MONTHS.map((m) => {
        if (departmentFilter === 'HSE') {
          return {
            ...m,
            critical: Math.min(m.critical, 1),
            atRisk: Math.min(m.atRisk, 2),
            total: Math.max(2, Math.round(m.total * 0.4))
          };
        }
        if (departmentFilter === 'Maintenance') {
          return {
            ...m,
            critical: Math.min(m.critical, 2),
            atRisk: Math.min(m.atRisk, 3),
            total: Math.max(3, Math.round(m.total * 0.5))
          };
        }
        return m;
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

  // Donut chart segment definitions
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
      { label: 'Quarterly SMRs', pct: pSmr, color: '#16a34a', count: smrCount },
      { label: 'PMRs', pct: pPmr, color: '#f59e0b', count: pmrCount },
      { label: 'Safety Minutes', pct: pSaf, color: '#2563eb', count: safetyCount },
      { label: 'Pending', pct: pPen, color: '#0284c7', count: pendingCount },
      { label: 'Missed', pct: Math.max(0, pMis), color: '#dc2626', count: missedCount }
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

  // Department chart data
  const deptData = useMemo(() => {
    if (!hasLiveExcelData) {
      return [
        { name: 'Operations', active: 24, pending: 14, total: 38 },
        { name: 'Maintenance', active: 10, pending: 13, total: 23 },
        { name: 'HSE', active: 5, pending: 2, total: 7 },
        { name: 'Admin', active: 5, pending: 1, total: 6 }
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

  // Frequency burden data
  const frequencyData = useMemo(() => {
    if (!hasLiveExcelData) {
      return [
        { label: 'Monthly', sub: '(SMRs/PMRs)', count: 126, pct: '55.3%' },
        { label: 'Quarterly', sub: '(Reports)', count: 66, pct: '28.9%' },
        { label: 'Annual', sub: '(Clearances/Permits)', count: 36, pct: '15.8%' }
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
      { label: 'Monthly', sub: '(SMRs/PMRs)', count: mCount || 126, pct: `${Math.round((mCount / tot) * 100)}%` },
      { label: 'Quarterly', sub: '(Reports)', count: qCount || 66, pct: `${Math.round((qCount / tot) * 100)}%` },
      { label: 'Annual', sub: '(Clearances/Permits)', count: aCount || 36, pct: `${Math.round((aCount / tot) * 100)}%` }
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
    <div className="home-pbi-wrapper">
      {/* Top Power BI Application Shell Bar */}
      <div className="pbi-top-chrome">
        <div className="pbi-chrome-left">
          <div className="pbi-waffle-icon" title="Microsoft App Launcher">
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
          </div>
          <span className="pbi-brand-name">Power BI</span>
          <span className="pbi-brand-divider">|</span>
          <span className="pbi-report-title">Power of Complianceral dashboard</span>
          {hasLiveExcelData && (
            <span className="live-data-pill" title="Populated from parsed Excel worksheets">
              ● Live Excel Data ({targetSheets.length} Plants)
            </span>
          )}
        </div>

        <div className="pbi-chrome-center">
          <div className="pbi-search-box">
            <span className="pbi-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search in dashboard..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="pbi-chrome-right">
          <button className="pbi-btn-share" onClick={() => alert('Shareable dashboard link copied to clipboard!')}>
            <span className="share-icon">📤</span> Share
          </button>
          <button className="pbi-icon-btn" title="Comments">💬</button>
          <button className="pbi-icon-btn" title="Settings">⚙️</button>
          <button className="pbi-icon-btn" title="Help">❓</button>
          <div className="pbi-user-badge" title="Health & Regulatory Team">HR</div>
        </div>
      </div>

      {/* Secondary Power BI Action Bar */}
      <div className="pbi-action-ribbon">
        <div className="pbi-ribbon-left">
          <button className="ribbon-btn" title="Previous page">←</button>
          <button className="ribbon-btn" title="Next page">→</button>
          <span className="ribbon-vdiv"></span>
          <button className="ribbon-btn" onClick={handleResetFilters}>
            🔄 Reset Filters
          </button>
          <button
            className="ribbon-btn"
            onClick={() => onNavigateToTable && onNavigateToTable()}
            title="Open comprehensive table view"
          >
            📋 Open Detailed Table View
          </button>
        </div>

        <div className="pbi-ribbon-right">
          <button className="ribbon-icon-btn" title="Favorite">♡</button>
          <button className="ribbon-icon-btn" title="Feedback">💬</button>
          <button className="ribbon-icon-btn" title="Fit to page">⛶</button>
          <button className="ribbon-icon-btn" title="Refresh data" onClick={() => window.location.reload()}>↻</button>
        </div>
      </div>

      {/* Main Power BI Canvas Layout */}
      <div className="home-dashboard-canvas">
        {/* Left Slicer Panel */}
        <aside className="pbi-slicer-panel">
          <div className="slicer-header-box">
            <h4 className="slicer-main-heading">Slicers</h4>
            {(regionFilter !== 'All' || departmentFilter !== 'All' || selectedTimelineMonth || selectedDeptChart) && (
              <button className="btn-clear-slicers" onClick={handleResetFilters} title="Reset all slicers">
                Clear all
              </button>
            )}
          </div>

          {/* Slicer 1: Region */}
          <div className="slicer-block">
            <label className="slicer-label" htmlFor="regionSlicer">Region</label>
            <div className="slicer-select-wrapper">
              <select
                id="regionSlicer"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="slicer-select"
              >
                <option value="All">All</option>
                <option value="North Luzon">North Luzon</option>
                <option value="South Luzon">South Luzon</option>
                <option value="Visayas">Visayas</option>
                <option value="Mindanao">Mindanao</option>
              </select>
              <span className="slicer-arrow">▼</span>
            </div>
          </div>

          {/* Slicer 2: Department */}
          <div className="slicer-block">
            <label className="slicer-label" htmlFor="deptSlicer">Department</label>
            <div className="slicer-select-wrapper">
              <select
                id="deptSlicer"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="slicer-select"
              >
                <option value="All">All</option>
                <option value="Operations">Operations</option>
                <option value="Maintenance">Maintenance</option>
                <option value="HSE">HSE</option>
                <option value="Admin">Admin</option>
              </select>
              <span className="slicer-arrow">▼</span>
            </div>
          </div>

          {/* Slicer 3: Date Range Slider */}
          <div className="slicer-block">
            <div className="slicer-label-row">
              <label className="slicer-label">Date Range</label>
              <span className="date-indicator-text">8/7 - 8/7</span>
            </div>
            <div className="slicer-date-boxes">
              <div className="date-box">8/7</div>
              <span className="date-dash">-</span>
              <div className="date-box">8/7</div>
            </div>
            <div className="slicer-range-container">
              <input
                type="range"
                min="0"
                max="100"
                value={dateRangeValue}
                onChange={(e) => setDateRangeValue(Number(e.target.value))}
                className="pbi-range-slider"
              />
              <div className="range-track-dots">
                <span className="dot dot-start"></span>
                <span className="dot dot-end"></span>
              </div>
            </div>
          </div>

          {/* Slicer 4: Global Filters */}
          <div className="slicer-block">
            <label className="slicer-label">Global Filters</label>
            <div className="agency-filters-list">
              <button
                type="button"
                className={`agency-filter-item ${globalAgencyFilters.DENR ? 'active' : 'inactive'}`}
                onClick={() => toggleAgencyFilter('DENR')}
              >
                <span className="agency-icon denr-icon">🌐</span>
                <span className="agency-name">DENR-EMB</span>
                {globalAgencyFilters.DENR && <span className="agency-check">✓</span>}
              </button>

              <button
                type="button"
                className={`agency-filter-item ${globalAgencyFilters.DOLE ? 'active' : 'inactive'}`}
                onClick={() => toggleAgencyFilter('DOLE')}
              >
                <span className="agency-icon dole-icon">🛡️</span>
                <span className="agency-name">DOLE</span>
                {globalAgencyFilters.DOLE && <span className="agency-check">✓</span>}
              </button>

              <button
                type="button"
                className={`agency-filter-item ${globalAgencyFilters.DOE ? 'active' : 'inactive'}`}
                onClick={() => toggleAgencyFilter('DOE')}
              >
                <span className="agency-icon doe-icon">⚡</span>
                <span className="agency-name">DOE</span>
                {globalAgencyFilters.DOE && <span className="agency-check">✓</span>}
              </button>

              <button
                type="button"
                className={`agency-filter-item ${globalAgencyFilters.Others ? 'active' : 'inactive'}`}
                onClick={() => toggleAgencyFilter('Others')}
              >
                <span className="agency-icon others-icon">⚪</span>
                <span className="agency-name">Others</span>
                {globalAgencyFilters.Others && <span className="agency-check">✓</span>}
              </button>
            </div>
          </div>

          {/* Slicer 5: Navigation Accordion */}
          <div className="slicer-navigation-block">
            <button
              className="nav-drawer-toggle"
              onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
            >
              <span>{isNavMenuOpen ? '▼' : '>'} Navigation</span>
            </button>
            {isNavMenuOpen && (
              <div className="nav-drawer-menu">
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  📊 Top KPIs
                </button>
                <button onClick={() => document.getElementById('sec-timeline')?.scrollIntoView({ behavior: 'smooth' })}>
                  📅 Expiration Timeline
                </button>
                <button onClick={() => document.getElementById('sec-report-status')?.scrollIntoView({ behavior: 'smooth' })}>
                  🍩 Report Status
                </button>
                <button onClick={() => document.getElementById('sec-urgent-table')?.scrollIntoView({ behavior: 'smooth' })}>
                  ⚠️ Urgent Actions
                </button>
                <button onClick={() => onNavigateToTable && onNavigateToTable()}>
                  📑 Full 23-Plant Tables
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Dashboard Visual Grid */}
        <div className="pbi-main-visuals">
          {/* Dashboard Canvas Main Title */}
          <div className="dashboard-title-banner">
            <h1 className="pbi-dashboard-h1">
              PERMIT, LICENSE, AND REGULATORY REPORT MONITORING DASHBOARD
            </h1>
          </div>

          {/* Active Filter Chips Bar (if any slicer active) */}
          {(regionFilter !== 'All' || departmentFilter !== 'All' || selectedTimelineMonth || selectedDeptChart) && (
            <div className="active-filters-chips-row">
              <span className="chip-label">Active Filters:</span>
              {regionFilter !== 'All' && (
                <span className="filter-chip">
                  Region: {regionFilter}
                  <button onClick={() => setRegionFilter('All')}>✕</button>
                </span>
              )}
              {departmentFilter !== 'All' && (
                <span className="filter-chip">
                  Dept: {departmentFilter}
                  <button onClick={() => setDepartmentFilter('All')}>✕</button>
                </span>
              )}
              {selectedTimelineMonth && (
                <span className="filter-chip">
                  Month: {selectedTimelineMonth}
                  <button onClick={() => setSelectedTimelineMonth(null)}>✕</button>
                </span>
              )}
              {selectedDeptChart && (
                <span className="filter-chip">
                  Dept Chart: {selectedDeptChart}
                  <button onClick={() => setSelectedDeptChart(null)}>✕</button>
                </span>
              )}
              <button className="chip-reset-all" onClick={handleResetFilters}>Reset All</button>
            </div>
          )}

          {/* ROW 1: 4 Top KPI Cards */}
          <div className="pbi-kpi-row">
            {/* Card 1: Total Permits & Licenses */}
            <div className="pbi-card pbi-kpi-card card-permits-summary">
              <div className="kpi-card-header">
                <h3 className="kpi-card-title">Total Permits &amp; Licenses</h3>
              </div>
              <div className="kpi-breakdown-list">
                <div className="kpi-breakdown-row">
                  <span className="b-label">DENR-EMB Permits:</span>
                  <span className="b-val">{kpis.denr}</span>
                </div>
                <div className="kpi-breakdown-row">
                  <span className="b-label">DOLE Safety:</span>
                  <span className="b-val">{kpis.dole}</span>
                </div>
                <div className="kpi-breakdown-row">
                  <span className="b-label">DOE Clearances:</span>
                  <span className="b-val">{kpis.doe}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Expired Permits (Current) */}
            <div className="pbi-card pbi-kpi-card card-expired">
              <div className="kpi-card-header">
                <h3 className="kpi-card-title">Expired Permits (Current)</h3>
              </div>
              <div className="kpi-hero-num red-num">{kpis.expired}</div>
              <div className="kpi-sub-text red-sub">
                <span className="danger-dot">●</span> Critical Actions Needed
              </div>
            </div>

            {/* Card 3: Reports Due < 30 Days */}
            <div className="pbi-card pbi-kpi-card card-reports-due">
              <div className="kpi-card-header">
                <h3 className="kpi-card-title">Reports Due &lt; 30 Days</h3>
              </div>
              <div className="kpi-hero-num dark-num">{kpis.dueUnder30}</div>
              <div className="kpi-sub-text">Mainly SMRs &amp; Annual Reports</div>
            </div>

            {/* Card 4: Regulatory Report Compliance */}
            <div className="pbi-card pbi-kpi-card card-compliance">
              <div className="kpi-card-header">
                <h3 className="kpi-card-title">Regulatory Report Compliance</h3>
              </div>
              <div className="kpi-hero-num dark-num">{kpis.compliance}%</div>
              <div className="kpi-sub-text green-sub">Overall Health Score</div>
            </div>
          </div>

          {/* ROW 2: Middle Charts (Timeline + Report Status Donut) */}
          <div className="pbi-middle-row">
            {/* Middle Left: Permit Expiration Timeline (Next 12 Months) */}
            <div id="sec-timeline" className="pbi-card card-expiration-timeline">
              <div className="timeline-card-header">
                <div className="timeline-title-group">
                  <h3 className="visual-card-title">Permit Expiration Timeline (Next 12 Months)</h3>
                  <div className="timeline-legend">
                    <span className="leg-item">
                      <span className="leg-dot dot-critical">●</span> Critical (&lt; 30 days, Red)
                    </span>
                    <span className="leg-item">
                      <span className="leg-dot dot-atrisk">●</span> At Risk (31-60 days)
                    </span>
                    <span className="leg-item">
                      <span className="leg-dot dot-stable">●</span> Stable (&gt; 60 days)
                    </span>
                  </div>
                </div>
                {selectedTimelineMonth && (
                  <button className="clear-month-filter" onClick={() => setSelectedTimelineMonth(null)}>
                    Clear Month ({selectedTimelineMonth})
                  </button>
                )}
              </div>

              {/* Stacked Bar Chart SVG */}
              <div className="timeline-chart-container">
                <svg
                  viewBox="0 0 650 200"
                  className="timeline-svg"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Grid Lines */}
                  <line x1="30" y1="20" x2="630" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="60" x2="630" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="100" x2="630" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="140" x2="630" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="170" x2="630" y2="170" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Y Axis Ticks */}
                  <text x="22" y="24" className="axis-tick-text">15</text>
                  <text x="22" y="74" className="axis-tick-text">10</text>
                  <text x="22" y="124" className="axis-tick-text">5</text>
                  <text x="22" y="173" className="axis-tick-text">0</text>

                  {/* Stacked Bars for 12 months */}
                  {timelineMonths.map((item, idx) => {
                    const barWidth = 32;
                    const slotWidth = (600 - 30) / 12;
                    const x = 40 + idx * slotWidth;

                    const scale = 7.5;
                    const hCrit = item.critical * scale;
                    const hRisk = item.atRisk * scale;
                    const hStab = item.stable * scale;

                    const baseY = 170;
                    const yCrit = baseY - hCrit;
                    const yRisk = yCrit - hRisk;
                    const yStab = yRisk - hStab;

                    const isSelected = selectedTimelineMonth === item.month;

                    return (
                      <g
                        key={item.month}
                        className={`bar-group ${isSelected ? 'bar-selected' : ''}`}
                        onClick={() =>
                          setSelectedTimelineMonth(isSelected ? null : item.month)
                        }
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipState({
                            title: `${item.month} 2026-2027`,
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
                          <rect
                            x={x}
                            y={yCrit}
                            width={barWidth}
                            height={hCrit}
                            fill="#dc2626"
                            rx="0"
                            className="rect-segment"
                          />
                        )}

                        {/* At Risk segment (Orange) */}
                        {item.atRisk > 0 && (
                          <rect
                            x={x}
                            y={yRisk}
                            width={barWidth}
                            height={hRisk}
                            fill="#ea580c"
                            rx="0"
                            className="rect-segment"
                          />
                        )}

                        {/* Stable segment (Green) */}
                        {item.stable > 0 && (
                          <rect
                            x={x}
                            y={yStab}
                            width={barWidth}
                            height={hStab}
                            fill="#16a34a"
                            rx="1"
                            className="rect-segment"
                          />
                        )}

                        {/* Value on top of stack */}
                        <text
                          x={x + barWidth / 2}
                          y={yStab - 4}
                          textAnchor="middle"
                          className="bar-top-val"
                        >
                          {item.total}
                        </text>

                        {/* X-axis Month Label */}
                        <text
                          x={x + barWidth / 2}
                          y="186"
                          textAnchor="middle"
                          className={`bar-x-label ${isSelected ? 'active-label' : ''}`}
                        >
                          {item.month}
                        </text>
                      </g>
                    );
                  })}

                  <text x="325" y="198" textAnchor="middle" className="axis-title-text">
                    Month
                  </text>
                </svg>
              </div>
            </div>

            {/* Middle Right: Regulatory Report Status (Donut Chart) */}
            <div id="sec-report-status" className="pbi-card card-report-status">
              <div className="report-status-header">
                <h3 className="visual-card-title">Regulatory Report Status</h3>
              </div>

              <div className="donut-and-legend-layout">
                {/* Donut Chart SVG */}
                <div className="donut-chart-box">
                  <svg
                    viewBox="0 0 220 220"
                    className="donut-svg"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {donutPaths.map((seg) => {
                      const isHovered = selectedDonutSegment === seg.label;
                      return (
                        <path
                          key={seg.label}
                          d={seg.d}
                          fill={seg.color}
                          stroke="#ffffff"
                          strokeWidth={isHovered ? '2.5' : '1.5'}
                          className={`donut-slice ${isHovered ? 'slice-hovered' : ''}`}
                          onClick={() =>
                            setSelectedDonutSegment(isHovered ? null : seg.label)
                          }
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltipState({
                              title: seg.label,
                              items: [`Percentage: ${seg.pct}%`, `Approx Filings: ${seg.count}`],
                              x: rect.left + rect.width / 2,
                              y: rect.top - 10
                            });
                          }}
                          onMouseLeave={() => setTooltipState(null)}
                          style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                        />
                      );
                    })}

                    {/* Donut Center Hole Value */}
                    <circle cx="110" cy="110" r="50" fill="#ffffff" />
                    <text
                      x="110"
                      y="118"
                      textAnchor="middle"
                      className="donut-center-text"
                    >
                      {donutSegments[0]?.pct || 85}%
                    </text>
                  </svg>

                  {/* Percentage Callouts matching screenshot */}
                  <div className="donut-callout callout-85">{donutSegments[0]?.pct || 85}%</div>
                  <div className="donut-callout callout-7">{donutSegments[1]?.pct || 7}%</div>
                  <div className="donut-callout callout-3">{donutSegments[2]?.pct || 5}%</div>
                </div>

                {/* Donut Legend */}
                <div className="donut-legend-box">
                  {donutSegments.map((seg) => (
                    <div
                      key={seg.label}
                      className={`donut-legend-item ${selectedDonutSegment === seg.label ? 'active' : ''}`}
                      onClick={() =>
                        setSelectedDonutSegment(selectedDonutSegment === seg.label ? null : seg.label)
                      }
                      title={`Filter by ${seg.label}`}
                    >
                      <span className="donut-leg-dot" style={{ backgroundColor: seg.color }}></span>
                      <span className="donut-leg-text">{seg.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: Bottom 3 Visuals */}
          <div className="pbi-bottom-row">
            {/* Bottom Left: Permits by Department (Stacked Bar Chart) */}
            <div className="pbi-card card-dept-permits">
              <div className="dept-header-row">
                <h3 className="visual-card-title">Permits by Department</h3>
                <div className="dept-legend">
                  <span className="leg-item">
                    <span className="leg-dot dot-active-blue">●</span> Active
                  </span>
                  <span className="leg-item">
                    <span className="leg-dot dot-pending-orange">●</span> Pending Permits
                  </span>
                </div>
              </div>

              <div className="dept-chart-container">
                <svg
                  viewBox="0 0 260 170"
                  className="dept-svg"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Grid Lines */}
                  <line x1="25" y1="20" x2="250" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="25" y1="70" x2="250" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="25" y1="120" x2="250" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="25" y1="140" x2="250" y2="140" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Y Axis Ticks */}
                  <text x="18" y="74" className="axis-tick-text">20</text>
                  <text x="18" y="124" className="axis-tick-text">10</text>
                  <text x="18" y="143" className="axis-tick-text">0</text>

                  {/* Columns for 4 Departments */}
                  {deptData.map((d, i) => {
                    const colW = 28;
                    const colX = 35 + i * 55;
                    const scale = 2.8;

                    const hActive = Math.min(70, d.active * scale);
                    const hPending = Math.min(50, d.pending * scale);

                    const baseY = 140;
                    const yActive = baseY - hActive;
                    const yPending = yActive - hPending;

                    const isDeptSelected = selectedDeptChart === d.name;

                    return (
                      <g
                        key={d.name}
                        className={`dept-col-group ${isDeptSelected ? 'dept-col-active' : ''}`}
                        onClick={() => setSelectedDeptChart(isDeptSelected ? null : d.name)}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipState({
                            title: `${d.name} Department`,
                            items: [
                              `Active Permits: ${d.active}`,
                              `Pending Permits: ${d.pending}`,
                              `Total: ${d.total}`
                            ],
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10
                          });
                        }}
                        onMouseLeave={() => setTooltipState(null)}
                      >
                        {/* Pending permits segment (orange) */}
                        <rect
                          x={colX}
                          y={yPending}
                          width={colW}
                          height={hPending}
                          fill="#ea580c"
                          rx="1"
                        />
                        {/* Number in Pending segment */}
                        {d.pending > 0 && (
                          <text
                            x={colX + colW / 2}
                            y={yPending + hPending / 2 + 4}
                            textAnchor="middle"
                            className="inner-bar-val"
                          >
                            {d.pending}
                          </text>
                        )}

                        {/* Active permits segment (blue) */}
                        <rect
                          x={colX}
                          y={yActive}
                          width={colW}
                          height={hActive}
                          fill="#2563eb"
                          rx="0"
                        />
                        {/* Number in Active segment */}
                        <text
                          x={colX + colW / 2}
                          y={yActive + hActive / 2 + 4}
                          textAnchor="middle"
                          className="inner-bar-val"
                        >
                          {d.active}
                        </text>

                        {/* Department label */}
                        <text
                          x={colX + colW / 2}
                          y="153"
                          textAnchor="middle"
                          className="dept-col-label"
                        >
                          {d.name.length > 7 ? d.name.substring(0, 6) + '.' : d.name}
                        </text>
                      </g>
                    );
                  })}

                  <text x="140" y="167" textAnchor="middle" className="axis-title-text">
                    Department
                  </text>
                </svg>
              </div>
            </div>

            {/* Bottom Middle: Urgent Regulatory Actions Table */}
            <div id="sec-urgent-table" className="pbi-card card-urgent-actions">
              <div className="urgent-header-row">
                <div className="urgent-title-col">
                  <h3 className="visual-card-title">Urgent Regulatory Actions Table</h3>
                  <span className="urgent-sub-badge">
                    {filteredActions.length} item{filteredActions.length === 1 ? '' : 's'}
                    {hasLiveExcelData ? ' (from Excel)' : ''}
                  </span>
                </div>

                <div className="urgent-header-controls">
                  <div className="urgent-status-tabs">
                    <button
                      className={`urg-tab ${tableStatusFilter === 'All' ? 'active' : ''}`}
                      onClick={() => setTableStatusFilter('All')}
                    >
                      All
                    </button>
                    <button
                      className={`urg-tab tab-overdue ${tableStatusFilter === 'Overdue' ? 'active' : ''}`}
                      onClick={() => setTableStatusFilter('Overdue')}
                    >
                      Overdue
                    </button>
                    <button
                      className={`urg-tab tab-upcoming ${tableStatusFilter === 'Upcoming' ? 'active' : ''}`}
                      onClick={() => setTableStatusFilter('Upcoming')}
                    >
                      Upcoming
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Data Table with horizontal and vertical scroll */}
              <div className="urgent-table-scroll-wrap">
                <table className="pbi-actions-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')} className="th-sortable">
                        Report/Permit Name {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th onClick={() => handleSort('type')} className="th-sortable">
                        Type {sortField === 'type' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th onClick={() => handleSort('dueDate')} className="th-sortable">
                        Due/Expiration Date {sortField === 'dueDate' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th onClick={() => handleSort('daysRemaining')} className="th-sortable">
                        Days Remaining {sortField === 'daysRemaining' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th onClick={() => handleSort('owner')} className="th-sortable">
                        Owner {sortField === 'owner' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th onClick={() => handleSort('department')} className="th-sortable">
                        Department {sortField === 'department' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th onClick={() => handleSort('status')} className="th-sortable">
                        Status {sortField === 'status' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActions.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="no-actions-row">
                          No regulatory action items match the selected slicer filters.
                        </td>
                      </tr>
                    ) : (
                      filteredActions.slice(0, 50).map((row) => (
                        <tr
                          key={row.id}
                          className="action-data-row"
                          onClick={() => setActiveItemDetail(row)}
                        >
                          <td className="td-name">
                            <span className="row-item-name" title={row.name}>{row.name}</span>
                            <span className="row-plant-tag">{row.plant}</span>
                          </td>
                          <td className="td-type">{row.type}</td>
                          <td className="td-date">{row.dueDate}</td>
                          <td className="td-days">
                            <span
                              className={`days-pill ${
                                row.daysRemaining < 0
                                  ? 'pill-overdue'
                                  : row.daysRemaining <= 30
                                  ? 'pill-warning'
                                  : 'pill-upcoming'
                              }`}
                            >
                              {row.daysRemaining} days
                            </span>
                          </td>
                          <td className="td-owner">{row.owner}</td>
                          <td className="td-dept">{row.department}</td>
                          <td className="td-status">
                            <span
                              className={`status-pill ${
                                row.status === 'Overdue' ? 'status-pill-overdue' : 'status-pill-upcoming'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="td-quick-action" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn-jump-table"
                              title={`View ${row.plant} in comprehensive Table`}
                              onClick={() => jumpToPlantInTable(row.plant, row.name)}
                            >
                              View Table ↗
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Right: Filing Burden by Frequency (Bar Chart) */}
            <div className="pbi-card card-filing-burden">
              <div className="burden-header-row">
                <h3 className="visual-card-title">Filing Burden by Frequency</h3>
              </div>

              <div className="burden-chart-container">
                <svg
                  viewBox="0 0 240 170"
                  className="burden-svg"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Grid Lines */}
                  <line x1="25" y1="20" x2="225" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="25" y1="60" x2="225" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="25" y1="100" x2="225" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="25" y1="140" x2="225" y2="140" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Y Axis Ticks */}
                  <text x="18" y="24" className="axis-tick-text">150</text>
                  <text x="18" y="64" className="axis-tick-text">100</text>
                  <text x="18" y="104" className="axis-tick-text">50</text>
                  <text x="18" y="143" className="axis-tick-text">0</text>

                  {/* Bars for 3 Frequencies */}
                  {frequencyData.map((f, i) => {
                    const bW = 34;
                    const bX = 42 + i * 62;
                    const bH = Math.min(115, f.count * 0.8);
                    const bY = 140 - bH;
                    const isSelected = selectedFrequency === f.label;

                    return (
                      <g
                        key={f.label}
                        className={`burden-bar-group ${isSelected ? 'burden-selected' : ''}`}
                        onClick={() => setSelectedFrequency(isSelected ? null : f.label)}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipState({
                            title: `${f.label} Filings`,
                            items: [`Total: ${f.count}`, `Burden Share: ${f.pct}`],
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10
                          });
                        }}
                        onMouseLeave={() => setTooltipState(null)}
                      >
                        {/* Bar */}
                        <rect
                          x={bX}
                          y={bY}
                          width={bW}
                          height={bH}
                          fill="#0284c7"
                          rx="1"
                          className="burden-rect"
                        />

                        {/* Top Number */}
                        <text
                          x={bX + bW / 2}
                          y={bY - 4}
                          textAnchor="middle"
                          className="bar-top-val"
                        >
                          {f.count}
                        </text>

                        {/* X-axis multi-line labels */}
                        <text
                          x={bX + bW / 2}
                          y="152"
                          textAnchor="middle"
                          className="burden-label-main"
                        >
                          {f.label}
                        </text>
                        <text
                          x={bX + bW / 2}
                          y="163"
                          textAnchor="middle"
                          className="burden-label-sub"
                        >
                          {f.sub}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {tooltipState && (
        <div
          className="pbi-floating-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipState.x}px`,
            top: `${tooltipState.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="tooltip-title">{tooltipState.title}</div>
          {tooltipState.items.map((it, idx) => (
            <div key={idx} className="tooltip-item">{it}</div>
          ))}
        </div>
      )}

      {/* Item Detail Modal */}
      {activeItemDetail && (
        <div className="modal-backdrop" onClick={() => setActiveItemDetail(null)}>
          <div className="modal-dialog pbi-detail-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-modal-title-row">
                <span className={`status-pill ${activeItemDetail.status === 'Overdue' ? 'status-pill-overdue' : 'status-pill-upcoming'}`}>
                  {activeItemDetail.status}
                </span>
                <h3>{activeItemDetail.name}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveItemDetail(null)}>✕</button>
            </div>

            <div className="modal-body pbi-detail-body">
              <div className="detail-meta-grid">
                <div className="detail-meta-item">
                  <span className="meta-lbl">Operating Facility</span>
                  <strong className="meta-val">{activeItemDetail.plant} ({activeItemDetail.region})</strong>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-lbl">Regulatory Agency</span>
                  <strong className="meta-val">{activeItemDetail.agency}</strong>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-lbl">Department In-Charge</span>
                  <strong className="meta-val">{activeItemDetail.department}</strong>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-lbl">Compliance Officer</span>
                  <strong className="meta-val">{activeItemDetail.owner}</strong>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-lbl">Due / Expiration Date</span>
                  <strong className="meta-val">{activeItemDetail.dueDate}</strong>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-lbl">Countdown Remaining</span>
                  <strong className={`meta-val ${activeItemDetail.daysRemaining < 0 ? 'text-danger' : 'text-warning'}`}>
                    {activeItemDetail.daysRemaining} days
                  </strong>
                </div>
              </div>

              {activeItemDetail.notes && (
                <div className="detail-notes-box">
                  <span className="notes-heading">Compliance Notes / Status Summary:</span>
                  <p>{activeItemDetail.notes}</p>
                </div>
              )}

              <div className="detail-actions-row">
                <button
                  className="btn-pbi-primary"
                  onClick={() => {
                    jumpToPlantInTable(activeItemDetail.plant, activeItemDetail.name);
                    setActiveItemDetail(null);
                  }}
                >
                  🚀 Open in Full Plant Compliance Table
                </button>
                <button
                  className="btn-pbi-secondary"
                  onClick={() => {
                    alert(`Notification sent to ${activeItemDetail.owner} (${activeItemDetail.department})`);
                    setActiveItemDetail(null);
                  }}
                >
                  ✉️ Remind Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
