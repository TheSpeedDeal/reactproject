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
