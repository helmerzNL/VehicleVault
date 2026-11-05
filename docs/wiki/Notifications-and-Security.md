# 🔔 Notifications, Multi-User Sharing & Security

---

## 1. Push & Email Notification Channels

Under **Settings → Meldingen (Notifications)**, configure automated alerts for:
- **Approaching APK / Technical Inspections** (within 30 days or overdue)
- **Maintenance Intervals** (`warning` at 90% or `overdue` at 100%)
- **Expiring Glovebox Documents** (insurance policies, green cards, warranties expiring within 30 days)

### Supported Providers
| Provider | Configuration |
| :--- | :--- |
| **Web Push (PWA)** | No account or settings needed: each person turns it on for their own device under **Settings → Notifications → Web Push**. Alerts go to every enabled device (see below) |
| **Pushover** | User Key + Application API Token + optional target Device name (priority `1` for overdue alerts, HTML formatting) |
| **Ntfy.sh** | Self-hosted or public topic URL + optional Bearer access token |
| **Gotify** | Server URL + Application Token |
| **Webhook (Discord / Slack / Generic)** | Automatically formats rich embeds for Discord/Slack or dispatches a structured JSON payload |
| **E-mail** | Sent through **Microsoft 365** (sign in), **Gmail** (connect with Google), **SMTP** or **Microsoft Graph** with your own app. |

---

## 2. Super-Admin Fleet Management, User Audit & Vehicle Sharing

### Strict Multi-Tenant Isolation
By default, every registered user has a strictly isolated garage: User A cannot see User B's vehicles or private records.

### Super-Admin (Container & Server Owner) Capabilities
The server owner retains full administrative authority over the deployment:
- **Server Users Overview:** Under **Settings → Server Gebruikers (Admin)**, Super-Admins view every account registered on the server.
- **Real-Time Audit Trail:** Review exact **last login** (`last_login_at`) and **last activity** (`last_active_at`) timestamps, account creation dates, vehicle counts, and shared access.
- **Global Role Management:** Promote or demote users between roles (`Super-Admin`, `Gebruiker`, `Chauffeur`) with 1-click select controls.
- **Full Fleet View Toggle:** In the **My Garage (`Voertuigen`)** screen, Super-Admins can toggle **Toon Alle Voertuigen (Admin)** to view all registered vehicles across the entire server, with owner tags (`Gedeeld (vriend@voorbeeld.nl)`), while keeping private documents and invoices confidential to the vehicle owner.
- **Server Settings Safeguard:** Server-critical tabs (Database Backups, Reverse Proxy controls, AI models) remain strictly hidden from non-admin accounts.

### Direct Co-Driver Invitations (`vehicle_shares`)
Want to share a family car with your partner, wife, parents, or co-driver?
1. Go to **My Garage (`Mijn Garage`)** and click the **Delen (Share)** button on any vehicle you own.
2. Enter the email address of the person you want to invite (even if they don't have an account yet).
3. Choose their access level:
   - **`Editor (Bewerker / Bestuurder)`:** Can view and log fuel fill-ups, maintenance records, documents, tire measurements, trips, fixed expenses, and view TCO analytics.
   - **`Viewer (Kijker / Toeschouwer)`:** Read-only access to the vehicle's dashboard, fuel history, maintenance history, documents, tires, and TCO analytics.
4. **Instant Onboarding Link:** Click **Kopieer Uitnodigingslink** to send a direct onboarding URL via WhatsApp or email. The co-driver is auto-provisioned and granted instant access upon opening the link.
5. The vehicle owner can modify permissions or revoke access at any time.

### Account Roles
- **`Super-Admin` (`admin`):** Full server management, user audit, server backups, proxy settings, and global fleet overview.
- **`Gebruiker` (`user`):** Independent vehicle owner with their own vehicles, personal Home Assistant coupling, and vehicle driver invitation management.
- **`Chauffeur` (`driver`):** Simplified, high-contrast mobile dashboard focused on 1-click fueling, EV charging, and trip logging on shared vehicles.

---

## 3. Reverse Proxy SSO & Hardened Header Authentication

VehicleVault integrates seamlessly behind authentication reverse proxies:
- **Supported Proxies:** **Pangolin**, **Authelia**, **Authentik**, **Traefik Forward-Auth**, and **Cloudflare Access**.
- **Supported Headers:** `Remote-Email`, `X-Forwarded-Email`, `Remote-User`, `X-Forwarded-User`, or `X-Pangolin-User`.
- **Automatic Page Load Session Minting:** When entering via Pangolin or Authelia, VehicleVault detects the identity headers on initial page navigation (`GET /`), immediately issues HTTP-only session cookies (`refresh_token` and `vv_token` with `Path=/`), and logs the user in without landing on a secondary login prompt.
- **Diagnostic Endpoint:** Inspect live proxy headers and proxy trust in real time by visiting `https://your-domain.com/proxy-debug` while logged into your reverse proxy.
- **Admin UI Toggle:** Under **Settings → Server Gebruikers**, administrators can toggle **Reverse Proxy SSO** on or off at any time. When disabled, proxy headers are safely ignored.
- **Strict IP Validation:** VehicleVault validates that incoming requests containing proxy headers originate from trusted loopback (`127.0.0.1`, `::1`) or standard RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`). Public clients cannot inject spoofed headers.
- **Auto-Provisioning:** When a user logs in through Pangolin or Authentik for the first time, a corresponding VehicleVault account is automatically provisioned for them.

---

## 4. 1-Click Guest & Proef Sandbox Mode

Want friends, prospective users, or community visitors to test VehicleVault without having to manually invite them or give them access through your SSO/reverse proxy?

### Features
1. **1-Click Guest Trial:** Click **Probeer Proefmodus (1-Click)** on the login screen to enter a fully functional, isolated sandbox session immediately.
2. **Invite Link Auto-Entry:** Direct visitors to `https://your-domain.com/?guest=1` or `?proef=1` to launch directly into the guest trial without touching the login form.
3. **Persistent Trial Banner:** A floating reminder banner indicates that the session is in guest mode and provides a **Bewaar Mijn Account (Convert)** button.
4. **Seamless Account Conversion:** At any moment, the guest can enter their email and choose a password. Their guest account is instantly converted into a permanent account with all their test vehicles, fuel entries, and maintenance history preserved.
5. **Admin Access Control:** Administrators can enable or disable guest access under **Settings → Gebruikers & Toegang** or via the `ALLOW_GUEST_ACCESS=false` environment variable.

---

## 5. Passkeys & Recovery Codes

Passkeys let you sign in with a fingerprint, face or device PIN instead of typing a password. They work **next to** the password, which stays available as the fallback.

### Requirements
- A **domain name** and **HTTPS** (or `localhost`).
- Behind a reverse proxy, set `RP_ID` and `RP_ORIGINS`:
  ```env
  RP_ID=vault.yourdomain.com
  RP_ORIGINS=https://vault.yourdomain.com
  ```

### Recovery codes
- Your first passkey comes with **8 one-time recovery codes**. They are stored only as SHA-256 hashes and are consumed on use.

---

## 6. Adaptive Visitor Experience (Theme & Language Auto-Detection)

- **Zero-Flash System Theme:** Automatically detects the visitor's operating system and browser preference (`prefers-color-scheme`). Dark mode or light mode is activated instantly before page render.
- **Automatic Language Detection:** Inspects `navigator.language` and `navigator.languages`. Dutch-speaking users are automatically greeted in **Nederlands (`nl`)**, while international visitors receive the interface in **English (`en`)**.
- **Manual Override:** The user's explicit choices via the theme switcher and language flag toggle are persistently remembered in `localStorage`.
