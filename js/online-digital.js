const articleLookup = {
  a1: "Enrollment Numbers Hit Record High",
  a2: "Campus Wi-Fi Upgrade Explained",
  a3: "Student Council Election Results",
  a6: "Esports Team Qualifies for Regionals",
  a7: "Editorial: On Academic Freedom",
};

const digitalRoster = [
  { name: "Bea Fernandez", role: "Online & Digital Head" },
  { name: "Tricia Ong", role: "Web Developer" },
  { name: "Marco Villaruel", role: "Social Media Manager" },
  { name: "Ella Navarro", role: "Researcher" },
  { name: "Paolo Reyes", role: "Fact-checker" },
  { name: "Jake Lim", role: "Digital Editor" },
];

const statusOptions = ["Pending", "In Progress", "In Review", "Approved", "Published"];

let items = [
  {
    id: "d1", title: "Publish Wi-Fi Upgrade Explainer Page", category: "Website", assignee: "Tricia Ong", role: "Web Developer",
    articleId: "a2", status: "In Progress", deadline: "Sep 5", files: [{ name: "wifi-page-layout.html", size: "18 KB" }],
  },
  {
    id: "d2", title: "Homepage Featured Story Carousel", category: "Website", assignee: "Tricia Ong", role: "Web Developer",
    articleId: null, status: "Pending", deadline: "Sep 8", files: [],
  },
  {
    id: "d3", title: "Election Results Social Carousel", category: "Social", assignee: "Marco Villaruel", role: "Social Media Manager",
    articleId: "a3", status: "Approved", deadline: "Aug 30", files: [{ name: "election-ig-carousel.zip", size: "6.4 MB" }],
  },
  {
    id: "d4", title: "Esports Qualifier Hype Post", category: "Social", assignee: "Marco Villaruel", role: "Social Media Manager",
    articleId: "a6", status: "In Review", deadline: "Sep 6", files: [{ name: "esports-post-draft.png", size: "1.1 MB" }],
  },
  {
    id: "d5", title: "Enrollment Trend Background Research", category: "Research", assignee: "Ella Navarro", role: "Researcher",
    articleId: "a1", status: "In Progress", deadline: "Aug 31", files: [{ name: "enrollment-research-notes.docx", size: "22 KB" }],
  },
  {
    id: "d6", title: "Academic Freedom Policy Research", category: "Research", assignee: "Ella Navarro", role: "Researcher",
    articleId: "a7", status: "Pending", deadline: "Sep 1", files: [],
  },
  {
    id: "d7", title: "Verify Enrollment Figures", category: "Fact-Check", assignee: "Paolo Reyes", role: "Fact-checker",
    articleId: "a1", status: "In Review", deadline: "Sep 1", files: [], verdict: "Pending",
  },
  {
    id: "d8", title: "Verify Cited Academic Freedom Policy", category: "Fact-Check", assignee: "Paolo Reyes", role: "Fact-checker",
    articleId: "a7", status: "Approved", deadline: "Aug 31", files: [], verdict: "Verified",
  },
  {
    id: "d9", title: "Foundation Week Recap Video Captions", category: "Multimedia", assignee: "Jake Lim", role: "Digital Editor",
    articleId: null, status: "Pending", deadline: "Sep 9", files: [],
  },
  {
    id: "d10", title: "Esports Highlight Reel Encode", category: "Multimedia", assignee: "Jake Lim", role: "Digital Editor",
    articleId: "a6", status: "In Progress", deadline: "Sep 7", files: [{ name: "esports-highlights-draft.mp4", size: "142 MB" }],
  },
  {
    id: "d11", title: "Schedule Election Results Publish", category: "Publishing", assignee: "Bea Fernandez", role: "Online & Digital Head",
    articleId: "a3", status: "Published", deadline: "Aug 30", files: [], done: true,
  },
  {
    id: "d12", title: "Queue Wi-Fi Explainer for Publish", category: "Publishing", assignee: "Bea Fernandez", role: "Online & Digital Head",
    articleId: "a2", status: "Pending", deadline: "Sep 5", files: [], done: false,
  },
];

const digitalCalendarItems = [
  { day: "31", month: "Aug", title: "Enrollment research due", meta: "Research" },
  { day: "01", month: "Sep", title: "Academic freedom research due", meta: "Research" },
  { day: "05", month: "Sep", title: "Wi-Fi explainer page live", meta: "Website" },
  { day: "07", month: "Sep", title: "Esports highlight reel due", meta: "Multimedia" },
];

const digitalActivity = [
  { text: "Paolo Reyes verified the academic freedom policy citation", time: "15 minutes ago" },
  { text: "Marco Villaruel submitted the esports hype post for review", time: "40 minutes ago" },
  { text: "Tricia Ong started the Wi-Fi explainer page", time: "1 hour ago" },
  { text: "\"Election Results Social Carousel\" was approved", time: "1 day ago" },
  { text: "\"Schedule Election Results Publish\" was published", time: "1 day ago" },
];

let categoryFilter = "all";
let activeItemId = null;

function slug(category) {
  return category.toLowerCase().replace(/\s+/g, "-");
}

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("");
}

function verdictClass(verdict) {
  return `verdict-badge-${verdict.toLowerCase()}`;
}

function renderMetrics() {
  const activeWeb = items.filter((i) => i.category === "Website" && i.status !== "Published").length;
  const pendingFactChecks = items.filter((i) => i.category === "Fact-Check" && i.verdict === "Pending").length;
  const socialScheduled = items.filter((i) => i.category === "Social" && ["Approved", "Published"].includes(i.status)).length;
  const multimediaInProduction = items.filter((i) => i.category === "Multimedia" && i.status !== "Published").length;

  const metrics = [
    { label: "Active Web Tasks", count: activeWeb },
    { label: "Pending Fact-Checks", count: pendingFactChecks },
    { label: "Social Posts Scheduled", count: socialScheduled },
    { label: "Multimedia in Production", count: multimediaInProduction },
  ];

  document.getElementById("digitalMetrics").innerHTML = metrics.map((m) => `
    <div class="metric-card">
      <span class="metric-count">${m.count}</span>
      <span class="metric-label">${m.label}</span>
    </div>
  `).join("");
}

function renderTable() {
  const tbody = document.getElementById("digitalTableBody");
  const emptyState = document.getElementById("digitalEmptyState");
  const rows = categoryFilter === "all" ? items : items.filter((i) => i.category === categoryFilter);
  emptyState.hidden = rows.length !== 0;

  tbody.innerHTML = rows.map((i) => `
    <tr data-id="${i.id}">
      <td>${i.title}</td>
      <td><span class="badge category-badge-${slug(i.category)}">${i.category}</span></td>
      <td>${i.assignee}</td>
      <td>${i.role}</td>
      <td>${i.articleId ? articleLookup[i.articleId] : "—"}</td>
      <td><span class="badge">${i.status}</span></td>
      <td>${i.deadline}</td>
    </tr>
  `).join("");
}

function renderCategorySection(containerId, category) {
  const rows = items.filter((i) => i.category === category);
  document.getElementById(containerId).innerHTML = rows.length
    ? rows.map((i) => {
        const verdict = i.verdict ? `<span class="badge ${verdictClass(i.verdict)}">${i.verdict}</span>` : `<span class="badge">${i.status}</span>`;
        return `
          <div class="detail-list-item">
            <div class="detail-list-item-header">
              <span class="detail-list-item-title">${i.title}</span>
              ${verdict}
            </div>
            <div class="detail-list-item-meta">${i.assignee} · ${i.articleId ? articleLookup[i.articleId] : "Not linked"} · Due ${i.deadline}</div>
          </div>
        `;
      }).join("")
    : "<div class=\"empty-state\"><p class=\"empty-state-title\">Nothing here right now</p></div>";
}

function renderPublishing() {
  const rows = items.filter((i) => i.category === "Publishing");
  document.getElementById("publishingList").innerHTML = rows.length
    ? rows.map((i) => `
        <div class="detail-list-item" data-publish-id="${i.id}">
          <div class="task-checkbox-row">
            <input type="checkbox" ${i.done ? "checked" : ""} data-publish-toggle="${i.id}">
            <div>
              <div class="detail-list-item-title">${i.title}</div>
              <div class="detail-list-item-meta">${i.articleId ? articleLookup[i.articleId] : "Not linked"} · Due ${i.deadline}</div>
            </div>
          </div>
        </div>
      `).join("")
    : "<div class=\"empty-state\"><p class=\"empty-state-title\">No publishing tasks queued</p></div>";
}

function renderCalendar() {
  document.getElementById("digitalCalendar").innerHTML = digitalCalendarItems.map((e) => `
    <li class="event-item">
      <div class="event-date">
        <span class="event-date-day">${e.day}</span>
        <span class="event-date-month">${e.month}</span>
      </div>
      <div class="event-body">
        <span class="event-title">${e.title}</span>
        <span class="event-meta">${e.meta}</span>
      </div>
    </li>
  `).join("");
}

function renderRoster() {
  document.getElementById("digitalRoster").innerHTML = digitalRoster.map((m) => {
    const load = items.filter((i) => i.assignee === m.name && i.status !== "Published").length;
    return `
      <div class="roster-card">
        <span class="avatar avatar-md">${initials(m.name)}</span>
        <div class="roster-card-body">
          <span class="roster-name">${m.name}</span>
          <span class="roster-role">${m.role}</span>
        </div>
        <div class="roster-load"><strong>${load}</strong>active</div>
      </div>
    `;
  }).join("");
}

function renderActivity() {
  document.getElementById("digitalActivityList").innerHTML = digitalActivity.map((a) => `
    <li class="activity-item">
      <span class="activity-icon">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
      </span>
      <div class="activity-body">
        <span class="activity-text">${a.text}</span>
        <span class="activity-time">${a.time}</span>
      </div>
    </li>
  `).join("");
}

function renderAll() {
  renderMetrics();
  renderTable();
  renderCategorySection("websiteList", "Website");
  renderCategorySection("socialList", "Social");
  renderCategorySection("researchList", "Research");
  renderCategorySection("factCheckList", "Fact-Check");
  renderCategorySection("multimediaList", "Multimedia");
  renderPublishing();
}

function assigneeOptions(selected) {
  return digitalRoster.map((m) =>
    `<option value="${m.name}" ${m.name === selected ? "selected" : ""}>${m.name} (${m.role})</option>`
  ).join("");
}

function renderOverviewPanel(i) {
  const verdictField = i.verdict ? `
    <div class="form-group" style="margin-bottom:0;">
      <label class="form-label" for="verdictSelect">Verdict</label>
      <select class="form-select" id="verdictSelect">
        ${["Pending", "Verified", "Flagged"].map((v) => `<option value="${v}" ${v === i.verdict ? "selected" : ""}>${v}</option>`).join("")}
      </select>
    </div>
  ` : "";

  return `
    <div class="detail-grid">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="statusSelect">Status</label>
        <select class="form-select" id="statusSelect">
          ${statusOptions.map((s) => `<option value="${s}" ${s === i.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="assigneeSelect">Assignee</label>
        <select class="form-select" id="assigneeSelect">
          ${assigneeOptions(i.assignee)}
        </select>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-field">
        <span class="detail-field-label">Category</span>
        <span class="badge category-badge-${slug(i.category)}">${i.category}</span>
      </div>
      <div class="detail-field">
        <span class="detail-field-label">Deadline</span>
        <span class="detail-field-value">${i.deadline}</span>
      </div>
    </div>
    ${verdictField}
    <div class="form-group" style="margin-bottom:0;margin-top:${i.verdict ? "var(--space-md)" : "0"};">
      <label class="form-label" for="articleSelect">Linked Article</label>
      <select class="form-select" id="articleSelect">
        <option value="">Not linked to an article</option>
        ${Object.entries(articleLookup).map(([id, title]) =>
          `<option value="${id}" ${id === i.articleId ? "selected" : ""}>${title}</option>`
        ).join("")}
      </select>
    </div>
  `;
}

function renderFilesPanel(i) {
  if (!i.files.length) return "<div class=\"empty-state\"><p class=\"empty-state-title\">No files uploaded</p></div>";
  return `<div class="detail-list">${i.files.map((f) => `
    <div class="detail-list-item file-item">
      <span><svg class="file-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>${f.name}</span>
      <span class="detail-list-item-meta">${f.size}</span>
    </div>
  `).join("")}</div>`;
}

function renderModalPanels() {
  const i = items.find((x) => x.id === activeItemId);
  if (!i) return;
  document.getElementById("itemModalTitle").textContent = i.title;
  document.getElementById("itemModalSubtitle").textContent = `${i.category} · ${i.role}`;
  document.getElementById("panelOverview").innerHTML = renderOverviewPanel(i);
  document.getElementById("panelFiles").innerHTML = renderFilesPanel(i);
}

function switchTab(tab) {
  document.querySelectorAll("#itemModalTabs .tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === tab));
  document.querySelectorAll(".modal-tab-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === tab));
}

function openItemModal(id) {
  activeItemId = id;
  renderModalPanels();
  switchTab("overview");
  document.getElementById("itemModalOverlay").classList.add("is-open");
}

function closeItemModal() {
  activeItemId = null;
  document.getElementById("itemModalOverlay").classList.remove("is-open");
}

function initFilters() {
  const tabs = document.getElementById("digitalTabs");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    btn.classList.add("is-active");
    categoryFilter = btn.dataset.filter;
    renderTable();
  });
}

function initTableClicks() {
  document.getElementById("digitalTableBody").addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    openItemModal(row.dataset.id);
  });
}

function initPublishingToggles() {
  document.getElementById("publishingList").addEventListener("change", (e) => {
    const id = e.target.dataset.publishToggle;
    if (!id) return;
    const item = items.find((x) => x.id === id);
    if (item) {
      item.done = e.target.checked;
      item.status = item.done ? "Published" : "Pending";
      renderAll();
    }
  });
}

function initModal() {
  document.getElementById("itemModalClose").addEventListener("click", closeItemModal);
  document.getElementById("itemModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "itemModalOverlay") closeItemModal();
  });
  document.getElementById("itemModalTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (btn) switchTab(btn.dataset.tab);
  });

  const modalBody = document.querySelector(".item-modal .modal-body");
  modalBody.addEventListener("change", (e) => {
    const i = items.find((x) => x.id === activeItemId);
    if (!i) return;
    if (e.target.id === "statusSelect") {
      i.status = e.target.value;
      renderAll();
    }
    if (e.target.id === "assigneeSelect") {
      i.assignee = e.target.value;
      renderAll();
      renderRoster();
    }
    if (e.target.id === "articleSelect") {
      i.articleId = e.target.value || null;
      renderAll();
    }
    if (e.target.id === "verdictSelect") {
      i.verdict = e.target.value;
      renderAll();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  renderCalendar();
  renderRoster();
  renderActivity();
  initFilters();
  initTableClicks();
  initPublishingToggles();
  initModal();
});
