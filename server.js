const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const RouterClient = require('./lib/RouterClient');

const CONFIG_PATHS = [
  path.join(__dirname, 'settings.conf'),
  path.join(process.env.HOME || '', '.optusctl.conf'),
];

function loadConfig() {
  for (const p of CONFIG_PATHS) {
    try { const c = JSON.parse(fs.readFileSync(p, 'utf8')); if (c.host && c.username && c.password) return c; } catch {}
  }
  return null;
}

const config = loadConfig();
if (!config) { console.error('No settings.conf found.'); process.exit(1); }

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let client;

async function initClient() {
  client = new RouterClient(config);
  await client.connect();
}

async function fetchData(endpoint) {
  try {
    const res = await client.get(endpoint);
    return res.data;
  } catch { return null; }
}

async function collectAllData() {
  const [wan, hosts, dhcp, dns4, wifi, fw, nat, natDmz, ntp, upnp, parental, deviceInfo, gateway, cellular, voice, lanStats, wanStats, arp, dns] = await Promise.all([
    fetchData('/api/v1/wan/status'),
    fetchData('/api/v1/hosts'),
    fetchData('/api/v1/dhcp'),
    fetchData('/api/v1/dns/ipv4'),
    fetchData('/api/v1/wireless/ssid_status'),
    fetchData('/api/v1/firewall'),
    fetchData('/api/v1/nat'),
    fetchData('/api/v1/nat/dmz'),
    fetchData('/api/v1/ntp'),
    fetchData('/api/v1/upnp/igd'),
    fetchData('/api/v1/parental_control'),
    fetchData('/api/v1/deviceInfo'),
    fetchData('/api/v1/app/gateway'),
    fetchData('/api/v1/optus/cellular'),
    fetchData('/api/v1/voice'),
    fetchData('/api/v1/lan/stats'),
    fetchData('/api/v1/wan/ip/stats'),
    fetchData('/api/v1/hosts/arp_table'),
    fetchData('/api/v1/dns'),
  ]);

  const hostsList = hosts?.[0]?.hosts?.list || [];
  const activeDevices = hostsList.filter(d => d.active === 'true' || d.active === true);
  const dhcpConfig = dhcp?.[0]?.dhcp || {};
  const dnsConfig = dns4?.[0]?.DNS || {};
  const wifiStatus = wifi?.[0] || {};
  const fwConfig = fw?.[0]?.firewall || {};
  const natConfig = nat?.[0]?.nat || {};
  const dmzConfig = natDmz?.[0]?.nat?.dmz?.[0] || {};
  const ntpConfig = ntp?.ntp || ntp?.[0]?.ntp || {};
  const upnpConfig = upnp?.[0]?.upnp?.igd || {};
  const parentalConfig = parental?.[0]?.parental_control || {};
  const devInfo = deviceInfo?.[0] || {};
  const gatewayModel = gateway?.[0]?.gateway || 'FAST5393LTE';
  const cellData = cellular?.[0] || {};
  const voiceData = voice?.[0] || {};
  const wanStatus = wan?.[0] || {};
  const lanStatsData = lanStats?.[0] || {};
  const wanStatsData = wanStats?.[0] || {};
  const arpData = arp?.[0]?.arp_table?.list || [];
  const dnsData = dns?.[0] || {};

  return {
    system: {
      model: gatewayModel,
      firmware: devInfo.software_version || devInfo.firmwareversion || '?',
      hardware: devInfo.hardware_version || devInfo.hardwareversion || 'FAST5393LTE-A',
      serial: devInfo.serial_number || devInfo.serialnumber || '?',
      uptime: devInfo.uptime || 0,
      cpu: devInfo.cpu_usage || null,
      memory: devInfo.memory_usage || null,
    },
    wan: {
      status: wanStatus.status || '?',
      lastChange: wanStatus.lastchange || '0',
      ipv4: wanStatus.ipaddress || wanStatus.ip || '?',
      gateway: wanStatus.gateway || '?',
      dns: dnsConfig?.static?.servers || dnsConfig?.dynamic?.[0]?.server || '?',
    },
    lan: {
      dhcp: dhcpConfig,
      stats: lanStatsData,
    },
    wifi: wifiStatus,
    devices: hostsList,
    activeDevices: activeDevices.length,
    totalDevices: hostsList.length,
    firewall: fwConfig,
    nat: { ...natConfig, dmz: dmzConfig },
    ntp: ntpConfig,
    upnp: upnpConfig,
    parental: parentalConfig,
    cellular: cellData,
    voice: voiceData,
    wanStats: wanStatsData,
    arp: arpData,
    dns: dnsData,
    dnsConfig,
  };
}

app.use(express.static(path.join(__dirname, 'web')));

app.get('/api/data', async (req, res) => {
  try {
    const data = await collectAllData();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/raw/*', async (req, res) => {
  try {
    const apiPath = '/' + req.params[0];
    const result = await client.get(apiPath);
    res.json(result.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/action', express.json(), async (req, res) => {
  try {
    const { action, endpoint, data } = req.body;
    if (action === 'put') {
      const r = await client.put(endpoint, data);
      return res.json({ status: r.status });
    }
    if (action === 'post') {
      const r = await client.post(endpoint, data);
      return res.json({ status: r.status });
    }
    if (action === 'del') {
      const r = await client.del(endpoint);
      return res.json({ status: r.status });
    }
    res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

io.on('connection', (socket) => {
  let interval;
  socket.on('startPolling', (ms) => {
    clearInterval(interval);
    interval = setInterval(async () => {
      try {
        const data = await collectAllData();
        socket.emit('update', data);
      } catch {}
    }, ms || 3000);
  });
  socket.on('stopPolling', () => clearInterval(interval));
  socket.on('disconnect', () => clearInterval(interval));
});

const PORT = process.env.PORT || 3000;

initClient().then(() => {
  server.listen(PORT, () => {
    console.log(`\n  OptusCLI Web GUI running at http://localhost:${PORT}\n`);
  });
}).catch(e => {
  console.error('Failed to connect:', e.message);
  process.exit(1);
});
