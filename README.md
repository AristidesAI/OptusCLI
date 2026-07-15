<p align="center">
  <img src="https://sincereonetech.com/wp-content/uploads/2024/07/Optus-gateway-f@st-5393-lte-router_7.jpg" 
       alt="Optus Sagemcom FAST5393LTE-A" width="320" style="border-radius:16px;" 
       onerror="this.style.display='none'">
</p>

<h1 align="center">OptusCLI</h1>

<p align="center">
  <strong>Full CLI & Web GUI for the Optus Sagemcom FAST5393LTE-A 5G Router</strong><br>
  Circumvent locked DNS settings · Manage every router feature · Beautiful real-time dashboard
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D16-brightgreen" alt="Node">
  <img src="https://img.shields.io/badge/router-FAST5393LTE--A-blue" alt="Router">
  <img src="https://img.shields.io/badge/firmware-SGKY10001970-orange" alt="Firmware">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License">
</p>

---

## The Problem

The Optus Sagemcom FAST5393LTE-A (also known as the Optus Ultra WiFi 5G Modem) ships with a **locked-down DNS configuration**. The web admin panel at `http://192.168.0.1` only allows selecting from a predefined dropdown list of DNS providers — you cannot enter arbitrary IP addresses. This means:

- **No Pi-hole** custom DNS servers
- **No AdGuard Home** integration
- **No Cloudflare Gateway** or other privacy DNS
- **No custom DNS** for any reason

The router uses an Angular SPA frontend that communicates with an internal REST API (`/api/v1/*`). The UI is just a skin — the real power is the API underneath.

**OptusCLI** talks directly to that API, bypassing the locked UI entirely.

## How It Works

```
┌─────────────────┐     HTTP REST API      ┌──────────────────────┐
│   OptusCLI       │ ◄──────────────────►  │  FAST5393LTE-A       │
│   (Node.js)      │    /api/v1/*          │  Sagemcom Router     │
│                  │                       │  192.168.0.1         │
│  • CLI (optusctl)│   Direct login        │                      │
│  • Web GUI (3000)│   Cookie session      │  51+ API endpoints   │
└─────────────────┘                       └──────────────────────┘
```

The router exposes **151 API endpoints** across `/api/v1/` and `/api/v2/`. Authentication is a simple direct-login flow — POST credentials to `/api/v1/login` and receive session cookies (`salt`, `nonce`, `conid`). No challenge-response, no hashing required on firmware SGKY10001970+.

## Quickstart

### 1. Install

```bash
git clone https://github.com/your/optuscli.git
cd optuscli
npm install
```

### 2. Configure

```bash
cp settings.conf.sample settings.conf
```

Edit `settings.conf` with your router details:

```json
{
   "host": "http://192.168.0.1",
   "username": "optus",
   "password": "cases92452xf"
}
```

The default username is `optus`. The password is on the sticker on the bottom of your router.

> **Security**: `settings.conf` is gitignored. Your password never leaves your machine.

### 3. Run the CLI

```bash
# System overview
node optusctl.js status

# View current DNS
node optusctl.js dns

# BYPASS: Set custom DNS (Pi-hole, AdGuard, Cloudflare, etc)
node optusctl.js dns --set 1.1.1.1 1.0.0.1

# List all connected devices
node optusctl.js devices

# View WiFi status
node optusctl.js wifi --status

# Discover all available API endpoints
node optusctl.js system --discover
```

### 4. Launch the Web GUI

```bash
npm run web
# Opens at http://localhost:3000
```

---

## CLI Reference

### `status` — System Overview
```bash
node optusctl.js status
# Model, firmware, hardware, WAN status, connected device count
```

### `dns` — DNS Management
```bash
node optusctl.js dns              # View current DNS config
node optusctl.js dns --set 1.1.1.1 1.0.0.1   # Set custom DNS
```

### `devices` — Device Management
```bash
node optusctl.js devices          # All devices
node optusctl.js devices --active # Active only
node optusctl.js devices --json   # JSON output
node optusctl.js devices --nickname aa:bb:cc:dd "Living Room TV"
node optusctl.js devices --block  aa:bb:cc:dd
```

### `wifi` — WiFi Control
```bash
node optusctl.js wifi --status    # Radio status
node optusctl.js wifi --scan      # Scan for networks
node optusctl.js wifi --guest     # Guest network settings
node optusctl.js wifi --wps       # WPS push button
```

### `wan` — Internet Status
```bash
node optusctl.js wan              # WAN status
node optusctl.js wan --stats      # IP statistics
```

### `lan` — LAN Info
```bash
node optusctl.js lan              # LAN statistics
```

### `firewall` — Security
```bash
node optusctl.js firewall         # View config
node optusctl.js firewall --rules # Firewall rules
node optusctl.js firewall --level high   # Set level
node optusctl.js firewall --level off    # Disable
```

### `nat` — Port Forwarding
```bash
node optusctl.js nat              # NAT/DMZ status
node optusctl.js nat --rules      # Port forward rules
node optusctl.js nat --dmz 192.168.0.100  # Set DMZ
node optusctl.js nat --dmz-off
node optusctl.js nat --add "Web Server" tcp 80 192.168.0.100 80
node optusctl.js nat --delete "Web Server"
```

### `system` — System Management
```bash
node optusctl.js system --info    # Device information
node optusctl.js system --features # Hardware features
node optusctl.js system --log     # System log
node optusctl.js system --time    # NTP/time settings
node optusctl.js system --discover # Discover all endpoints
node optusctl.js system --reboot  # Reboot router
node optusctl.js system --factory-reset  # Factory reset
node optusctl.js system --backup  # Backup config
```

### Other Commands
```bash
node optusctl.js diag --ping 8.8.8.8       # Ping test
node optusctl.js diag --traceroute 8.8.8.8 # Traceroute
node optusctl.js parental --enable         # Parental controls
node optusctl.js parental --disable
node optusctl.js cellular                  # 4G/5G status
node optusctl.js voice                     # VoIP status
node optusctl.js usb                       # USB devices
node optusctl.js ddns                      # Dynamic DNS
node optusctl.js vpn                       # VPN config
node optusctl.js upnp                      # UPnP config
node optusctl.js raw /api/v1/hosts         # Raw API call
```

---

## Web GUI

Launch with `npm run web` and open `http://localhost:3000`.

### Features

| Tab | Functionality |
|---|---|
| **Overview** | System info, WAN status, DHCP/LAN, real-time traffic bars, WiFi radios, NTP time, cellular signal |
| **Devices** | Full device table with IP, MAC, connection type, lease time. Block devices inline. |
| **Network** | DNS settings editor, WAN IPv4, LAN stats (RX/TX bytes/packets), ARP table |
| **WiFi** | Radio status, band steering, guest network, WPS push button, network scan |
| **Security** | Firewall level control (Off/Low/Medium/High), NAT/DMZ status, parental controls, UPnP |
| **Advanced** | Port forwarding rule management, add/delete rules, ping/traceroute diagnostics, system log viewer |

### Design

- Dark theme with glassmorphism cards
- Animated gradient orbs background
- Grid overlay pattern
- Real-time WebSocket updates (3s polling)
- Responsive layout
- Toast notifications

---

## API Discovery

The router exposes **151 API endpoints**. Run `optusctl system --discover` to find which ones are active on your firmware.

### Key Endpoints

| Category | Endpoint | Method | Description |
|---|---|---|---|
| Auth | `/api/v1/login` | POST | Direct login (username + password) |
| Auth | `/api/v1/authenticated` | GET | Check session validity |
| DHCP | `/api/v1/dhcp` | GET/PUT | DHCP config & DNS servers |
| DNS | `/api/v1/dns/ipv4` | GET/PUT | Static DNS configuration |
| Hosts | `/api/v1/hosts` | GET | Connected devices |
| WiFi | `/api/v1/wireless/ssid_status` | GET | WiFi radio status |
| WiFi | `/api/v2/wireless/wirelessScan/scan` | POST | Trigger WiFi scan |
| WAN | `/api/v1/wan/status` | GET | WAN connection status |
| Firewall | `/api/v1/firewall` | GET/PUT | Firewall level |
| NAT | `/api/v1/nat/rules` | GET/POST | Port forwarding rules |
| NAT | `/api/v1/nat/dmz` | GET/PUT | DMZ configuration |
| System | `/api/v1/device/reboot` | POST | Reboot router |
| System | `/api/v1/device/factory` | POST | Factory reset |
| System | `/api/v1/device/log` | GET | System log |
| System | `/api/v1/ntp` | GET | NTP/time settings |
| Parental | `/api/v1/parental_control` | GET/PUT | Parental controls |
| USB | `/api/v1/usb/devices` | GET | USB device list |
| VPN | `/api/v1/vpn` | GET | VPN configuration |
| VoIP | `/api/v1/voice` | GET | VoIP/telephony status |
| Cellular | `/api/v1/optus/cellular` | GET | 4G/5G cellular status |
| Diagnostics | `/api/v1/internet_utilities/ping` | POST | Ping test |
| Diagnostics | `/api/v1/internet_utilities/traceroute` | POST | Traceroute |
| UPnP | `/api/v1/upnp/igd` | GET | UPnP IGD status |
| DDNS | `/api/v1/dns/dynamic_dns` | GET | Dynamic DNS config |
| Events | `/api/v1/events/subscribe` | POST | SSE event stream |

---

## Router Deep Knowledge

### Hardware
- **Model**: FAST5393LTE-A (Sagemcom)
- **Type**: 5G Fixed Wireless Access modem/router
- **CPU**: Broadcom ARM-based SoC
- **WiFi**: Dual-band 802.11ac (2.4GHz + 5GHz) with band steering
- **Ethernet**: 4× Gigabit LAN ports + 1× WAN (some models)
- **USB**: 1× USB 2.0 for storage/print sharing
- **VoIP**: 2× FXS ports for analog phones
- **LTE/5G**: Qualcomm Snapdragon X55 or similar 5G modem

### Firmware
- **Platform**: Sagemcom proprietary Linux-based firmware
- **Web UI**: Angular SPA (single-page application)
- **API Server**: Sagemcom REST server (`Server: Sagemcom Rest`)
- **Auth**: Cookie-based session (salt, nonce, conid)
- **API Version**: v1 (primary), v2 (newer endpoints)

### Known Quirks
- The router **does not support** `PUT` to the DNS endpoint without the `enableStatic` parameter
- DNS bypass works via the DHCP endpoint with `dnsservers` parameter
- Session cookies have a 15-minute TTL — OptusCLI handles keepalive automatically
- The `/api/v1/login-params` endpoint (challenge-response) exists but direct login bypasses it
- Some endpoints return 404 on this firmware but 200 on others — use `--discover`

---

## Project Structure

```
OptusCLI/
├── optusctl.js          # CLI entry point (19 commands, 80+ flags)
├── server.js            # Express + Socket.io web server
├── lib/
│   ├── RouterClient.js  # HTTP client with auth, session, discovery
│   ├── RouterAPI.js     # Typed API methods for all endpoints
│   └── OptusHelpers.js  # Cryptography utilities (legacy)
├── web/
│   └── index.html       # Web GUI (dark theme, live dashboard)
├── settings.conf.sample # Configuration template
└── package.json
```

---

## FAQ

**Q: Is this safe? Can I brick my router?**
No read-only command can damage anything. Mutations (DNS change, reboot, factory reset) are clearly marked. The CLI asks for confirmation before destructive actions.

**Q: Does this void my warranty?**
Using the router's own undocumented API shouldn't void warranty. These are the same API calls the official web UI makes.

**Q: Why not just use the web UI?**
The web UI locks DNS server selection to a dropdown of ~20 providers. You cannot enter `192.168.0.100` for your Pi-hole.

**Q: What firmware versions are supported?**
Tested on SGKY10001970. Earlier versions (SGKY10000893) use a different auth flow — the code handles both.

**Q: Can I run the Web GUI on a different port?**
```bash
PORT=8080 npm run web
```

---

## License

MIT

---

<p align="center">
  <sub>Built to liberate router management. Not affiliated with Optus or Sagemcom.</sub>
</p>
