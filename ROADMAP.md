# VehicleVault — Roadmap & Architecture Modernization

Dit document bevat de gerealiseerde mijlpalen en geplande doorontwikkelingen voor **VehicleVault**.

---

## 🏛️ Gerealiseerd in v3.2 (Community, Proefmodus & Telemetrie HUD)
- ✅ **1-Click Gast / Proef Sandbox Modus:** Laagdrempelige testmodus voor geïnteresseerden en demonstraties via `/proef` of invite links (`?guest=1`, `?proef=1`), met 1-klik conversie naar een vast account zonder dataverlies.
- ✅ **Reverse Proxy SSO Beheerpaneel & Hardening:** Beheerdersinterface onder Instellingen > Gebruikers om header-authenticatie (Pangolin, Authelia, Authentik, Traefik) in of uit te schakelen, beschermd door strikte loopback en private netwerk CIDR validatie.
- ✅ **Automatische Donkere/Lichte Modus & Taaldetectie:** Zero-flash herkenning van OS-thema (`prefers-color-scheme`) en browsertaal (Nederlands vs Engels), met permanente handmatige overschrijving via `localStorage`.
- ✅ **Cockpit Telemetrie HUD & Modern Login UI:** Geanimeerd instrumentarium met dynamische snelheidsmeter, toerenteller, brandstofmeter en tweetalige labels.
- ✅ **Hoge-Precisie Vaste Lasten TCO Engine:** Berekening van vaste lasten (MRB, verzekering, abonnementen) strikt afgestemd op de werkelijke bezitsperiode van het voertuig.
- ✅ **224/224 Geautomatiseerde Tests Geslaagd:** Volledige testdekking van alle controllers, parsers, scanners en integraties.

---

## 🏛️ Gerealiseerd in v3.0 & v3.1 (Modulaire Architectuur & Beproefde Standaarden)
- ✅ **Strikte Module-Opsplitsing (< 300 regels per bestand):** Alle grote monolithische bestanden in client en server zijn gesplitst volgens het Single Responsibility Principle.
- ✅ **Pino Structured Logger:** Hoge performantie JSON logging met Request-IDs en gevoelige veld-redactie.
- ✅ **ToadScheduler:** In-process taakplanner voor achtergrondcontroles zonder error-prone timers.
- ✅ **Zod Boundary Validation:** Strikte runtime type- en payloadvalidatie aan de Express API-poort.
- ✅ **Better-Auth & Drizzle ORM Integratie:** Type-safe database queries en robuuste sessie/auth architectuur.
- ✅ **TanStack Query (React Query):** Geïntegreerde asynchrone cache- en data-fetching provider.
- ✅ **React Hook Form + Zod Resolvers:** Gestroomlijnde formulier-state met declaratief schema-onderhoud.

---

## ✅ Reeds Gerealiseerd in v2.0 & v2.1
- ✅ **Mijn Profiel (`/profile`) vs. Systeembeheer (`/settings`):** Persoonlijk gebruikersprofiel gescheiden van globale serverinstellingen.
- ✅ **Tolvignetten & Milieustickers Menu (`/vignettes`):** Zelfstandig navigatiemenu en overzicht met verloopdata en documentkoppelingen.
- ✅ **Fuelio Multi-Sectie CSV Import:** Volledige import van Fuelio exports inclusief deduplicatie.
- ✅ **Caravan & Aanhanger Modus (`is_towing`):** Gescheiden verbruiksstatistieken voor rijden met last.
- ✅ **Bandenbeheer Aanschafprijs:** Registratie van aanschafprijs en factuurkoppeling.
- ✅ **Garage-brede Vloot TCO Analytics:** Aggregatie over alle voertuigen in de garage.
- ✅ **Passkeys (WebAuthn) & 2FA (TOTP):** Direct inloggen via biometrie/hardware keys en authenticator apps.
- ✅ **OIDC / SSO (OpenID Connect):** Koppel externe identity providers zoals Authentik, Keycloak, Authelia of Google Workspace.
- ✅ **Native Web Push (VAPID):** Directe browser/PWA push-notificaties zonder externe clouddiensten.
- ✅ **Smart AI Facturen:** Automatische vertaling van buitenlandse garagefacturen met uitsplitsing naar onderdelen en arbeid.
