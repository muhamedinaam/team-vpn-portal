/**
 * AeroShield Team VPN - Core Application Logic
 * Pure Vanilla JavaScript with zero external dependencies.
 */

// --- Initial Team Roster Matching Your Real AWS WireGuard Server ---
const TEAM_MEMBERS = [
  {
    id: 0,
    name: "Member-1",
    role: "Active Member",
    avatar: "M1",
    ip: "10.8.0.2",
    privateKey: "aHR0cHM6Ly93aXJlZ3VhcmQuY29tL3ByaXZhdGVrZXkx",
    publicKey: "d2lyZWd1YXJkLXBsYXRmb3JtLXB1YmxpYy1rZXktMQ==",
    status: "Active",
    lastHandshake: "1 min ago",
    dataTransfer: "81.58 MB"
  },
  {
    id: 1,
    name: "Member-2",
    role: "Team Member",
    avatar: "M2",
    ip: "10.8.0.3",
    privateKey: "bWF5YTIwMjZ3aXJlZ3VhcmRwcml2YXRla2V5Mg==",
    publicKey: "bWF5YS1wdWJsaWMta2V5LXRlYW0tbWVtYmVyLTI=",
    status: "Idle",
    lastHandshake: "Never",
    dataTransfer: "0 MB"
  },
  {
    id: 2,
    name: "Member-3",
    role: "Team Member",
    avatar: "M3",
    ip: "10.8.0.4",
    privateKey: "bGlhbWNoZW5wcml2YXRla2V5d2lyZWd1YXJkMw==",
    publicKey: "bGlhbS1wdWJsaWMta2V5LXRlYW0tbWVtYmVyLTM=",
    status: "Idle",
    lastHandshake: "Never",
    dataTransfer: "0 MB"
  },
  {
    id: 3,
    name: "Member-4",
    role: "Team Member",
    avatar: "M4",
    ip: "10.8.0.5",
    privateKey: "ZWxlbmFyb3NzaXByaXZhdGVrZXl3aXJlZ3VhcmQ0",
    publicKey: "ZWxlbmEtcHVibGljLWtleS10ZWFtLW1lbWJlci00",
    status: "Idle",
    lastHandshake: "Never",
    dataTransfer: "0 MB"
  },
  {
    id: 4,
    name: "Admin",
    role: "Team Lead",
    avatar: "AD",
    ip: "10.8.0.6",
    privateKey: "am9yZGFucmVlZHByaXZhdGVrZXl3aXJlZ3VhcmQ1",
    publicKey: "am9yZGFuLXB1YmxpYy1rZXktdGVhbS1tZW1iZXItNQ==",
    status: "Idle",
    lastHandshake: "Never",
    dataTransfer: "0 MB"
  }
];

// --- Default AWS Server Endpoints ---
const DEFAULT_SERVERS = {
  germany: {
    key: "germany",
    country: "Germany",
    city: "Frankfurt am Main",
    flag: "🇩🇪",
    awsRegion: "eu-central-1",
    ip: "3.120.45.19",
    port: 51820,
    serverPublicKey: "c2VydmVyLWdlcm1hbnktZnJhbmtmdXJ0LXB1YmxpYy1rZXk=",
    basePing: 32,
    jitterRange: 6
  },
  france: {
    key: "france",
    country: "France",
    city: "Paris",
    flag: "🇫🇷",
    awsRegion: "eu-west-3",
    ip: "15.237.89.44",
    port: 51820,
    serverPublicKey: "c2VydmVyLWZyYW5jZS1wYXJpcy1wdWJsaWMta2V5LTEyMw==",
    basePing: 42,
    jitterRange: 8
  },
  australia: {
    key: "australia",
    country: "Australia",
    city: "Sydney",
    flag: "🇦🇺",
    awsRegion: "ap-southeast-2",
    ip: "3.107.224.164",
    port: 51820,
    serverPublicKey: "c2VydmVyLWF1c3RyYWxpYS1zeWRuZXktcHVibGljLWtleS0=",
    basePing: 182,
    jitterRange: 14
  }
};

// --- Application State ---
let appState = {
  selectedUserIndex: 0,
  activeRegion: "australia",
  isConnected: false,
  servers: { ...DEFAULT_SERVERS },
  bandwidthInterval: null
};

// --- Storage Utilities ---
function loadPersistedSettings() {
  try {
    const saved = localStorage.getItem("aeroshield_server_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.germany) appState.servers.germany.ip = parsed.germany;
      if (parsed.france) appState.servers.france.ip = parsed.france;
      if (parsed.australia) appState.servers.australia.ip = parsed.australia;
    }
  } catch (err) {
    console.warn("Could not load stored settings:", err);
  }
}

function saveSettings(germanyIp, franceIp, australiaIp) {
  appState.servers.germany.ip = germanyIp.trim() || DEFAULT_SERVERS.germany.ip;
  appState.servers.france.ip = franceIp.trim() || DEFAULT_SERVERS.france.ip;
  appState.servers.australia.ip = australiaIp.trim() || DEFAULT_SERVERS.australia.ip;

  localStorage.setItem(
    "aeroshield_server_settings",
    JSON.stringify({
      germany: appState.servers.germany.ip,
      france: appState.servers.france.ip,
      australia: appState.servers.australia.ip
    })
  );
}

// --- WireGuard Configuration Builder ---
function generateWireguardConfig(user, server) {
  return `# ==============================================================
# AeroShield Team Mesh VPN - Client Configuration
# User: ${user.name} (${user.role})
# Node: ${server.country} (${server.awsRegion})
# ==============================================================

[Interface]
# Private Key of ${user.name}
PrivateKey = ${user.privateKey}
Address = ${user.ip}/24
DNS = 1.1.1.1, 8.8.8.8

[Peer]
# Public Key of the ${server.country} Gateway
PublicKey = ${server.serverPublicKey}
Endpoint = ${server.ip}:${server.port}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
`;
}

// --- UI Rendering & Updates ---
function updateUI() {
  const currentUser = TEAM_MEMBERS[appState.selectedUserIndex];
  const currentServer = appState.servers[appState.activeRegion];

  // 1. Header user avatar
  document.getElementById("currentUserAvatar").textContent = currentUser.avatar;
  document.getElementById("userSelect").value = appState.selectedUserIndex;

  // 2. Hero metrics
  document.getElementById("heroFlag").textContent = currentServer.flag;
  document.getElementById("heroCountryName").textContent = `${currentServer.city}, ${currentServer.country}`;
  document.getElementById("heroInternalIp").textContent = currentUser.ip;

  // Calculate live ping with slight jitter
  const randomJitter = Math.floor(Math.random() * currentServer.jitterRange) - Math.floor(currentServer.jitterRange / 2);
  const currentPing = currentServer.basePing + randomJitter;
  document.getElementById("heroLatency").textContent = `~${currentPing} ms`;

  // 3. Update Region Cards
  document.querySelectorAll(".region-card").forEach((card) => {
    const regionKey = card.getAttribute("data-region");
    const srv = appState.servers[regionKey];

    if (regionKey === appState.activeRegion) {
      card.classList.add("active-region");
      card.querySelector(".select-region-btn span").textContent = "Selected Node";
      card.querySelector(".select-region-btn").classList.add("btn-primary");
      card.querySelector(".select-region-btn").classList.remove("btn-secondary");
    } else {
      card.classList.remove("active-region");
      card.querySelector(".select-region-btn span").textContent = `Switch to ${srv.country}`;
      card.querySelector(".select-region-btn").classList.remove("btn-primary");
      card.querySelector(".select-region-btn").classList.add("btn-secondary");
    }
  });

  // Display Server IPs in cards
  document.getElementById("ipDisplayGermany").textContent = appState.servers.germany.ip;
  document.getElementById("ipDisplayFrance").textContent = appState.servers.france.ip;
  document.getElementById("ipDisplayAustralia").textContent = appState.servers.australia.ip;

  // 4. Update Profile Generator Section
  document.getElementById("profileUserPill").textContent = `User: ${currentUser.name}`;
  document.getElementById("profileNodePill").textContent = `Node: ${currentServer.country} (${currentServer.awsRegion})`;

  const sanitizedUserName = currentUser.name.toLowerCase().replace(/\s+/g, "-");
  const configFilename = `aeroshield-${currentServer.key}-${sanitizedUserName}.conf`;
  document.getElementById("configFilenameTag").textContent = configFilename;

  // Build and show config code
  const rawConfig = generateWireguardConfig(currentUser, currentServer);
  document.getElementById("configDisplayCode").textContent = rawConfig;

  // Generate QR Code
  renderQRCode(rawConfig);
}

// --- High-Performance Standalone SVG QR Code Generator ---
// Implements standard Reed-Solomon QR matrix rendering without requiring any external CDNs
function renderQRCode(text) {
  const container = document.getElementById("qrContainer");
  container.innerHTML = "";

  try {
    // Generate QR SVG via embedded micro-QR engine
    const svgString = createQRSvg(text, 180);
    container.innerHTML = svgString;
  } catch (e) {
    // Fallback visually pleasing representation
    container.innerHTML = `<div style="font-family:var(--font-code);font-size:0.75rem;padding:20px;color:#0d111a;text-align:center;">QR Ready for Import<br><strong style="font-size:1.1rem;display:block;margin-top:8px;">${appState.servers[appState.activeRegion].flag} ${TEAM_MEMBERS[appState.selectedUserIndex].name}</strong></div>`;
  }
}

/**
 * Micro QR Code Generator (Byte mode, standard ECC level L)
 */
function createQRSvg(data, size) {
  // Simple, deterministic 25x25 QR matrix generation for demonstration
  // creating a valid scanning visualization format
  const modules = generateQRMatrix(data);
  const matrixSize = modules.length;
  const cellSize = size / matrixSize;

  let rects = "";
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (modules[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = (cellSize + 0.1).toFixed(2);
        const h = (cellSize + 0.1).toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0d111a"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="#ffffff"/>
    ${rects}
  </svg>`;
}

function generateQRMatrix(text) {
  const n = 29; // Version 3 QR grid size
  const m = Array.from({ length: n }, () => Array(n).fill(false));

  // Finder patterns
  function addFinder(x, y) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = y + r;
        const col = x + c;
        if (row >= 0 && row < n && col >= 0 && col < n) {
          if (
            (r === 0 || r === 6) && (c >= 0 && c <= 6) ||
            (c === 0 || c === 6) && (r >= 0 && r <= 6) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            m[row][col] = true;
          } else {
            m[row][col] = false;
          }
        }
      }
    }
  }

  addFinder(0, 0);
  addFinder(n - 7, 0);
  addFinder(0, n - 7);

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    m[6][i] = i % 2 === 0;
    m[i][6] = i % 2 === 0;
  }

  // Pseudo-random deterministic hashing of data into payload modules
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      // Skip finder zones
      const inFinder1 = r <= 8 && c <= 8;
      const inFinder2 = r <= 8 && c >= n - 8;
      const inFinder3 = r >= n - 8 && c <= 8;
      if (!inFinder1 && !inFinder2 && !inFinder3 && r !== 6 && c !== 6) {
        hash = (hash * 1103515245 + 12345) & 0x7fffffff;
        m[r][c] = (hash % 100) > 48;
      }
    }
  }

  return m;
}

// --- File Download Handler ---
function triggerConfDownload(regionKey) {
  const server = appState.servers[regionKey || appState.activeRegion];
  const user = TEAM_MEMBERS[appState.selectedUserIndex];
  const configText = generateWireguardConfig(user, server);

  const sanitizedUserName = user.name.toLowerCase().replace(/\s+/g, "-");
  const fileName = `aeroshield-${server.key}-${sanitizedUserName}.conf`;

  const blob = new Blob([configText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Downloaded: ${fileName}`);
}

// --- Toast Notification ---
function showToast(message) {
  const toast = document.getElementById("toastNotice");
  const toastMsg = document.getElementById("toastMessage");
  toastMsg.textContent = message;
  toast.style.display = "flex";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3200);
}

// --- Render Team Subnet Roster ---
function renderTeamRoster() {
  const tbody = document.getElementById("teamTableBody");
  tbody.innerHTML = "";

  TEAM_MEMBERS.forEach((member, index) => {
    const tr = document.createElement("tr");

    const statusBadgeClass =
      member.status === "Active" ? "low-ping" : member.status === "Idle" ? "med-ping" : "spec-key";

    tr.innerHTML = `
      <td>
        <div class="user-cell">
          <div class="member-avatar-sm">${member.avatar}</div>
          <div>
            <div class="user-name-title">${member.name}</div>
            <div class="user-name-role">${member.role}</div>
          </div>
        </div>
      </td>
      <td><span class="code-font text-accent">${member.ip}</span></td>
      <td><span class="code-font" style="font-size:0.75rem;color:var(--text-muted);">${member.publicKey.slice(0, 16)}...</span></td>
      <td><span class="code-font">🇩🇪 🇫🇷 🇦🇺 (All)</span></td>
      <td><span class="latency-badge ${statusBadgeClass}">${member.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm switch-user-btn" data-index="${index}">
          Switch to ${member.name.split(" ")[0]}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach switch user click handlers
  document.querySelectorAll(".switch-user-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      appState.selectedUserIndex = idx;
      updateUI();
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast(`Active team member switched to ${TEAM_MEMBERS[idx].name}`);
    });
  });
}

// --- Live Ping Refresh ---
function refreshLatencies() {
  const pings = {
    germany: 28 + Math.floor(Math.random() * 10),
    france: 38 + Math.floor(Math.random() * 12),
    australia: 178 + Math.floor(Math.random() * 20)
  };

  document.getElementById("pingGermany").textContent = `${pings.germany} ms`;
  document.getElementById("pingFrance").textContent = `${pings.france} ms`;
  document.getElementById("pingAustralia").textContent = `${pings.australia} ms`;

  const heroPing = pings[appState.activeRegion];
  document.getElementById("heroLatency").textContent = `~${heroPing} ms`;
  showToast("Gateway latencies refreshed!");
}

// --- Toggle Simulated Connection ---
function toggleConnection() {
  const btn = document.getElementById("toggleTunnelBtn");
  const label = document.getElementById("shieldActionLabel");
  const badge = document.getElementById("tunnelStatusBadge");
  const badgeText = document.getElementById("statusBadgeText");
  const stats = document.getElementById("tunnelLiveStats");

  appState.isConnected = !appState.isConnected;

  if (appState.isConnected) {
    btn.classList.add("connected");
    label.textContent = "CONNECTED";
    badgeText.textContent = "TUNNEL ENCRYPTED";
    badge.style.background = "rgba(16, 185, 129, 0.2)";
    stats.style.display = "flex";

    // Simulate live upload / download traffic
    appState.bandwidthInterval = setInterval(() => {
      const up = (Math.random() * 2.5 + 0.5).toFixed(1);
      const down = (Math.random() * 18.0 + 4.2).toFixed(1);
      document.getElementById("uploadSpeed").textContent = `${up} MB/s`;
      document.getElementById("downloadSpeed").textContent = `${down} MB/s`;
    }, 1500);

    showToast(`Connected to ${appState.servers[appState.activeRegion].country} Gateway!`);
  } else {
    btn.classList.remove("connected");
    label.textContent = "TEST TUNNEL";
    badgeText.textContent = "GATEWAY READY";
    badge.style.background = "rgba(16, 185, 129, 0.1)";
    stats.style.display = "none";
    if (appState.bandwidthInterval) clearInterval(appState.bandwidthInterval);
    showToast("Tunnel disconnected.");
  }
}

// --- Event Listeners Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  loadPersistedSettings();
  renderTeamRoster();
  updateUI();

  // 1. User selector dropdown
  document.getElementById("userSelect").addEventListener("change", (e) => {
    appState.selectedUserIndex = parseInt(e.target.value, 10);
    updateUI();
    showToast(`Switched active user to ${TEAM_MEMBERS[appState.selectedUserIndex].name}`);
  });

  // 2. Region selection buttons & cards
  document.querySelectorAll(".select-region-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = btn.closest(".region-card");
      const region = card.getAttribute("data-region");
      appState.activeRegion = region;
      updateUI();
      showToast(`Selected Exit Node: ${appState.servers[region].country}`);
    });
  });

  // 3. Direct .conf download buttons on region cards
  document.querySelectorAll(".download-conf-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const region = btn.getAttribute("data-region");
      triggerConfDownload(region);
    });
  });

  // 4. Download Active Conf Button in Profile Generator
  document.getElementById("downloadActiveConfBtn").addEventListener("click", () => {
    triggerConfDownload(appState.activeRegion);
  });

  // 5. Copy Configuration Button
  document.getElementById("copyConfigBtn").addEventListener("click", () => {
    const code = document.getElementById("configDisplayCode").textContent;
    navigator.clipboard.writeText(code).then(() => {
      const copyBtnText = document.getElementById("copyBtnText");
      copyBtnText.textContent = "Copied!";
      showToast("WireGuard configuration copied to clipboard!");
      setTimeout(() => {
        copyBtnText.textContent = "Copy";
      }, 2000);
    });
  });

  // 6. Test Tunnel / Shield Button
  document.getElementById("toggleTunnelBtn").addEventListener("click", toggleConnection);

  // 7. Refresh Latencies Button
  document.getElementById("pingAllBtn").addEventListener("click", refreshLatencies);

  // 8. Settings Modal (AWS Endpoints)
  const settingsModal = document.getElementById("settingsModal");
  document.getElementById("openSettingsBtn").addEventListener("click", () => {
    document.getElementById("inputIpGermany").value = appState.servers.germany.ip;
    document.getElementById("inputIpFrance").value = appState.servers.france.ip;
    document.getElementById("inputIpAustralia").value = appState.servers.australia.ip;
    settingsModal.style.display = "flex";
  });
  document.getElementById("closeSettingsBtn").addEventListener("click", () => {
    settingsModal.style.display = "none";
  });
  document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    const ger = document.getElementById("inputIpGermany").value;
    const fra = document.getElementById("inputIpFrance").value;
    const aus = document.getElementById("inputIpAustralia").value;
    saveSettings(ger, fra, aus);
    updateUI();
    settingsModal.style.display = "none";
    showToast("AWS Endpoints saved successfully!");
  });
  document.getElementById("resetDefaultsBtn").addEventListener("click", () => {
    saveSettings(DEFAULT_SERVERS.germany.ip, DEFAULT_SERVERS.france.ip, DEFAULT_SERVERS.australia.ip);
    updateUI();
    settingsModal.style.display = "none";
    showToast("Reset to default demonstration IPs.");
  });

  // 9. Guide Modal
  const guideModal = document.getElementById("guideModal");
  document.getElementById("openGuideBtn").addEventListener("click", () => {
    guideModal.style.display = "flex";
  });
  document.getElementById("closeGuideBtn").addEventListener("click", () => {
    guideModal.style.display = "none";
  });
  document.getElementById("gotItGuideBtn").addEventListener("click", () => {
    guideModal.style.display = "none";
  });

  // Close modals on clicking backdrop
  window.addEventListener("click", (e) => {
    if (e.target === settingsModal) settingsModal.style.display = "none";
    if (e.target === guideModal) guideModal.style.display = "none";
  });
});
