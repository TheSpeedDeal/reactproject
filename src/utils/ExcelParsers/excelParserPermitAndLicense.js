import * as XLSX from 'xlsx';

export const VALID_PREFIXES = ['BMP', 'MPH', 'MPPP', 'MPF'];

export const FACILITY_TYPES = {
  BMP: {
    code: 'BMP',
    label: 'Feedmill & Processing',
    icon: '🏭',
    color: '#06b6d4', // Cyan
    bg: 'rgba(6, 182, 212, 0.12)'
  },
  MPH: {
    code: 'MPH',
    label: 'Poultry Hatchery',
    icon: '🐣',
    color: '#f59e0b', // Amber
    bg: 'rgba(245, 158, 11, 0.12)'
  },
  MPPP: {
    code: 'MPPP',
    label: 'Poultry Processing Plant',
    icon: '🍗',
    color: '#ec4899', // Pink
    bg: 'rgba(236, 72, 153, 0.12)'
  },
  MPF: {
    code: 'MPF',
    label: 'Breeding Farm',
    icon: '🌾',
    color: '#10b981', // Emerald
    bg: 'rgba(16, 185, 129, 0.12)'
  }
};

export const DEFAULT_REGIONS = {
  'BMP Pangasinan': 'North Luzon',
  'BMP Isabela': 'North Luzon',
  'BMP Bataan 1': 'North Luzon',
  'BMP Bataan 2': 'North Luzon',
  'BMP Bulacan': 'North Luzon',
  'BMP Tarlac': 'North Luzon',
  'MPF Bataan': 'North Luzon',
  'MPH Bataan': 'North Luzon',
  'BMP Batangas': 'South Luzon',
  'MPPP Quezon': 'South Luzon',
  'MPPP CamSur': 'South Luzon',
  'MPH Laguna': 'South Luzon',
  'MPH CamSur': 'South Luzon',
  'BMP Cebu': 'Visayas',
  'BMP Iloilo 1': 'Visayas',
  'BMP Iloilo 2': 'Visayas',
  'BMP Leyte': 'Visayas',
  'MPPP Cebu': 'Visayas',
  'MPPP Leyte': 'Visayas',
  'BMP DavSur': 'Mindanao',
  'BMP MisOr': 'Mindanao',
  'MPPP DavSur': 'Mindanao',
  'MPF DavSur': 'Mindanao'
};

/**
 * Detect if a URL is a SharePoint or OneDrive link
 */
export function isSharePointUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return false;
  const lower = inputUrl.toLowerCase();
  return (
    lower.includes('sharepoint.com') ||
    lower.includes('1drv.ms') ||
    lower.includes('onedrive.live.com')
  );
}

/**
 * Format a SharePoint or OneDrive URL to trigger direct binary file download
 */
export function formatSharepointUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return '';
  const trimmed = inputUrl.trim();
  try {
    const u = new URL(trimmed);
    if (isSharePointUrl(trimmed)) {
      if (u.searchParams.has('web')) u.searchParams.delete('web');
      if (u.searchParams.has('action')) u.searchParams.delete('action');
      u.searchParams.set('download', '1');
      return u.toString();
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Check if a sheet name matches any of the required prefixes (BMP, MPH, MPPP, MPF)
 */
export function isTargetSheet(sheetName) {
  if (!sheetName || typeof sheetName !== 'string') return false;
  const trimmed = sheetName.trim();
  return VALID_PREFIXES.some(prefix => {
    // Check if starts with prefix followed by space or underscore or end
    return trimmed.startsWith(prefix) && (trimmed.length === prefix.length || trimmed[prefix.length] === ' ' || trimmed[prefix.length] === '_');
  });
}

/**
 * Determine the facility type object from sheet name
 */
export function getFacilityType(sheetName) {
  if (!sheetName) return FACILITY_TYPES.BMP;
  if (sheetName.startsWith('MPPP')) return FACILITY_TYPES.MPPP;
  if (sheetName.startsWith('MPF')) return FACILITY_TYPES.MPF;
  if (sheetName.startsWith('MPH')) return FACILITY_TYPES.MPH;
  if (sheetName.startsWith('BMP')) return FACILITY_TYPES.BMP;
  return {
    code: 'GEN',
    label: 'General Facility',
    icon: '🏢',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)'
  };
}

/**
 * Parse an Excel worksheet containing the 2 tables:
 * 1) Permits and Licenses
 * 2) Reportorial Requirements
 */
export function parsePlantWorksheet(ws, sheetName) {
  if (!ws) {
    return { permits: [], reportorial: [], title: sheetName, metadata: {} };
  }

  // Read formatted strings to preserve Excel displayed dates & numbers
  const formattedRows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  // Read raw values for date/number sorting & calculation
  const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

  let pHeaderIdx = -1;
  let rHeaderIdx = -1;

  for (let i = 0; i < formattedRows.length; i++) {
    const row = formattedRows[i] || [];
    const text = row.map(c => String(c).trim()).join(' ').toLowerCase();
    if (text.includes('regulatory body') && pHeaderIdx === -1) {
      pHeaderIdx = i;
    } else if (text.includes('regulatory body') && pHeaderIdx !== -1) {
      rHeaderIdx = i;
    }
  }

  // Parse Table 1: Permits and Licenses
  const permits = [];
  const pEnd = rHeaderIdx > -1 ? rHeaderIdx : formattedRows.length;
  const pStart = pHeaderIdx > -1 ? pHeaderIdx + 1 : 4;

  for (let i = pStart; i < pEnd; i++) {
    const fRow = formattedRows[i];
    const rRow = rawRows[i] || [];
    if (!fRow) continue;
    const combined = fRow.join('').trim();
    if (!combined) continue;

    // Stop if we hit the title of the second table
    if (fRow.some(c => String(c).toLowerCase().includes('reportorial requirements'))) {
      break;
    }

    // Must have at least regulatory body or description
    if (!fRow[1] && !fRow[2]) continue;

    const daysToExpireNum = rRow[8] !== undefined && rRow[8] !== '' && !isNaN(Number(rRow[8]))
      ? Math.round(Number(rRow[8]))
      : null;

    const statusVal = fRow[7] ? fRow[7].trim() : 'N/A';
    const isExpiringSoon = statusVal === 'Active' && daysToExpireNum !== null && daysToExpireNum > 0 && daysToExpireNum <= 60;

    permits.push({
      id: `permit-${sheetName}-${i}`,
      rowIndex: i + 1,
      itemCode: fRow[0] || '',
      regulatoryBody: fRow[1] || 'Unspecified',
      description: fRow[2] || '',
      applicability: fRow[3] || 'Applicable',
      serialNo: fRow[4] || '',
      dateIssued: fRow[5] || '',
      expirationDate: fRow[6] || '',
      status: statusVal,
      daysToExpire: fRow[8] || (daysToExpireNum !== null ? String(daysToExpireNum) : ''),
      daysToExpireNum: daysToExpireNum,
      isExpiringSoon: isExpiringSoon,
      remarks: fRow.slice(9).filter(Boolean).join(' | ') || '',
      rawExpiration: rRow[6] || null
    });
  }

  // Parse Table 2: Reportorial Requirements
  const reportorial = [];
  const rStart = rHeaderIdx > -1 ? rHeaderIdx + 1 : formattedRows.length;

  for (let i = rStart; i < formattedRows.length; i++) {
    const fRow = formattedRows[i];
    const rRow = rawRows[i] || [];
    if (!fRow) continue;
    const combined = fRow.join('').trim();
    if (!combined) continue;

    // Must have at least regulatory body or report description
    if (!fRow[1] && !fRow[2]) continue;

    reportorial.push({
      id: `report-${sheetName}-${i}`,
      rowIndex: i + 1,
      itemCode: fRow[0] || '',
      regulatoryBody: fRow[1] || 'Unspecified',
      description: fRow[2] || '',
      frequency: fRow[3] || 'Periodic',
      applicability: fRow[4] || 'Applicable',
      dateSubmitted: fRow[5] || '',
      deadline: fRow[6] || '',
      status: fRow[7] ? fRow[7].trim() : 'N/A',
      remarks: fRow.slice(8).filter(Boolean).join(' | ') || '',
      rawDeadline: rRow[6] || null
    });
  }

  return {
    permits,
    reportorial,
    sheetName
  };
}

/**
 * Convert data array to CSV and trigger browser download
 */
export function exportTableToCsv(filename, headers, rows) {
  const csvRows = [];

  // Header row
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // Data rows
  rows.forEach(row => {
    const values = headers.map(headerKey => {
      const val = row[headerKey] !== undefined && row[headerKey] !== null ? String(row[headerKey]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Extract Regulatory Agency from Permit or Report description
 */
export function extractAgency(name) {
  if (!name) return 'Other';
  const clean = name.trim().toUpperCase();
  const prefixes = [
    'DENR', 'DOLE', 'DLE', 'LGU', 'BFP', 'BAI', 'NWRB',
    'DOE', 'ERC', 'FDA', 'NMIS', 'HACCP', 'PNP', 'PDEA'
  ];
  for (const p of prefixes) {
    if (clean.startsWith(p)) {
      return p === 'DLE' ? 'DOLE' : p;
    }
  }
  return 'Other';
}

/**
 * Parse an individual Summary Worksheet (SUMMARY-Permits or SUMMARY-Reportorial)
 */
export function parseSingleSummarySheet(ws, type = 'permits', sheetName = '') {
  if (!ws) return null;
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  let headerIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || [];
    if (
      r[0] && String(r[0]).trim().toLowerCase() === 'region' &&
      r[1] && String(r[1]).trim().toLowerCase() === 'plant'
    ) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return null;
  const headerRow = rows[headerIdx];

  let totalColIdx = -1;
  let activeColIdx = -1;
  let pctColIdx = -1;

  for (let c = headerRow.length - 1; c >= 2; c--) {
    const txt = String(headerRow[c] || '').toLowerCase();
    if (txt.includes('%') && pctColIdx === -1) {
      pctColIdx = c;
    } else if ((txt.includes('active') || txt.includes('updated')) && activeColIdx === -1) {
      activeColIdx = c;
    } else if (txt.includes('total') && totalColIdx === -1) {
      totalColIdx = c;
    }
  }

  const itemsEndCol = totalColIdx > -1 ? totalColIdx : headerRow.length;
  const items = [];
  for (let c = 2; c < itemsEndCol; c++) {
    const name = String(headerRow[c] || '').trim();
    if (name && !name.toLowerCase().startsWith('column')) {
      items.push({
        id: `item-${c}`,
        colIndex: c,
        name,
        agency: extractAgency(name)
      });
    }
  }

  const plants = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row[0] || !row[1]) continue;
    const region = String(row[0]).trim();
    const plant = String(row[1]).trim();
    if (!['North Luzon', 'South Luzon', 'Visayas', 'Mindanao'].includes(region)) continue;

    const values = {};
    let compCount = 0;
    let nonCompCount = 0;
    let naCount = 0;

    items.forEach(item => {
      const rawCell = String(row[item.colIndex] || '').trim();
      const cellVal = rawCell.toLowerCase();
      let status = 'na';

      if (cellVal === '✓' || cellVal === 'v' || cellVal === '1' || cellVal === 'yes' || cellVal === 'active') {
        status = 'compliant';
        compCount++;
      } else if (cellVal === 'x' || cellVal === '0' || cellVal === 'no' || cellVal === 'inactive') {
        status = 'non-compliant';
        nonCompCount++;
      } else {
        naCount++;
      }

      values[item.name] = {
        status,
        raw: rawCell
      };
    });

    const totalApp = totalColIdx > -1 && row[totalColIdx] !== '' && !isNaN(Number(row[totalColIdx]))
      ? Number(row[totalColIdx])
      : compCount + nonCompCount;

    const activeVal = activeColIdx > -1 && row[activeColIdx] !== '' && !isNaN(Number(row[activeColIdx]))
      ? Number(row[activeColIdx])
      : compCount;

    const pctVal = pctColIdx > -1 && row[pctColIdx] !== '' && !isNaN(Number(row[pctColIdx]))
      ? Number(row[pctColIdx])
      : (totalApp > 0 ? activeVal / totalApp : 0);

    plants.push({
      id: `plant-sum-${plant.replace(/\s+/g, '-')}`,
      region,
      plant,
      facilityType: getFacilityType(plant),
      values,
      totalApplicable: totalApp,
      activeCount: activeVal,
      nonCompliantCount: totalApp - activeVal,
      complianceRate: Math.round(pctVal * 100),
      rawPct: pctVal
    });
  }

  // Column level stats across plants
  const itemStats = items.map(item => {
    let app = 0;
    let comp = 0;
    let nonComp = 0;
    let na = 0;

    plants.forEach(p => {
      const cell = p.values[item.name];
      if (cell?.status === 'compliant') {
        comp++;
        app++;
      } else if (cell?.status === 'non-compliant') {
        nonComp++;
        app++;
      } else {
        na++;
      }
    });

    return {
      ...item,
      applicableCount: app,
      compliantCount: comp,
      nonCompliantCount: nonComp,
      naCount: na,
      complianceRate: app > 0 ? Math.round((comp / app) * 100) : 100
    };
  });

  // Region stats
  const regionStats = {};
  ['North Luzon', 'South Luzon', 'Visayas', 'Mindanao'].forEach(reg => {
    const regPlants = plants.filter(p => p.region === reg);
    const regTotalApp = regPlants.reduce((s, p) => s + p.totalApplicable, 0);
    const regActive = regPlants.reduce((s, p) => s + p.activeCount, 0);
    regionStats[reg] = {
      plantCount: regPlants.length,
      totalApplicable: regTotalApp,
      activeCount: regActive,
      complianceRate: regTotalApp > 0 ? Math.round((regActive / regTotalApp) * 100) : 0
    };
  });

  const totalApp = plants.reduce((s, p) => s + p.totalApplicable, 0);
  const totalActive = plants.reduce((s, p) => s + p.activeCount, 0);

  return {
    type,
    sheetName: sheetName || (type === 'permits' ? 'SUMMARY-Permits' : 'SUMMARY-Reportorial'),
    items,
    itemStats,
    plants,
    totalPlants: plants.length,
    itemCount: items.length,
    totalApplicable: totalApp,
    totalActive,
    totalDeficient: totalApp - totalActive,
    overallComplianceRate: totalApp > 0 ? Math.round((totalActive / totalApp) * 100) : 0,
    regionStats
  };
}

/**
 * Parse SUMMARY-Permits and SUMMARY-Reportorial sheets from workbook
 */
export function parseSummarySheets(wb) {
  if (!wb || !wb.Sheets || !wb.SheetNames) {
    return { permitsSummary: null, reportorialSummary: null };
  }

  // Find sheet names with flexible case-insensitivity
  const permitsSheetName = wb.SheetNames.find((s) => {
    const l = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return l.includes('summary') && l.includes('permit');
  });

  const reportorialSheetName = wb.SheetNames.find((s) => {
    const l = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return l.includes('summary') && (l.includes('report') || l.includes('reportial'));
  });

  return {
    permitsSummary: permitsSheetName
      ? parseSingleSummarySheet(wb.Sheets[permitsSheetName], 'permits', permitsSheetName)
      : null,
    reportorialSummary: reportorialSheetName
      ? parseSingleSummarySheet(wb.Sheets[reportorialSheetName], 'reportorial', reportorialSheetName)
      : null
  };
}

