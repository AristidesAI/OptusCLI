const axios = require('axios');

const BASE_HEADERS = {
  'Accept-Language': 'en-GB',
  Connection: 'keep-alive',
};

class RouterAPI {
  static _request(method, url, cookie, data) {
    const headers = { ...BASE_HEADERS };
    if (cookie) headers.Cookie = cookie;
    if (data) headers['Content-Type'] = 'application/x-www-form-urlencoded';

    const opts = { url, method, headers };
    if (data) opts.data = data;

    return axios(opts);
  }

  static postLoginParam(url, username) {
    return RouterAPI._request('POST', url + '/api/v1/login-params', null, {
      login: username,
    });
  }

  static postLogin(url, username, auth_key, cnonce, salt, nonce, conid) {
    const cookie = `salt=${salt}; nonce=${nonce}; conid=${conid}`;
    return RouterAPI._request('POST', url + '/api/v1/login', cookie, {
      login: username,
      auth_key,
      cnonce,
    });
  }

  static getAuthenticated(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/authenticated', cookie);
  }

  // ── DHCP / DNS ────────────────────────────────────────────────────────

  static getDHCP(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/dhcp', cookie);
  }

  static putDHCP(url, cookie, data) {
    return RouterAPI._request('PUT', url + '/api/v1/dhcp', cookie, data);
  }

  static setDNS(url, cookie, dns1, dns2) {
    return RouterAPI.putDHCP(url, cookie, { dnsservers: dns1 + ',' + dns2 });
  }

  // ── Hosts / Devices ───────────────────────────────────────────────────

  static getHosts(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/hosts', cookie);
  }

  // ── System / Status ───────────────────────────────────────────────────

  static getSystemStatus(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/status', cookie);
  }

  static getSystemInfo(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/system', cookie);
  }

  static getFirmware(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/firmware', cookie);
  }

  static reboot(url, cookie) {
    return RouterAPI._request('POST', url + '/api/v1/reboot', cookie);
  }

  static factoryReset(url, cookie) {
    return RouterAPI._request('POST', url + '/api/v1/reset', cookie);
  }

  // ── WAN / Internet ────────────────────────────────────────────────────

  static getWAN(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/wan', cookie);
  }

  static reconnectWAN(url, cookie) {
    return RouterAPI._request('POST', url + '/api/v1/wan', cookie, {
      action: 'reconnect',
    });
  }

  // ── LAN ───────────────────────────────────────────────────────────────

  static getLAN(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/lan', cookie);
  }

  static putLAN(url, cookie, data) {
    return RouterAPI._request('PUT', url + '/api/v1/lan', cookie, data);
  }

  // ── WiFi / WLAN ───────────────────────────────────────────────────────

  static getWiFi(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/wifi', cookie);
  }

  static getWLAN(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/wlan', cookie);
  }

  static putWiFi(url, cookie, data) {
    return RouterAPI._request('PUT', url + '/api/v1/wifi', cookie, data);
  }

  static putWLAN(url, cookie, data) {
    return RouterAPI._request('PUT', url + '/api/v1/wlan', cookie, data);
  }

  static getWiFiScan(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/wifiscan', cookie);
  }

  // ── Firewall ──────────────────────────────────────────────────────────

  static getFirewall(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/firewall', cookie);
  }

  static putFirewall(url, cookie, data) {
    return RouterAPI._request('PUT', url + '/api/v1/firewall', cookie, data);
  }

  // ── NAT / Port Forwarding ─────────────────────────────────────────────

  static getNAT(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/nat', cookie);
  }

  static putNAT(url, cookie, data) {
    return RouterAPI._request('PUT', url + '/api/v1/nat', cookie, data);
  }

  static getPortForwarding(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/portforwarding', cookie);
  }

  static getDMZ(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/dmz', cookie);
  }

  static putDMZ(url, cookie, data) {
    return RouterAPI._request('PUT', url + '/api/v1/dmz', cookie, data);
  }

  static getUPnP(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/upnp', cookie);
  }

  // ── QoS ───────────────────────────────────────────────────────────────

  static getQoS(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/qos', cookie);
  }

  // ── DDNS ──────────────────────────────────────────────────────────────

  static getDDNS(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/ddns', cookie);
  }

  // ── Access Control / Parental ─────────────────────────────────────────

  static getAccessControl(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/accesscontrol', cookie);
  }

  static getMACFilter(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/macfilter', cookie);
  }

  // ── VoIP ──────────────────────────────────────────────────────────────

  static getVoIP(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/voip', cookie);
  }

  // ── Logs ──────────────────────────────────────────────────────────────

  static getLogs(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/log', cookie);
  }

  static getSyslog(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/syslog', cookie);
  }

  // ── Statistics ────────────────────────────────────────────────────────

  static getStatistics(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/statistics', cookie);
  }

  static getTraffic(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/traffic', cookie);
  }

  // ── USB / Storage ─────────────────────────────────────────────────────

  static getUSB(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/usb', cookie);
  }

  // ── Time ──────────────────────────────────────────────────────────────

  static getTime(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/time', cookie);
  }

  // ── Diagnostics ───────────────────────────────────────────────────────

  static ping(url, cookie, target) {
    return RouterAPI._request(
      'POST',
      url + '/api/v1/diagnostics',
      cookie,
      { action: 'ping', target }
    );
  }

  static traceroute(url, cookie, target) {
    return RouterAPI._request(
      'POST',
      url + '/api/v1/diagnostics',
      cookie,
      { action: 'traceroute', target }
    );
  }

  // ── DSL / LTE ─────────────────────────────────────────────────────────

  static getDSL(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/dsl', cookie);
  }

  static getLTE(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/lte', cookie);
  }

  // ── Users ─────────────────────────────────────────────────────────────

  static getUsers(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/users', cookie);
  }

  // ── Routing ───────────────────────────────────────────────────────────

  static getRouting(url, cookie) {
    return RouterAPI._request('GET', url + '/api/v1/routing', cookie);
  }
}

module.exports = RouterAPI;
