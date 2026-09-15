const STORAGE_KEY = "technologian_requests";

const clusters = ["Writing", "Creatives", "Online & Digital"];

const requestTypes = [
  "Research", "Fact-check", "Photography", "Graphic Design", "Illustration",
  "Video", "Social Media", "Website", "Technical Support", "Publication Assistance", "Other",
];

const statusFlow = ["Pending", "Accepted", "In Progress", "Submitted", "Completed", "Closed"];

// Real articles loaded from GET /api/articles (see populateFormOptions),
// used to populate the Related Article dropdown with valid numeric IDs.
let formArticles = [];

const taskLookup = {
  "TASK-001": "Verify enrollment figures with admin",
  "TASK-004": "Deliver enrollment infographic draft",
  "TASK-005": "Revise editorial cartoon tone",
  "TASK-007": "Encode esports highlight reel",
  "TASK-009": "Verify enrollment historical data",
};

// Note: the mock `roster` list of fictional names has been removed. The
// Assigned To dropdowns (New Request form and the request detail modal)
// now use real users fetched from GET /api/users (see formUsers below).

// Requests are now loaded from PostgreSQL via GET /api/requests (see
// fetchRequests() below). This array just holds whatever was fetched
// (or added client-side through the New Request form) for rendering.
let requests = [];

function saveRequests() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error("Could not save requests", e);
  }
}

// Formats an ISO date string (e.g. "2026-08-30T16:00:00.000Z") into a
// short display date (e.g. "Aug 30, 2026"). Falls back to the raw value
// if it isn't a parseable date.
function formatDate(isoString) {
  if (!isoString) return "TBD";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Maps a request row returned by GET /api/requests (snake_case DB fields)
// into the shape the existing Requests UI already expects. Fields the API
// doesn't provide (attachments, responses, history, related task) are left
// empty rather than invented.
function mapApiRequest(apiRequest) {
  return {
    id: apiRequest.id,
    requester: apiRequest.requester_name || "Unknown",
    requesterCluster: "",
    targetCluster: apiRequest.target_cluster || "",
    type: apiRequest.request_type || "",
    subject: apiRequest.subject || "",
    description: apiRequest.description || "",
    priority: apiRequest.priority || "",
    deadline: formatDate(apiRequest.deadline),
    assignedTo: apiRequest.assigned_name || "",
    assignedToId: apiRequest.assigned_to,
    status: apiRequest.status || "",
    articleId: apiRequest.article_id,
    articleTitle: apiRequest.article_title || null,
    relatedTaskId: null,
    dateCreated: formatDate(apiRequest.created_at),
    attachments: [],
    responses: [],
    history: [],
  };
}

// Loads requests from PostgreSQL through the backend API and renders them
// using the existing table/metrics UI. Shows a friendly message instead of
// the raw error if the request fails.
async function fetchRequests() {
  try {
    const response = await fetch("/api/requests");
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "API returned an error");

    requests = result.data.map(mapApiRequest);
    renderAll();
  } catch (e) {
    console.error("Could not load requests from the API", e);
    showRequestsLoadError();
  }
}

function showRequestsLoadError() {
  document.getElementById("requestsMetrics").innerHTML = "";
  document.getElementById("requestsTableBody").innerHTML = "";
  const emptyState = document.getElementById("requestsEmptyState");
  emptyState.hidden = false;
  emptyState.querySelector(".empty-state-title").textContent = "Unable to load requests. Please try again.";
  const detail = emptyState.querySelector("p:not(.empty-state-title)");
  if (detail) detail.textContent = "";
}

const filters = { status: "all", type: "all", priority: "all", cluster: "all", search: "" };
let activeRequestId = null;

function slug(text) {
  return text.toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "");
}

function priorityBadgeClass(priority) {
  return `priority-badge-${priority.toLowerCase()}`;
}

function statusBadgeClass(status) {
  return `status-${slug(status)}`;
}

function populateSelectOptions() {
  const statusSelect = document.getElementById("filterStatus");
  statusFlow.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    statusSelect.appendChild(opt);
  });

  const typeSelect = document.getElementById("filterType");
  requestTypes.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeSelect.appendChild(opt);
  });

  const prioritySelect = document.getElementById("filterPriority");
  ["Low", "Normal", "High", "Urgent"].forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    prioritySelect.appendChild(opt);
  });

  const clusterSelect = document.getElementById("filterCluster");
  clusters.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    clusterSelect.appendChild(opt);
  });
}

// Real users loaded from GET /api/users, used to populate the Requester and
// Assigned To dropdowns in the New Request form with valid user IDs.
let formUsers = [];

async function fetchUsers() {
  try {
    const response = await fetch("/api/users");
    const result = await response.json();
    if (result.success) return result.data;
  } catch (e) {
    console.error("Could not load users", e);
  }
  return [];
}

// Loads real articles from GET /api/articles for the Related Article
// dropdown. PostgreSQL is the source of truth, so this replaces the old
// hardcoded a1/a2/... mock lookup.
async function fetchArticlesForForm() {
  try {
    const response = await fetch("/api/articles");
    const result = await response.json();
    if (result.success) return result.data;
  } catch (e) {
    console.error("Could not load articles", e);
  }
  return [];
}

async function populateFormOptions() {
  formUsers = await fetchUsers();
  formArticles = await fetchArticlesForForm();

  const requesterSelect = document.getElementById("formRequester");
  requesterSelect.innerHTML = formUsers
    .map((u) => `<option value="${u.id}" data-cluster="${u.cluster}">${u.name} (${u.cluster})</option>`)
    .join("");

  const reqClusterSelect = document.getElementById("formRequestingCluster");
  const targetClusterSelect = document.getElementById("formTargetCluster");
  [reqClusterSelect, targetClusterSelect].forEach((select) => {
    select.innerHTML = clusters.map((c) => `<option value="${c}">${c}</option>`).join("");
  });

  const typeSelect = document.getElementById("formType");
  typeSelect.innerHTML = requestTypes.map((t) => `<option value="${t}">${t}</option>`).join("");

  const articleSelect = document.getElementById("formArticle");
  articleSelect.innerHTML = `<option value="">Not linked to an article</option>` +
    formArticles.map((a) => `<option value="${a.id}">${a.title}</option>`).join("");

  const assignedSelect = document.getElementById("formAssignedTo");
  assignedSelect.innerHTML = `<option value="">Unassigned</option>` +
    formUsers.map((u) => `<option value="${u.id}">${u.name} (${u.cluster})</option>`).join("");

  requesterSelect.addEventListener("change", () => {
    const selectedOption = requesterSelect.selectedOptions[0];
    if (selectedOption && selectedOption.dataset.cluster) reqClusterSelect.value = selectedOption.dataset.cluster;
  });
  if (formUsers.length) reqClusterSelect.value = formUsers[0].cluster;
}

function filteredRequests() {
  const q = filters.search.trim().toLowerCase();
  return requests.filter((r) =>
    (filters.status === "all" || r.status === filters.status) &&
    (filters.type === "all" || r.type === filters.type) &&
    (filters.priority === "all" || r.priority === filters.priority) &&
    (filters.cluster === "all" || r.requesterCluster === filters.cluster || r.targetCluster === filters.cluster) &&
    (!q || r.subject.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.requester.toLowerCase().includes(q))
  );
}

function renderMetrics() {
  const openCount = requests.filter((r) => !["Completed", "Closed"].includes(r.status)).length;
  const pending = requests.filter((r) => r.status === "Pending").length;
  const inProgress = requests.filter((r) => r.status === "In Progress").length;
  const completed = requests.filter((r) => ["Completed", "Closed"].includes(r.status)).length;

  const metrics = [
    { label: "Open Requests", count: openCount },
    { label: "Pending", count: pending },
    { label: "In Progress", count: inProgress },
    { label: "Completed / Closed", count: completed },
  ];

  document.getElementById("requestsMetrics").innerHTML = metrics.map((m) => `
    <div class="metric-card">
      <span class="metric-count">${m.count}</span>
      <span class="metric-label">${m.label}</span>
    </div>
  `).join("");
}

function renderTable() {
  const tbody = document.getElementById("requestsTableBody");
  const emptyState = document.getElementById("requestsEmptyState");
  const rows = filteredRequests();
  emptyState.hidden = rows.length !== 0;

  tbody.innerHTML = rows.map((r) => `
    <tr data-id="${r.id}">
      <td>${r.id}</td>
      <td>${r.subject}</td>
      <td>${r.type}</td>
      <td>
        <span class="request-flow">
          <span class="badge cluster-badge-${slug(r.requesterCluster)}">${r.requesterCluster}</span> →
          <span class="badge cluster-badge-${slug(r.targetCluster)}">${r.targetCluster}</span>
        </span>
      </td>
      <td>${r.assignedTo || "Unassigned"}</td>
      <td><span class="badge ${priorityBadgeClass(r.priority)}">${r.priority}</span></td>
      <td><span class="badge ${statusBadgeClass(r.status)}">${r.status}</span></td>
      <td>${r.deadline}</td>
    </tr>
  `).join("");
}

function renderAll() {
  renderMetrics();
  renderTable();
}

function assigneeOptions(selectedId) {
  return `<option value="">Unassigned</option>` + formUsers.map((u) =>
    `<option value="${u.id}" ${String(u.id) === String(selectedId) ? "selected" : ""}>${u.name} (${u.cluster})</option>`
  ).join("");
}

function renderOverviewPanel(r) {
  return `
    <div class="detail-grid">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="statusSelect">Status</label>
        <select class="form-select" id="statusSelect">
          ${statusFlow.map((s) => `<option value="${s}" ${s === r.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="prioritySelect">Priority</label>
        <select class="form-select" id="prioritySelect">
          ${["Low", "Normal", "High", "Urgent"].map((p) => `<option value="${p}" ${p === r.priority ? "selected" : ""}>${p}</option>`).join("")}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" for="assignSelect">Assigned To</label>
        <select class="form-select" id="assignSelect">
          ${assigneeOptions(r.assignedToId)}
        </select>
      </div>
    </div>
    <p id="requestEditError" class="form-error" hidden style="color:var(--color-danger,#c0392b); font-size:0.875rem; margin:0 0 var(--space-md);">Unable to update request. Please try again.</p>
    <div class="detail-grid">
      <div class="detail-field">
        <span class="detail-field-label">Requester</span>
        <span class="detail-field-value">${r.requester} · <span class="badge cluster-badge-${slug(r.requesterCluster)}">${r.requesterCluster}</span></span>
      </div>
      <div class="detail-field">
        <span class="detail-field-label">Target Cluster</span>
        <span class="badge cluster-badge-${slug(r.targetCluster)}">${r.targetCluster}</span>
      </div>
      <div class="detail-field">
        <span class="detail-field-label">Type</span>
        <span class="detail-field-value">${r.type}</span>
      </div>
      <div class="detail-field">
        <span class="detail-field-label">Deadline</span>
        <span class="detail-field-value">${r.deadline}</span>
      </div>
      <div class="detail-field">
        <span class="detail-field-label">Related Article</span>
        <span class="detail-field-value">${r.articleId ? `<a href="newsroom.html?article=${r.articleId}">${r.articleTitle || "Untitled article"}</a>` : "None"}</span>
      </div>
      <div class="detail-field">
        <span class="detail-field-label">Related Task</span>
        <span class="detail-field-value">${r.relatedTaskId ? `<a href="tasks.html">${taskLookup[r.relatedTaskId] || r.relatedTaskId}</a>` : "Not linked"}</span>
      </div>
      <div class="detail-field">
        <span class="detail-field-label">Date Created</span>
        <span class="detail-field-value">${r.dateCreated}</span>
      </div>
    </div>
    <div class="detail-field-label" style="margin-bottom:var(--space-xs);">Description</div>
    <p class="detail-field-value">${r.description || "No description provided."}</p>
  `;
}

function renderAttachmentsPanel(r) {
  const list = r.attachments.length
    ? r.attachments.map((f) => `
        <div class="detail-list-item file-item">
          <span><svg class="file-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>${f.name}</span>
          <span class="detail-list-item-meta">${f.size}</span>
        </div>
      `).join("")
    : "<div class=\"empty-state\"><p class=\"empty-state-title\">No attachments yet</p></div>";
  return `
    <div class="detail-list">${list}</div>
    <button class="btn btn-secondary btn-sm" id="addAttachmentBtn" type="button" style="margin-top:var(--space-md);">Add Attachment</button>
  `;
}

function renderResponsesPanel(r) {
  const list = r.responses.length
    ? r.responses.map((c) => `
        <div class="response-item">
          <span class="response-author">${c.author}</span><span class="response-time">${c.time}</span>
          <div class="response-text">${c.text}</div>
        </div>
      `).join("")
    : "<div class=\"empty-state\"><p class=\"empty-state-title\">No responses yet</p></div>";
  return `
    <div class="detail-list">${list}</div>
    <form class="response-form" id="responseForm">
      <textarea class="form-textarea" id="responseInput" placeholder="Add a response..."></textarea>
      <button class="btn btn-primary" type="submit">Post</button>
    </form>
  `;
}

function renderHistoryPanel(r) {
  return `<div class="detail-list">${r.history.map((h) => `
    <div class="detail-list-item">
      <div class="detail-list-item-title">${h.text}</div>
      <div class="detail-list-item-meta">${h.time}</div>
    </div>
  `).join("")}</div>`;
}

function renderModalPanels() {
  const r = requests.find((x) => String(x.id) === String(activeRequestId));
  if (!r) return;
  document.getElementById("requestModalTitle").textContent = `${r.id} · ${r.subject}`;
  document.getElementById("requestModalSubtitle").textContent = `${r.type} · ${r.requesterCluster} → ${r.targetCluster}`;
  document.getElementById("panelOverview").innerHTML = renderOverviewPanel(r);
  document.getElementById("panelAttachments").innerHTML = renderAttachmentsPanel(r);
  document.getElementById("panelResponses").innerHTML = renderResponsesPanel(r);
  document.getElementById("panelHistory").innerHTML = renderHistoryPanel(r);
}

function switchTab(tab) {
  document.querySelectorAll("#requestModalTabs .tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === tab));
  document.querySelectorAll("#requestModalOverlay .modal-tab-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === tab));
}

function openRequestModal(id) {
  activeRequestId = id;
  renderModalPanels();
  switchTab("overview");
  document.getElementById("requestModalOverlay").classList.add("is-open");
  history.replaceState(null, "", `requests.html?request=${id}`);
}

function closeRequestModal() {
  activeRequestId = null;
  document.getElementById("requestModalOverlay").classList.remove("is-open");
  history.replaceState(null, "", "requests.html");
}

function logHistory(r, text) {
  r.history.unshift({ text, time: "Just now" });
  saveRequests();
}

function initFilters() {
  ["filterStatus", "filterType", "filterPriority", "filterCluster"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const key = id.replace("filter", "").toLowerCase();
      filters[key] = e.target.value;
      renderTable();
    });
  });
  document.getElementById("requestSearch").addEventListener("input", (e) => {
    filters.search = e.target.value;
    renderTable();
  });
  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    filters.status = filters.type = filters.priority = filters.cluster = "all";
    filters.search = "";
    document.getElementById("filterStatus").value = "all";
    document.getElementById("filterType").value = "all";
    document.getElementById("filterPriority").value = "all";
    document.getElementById("filterCluster").value = "all";
    document.getElementById("requestSearch").value = "";
    renderTable();
  });
}

function initTableClicks() {
  document.getElementById("requestsTableBody").addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    openRequestModal(row.dataset.id);
  });
}

async function patchRequest(id, fields) {
  const response = await fetch(`/api/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update request");
  }
  return result.data;
}

function showRequestEditError(message) {
  const errorEl = document.getElementById("requestEditError");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function initDetailModal() {
  document.getElementById("requestModalClose").addEventListener("click", closeRequestModal);
  document.getElementById("requestModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "requestModalOverlay") closeRequestModal();
  });
  document.getElementById("requestModalTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (btn) switchTab(btn.dataset.tab);
  });

  document.getElementById("requestDeleteBtn").addEventListener("click", async () => {
    const r = requests.find((x) => String(x.id) === String(activeRequestId));
    if (!r) return;

    const confirmed = window.confirm(`Are you sure you want to delete "${r.subject}"? This cannot be undone.`);
    if (!confirmed) return;

    const errorEl = document.getElementById("requestEditError");
    if (errorEl) errorEl.hidden = true;

    try {
      const response = await fetch(`/api/requests/${r.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete request");
      }

      // PostgreSQL row is gone; close the modal and reload the list from
      // the API so the request disappears from the UI.
      closeRequestModal();
      await fetchRequests();
    } catch (err) {
      console.error("Could not delete request", err);
      showRequestEditError("Unable to delete request. Please try again.");
    }
  });

  const modalBody = document.querySelector(".request-modal .modal-body");

  modalBody.addEventListener("change", async (e) => {
    const r = requests.find((x) => String(x.id) === String(activeRequestId));
    if (!r) return;

    let fields = null;
    if (e.target.id === "statusSelect") fields = { status: e.target.value };
    if (e.target.id === "prioritySelect") fields = { priority: e.target.value };
    if (e.target.id === "assignSelect") fields = { assigned_to: e.target.value ? Number(e.target.value) : null };
    if (!fields) return;

    const errorEl = document.getElementById("requestEditError");
    if (errorEl) errorEl.hidden = true;

    try {
      // PostgreSQL is the source of truth: PATCH, then reload the list from
      // the API rather than mutating the local object directly.
      await patchRequest(r.id, fields);
      await fetchRequests();
      if (String(activeRequestId) === String(r.id)) renderModalPanels();
    } catch (err) {
      console.error("Could not update request", err);
      showRequestEditError("Unable to update request. Please try again.");
    }
  });

  modalBody.addEventListener("submit", (e) => {
    if (e.target.id !== "responseForm") return;
    e.preventDefault();
    const input = document.getElementById("responseInput");
    const text = input.value.trim();
    if (!text) return;
    const r = requests.find((x) => String(x.id) === String(activeRequestId));
    r.responses.push({ author: "Juan Dela Cruz", time: "Just now", text });
    logHistory(r, "Juan Dela Cruz added a response");
    renderModalPanels();
    switchTab("responses");
  });

  modalBody.addEventListener("click", (e) => {
    if (e.target.id === "addAttachmentBtn") {
      const r = requests.find((x) => String(x.id) === String(activeRequestId));
      const n = r.attachments.length + 1;
      r.attachments.push({ name: `attachment-${n}.pdf`, size: "—" });
      logHistory(r, "Juan Dela Cruz added an attachment");
      renderModalPanels();
      switchTab("attachments");
    }
  });
}

function openNewRequestModal() {
  document.getElementById("newRequestModalOverlay").classList.add("is-open");
}

function closeNewRequestModal() {
  document.getElementById("newRequestModalOverlay").classList.remove("is-open");
  document.getElementById("newRequestForm").reset();
  document.getElementById("newRequestFormError").hidden = true;
}

function showNewRequestFormError(message) {
  const errorEl = document.getElementById("newRequestFormError");
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function initNewRequestModal() {
  document.getElementById("newRequestBtn").addEventListener("click", openNewRequestModal);
  document.getElementById("newRequestModalClose").addEventListener("click", closeNewRequestModal);
  document.getElementById("newRequestCancel").addEventListener("click", closeNewRequestModal);
  document.getElementById("newRequestModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "newRequestModalOverlay") closeNewRequestModal();
  });

  document.getElementById("newRequestForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Build the JSON body PostgreSQL/POST /api/requests expects. requester_id
    // and assigned_to must be real user IDs (from formUsers), not names.
    const requestBody = {
      requester_id: Number(document.getElementById("formRequester").value),
      target_cluster: document.getElementById("formTargetCluster").value,
      request_type: document.getElementById("formType").value,
      subject: document.getElementById("formSubject").value.trim(),
      description: document.getElementById("formDescription").value.trim(),
      priority: document.getElementById("formPriority").value,
      deadline: document.getElementById("formDeadline").value,
    };

    const assignedToValue = document.getElementById("formAssignedTo").value;
    if (assignedToValue) requestBody.assigned_to = Number(assignedToValue);

    // Related Article is optional: send the real numeric article ID from
    // PostgreSQL, or explicit null when "Not linked to an article" is chosen.
    const articleValue = document.getElementById("formArticle").value;
    requestBody.article_id = articleValue ? Number(articleValue) : null;

    const submitBtn = document.getElementById("newRequestSubmitBtn");
    document.getElementById("newRequestFormError").hidden = true;

    try {
      submitBtn.disabled = true;

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create request");
      }

      // PostgreSQL is the source of truth: refresh the list from the API
      // rather than inventing a local request object.
      await fetchRequests();
      closeNewRequestModal();
      if (result.data && result.data.id != null) openRequestModal(result.data.id);
    } catch (err) {
      console.error("Could not create request", err);
      showNewRequestFormError("Unable to create the request. Please check the form and try again.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function openFromQueryString() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("request");
  if (id && requests.some((r) => String(r.id) === String(id))) openRequestModal(id);
}

document.addEventListener("DOMContentLoaded", async () => {
  populateSelectOptions();
  await populateFormOptions();
  initFilters();
  initTableClicks();
  initDetailModal();
  initNewRequestModal();
  await fetchRequests();
  openFromQueryString();
});