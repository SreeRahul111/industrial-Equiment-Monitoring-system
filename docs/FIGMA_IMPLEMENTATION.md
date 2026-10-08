# IEMS Figma & Wireframe Implementation Mapping

Figma Source: `https://www.figma.com/design/qgALm4ClDNlCbBGTz8uzP2`
Local Design Authority: `IEMS Phase 6 — Professional UI UX Wireframes.pdf`

## Screen-by-Screen Mapping

| Wireframe Page | Screen Name | Route | Implemented Components & Alignment |
| :--- | :--- | :--- | :--- |
| **Page 1** | **Secure Engineer Login** | `/login` | High-contrast split panel: Left navy brand panel with 24/7 monitoring & secure access badges; Right card with email/password, MFA indication, role presets, error display, and audit notice. |
| **Page 2** | **Industrial Monitoring (Overview)** | `/overview` | Top 4 KPI metric cards (12 Machines, 10 Normal, 1 Warning, 1 Critical); Left table of live machines with sensor readings; Right side active critical alert card (MX-104 vibration) & Quick Actions. |
| **Page 3** | **Threshold Configuration** | `/thresholds` | Machine selector; Validated inputs for Temperature, Pressure, Vibration, Power; Right column Security Guardrails (4-step verification) and version history table. |
| **Page 4 & 6** | **Alert Center & Operational Actions** | `/alerts` | Alert queue with search & filters (All, Critical, Warning, Info); Selected alert workflow inspector with 4-step lifecycle tracking (Detected, Notified, Acknowledged, Resolved) and action buttons. |
| **Page 5** | **Machine Detail** | `/machines/:id` | Asset header with status & last telemetry timestamp; 4 metric cards; Interactive SVG Telemetry Trend charts with 1h/6h/24h/7d range toggles; Right column current condition breakdown and live ingestion simulation. |
| **Page 7** | **Maintenance Planner** | `/maintenance` | Tabbed calendar matrix and work order list; 2 overdue / 5 this week counter; Upcoming work order breakdown; Schedule maintenance modal. |
| **Page 8** | **Audit & Security Center** | `/audit` | 4 KPI cards (1,248 Events/24h, 0 Privilege changes, 3 Denied actions, 100% Audit coverage); Searchable audit log with Allowed/Denied filter; Investigate event modal with metadata JSON viewer. |
| **Page 9** | **Engineer & Access Administration** | `/admin` | Admin-only route; Authorized engineers table with initials avatars, roles, MFA status, active/disabled states; Add engineer modal; Least-privilege policy footer. |
| **Page 10** | **System Health & Settings** | `/health` | Availability KPI cards (99.98% availability, 12s freshness, 0 failures, 100% alert delivery); Service health table with real database and pipeline status; Security settings status panel. |
