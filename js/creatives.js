const articleLookup = {
  a1: "Enrollment Numbers Hit Record High",
  a2: "Campus Wi-Fi Upgrade Explained",
  a3: "Student Council Election Results",
  a4: "Behind the Lens: Foundation Week",
  a6: "Esports Team Qualifies for Regionals",
  a7: "Editorial: On Academic Freedom",
};

const creativeRoster = [
  { name: "Miguel Torres", role: "Creative Head" },
  { name: "Sofia Ramos", role: "Graphic Designer" },
  { name: "Diego Villanueva", role: "Illustrator" },
  { name: "Nadia Cortez", role: "Photographer" },
  { name: "Leo Bautista", role: "Videographer" },
];

let assignments = [
  {
    id: "c1", title: "Foundation Week Photo Set", type: "Photography", assignee: "Nadia Cortez", role: "Photographer",
    articleId: "a4", status: "In Review", deadline: "Sep 3",
    files: [{ name: "foundation-week-selects.zip", size: "24.1 MB" }],
  },
  {
    id: "c2", title: "Enrollment Data Infographic", type: "Design", assignee: "Sofia Ramos", role: "Graphic Designer",
    articleId: "a1", status: "In Progress", deadline: "Sep 1",
    files: [{ name: "enrollment-chart-draft.ai", size: "3.2 MB" }],
  },
  {
    id: "c3", title: "Editorial Cartoon: Academic Freedom", type: "Illustration", assignee: "Diego Villanueva", role: "Illustrator",
    articleId: "a7", status: "Revision", deadline: "Aug 31",
    files: [{ name: "editorial-cartoon-v1.png", size: "1.8 MB" }],
  },
  {
    id: "c4", title: "Esports Regionals Hype Reel", type: "Video", assignee: "Leo Bautista", role: "Videographer",
    articleId: "a6", status: "Assigned", deadline: "Sep 7",
    files: [],
  },
  {
    id: "c5", title: "Election Results Cover Photo", type: "Photography", assignee: "Nadia Cortez", role: "Photographer",
    articleId: "a3", status: "Delivered", deadline: "Aug 29",
    files: [{ name: "election-cover.jpg", size: "4.6 MB" }],
  },
  {
    id: "c6", title: "Campus Wi-Fi Explainer Icons", type: "Design", assignee: "Sofia Ramos", role: "Graphic Designer",
    articleId: "a2", status: "Approved", deadline: "Sep 4",
    files: [{ name: "wifi-icon-set.svg", size: "480 KB" }],
  },
  {
    id: "c7", title: "Publication Social Templates", type: "Design", assignee: "Sofia Ramos", role: "Graphic Designer",
    articleId: null, status: "In Progress", deadline: "Sep 9",
    files: [{ name: "social-templates-q3.psd", size: "12.4 MB" }],
  },
  {
    id: "c8", title: "Masthead Illustration Refresh", type: "Illustration", assignee: "Diego Villanueva", role: "Illustrator",
    articleId: null, status: "Assigned", deadline: "Sep 12",
    files: [],
  },
];

const revisionRequests = [
  { id: "rr1", title: "Soften cartoon tone per editor note", assignmentId: "c3", requestedBy: "Rico Alonzo", status: "Open" },
  { id: "rr2", title: "Resize infographic for mobile layout", assignmentId: "c2", requestedBy: "Carlo Mendoza", status: "Open" },
];

const creativeCalendarItems = [
  { day: "31", month: "Aug", title: "Editorial cartoon revision due", meta: "Illustration" },
  { day: "01", month: "Sep", title: "Enrollment infographic due", meta: "Design" },
  { day: "03", month: "Sep", title: "Foundation Week photo set due", meta: "Photography" },
  { day: "07", month: "Sep", title: "Esports hype reel due", meta: "Video" },
];

const creativeActivity = [
  { text: "Nadia Cortez uploaded Foundation Week photo selects", time: "20 minutes ago" },
  { text: "Rico Alonzo requested a revision on the editorial cartoon", time: "1 hour ago" },
  { text: "Sofia Ramos started the enrollment infographic", time: "2 hours ago" },
  { text: "\"Election Results Cover Photo\" was delivered", time: "1 day ago" },
  { text: "\"Campus Wi-Fi Explainer Icons\" was approved", time: "1 day ago" },
];

const statusOptions = ["Assigned", "In Progress", "In Review", "Revision", "Approved", "Delivered"];

let typeFilter = "all";
let activeAssignmentId = null;

function typeBadgeClass(type) {
  return `type-badge-${type.toLowerCase()}`;
}

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("");
}

function renderMetrics() {
  const active = assignments.filter((a) => !["Delivered", "Approved"].includes(a.status)).length;
  const pendingRevisions = revisionRequests.filter((r) => r.status === "Open").length;
  const linked = assignments.filter((a) => a.articleId).length;
  const awaitingApproval = assignments.filter((a) => a.status === "In Review").length;

  const metrics = [
    { label: "Active Assignments", count: active },
    { label: "Pending Revisions", count: pendingRevisions },
    { label: "Linked to Articles", count: linked },
    { label: "Awaiting Approval", count: awaitingApproval },
  ];

  document.getElementById("creativesMetrics").innerHTML = metrics.map((m) => `
    <div class="metric-card">
      <span class="metric-count">${m.count}</span>
      <span class="metric-label">${m.label}</span>
    </div>
  `).join("");
}

function renderTable() {
  const tbody = document.getElementById("creativeTableBody");
  const emptyState = document.getElementById("creativeEmptyState");
  const rows = typeFilter === "all" ? assignments : assignments.filter((a) => a.type === typeFilter);
  emptyState.hidden = rows.length !== 0;

  tbody.innerHTML = rows.map((a) => `
    <tr data-id="${a.id}">
      <td>${a.title}</td>
      <td><span class="badge ${typeBadgeClass(a.type)}">${a.type}</span></td>
      <td>${a.assignee}</td>
      <td>${a.role}</td>
      <td>${a.articleId ? articleLookup[a.articleId] : "—"}</td>
      <td><span class="badge">${a.status}</span></td>
      <td>${a.deadline}</td>
    </tr>
  `).join("");
}

function renderRevisions() {
  document.getElementById("revisionList").innerHTML = revisionRequests.length
    ? revisionRequests.map((r) => {
        const assignment = assignments.find((a) => a.id === r.assignmentId);
        return `
          <div class="detail-list-item">
            <div class="detail-list-item-header">
              <span class="detail-list-item-title">${r.title}</span>
              <span class="badge">${r.status}</span>
            </div>
            <div class="detail-list-item-meta">${assignment ? assignment.title : ""} · Requested by ${r.requestedBy}</div>
          </div>
        `;
      }).join("")
    : "<div class=\"empty-state\"><p class=\"empty-state-title\">No open revisions</p></div>";
}

function renderCalendar() {
  document.getElementById("creativeCalendar").innerHTML = creativeCalendarItems.map((e) => `
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

function renderAssets() {
  const withFiles = assignments.filter((a) => a.files.length);
  document.getElementById("assetGrid").innerHTML = withFiles.map((a) => `
    <div class="asset-card">
      <div class="asset-thumb">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
      </div>
      <div class="asset-body">
        <span class="asset-name">${a.files[0].name}</span>
        <span class="asset-meta">${a.title} · ${a.files[0].size}</span>
      </div>
    </div>
  `).join("");
}

function renderRoster() {
  document.getElementById("creativesRoster").innerHTML = creativeRoster.map((m) => {
    const load = assignments.filter((a) => a.assignee === m.name && !["Delivered", "Approved"].includes(a.status)).length;
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
  document.getElementById("creativesActivityList").innerHTML = creativeActivity.map((a) => `
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
  renderRevisions();
}

function userAssigneeOptions(selected) {
  return creativeRoster.map((m) =>
    `<option value="${m.name}" ${m.name === selected ? "selected" : ""}>${m.name} (${m.role})</option>`
  ).join("");
}

function renderOverviewPanel(a) {
  return `
    <div class="detail-grid">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="statusSelect">Status</label>
        <select class="form-select" id="statusSelect">
          ${statusOptions.map((s) => `<option value="${s}" ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="assigneeSelect">Assignee</label>
        <select class="form-select" id="assigneeSelect">
          ${userAssigneeOptions(a.assignee)}
        </select>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-field">
        <span class="detail-field-label">Type</span>
        <span class="badge ${typeBadgeClass(a.type)}">${a.type}</span>
      </div>
      <div class="detail-field">
        <span class="detail-field-label">Deadline</span>
        <span class="detail-field-value">${a.deadline}</span>
      </div>
    </div>
    <div class="form-group" style="margin-bottom:0;">
      <label class="form-label" for="articleSelect">Linked Article</label>
      <select class="form-select" id="articleSelect">
        <option value="">Not linked to an article</option>
        ${Object.entries(articleLookup).map(([id, title]) =>
          `<option value="${id}" ${id === a.articleId ? "selected" : ""}>${title}</option>`
        ).join("")}
      </select>
    </div>
  `;
}

function renderFilesPanel(a) {
  if (!a.files.length) return "<div class=\"empty-state\"><p class=\"empty-state-title\">No files uploaded</p></div>";
  return `<div class="detail-list">${a.files.map((f) => `
    <div class="detail-list-item file-item">
      <span><svg class="file-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>${f.name}</span>
      <span class="detail-list-item-meta">${f.size}</span>
    </div>
  `).join("")}</div>`;
}

function renderModalPanels() {
  const a = assignments.find((x) => x.id === activeAssignmentId);
  if (!a) return;
  document.getElementById("assignmentModalTitle").textContent = a.title;
  document.getElementById("assignmentModalSubtitle").textContent = `${a.type} · ${a.role}`;
  document.getElementById("panelOverview").innerHTML = renderOverviewPanel(a);
  document.getElementById("panelFiles").innerHTML = renderFilesPanel(a);
}

function switchTab(tab) {
  document.querySelectorAll("#assignmentModalTabs .tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === tab));
  document.querySelectorAll(".modal-tab-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === tab));
}

function openAssignmentModal(id) {
  activeAssignmentId = id;
  renderModalPanels();
  switchTab("overview");
  document.getElementById("assignmentModalOverlay").classList.add("is-open");
}

function closeAssignmentModal() {
  activeAssignmentId = null;
  document.getElementById("assignmentModalOverlay").classList.remove("is-open");
}

function initFilters() {
  const tabs = document.getElementById("creativeTabs");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    btn.classList.add("is-active");
    typeFilter = btn.dataset.filter;
    renderTable();
  });
}

function initTableClicks() {
  document.getElementById("creativeTableBody").addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    openAssignmentModal(row.dataset.id);
  });
}

function initModal() {
  document.getElementById("assignmentModalClose").addEventListener("click", closeAssignmentModal);
  document.getElementById("assignmentModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "assignmentModalOverlay") closeAssignmentModal();
  });
  document.getElementById("assignmentModalTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (btn) switchTab(btn.dataset.tab);
  });

  const modalBody = document.querySelector(".assignment-modal .modal-body");
  modalBody.addEventListener("change", (e) => {
    const a = assignments.find((x) => x.id === activeAssignmentId);
    if (!a) return;
    if (e.target.id === "statusSelect") {
      a.status = e.target.value;
      renderAll();
    }
    if (e.target.id === "assigneeSelect") {
      a.assignee = e.target.value;
      renderAll();
      renderRoster();
    }
    if (e.target.id === "articleSelect") {
      a.articleId = e.target.value || null;
      renderAll();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  renderCalendar();
  renderAssets();
  renderRoster();
  renderActivity();
  initFilters();
  initTableClicks();
  initModal();
});
