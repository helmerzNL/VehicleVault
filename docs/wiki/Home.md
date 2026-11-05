# 🚗 Welcome to the VehicleVault Wiki

**VehicleVault v3.3.2** is a complete, self-hosted, privacy-first vehicle lifecycle, fuel & EV charging, AI maintenance invoice translator, tire management, fiscal trip registration, digital glovebox, Cockpit Telemetry HUD, and Total Cost of Ownership (TCO) platform.

---

## 📚 Documentation Overview

1. **[Installation & Docker Deployment](Installation-and-Docker)**
   - Quick start with `docker-compose.yml`
   - Unraid / Portainer / Synology NAS configuration
   - Environment variables (`.env`) & persistent volumes
   - 1-Click ZIP Backup & Restore

2. **[AI Receipt & Invoice Scanner](AI-Receipt-and-Invoice-Scanner)**
   - Scanning fuel receipts at the pump (Google Gemini Vision, OpenAI Vision & Local Tesseract OCR)
   - **Smart Foreign Maintenance Invoice Scanner & Translator** (automatic translation of German, French, and English garage invoices into your configured language)
   - Automatic extraction of labor vs. parts, VAT/MwSt reconciliation, and garage address with Google Maps link

3. **[Maintenance, TCO & PDF Dossier Export](Maintenance-and-TCO-Engine)**
   - Dual-Trigger Maintenance Engine (*whichever comes first*: kilometers or months)
   - **Multi-Interval Reset** (reset multiple maintenance intervals simultaneously from a single invoice)
   - **Pure Ownership TCO vs. Pre-Ownership History** (excluding invoices dated before your purchase date or below your initial odometer from TCO)
   - **Precision Recurring Fixed Costs Engine** (strict ownership-bound calculation for road tax, insurance, subscriptions)
   - **PDF Dossier Export (`pdf-lib`)** including optional tire status and full-page merged PDF/image maintenance invoices

4. **[Tire Management & Fiscal Trip Logging](Tire-Management-and-Trips)**
   - Summer, Winter & All-Season tire sets with Brand, Model, Size, Rim Size, and Load/Speed Index (`92V`)
   - Dynamic live mileage tracking & 4-wheel tread depth diagram (`LV`, `RV`, `LA`, `RA` in mm)
   - Fiscal trip registration (`Ritregistratie`) with CSV, Excel (`.xlsx`), and landscape A4 PDF exports
   - Multi-car Belastingdienst sheet importer with preview & duplicate detection

5. **[Home Assistant, Calendar & MCP Server](Home-Assistant-and-MCP)**
   - **Multi-Tenant Per-User Home Assistant:** Every account can connect their own private Home Assistant URL & Token without server collision
   - Home Assistant REST sensor integration & live odometer webhook (`POST /api/integrations/ha/odometer`)
   - Animated Cockpit Telemetry HUD with real-time speed, RPM, and fuel status
   - RFC 5545 `.ics` Calendar Feed for APK/MOT/TÜV and maintenance reminders
   - Model Context Protocol (MCP) server for Claude Desktop & Antigravity

6. **[Notifications, Super-Admin & Multi-User Sharing](Notifications-and-Security)**
   - **Super-Admin Server Fleet & User Audit:** Live last login (`last_login_at`) & activity timestamps, global user role management, and fleet-wide visibility
   - **Direct Co-Driver Invitations:** Vehicle owners can invite drivers by email, assign `Editor` or `Viewer` roles, and copy instant onboarding links
   - **Reverse Proxy SSO:** Hardened header authentication (Pangolin, Authelia, Authentik, Traefik, Cloudflare Access) with auto-minted session cookies and `/proxy-debug` endpoint
   - **1-Click Guest / Proef Sandbox Mode:** Isolated trial accounts for prospective users with 1-click permanent conversion
   - **Adaptive Visitor Experience:** Zero-flash automatic system theme (Dark/Light) and browser language (Dutch/English) detection
   - Push & email notifications via **Web Push (PWA)**, **Pushover**, **Ntfy**, **Gotify**, **Discord/Slack Webhooks**, and **E-mail (Microsoft 365, Gmail, SMTP, Graph)**
   - Passkeys (WebAuthn) with one-time recovery codes

---

## ⚡ Quick Links

- **GitHub Repository:** [github.com/TeeCodeDev/VehicleVault](https://github.com/TeeCodeDev/VehicleVault)
- **Container Image:** `ghcr.io/teecodedev/vehiclevault:latest`
- **Health Check Endpoint:** `GET /healthz`
- **MCP Endpoint:** `POST /api/mcp`
