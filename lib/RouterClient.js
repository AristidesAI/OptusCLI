const axios = require('axios');

class RouterClient {
  constructor(config) {
    this.host = config.host;
    this.username = config.username;
    this.password = config.password;
    this.cookie = null;
    this.connected = false;
  }

  async connect() {
    const res = await axios.post(
      this.host + '/api/v1/login',
      'login=' + encodeURIComponent(this.username) +
        '&password=' + encodeURIComponent(this.password),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Language': 'en-GB',
        },
      }
    );

    const cookies = res.headers['set-cookie'] || [];
    const salt  = this._extractCookie(cookies, 'salt');
    const nonce = this._extractCookie(cookies, 'nonce');
    const conid = this._extractCookie(cookies, 'conid');

    this.cookie = { salt, nonce, conid };
    this.connected = true;
    return this.cookie;
  }

  _extractCookie(cookies, name) {
    for (const c of cookies) {
      if (c.startsWith(name + '=')) {
        return c.split(';')[0].split('=')[1];
      }
    }
    return '';
  }

  _cookieString() {
    const c = this.cookie || {};
    return 'salt=' + (c.salt || '') +
      '; nonce=' + (c.nonce || '') +
      '; conid=' + (c.conid || '');
  }

  async ensureConnected() {
    if (!this.connected) return this.connect();
    try {
      const res = await axios.get(this.host + '/api/v1/authenticated', {
        headers: { Cookie: this._cookieString() },
      });
      if (res.status !== 200) throw new Error('session expired');
    } catch {
      this.connected = false;
      return this.connect();
    }
    return this.cookie;
  }

  async get(path) {
    await this.ensureConnected();
    return axios.get(this.host + path, {
      headers: { Cookie: this._cookieString() },
    });
  }

  async put(path, data) {
    await this.ensureConnected();
    const body = new URLSearchParams(data).toString();
    return axios.put(this.host + path, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: this._cookieString(),
      },
    });
  }

  async post(path, data) {
    await this.ensureConnected();
    const body = data ? new URLSearchParams(data).toString() : undefined;
    return axios.post(this.host + path, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: this._cookieString(),
      },
    });
  }

  async del(path) {
    await this.ensureConnected();
    return axios.delete(this.host + path, {
      headers: { Cookie: this._cookieString() },
    });
  }

  async discoverEndpoints() {
    const endpoints = [
      '/api/v1/dhcp', '/api/v1/hosts', '/api/v1/firewall', '/api/v1/nat',
      '/api/v1/nat/dmz', '/api/v1/nat/rules', '/api/v1/dns', '/api/v1/dns/ipv4',
      '/api/v1/dns/ipv6', '/api/v1/dns/dynamic_dns', '/api/v1/dns/dynamic_dns/config',
      '/api/v1/wireless/ssid_status', '/api/v1/wireless/acl', '/api/v1/wireless/acl/rules',
      '/api/v1/wireless/bandsteering', '/api/v1/wireless/wps', '/api/v1/wireless/scheduler',
      '/api/v1/wireless/guest/settings', '/api/v1/wireless/high-channel',
      '/api/v2/wireless/wirelessScan/scan', '/api/v1/wan/status', '/api/v1/wan/ipv4',
      '/api/v1/wan/ip/stats', '/api/v1/wan/ethernet', '/api/v1/lan/stats',
      '/api/v1/lan/ethernet/1', '/api/v1/firewall/rules', '/api/v1/firewall/pingrespond',
      '/api/v1/firewall/portblacklist', '/api/v1/parental_control',
      '/api/v1/parental_control/enable', '/api/v1/parental_control/device_schedule',
      '/api/v1/parental_control/url_filters', '/api/v1/qos', '/api/v1/port_triggering',
      '/api/v1/port_mirroring', '/api/v1/upnp/igd', '/api/v2/advanced/nat-alg',
      '/api/v1/dhcp/clients', '/api/v1/dhcp/leases', '/api/v1/dhcp/default',
      '/api/v1/hosts/arp_table', '/api/v1/device', '/api/v1/device/factory',
      '/api/v1/device/features', '/api/v1/device/reboot', '/api/v1/device/log',
      '/api/v1/device/log-level', '/api/v1/device/log-parameters',
      '/api/v1/deviceInfo', '/api/v1/device/files', '/api/v1/FirmwareUpgrade',
      '/api/v1/assistance', '/api/v1/ntp', '/api/v1/available_timezones',
      '/api/v1/voice', '/api/v1/voice/v2/sip/clients', '/api/v1/voice/fxs/1',
      '/api/v1/voice/v2/sip/networks', '/api/v1/internet_utilities/ping',
      '/api/v1/internet_utilities/traceroute', '/api/v1/internet_utilities/speedtest',
      '/api/v1/internet_utilities/nslookup', '/api/v1/user', '/api/v1/get_user',
      '/api/v1/change-password', '/api/v1/logout', '/api/v1/authenticated',
      '/api/v1/profile', '/api/v1/session-count', '/api/v1/session-timeout',
      '/api/v1/remote-access-url', '/api/v1/app/gateway', '/api/v1/home',
      '/api/v1/BackupManagement/backup', '/api/v1/BackupManagement/restore',
      '/api/v1/oper/allowaccess', '/api/v1/oper/easymesh', '/api/v1/wan/gpon',
      '/api/v1/ipv6/enable', '/api/v1/ethwan', '/api/v1/bridge-mode',
      '/api/v1/optus/cellular', '/api/v1/optus/cellular/lock', '/api/v1/optus/landing',
      '/api/v1/optus/led', '/api/v1/optus/led/config', '/api/v1/optus/security',
      '/api/v1/cellular/interface', '/api/v1/cellular/provider',
      '/api/v1/cellular/network_type', '/api/v1/cellular/access_point',
      '/api/v1/traffic_stats/devices_usage', '/api/v1/events/subscribe',
      '/api/v1/ui/language', '/api/v1/dlna/devices', '/api/v1/ecomode',
      '/api/v1/containers', '/api/v2/easymesh/meshdevices', '/api/v2/easymesh/exclusionlist',
      '/api/v2/dynamic-dns/servers', '/api/v2/dynamic-dns/clients',
      '/api/v2/remote-access', '/api/v2/remote-access/hosts',
      '/api/v2/firewall', '/api/v2/firewall/chain',
      '/api/v1/matter/devices', '/api/v1/matter/device',
    ];

    const results = {};
    await this.ensureConnected();

    for (const path of endpoints) {
      try {
        const res = await this.get(path);
        results[path] = { status: res.status, ok: true };
      } catch (e) {
        results[path] = { status: e.response?.status || 0, ok: false };
      }
    }
    return results;
  }
}

module.exports = RouterClient;
