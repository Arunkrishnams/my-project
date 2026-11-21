/**
 * ProNest Prime - Core Application Logic
 * Zentro Prime - Core Application Logic
 * First Screen: Dedicated Login & Account Creation Gateway
 * Post-Login: Full Job & Property Portal + SuperAdmin Analytics
 */

let activeTab = "auth"; // Start on auth (login first)
let currentRentalCategory = "all";
let currentJobCategory = "all";
let authMode = "signin"; // 'signin' or 'register'

let jobsData = [...SAMPLE_JOBS];
let propertiesData = [...SAMPLE_PROPERTIES];
let loginLogsData = [];
let registeredUsersData = [];
let applicationsData = [];
let inquiriesData = [];
let adminActiveSubTab = "users"; // 'users', 'logs', 'apps', 'inquiries', 'analytics'

// Current Logged In User State
let currentUser = null;

// Chart.js instances
let trendChartInstance = null;
let roleChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  loadLoginLogs();
  loadRegisteredUsers();
  loadApplications();
  loadInquiries();
  initAuthGating();
  initNavigation();
  renderJobsList();
  renderPropertiesList();
  renderUnifiedProfile();
  initAffordabilityCalculator();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Load / Seed Login Logs
function loadLoginLogs() {
  const saved = localStorage.getItem("zentro_login_logs") || localStorage.getItem("pronest_login_logs");
  if (saved) {
    try {
      loginLogsData = JSON.parse(saved);
      // Ensure phone numbers exist in older seeded data
      loginLogsData = loginLogsData.map((l, idx) => ({
        ...l,
        phone: l.phone || (INITIAL_LOGIN_LOGS[idx % INITIAL_LOGIN_LOGS.length]?.phone || "+91 98471 20491")
      }));
    } catch (e) {
      loginLogsData = [...INITIAL_LOGIN_LOGS];
    }
  } else {
    loginLogsData = [...INITIAL_LOGIN_LOGS];
    saveLoginLogs();
  }
}

function saveLoginLogs() {
  localStorage.setItem("zentro_login_logs", JSON.stringify(loginLogsData));
}

function loadRegisteredUsers() {
  const saved = localStorage.getItem("zentro_registered_users") || localStorage.getItem("pronest_registered_users");
  if (saved) {
    try {
      registeredUsersData = JSON.parse(saved);
      if (!Array.isArray(registeredUsersData) || registeredUsersData.length === 0) {
        registeredUsersData = [...INITIAL_REGISTERED_USERS];
        saveRegisteredUsers();
      }
    } catch (e) {
      registeredUsersData = [...INITIAL_REGISTERED_USERS];
      saveRegisteredUsers();
    }
  } else {
    registeredUsersData = [...INITIAL_REGISTERED_USERS];
    saveRegisteredUsers();
  }
}

function saveRegisteredUsers() {
  localStorage.setItem("zentro_registered_users", JSON.stringify(registeredUsersData));
}

function loadApplications() {
  const saved = localStorage.getItem("zentro_job_applications");
  if (saved) {
    try {
      applicationsData = JSON.parse(saved);
      if (!Array.isArray(applicationsData) || applicationsData.length === 0) {
        applicationsData = [...INITIAL_APPLICATIONS];
        saveApplications();
      }
    } catch (e) {
      applicationsData = [...INITIAL_APPLICATIONS];
      saveApplications();
    }
  } else {
    applicationsData = [...INITIAL_APPLICATIONS];
    saveApplications();
  }
}

function saveApplications() {
  localStorage.setItem("zentro_job_applications", JSON.stringify(applicationsData));
}

function loadInquiries() {
  const saved = localStorage.getItem("zentro_property_inquiries");
  if (saved) {
    try {
      inquiriesData = JSON.parse(saved);
      if (!Array.isArray(inquiriesData) || inquiriesData.length === 0) {
        inquiriesData = [...INITIAL_INQUIRIES];
        saveInquiries();
      }
    } catch (e) {
      inquiriesData = [...INITIAL_INQUIRIES];
      saveInquiries();
    }
  } else {
    inquiriesData = [...INITIAL_INQUIRIES];
    saveInquiries();
  }
}

function saveInquiries() {
  localStorage.setItem("zentro_property_inquiries", JSON.stringify(inquiriesData));
}

// Check session & initialize full portal
// Strictly enforce: ALWAYS show Login Page First on every visit / reload!
function initAuthGating() {
  // Clear any existing session so every page reload starts on the Login Gateway first
  sessionStorage.removeItem("zentro_logged_in");
  currentUser = null;
  showAuthFirstScreen("signin");
}

function showAuthFirstScreen(mode = "signin") {
  currentUser = null;
  activeTab = "auth";

  // Hide inner portal sections
  document.getElementById("main-portal-nav")?.classList.add("hidden");
  document.getElementById("main-hero-section")?.classList.add("hidden");
  document.getElementById("main-content-section")?.classList.add("hidden");
  document.getElementById("main-portal-footer")?.classList.add("hidden");

  // Show Auth Screen
  const authScreen = document.getElementById("view-auth");
  if (authScreen) {
    authScreen.classList.remove("hidden");
  }

  toggleAuthMode(mode);
  setLoginTab("candidate");

  window.scrollTo({ top: 0, behavior: "smooth" });
  if (window.lucide) window.lucide.createIcons();
}

function unlockPortal() {
  // Hide Auth Screen
  document.getElementById("view-auth")?.classList.add("hidden");

  // Show Inner Main Portal
  document.getElementById("main-portal-nav")?.classList.remove("hidden");
  document.getElementById("main-hero-section")?.classList.remove("hidden");
  document.getElementById("main-content-section")?.classList.remove("hidden");
  document.getElementById("main-portal-footer")?.classList.remove("hidden");

  updateUserNavbar();

  if (currentUser && currentUser.role === "SuperAdmin") {
    switchView("admin");
  } else if (currentUser && currentUser.role === "Landlord") {
    switchCategory("all");
    switchView("properties");
  } else {
    switchView("jobs");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  if (window.lucide) window.lucide.createIcons();
}

// Navigation Pill Switcher (Within Main Portal)
function initNavigation() {
  const tabs = document.querySelectorAll(".nav-pill-btn");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      switchView(target);
    });
  });
}

function switchView(tabId) {
  if (tabId === "auth") {
    showAuthFirstScreen("signin");
    return;
  }

  activeTab = tabId;
  document.querySelectorAll(".nav-pill-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.target === tabId);
  });

  document.querySelectorAll(".portal-view").forEach(v => {
    v.classList.add("hidden");
  });

  const activeElem = document.getElementById(`view-${tabId}`);
  if (activeElem) {
    activeElem.classList.remove("hidden");
  }

  if (tabId === "admin") {
    renderAdminDashboard();
  }

  if (tabId === "jobs" || tabId === "properties") {
    activeElem?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ==========================================
// LOGIN & REGISTRATION LOGIC
// ==========================================

function toggleAuthMode(mode) {
  authMode = mode;
  const btnSignin = document.getElementById("auth-mode-signin");
  const btnRegister = document.getElementById("auth-mode-register");
  const formSignin = document.getElementById("auth-form-signin");
  const formRegister = document.getElementById("auth-form-register");
  const demoSection = document.getElementById("auth-demo-section");
  const headerSubtitle = document.getElementById("login-header-subtitle");

  if (mode === "register") {
    if (btnRegister) btnRegister.className = "w-1/2 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 transition shadow-md";
    if (btnSignin) btnSignin.className = "w-1/2 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white transition";
    formRegister?.classList.remove("hidden");
    formSignin?.classList.add("hidden");
    demoSection?.classList.add("hidden");
    if (headerSubtitle) headerSubtitle.innerText = "Create Your Free ProNest Account";
    if (headerSubtitle) headerSubtitle.innerText = "Create Your Free Zentro Account";
  } else {
    if (btnSignin) btnSignin.className = "w-1/2 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-slate-950 transition shadow-md";
    if (btnRegister) btnRegister.className = "w-1/2 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white transition";
    formSignin?.classList.remove("hidden");
    formRegister?.classList.add("hidden");
    demoSection?.classList.remove("hidden");
    if (headerSubtitle) headerSubtitle.innerText = "Sign In to Access Jobs & Rentals";
  }
}

function setLoginTab(tab) {
  const btnCandidate = document.getElementById("login-tab-candidate");
  const btnLandlord = document.getElementById("login-tab-landlord");
  const btnAdmin = document.getElementById("login-tab-admin");
  const emailInput = document.getElementById("login-email");
  const pwdInput = document.getElementById("login-password");

  [btnCandidate, btnLandlord, btnAdmin].forEach(b => {
    if (b) b.className = "px-3 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white transition";
  });

  if (tab === "admin") {
    if (btnAdmin) btnAdmin.className = "px-3 py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-950 shadow-md transition";
    if (emailInput) emailInput.value = "admin@zentro.com";
    if (pwdInput) pwdInput.value = "admin";
  } else if (tab === "landlord") {
    if (btnLandlord) btnLandlord.className = "px-3 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 shadow-md transition";
    if (emailInput) emailInput.value = "sunil.varma@primepg.in";
    if (pwdInput) pwdInput.value = "password123";
  } else {
    if (btnCandidate) btnCandidate.className = "px-3 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-slate-950 shadow-md transition";
    if (emailInput) emailInput.value = "arjun.nair@techlead.io";
    if (pwdInput) pwdInput.value = "password123";
  }
}

function handleLoginSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const inputVal = (document.getElementById("login-email")?.value || "").trim();
  const password = document.getElementById("login-password")?.value || "";

  const cleanInput = inputVal.replace(/\s+/g, '');
  const cleanAdminPhone = (ADMIN_CREDENTIALS.phone || "+919800000001").replace(/\s+/g, '');

  // 1. SuperAdmin Login
  if (
    (inputVal.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() ||
      cleanInput === cleanAdminPhone ||
      inputVal.toLowerCase() === "admin") &&
    password === ADMIN_CREDENTIALS.password
  ) {
    currentUser = {
      name: "Master Administrator",
      email: ADMIN_CREDENTIALS.email,
      phone: ADMIN_CREDENTIALS.phone || "+91 98000 00001",
      role: "SuperAdmin",
      hub: "Admin Console (HQ)",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
    };

    recordLoginEvent("Master Administrator", currentUser.email, currentUser.phone, "SuperAdmin", "Admin Console (HQ)", "Success");
    sessionStorage.setItem("zentro_logged_in", "true");
    localStorage.setItem("zentro_current_user", JSON.stringify(currentUser));
    unlockPortal();
    switchView("admin");
    if (window.confetti) window.confetti({ particleCount: 90, spread: 80 });
    showToast("👑 Welcome SuperAdmin! Admin Analytics & Users Console unlocked.");
    return;
  }

  // 2. Newly Registered Users (Match by Email or Phone)
  const registeredMatch = registeredUsersData.find(u =>
    u.email.toLowerCase() === inputVal.toLowerCase() ||
    (u.phone && u.phone.replace(/\s+/g, '') === cleanInput)
  );
  if (registeredMatch) {
    currentUser = registeredMatch;
    recordLoginEvent(registeredMatch.name, registeredMatch.email, registeredMatch.phone || "+91 98471 20491", registeredMatch.role, registeredMatch.hub || "Kerala Hub", "Success");
    sessionStorage.setItem("zentro_logged_in", "true");
    localStorage.setItem("zentro_current_user", JSON.stringify(currentUser));
    unlockPortal();
    showToast(`✨ Welcome back, ${registeredMatch.name}!`);
    return;
  }

  // 3. Demo Landlord Login
  if (inputVal.includes("varma") || inputVal.includes("landlord") || cleanInput === "+919846144521" || cleanInput === "9846144521") {
    currentUser = {
      name: "Sunil Varma",
      email: "sunil.varma@primepg.in",
      phone: "+91 98461 44521",
      role: "Landlord",
      hub: "Kochi (Kakkanad)",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
    };
    recordLoginEvent("Sunil Varma", currentUser.email, currentUser.phone, "Landlord", "Kochi (Kakkanad)", "Success");
    sessionStorage.setItem("zentro_logged_in", "true");
    localStorage.setItem("zentro_current_user", JSON.stringify(currentUser));
    unlockPortal();
    showToast("🏡 Logged in as Landlord Sunil Varma!");
    return;
  }

  // 4. Default Candidate Login
  const candidateName = inputVal.includes("@") ? inputVal.split('@')[0].replace('.', ' ').toUpperCase() : "Candidate";
  const userPhone = inputVal.match(/^[0-9+ ]+$/) ? inputVal : "+91 98471 20491";
  const userEmail = inputVal.includes("@") ? inputVal : "candidate@zentro.com";

  currentUser = {
    name: candidateName || "Job Seeker",
    email: userEmail,
    phone: userPhone,
    role: "Candidate",
    hub: "Kerala Tech Corridor",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
  };
  recordLoginEvent(currentUser.name, currentUser.email, currentUser.phone, "Candidate", "Kerala Tech Corridor", "Success");
  sessionStorage.setItem("zentro_logged_in", "true");
  localStorage.setItem("zentro_current_user", JSON.stringify(currentUser));
  unlockPortal();
  showToast(`💼 Welcome back, ${currentUser.name}!`);
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("reg-name").value.trim();
  const phoneRaw = document.getElementById("reg-phone").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const role = document.getElementById("reg-role").value;
  const hub = document.getElementById("reg-hub").value;

  if (!name || !email || !password || !phoneRaw) {
    showToast("Please fill in all registration fields including Phone Number.");
    return;
  }

  const cleanPhone = phoneRaw.startsWith("+") ? phoneRaw : `+91 ${phoneRaw.replace(/^\+?91/, '').trim()}`;

  const avatarImages = {
    Candidate: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    Landlord: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    Employer: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80"
  };

  const newUser = {
    id: `usr-${Date.now()}`,
    name: name,
    email: email,
    phone: cleanPhone,
    role: role,
    hub: hub,
    avatar: avatarImages[role] || avatarImages.Candidate,
    createdAt: new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }),
    status: "Active Verified",
    headline: `${role} - ${hub}`,
    applicationsCount: 0,
    savedRentalsCount: 0,
    ipAddress: "117.218.42.19",
    device: navigator.userAgent.includes("Windows") ? "Chrome / Windows 11" : "Mobile Browser",
    verificationScore: "95% (Phone & OTP Confirmed)"
  };

  registeredUsersData.unshift(newUser);
  saveRegisteredUsers();

  currentUser = newUser;
  sessionStorage.setItem("zentro_logged_in", "true");
  localStorage.setItem("zentro_current_user", JSON.stringify(currentUser));

  recordLoginEvent(name, email, cleanPhone, role, hub, "New Account Created & Logged In");
  unlockPortal();

  if (window.confetti) {
    window.confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
  }

  showToast(`🎉 Account Created! Welcome to Zentro, ${name}. Phone: ${cleanPhone}`);
}

function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem("zentro_logged_in");
  localStorage.removeItem("zentro_current_user");
  localStorage.removeItem("pronest_current_user");
  showAuthFirstScreen("signin");
  showToast("Logged out. Please sign in to continue.");
}

function continueAsGuest() {
  currentUser = {
    name: "Guest Explorer",
    email: "guest@zentro.io",
    phone: "+91 99999 00000",
    role: "Candidate",
    hub: "Kerala Corridor",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
  };
  recordLoginEvent("Guest Explorer", "guest@zentro.io", "+91 99999 00000", "Candidate", "Kerala Corridor", "Guest Access");
  sessionStorage.setItem("zentro_logged_in", "true");
  unlockPortal();
  showToast("👀 Exploring Zentro Prime in Guest Mode!");
}

function updateUserNavbar() {
  const userPill = document.getElementById("navbar-user-section");
  if (!userPill) return;

  if (currentUser) {
    const isAdmin = currentUser.role === "SuperAdmin";
    userPill.innerHTML = `
      <div class="flex items-center gap-2">
        ${isAdmin ? `
          <button onclick="switchView('admin')" class="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition">
            <i data-lucide="line-chart" class="w-3.5 h-3.5"></i> Admin Console
          </button>
        ` : ''}

        <button onclick="switchView('profile')" class="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition">
          <img src="${currentUser.avatar}" class="w-8 h-8 rounded-xl object-cover border ${isAdmin ? 'border-amber-400' : 'border-cyan-400'}">
          <div class="text-left hidden sm:block">
            <span class="text-xs font-bold text-white block leading-tight">${currentUser.name}</span>
            <span class="text-[10px] ${isAdmin ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'} flex items-center gap-0.5">
              ${isAdmin ? '👑 SuperAdmin' : '✓ ' + currentUser.role}
            </span>
          </div>
        </button>

        <button onclick="handleLogout()" title="Step 4: Sign Out & Return to Login Screen" class="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-bold transition flex items-center gap-1.5 text-xs shadow-sm">
          <i data-lucide="log-out" class="w-3.5 h-3.5 text-rose-400"></i>
          <span class="text-[11px]">Logout</span>
        </button>
      </div>
    `;
  } else {
    userPill.innerHTML = `
      <button onclick="showAuthFirstScreen('signin')" class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5">
        <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
        <span>Sign In</span>
      </button>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

function recordLoginEvent(userName, email, phone, role, hub, status = "Success") {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

  const newLog = {
    id: `log-${Date.now()}`,
    userName: userName,
    email: email,
    phone: phone || "+91 98471 20491",
    role: role,
    hub: hub || "Kerala Hub",
    device: navigator.userAgent.includes("Windows") ? "Chrome / Windows 11" : "Mobile / Android",
    ipAddress: `117.218.${Math.floor(10 + Math.random() * 80)}.${Math.floor(10 + Math.random() * 80)}`,
    timestamp: `${dateString}, ${timeString}`,
    timeAgo: "Just now",
    status: status
  };

  loginLogsData.unshift(newLog);
  saveLoginLogs();

  if (activeTab === "admin") {
    renderAdminDashboard();
  }
}

// ==========================================
// ==========================================
// ADMIN DASHBOARD, ALL DETAILS & DIRECTORY
// ==========================================

function switchAdminTab(tab) {
  adminActiveSubTab = tab;
  renderAdminDashboard();
}

function renderAdminDashboard() {
  const container = document.getElementById("admin-dashboard-container");
  if (!container) return;

  const totalLogins = loginLogsData.length;
  const totalUsers = registeredUsersData.length;
  const totalApps = applicationsData.length;
  const totalInquiries = inquiriesData.length;

  container.innerHTML = `
    <!-- Top Live Status Header -->
    <div class="glass-card rounded-2xl p-6 mb-6 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span class="text-xs font-bold uppercase tracking-wider text-amber-400">👑 Zentro SuperAdmin Command Center</span>
          <span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
            Live Gateway Active
          </span>
        </div>
        <h2 class="text-xl sm:text-2xl font-black text-white">Platform Intelligence & All Records Portal</h2>
        <p class="text-xs text-slate-400">Manage all registered users, mobile contacts, login audits, job applications and rental tour bookings</p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button onclick="recordMockLogin()" class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Simulate Live Login
        </button>
        <button onclick="exportUsersCSV()" class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
          <i data-lucide="users" class="w-3.5 h-3.5"></i> Export Users CSV
        </button>
        <button onclick="exportLoginLogsCSV()" class="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
          <i data-lucide="download" class="w-3.5 h-3.5"></i> Export Audit CSV
        </button>
      </div>
    </div>

    <!-- 4 High-Impact KPI Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div onclick="switchAdminTab('users')" class="glass-card rounded-2xl p-5 border-l-4 border-l-cyan-400 cursor-pointer hover:border-cyan-400/80 transition">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registered Members</span>
          <i data-lucide="users" class="w-4 h-4 text-cyan-400"></i>
        </div>
        <div class="text-3xl font-black text-white my-1">${totalUsers} Users</div>
        <p class="text-[11px] text-cyan-300 font-semibold flex items-center gap-1">
          <span>📞 100% Phone Verified Contacts</span>
        </p>
      </div>

      <div onclick="switchAdminTab('logs')" class="glass-card rounded-2xl p-5 border-l-4 border-l-amber-400 cursor-pointer hover:border-amber-400/80 transition">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Login Audit Trail</span>
          <i data-lucide="shield-check" class="w-4 h-4 text-amber-400"></i>
        </div>
        <div class="text-3xl font-black text-amber-400 my-1">${totalLogins * 14 + 182}</div>
        <p class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
          <i data-lucide="trending-up" class="w-3 h-3"></i> 99.2% Security Score
        </p>
      </div>

      <div onclick="switchAdminTab('apps')" class="glass-card rounded-2xl p-5 border-l-4 border-l-emerald-400 cursor-pointer hover:border-emerald-400/80 transition">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Job Applications</span>
          <i data-lucide="briefcase" class="w-4 h-4 text-emerald-400"></i>
        </div>
        <div class="text-3xl font-black text-emerald-400 my-1">${totalApps} Submissions</div>
        <p class="text-[11px] text-slate-400">${jobsData.length} Live Openings Across Hubs</p>
      </div>

      <div onclick="switchAdminTab('inquiries')" class="glass-card rounded-2xl p-5 border-l-4 border-l-purple-400 cursor-pointer hover:border-purple-400/80 transition">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rental Inquiries</span>
          <i data-lucide="home" class="w-4 h-4 text-purple-400"></i>
        </div>
        <div class="text-3xl font-black text-purple-400 my-1">${totalInquiries} Tours</div>
        <p class="text-[11px] text-slate-400">${propertiesData.length} Verified Houses, Flats & Rooms</p>
      </div>
    </div>

    <!-- Admin Sub-Navigation Tabs Bar -->
    <div class="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl mb-6 border border-slate-800">
      <button onclick="switchAdminTab('users')" class="px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${adminActiveSubTab === 'users' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}">
        <i data-lucide="users" class="w-3.5 h-3.5"></i>
        <span>👥 All Registered Users (${totalUsers})</span>
      </button>
      <button onclick="switchAdminTab('logs')" class="px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${adminActiveSubTab === 'logs' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}">
        <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
        <span>🔒 Login Audit Logs (${totalLogins})</span>
      </button>
      <button onclick="switchAdminTab('apps')" class="px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${adminActiveSubTab === 'apps' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}">
        <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
        <span>💼 Candidate Applications (${totalApps})</span>
      </button>
      <button onclick="switchAdminTab('inquiries')" class="px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${adminActiveSubTab === 'inquiries' ? 'bg-purple-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}">
        <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
        <span>🏠 Rental Tour Bookings (${totalInquiries})</span>
      </button>
      <button onclick="switchAdminTab('analytics')" class="px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${adminActiveSubTab === 'analytics' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
        <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i>
        <span>📊 Traffic & Role Analytics</span>
      </button>
    </div>

    <!-- Active Tab Dynamic Content Container -->
    <div id="admin-subtab-view">
      ${renderAdminSubTabContent()}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
  if (adminActiveSubTab === 'analytics') {
    initAdminCharts();
  }
}

function renderAdminSubTabContent() {
  if (adminActiveSubTab === "users") {
    return `
      <div class="glass-card rounded-2xl p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i data-lucide="users" class="w-4 h-4 text-cyan-400"></i>
              <span>All Registered Members & Contact Directory</span>
            </h3>
            <p class="text-[11px] text-slate-400">View complete candidate and landlord user profiles, mobile phone numbers, email addresses and tech hubs</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input type="text" id="admin-universal-search" oninput="filterAdminData()" placeholder="Filter by Name, Phone (+91...), Email, Hub..." class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 w-64">
            <select id="admin-role-filter" onchange="filterAdminData()" class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <option value="all">All Roles</option>
              <option value="Candidate">Candidate</option>
              <option value="Landlord">Landlord</option>
              <option value="Employer">Employer</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Member Name & ID</th>
                <th class="py-3 px-4">Role</th>
                <th class="py-3 px-4">📞 Phone Number</th>
                <th class="py-3 px-4">✉️ Email Address</th>
                <th class="py-3 px-4">Preferred Hub</th>
                <th class="py-3 px-4">Joined Date</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">All Details</th>
              </tr>
            </thead>
            <tbody id="admin-data-tbody" class="divide-y divide-slate-800/60 font-sans">
              ${renderUserRows(registeredUsersData)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (adminActiveSubTab === "logs") {
    return `
      <div class="glass-card rounded-2xl p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i data-lucide="shield-alert" class="w-4 h-4 text-amber-400"></i>
              <span>Real-Time Login Audit Logs</span>
            </h3>
            <p class="text-[11px] text-slate-400">Detailed security log of user device, IP address, corridor location, mobile contact and timestamp</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input type="text" id="admin-universal-search" oninput="filterAdminData()" placeholder="Filter logs by Name, Phone, IP..." class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 w-64">
            <select id="admin-role-filter" onchange="filterAdminData()" class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <option value="all">All Roles</option>
              <option value="Candidate">Candidate</option>
              <option value="Landlord">Landlord</option>
              <option value="Employer">Employer</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">User & Role</th>
                <th class="py-3 px-4">📞 Contact (Phone & Email)</th>
                <th class="py-3 px-4">Tech Hub / Location</th>
                <th class="py-3 px-4">Device & Browser</th>
                <th class="py-3 px-4">IP Address</th>
                <th class="py-3 px-4">Timestamp</th>
                <th class="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody id="admin-data-tbody" class="divide-y divide-slate-800/60 font-mono">
              ${renderLogRows(loginLogsData)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (adminActiveSubTab === "apps") {
    return `
      <div class="glass-card rounded-2xl p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i data-lucide="briefcase" class="w-4 h-4 text-emerald-400"></i>
              <span>Candidate Job Applications Tracker</span>
            </h3>
            <p class="text-[11px] text-slate-400">Candidate resumes and contact info submitted to Infopark, Technopark & Bangalore tech companies</p>
          </div>

          <input type="text" id="admin-universal-search" oninput="filterAdminData()" placeholder="Filter applications by Candidate or Company..." class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 w-64">
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Candidate Applicant</th>
                <th class="py-3 px-4">📞 Candidate Phone & Email</th>
                <th class="py-3 px-4">Target Job Role</th>
                <th class="py-3 px-4">Hiring Company & Hub</th>
                <th class="py-3 px-4">Note to Recruiter</th>
                <th class="py-3 px-4">Submitted Date</th>
                <th class="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody id="admin-data-tbody" class="divide-y divide-slate-800/60 font-sans">
              ${renderApplicationRows(applicationsData)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (adminActiveSubTab === "inquiries") {
    return `
      <div class="glass-card rounded-2xl p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i data-lucide="home" class="w-4 h-4 text-purple-400"></i>
              <span>Rental Viewing Tours & Property Inquiries</span>
            </h3>
            <p class="text-[11px] text-slate-400">Bookings for single rooms, flats and independent houses across Kerala corridors</p>
          </div>

          <input type="text" id="admin-universal-search" oninput="filterAdminData()" placeholder="Filter bookings by Tenant, Property or Owner..." class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400 w-64">
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Tenant Applicant</th>
                <th class="py-3 px-4">📞 Tenant Phone</th>
                <th class="py-3 px-4">Rental Property</th>
                <th class="py-3 px-4">Monthly Rent</th>
                <th class="py-3 px-4">Property Owner & Phone</th>
                <th class="py-3 px-4">Tour Date & Mode</th>
                <th class="py-3 px-4 text-right">Booking Status</th>
              </tr>
            </thead>
            <tbody id="admin-data-tbody" class="divide-y divide-slate-800/60 font-sans">
              ${renderInquiryRows(inquiriesData)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Analytics subtab
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Chart 1: 7-Day Login Volume Trend -->
      <div class="lg:col-span-8 glass-card rounded-2xl p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i data-lucide="activity" class="w-4 h-4 text-cyan-400"></i>
              <span>Daily User Login Activity & Traffic Pattern</span>
            </h3>
            <p class="text-[11px] text-slate-400">Peak login frequency between 08:30 AM – 11:30 AM (commute & work hours)</p>
          </div>
          <span class="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2.5 py-1 rounded-full font-bold">
            Live Stream
          </span>
        </div>
        <div class="h-64 relative">
          <canvas id="admin-trend-chart"></canvas>
        </div>
      </div>

      <!-- Chart 2: User Role Share -->
      <div class="lg:col-span-4 glass-card rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <i data-lucide="pie-chart" class="w-4 h-4 text-amber-400"></i>
            <span>Login Share by User Role</span>
          </h3>
          <p class="text-[11px] text-slate-400 mb-4">Job Seekers vs Landlords vs Recruiters</p>
          <div class="h-48 relative flex items-center justify-center">
            <canvas id="admin-role-chart"></canvas>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-800 text-[11px]">
          <div>
            <span class="text-cyan-400 font-black block">62%</span>
            <span class="text-slate-500">Candidates</span>
          </div>
          <div>
            <span class="text-emerald-400 font-black block">26%</span>
            <span class="text-slate-500">Landlords</span>
          </div>
          <div>
            <span class="text-purple-400 font-black block">12%</span>
            <span class="text-slate-500">Recruiters</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderUserRows(users) {
  if (!users || users.length === 0) {
    return `<tr><td colspan="8" class="text-center py-8 text-slate-500">No members found matching filter criteria.</td></tr>`;
  }

  return users.map(u => {
    const roleBadge = u.role === "Candidate"
      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
      : (u.role === "Landlord"
        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
        : 'bg-amber-950 text-amber-300 border-amber-800');

    const cleanDigits = (u.phone || "").replace(/[^0-9]/g, '');

    return `
      <tr class="hover:bg-slate-900/50 transition">
        <td class="py-3 px-4">
          <div class="flex items-center gap-2.5">
            <img src="${u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}" class="w-8 h-8 rounded-xl object-cover border border-slate-700">
            <div>
              <span class="font-bold text-white block leading-tight">${u.name}</span>
              <span class="text-[10px] text-slate-500 font-mono">${u.id}</span>
            </div>
          </div>
        </td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${roleBadge}">${u.role}</span>
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-1.5">
            <a href="tel:${cleanDigits}" class="text-cyan-400 font-mono font-bold hover:underline">${u.phone || '+91 98471 20491'}</a>
            ${cleanDigits ? `
              <a href="https://wa.me/${cleanDigits}" target="_blank" title="WhatsApp Message" class="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[9px] font-black border border-emerald-800 hover:bg-emerald-900 transition">
                WA
              </a>
            ` : ''}
          </div>
        </td>
        <td class="py-3 px-4 text-slate-300 font-mono text-[11px]">${u.email}</td>
        <td class="py-3 px-4 text-slate-300 text-xs">${u.hub}</td>
        <td class="py-3 px-4 text-slate-400 text-[11px]">${u.createdAt || 'Nov 2026'}</td>
        <td class="py-3 px-4">
          <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <span class="small-light-dot small-light-emerald"></span>
            <span>${u.status || 'Active Verified'}</span>
          </span>
        </td>
        <td class="py-3 px-4 text-right">
          <button onclick="openAdminUserDetails('${u.id}')" class="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 shadow-sm">
            <span>👁️ All Details</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderLogRows(logs) {
  if (!logs || logs.length === 0) {
    return `<tr><td colspan="7" class="text-center py-8 text-slate-500">No logs found matching filter criteria.</td></tr>`;
  }

  return logs.map(log => {
    const isSuccess = log.status.includes("Success") || log.status.includes("Created") || log.status.includes("Guest");
    const roleBadge = log.role === "Candidate"
      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
      : (log.role === "Landlord"
        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
        : 'bg-amber-950 text-amber-300 border-amber-800');

    return `
      <tr class="hover:bg-slate-900/50 transition">
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <span class="font-bold text-white font-sans">${log.userName}</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-bold border ${roleBadge}">${log.role}</span>
          </div>
        </td>
        <td class="py-3 px-4">
          <div class="text-[11px]">
            <span class="text-cyan-400 font-bold font-mono block">${log.phone || '+91 98471 20491'}</span>
            <span class="text-slate-400 font-mono text-[10px]">${log.email}</span>
          </div>
        </td>
        <td class="py-3 px-4 font-sans text-slate-300">${log.hub}</td>
        <td class="py-3 px-4 text-slate-400">${log.device}</td>
        <td class="py-3 px-4 text-slate-400">${log.ipAddress}</td>
        <td class="py-3 px-4 text-slate-300">${log.timestamp}</td>
        <td class="py-3 px-4 text-right">
          <span class="inline-flex items-center gap-1 text-[11px] font-bold ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}">
            ${isSuccess ? '✓ ' + log.status : '✕ ' + log.status}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderApplicationRows(apps) {
  if (!apps || apps.length === 0) {
    return `<tr><td colspan="7" class="text-center py-8 text-slate-500">No candidate job applications recorded yet.</td></tr>`;
  }

  return apps.map(app => `
    <tr class="hover:bg-slate-900/50 transition">
      <td class="py-3 px-4 font-bold text-white">${app.applicantName}</td>
      <td class="py-3 px-4">
        <span class="text-cyan-400 font-bold font-mono block text-xs">${app.applicantPhone || '+91 98471 20491'}</span>
        <span class="text-slate-400 text-[11px]">${app.applicantEmail}</span>
      </td>
      <td class="py-3 px-4 font-semibold text-slate-200">${app.jobTitle}</td>
      <td class="py-3 px-4 text-slate-300">${app.company} (${app.hub || 'Kerala Hub'})</td>
      <td class="py-3 px-4 text-slate-400 italic text-[11px]">${app.note || 'Ready for immediate joining'}</td>
      <td class="py-3 px-4 text-slate-400 text-[11px]">${app.date}</td>
      <td class="py-3 px-4 text-right">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
          ${app.status || 'Under Review'}
        </span>
      </td>
    </tr>
  `).join('');
}

function renderInquiryRows(inquiries) {
  if (!inquiries || inquiries.length === 0) {
    return `<tr><td colspan="7" class="text-center py-8 text-slate-500">No rental tour inquiries recorded yet.</td></tr>`;
  }

  return inquiries.map(inq => `
    <tr class="hover:bg-slate-900/50 transition">
      <td class="py-3 px-4 font-bold text-white">${inq.tenantName}</td>
      <td class="py-3 px-4">
        <span class="text-cyan-400 font-bold font-mono text-xs">${inq.tenantPhone || '+91 98471 20491'}</span>
      </td>
      <td class="py-3 px-4">
        <span class="font-semibold text-white block">${inq.propTitle}</span>
        <span class="text-[10px] text-emerald-400 font-bold">${inq.propCategory}</span>
      </td>
      <td class="py-3 px-4 font-extrabold text-cyan-300 font-mono">₹${Number(inq.monthlyRent).toLocaleString('en-IN')}/mo</td>
      <td class="py-3 px-4">
        <span class="text-slate-200 block font-semibold">${inq.landlordName}</span>
        <span class="text-slate-400 font-mono text-[11px]">${inq.landlordPhone}</span>
      </td>
      <td class="py-3 px-4 text-slate-300 text-xs">${inq.date} • ${inq.tourType}</td>
      <td class="py-3 px-4 text-right">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
          ${inq.status}
        </span>
      </td>
    </tr>
  `).join('');
}

function filterAdminData() {
  const query = document.getElementById("admin-universal-search")?.value.toLowerCase().trim() || "";
  const role = document.getElementById("admin-role-filter")?.value || "all";
  const tbody = document.getElementById("admin-data-tbody");
  if (!tbody) return;

  if (adminActiveSubTab === "users") {
    const filtered = registeredUsersData.filter(u => {
      if (role !== "all" && u.role !== role) return false;
      if (query) {
        const text = `${u.name} ${u.email} ${u.phone} ${u.hub} ${u.id}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
    tbody.innerHTML = renderUserRows(filtered);
    return;
  }

  if (adminActiveSubTab === "logs") {
    const filtered = loginLogsData.filter(l => {
      if (role !== "all" && l.role !== role) return false;
      if (query) {
        const text = `${l.userName} ${l.email} ${l.phone} ${l.ipAddress} ${l.hub}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
    tbody.innerHTML = renderLogRows(filtered);
    return;
  }

  if (adminActiveSubTab === "apps") {
    const filtered = applicationsData.filter(a => {
      if (query) {
        const text = `${a.applicantName} ${a.applicantEmail} ${a.applicantPhone} ${a.jobTitle} ${a.company}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
    tbody.innerHTML = renderApplicationRows(filtered);
    return;
  }

  if (adminActiveSubTab === "inquiries") {
    const filtered = inquiriesData.filter(i => {
      if (query) {
        const text = `${i.tenantName} ${i.tenantPhone} ${i.propTitle} ${i.landlordName}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
    tbody.innerHTML = renderInquiryRows(filtered);
    return;
  }
}

// User All Details Inspector Modal
function openAdminUserDetails(userId) {
  let user = registeredUsersData.find(u => u.id === userId);
  if (!user) {
    user = registeredUsersData[0] || {
      id: userId,
      name: "Arjun Nair",
      email: "arjun.nair@techlead.io",
      phone: "+91 98471 20491",
      role: "Candidate",
      hub: "Kochi (Infopark Kakkanad)",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      status: "Active Verified",
      createdAt: "18 Nov 2026",
      headline: "Frontend & Full Stack Developer",
      ipAddress: "117.218.42.19",
      device: "Chrome / Windows 11",
      verificationScore: "98% (ID & Phone Confirmed)"
    };
  }

  const modal = document.getElementById("admin-user-modal");
  const content = document.getElementById("admin-user-modal-content");
  if (!modal || !content) return;

  const roleColor = user.role === "Candidate" ? "cyan" : (user.role === "Landlord" ? "emerald" : "amber");
  const cleanPhone = (user.phone || "+919847120491").replace(/[^0-9]/g, '');

  content.innerHTML = `
    <!-- Modal Header -->
    <div class="flex items-start justify-between pb-4 border-b border-slate-800 mb-5">
      <div class="flex items-center gap-3">
        <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}" class="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400 shadow-xl">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-black text-white">${user.name}</h3>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-800">
              ${user.role}
            </span>
          </div>
          <p class="text-xs text-slate-400 font-mono">User ID: ${user.id} • ${user.headline || user.role}</p>
        </div>
      </div>
      <button onclick="closeModals()" class="text-slate-400 hover:text-white text-base p-1">✕</button>
    </div>

    <!-- Direct Contact Details Card -->
    <div class="bg-gradient-to-r from-slate-900 to-slate-900/60 p-4 rounded-2xl border border-slate-800 mb-4 space-y-3">
      <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Direct Contact & Verification Dossier</span>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
          <span class="text-slate-400 text-[11px] block mb-1">Mobile / WhatsApp Number</span>
          <span class="text-cyan-300 font-bold text-sm font-mono block mb-2">${user.phone || '+91 98471 20491'}</span>
          <div class="flex items-center gap-2">
            <a href="tel:${cleanPhone}" class="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-cyan-900 transition">
              <i data-lucide="phone" class="w-3 h-3"></i> Call Now
            </a>
            <a href="https://wa.me/${cleanPhone}" target="_blank" class="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-900 transition">
              <i data-lucide="message-circle" class="w-3 h-3"></i> WhatsApp
            </a>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
          <span class="text-slate-400 text-[11px] block mb-1">Email Address</span>
          <span class="text-white font-bold text-xs font-mono block truncate mb-2">${user.email}</span>
          <div>
            <a href="mailto:${user.email}" class="px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 hover:bg-slate-700 transition">
              <i data-lucide="mail" class="w-3 h-3"></i> Send Email
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Corridor & Technical Security Audit Details -->
    <div class="grid grid-cols-2 gap-3 mb-4 text-xs">
      <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <span class="text-slate-400 text-[11px] block">Primary Tech Corridor</span>
        <span class="text-white font-bold block mt-0.5">${user.hub}</span>
        <span class="text-[10px] text-emerald-400 font-semibold block mt-1">✓ Live < 10 mins to Office</span>
      </div>

      <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <span class="text-slate-400 text-[11px] block">Verification Status</span>
        <span class="text-emerald-400 font-bold block mt-0.5">✓ ${user.status || 'Active Verified'}</span>
        <span class="text-[10px] text-slate-400 block mt-1">${user.verificationScore || '100% ID & Phone Verified'}</span>
      </div>

      <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <span class="text-slate-400 text-[11px] block">Account Created</span>
        <span class="text-slate-300 font-bold block mt-0.5">${user.createdAt}</span>
        <span class="text-[10px] text-slate-500 block mt-1">Platform Member</span>
      </div>

      <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <span class="text-slate-400 text-[11px] block">Security / IP Log</span>
        <span class="text-slate-300 font-bold font-mono block mt-0.5">${user.ipAddress || '117.218.42.19'}</span>
        <span class="text-[10px] text-slate-500 block mt-1">${user.device || 'Chrome / Windows 11'}</span>
      </div>
    </div>

    <!-- Platform Activity Summary -->
    <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 mb-5 flex items-center justify-between text-xs">
      <div class="flex items-center gap-2">
        <i data-lucide="activity" class="w-4 h-4 text-cyan-400"></i>
        <span class="text-slate-300 font-semibold">Activity: ${user.applicationsCount || 0} Job Applications • ${user.savedRentalsCount || 0} Saved Rentals</span>
      </div>
      <span class="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded">Good Standing</span>
    </div>

    <!-- Modal Footer Controls -->
    <div class="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
      <button onclick="navigator.clipboard.writeText('${user.name} | ${user.phone} | ${user.email}'); showToast('📋 Contact info copied!');" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition flex items-center gap-1.5">
        <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy Contact Info
      </button>

      <button onclick="closeModals()" class="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl transition">
        Done / Close
      </button>
    </div>
  `;

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function initAdminCharts() {
  if (typeof Chart === "undefined") return;

  if (trendChartInstance) trendChartInstance.destroy();
  if (roleChartInstance) roleChartInstance.destroy();

  const ctxTrend = document.getElementById("admin-trend-chart")?.getContext("2d");
  if (ctxTrend) {
    trendChartInstance = new Chart(ctxTrend, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today (Sun)"],
        datasets: [
          {
            label: "Candidate Logins",
            data: [210, 340, 420, 390, 510, 280, 415],
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6, 182, 212, 0.15)",
            tension: 0.4,
            fill: true,
            borderWidth: 2
          },
          {
            label: "Landlord Logins",
            data: [80, 115, 140, 130, 175, 190, 210],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            tension: 0.4,
            fill: true,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#94a3b8", font: { size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#64748b" }
          },
          y: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#64748b" }
          }
        }
      }
    });
  }

  const ctxRole = document.getElementById("admin-role-chart")?.getContext("2d");
  if (ctxRole) {
    roleChartInstance = new Chart(ctxRole, {
      type: "doughnut",
      data: {
        labels: ["Job Seekers", "Landlords", "Employers"],
        datasets: [
          {
            data: [62, 26, 12],
            backgroundColor: ["#06b6d4", "#10b981", "#a855f7"],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        cutout: "70%"
      }
    });
  }
}

function recordMockLogin() {
  const mockNames = ["Kavya Nair", "Siddharth Menon", "Reshma Das", "Rahul Varghese"];
  const mockHubs = ["Kochi Infopark", "Technopark TVM", "Cyberpark Calicut", "Bangalore EGL"];
  const mockPhones = ["+91 98471 99221", "+91 94460 33819", "+91 98950 44102", "+91 94950 11992"];
  const idx = Math.floor(Math.random() * mockNames.length);
  const randomName = mockNames[idx];
  const randomHub = mockHubs[idx];
  const randomPhone = mockPhones[idx];
  const randomRole = Math.random() > 0.4 ? "Candidate" : "Landlord";

  recordLoginEvent(randomName, `${randomName.toLowerCase().replace(' ', '.')}@gmail.com`, randomPhone, randomRole, randomHub, "Success");
  if (window.confetti) window.confetti({ particleCount: 50, spread: 50 });
  showToast(`⚡ Live login recorded: ${randomName} (${randomPhone})`);
}

function exportUsersCSV() {
  let csv = "ID,Name,Phone Number,Email,Role,Preferred Hub,Joined Date,Status\n";
  registeredUsersData.forEach(u => {
    csv += `"${u.id}","${u.name}","${u.phone || ''}","${u.email}","${u.role}","${u.hub}","${u.createdAt}","${u.status}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `zentro_registered_users_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("📥 Users Directory CSV exported successfully!");
}

function exportLoginLogsCSV() {
  let csv = "ID,User Name,Phone Number,Email,Role,Hub,Device,IP Address,Timestamp,Status\n";
  loginLogsData.forEach(l => {
    csv += `"${l.id}","${l.userName}","${l.phone || ''}","${l.email}","${l.role}","${l.hub}","${l.device}","${l.ipAddress}","${l.timestamp}","${l.status}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `zentro_login_audit_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("📥 Login Audit CSV exported successfully!");
}

function setHeroSearchMode(mode) {
  const tabJobs = document.getElementById("hero-tab-jobs");
  const tabRentals = document.getElementById("hero-tab-rentals");
  const formJobs = document.getElementById("hero-form-jobs");
  const formRentals = document.getElementById("hero-form-rentals");

  if (mode === "jobs") {
    tabJobs.className = "px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 flex items-center gap-2 transition shadow-md shadow-cyan-500/20";
    tabRentals.className = "px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition";
    formJobs.classList.remove("hidden");
    formRentals.classList.add("hidden");
  } else {
    tabRentals.className = "px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 flex items-center gap-2 transition shadow-md shadow-emerald-500/20";
    tabJobs.className = "px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition";
    formRentals.classList.remove("hidden");
    formJobs.classList.add("hidden");
  }
}

// Filter Jobs by Kerala District / Place
function filterJobsByPlace(placeId) {
  document.querySelectorAll(".district-job-chip").forEach(btn => {
    btn.className = "district-job-chip px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-medium whitespace-nowrap";
  });
  const activeBtn = event ? event.target.closest("button") : null;
  if (activeBtn) {
    activeBtn.className = "district-job-chip active px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold whitespace-nowrap";
  }

  const filtered = jobsData.filter(j => {
    if (placeId === "all") return true;
    return j.hub === placeId || (j.district && j.district.toLowerCase() === placeId.toLowerCase());
  });

  renderJobsList(filtered);
}

// Filter Properties by Kerala District / Place
function filterPropertiesByPlace(placeId) {
  document.querySelectorAll(".district-prop-chip").forEach(btn => {
    btn.className = "district-prop-chip px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-medium whitespace-nowrap";
  });
  const activeBtn = event ? event.target.closest("button") : null;
  if (activeBtn) {
    activeBtn.className = "district-prop-chip active px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold whitespace-nowrap";
  }

  const filtered = propertiesData.filter(p => {
    if (placeId === "all") return true;
    return p.hub === placeId || (p.district && p.district.toLowerCase() === placeId.toLowerCase());
  });

  renderPropertiesList(filtered);
}

function executeHeroJobSearch() {
  const query = document.getElementById("hero-job-title")?.value.toLowerCase().trim() || "";
  const location = document.getElementById("hero-job-location")?.value || "all";

  const filtered = jobsData.filter(job => {
    if (location !== "all") {
      const hubMatch = job.hub === location || (job.district && job.district.toLowerCase() === location.toLowerCase());
      if (!hubMatch) return false;
    }
    if (query) {
      const matchText = `${job.title} ${job.company} ${job.tags.join(" ")} ${job.location} ${job.district || ''}`.toLowerCase();
      if (!matchText.includes(query)) return false;
    }
    return true;
  });

  switchView("jobs");
  renderJobsList(filtered);
}

function executeHeroRentalSearch() {
  const category = document.getElementById("hero-prop-category")?.value || "all";
  const location = document.getElementById("hero-prop-location")?.value || "all";
  const maxRent = parseInt(document.getElementById("hero-prop-budget")?.value || "100000");

  const filtered = propertiesData.filter(prop => {
    if (category !== "all" && prop.category !== category) return false;
    if (location !== "all") {
      const hubMatch = prop.hub === location || (prop.district && prop.district.toLowerCase() === location.toLowerCase());
      if (!hubMatch) return false;
    }
    if (prop.rentMonthly > maxRent) return false;
    return true;
  });

  currentRentalCategory = category;
  updateRentalCategoryPills(category);
  switchView("properties");
  renderPropertiesList(filtered);
}

function switchCategory(cat) {
  currentRentalCategory = cat;
  updateRentalCategoryPills(cat);

  const filtered = propertiesData.filter(prop => {
    if (cat === "all") return true;
    return prop.category === cat;
  });

  switchView("properties");
  renderPropertiesList(filtered);
}

function updateRentalCategoryPills(activeCat) {
  const mapping = {
    all: "chip-all",
    room: "chip-room",
    flat: "chip-flat",
    house: "chip-house"
  };

  Object.entries(mapping).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (key === activeCat) {
      el.className = "rental-chip active px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold whitespace-nowrap";
    } else {
      el.className = "rental-chip px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold whitespace-nowrap";
    }
  });
}

function filterJobsByCategory(cat) {
  currentJobCategory = cat;
  document.querySelectorAll(".job-chip").forEach(c => {
    c.classList.remove("bg-cyan-500", "text-slate-950", "active");
    c.classList.add("bg-slate-900", "text-slate-300");
  });

  event.currentTarget.classList.add("bg-cyan-500", "text-slate-950", "active");
  event.currentTarget.classList.remove("bg-slate-900", "text-slate-300");

  const filtered = jobsData.filter(job => {
    if (cat === "all") return true;
    return job.category === cat;
  });

  renderJobsList(filtered);
}

// Render Jobs
function renderJobsList(data = jobsData) {
  const container = document.getElementById("jobs-grid");
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400 glass-card rounded-2xl p-8">
        <i data-lucide="briefcase" class="w-10 h-10 mx-auto text-slate-600 mb-2"></i>
        <p class="font-bold text-white">No career opportunities match this filter.</p>
        <p class="text-xs text-slate-400 mt-1">Try resetting the location or category filters.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = data.map(job => `
    <div class="glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
      ${job.featured ? `
        <div class="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] px-3 py-1 rounded-bl-xl tracking-wider uppercase flex items-center gap-1 shadow-lg">
          <i data-lucide="sparkles" class="w-3 h-3"></i> PRIME HIRING
        </div>
      ` : ''}

      <div>
        <div class="flex items-start gap-4 mb-4">
          <img src="${job.logo}" class="w-12 h-12 rounded-xl object-cover border border-slate-700 p-0.5">
          <div class="min-w-0 flex-1">
            <h3 class="text-base font-bold text-white group-hover:text-cyan-400 transition truncate">${job.title}</h3>
            <p class="text-xs text-slate-400 font-medium">${job.company} • <span class="text-amber-400">★ ${job.rating}</span> (${job.reviewsCount} reviews)</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 text-xs mb-3">
          <span class="px-2.5 py-1 rounded-lg bg-slate-800/80 text-cyan-300 border border-cyan-900/40 flex items-center gap-1">
            <i data-lucide="map-pin" class="w-3 h-3 text-cyan-400"></i> ${job.location}
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
            <i data-lucide="clock" class="w-3 h-3 text-emerald-400"></i> ${job.workType}
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
            <i data-lucide="briefcase" class="w-3 h-3 text-amber-400"></i> ${job.experience}
          </span>
        </div>

        <p class="text-xs text-slate-300 mb-4 line-clamp-2 leading-relaxed">
          ${job.description}
        </p>

        <div class="mb-4 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
          <i data-lucide="home" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>
          <span>Nearby rentals: <strong class="text-emerald-300">${job.recommendedRentBudget}</strong></span>
        </div>

        <div class="flex flex-wrap gap-1.5 mb-5">
          ${job.tags.map(t => `<span class="text-[11px] px-2 py-0.5 rounded bg-slate-800/50 text-slate-300 border border-slate-700/40">${t}</span>`).join('')}
        </div>
      </div>

      <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Compensation</span>
          <span class="text-sm sm:text-base font-extrabold text-white">${job.salary}</span>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="matchRentalsForJob('${job.id}')" title="Find Houses & Rooms within 10 mins" class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition flex items-center gap-1 text-xs">
            <i data-lucide="home" class="w-4 h-4"></i>
            <span class="hidden sm:inline">Find Homes</span>
          </button>
          <button onclick="openApplyModal('${job.id}')" class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-500/20">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Render Properties
function renderPropertiesList(data = propertiesData) {
  const container = document.getElementById("props-grid");
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400 glass-card rounded-2xl p-8">
        <i data-lucide="home" class="w-10 h-10 mx-auto text-slate-600 mb-2"></i>
        <p class="font-bold text-white">No rental properties found for this category.</p>
        <p class="text-xs text-slate-400 mt-1">Try switching to 'All Listings' or adjusting budget.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = data.map(prop => {
    const isRoom = prop.category === "room";
    const isHouse = prop.category === "house";
    const categoryBadgeColor = isRoom
      ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
      : (isHouse ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40');

    return `
      <div class="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group">
        <div>
          <div class="relative h-48 overflow-hidden bg-slate-900">
            <img src="${prop.images[0]}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40"></div>

            <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span class="px-2.5 py-1 rounded-lg backdrop-blur-md text-[11px] font-bold border ${categoryBadgeColor}">
                ${prop.typeTag}
              </span>
              ${prop.zeroBrokerage ? `
                <span class="px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  0% Brokerage
                </span>
              ` : ''}
              ${prop.foodAvailable ? `
                <span class="px-2.5 py-1 rounded-lg bg-indigo-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                  🍲 Food Included
                </span>
              ` : ''}
            </div>

            <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
              <span class="flex items-center gap-1 font-semibold text-cyan-200">
                <i data-lucide="navigation" class="w-3.5 h-3.5 text-cyan-400"></i> ${prop.commuteInfo}
              </span>
            </div>
          </div>

          <div class="p-5">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="text-base font-bold text-white group-hover:text-emerald-400 transition">${prop.title}</h3>
              <span class="text-xs font-bold text-amber-400 shrink-0">★ ${prop.rating}</span>
            </div>

            <p class="text-xs text-slate-400 mb-3 flex items-center gap-1">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-500 shrink-0"></i> ${prop.location}
            </p>

            <div class="flex flex-wrap gap-1.5 mb-4 text-[11px]">
              <span class="bg-slate-800/60 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50">
                ${prop.furnishing}
              </span>
              <span class="bg-slate-800/60 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50">
                ${prop.areaSqFt} sq.ft
              </span>
              ${prop.bachelorFriendly ? `
                <span class="bg-emerald-900/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/40">
                  ✓ Bachelor / Job Seeker Friendly
                </span>
              ` : ''}
            </div>

            <p class="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
              ${prop.description}
            </p>
          </div>
        </div>

        <div class="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span class="text-lg font-black text-white">₹${prop.rentMonthly.toLocaleString('en-IN')}</span>
            <span class="text-xs text-slate-400">/ month</span>
            <p class="text-[10px] text-slate-500">Deposit: ₹${prop.deposit.toLocaleString('en-IN')}</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="matchJobsForProperty('${prop.id}')" title="See Tech Companies Hiring within 10 mins" class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition flex items-center gap-1 text-xs">
              <i data-lucide="briefcase" class="w-4 h-4"></i>
              <span class="hidden sm:inline">Jobs Nearby</span>
            </button>
            <button onclick="openRentalTourModal('${prop.id}')" class="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20">
              Book Tour
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Commute Match Engine
function matchRentalsForJob(jobId) {
  const job = jobsData.find(j => j.id === jobId);
  if (!job) return;

  switchView("match");
  const matchingProps = propertiesData.filter(p => p.hub === job.hub);

  const container = document.getElementById("match-results-container");
  if (!container) return;

  container.innerHTML = `
    <div class="bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-500/30 rounded-2xl p-5 mb-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Target Career Location</span>
          <h3 class="text-lg font-bold text-white">${job.title} at ${job.company}</h3>
          <p class="text-xs text-slate-300">📍 ${job.location} • Ideal Monthly Rent: ${job.recommendedRentBudget}</p>
        </div>
        <span class="px-3 py-1 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 rounded-full text-xs font-bold">
          ${matchingProps.length} Houses, Flats & Rooms Within 10 Mins Commute
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      ${matchingProps.map(p => `
        <div class="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <img src="${p.images[0]}" class="w-full h-36 rounded-xl object-cover mb-3">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">
                ⚡ ${p.commuteMinutes} mins commute to ${job.company}
              </span>
              <span class="text-[10px] text-cyan-300 font-bold">${p.typeTag}</span>
            </div>
            <h4 class="font-bold text-white text-sm mt-1">${p.title}</h4>
            <p class="text-xs text-slate-400 mb-2">${p.location}</p>
            <p class="text-sm font-extrabold text-cyan-300">₹${p.rentMonthly.toLocaleString('en-IN')}/mo</p>
          </div>
          <button onclick="openRentalTourModal('${p.id}')" class="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition">
            Book Viewing & Relocate
          </button>
        </div>
      `).join('')}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function matchJobsForProperty(propId) {
  const prop = propertiesData.find(p => p.id === propId);
  if (!prop) return;

  switchView("match");
  const matchingJobs = jobsData.filter(j => j.hub === prop.hub);

  const container = document.getElementById("match-results-container");
  if (!container) return;

  container.innerHTML = `
    <div class="bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/30 rounded-2xl p-5 mb-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Target Living Residence</span>
          <h3 class="text-lg font-bold text-white">${prop.title} (${prop.typeTag})</h3>
          <p class="text-xs text-slate-300">📍 ${prop.location} • Rent: ₹${prop.rentMonthly.toLocaleString('en-IN')}/mo</p>
        </div>
        <span class="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-full text-xs font-bold">
          ${matchingJobs.length} Top Tech Employers Hiring Within Walking / Cycling Distance
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      ${matchingJobs.map(j => `
        <div class="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center gap-3 mb-3">
            <img src="${j.logo}" class="w-10 h-10 rounded-xl object-cover border border-slate-700">
            <div>
              <h4 class="font-bold text-white text-sm">${j.title}</h4>
              <p class="text-xs text-slate-400">${j.company}</p>
            </div>
          </div>
          <div>
            <span class="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded">
              ⚡ ~${prop.commuteMinutes} mins from this residence
            </span>
            <p class="text-xs text-emerald-400 font-extrabold mt-2">${j.salary}</p>
            <p class="text-xs text-slate-400 mt-1">${j.workType}</p>
          </div>
          <button onclick="openApplyModal('${j.id}')" class="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-bold transition">
            Apply with ProNest Passport
            Apply with Zentro Passport
          </button>
        </div>
      `).join('')}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

// Affordability Calculator
function initAffordabilityCalculator() {
  const salarySlider = document.getElementById("calc-salary-slider");
  const salaryDisplay = document.getElementById("calc-salary-display");
  const maxRentDisplay = document.getElementById("calc-max-rent");
  const takeHomeDisplay = document.getElementById("calc-takehome");
  const savingsDisplay = document.getElementById("calc-savings");
  const balanceDisplay = document.getElementById("calc-balance");

  if (!salarySlider) return;

  const update = () => {
    const lpa = parseFloat(salarySlider.value);
    if (salaryDisplay) salaryDisplay.innerText = `₹${lpa.toFixed(1)} LPA`;

    const monthlyGross = (lpa * 100000) / 12;
    const estTax = monthlyGross * 0.12;
    const monthlyNet = monthlyGross - estTax;

    const maxSafeRent = Math.round(monthlyNet * 0.28);
    const estSavings = Math.round(monthlyNet * 0.40);
    const estBalance = Math.round(monthlyNet - maxSafeRent - estSavings);

    if (maxRentDisplay) maxRentDisplay.innerText = `₹${maxSafeRent.toLocaleString('en-IN')}`;
    if (takeHomeDisplay) takeHomeDisplay.innerText = `₹${Math.round(monthlyNet).toLocaleString('en-IN')}/mo`;
    if (savingsDisplay) savingsDisplay.innerText = `₹${estSavings.toLocaleString('en-IN')}/mo`;
    if (balanceDisplay) balanceDisplay.innerText = `₹${estBalance.toLocaleString('en-IN')}/mo`;
  };

  salarySlider.addEventListener("input", update);
  update();
}

// Unified Profile
function renderUnifiedProfile() {
  const profileContainer = document.getElementById("profile-content");
  if (!profileContainer) return;

  const u = CURRENT_USER_PROFILE;

  profileContainer.innerHTML = `
    <div class="glass-card rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden">
      <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div class="relative">
          <img src="${u.avatar}" class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-cyan-400 shadow-xl shadow-cyan-500/20">
          <span class="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-900">
            VERIFIED
          </span>
        </div>

        <div class="flex-1 text-center sm:text-left">
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 class="text-xl sm:text-2xl font-black text-white">${u.name}</h2>
            <span class="gold-badge text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <i data-lucide="crown" class="w-3 h-3"></i> ${u.tenantBadge}
            </span>
          </div>

          <p class="text-xs sm:text-sm text-cyan-300 font-semibold mb-2">${u.headline}</p>
          <p class="text-xs text-slate-400 max-w-2xl leading-relaxed mb-4">${u.bio}</p>

          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-300">
            <span class="flex items-center gap-1"><i data-lucide="building" class="w-3.5 h-3.5 text-slate-500"></i> ${u.currentCompany}</span>
            <span class="flex items-center gap-1"><i data-lucide="briefcase" class="w-3.5 h-3.5 text-slate-500"></i> ${u.experienceYears} Years Exp</span>
            <span class="flex items-center gap-1"><i data-lucide="home" class="w-3.5 h-3.5 text-emerald-400"></i> Looking for: ${u.lookingForRentalType}</span>
          </div>
        </div>

        <div class="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-4 text-center min-w-[160px]">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tenant Trust Score</span>
          <div class="text-3xl font-black text-emerald-400 my-1">${u.tenantScore} <span class="text-xs text-slate-500">/ 900</span></div>
          <span class="text-[11px] text-emerald-300 font-semibold flex items-center justify-center gap-1">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Platinum Grade
          </span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass-card rounded-2xl p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div class="flex items-center gap-2">
            <i data-lucide="file-badge" class="w-5 h-5 text-cyan-400"></i>
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Candidate Job Passport</h3>
          </div>
          <span class="text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 font-bold">1-Click Apply Ready</span>
        </div>

        <div class="space-y-4 text-xs">
          <div>
            <span class="text-slate-400 block mb-1">Core Tech Stack & Competencies</span>
            <div class="flex flex-wrap gap-1.5">
              ${u.skills.map(s => `<span class="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700/60 font-medium">${s}</span>`).join('')}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div>
              <span class="text-slate-500 text-[10px] uppercase font-bold block">Current Package</span>
              <span class="text-slate-200 font-bold">${u.currentSalary}</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] uppercase font-bold block">Target Package</span>
              <span class="text-emerald-400 font-bold">${u.targetSalary}</span>
            </div>
          </div>

          <div>
            <span class="text-slate-400 block mb-1">Active Job Applications</span>
            ${u.appliedJobs.map(app => `
              <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p class="font-bold text-white">${app.title}</p>
                  <p class="text-[11px] text-slate-400">${app.company} • ${app.date}</p>
                </div>
                <span class="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-1 rounded border border-cyan-800 font-semibold">${app.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="glass-card rounded-2xl p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div class="flex items-center gap-2">
            <i data-lucide="shield-check" class="w-5 h-5 text-emerald-400"></i>
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Tenant Credibility Passport</h3>
          </div>
          <span class="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-bold">Landlord Fast-Track</span>
        </div>

        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
              <span class="text-[10px] text-slate-400 block">On-Time Rent</span>
              <span class="text-emerald-400 font-bold text-sm">24 Months</span>
            </div>
            <div class="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
              <span class="text-[10px] text-slate-400 block">Max Commute</span>
              <span class="text-cyan-400 font-bold text-sm">10 Mins</span>
            </div>
            <div class="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
              <span class="text-[10px] text-slate-400 block">Rent Budget</span>
              <span class="text-amber-400 font-bold text-sm">₹15k/mo</span>
            </div>
          </div>

          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <span class="text-slate-300 flex items-center gap-2">
                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i> Corporate Employment Verified
              </span>
              <span class="text-[10px] text-emerald-400 font-bold uppercase">Pass</span>
            </div>
            <div class="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <span class="text-slate-300 flex items-center gap-2">
                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i> Government ID & Police Check
              </span>
              <span class="text-[10px] text-emerald-400 font-bold uppercase">Cleared</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

// Modals
let activeJobModal = null;
let activePropModal = null;

function openApplyModal(jobId) {
  const job = jobsData.find(j => j.id === jobId);
  if (!job) return;

  activeJobModal = job;
  const modal = document.getElementById("job-apply-modal");
  const content = document.getElementById("job-apply-content");

  content.innerHTML = `
    <div class="flex items-start gap-4 mb-4">
      <img src="${job.logo}" class="w-12 h-12 rounded-xl object-cover border border-slate-700">
      <div>
        <h3 class="font-bold text-white text-base">${job.title}</h3>
        <p class="text-xs text-slate-400">${job.company} • ${job.location}</p>
        <p class="text-xs font-semibold text-cyan-400 mt-0.5">${job.salary}</p>
      </div>
    </div>

    <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs mb-4">
      <div class="flex items-center justify-between text-slate-300 mb-1">
        <span class="font-bold">Applicant:</span>
        <span class="text-cyan-400">${currentUser ? currentUser.name : CURRENT_USER_PROFILE.name}</span>
      </div>
      <p class="text-slate-400 text-[11px]">Zentro Verified Candidate Profile & Phone will be sent to ${job.hiringManager}.</p>
    </div>

    <div class="mb-4">
      <label class="block text-xs font-semibold text-slate-300 mb-1.5">Note to Hiring Lead (Optional):</label>
      <textarea id="apply-note" rows="3" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-400" placeholder="Highlight why you are an ideal fit for this role..."></textarea>
    </div>

    <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
      <button onclick="closeModals()" class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
      <button onclick="confirmJobApplication()" class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-500/20">
        Submit 1-Click Application
      </button>
    </div>
  `;

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function confirmJobApplication() {
  if (!activeJobModal) return;
  const note = document.getElementById("apply-note")?.value || "Interested in this role";
  const applicantName = currentUser ? currentUser.name : (CURRENT_USER_PROFILE.name || "Candidate");
  const applicantEmail = currentUser ? currentUser.email : (CURRENT_USER_PROFILE.email || "candidate@zentro.com");
  const applicantPhone = currentUser ? (currentUser.phone || "+91 98471 20491") : (CURRENT_USER_PROFILE.phone || "+91 98471 20491");

  const newApp = {
    id: `app-${Date.now()}`,
    jobId: activeJobModal.id,
    jobTitle: activeJobModal.title,
    company: activeJobModal.company,
    applicantName: applicantName,
    applicantEmail: applicantEmail,
    applicantPhone: applicantPhone,
    hub: activeJobModal.location || "Infopark Kochi",
    note: note,
    date: new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }),
    status: "Under Review"
  };

  applicationsData.unshift(newApp);
  saveApplications();

  closeModals();
  if (window.confetti) window.confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  showToast(`🚀 Application submitted to ${activeJobModal.company}! Candidate Phone: ${applicantPhone}`);
  if (activeTab === "admin") renderAdminDashboard();
}

function openRentalTourModal(propId) {
  const prop = propertiesData.find(p => p.id === propId);
  if (!prop) return;

  activePropModal = prop;
  const modal = document.getElementById("rental-tour-modal");
  const content = document.getElementById("rental-tour-content");

  content.innerHTML = `
    <div class="relative h-40 rounded-2xl overflow-hidden mb-4">
      <img src="${prop.images[0]}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
      <div class="absolute bottom-3 left-3 text-white">
        <span class="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">${prop.typeTag}</span>
        <h3 class="font-bold text-sm mt-1">${prop.title}</h3>
        <p class="text-xs text-cyan-300 font-semibold">₹${prop.rentMonthly.toLocaleString('en-IN')}/mo • ${prop.furnishing}</p>
      </div>
    </div>

    <div class="space-y-3 text-xs mb-4">
      <div>
        <label class="block font-semibold text-slate-300 mb-1">Select Tour Type:</label>
        <div class="grid grid-cols-2 gap-2">
          <label class="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center gap-2 cursor-pointer">
            <input type="radio" name="tour-type" checked class="text-emerald-500">
            <span class="text-slate-200">In-Person Visit</span>
          </label>
          <label class="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center gap-2 cursor-pointer">
            <input type="radio" name="tour-type" class="text-emerald-500">
            <span class="text-slate-200">3D Video Call</span>
          </label>
        </div>
      </div>

      <div>
        <label class="block font-semibold text-slate-300 mb-1">Preferred Date:</label>
        <input type="date" value="2026-11-25" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200">
      </div>

      <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-300">
        <span class="font-bold text-white">Owner Contact:</span> ${prop.landlordName} (${prop.landlordPhone})
      </div>
    </div>

    <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
      <button onclick="closeModals()" class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
      <button onclick="confirmRentalTour()" class="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20">
        Confirm Tour with Owner
      </button>
    </div>
  `;

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function confirmRentalTour() {
  if (!activePropModal) return;
  const tourType = document.querySelector('input[name="tour-type"]:checked')?.value || "In-Person Visit";
  const tourDate = document.getElementById("tour-date-input")?.value || "2026-11-25";
  const tenantName = currentUser ? currentUser.name : (CURRENT_USER_PROFILE.name || "Tenant");
  const tenantEmail = currentUser ? currentUser.email : (CURRENT_USER_PROFILE.email || "tenant@zentro.com");
  const tenantPhone = currentUser ? (currentUser.phone || "+91 98471 20491") : (CURRENT_USER_PROFILE.phone || "+91 98471 20491");

  const newInq = {
    id: `inq-${Date.now()}`,
    propId: activePropModal.id,
    propTitle: activePropModal.title,
    propCategory: activePropModal.typeTag,
    monthlyRent: activePropModal.rentMonthly,
    location: activePropModal.location,
    landlordName: activePropModal.landlordName,
    landlordPhone: activePropModal.landlordPhone,
    tenantName: tenantName,
    tenantEmail: tenantEmail,
    tenantPhone: tenantPhone,
    tourType: tourType,
    date: tourDate,
    status: "Confirmed by Landlord"
  };

  inquiriesData.unshift(newInq);
  saveInquiries();

  closeModals();
  if (window.confetti) window.confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  showToast(`🏡 Tour scheduled for ${activePropModal.title}! Landlord notified.`);
  if (activeTab === "admin") renderAdminDashboard();
}

function openPostJobModal() {
  document.getElementById("post-job-modal")?.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function handlePostJob(e) {
  e.preventDefault();
  const title = document.getElementById("new-job-title").value;
  const company = document.getElementById("new-job-company").value;
  const hub = document.getElementById("new-job-hub").value;
  const salary = document.getElementById("new-job-salary").value;
  const exp = document.getElementById("new-job-exp").value;
  const skillsRaw = document.getElementById("new-job-skills").value;

  const newJob = {
    id: `job-custom-${Date.now()}`,
    title: title,
    category: "mid_tech",
    company: company,
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
    rating: 5.0,
    reviewsCount: 1,
    location: hub === "kochi_infopark" ? "Infopark Kakkanad, Kochi" : "Technopark, Trivandrum",
    hub: hub,
    workType: "Hybrid",
    experience: exp,
    salary: salary,
    salaryNumeric: 1500000,
    tags: skillsRaw.split(",").map(s => s.trim()),
    description: `Exciting opportunity at ${company}. Looking for talented individuals to join our growing team.`,
    postedDate: "Just now",
    featured: true,
    hiringManager: "HR Talent Lead",
    recommendedRentBudget: "₹12,000 - ₹20,000/mo",
    benefits: ["Flexible Hours", "Health Insurance", "Work Laptop"]
  };

  jobsData.unshift(newJob);
  closeModals();
  switchView("jobs");
  renderJobsList();
  if (window.confetti) window.confetti({ particleCount: 80, spread: 70 });
  showToast("🎉 Job opening published successfully!");
}

function openListPropertyModal() {
  document.getElementById("list-property-modal")?.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function handleListProperty(e) {
  e.preventDefault();
  const cat = document.getElementById("new-prop-category").value;
  const title = document.getElementById("new-prop-title").value;
  const rent = parseInt(document.getElementById("new-prop-rent").value);
  const deposit = parseInt(document.getElementById("new-prop-deposit").value);
  const location = document.getElementById("new-prop-location").value;
  const hub = document.getElementById("new-prop-hub").value;
  const commute = document.getElementById("new-prop-commute").value;

  const typeLabels = {
    room: "🛏️ Single Room / PG",
    flat: "🏢 Flat / Apartment",
    house: "🏡 Independent House"
  };

  const newProp = {
    id: `prop-custom-${Date.now()}`,
    title: title,
    category: cat,
    typeTag: typeLabels[cat] || "Rental Property",
    rentMonthly: rent,
    deposit: deposit,
    location: location,
    hub: hub,
    commuteInfo: commute,
    commuteMinutes: 5,
    areaSqFt: cat === "room" ? 250 : (cat === "flat" ? 1100 : 1800),
    furnishing: "Fully Furnished",
    bachelorFriendly: true,
    foodAvailable: cat === "room",
    images: [
      cat === "room"
        ? "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
        : (cat === "house"
          ? "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80"
          : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80")
    ],
    rating: 5.0,
    verifiedLandlord: true,
    landlordName: currentUser ? currentUser.name : "Verified Owner",
    landlordPhone: "+91 98471 00000",
    amenities: ["High-speed WiFi", "Power Backup", "Covered Parking", "Water Supply 24x7"],
    description: `Newly listed ${typeLabels[cat]} in ${location}. Walking distance to tech corridors.`,
    availableFrom: "Immediate",
    featured: true,
    zeroBrokerage: true
  };

  propertiesData.unshift(newProp);
  closeModals();
  switchCategory(cat);
  if (window.confetti) window.confetti({ particleCount: 80, spread: 70 });
  showToast(`🎉 ${typeLabels[cat]} listed successfully!`);
}

function closeModals() {
  document.getElementById("job-apply-modal")?.classList.add("hidden");
  document.getElementById("rental-tour-modal")?.classList.add("hidden");
  document.getElementById("post-job-modal")?.classList.add("hidden");
  document.getElementById("list-property-modal")?.classList.add("hidden");
  document.getElementById("admin-user-modal")?.classList.add("hidden");
  activeJobModal = null;
  activePropModal = null;
}

// Toast
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-cyan-500/40 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2";
  t.innerHTML = `<span>✨</span><span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
