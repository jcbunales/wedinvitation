const STORAGE_KEY = "fernWeddingSite_v1";

const defaultState = {
  wedding: {
    partnerOne: "Olivia",
    partnerTwo: "Ethan",
    weddingDate: "2026-08-24",
    weddingTime: "16:00",
    rsvpDeadline: "2026-07-01",
    venueName: "The Garden Estate",
    venueAddress: "123 Bloomfield Road, Sydney NSW",
    mapLink: "https://maps.google.com/?q=The+Garden+Estate+Sydney",
    venueNotes: "Complimentary parking is available on site. Please arrive 20–30 minutes before the ceremony begins.",
    welcomeMessage: "We are so excited to celebrate this chapter with you. Join us for a garden ceremony, dinner, drinks, dancing, and a night to remember.",
    passcode: "wedding2026",
    schedule: [
      { time: "3:30 PM", title: "Guest arrival", note: "Please make your way to the garden ceremony area." },
      { time: "4:00 PM", title: "Ceremony", note: "We say “I do” surrounded by our favourite people." },
      { time: "5:00 PM", title: "Cocktail hour", note: "Drinks, canapés, photos, and time to mingle." },
      { time: "6:15 PM", title: "Reception", note: "Dinner, speeches, cake, and dancing into the night." }
    ]
  },
  guests: [
    { id: "g1", name: "Alex Morgan", email: "alex@example.com", phone: "0412 345 678", partySize: 2, group: "Friends", adminNotes: "", status: "Attending", attendingCount: 2, mealChoice: "Chicken", plusOneName: "Jordan Lee", dietaryNotes: "No peanuts please", respondedAt: "2026-06-18T08:45:00.000Z" },
    { id: "g2", name: "Sophie & Daniel Tan", email: "sophie@example.com", phone: "", partySize: 2, group: "Family", adminNotes: "", status: "Pending", attendingCount: 0, mealChoice: "", plusOneName: "", dietaryNotes: "", respondedAt: null },
    { id: "g3", name: "Mia Wilson", email: "mia@example.com", phone: "", partySize: 1, group: "Friends", adminNotes: "", status: "Declined", attendingCount: 0, mealChoice: "", plusOneName: "", dietaryNotes: "Travelling overseas that week", respondedAt: "2026-06-15T03:10:00.000Z" },
    { id: "g4", name: "Noah & Grace Chen", email: "chen.family@example.com", phone: "", partySize: 4, group: "Family", adminNotes: "Two children", status: "Attending", attendingCount: 4, mealChoice: "No preference", plusOneName: "", dietaryNotes: "1 child meal", respondedAt: "2026-06-20T11:22:00.000Z" },
    { id: "g5", name: "Liam Carter", email: "liam@example.com", phone: "", partySize: 2, group: "Work", adminNotes: "", status: "Pending", attendingCount: 0, mealChoice: "", plusOneName: "", dietaryNotes: "", respondedAt: null },
    { id: "g6", name: "Ava Thompson", email: "ava@example.com", phone: "", partySize: 1, group: "Friends", adminNotes: "", status: "Pending", attendingCount: 0, mealChoice: "", plusOneName: "", dietaryNotes: "", respondedAt: null }
  ]
};

const SUPABASE_CONFIG = window.WEDDING_SUPABASE_CONFIG || {};
const SUPABASE_MODE = Boolean(
  SUPABASE_CONFIG.enabled &&
  SUPABASE_CONFIG.url &&
  SUPABASE_CONFIG.publishableKey &&
  window.supabase?.createClient
);
const supabaseDb = SUPABASE_MODE
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey)
  : null;

let state = SUPABASE_MODE
  ? { wedding: clone(defaultState.wedding), guests: [] }
  : loadState();
let activeGuestId = null;
let activeGuestRecord = null;
let toastTimer = null;
let remotePublicStats = { attending: 0, responses: 0 };

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(defaultState);
    const parsed = JSON.parse(saved);
    return {
      wedding: { ...clone(defaultState.wedding), ...(parsed.wedding || {}) },
      guests: Array.isArray(parsed.guests) ? parsed.guests : clone(defaultState.guests)
    };
  } catch {
    return clone(defaultState);
  }
}
function saveState() {
  if (!SUPABASE_MODE) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function weddingToRow(wedding) {
  return {
    id: 1,
    partner_one: wedding.partnerOne,
    partner_two: wedding.partnerTwo,
    wedding_date: wedding.weddingDate,
    wedding_time: wedding.weddingTime,
    rsvp_deadline: wedding.rsvpDeadline,
    venue_name: wedding.venueName,
    venue_address: wedding.venueAddress,
    map_link: wedding.mapLink || "",
    venue_notes: wedding.venueNotes || "",
    welcome_message: wedding.welcomeMessage || "",
    schedule: Array.isArray(wedding.schedule) ? wedding.schedule : []
  };
}

function rowToWedding(row) {
  if (!row) return clone(defaultState.wedding);
  const normalisedTime = row.wedding_time ? String(row.wedding_time).slice(0, 5) : defaultState.wedding.weddingTime;
  return {
    ...clone(defaultState.wedding),
    partnerOne: row.partner_one ?? defaultState.wedding.partnerOne,
    partnerTwo: row.partner_two ?? defaultState.wedding.partnerTwo,
    weddingDate: row.wedding_date ?? defaultState.wedding.weddingDate,
    weddingTime: normalisedTime,
    rsvpDeadline: row.rsvp_deadline ?? defaultState.wedding.rsvpDeadline,
    venueName: row.venue_name ?? defaultState.wedding.venueName,
    venueAddress: row.venue_address ?? defaultState.wedding.venueAddress,
    mapLink: row.map_link ?? "",
    venueNotes: row.venue_notes ?? "",
    welcomeMessage: row.welcome_message ?? "",
    schedule: Array.isArray(row.schedule) ? row.schedule : clone(defaultState.wedding.schedule),
    passcode: state?.wedding?.passcode || defaultState.wedding.passcode
  };
}

function guestToRow(guest, includeId = true) {
  const row = {
    name: guest.name,
    email: guest.email || "",
    phone: guest.phone || "",
    party_size: Number(guest.partySize || 1),
    group_name: guest.group || "",
    admin_notes: guest.adminNotes || "",
    status: guest.status || "Pending",
    attending_count: Number(guest.attendingCount || 0),
    meal_choice: guest.mealChoice || "",
    plus_one_name: guest.plusOneName || "",
    dietary_notes: guest.dietaryNotes || "",
    responded_at: guest.respondedAt || null
  };
  if (includeId && guest.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(guest.id)) row.id = guest.id;
  return row;
}

function rowToGuest(row) {
  return {
    id: String(row.id),
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    partySize: Number(row.party_size || 1),
    group: row.group_name || "",
    adminNotes: row.admin_notes || "",
    status: row.status || "Pending",
    attendingCount: Number(row.attending_count || 0),
    mealChoice: row.meal_choice || "",
    plusOneName: row.plus_one_name || "",
    dietaryNotes: row.dietary_notes || "",
    respondedAt: row.responded_at || null
  };
}

async function refreshRemoteStats() {
  if (!SUPABASE_MODE) return;
  const { data, error } = await supabaseDb.rpc("public_rsvp_stats");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  remotePublicStats = { attending: Number(row?.attending || 0), responses: Number(row?.responses || 0) };
}

async function verifyRemoteAdmin() {
  if (!SUPABASE_MODE) return true;
  const { data, error } = await supabaseDb.rpc("is_wedding_admin");
  if (error) throw error;
  return data === true;
}

async function loadRemotePublicData() {
  if (!SUPABASE_MODE) return;
  const { data, error } = await supabaseDb.from("wedding_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  state.wedding = rowToWedding(data);
  await refreshRemoteStats();
}

async function loadRemoteAdminData() {
  if (!SUPABASE_MODE) return;
  const [settingsResult, guestsResult] = await Promise.all([
    supabaseDb.from("wedding_settings").select("*").eq("id", 1).single(),
    supabaseDb.from("guests").select("*").order("name")
  ]);
  if (settingsResult.error) throw settingsResult.error;
  if (guestsResult.error) throw guestsResult.error;
  state.wedding = rowToWedding(settingsResult.data);
  state.guests = (guestsResult.data || []).map(rowToGuest);
}

async function saveWeddingRemote() {
  if (!SUPABASE_MODE) { saveState(); return; }
  const { error } = await supabaseDb.from("wedding_settings").upsert(weddingToRow(state.wedding), { onConflict: "id" });
  if (error) throw error;
}

async function upsertGuestRemote(guest) {
  if (!SUPABASE_MODE) return guest;
  const row = guestToRow(guest, Boolean(guest.id));
  const query = guest.id && row.id
    ? supabaseDb.from("guests").update(row).eq("id", guest.id).select().single()
    : supabaseDb.from("guests").insert(row).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return rowToGuest(data);
}

async function deleteGuestRemote(id) {
  if (!SUPABASE_MODE) return;
  const { error } = await supabaseDb.from("guests").delete().eq("id", id);
  if (error) throw error;
}

async function replaceRemoteState(nextState) {
  if (!SUPABASE_MODE) return;
  state.wedding = { ...clone(defaultState.wedding), ...(nextState.wedding || {}) };
  await saveWeddingRemote();
  const { error: deleteError } = await supabaseDb.from("guests").delete().not("id", "is", null);
  if (deleteError) throw deleteError;
  if (Array.isArray(nextState.guests) && nextState.guests.length) {
    const rows = nextState.guests.map(g => guestToRow(g, false));
    const { error: insertError } = await supabaseDb.from("guests").insert(rows);
    if (insertError) throw insertError;
  }
  await loadRemoteAdminData();
  await refreshRemoteStats();
}

function byId(id) { return document.getElementById(id); }
function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}
function formatDate(dateStr, options = {}) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", ...options }).format(d);
}
function formatShortDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(d);
}
function formatTime(timeStr) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" }).format(d);
}
function formatResponseTime(iso) {
  if (!iso) return "No response yet";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}
function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2500);
}
function uid() { return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`; }

function renderPublic() {
  const w = state.wedding;
  const date = new Date(`${w.weddingDate}T00:00:00`);
  byId("partnerOneDisplay").textContent = w.partnerOne;
  byId("partnerTwoDisplay").textContent = w.partnerTwo;
  byId("weddingDayDisplay").textContent = new Intl.DateTimeFormat("en-AU", { weekday: "long" }).format(date);
  byId("weddingDateDisplay").textContent = formatDate(w.weddingDate);
  byId("weddingTimeDisplay").textContent = formatTime(w.weddingTime);
  byId("venueNameDisplay").textContent = w.venueName;
  byId("venueAddressDisplay").textContent = w.venueAddress;
  byId("welcomeMessageDisplay").textContent = w.welcomeMessage;
  byId("venueHeadingDisplay").textContent = w.venueName;
  byId("venueFullAddressDisplay").textContent = w.venueAddress;
  byId("venueNotesDisplay").textContent = w.venueNotes;
  byId("mapLinkDisplay").href = w.mapLink || "https://maps.google.com";
  byId("rsvpDeadlineDisplay").textContent = `Kindly respond by ${formatDate(w.rsvpDeadline)}.`;
  byId("footerCouple").textContent = `${w.partnerOne} & ${w.partnerTwo}`;
  byId("footerYear").textContent = new Date(w.weddingDate).getFullYear();
  renderScheduleCards();
  renderPublicStats();
  updateCountdown();
}

function renderScheduleCards() {
  byId("scheduleCards").innerHTML = state.wedding.schedule.map(item => `
    <article class="schedule-card">
      <time>${escapeHtml(item.time)}</time>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.note)}</p>
    </article>
  `).join("");
}

function renderPublicStats() {
  if (SUPABASE_MODE) {
    byId("publicResponsesCount").textContent = remotePublicStats.responses;
    byId("publicAttendingCount").textContent = remotePublicStats.attending;
    return;
  }
  const answered = state.guests.filter(g => g.status !== "Pending").length;
  const attending = state.guests.reduce((sum, g) => sum + (g.status === "Attending" ? Number(g.attendingCount || 0) : 0), 0);
  byId("publicResponsesCount").textContent = answered;
  byId("publicAttendingCount").textContent = attending;
}

function updateCountdown() {
  const target = new Date(`${state.wedding.weddingDate}T${state.wedding.weddingTime}:00`);
  const diff = Math.max(0, target - new Date());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  byId("countDays").textContent = String(days).padStart(3, "0");
  byId("countHours").textContent = String(hours).padStart(2, "0");
  byId("countMinutes").textContent = String(mins).padStart(2, "0");
  byId("countSeconds").textContent = String(secs).padStart(2, "0");
}
setInterval(updateCountdown, 1000);

function findGuest(query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  return state.guests.find(g => g.name.toLowerCase() === needle || (g.email && g.email.toLowerCase() === needle))
    || state.guests.find(g => g.name.toLowerCase().includes(needle) || (g.email && g.email.toLowerCase().includes(needle)));
}

async function lookupGuest(query) {
  const value = query.trim();
  if (!value) return null;
  if (!SUPABASE_MODE) return findGuest(value);
  const { data, error } = await supabaseDb.rpc("lookup_guest", { p_query: value });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? rowToGuest(row) : null;
}

function showRsvpGuest(guest) {
  activeGuestId = guest.id;
  activeGuestRecord = guest;
  byId("foundGuestName").textContent = guest.name;
  const select = byId("partyAttending");
  select.innerHTML = Array.from({ length: guest.partySize }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("");
  select.value = String(Math.max(1, guest.attendingCount || 1));
  document.querySelectorAll('input[name="attendance"]').forEach(el => el.checked = el.value === guest.status);
  byId("mealChoice").value = guest.mealChoice || "No preference";
  byId("plusOneName").value = guest.plusOneName || "";
  byId("dietaryNotes").value = guest.dietaryNotes || "";
  byId("rsvpLookupStep").classList.add("hidden");
  byId("rsvpSuccess").classList.add("hidden");
  byId("rsvpResponseStep").classList.remove("hidden");
  toggleAttendingFields();
}

function resetRsvp() {
  activeGuestId = null;
  activeGuestRecord = null;
  byId("guestLookup").value = "";
  byId("rsvpResponseStep").classList.add("hidden");
  byId("rsvpSuccess").classList.add("hidden");
  byId("rsvpLookupStep").classList.remove("hidden");
}

function toggleAttendingFields() {
  const val = document.querySelector('input[name="attendance"]:checked')?.value;
  byId("attendingFields").classList.toggle("hidden", val === "Declined");
}

document.querySelectorAll('input[name="attendance"]').forEach(el => el.addEventListener("change", toggleAttendingFields));
byId("findInvitationBtn").addEventListener("click", async () => {
  const button = byId("findInvitationBtn");
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Searching…";
  try {
    const guest = await lookupGuest(byId("guestLookup").value);
    if (!guest) return showToast("We couldn't find that invitation. Try the exact full name or email address.");
    showRsvpGuest(guest);
  } catch (error) {
    console.error(error);
    showToast("Could not check the invitation right now. Please try again.");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});
byId("guestLookup").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); byId("findInvitationBtn").click(); } });
byId("backToLookupBtn").addEventListener("click", resetRsvp);
byId("submitAnotherBtn").addEventListener("click", resetRsvp);
byId("rsvpForm").addEventListener("submit", async e => {
  e.preventDefault();
  const guest = activeGuestRecord || state.guests.find(g => g.id === activeGuestId);
  if (!guest) return;
  const attendance = document.querySelector('input[name="attendance"]:checked')?.value;
  if (!attendance) return showToast("Please choose whether you can attend.");

  guest.status = attendance;
  guest.attendingCount = attendance === "Attending" ? Number(byId("partyAttending").value) : 0;
  guest.mealChoice = attendance === "Attending" ? byId("mealChoice").value : "";
  guest.plusOneName = attendance === "Attending" ? byId("plusOneName").value.trim() : "";
  guest.dietaryNotes = byId("dietaryNotes").value.trim();
  guest.respondedAt = new Date().toISOString();

  const submitButton = e.submitter || e.currentTarget.querySelector('[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  try {
    if (SUPABASE_MODE) {
      const { error } = await supabaseDb.rpc("submit_rsvp", {
        p_guest_id: guest.id,
        p_status: guest.status,
        p_attending_count: guest.attendingCount,
        p_meal_choice: guest.mealChoice,
        p_plus_one_name: guest.plusOneName,
        p_dietary_notes: guest.dietaryNotes
      });
      if (error) throw error;
      const adminCopy = state.guests.find(g => g.id === guest.id);
      if (adminCopy) Object.assign(adminCopy, guest);
      await refreshRemoteStats();
    } else {
      saveState();
    }
    if (!byId("adminDashboard").classList.contains("hidden")) renderAllAdmin();
    renderPublicStats();
    byId("rsvpResponseStep").classList.add("hidden");
    byId("rsvpSuccess").classList.remove("hidden");
  } catch (error) {
    console.error(error);
    showToast("Your RSVP could not be saved. Please try again.");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

function configureDataModeUI() {
  const emailGroup = byId("adminEmailGroup");
  const localHelp = byId("localAdminHelp");
  const remoteHelp = byId("supabaseAdminHelp");
  const passwordLabel = byId("adminPasswordLabel");
  const passcodeSetting = byId("localPasscodeSetting");
  const modeStatus = byId("dataModeStatus");
  const connection = byId("adminDataConnection");

  if (SUPABASE_MODE) {
    emailGroup?.classList.remove("hidden");
    localHelp?.classList.add("hidden");
    remoteHelp?.classList.remove("hidden");
    if (passwordLabel) passwordLabel.textContent = "Password";
    if (byId("adminPasscode")) byId("adminPasscode").placeholder = "Supabase account password";
    passcodeSetting?.classList.add("hidden");
    if (modeStatus) modeStatus.textContent = "Online";
    if (connection) connection.textContent = "Supabase is connected. Wedding settings, guests, and RSVPs are shared across devices.";
  } else {
    emailGroup?.classList.add("hidden");
    localHelp?.classList.remove("hidden");
    remoteHelp?.classList.add("hidden");
    if (passwordLabel) passwordLabel.textContent = "Passcode";
    passcodeSetting?.classList.remove("hidden");
    if (modeStatus) modeStatus.textContent = "Local mode · this browser only";
    if (connection) connection.textContent = "Local browser storage is active. Configure supabase-config.js to use shared cloud data.";
  }
}

async function openAdmin() {
  byId("adminModal").classList.remove("hidden");
  if (SUPABASE_MODE) {
    const { data } = await supabaseDb.auth.getSession();
    if (data?.session) {
      try {
        if (!(await verifyRemoteAdmin())) {
          await supabaseDb.auth.signOut();
          throw new Error("This account is not listed as a wedding admin.");
        }
        await loadRemoteAdminData();
        byId("adminLogin").classList.add("hidden");
        byId("adminDashboard").classList.remove("hidden");
        renderPublic();
        renderAllAdmin();
        return;
      } catch (error) {
        console.error(error);
      }
    }
    byId("adminEmail").focus();
  } else {
    byId("adminPasscode").focus();
  }
}
function closeAdmin() { byId("adminModal").classList.add("hidden"); }
document.querySelectorAll(".admin-open").forEach(btn => btn.addEventListener("click", openAdmin));
document.querySelectorAll(".admin-close").forEach(btn => btn.addEventListener("click", closeAdmin));
byId("adminLoginBtn").addEventListener("click", loginAdmin);
byId("adminPasscode").addEventListener("keydown", e => { if (e.key === "Enter") loginAdmin(); });
byId("adminEmail")?.addEventListener("keydown", e => { if (e.key === "Enter") byId("adminPasscode").focus(); });

async function loginAdmin() {
  const errorEl = byId("adminLoginError");
  const button = byId("adminLoginBtn");
  errorEl.classList.add("hidden");
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Opening…";
  try {
    if (SUPABASE_MODE) {
      const email = byId("adminEmail").value.trim();
      const password = byId("adminPasscode").value;
      if (!email || !password) throw new Error("Enter your Supabase admin email and password.");
      const { error } = await supabaseDb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!(await verifyRemoteAdmin())) {
        await supabaseDb.auth.signOut();
        throw new Error("This account is not listed as a wedding admin.");
      }
      await loadRemoteAdminData();
      await refreshRemoteStats();
      renderPublic();
    } else if (byId("adminPasscode").value !== state.wedding.passcode) {
      throw new Error("Incorrect passcode.");
    }

    byId("adminLogin").classList.add("hidden");
    byId("adminDashboard").classList.remove("hidden");
    byId("adminPasscode").value = "";
    renderAllAdmin();
  } catch (error) {
    console.error(error);
    errorEl.textContent = SUPABASE_MODE ? (error.message || "Could not sign in.") : "Incorrect passcode.";
    errorEl.classList.remove("hidden");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

byId("adminLogoutBtn").addEventListener("click", async () => {
  if (SUPABASE_MODE) await supabaseDb.auth.signOut();
  byId("adminDashboard").classList.add("hidden");
  byId("adminLogin").classList.remove("hidden");
  if (SUPABASE_MODE) state.guests = [];
});

function setAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(el => el.classList.toggle("active", el.id === `adminTab-${tab}`));
  document.querySelectorAll("#adminNav button[data-admin-tab]").forEach(el => el.classList.toggle("active", el.dataset.adminTab === tab));
  byId("mobileAdminNav").value = tab;
  if (tab === "details") populateSettingsForm();
}
byId("adminNav").addEventListener("click", e => {
  const btn = e.target.closest("[data-admin-tab]");
  if (btn) setAdminTab(btn.dataset.adminTab);
});
byId("mobileAdminNav").addEventListener("change", e => setAdminTab(e.target.value));
document.addEventListener("click", e => {
  const link = e.target.closest("[data-admin-tab-link]");
  if (link) setAdminTab(link.dataset.adminTabLink);
});

function getStats() {
  const totalInvited = state.guests.reduce((sum, g) => sum + Number(g.partySize || 0), 0);
  const attending = state.guests.reduce((sum, g) => sum + (g.status === "Attending" ? Number(g.attendingCount || 0) : 0), 0);
  const declinedHouseholds = state.guests.filter(g => g.status === "Declined").length;
  const pendingHouseholds = state.guests.filter(g => g.status === "Pending").length;
  const respondedHouseholds = state.guests.length - pendingHouseholds;
  const responseRate = state.guests.length ? Math.round((respondedHouseholds / state.guests.length) * 100) : 0;
  const attendingPercent = totalInvited ? Math.round((attending / totalInvited) * 100) : 0;
  return { totalInvited, attending, declinedHouseholds, pendingHouseholds, respondedHouseholds, responseRate, attendingPercent };
}

function renderOverview() {
  const s = getStats();
  byId("statInvited").textContent = s.totalInvited;
  byId("statAttending").textContent = s.attending;
  byId("statDeclined").textContent = s.declinedHouseholds;
  byId("statPending").textContent = s.pendingHouseholds;
  byId("statAttendingPercent").textContent = `${s.attendingPercent}% of invited guests`;
  byId("responseRateText").textContent = `${s.responseRate}%`;
  byId("responseProgress").style.width = `${s.responseRate}%`;
  byId("statusLegend").innerHTML = `
    <span><i class="status-dot attending"></i>${state.guests.filter(g => g.status === "Attending").length} attending households</span>
    <span><i class="status-dot declined"></i>${state.guests.filter(g => g.status === "Declined").length} declined</span>
    <span><i class="status-dot pending"></i>${s.pendingHouseholds} pending</span>`;
  byId("snapshotDate").textContent = `${formatShortDate(state.wedding.weddingDate)}, ${formatTime(state.wedding.weddingTime)}`;
  byId("snapshotVenue").textContent = state.wedding.venueName;
  byId("snapshotDeadline").textContent = formatShortDate(state.wedding.rsvpDeadline);
  byId("adminCoupleName").textContent = `${state.wedding.partnerOne} & ${state.wedding.partnerTwo}`;

  const recent = state.guests.filter(g => g.respondedAt).sort((a,b) => new Date(b.respondedAt) - new Date(a.respondedAt)).slice(0, 5);
  byId("recentResponses").innerHTML = recent.length ? recent.map(g => `
    <div class="recent-item"><div><strong>${escapeHtml(g.name)}</strong><span>${formatResponseTime(g.respondedAt)}</span></div><span class="status-pill ${g.status}">${g.status}</span></div>
  `).join("") : `<p class="form-help">No responses yet.</p>`;
}

function renderGuestTable() {
  const query = byId("guestSearch").value.trim().toLowerCase();
  const filter = byId("guestStatusFilter").value;
  const guests = state.guests.filter(g => {
    const matchesText = !query || [g.name, g.email, g.phone, g.group].some(v => (v || "").toLowerCase().includes(query));
    const matchesStatus = filter === "All" || g.status === filter;
    return matchesText && matchesStatus;
  });
  byId("guestTableBody").innerHTML = guests.length ? guests.map(g => `
    <tr>
      <td class="guest-name-cell"><strong>${escapeHtml(g.name)}</strong><span>${escapeHtml(g.group || "Ungrouped")}</span></td>
      <td>${escapeHtml(g.email || g.phone || "—")}</td>
      <td>${g.partySize}</td>
      <td><span class="status-pill ${g.status}">${g.status}</span></td>
      <td>${g.status === "Attending" ? g.attendingCount : "—"}</td>
      <td><button class="table-action" data-edit-guest="${g.id}">Edit</button> · <button class="table-action" data-delete-guest="${g.id}">Delete</button></td>
    </tr>`).join("") : `<tr><td colspan="6">No guests match this filter.</td></tr>`;
}
byId("guestSearch").addEventListener("input", renderGuestTable);
byId("guestStatusFilter").addEventListener("change", renderGuestTable);
byId("guestTableBody").addEventListener("click", e => {
  const edit = e.target.closest("[data-edit-guest]");
  const del = e.target.closest("[data-delete-guest]");
  if (edit) openGuestEditor(edit.dataset.editGuest);
  if (del) deleteGuest(del.dataset.deleteGuest);
});

function renderConfirmations() {
  const responders = state.guests.filter(g => g.status !== "Pending").sort((a,b) => new Date(b.respondedAt || 0) - new Date(a.respondedAt || 0));
  byId("confirmationCards").innerHTML = responders.length ? responders.map(g => `
    <article class="confirmation-card">
      <div><h3>${escapeHtml(g.name)}</h3><p>${escapeHtml(g.email || g.phone || "No contact saved")} · ${formatResponseTime(g.respondedAt)}</p></div>
      <div class="confirmation-field"><span>Status</span><strong><span class="status-pill ${g.status}">${g.status}</span></strong></div>
      <div class="confirmation-field"><span>Attending</span><strong>${g.status === "Attending" ? `${g.attendingCount} / ${g.partySize}` : "0"}</strong></div>
      <div class="confirmation-field"><span>Details</span><strong>${escapeHtml([g.mealChoice, g.plusOneName, g.dietaryNotes].filter(Boolean).join(" · ") || "—")}</strong></div>
    </article>`).join("") : `<div class="admin-card"><p>No RSVP responses yet.</p></div>`;
}

function populateSettingsForm() {
  const w = state.wedding;
  byId("settingPartnerOne").value = w.partnerOne;
  byId("settingPartnerTwo").value = w.partnerTwo;
  byId("settingWelcome").value = w.welcomeMessage;
  byId("settingWeddingDate").value = w.weddingDate;
  byId("settingWeddingTime").value = w.weddingTime;
  byId("settingRsvpDeadline").value = w.rsvpDeadline;
  byId("settingPasscode").value = w.passcode;
  byId("settingVenueName").value = w.venueName;
  byId("settingVenueAddress").value = w.venueAddress;
  byId("settingMapLink").value = w.mapLink;
  byId("settingVenueNotes").value = w.venueNotes;
  renderScheduleEditor();
}
function renderScheduleEditor() {
  byId("scheduleEditor").innerHTML = state.wedding.schedule.map((item, index) => `
    <div class="schedule-editor-row" data-schedule-index="${index}">
      <div><label>Time</label><input data-field="time" value="${escapeHtml(item.time)}" /></div>
      <div><label>Title</label><input data-field="title" value="${escapeHtml(item.title)}" /></div>
      <div><label>Note</label><input data-field="note" value="${escapeHtml(item.note)}" /></div>
      <button class="remove-schedule" type="button" data-remove-schedule="${index}" aria-label="Remove schedule item">×</button>
    </div>`).join("");
}
byId("addScheduleItemBtn").addEventListener("click", () => {
  state.wedding.schedule.push({ time: "7:00 PM", title: "New event", note: "Add details here." });
  renderScheduleEditor();
});
byId("scheduleEditor").addEventListener("click", e => {
  const btn = e.target.closest("[data-remove-schedule]");
  if (!btn) return;
  state.wedding.schedule.splice(Number(btn.dataset.removeSchedule), 1);
  renderScheduleEditor();
});
byId("weddingDetailsForm").addEventListener("submit", async e => {
  e.preventDefault();
  document.querySelectorAll(".schedule-editor-row").forEach(row => {
    const index = Number(row.dataset.scheduleIndex);
    state.wedding.schedule[index] = {
      time: row.querySelector('[data-field="time"]').value.trim(),
      title: row.querySelector('[data-field="title"]').value.trim(),
      note: row.querySelector('[data-field="note"]').value.trim()
    };
  });
  state.wedding = {
    ...state.wedding,
    partnerOne: byId("settingPartnerOne").value.trim(),
    partnerTwo: byId("settingPartnerTwo").value.trim(),
    welcomeMessage: byId("settingWelcome").value.trim(),
    weddingDate: byId("settingWeddingDate").value,
    weddingTime: byId("settingWeddingTime").value,
    rsvpDeadline: byId("settingRsvpDeadline").value,
    passcode: byId("settingPasscode").value.trim() || state.wedding.passcode,
    venueName: byId("settingVenueName").value.trim(),
    venueAddress: byId("settingVenueAddress").value.trim(),
    mapLink: byId("settingMapLink").value.trim(),
    venueNotes: byId("settingVenueNotes").value.trim()
  };

  const saveButton = e.submitter || e.currentTarget.querySelector('[type="submit"]');
  if (saveButton) saveButton.disabled = true;
  try {
    await saveWeddingRemote();
    renderPublic();
    syncInvitationIntro();
    renderAllAdmin();
    byId("settingsSaved").classList.remove("hidden");
    setTimeout(() => byId("settingsSaved").classList.add("hidden"), 1800);
  } catch (error) {
    console.error(error);
    showToast("Wedding details could not be saved.");
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
});

function renderAllAdmin() {
  renderOverview();
  renderGuestTable();
  renderConfirmations();
  populateSettingsForm();
}

function openGuestEditor(id = "") {
  const guest = id ? state.guests.find(g => g.id === id) : null;
  byId("guestEditorTitle").textContent = guest ? "Edit guest" : "Add guest";
  byId("editingGuestId").value = guest?.id || "";
  byId("editGuestName").value = guest?.name || "";
  byId("editGuestEmail").value = guest?.email || "";
  byId("editGuestPhone").value = guest?.phone || "";
  byId("editGuestPartySize").value = guest?.partySize || 1;
  byId("editGuestGroup").value = guest?.group || "";
  byId("editGuestNotes").value = guest?.adminNotes || "";
  byId("guestEditorModal").classList.remove("hidden");
}
function closeGuestEditor() { byId("guestEditorModal").classList.add("hidden"); }
byId("addGuestBtn").addEventListener("click", () => openGuestEditor());
document.querySelectorAll(".guest-editor-close").forEach(el => el.addEventListener("click", closeGuestEditor));
byId("guestEditorForm").addEventListener("submit", async e => {
  e.preventDefault();
  const id = byId("editingGuestId").value;
  const existing = state.guests.find(g => g.id === id);
  const record = {
    id: existing?.id || uid(),
    name: byId("editGuestName").value.trim(),
    email: byId("editGuestEmail").value.trim(),
    phone: byId("editGuestPhone").value.trim(),
    partySize: Math.max(1, Number(byId("editGuestPartySize").value || 1)),
    group: byId("editGuestGroup").value.trim(),
    adminNotes: byId("editGuestNotes").value.trim(),
    status: existing?.status || "Pending",
    attendingCount: existing?.attendingCount || 0,
    mealChoice: existing?.mealChoice || "",
    plusOneName: existing?.plusOneName || "",
    dietaryNotes: existing?.dietaryNotes || "",
    respondedAt: existing?.respondedAt || null
  };

  const saveButton = e.submitter || e.currentTarget.querySelector('[type="submit"]');
  if (saveButton) saveButton.disabled = true;
  try {
    if (SUPABASE_MODE) {
      const savedGuest = await upsertGuestRemote(record);
      if (existing) Object.assign(existing, savedGuest); else state.guests.push(savedGuest);
      await refreshRemoteStats();
    } else {
      if (existing) Object.assign(existing, record); else state.guests.push(record);
      saveState();
    }
    renderAllAdmin();
    renderPublicStats();
    closeGuestEditor();
    showToast(existing ? "Guest updated." : "Guest added.");
  } catch (error) {
    console.error(error);
    showToast("Guest could not be saved.");
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
});

async function deleteGuest(id) {
  const guest = state.guests.find(g => g.id === id);
  if (!guest) return;
  if (!confirm(`Delete ${guest.name} from the guest list?`)) return;
  try {
    await deleteGuestRemote(id);
    state.guests = state.guests.filter(g => g.id !== id);
    if (!SUPABASE_MODE) saveState();
    else await refreshRemoteStats();
    renderAllAdmin();
    renderPublicStats();
    showToast("Guest deleted.");
  } catch (error) {
    console.error(error);
    showToast("Guest could not be deleted.");
  }
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
byId("exportRsvpCsvBtn").addEventListener("click", () => {
  const rows = [["Guest/Household","Email","Phone","Invited","Status","Attending","Meal","Plus One","Dietary/Message","Responded At"]];
  state.guests.forEach(g => rows.push([g.name,g.email,g.phone,g.partySize,g.status,g.attendingCount,g.mealChoice,g.plusOneName,g.dietaryNotes,g.respondedAt || ""]));
  const csv = rows.map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadFile("wedding-rsvp-list.csv", csv, "text/csv;charset=utf-8");
});
byId("exportJsonBtn").addEventListener("click", () => downloadFile("wedding-backup.json", JSON.stringify(state, null, 2), "application/json"));
byId("importJsonInput").addEventListener("change", e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.wedding || !Array.isArray(imported.guests)) throw new Error("Invalid backup");
      if (SUPABASE_MODE) {
        await replaceRemoteState(imported);
      } else {
        state = imported;
        saveState();
      }
      renderPublic();
      syncInvitationIntro();
      renderAllAdmin();
      renderPublicStats();
      byId("importStatus").textContent = "Backup imported successfully.";
      showToast("Backup imported.");
    } catch (error) {
      console.error(error);
      byId("importStatus").textContent = "The backup could not be imported.";
    }
  };
  reader.readAsText(file);
});

byId("resetDataBtn").addEventListener("click", async () => {
  if (!confirm("Reset all wedding and RSVP data to the original demo?")) return;
  try {
    if (SUPABASE_MODE) {
      await replaceRemoteState(clone(defaultState));
    } else {
      state = clone(defaultState);
      saveState();
    }
    renderPublic();
    syncInvitationIntro();
    renderAllAdmin();
    renderPublicStats();
    showToast("Demo data restored.");
  } catch (error) {
    console.error(error);
    showToast("The data could not be reset.");
  }
});

byId("copyInviteLinkBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href.split("#")[0]);
    showToast("Invitation link copied.");
  } catch {
    showToast("Copying is unavailable in this browser. Copy the address bar instead.");
  }
});

// Opening invitation animation
function syncInvitationIntro() {
  const w = state.wedding;
  const p1 = byId("introPartnerOne");
  const p2 = byId("introPartnerTwo");
  const date = byId("introWeddingDate");
  const seal = document.querySelector(".wax-seal span");
  if (p1) p1.textContent = w.partnerOne;
  if (p2) p2.textContent = w.partnerTwo;
  if (date) date.textContent = formatDate(w.weddingDate);
  if (seal) seal.textContent = (w.partnerOne || "F").trim().charAt(0).toUpperCase() || "F";
}

function openInvitationIntro() {
  const intro = byId("invitationIntro");
  if (!intro || intro.classList.contains("is-opening")) return;
  intro.classList.add("is-opening");

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const revealDelay = reducedMotion ? 10 : 1050;
  const finishDelay = reducedMotion ? 20 : 1850;

  window.setTimeout(() => {
    intro.classList.add("is-revealing");
    document.body.classList.remove("invitation-intro-active");
    document.body.classList.add("invitation-intro-opened");
  }, revealDelay);

  window.setTimeout(() => {
    intro.classList.add("is-finished");
    intro.setAttribute("aria-hidden", "true");
    const mainHeading = document.querySelector(".invitation-copy h1");
    if (mainHeading) mainHeading.setAttribute("tabindex", "-1");
  }, finishDelay);
}

const openInvitationButton = byId("openInvitationBtn");
if (openInvitationButton) {
  openInvitationButton.addEventListener("click", openInvitationIntro);
  openInvitationButton.focus({ preventScroll: true });
}

async function initialiseWeddingSite() {
  configureDataModeUI();
  renderPublic();
  populateSettingsForm();
  syncInvitationIntro();

  if (!SUPABASE_MODE) return;
  try {
    await loadRemotePublicData();
    renderPublic();
    populateSettingsForm();
    syncInvitationIntro();
  } catch (error) {
    console.error("Supabase initialisation failed:", error);
    const modeStatus = byId("dataModeStatus");
    if (modeStatus) modeStatus.textContent = "Supabase configured, but the database could not be reached.";
    showToast("Supabase is configured but could not be reached.");
  }
}

initialiseWeddingSite();
