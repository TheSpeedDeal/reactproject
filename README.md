# PANB Enterprise Operations & Regulatory Compliance Portal (2026)

A high-performance, modular React + Vite enterprise web portal for operational compliance tracking, regulatory permit monitoring, and automated data ingestion across 23 industrial operating facilities.

---

## 📑 Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Quick Start](#quick-start)
- [Core Application Modules](#core-application-modules)
  - [1. Central Operations Hub](#1-central-operations-hub)
  - [2. Permits & Licenses Monitoring System](#2-permits--licenses-monitoring-system)
  - [3. SourceExcel (Developer Data Source Console)](#3-sourceexcel-developer-data-source-console)
- [Data Ingestion & Pipeline](#data-ingestion--pipeline)
  - [Bundled Master Excel Workbook](#bundled-master-excel-workbook)
  - [Local File Upload](#local-file-upload)
  - [Facility Sheet Parsing Rules](#facility-sheet-parsing-rules)
- [Theme System](#theme-system)
- [Global Navigation & Access](#global-navigation--access)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)

---

## Overview & Architecture

The portal serves as the unified intelligence hub for executive management, compliance officers, and plant engineers. It is designed around modular enterprise features, multi-theme aesthetics, and robust spreadsheet data pipelines.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Global Central Enterprise Header                     │
│  [🏢 Logo & Dynamic Titles]  [View Tabs]  [🛠️ Dev Tool]  [🟡 Theme]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Central Hub    │      │ Permits System   │      │   SourceExcel    │
│  (Landing Page)  │      │ (Active Module)  │      │  (Dev Pipeline)  │
├──────────────────┤      ├──────────────────┤      ├──────────────────┤
│ • Modular Track  │      │ • Executive Dash │      │ • Master Excel   │
│ • Drag-to-Scroll │      │ • Display Tables │      │ • Working File   │
│ • Roadmap Scopes │      │ • Slicer Filters │      │ • Raw Inspector  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start Vite local development server
npm run dev

# 3. Build optimized production bundle
npm run build

# 4. Preview production build locally
npm run preview
```

The application runs locally at `http://localhost:5173/`.

---

## Core Application Modules

### 1. Central Operations Hub
The landing page of the application that showcases active and upcoming modular systems:
- **Left-to-Right Horizontal Scrolling Track**: All feature modules are displayed in a clean, non-wrapping horizontal track to ensure **zero vertical page scrolling**.
- **Multi-Input Navigation**:
  - **Mouse Left-Click Drag**: Click and drag with your left mouse button to smoothly swipe the track left and right (with built-in accidental click suppression).
  - **Mouse Wheel**: Vertical wheel movement over the track translates directly into horizontal scrolling.
  - **Navigation Controls**: One-click arrow buttons (`‹` and `›`) in the section header.
  - **Glow Scrollbar**: Touch-friendly, theme-accented horizontal scrollbar.
- **Architectural Roadmap Scopes**: Click on upcoming roadmap modules (e.g., CCR Generation, Energy Monitoring, Notice of Violation, Solid Waste, Tree Planting, Water Monitoring) to open modal previews of planned capabilities and compliance annexes.

### 2. Permits & Licenses Monitoring System
The live operational module tracking clearances and deadlines across all 23 plant facilities:
- **Executive Compliance Dashboard**:
  - Power BI-style summary metrics (Total Tracked Permits, Valid Clearances, Renewal In-Progress, Expired Counts).
  - 12-Month Interactive Expiration Timeline Chart (Recharts).
  - Regulatory Distribution Donut Chart (ECC, CNC, PTO, DP, LLDA, DOLE, BFP, etc.).
  - Slicer filters for Facility Type, Region, Expiration Status, and Plant Search.
  - Urgent Action Required matrix highlighting near-expiration items (<60 days).
  - **Data Controls**: "Sync Data" and "Upload File" buttons integrated directly within the dashboard.
- **Facility Display Tables**:
  - Full display table per facility, segregated into **Permits & Licenses** and **Reportorial PMR/SMR Requirements**.
  - Multi-column sort, search, and pagination.
  - Direct CSV Export for report submission.

### 3. SourceExcel (Module Master Spreadsheets Console)
A dedicated console to manage, upload, and switch master Excel spreadsheets individually across all enterprise compliance modules:
- **Per-Module Metrics Bar**: Displays real-time pipeline status for each module with 6 key indicators:
  - `ACTIVE MASTER FILE`: Name of the currently active workbook
  - `DATA ORIGIN`: `Default Master Asset` vs `Local Custom Upload`
  - `PAYLOAD SIZE`: Active spreadsheet size
  - `TARGET PLANT SHEETS`: Operational facility worksheet counts
  - `COMPLIANCE RECORDS`: Total extracted records
  - `PIPELINE STATUS`: Real-time cache readiness status (`● Ready in Cache`)
- **Multiple Uploads & Active File Switcher**: Upload multiple workbooks per module (drag-and-drop or file picker) and switch which spreadsheet is active on the fly.
- **Global Header Access**: Conveniently accessible to all users directly from the top header navigation (`📊 SourceExcel`).

---

## Data Ingestion & Pipeline

### Bundled Master Excel Workbook
When launched, the portal automatically loads and parses the default production master workbook located in:
```
public/PANB_Permits_Licenses_Monitoring_2026_v3.xlsx
```

### Local File Upload & Security Posture
Users and developers can upload any updated `.xlsx`, `.xls`, or `.xlsm` workbook via the dashboard or the SourceExcel console.
- **Client-Side In-Memory Processing**: The parser processes spreadsheets entirely in browser memory using SheetJS (`xlsx`). No file contents, corporate credentials, or employee tokens are ever transmitted to external servers.
- **Enterprise Security Policy**: Remote network fetching/uploading of corporate Microsoft 365 / SharePoint links was intentionally removed to avoid security risks, eliminate exposure of personal corporate authentication sessions, and strictly comply with enterprise SSO/MFA data isolation policies.
- **Workflow**: Authorized plant engineers open their compliance workbook in their authenticated corporate browser session, export or save a copy, and drag & drop the file directly into the portal.

### Configuration (`appsettings.json`)
Local environment preferences can be set in `appsettings.json`:
```json
{
  "Environment": {
    "defaultExcelPath": "/PANB_Permits_Licenses_Monitoring_2026_v3.xlsx",
    "enableDeveloperMode": true
  }
}
```
`appsettings.json` is added to `.gitignore` to prevent committing local environment overrides. An `appsettings.example.json` template is maintained in version control.

### Facility Sheet Parsing Rules
The parser scans all worksheet tabs in the workbook and filters by valid facility prefixes:

| Prefix | Facility Classification | Example Sheets |
|---|---|---|
| `BMP` | Biomass Power Plant | `BMP-BATAAN`, `BMP-TARLAC`, `BMP-ISABELA` |
| `MPH` | Mini-Hydro Power Plant | `MPH-PAL`, `MPH-PAN`, `MPH-BAKUN` |
| `MPPP` | Mini-Pump Power Plant | `MPPP-PAG`, `MPPP-CALIRAYA` |
| `MPF` | Mini-Power Facility | `MPF-TOLEDO`, `MPF-MAJAYJAY` |

> Sheets like `SUMMARY-Permits` are used to extract regional assignments (e.g., Luzon, Visayas, Mindanao). Non-matching sheets (e.g., `Legend`, notes) are excluded from compliance display tables.

---

## Theme System

The portal includes 6 curated, accessible themes designed with bespoke color tokens, smooth CSS transitions, and glassmorphic card framing:

| # | Theme Name | Identifier | Aesthetic Description |
|---|---|---|---|
| 1 | **Midnight Slate** | `midnight` | *(Default)* Cyber Dark Navy with cyan and emerald accents |
| 2 | **Clean Enterprise** | `light` | Crisp, luminous executive light mode with slate borders |
| 3 | **Emerald Forest** | `emerald` | Sustainability & environmental green palette |
| 4 | **Royal Cobalt** | `cobalt` | Deep corporate sapphire blue inspired by Power BI |
| 5 | **Sunset Amber** | `sunset` | Warm gold & obsidian executive dashboard palette |
| 6 | **Neon Amethyst** | `neon` | Cosmic cyber dark with violet and magenta glowing accents |

Themes can be switched using the dropdown in the top header and persist across page reloads via `localStorage`.

---

## Global Navigation & Access

All portal modules and administrative tools are accessible directly from the top global enterprise header:
- **Central Operations Hub**: Click the PANB Enterprise logo or "← Back to Central Hub" button to return to the landing overview.
- **Permits & Licenses System**: Executive dashboard and facility display tables for operational compliance tracking.
- **SourceExcel Console**: Click the `📊 SourceExcel` button located **exclusively in the top header** to view active workbooks, upload new sheets, and switch datasets per module. Available to all users across development and production environments.

---

## Project Structure

The project strictly follows a modular folder convention with isolated JSX and CSS components and direct imports:

```
reactproject/
├── public/
│   └── PANB_Permits_Licenses_Monitoring_2026_v3.xlsx   # Bundled baseline Excel
├── src/
│   ├── assets/                                         # Static images & branding
│   ├── components/
│   │   ├── Permits & Licenses Monitoring System/
│   │   │   ├── DisplayTables/
│   │   │   │   ├── DisplayTables.jsx
│   │   │   │   └── DisplayTables.css
│   │   │   ├── HomeDashboard/
│   │   │   │   ├── HomeDashboard.jsx
│   │   │   │   └── HomeDashboard.css
│   │   │   └── PermitsMonitoringSystem.jsx            # Permits module wrapper
│   │   ├── SourceExcel/
│   │   │   ├── SourceExcel.jsx                         # Dev console component
│   │   │   └── SourceExcel.css                         # Dev console styles
│   │   └── ThemeSelector/
│   │       ├── ThemeSelector.jsx                       # Theme picker dropdown
│   │       └── ThemeSelector.css
│   ├── utils/
│   │   ├── ExcelParsers/
│   │   │   └── excelParserPermitAndLicense.js          # Permits SheetJS parser
│   │   └── themeConfig.js                              # Theme definitions & keys
│   ├── App.jsx                                         # Core router & Central Hub
│   ├── App.css                                         # Layout & Central Hub CSS
│   ├── themes.css                                      # 6-theme color definitions
│   ├── index.css                                       # Global base reset
│   └── main.jsx                                        # Application entry point
├── .gitignore                                          # Ignores appsettings.json & local overrides
├── appsettings.example.json                            # Git-tracked configuration template
├── appsettings.json                                    # Local environment preferences (gitignored)
├── package.json
├── vite.config.js                                      # Dev server & appsettings loader
└── README.md
```

---

## Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Bundler & Dev Server**: [Vite 8](https://vitejs.dev/)
- **Spreadsheet Parsing**: [SheetJS (xlsx)](https://sheetjs.com/)
- **Data Visualizations**: [Recharts](https://recharts.org/)
- **Styling**: Vanilla CSS (CSS Variables, Flexbox, CSS Grid, Glassmorphism)
- **Linting & Code Quality**: [Oxlint](https://oxc.rs/)

---

## License

Internal corporate portal developed for PANB Enterprise Operations. All rights reserved.
