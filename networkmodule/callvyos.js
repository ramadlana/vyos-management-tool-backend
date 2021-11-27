const encodedParams = new URLSearchParams();
const fetch = require("node-fetch");
const https = require("https");
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const dmvpnParams = {
  nhrpTunnelHoldingTime: 100,
  ipsecEspGroupLifetime: 300,
  ipsecIkeGroupLifetime: 3600,
};

async function configureVyosHub(
  invokeType,
  tunnelSourceAdd,
  tunnelAdd,
  keyApi,
  nhrpSecret,
  localAs,
  tunnelBlock,
  remoteAs
) {
  encodedParams.set(
    "data",
    `[{"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "address", "${tunnelAdd}"]},
  {"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "mtu", "8024"]},
  {"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "encapsulation", "gre"]},
  {"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "source-address", "${tunnelSourceAdd}"]},
  {"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "multicast", "enable"]},
  {"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "parameters", "ip", "key", "1"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "cisco-authentication", "${nhrpSecret}"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "holding-time", "${dmvpnParams.nhrpTunnelHoldingTime}"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "multicast", "dynamic"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "redirect"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "shortcut"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "compression", "disable"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "lifetime", "${dmvpnParams.ipsecEspGroupLifetime}"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "mode", "transport"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "pfs", "dh-group2"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "proposal", "1", "encryption", "aes256"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "proposal", "1", "hash", "sha1"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "proposal", "2", "encryption", "3des"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "proposal", "2", "hash", "md5"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "ikev2-reauth", "no"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "key-exchange", "ikev1"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "lifetime", "${dmvpnParams.ipsecIkeGroupLifetime}"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "1", "dh-group", "2"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "1", "encryption", "aes256"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "1", "hash", "sha1"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "2", "dh-group", "2"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "2", "encryption", "aes128"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "2", "hash", "sha1"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec","ipsec-interfaces",  "interface", "eth0"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "profile", "NHRPVPN", "authentication", "mode", "pre-shared-secret"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "profile", "NHRPVPN", "authentication", "pre-shared-secret", "${nhrpSecret}"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "profile", "NHRPVPN", "bind", "tunnel", "tun100"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "profile", "NHRPVPN", "esp-group", "ESP-HUB"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "profile", "NHRPVPN", "ike-group", "IKE-HUB"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "local-as", "${localAs}"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "address-family", "ipv4-unicast", "maximum-paths", "ibgp", "4"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "address-family", "ipv4-unicast", "redistribute", "connected"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "listen", "range", "${tunnelBlock}", "peer-group", "evpn"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "parameters", "log-neighbor-changes"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "peer-group", "evpn", "address-family", "ipv4-unicast", "route-reflector-client"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "peer-group", "evpn", "address-family", "l2vpn-evpn", "route-reflector-client"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "peer-group", "evpn", "capability", "dynamic"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "peer-group", "evpn", "remote-as", "${remoteAs}"]}]`
  );
  encodedParams.set("key", `${keyApi}`);

  const url = `https://${tunnelSourceAdd}/configure`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodedParams,
    agent: httpsAgent,
  };

  try {
    const result = await fetch(url, options);
    const resultAsJson = await result.json();
    return resultAsJson;
  } catch (error) {
    return error.message || "unknown error, check call vyos function";
  }
}

async function configureVyosSpoke(
  invokeType,
  tunnelSourceAdd,
  tunnelAdd,
  keyApi,
  nhrpSecret,
  hubTunnel,
  hubManagement,
  localAs,
  remoteAs
) {
  let hubManagementStripMask = hubManagement.substr(
    0,
    hubManagement.indexOf("/")
  );
  let hubTunnelWithoutMask = hubTunnel.substr(0, hubTunnel.indexOf("/"));

  encodedParams.set(
    "data",
    `[{"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "address", "${tunnelAdd}"]},
  {"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "mtu", "8024"]},
  {"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "encapsulation", "gre"]},
  {"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "source-address", "${tunnelSourceAdd}"]},
  {"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "multicast", "enable"]},
  {"op": "${invokeType}", "path": ["interfaces", "tunnel", "tun100", "parameters", "ip", "key", "1"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "cisco-authentication", "${nhrpSecret}"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "holding-time", "${dmvpnParams.nhrpTunnelHoldingTime}"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "map", "${hubTunnel}", "nbma-address", "${hubManagementStripMask}"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "map", "${hubTunnel}", "register"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "multicast", "nhs"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "redirect"]},
  {"op": "${invokeType}", "path": ["protocols", "nhrp", "tunnel", "tun100", "shortcut"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "compression", "disable"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "lifetime", "${dmvpnParams.ipsecEspGroupLifetime}"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "mode", "transport"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "pfs", "dh-group2"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "proposal", "1", "encryption", "aes256"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "proposal", "1", "hash", "sha1"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "proposal", "2", "encryption", "3des"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "esp-group", "ESP-HUB", "proposal", "2", "hash", "md5"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "ikev2-reauth", "no"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "key-exchange", "ikev1"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "lifetime", "${dmvpnParams.ipsecIkeGroupLifetime}"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "1", "dh-group", "2"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "1", "encryption", "aes256"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "1", "hash", "sha1"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "2", "dh-group", "2"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "2", "encryption", "aes128"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ike-group", "IKE-HUB", "proposal", "2", "hash", "sha1"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "ipsec-interfaces", "interface", "eth0"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "profile", "NHRPVPN", "authentication", "mode", "pre-shared-secret"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "profile", "NHRPVPN", "authentication", "pre-shared-secret", "${nhrpSecret}"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "profile", "NHRPVPN", "bind", "tunnel", "tun100"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "profile", "NHRPVPN", "esp-group", "ESP-HUB"]},
  {"op": "${invokeType}", "path": ["vpn", "ipsec", "profile", "NHRPVPN", "ike-group", "IKE-HUB"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "local-as", "${localAs}"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "address-family", "ipv4-unicast", "maximum-paths", "ibgp", "4"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "address-family", "ipv4-unicast", "redistribute", "connected"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "address-family", "l2vpn-evpn", "advertise-all-vni"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "neighbor", "${hubTunnelWithoutMask}", "peer-group", "evpn"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "parameters", "log-neighbor-changes"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "peer-group", "evpn", "address-family", "ipv4-unicast", "nexthop-self"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "peer-group", "evpn", "address-family", "l2vpn-evpn", "nexthop-self"]},
  {"op": "${invokeType}", "path": ["protocols", "bgp", "peer-group", "evpn", "remote-as", "${remoteAs}"]}]`
  );
  encodedParams.set("key", `${keyApi}`);
  const url = `https://${tunnelSourceAdd}/configure`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodedParams,
    agent: httpsAgent,
  };
  try {
    const result = await fetch(url, options);
    const resultAsJson = await result.json();
    return resultAsJson;
  } catch (error) {
    return error.message || "unknown error, check call vyos function";
  }
}

// Associate and Deassociate
async function nodeToBridgeDomain(
  operation,
  managementIP,
  keyApi,
  vxlanId,
  tunnelAdd
) {
  if (operation === "set") {
    encodedParams.set(
      "data",
      `[{"op": "${operation}", "path": ["interfaces", "vxlan", "vxlan${vxlanId}"]},
{"op": "${operation}", "path": ["interfaces", "vxlan", "vxlan${vxlanId}", "parameters", "nolearning"]},
{"op": "${operation}", "path": ["interfaces", "vxlan", "vxlan${vxlanId}", "port", "4789"]},
{"op": "${operation}", "path": ["interfaces", "vxlan", "vxlan${vxlanId}", "source-address", "${tunnelAdd}"]},
{"op": "${operation}", "path": ["interfaces", "vxlan", "vxlan${vxlanId}", "vni", "${vxlanId}"]},
{"op": "${operation}", "path": ["interfaces", "bridge", "br${vxlanId}", "member", "interface", "vxlan${vxlanId}"]}]
  `
    );
  } else {
    encodedParams.set(
      "data",
      `[{"op": "${operation}", "path": ["interfaces", "vxlan", "vxlan${vxlanId}"]},
{"op": "${operation}", "path": ["interfaces", "vxlan", "vxlan${vxlanId}", "parameters", "nolearning"]},
{"op": "${operation}", "path": ["interfaces", "vxlan", "vxlan${vxlanId}", "port", "4789"]},
{"op": "${operation}", "path": ["interfaces", "vxlan", "vxlan${vxlanId}", "source-address", "${tunnelAdd}"]},
{"op": "${operation}", "path": ["interfaces", "vxlan", "vxlan${vxlanId}", "vni", "${vxlanId}"]},
{"op": "${operation}", "path": ["interfaces", "bridge", "br${vxlanId}", "member", "interface", "vxlan${vxlanId}"]},
{"op": "${operation}", "path": ["interfaces", "bridge", "br${vxlanId}"]}]
  `
    );
  }

  encodedParams.set("key", `${keyApi}`);
  const url = `https://${managementIP}/configure`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodedParams,
    agent: httpsAgent,
  };

  try {
    const result = await fetch(url, options);
    const resultAsJson = await result.json();
    return resultAsJson;
  } catch (error) {
    return error.message || "unknown error, check call vyos function";
  }
}

// Associate and Deassociate interface to vxlan
async function assocIntVxlan(
  operation,
  managementIP,
  keyApi,
  vxlanId,
  interface
) {
  encodedParams.set(
    "data",
    `{"op": "${operation}", "path": ["interfaces", "bridge", "br${vxlanId}", "member", "interface", "${interface}"]}`
  );

  encodedParams.set("key", `${keyApi}`);
  const url = `https://${managementIP}/configure`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodedParams,
    agent: httpsAgent,
  };

  try {
    const result = await fetch(url, options);
    const resultAsJson = await result.json();
    return resultAsJson;
  } catch (error) {
    return error.message || "unknown error, check call vyos function";
  }
}

async function saveConfigInit(managementIP, keyApi) {
  encodedParams.set(
    "data",
    `
    {"op": "save", "file": "/config/default-by-controller.config"}
    `
  );
  encodedParams.set("key", `${keyApi}`);
  const url = `https://${managementIP}/config-file`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodedParams,
    agent: httpsAgent,
  };
  try {
    const result = await fetch(url, options);
    const resultAsJson = await result.json();
    return resultAsJson;
  } catch (error) {
    return error.message || "unknown error, check call vyos function";
  }
}

async function loadConfigInit(managementIP, keyApi) {
  encodedParams.set(
    "data",
    `
    {"op": "load", "file": "/config/default-by-controller.config"}
    `
  );
  encodedParams.set("key", `${keyApi}`);
  const url = `https://${managementIP}/config-file`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodedParams,
    agent: httpsAgent,
  };
  try {
    const result = await fetch(url, options);
    const resultAsJson = await result.json();
    return resultAsJson;
  } catch (error) {
    return error.type || "unknown error, check call vyos function";
  }
}

// to get ethernet interface
async function getInterface(managementIP, keyApi) {
  encodedParams.set(
    "data",
    '{"op": "showConfig", "path": ["interfaces", "ethernet"]}'
  );
  encodedParams.set("key", `${keyApi}`);
  const url = `https://${managementIP}/retrieve`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodedParams,
    agent: httpsAgent,
  };
  try {
    const result = await fetch(url, options);
    const resultAsJson = await result.json();
    return resultAsJson;
  } catch (error) {
    return error.type || "unknown error, check call vyos function";
  }
}

exports.assocIntVxlan = assocIntVxlan;
exports.getInterface = getInterface;
exports.nodeToBridgeDomain = nodeToBridgeDomain;
exports.configureVyosHub = configureVyosHub;
exports.configureVyosSpoke = configureVyosSpoke;
exports.saveConfigInit = saveConfigInit;
exports.loadConfigInit = loadConfigInit;
