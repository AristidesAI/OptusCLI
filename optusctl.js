#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { ArgumentParser } = require('argparse');
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

async function createClient() {
  const config = loadConfig();
  if (!config) { console.error('No settings.conf found. Copy settings.conf.sample and fill in router details.'); process.exit(1); }
  const client = new RouterClient(config);
  try { await client.connect(); } catch (e) { console.error('Failed to connect:', e.message); process.exit(1); }
  return client;
}

function json(data) { console.log(JSON.stringify(data, null, 2)); }
function green(s) { return '\x1b[32m' + s + '\x1b[0m'; }
function yellow(s) { return '\x1b[33m' + s + '\x1b[0m'; }
function red(s) { return '\x1b[31m' + s + '\x1b[0m'; }

function table(rows, cols) {
  if (!rows.length) return console.log('  (none)');
  const widths = {};
  for (const c of cols) widths[c] = c.length;
  for (const r of rows) for (const c of cols) widths[c] = Math.max(widths[c], String(r[c] || '').length);
  console.log('  ' + cols.map(c => c.padEnd(widths[c])).join('  '));
  console.log('  ' + cols.map(c => '-'.repeat(widths[c])).join('  '));
  for (const r of rows) console.log('  ' + cols.map(c => String(r[c] || '').padEnd(widths[c])).join('  '));
}

function buildParser() {
  const p = new ArgumentParser({ prog: 'optusctl', description: 'Optus Sagemcom FAST5393LTE-A Router CLI' });
  const subs = p.add_subparsers({ dest: 'cmd', title: 'commands' });

  subs.add_parser('status', { aliases: ['st'], help: 'Quick system overview' });

  const dns = subs.add_parser('dns', { help: 'View/set DHCP DNS servers' });
  dns.add_argument('--set', { nargs: 2, metavar: ['DNS1', 'DNS2'], help: 'Set custom DNS servers' });

  const dev = subs.add_parser('devices', { aliases: ['dev', 'hosts'], help: 'List connected devices' });
  dev.add_argument('--active', { action: 'store_true', help: 'Active devices only' });
  dev.add_argument('--json', { action: 'store_true', help: 'Raw JSON output' });
  dev.add_argument('--nickname', { nargs: '+', metavar: ['MAC', 'NAME'], help: 'Nickname a device' });
  dev.add_argument('--clear', { metavar: 'MAC', help: 'Clear nickname' });
  dev.add_argument('--block', { metavar: 'MAC', help: 'Block device by MAC' });

  const wifi = subs.add_parser('wifi', { help: 'WiFi configuration' });
  wifi.add_argument('--scan', { action: 'store_true', help: 'Scan for networks' });
  wifi.add_argument('--status', { action: 'store_true', help: 'WiFi SSID status' });
  wifi.add_argument('--guest', { action: 'store_true', help: 'Guest network settings' });
  wifi.add_argument('--wps', { action: 'store_true', help: 'WPS push button' });

  const wan = subs.add_parser('wan', { help: 'WAN/internet status' });
  wan.add_argument('--stats', { action: 'store_true', help: 'IP statistics' });

  subs.add_parser('lan', { help: 'LAN statistics' });

  const fw = subs.add_parser('firewall', { aliases: ['fw'], help: 'Firewall configuration' });
  fw.add_argument('--rules', { action: 'store_true', help: 'Show firewall rules' });
  fw.add_argument('--level', { choices: ['off', 'low', 'medium', 'high'], help: 'Set firewall level' });

  const nat = subs.add_parser('nat', { aliases: ['pf', 'portforward'], help: 'NAT / port forwarding' });
  nat.add_argument('--rules', { action: 'store_true', help: 'Show port forwarding rules' });
  nat.add_argument('--dmz', { metavar: 'IP', help: 'Set DMZ host' });
  nat.add_argument('--dmz-off', { action: 'store_true', help: 'Disable DMZ' });
  nat.add_argument('--add', { nargs: 5, metavar: ['NAME', 'PROTO', 'EXT', 'IP', 'PORT'], help: 'Add port forward' });
  nat.add_argument('--delete', { metavar: 'NAME', help: 'Delete port forward rule' });

  const sys = subs.add_parser('system', { aliases: ['sys'], help: 'System info & control' });
  sys.add_argument('--info', { action: 'store_true', help: 'Device info' });
  sys.add_argument('--features', { action: 'store_true', help: 'Device features' });
  sys.add_argument('--reboot', { action: 'store_true', help: 'Reboot router' });
  sys.add_argument('--factory-reset', { action: 'store_true', help: 'Factory reset (DESTRUCTIVE)' });
  sys.add_argument('--log', { action: 'store_true', help: 'System log' });
  sys.add_argument('--discover', { action: 'store_true', help: 'Discover all API endpoints' });
  sys.add_argument('--time', { action: 'store_true', help: 'NTP/time settings' });
  sys.add_argument('--backup', { action: 'store_true', help: 'Backup config' });

  const diag = subs.add_parser('diag', { help: 'Diagnostics' });
  diag.add_argument('--ping', { metavar: 'HOST', help: 'Ping a host' });
  diag.add_argument('--traceroute', { metavar: 'HOST', help: 'Traceroute to host' });

  const parental = subs.add_parser('parental', { help: 'Parental controls' });
  parental.add_argument('--enable', { action: 'store_true', help: 'Enable parental controls' });
  parental.add_argument('--disable', { action: 'store_true', help: 'Disable parental controls' });

  subs.add_parser('cellular', { aliases: ['lte'], help: 'Cellular/LTE status' });
  subs.add_parser('voice', { aliases: ['voip'], help: 'VoIP status' });
  subs.add_parser('usb', { help: 'USB devices' });
  subs.add_parser('ddns', { help: 'Dynamic DNS' });
  subs.add_parser('vpn', { help: 'VPN configuration' });
  subs.add_parser('upnp', { help: 'UPnP configuration' });

  const raw = subs.add_parser('raw', { help: 'Raw API call' });
  raw.add_argument('path', { help: 'API path (e.g. /api/v1/dhcp)' });
  raw.add_argument('--method', { default: 'GET', choices: ['GET', 'PUT', 'POST', 'DELETE'], help: 'HTTP method' });
  raw.add_argument('--data', { help: 'Request body (key=val&key=val)' });

  return p;
}

const CACHE_FILE = path.join(__dirname, 'device-cache.json');
function readCache() { try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch { return {}; } }
function writeCache(c) { fs.writeFileSync(CACHE_FILE, JSON.stringify(c, null, 2)); }

async function main() {
  const parser = buildParser();
  const args = parser.parse_args();
  if (!args.cmd) { parser.print_help(); process.exit(0); }

  const client = await createClient();

  switch (args.cmd) {
    case 'status': case 'st': {
      console.log('Router Status: ' + green(client.host));
      try {
        const g = (await client.get('/api/v1/app/gateway')).data;
        console.log('  Model:    ' + (g[0]?.gateway || '?'));
      } catch {}
      try {
        const d = (await client.get('/api/v1/deviceInfo')).data;
        const dev = d[0] || d;
        console.log('  Firmware: ' + (dev.software_version || dev.firmwareversion || '?'));
        console.log('  Hardware: ' + (dev.hardware_version || dev.hardwareversion || '?'));
        console.log('  Uptime:   ' + Math.floor((dev.uptime || 0) / 3600) + 'h');
      } catch {}
      try {
        const w = (await client.get('/api/v1/wan/status')).data;
        const wan = w[0] || w;
        console.log('  WAN:      ' + (wan.status || '?'));
      } catch {}
      try {
        const h = (await client.get('/api/v1/hosts')).data;
        const list = h[0]?.hosts?.list || [];
        console.log('  Devices:  ' + list.filter(d => d.active === 'true' || d.active === true).length + ' active');
      } catch {}
      try {
        const dhcp = (await client.get('/api/v1/dhcp')).data;
        const dc = dhcp[0]?.dhcp;
        if (dc) console.log('  DHCP:     ' + (dc.enable ? 'enabled' : 'disabled'));
      } catch {}
      break;
    }
    case 'dns': {
      if (args.set) {
        await client.put('/api/v1/dhcp', { dnsservers: args.set[0] + ',' + args.set[1] });
        console.log('DNS set to ' + args.set[0] + ', ' + args.set[1]);
        return;
      }
      try {
        const dns = (await client.get('/api/v1/dns/ipv4')).data;
        const info = dns[0]?.DNS;
        if (info) {
          console.log('DNS Mode:    ' + info.dnsMode);
          console.log('Provider:    ' + (info.static?.provider || 'DHCP'));
          console.log('Servers:     ' + (info.static?.servers || info.dynamic?.[0]?.server || '?'));
          if (info.static?.providerList) {
            console.log('\nAvailable providers:');
            info.static.providerList.split(',').forEach(p => console.log('  - ' + p.trim()));
          }
        }
        json(dns);
      } catch (e) { console.log('DNS info unavailable'); }
      break;
    }
    case 'devices': case 'dev': case 'hosts': {
      if (args.nickname) {
        const [mac, ...name] = args.nickname;
        const cache = readCache();
        cache[mac] = { ...cache[mac], macaddress: mac, nickname: name.join(' ') };
        writeCache(cache);
        console.log('Nickname set for ' + mac);
        return;
      }
      if (args.clear) { const cache = readCache(); delete cache[args.clear]; writeCache(cache); console.log('Cleared'); return; }
      if (args.block) { try { await client.post('/api/v1/wireless/acl/rules', { mac: args.block, enable: 'true' }); console.log('Blocked'); } catch { console.log('Block failed'); } return; }
      const res = await client.get('/api/v1/hosts');
      const hosts = res.data[0]?.hosts?.list || [];
      if (args.json) return json(hosts);
      const cache = readCache();
      const active = hosts.filter(d => d.active === 'true' || d.active === true);
      console.log(green('Active Devices (' + active.length + '):'));
      table(active.map(d => ({
        Name: cache[d.macaddress]?.nickname || d.hostname || '(unknown)',
        'IP Address': d.ipaddress,
        'MAC Address': d.macaddress,
        Link: d.ethernet?.port ? 'Eth' + d.ethernet.port + ' ' + d.ethernet.speed + 'M' : (d.link || 'WiFi'),
      })), ['Name', 'IP Address', 'MAC Address', 'Link']);
      if (!args.active) {
        const inactive = hosts.filter(d => !active.includes(d));
        if (inactive.length) { console.log('\n' + yellow('Inactive (' + inactive.length + '):')); inactive.forEach(d => console.log('  ' + (cache[d.macaddress]?.nickname || d.hostname || '(?)') + '  ' + d.macaddress)); }
      }
      for (const d of hosts) { if (!cache[d.macaddress]) cache[d.macaddress] = { macaddress: d.macaddress, hostname: d.hostname || '', nickname: '' }; }
      writeCache(cache);
      break;
    }
    case 'wifi': {
      if (args.scan) { try { await client.post('/api/v2/wireless/wirelessScan/scan'); const r = await client.get('/api/v2/wireless/wirelessScan/results/1'); json(r.data); } catch (e) { console.log('Scan not supported'); } return; }
      if (args.status) { try { json((await client.get('/api/v1/wireless/ssid_status')).data); } catch { console.log('Unavailable'); } return; }
      if (args.guest) { try { json((await client.get('/api/v1/wireless/guest/settings')).data); } catch { console.log('Unavailable'); } return; }
      if (args.wps) { await client.post('/api/v1/wireless/wps/pushbutton'); console.log('WPS activated (2 min window)'); return; }
      try { json((await client.get('/api/v2/wireless/1')).data); } catch { console.log('Unavailable'); }
      break;
    }
    case 'wan': { try { json((await client.get('/api/v1/wan/status')).data); if (args.stats) json((await client.get('/api/v1/wan/ip/stats')).data); } catch { console.log('Unavailable'); } break; }
    case 'lan': { try { json((await client.get('/api/v1/lan/stats')).data); } catch { console.log('Unavailable'); } break; }
    case 'firewall': case 'fw': {
      if (args.rules) { try { json((await client.get('/api/v1/firewall/rules')).data); } catch { console.log('Unavailable'); } return; }
      if (args.level) { const levels = { off: '0', low: '1', medium: '2', high: '3' }; await client.put('/api/v1/firewall', { level: levels[args.level] }); console.log('Firewall: ' + args.level); return; }
      try { json((await client.get('/api/v1/firewall')).data); } catch { console.log('Unavailable'); }
      break;
    }
    case 'nat': case 'pf': case 'portforward': {
      if (args.rules) { try { json((await client.get('/api/v1/nat/rules')).data); } catch { console.log('Unavailable'); } return; }
      if (args.dmz) { await client.put('/api/v1/nat/dmz', { host: args.dmz, enable: 'true' }); console.log('DMZ: ' + args.dmz); return; }
      if (args.dmz_off) { await client.put('/api/v1/nat/dmz', { enable: 'false' }); console.log('DMZ disabled'); return; }
      if (args.add) { const [n, p, e, ip, po] = args.add; await client.post('/api/v1/nat/rules', { name: n, protocol: p, external_port_start: e, external_port_end: e, internal_ip: ip, internal_port: po, enable: 'true' }); console.log('Added: ' + n); return; }
      if (args.delete) { await client.del('/api/v1/nat/rules/' + encodeURIComponent(args.delete)); console.log('Deleted'); return; }
      try { json((await client.get('/api/v1/nat')).data); json((await client.get('/api/v1/nat/dmz')).data); } catch {}
      break;
    }
    case 'system': case 'sys': {
      if (args.reboot) { await client.post('/api/v1/device/reboot'); console.log(red('Rebooting...')); return; }
      if (args.factory_reset) { console.log(red('WARNING: Erases ALL settings!')); const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout }); const a = await new Promise(r => rl.question('Type "yes" to confirm: ', r)); rl.close(); if (a.toLowerCase() === 'yes') { await client.post('/api/v1/device/factory'); console.log('Reset initiated'); } else console.log('Cancelled'); return; }
      if (args.discover) { console.log('Discovering...'); const results = await client.discoverEndpoints(); const ok = Object.entries(results).filter(([,r]) => r.ok); console.log(green('\nAccessible (' + ok.length + '):')); ok.forEach(([p, r]) => console.log('  [' + r.status + '] ' + p)); return; }
      if (args.info) { try { json((await client.get('/api/v1/deviceInfo')).data); } catch { console.log('Unavailable'); } return; }
      if (args.features) { try { json((await client.get('/api/v1/device/features')).data); } catch { console.log('Unavailable'); } return; }
      if (args.log) { try { json((await client.get('/api/v1/device/log')).data); } catch { console.log('Unavailable'); } return; }
      if (args.time) { try { json((await client.get('/api/v1/ntp')).data); } catch { console.log('Unavailable'); } return; }
      if (args.backup) { try { json((await client.get('/api/v1/BackupManagement/backup')).data); } catch { console.log('Unavailable'); } return; }
      try { json((await client.get('/api/v1/deviceInfo')).data); } catch { console.log('Unavailable'); }
      break;
    }
    case 'diag': {
      if (args.ping) { try { json((await client.post('/api/v1/internet_utilities/ping', { host: args.ping })).data); } catch { console.log('Failed'); } return; }
      if (args.traceroute) { try { json((await client.post('/api/v1/internet_utilities/traceroute', { host: args.traceroute })).data); } catch { console.log('Failed'); } return; }
      console.log('Use --ping <host> or --traceroute <host>');
      break;
    }
    case 'parental': {
      if (args.enable) { await client.put('/api/v1/parental_control/enable', { enable: 'true' }); console.log('Enabled'); return; }
      if (args.disable) { await client.put('/api/v1/parental_control/enable', { enable: 'false' }); console.log('Disabled'); return; }
      try { json((await client.get('/api/v1/parental_control')).data); } catch { console.log('Unavailable'); }
      break;
    }
    case 'cellular': case 'lte': { try { json((await client.get('/api/v1/optus/cellular')).data); } catch { try { json((await client.get('/api/v1/cellular/interface')).data); } catch { console.log('Unavailable'); } } break; }
    case 'voice': case 'voip': { try { json((await client.get('/api/v1/voice')).data); } catch { console.log('Unavailable'); } break; }
    case 'usb': { try { json((await client.get('/api/v1/usb/devices')).data); } catch { console.log('Unavailable'); } break; }
    case 'ddns': { try { json((await client.get('/api/v1/dns/dynamic_dns')).data); } catch { console.log('Unavailable'); } break; }
    case 'vpn': { try { json((await client.get('/api/v1/vpn')).data); } catch { console.log('Unavailable'); } break; }
    case 'upnp': { try { json((await client.get('/api/v1/upnp/igd')).data); } catch { console.log('Unavailable'); } break; }
    case 'raw': {
      const method = args.method || 'GET';
      let res;
      if (method === 'GET') res = await client.get(args.path);
      else if (method === 'PUT') res = await client.put(args.path, args.data ? Object.fromEntries(new URLSearchParams(args.data)) : {});
      else if (method === 'POST') res = await client.post(args.path, args.data ? Object.fromEntries(new URLSearchParams(args.data)) : {});
      else if (method === 'DELETE') res = await client.del(args.path);
      console.log('Status: ' + res.status);
      json(res.data);
      break;
    }
    default: console.log('Unknown: ' + args.cmd); parser.print_help(); process.exit(1);
  }
  process.exit(0);
}

main().catch(e => { console.error(red('Error: ' + e.message)); process.exit(1); });
