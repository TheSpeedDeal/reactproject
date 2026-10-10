import React, { useState } from 'react';
import HomeDashboard from './HomeDashboard/HomeDashboard';
import DisplayTables from './DisplayTables/DisplayTables';

export default function PermitsMonitoringSystem({
  parsedDataCache = {},
  targetSheets = [],
  plantRegions = {},
  isLoading = false,
  currentTheme = 'midnight',
  onSelectTheme,
  fileName = 'PANB_Permits_Licenses_Monitoring_2026_v3.xlsx',
  fileSize = '1.95 MB',
  sourceType = 'default',
  subTab: controlledSubTab,
  onNavigateToTable: parentNavigateToTable,
  onNavigateHome: parentNavigateHome,
  targetPlant: controlledTargetPlant,
  setTargetPlant: controlledSetTargetPlant,
  targetSearch: controlledTargetSearch,
  onSyncData,
  onUploadFile
}) {
  const [internalSubTab, setInternalSubTab] = useState('home');
  const [internalTargetPlant, setInternalTargetPlant] = useState('');
  const [internalTargetSearch, setInternalTargetSearch] = useState('');

  const subTab = controlledSubTab !== undefined ? controlledSubTab : internalSubTab;
  const targetPlant = controlledTargetPlant !== undefined ? controlledTargetPlant : internalTargetPlant;
  const setTargetPlant = controlledSetTargetPlant || setInternalTargetPlant;
  const targetSearch = controlledTargetSearch !== undefined ? controlledTargetSearch : internalTargetSearch;

  const handleNavigateToTable = (plantName, actionName) => {
    if (parentNavigateToTable) {
      parentNavigateToTable(plantName, actionName);
    } else {
      if (plantName) setInternalTargetPlant(plantName);
      if (actionName) setInternalTargetSearch(actionName);
      setInternalSubTab('tables');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigateHome = () => {
    if (parentNavigateHome) {
      parentNavigateHome();
    } else {
      setInternalSubTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="permits-monitoring-system-root">
      {/* Active Sub-View (Header is unified in top application header) */}
      {subTab === 'home' && (
        <HomeDashboard
          onNavigateToTable={handleNavigateToTable}
          parsedDataCache={parsedDataCache}
          targetSheets={targetSheets}
          plantRegions={plantRegions}
          isLoading={isLoading}
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          onSyncData={onSyncData}
          onUploadFile={onUploadFile}
        />
      )}

      {subTab === 'tables' && (
        <DisplayTables
          parsedDataCache={parsedDataCache}
          targetSheets={targetSheets}
          plantRegions={plantRegions}
          activeSheetName={targetPlant}
          setActiveSheetName={setTargetPlant}
          fileName={fileName}
          fileSize={fileSize}
          sourceType={sourceType}
          initialSearch={targetSearch}
          onNavigateHome={handleNavigateHome}
        />
      )}
    </div>
  );
}
