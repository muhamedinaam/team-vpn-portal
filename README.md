# AeroShield Team Mesh VPN Portal

A unified, self-contained web portal for managing multi-region WireGuard VPN connections across **Germany (Frankfurt)**, **France (Paris)**, and **Australia (Sydney)** for a 5-person team.

---

## 🌟 Key Features

1. **Multi-Region Gateway Selection**:
   * 🇩🇪 **Frankfurt, Germany** (`eu-central-1`)
   * 🇫🇷 **Paris, France** (`eu-west-3`)
   * 🇦🇺 **Sydney, Australia** (`ap-southeast-2`)
2. **5-Member Team Subnet Roster**:
   * Pre-allocated static internal IPs (`10.8.0.2` to `10.8.0.6`) for each team member.
   * Cryptographic Curve25519 key-pair management.
3. **Instant Profile & QR Code Generation**:
   * 1-Click `.conf` file download for desktop (Windows / macOS / Linux).
   * Pure client-side SVG QR code generator for mobile (iOS / Android) scanning into the official WireGuard app.
4. **Custom AWS Endpoints Modal**:
   * Allows saving real EC2 public IPv4 addresses persistently in browser `localStorage`.
5. **Interactive Telemetry & Ping**:
   * Live latency estimates with jitter simulation.
   * Virtual tunnel connection test mode with simulated bandwidth throughput.

---

## 🚀 How to Run Locally

The portal is completely client-side and requires zero build steps or external dependencies.

```bash
# In PowerShell:
cd C:\Users\marja\.gemini\antigravity-ide\scratch\team-vpn-portal
python -m http.server 8085
```

Open your browser at: **[http://localhost:8085](http://localhost:8085)**

---

## 🌐 Linking to Your Real AWS EC2 Nodes

1. Click the **"AWS Endpoints"** button in the top navigation bar.
2. Enter the public IPv4 addresses of your EC2 instances:
   * **Germany**: `http://<GERMANY_PUBLIC_IP>`
   * **France**: `http://<FRANCE_PUBLIC_IP>`
   * **Australia**: `http://<AUSTRALIA_PUBLIC_IP>`
3. Click **Save Endpoints**. All generated `.conf` files and QR codes will automatically use your real AWS servers!
