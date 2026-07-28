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

let state = loadState();
let activeGuestId = null;
let toastTimer = null;

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
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
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

function showRsvpGuest(guest) {
  activeGuestId = guest.id;
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
byId("findInvitationBtn").addEventListener("click", () => {
  const guest = findGuest(byId("guestLookup").value);
  if (!guest) return showToast("We couldn't find that invitation. Try the full name or email address.");
  showRsvpGuest(guest);
});
byId("guestLookup").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); byId("findInvitationBtn").click(); } });
byId("backToLookupBtn").addEventListener("click", resetRsvp);
byId("submitAnotherBtn").addEventListener("click", resetRsvp);
byId("rsvpForm").addEventListener("submit", e => {
  e.preventDefault();
  const guest = state.guests.find(g => g.id === activeGuestId);
  if (!guest) return;
  const attendance = document.querySelector('input[name="attendance"]:checked')?.value;
  if (!attendance) return showToast("Please choose whether you can attend.");
  guest.status = attendance;
  guest.attendingCount = attendance === "Attending" ? Number(byId("partyAttending").value) : 0;
  guest.mealChoice = attendance === "Attending" ? byId("mealChoice").value : "";
  guest.plusOneName = attendance === "Attending" ? byId("plusOneName").value.trim() : "";
  guest.dietaryNotes = byId("dietaryNotes").value.trim();
  guest.respondedAt = new Date().toISOString();
  saveState();
  renderAllAdmin();
  renderPublicStats();
  byId("rsvpResponseStep").classList.add("hidden");
  byId("rsvpSuccess").classList.remove("hidden");
});

function openAdmin() {
  byId("adminModal").classList.remove("hidden");
  byId("adminPasscode").focus();
}
function closeAdmin() { byId("adminModal").classList.add("hidden"); }
document.querySelectorAll(".admin-open").forEach(btn => btn.addEventListener("click", openAdmin));
document.querySelectorAll(".admin-close").forEach(btn => btn.addEventListener("click", closeAdmin));
byId("adminLoginBtn").addEventListener("click", loginAdmin);
byId("adminPasscode").addEventListener("keydown", e => { if (e.key === "Enter") loginAdmin(); });
function loginAdmin() {
  if (byId("adminPasscode").value === state.wedding.passcode) {
    byId("adminLoginError").classList.add("hidden");
    byId("adminLogin").classList.add("hidden");
    byId("adminDashboard").classList.remove("hidden");
    byId("adminPasscode").value = "";
    renderAllAdmin();
  } else {
    byId("adminLoginError").classList.remove("hidden");
  }
}
byId("adminLogoutBtn").addEventListener("click", () => {
  byId("adminDashboard").classList.add("hidden");
  byId("adminLogin").classList.remove("hidden");
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
byId("weddingDetailsForm").addEventListener("submit", e => {
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
    passcode: byId("settingPasscode").value.trim(),
    venueName: byId("settingVenueName").value.trim(),
    venueAddress: byId("settingVenueAddress").value.trim(),
    mapLink: byId("settingMapLink").value.trim(),
    venueNotes: byId("settingVenueNotes").value.trim()
  };
  saveState();
  renderPublic();
  renderAllAdmin();
  byId("settingsSaved").classList.remove("hidden");
  setTimeout(() => byId("settingsSaved").classList.add("hidden"), 1800);
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
byId("guestEditorForm").addEventListener("submit", e => {
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
  if (existing) Object.assign(existing, record); else state.guests.push(record);
  saveState();
  renderAllAdmin();
  renderPublicStats();
  closeGuestEditor();
  showToast(existing ? "Guest updated." : "Guest added.");
});
function deleteGuest(id) {
  const guest = state.guests.find(g => g.id === id);
  if (!guest) return;
  if (!confirm(`Delete ${guest.name} from the guest list?`)) return;
  state.guests = state.guests.filter(g => g.id !== id);
  saveState();
  renderAllAdmin();
  renderPublicStats();
  showToast("Guest deleted.");
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
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.wedding || !Array.isArray(imported.guests)) throw new Error("Invalid backup");
      state = imported;
      saveState();
      renderPublic();
      renderAllAdmin();
      byId("importStatus").textContent = "Backup imported successfully.";
      showToast("Backup imported.");
    } catch {
      byId("importStatus").textContent = "That file does not look like a valid wedding backup.";
    }
  };
  reader.readAsText(file);
});
byId("resetDataBtn").addEventListener("click", () => {
  if (!confirm("Reset all wedding and RSVP data to the original demo?")) return;
  state = clone(defaultState);
  saveState();
  renderPublic();
  renderAllAdmin();
  showToast("Demo data restored.");
});
byId("copyInviteLinkBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href.split("#")[0]);
    showToast("Invitation link copied.");
  } catch {
    showToast("Copying is unavailable in this browser. Copy the address bar instead.");
  }
});

renderPublic();
populateSettingsForm();

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

syncInvitationIntro();
const openInvitationButton = byId("openInvitationBtn");
if (openInvitationButton) {
  openInvitationButton.addEventListener("click", openInvitationIntro);
  openInvitationButton.focus({ preventScroll: true });
}
