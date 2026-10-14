import React, { useState, useMemo, useCallback } from 'react';
import { exportTableToCsv } from '../../../utils/ExcelParsers/excelParserPermitAndLicense';
import './SummaryTables.css';

export default function SummaryTables({
  summaryData = { permitsSummary: null, reportorialSummary: null },
  fileName = 'PANB Permits & Licenses Monitoring 2026 v3.xlsx',
  fileSize = '1.95 MB',
  sourceType = 'default',
  onNavigateToTable,
  onNavigateHome
}) {
  // Active sub-tab between Permits Summary and Reportorial Summary
  const [activeTab, setActiveTab] = useState('permits'); // 'permits' | 'reportorial'

  // View presentation mode: scorecard (default) | matrix | deficiencies
  const [viewMode, setViewMode] = useState('scorecard');

  // Filters
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('ALL');
  const [agencyFilter, setAgencyFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');

  // Sorting for scorecard & matrix
  const [sortKey, setSortKey] = useState('complianceRate'); // 'complianceRate' | 'plant' | 'activeCount' | 'region'
  const [sortDir, setSortDir] = useState('desc');

  // Active dataset based on tab
  const activeDataset = useMemo(() => {
    if (activeTab === 'permits') {
      return summaryData?.permitsSummary || null;
    }
    return summaryData?.reportorialSummary || null;
  }, [activeTab, summaryData]);

  // Extract unique agencies for filter dropdown
  const availableAgencies = useMemo(() => {
    if (!activeDataset || !activeDataset.items) return [];
    const set = new Set();
    activeDataset.items.forEach((item) => {
      if (item.agency) set.add(item.agency);
    });
    return Array.from(set).sort();
  }, [activeDataset]);

  // Filtered items (columns)
  const filteredItems = useMemo(() => {
    if (!activeDataset || !activeDataset.items) return [];
    return activeDataset.items.filter((item) => {
      if (agencyFilter !== 'ALL' && item.agency !== agencyFilter) {
        return false;
      }
      if (itemSearchTerm.trim()) {
        const q = itemSearchTerm.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.agency.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeDataset, agencyFilter, itemSearchTerm]);

  // Filtered and sorted plants (rows)
  const filteredPlants = useMemo(() => {
    if (!activeDataset || !activeDataset.plants) return [];
    return activeDataset.plants
      .filter((plant) => {
        if (regionFilter !== 'ALL' && plant.region !== regionFilter) {
          return false;
        }
        if (facilityTypeFilter !== 'ALL' && !plant.plant.startsWith(facilityTypeFilter)) {
          return false;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          return plant.plant.toLowerCase().includes(q) || plant.region.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];
        if (typeof valA === 'string') {
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDir === 'asc' ? valA - valB : valB - valA;
      });
  }, [activeDataset, regionFilter, facilityTypeFilter, searchTerm, sortKey, sortDir]);

  // Dynamic summary metrics computed over currently filtered plants
  const metrics = useMemo(() => {
    const plants = filteredPlants;
    const totalPlants = plants.length;
    const totalApplicable = plants.reduce((sum, p) => sum + p.totalApplicable, 0);
    const totalActive = plants.reduce((sum, p) => sum + p.activeCount, 0);
    const totalDeficient = totalApplicable - totalActive;
    const complianceRate = totalApplicable > 0 ? Math.round((totalActive / totalApplicable) * 100) : 0;

    return {
      totalPlants,
      totalApplicable,
      totalActive,
      totalDeficient,
      complianceRate
    };
  }, [filteredPlants]);

  // Item statistics across currently filtered plants
  const dynamicItemStats = useMemo(() => {
    if (!filteredItems.length) return {};
    const map = {};
    filteredItems.forEach((item) => {
      let app = 0;
      let comp = 0;
      let nonComp = 0;
      let na = 0;

      filteredPlants.forEach((p) => {
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

      map[item.name] = {
        applicableCount: app,
        compliantCount: comp,
        nonCompliantCount: nonComp,
        naCount: na,
        complianceRate: app > 0 ? Math.round((comp / app) * 100) : 100
      };
    });
    return map;
  }, [filteredItems, filteredPlants]);

  // Sorting toggle
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // CSV Export for Summary Matrix
  const handleExportCSV = useCallback(() => {
    if (!activeDataset || !filteredPlants.length) return;
    const headers = ['Region', 'Facility', ...filteredItems.map((it) => it.name), 'Total Applicable', activeTab === 'permits' ? 'Active Applicable' : 'Updated Reportorial', '% Compliance'];
    
    const rows = filteredPlants.map((p) => {
      const row = {
        Region: p.region,
        Facility: p.plant,
        'Total Applicable': p.totalApplicable,
        [activeTab === 'permits' ? 'Active Applicable' : 'Updated Reportorial']: p.activeCount,
        '% Compliance': `${p.complianceRate}%`
      };
      filteredItems.forEach((it) => {
        const cell = p.values[it.name];
        row[it.name] = cell?.status === 'compliant' ? 'Active' : (cell?.status === 'non-compliant' ? 'Action Needed' : 'N/A');
      });
      return row;
    });

    const exportHeaders = Object.keys(rows[0]);
    exportTableToCsv(`PANB_${activeTab === 'permits' ? 'Permits' : 'Reportorial'}_Summary_Matrix`, exportHeaders, rows);
  }, [activeDataset, filteredPlants, filteredItems, activeTab]);

  return (
    <div className="summary-tables-page">
      {/* 1. Hero Header & Overview Banner */}
      <section className="summary-hero-card">
        <div className="summary-hero-info">
          <div className="summary-hero-tags">
            <span className="summary-tag-badge network-tag">🌐 23 Operating Facilities</span>
            <span className="summary-tag-badge region-tag">📍 National Scope (4 Regions)</span>
            <span className="summary-tag-badge file-source-tag" title={fileName}>
              📁 {fileName} {fileSize ? `(${fileSize})` : ''} • {sourceType === 'default' ? 'Default Dataset' : 'Custom Upload'}
            </span>
          </div>
          <h2 className="summary-hero-title">
            Regulatory Compliance Summary Matrix
          </h2>
          <p className="summary-hero-desc">
            Cross-facility compliance monitoring parsed directly from master sheets <strong>SUMMARY-Permits</strong> and <strong>SUMMARY-Reportorial</strong>.
          </p>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="summary-kpi-grid">
          <div className="summary-kpi-card kpi-total">
            <div className="kpi-val">{metrics.totalPlants}</div>
            <div className="kpi-label">Facilities Monitored</div>
            <div className="kpi-sub">Across 4 Regions</div>
          </div>

          <div className="summary-kpi-card kpi-app">
            <div className="kpi-val">{metrics.totalApplicable}</div>
            <div className="kpi-label">Applicable Items</div>
            <div className="kpi-sub">{activeTab === 'permits' ? 'Active Licenses' : 'Submissions'}</div>
          </div>

          <div className="summary-kpi-card kpi-success">
            <div className="kpi-val">{metrics.totalActive}</div>
            <div className="kpi-label">{activeTab === 'permits' ? 'Active Compliant' : 'Updated / On-Time'}</div>
            <div className="kpi-sub">Valid compliance</div>
          </div>

          <div className="summary-kpi-card kpi-danger">
            <div className="kpi-val">{metrics.totalDeficient}</div>
            <div className="kpi-label">Deficient / Action</div>
            <div className="kpi-sub">Immediate focus</div>
          </div>

          <div className="summary-kpi-card kpi-accent">
            <div className="kpi-val">{metrics.complianceRate}%</div>
            <div className="kpi-label">Compliance Rate</div>
            <div className="kpi-sub">Network health</div>
          </div>
        </div>
      </section>

      {/* 2. Primary Tab Switcher (Permits Summary vs Reportorial Summary) */}
      <div className="summary-tabs-container">
        <div className="summary-tabs-group">
          <button
            type="button"
            className={`summary-tab-btn ${activeTab === 'permits' ? 'active' : ''}`}
            onClick={() => setActiveTab('permits')}
          >
            <span>📜 Summary: Permits &amp; Licenses</span>
            <span className="tab-pill-count">
              {summaryData?.permitsSummary?.itemCount || 63} Items
            </span>
          </button>

          <button
            type="button"
            className={`summary-tab-btn ${activeTab === 'reportorial' ? 'active' : ''}`}
            onClick={() => setActiveTab('reportorial')}
          >
            <span>📑 Summary: Reportorial Requirements</span>
            <span className="tab-pill-count">
              {summaryData?.reportorialSummary?.itemCount || 47} Items
            </span>
          </button>
        </div>

        <div className="summary-view-toggle">
          <span className="toggle-label">View:</span>
          <button
            type="button"
            className={`btn-view-toggle ${viewMode === 'scorecard' ? 'active' : ''}`}
            onClick={() => setViewMode('scorecard')}
            title="Facility Compliance Scorecard"
          >
            🏆 Leaderboard
          </button>
          <button
            type="button"
            className={`btn-view-toggle ${viewMode === 'matrix' ? 'active' : ''}`}
            onClick={() => setViewMode('matrix')}
            title="Full Cross-Tabulation Matrix"
          >
            📊 Matrix Grid
          </button>
          <button
            type="button"
            className={`btn-view-toggle ${viewMode === 'deficiencies' ? 'active' : ''}`}
            onClick={() => setViewMode('deficiencies')}
            title="Deficiencies & Action Items"
          >
            ⚠️ Action Checklist
          </button>
        </div>
      </div>

      {/* 3. Filter & Controls Toolbar */}
      <div className="summary-toolbar-card">
        <div className="toolbar-filters-grid">
          {/* Facility Search */}
          <div className="filter-group search-group">
            <span className="filter-icon">🔍</span>
            <input
              type="text"
              placeholder="Filter by facility name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="toolbar-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Item / Permit Search */}
          <div className="filter-group item-search-group">
            <span className="filter-icon">📋</span>
            <input
              type="text"
              placeholder={`Filter ${activeTab === 'permits' ? 'permits' : 'reports'}...`}
              value={itemSearchTerm}
              onChange={(e) => setItemSearchTerm(e.target.value)}
              className="toolbar-input"
            />
            {itemSearchTerm && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setItemSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Region Filter */}
          <div className="filter-group select-group">
            <label className="filter-label">Region:</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="toolbar-select"
            >
              <option value="ALL">All Regions (4)</option>
              <option value="North Luzon">North Luzon (8)</option>
              <option value="South Luzon">South Luzon (5)</option>
              <option value="Visayas">Visayas (6)</option>
              <option value="Mindanao">Mindanao (4)</option>
            </select>
          </div>

          {/* Facility Type Filter */}
          <div className="filter-group select-group">
            <label className="filter-label">Facility:</label>
            <select
              value={facilityTypeFilter}
              onChange={(e) => setFacilityTypeFilter(e.target.value)}
              className="toolbar-select"
            >
              <option value="ALL">All Types</option>
              <option value="BMP">BMP (Feedmill)</option>
              <option value="MPH">MPH (Hatchery)</option>
              <option value="MPPP">MPPP (Poultry Plant)</option>
              <option value="MPF">MPF (Breeding Farm)</option>
            </select>
          </div>

          {/* Regulatory Agency Filter */}
          <div className="filter-group select-group">
            <label className="filter-label">Agency:</label>
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="toolbar-select"
            >
              <option value="ALL">All Agencies ({availableAgencies.length})</option>
              {availableAgencies.map((agency) => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </select>
          </div>

          {/* Export Action */}
          <div className="toolbar-actions-group">
            <button
              type="button"
              className="btn-export-summary"
              onClick={handleExportCSV}
              title="Download filtered summary as CSV"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Legend Bar */}
        <div className="summary-legend-bar">
          <span className="legend-label">Status Key:</span>
          <div className="legend-item">
            <span className="legend-dot dot-compliant">✓</span>
            <span>Active / Compliant</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-danger">✗</span>
            <span>Missing / Action Required</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-na">—</span>
            <span>Not Applicable</span>
          </div>
          <span className="legend-hint">
            💡 Tip: Click any facility name to inspect its individual display tables.
          </span>
        </div>
      </div>

      {/* 4. Main View Mode Area */}
      {!activeDataset ? (
        <div className="summary-empty-state">
          <h3>No Summary Dataset Found</h3>
          <p>
            The master workbook does not appear to contain a{' '}
            <strong>SUMMARY-{activeTab === 'permits' ? 'Permits' : 'Reportorial'}</strong> sheet.
          </p>
        </div>
      ) : filteredPlants.length === 0 ? (
        <div className="summary-empty-state">
          <h3>No Facilities Match Your Filters</h3>
          <p>Try resetting the search terms or region/agency filters.</p>
          <button
            type="button"
            className="btn-reset-filters"
            onClick={() => {
              setSearchTerm('');
              setItemSearchTerm('');
              setRegionFilter('ALL');
              setFacilityTypeFilter('ALL');
              setAgencyFilter('ALL');
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          {/* VIEW 1: Matrix Grid View */}
          {viewMode === 'matrix' && (
            <div className="summary-matrix-card">
              <div className="matrix-table-scroll-wrapper">
                <table className="summary-matrix-table">
                  <thead>
                    <tr>
                      <th className="sticky-col col-num">#</th>
                      <th
                        className="sticky-col col-plant sortable-header"
                        onClick={() => handleSort('plant')}
                        title="Sort by Facility Name"
                      >
                        <div className="th-flex">
                          <span>Facility Plant</span>
                          <span className="sort-icon">{sortKey === 'plant' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                        </div>
                      </th>
                      <th
                        className="sticky-col col-region sortable-header"
                        onClick={() => handleSort('region')}
                        title="Sort by Region"
                      >
                        <div className="th-flex">
                          <span>Region</span>
                          <span className="sort-icon">{sortKey === 'region' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                        </div>
                      </th>

                      {/* Dynamic Columns for each Requirement */}
                      {filteredItems.map((item, idx) => (
                        <th
                          key={item.id}
                          className="matrix-col-item"
                          title={`${item.agency}: ${item.name}`}
                        >
                          <div className="matrix-th-content">
                            <span className="matrix-th-agency">{item.agency}</span>
                            <span className="matrix-th-title" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                        </th>
                      ))}

                      {/* Summary Metrics Sticky Columns */}
                      <th
                        className="sticky-col-right col-total sortable-header"
                        onClick={() => handleSort('totalApplicable')}
                        title="Total Applicable"
                      >
                        <div className="th-flex">
                          <span>Applicable</span>
                          <span className="sort-icon">{sortKey === 'totalApplicable' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                        </div>
                      </th>
                      <th
                        className="sticky-col-right col-active sortable-header"
                        onClick={() => handleSort('activeCount')}
                        title="Total Active"
                      >
                        <div className="th-flex">
                          <span>{activeTab === 'permits' ? 'Active' : 'Updated'}</span>
                          <span className="sort-icon">{sortKey === 'activeCount' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                        </div>
                      </th>
                      <th
                        className="sticky-col-right col-rate sortable-header"
                        onClick={() => handleSort('complianceRate')}
                        title="Compliance Rate %"
                      >
                        <div className="th-flex">
                          <span>Rate %</span>
                          <span className="sort-icon">{sortKey === 'complianceRate' ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPlants.map((plant, pIdx) => {
                      const facility = plant.facilityType;
                      return (
                        <tr key={plant.plant} className="matrix-row">
                          <td className="sticky-col col-num">{pIdx + 1}</td>
                          <td className="sticky-col col-plant">
                            <button
                              type="button"
                              className="btn-plant-link"
                              onClick={() => onNavigateToTable && onNavigateToTable(plant.plant)}
                              title={`View ${plant.plant} display tables`}
                            >
                              <span className="plant-type-badge" style={{ borderColor: facility?.color }}>
                                {facility?.icon} {facility?.code}
                              </span>
                              <span className="plant-name-text">{plant.plant}</span>
                            </button>
                          </td>
                          <td className="sticky-col col-region">
                            <span className="region-pill">{plant.region}</span>
                          </td>

                          {/* Matrix status cells */}
                          {filteredItems.map((item) => {
                            const cell = plant.values[item.name];
                            const status = cell?.status || 'na';

                            return (
                              <td
                                key={`${plant.plant}-${item.id}`}
                                className={`matrix-cell cell-${status}`}
                                title={`${plant.plant} • ${item.name}: ${status === 'compliant' ? 'Active' : (status === 'non-compliant' ? 'Action Required' : 'Not Applicable')}`}
                              >
                                {status === 'compliant' && (
                                  <span className="matrix-pill pill-compliant">✓</span>
                                )}
                                {status === 'non-compliant' && (
                                  <span className="matrix-pill pill-danger">✗</span>
                                )}
                                {status === 'na' && (
                                  <span className="matrix-pill pill-na">—</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Sticky Stats Columns on Right */}
                          <td className="sticky-col-right col-total font-mono font-bold">
                            {plant.totalApplicable}
                          </td>
                          <td className="sticky-col-right col-active font-mono font-bold text-emerald">
                            {plant.activeCount}
                          </td>
                          <td className="sticky-col-right col-rate">
                            <div className="rate-container">
                              <span
                                className={`rate-pill ${
                                  plant.complianceRate >= 90
                                    ? 'rate-high'
                                    : plant.complianceRate >= 60
                                    ? 'rate-med'
                                    : 'rate-low'
                                }`}
                              >
                                {plant.complianceRate}%
                              </span>
                              <div className="rate-bar-bg">
                                <div
                                  className={`rate-bar-fill ${
                                    plant.complianceRate >= 90
                                      ? 'fill-high'
                                      : plant.complianceRate >= 60
                                      ? 'fill-med'
                                      : 'fill-low'
                                  }`}
                                  style={{ width: `${plant.complianceRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary / Total Footer Row */}
                  <tfoot>
                    <tr className="matrix-footer-row">
                      <td className="sticky-col col-num">∑</td>
                      <td className="sticky-col col-plant font-bold">
                        Network Total ({filteredPlants.length} Plants)
                      </td>
                      <td className="sticky-col col-region font-bold">All</td>

                      {/* Footer Totals per Item */}
                      {filteredItems.map((item) => {
                        const st = dynamicItemStats[item.name] || {
                          compliantCount: 0,
                          applicableCount: 0,
                          complianceRate: 0
                        };
                        return (
                          <td
                            key={`footer-${item.id}`}
                            className="matrix-cell footer-cell"
                            title={`${item.name} Network Rate: ${st.compliantCount}/${st.applicableCount} (${st.complianceRate}%)`}
                          >
                            <div className="footer-stat-box">
                              <span className="footer-stat-rate">{st.complianceRate}%</span>
                              <span className="footer-stat-sub">
                                {st.compliantCount}/{st.applicableCount}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Stats Columns */}
                      <td className="sticky-col-right col-total font-mono font-bold">
                        {metrics.totalApplicable}
                      </td>
                      <td className="sticky-col-right col-active font-mono font-bold text-emerald">
                        {metrics.totalActive}
                      </td>
                      <td className="sticky-col-right col-rate">
                        <span className="rate-pill rate-high font-bold">
                          {metrics.complianceRate}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: Facility Scorecard & Leaderboard */}
          {viewMode === 'scorecard' && (
            <div className="summary-scorecard-grid">
              {filteredPlants.map((plant, idx) => {
                const facility = plant.facilityType;
                return (
                  <div key={plant.plant} className="scorecard-card">
                    <div className="scorecard-header">
                      <div className="scorecard-rank">#{idx + 1}</div>
                      <div className="scorecard-title-group">
                        <div className="scorecard-tags">
                          <span className="facility-pill" style={{ borderColor: facility?.color }}>
                            {facility?.icon} {facility?.label}
                          </span>
                          <span className="region-pill">{plant.region}</span>
                        </div>
                        <h4 className="scorecard-plant-name">{plant.plant}</h4>
                      </div>
                      <div
                        className={`scorecard-rate-badge ${
                          plant.complianceRate >= 90
                            ? 'rate-high'
                            : plant.complianceRate >= 60
                            ? 'rate-med'
                            : 'rate-low'
                        }`}
                      >
                        {plant.complianceRate}%
                      </div>
                    </div>

                    <div className="scorecard-progress-bar">
                      <div
                        className={`scorecard-progress-fill ${
                          plant.complianceRate >= 90
                            ? 'fill-high'
                            : plant.complianceRate >= 60
                            ? 'fill-med'
                            : 'fill-low'
                        }`}
                        style={{ width: `${plant.complianceRate}%` }}
                      />
                    </div>

                    <div className="scorecard-stats-row">
                      <div className="stat-col">
                        <span className="stat-label">Applicable</span>
                        <span className="stat-num">{plant.totalApplicable}</span>
                      </div>
                      <div className="stat-col">
                        <span className="stat-label">Active</span>
                        <span className="stat-num text-emerald">{plant.activeCount}</span>
                      </div>
                      <div className="stat-col">
                        <span className="stat-label">Deficient</span>
                        <span className="stat-num text-rose">{plant.nonCompliantCount}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-scorecard-inspect"
                      onClick={() => onNavigateToTable && onNavigateToTable(plant.plant)}
                    >
                      Inspect Facility Tables →
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 3: Deficiencies & Action Checklist */}
          {viewMode === 'deficiencies' && (
            <div className="summary-deficiencies-container">
              <div className="deficiencies-banner">
                <h4>⚠️ Network Deficiency Audit</h4>
                <p>
                  List of regulatory items with missing or non-compliant records across operating facilities, requiring immediate operational intervention.
                </p>
              </div>

              <div className="deficiencies-list">
                {filteredItems
                  .map((item) => {
                    const st = dynamicItemStats[item.name];
                    const nonCompliantPlants = filteredPlants.filter(
                      (p) => p.values[item.name]?.status === 'non-compliant'
                    );
                    return {
                      item,
                      st,
                      plants: nonCompliantPlants
                    };
                  })
                  .filter((group) => group.plants.length > 0)
                  .sort((a, b) => b.plants.length - a.plants.length)
                  .map(({ item, st, plants }) => (
                    <div key={item.id} className="deficiency-card">
                      <div className="deficiency-card-header">
                        <div className="deficiency-title-box">
                          <span className="agency-badge">{item.agency}</span>
                          <h5 className="deficiency-item-name">{item.name}</h5>
                        </div>
                        <div className="deficiency-count-badge">
                          {plants.length} {plants.length === 1 ? 'Facility' : 'Facilities'} Deficient ({st ? `${st.complianceRate}% Compliant` : ''})
                        </div>
                      </div>

                      <div className="deficiency-plants-chips">
                        {plants.map((p) => (
                          <button
                            key={p.plant}
                            type="button"
                            className="deficiency-plant-chip"
                            onClick={() => onNavigateToTable && onNavigateToTable(p.plant, item.name)}
                            title={`Inspect ${p.plant} for ${item.name}`}
                          >
                            <span>{p.plant}</span>
                            <span className="chip-region">({p.region})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
