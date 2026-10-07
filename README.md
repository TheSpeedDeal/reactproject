# PANB Permits & Licenses Monitoring 2026

A React + Vite dashboard for tracking regulatory permits, licenses, and reportorial requirements across PANB plant facilities.

---

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## Loading Data

The application supports two ways to load the monitoring workbook:

### 1. Upload File (Local)

Click **Upload / Update** in the header, then select an `.xlsx` or `.xls` workbook from your computer using the file picker or drag-and-drop.

### 2. SharePoint / OneDrive URL

You can load the workbook directly from a SharePoint or OneDrive share link without downloading it first.

#### How to use

1. Click **Upload / Update** in the header.
2. Switch to the **🔗 SharePoint URL** tab.
3. Paste your SharePoint or OneDrive sharing link.
4. Click **Load** (or press **Enter**).

#### Supported link domains

| Domain | Example |
|---|---|
| `sharepoint.com` | `https://yourorg.sharepoint.com/:x:/s/…` |
| `onedrive.live.com` | `https://onedrive.live.com/…` |
| `1drv.ms` | `https://1drv.ms/x/s!…` |

#### ⚠️ SharePoint Sharing Requirement

> **The file must be shared as "Anyone with the link can view".**

This is required because the app fetches the file directly from the browser. If the file is restricted to org members or requires a login, the browser cannot authenticate on your behalf and the fetch will fail.

**Steps to set up the correct sharing permission in SharePoint:**

1. Open the file in SharePoint Online.
2. Click **Share** (top-right) → **Copy Link**.
3. In the link settings panel, change the access from *"People in [Org]"* to **"Anyone with the link"**.
4. Set permission to **Can view** (read-only is sufficient).
5. Click **Apply**, then **Copy** the generated link.
6. Paste that link into the SharePoint URL tab of this app.

**Common error messages and what they mean:**

| Error | Cause | Fix |
|---|---|---|
| `"Received an HTML login page instead of the file"` | Link is still org-restricted | Change sharing to "Anyone with the link" |
| `"SharePoint returned HTTP 403"` | Link requires authentication | Adjust sharing settings as above |
| `"URL must be from sharepoint.com…"` | Non-SharePoint URL was pasted | Use a link from a supported domain |

> **Note:** The file is fetched in read-only mode. No data is written back to SharePoint.

---

## Workbook Sheet Filter Rule

The app automatically scans all sheets in the uploaded workbook and includes only those matching these **prefixes**:

| Prefix | Facility Type |
|---|---|
| `BMP` | Biomass Power Plant |
| `MPH` | Mini-Hydro Power Plant |
| `MPPP` | Mini-Pump Power Plant |
| `MPF` | Mini-Power Facility |

Sheets not matching these prefixes (e.g. `SUMMARY-Permits`, `Legend`) are ignored for the compliance tables but may be used for region mapping.

---

## Features

- **Home Dashboard** — Power BI-style KPI cards, timeline chart, donut chart, and urgent action table. All visuals update live from the loaded Excel data.
- **Table View** — Paginated, filterable, and sortable compliance tables for Permits & Licenses and Reportorial Requirements per plant.
- **Plant Selector** — Filter by facility type, region, and search by name.
- **Export to CSV** — Download the current filtered table as a CSV file.
- **SharePoint URL Ingestion** — Load the workbook directly from a SharePoint or OneDrive share link.

---

## Tech Stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [SheetJS (xlsx)](https://sheetjs.com/) — Excel parsing
- [Recharts](https://recharts.org/) — Dashboard charts
- [Oxlint](https://oxc.rs/) — Linting
