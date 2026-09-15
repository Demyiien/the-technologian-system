const STORAGE_KEY = "technologian_tasks";

const taskClusters = ["Writing", "Creatives", "Online & Digital", "General"];
const priorities = ["Low", "Normal", "High", "Urgent"];
const statuses = ["Not Started", "In Progress", "Review", "Completed"];

const taskRoster = [
  { name: "Rico Alonzo", cluster: "Writing" },
  { name: "Carlo Mendoza", cluster: "Writing" },
  { name: "Maria Santos", cluster: "Writing" },
  { name: "Ana Cruz", cluster: "Writing" },
  { name: "Jake Lim", cluster: "Writing" },
  { name: "Miguel Torres", cluster: "Creatives" },
  { name: "Sofia Ramos", cluster: "Creatives" },
  { name: "Diego Villanueva", cluster: "Creatives" },
  { name: "Nadia Cortez", cluster: "Creatives" },
  { name: "Leo Bautista", cluster: "Creatives" },
  { name: "Bea Fernandez", cluster: "Online & Digital" },
  { name: "Tricia Ong", cluster: "Online & Digital" },
  { name: "Marco Villaruel", cluster: "Online & Digital" },
  { name: "Ella Navarro", cluster: "Online & Digital" },
  { name: "Paolo Reyes", cluster: "Online & Digital" },
  { name: "Juan Dela Cruz", cluster: "General" },
];

const CURRENT_USER = "Juan Dela Cruz";

// Real articles/requests loaded from GET /api/articles and GET /api/requests
// (see populateFormOptions), used to populate the Related Article/Request
// dropdowns with valid numeric IDs. PostgreSQL is the source of truth, so
// these replace the old hardcoded a1/REQ-001/... mock lookups.
let formArticles = [];
let formRequests = [];

// Tasks are now loaded from PostgreSQL via GET /api/tasks (see
// fetchTasks() below). This array just holds whatever was fetched (plus
// anything added through the local New Task form, which is not yet wired
// to the backend — that's a later pass).
let tasks = [];

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Could not save tasks", e);
  }
}

// Formats an ISO date string (e.g. "2026-09-25T00:00:00.000Z") into a
// short display date (e.g. "Sep 25, 2026"). Falls back to the raw value
// if it isn't a parseable date.
function formatDate(isoString) {
  if (!isoString) return "TBD";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Maps a task row returned by GET /api/tasks (snake_case DB fields, plus
// joined display names) into the shape the existing Tasks UI already
// expects. reminder/history aren't provided by the API yet, so they're
// left empty rather than invented.
function mapApiTask(apiTask) {
  return {
    id: apiTask.id,
    title: apiTask.title || "",
    description: apiTask.description || "",
    assignee: apiTask.assignee_name || "Unassigned",
    assigneeId: apiTask.assignee_id,
    cluster: apiTask.cluster || "",
    priority: apiTask.priority || "",
    status: apiTask.status || "",
    deadline: formatDate(apiTask.deadline),
    deadlineRaw: apiTask.deadline ? String(apiTask.deadline).slice(0, 10) : "",
    reminder: "",
    articleId: apiTask.article_id,
    articleTitle: apiTask.article_title || null,
    requestId: apiTask.request_id,
    requestSubject: apiTask.request_subject || null,
    dateCreated: formatDate(apiTask.created_at),
    history: [],
  };
}

// Loads tasks from PostgreSQL through the backend API and renders them
// using the existing board UI. Shows a friendly loading/error message
// instead of a raw error if the request fails.
async function fetchTasks() {
  const statusEl = document.getElementById("tasksStatusMessage");
  statusEl.hidden = false;
  statusEl.textContent = "Loading tasks...";

  try {
    const response = await fetch("/api/tasks");
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "API returned an error");

    tasks = result.data.map(mapApiTask);
    statusEl.hidden = true;
    renderAll();
  } catch (e) {
    console.error("Could not load tasks from the API", e);
    statusEl.textContent = "Failed to load tasks. Please try again.";
    statusEl.hidden = false;
    document.getElementById("tasksMetrics").innerHTML = "";
    document.getElementById("taskBoard").innerHTML = "";
  }
}

const filters = { cluster: "all", priority: "all", assignee: "all", search: "", view: "all" };
let sortOrder = "none";

function parseDeadline(deadline) {
  const text = (deadline || "").trim();
  if (!text) return null;
  const shortMatch = /^([A-Za-z]{3})\s+(\d{1,2})$/.exec(text);
  if (shortMatch) {
    const d = new Date(`${shortMatch[1]} ${shortMatch[2]}, ${new Date().getFullYear()}`);
    return isNaN(d.getTime()) ? null : d;
  }
  // Full dates (e.g. "Sep 25, 2026") coming from the API's formatted deadline.
  const d = new Date(text);
  return isNaN(d.getTime()) ? null : d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dueBucket(task) {
  const d = parseDeadline(task.deadline);
  if (!d) return null;
  const today = startOfToday();
  if (d.getTime() === today.getTime()) return "due-today";
  return d < today ? "overdue" : "upcoming";
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "");
}

function populateFilterOptions() {
  const clusterSelect = document.getElementById("filterCluster");
  taskClusters.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    clusterSelect.appendChild(opt);
  });

  const prioritySelect = document.getElementById("filterPriority");
  priorities.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    prioritySelect.appendChild(opt);
  });

  const assigneeSelect = document.getElementById("filterAssignee");
  taskRoster.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.name;
    opt.textContent = r.name;
    assigneeSelect.appendChild(opt);
  });
}

// Real users loaded from GET /api/users (already exists from the Requests
// pass), used to populate the New Task form's Assignee dropdown with valid
// user IDs instead of the fictional mock roster.
let formUsers = [];

async function fetchFormUsers() {
  try {
    const response = await fetch("/api/users");
    const result = await response.json();
    if (result.success) return result.data;
  } catch (e) {
    console.error("Could not load users", e);
  }
  return [];
}

async function fetchFormArticles() {
  try {
    const response = await fetch("/api/articles");
    const result = await response.json();
    if (result.success) return result.data;
  } catch (e) {
    console.error("Could not load articles", e);
  }
  return [];
}

async function fetchFormRequests() {
  try {
    const response = await fetch("/api/requests");
    const result = await response.json();
    if (result.success) return result.data;
  } catch (e) {
    console.error("Could not load requests", e);
  }
  return [];
}

// The tasks table's cluster CHECK constraint only allows these three values
// ("General", used by some legacy mock/filter data, isn't a valid DB cluster).
const validTaskClusters = ["Writing", "Creatives", "Online & Digital"];

async function populateFormOptions() {
  formUsers = await fetchFormUsers();
  formArticles = await fetchFormArticles();
  formRequests = await fetchFormRequests();

  const assigneeSelect = document.getElementById("formAssignee");
  assigneeSelect.innerHTML = formUsers.map((u) =>
    `<option value="${u.id}" data-cluster="${u.cluster}">${u.name} (${u.cluster})</option>`
  ).join("");

  document.getElementById("formCluster").innerHTML = validTaskClusters.map((c) =>
    `<option value="${c}">${c}</option>`
  ).join("");

  document.getElementById("formArticle").innerHTML = `<option value="">Not linked</option>` +
    formArticles.map((a) => `<option value="${a.id}">${a.title}</option>`).join("");

  document.getElementById("formRequest").innerHTML = `<option value="">Not linked</option>` +
    formRequests.map((r) => `<option value="${r.id}">#${r.id} — ${r.subject}</option>`).join("");

  assigneeSelect.addEventListener("change", () => {
    const selectedOption = assigneeSelect.selectedOptions[0];
    if (selectedOption && selectedOption.dataset.cluster) document.getElementById("formCluster").value = selectedOption.dataset.cluster;
  });
}

function filteredTasks() {
  const q = filters.search.trim().toLowerCase();
  let rows = tasks.filter((t) =>
    (filters.cluster === "all" || t.cluster === filters.cluster) &&
    (filters.priority === "all" || t.priority === filters.priority) &&
    (filters.assignee === "all" || t.assignee === filters.assignee) &&
    (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  );

  if (filters.view === "mine") rows = rows.filter((t) => t.assignee === CURRENT_USER);
  if (filters.view === "completed") rows = rows.filter((t) => t.status === "Completed");
  if (filters.view === "due-today") rows = rows.filter((t) => t.status !== "Completed" && dueBucket(t) === "due-today");
  if (filters.view === "upcoming") rows = rows.filter((t) => t.status !== "Completed" && dueBucket(t) === "upcoming");
  if (filters.view === "overdue") rows = rows.filter((t) => t.status !== "Completed" && dueBucket(t) === "overdue");

  if (sortOrder !== "none") {
    rows = [...rows].sort((a, b) => {
      const da = parseDeadline(a.deadline);
      const db = parseDeadline(b.deadline);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return sortOrder === "asc" ? da - db : db - da;
    });
  }

  return rows;
}

function renderMetrics() {
  const active = tasks.filter((t) => t.status !== "Completed").length;
  const urgent = tasks.filter((t) => t.priority === "Urgent" && t.status !== "Completed").length;
  const withReminder = tasks.filter((t) => t.reminder).length;
  const completed = tasks.filter((t) => t.status === "Completed").length;

  const metrics = [
    { label: "Active Tasks", count: active },
    { label: "Urgent", count: urgent },
    { label: "With Reminder Set", count: withReminder },
    { label: "Completed", count: completed },
  ];

  document.getElementById("tasksMetrics").innerHTML = metrics.map((m) => `
    <div class="metric-card">
      <span class="metric-count">${m.count}</span>
      <span class="metric-label">${m.label}</span>
    </div>
  `).join("");
}

function logHistory(task, text) {
  task.history = task.history || [];
  task.history.unshift({ text, time: "Just now" });
}

function taskCard(t) {
  const links = [];
  if (t.articleId) links.push(`<a href="newsroom.html?article=${t.articleId}">${t.articleTitle || "Untitled article"}</a>`);
  if (t.requestId) links.push(`<a href="requests.html?request=${t.requestId}">${t.requestSubject || `#${t.requestId}`}</a>`);

  return `
    <div class="task-card priority-${slug(t.priority)}" data-id="${t.id}">
      <div class="task-card-title-row">
        <span class="task-card-title">${t.title}</span>
        <input type="checkbox" class="task-card-complete" ${t.status === "Completed" ? "checked" : ""} data-complete-toggle="${t.id}" title="Mark complete">
      </div>
      <div class="task-card-badges">
        <span class="badge cluster-badge-${slug(t.cluster)}">${t.cluster}</span>
        <span class="badge priority-badge-${slug(t.priority)}">${t.priority}</span>
      </div>
      <div class="task-card-meta">
        <span class="task-card-id">${t.id}</span> · <span>${t.assignee}</span> · <span>Due ${t.deadline}</span>
        ${t.reminder ? `· <span title="Reminder">⏰ ${t.reminder}</span>` : ""}
      </div>
      ${links.length ? `<div class="task-card-links">${links.join(" · ")}</div>` : ""}
    </div>
  `;
}

function renderBoard() {
  const board = document.getElementById("taskBoard");
  const rows = filteredTasks();
  board.innerHTML = statuses.map((status) => {
    const items = rows.filter((t) => t.status === status);
    return `
      <div class="task-column">
        <div class="task-column-header"><span>${status}</span><span>${items.length}</span></div>
        ${items.length ? items.map(taskCard).join("") : "<div class=\"task-empty\">No tasks</div>"}
      </div>
    `;
  }).join("");
}

function renderAll() {
  renderMetrics();
  renderBoard();
}

function initFilters() {
  ["filterCluster", "filterPriority", "filterAssignee"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const key = id.replace("filter", "").toLowerCase();
      filters[key] = e.target.value;
      renderBoard();
    });
  });
  document.getElementById("taskSearch").addEventListener("input", (e) => {
    filters.search = e.target.value;
    renderBoard();
  });
  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    filters.cluster = filters.priority = filters.assignee = "all";
    filters.search = "";
    document.getElementById("filterCluster").value = "all";
    document.getElementById("filterPriority").value = "all";
    document.getElementById("filterAssignee").value = "all";
    document.getElementById("taskSearch").value = "";
    renderBoard();
  });
}

function initViews() {
  const tabs = document.getElementById("taskViews");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    btn.classList.add("is-active");
    filters.view = btn.dataset.view;
    renderBoard();
  });
}

function initSort() {
  const btn = document.getElementById("sortDeadlineBtn");
  const order = { none: "asc", asc: "desc", desc: "none" };
  const label = { none: "Sort: Deadline", asc: "Sort: Deadline ↑", desc: "Sort: Deadline ↓" };
  btn.addEventListener("click", () => {
    sortOrder = order[sortOrder];
    btn.textContent = label[sortOrder];
    renderBoard();
  });
}

function renderTaskHistory(task) {
  const list = document.getElementById("taskHistoryList");
  const meta = document.getElementById("taskFormMeta");
  const deleteBtn = document.getElementById("taskFormDelete");
  const historySection = document.getElementById("taskHistorySection");

  if (!task) {
    meta.hidden = true;
    historySection.hidden = true;
    deleteBtn.hidden = true;
    return;
  }

  meta.hidden = false;
  historySection.hidden = false;
  deleteBtn.hidden = false;
  document.getElementById("taskMetaId").textContent = task.id;
  document.getElementById("taskMetaCreated").textContent = task.dateCreated;
  list.innerHTML = (task.history || []).map((h) => `
    <div class="detail-list-item">
      <div class="detail-list-item-title">${h.text}</div>
      <div class="detail-list-item-meta">${h.time}</div>
    </div>
  `).join("");
}

function openTaskForm(task) {
  document.getElementById("taskFormTitle").textContent = task ? "Edit Task" : "New Task";
  document.getElementById("taskFormSubmit").textContent = task ? "Save Changes" : "Create Task";
  document.getElementById("formTaskId").value = task ? task.id : "";
  document.getElementById("formTitle").value = task ? task.title : "";
  document.getElementById("formDescription").value = task ? task.description : "";
  document.getElementById("formAssignee").value = task ? (task.assigneeId != null ? String(task.assigneeId) : "") : (formUsers[0] ? String(formUsers[0].id) : "");
  document.getElementById("formCluster").value = task ? task.cluster : taskClusters[0];
  document.getElementById("formPriority").value = task ? task.priority : "Normal";
  document.getElementById("formStatus").value = task ? task.status : "Not Started";
  document.getElementById("formDeadline").value = task ? task.deadlineRaw || "" : "";
  document.getElementById("formReminder").value = task ? task.reminder : "";
  document.getElementById("formArticle").value = task ? task.articleId || "" : "";
  document.getElementById("formRequest").value = task ? task.requestId || "" : "";
  renderTaskHistory(task);
  document.getElementById("taskFormModalOverlay").classList.add("is-open");
}

function closeTaskForm() {
  document.getElementById("taskFormModalOverlay").classList.remove("is-open");
  document.getElementById("taskForm").reset();
  document.getElementById("taskFormError").hidden = true;
}

function nextTaskId() {
  const nums = tasks.map((t) => parseInt(String(t.id).replace("TASK-", ""), 10)).filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `TASK-${String(next).padStart(3, "0")}`;
}

function initTaskForm() {
  document.getElementById("newTaskBtn").addEventListener("click", () => openTaskForm(null));
  document.getElementById("taskFormClose").addEventListener("click", closeTaskForm);
  document.getElementById("taskFormCancel").addEventListener("click", closeTaskForm);
  document.getElementById("taskFormModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "taskFormModalOverlay") closeTaskForm();
  });
  document.getElementById("taskFormDelete").addEventListener("click", async () => {
    const id = document.getElementById("formTaskId").value;
    if (!id) return;
    if (!window.confirm("Delete this task? This cannot be undone.")) return;

    const errorEl = document.getElementById("taskFormError");
    errorEl.hidden = true;

    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete task");
      }

      // PostgreSQL row is gone: close the form and reload the list from
      // the API so the task disappears from the UI.
      closeTaskForm();
      await fetchTasks();
    } catch (err) {
      console.error("Could not delete task", err);
      errorEl.textContent = "Failed to delete task. Please try again.";
      errorEl.hidden = false;
    }
  });

  document.getElementById("taskForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("formTaskId").value;

    if (id) {
      // Updating an existing task: send it to PostgreSQL via PATCH /api/tasks/:id.
      const requestBody = {
        title: document.getElementById("formTitle").value.trim(),
        description: document.getElementById("formDescription").value.trim() || null,
        assignee_id: document.getElementById("formAssignee").value ? Number(document.getElementById("formAssignee").value) : null,
        cluster: document.getElementById("formCluster").value,
        priority: document.getElementById("formPriority").value,
        status: document.getElementById("formStatus").value,
        deadline: document.getElementById("formDeadline").value || null,
        article_id: document.getElementById("formArticle").value ? Number(document.getElementById("formArticle").value) : null,
        request_id: document.getElementById("formRequest").value ? Number(document.getElementById("formRequest").value) : null,
      };

      const submitBtn = document.getElementById("taskFormSubmit");
      const errorEl = document.getElementById("taskFormError");
      errorEl.hidden = true;

      try {
        submitBtn.disabled = true;

        const response = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to update task");
        }

        // PostgreSQL is the source of truth: reload the list from the API
        // instead of mutating the local object directly.
        await fetchTasks();
        closeTaskForm();
      } catch (err) {
        console.error("Could not update task", err);
        errorEl.textContent = "Failed to update task. Please try again.";
        errorEl.hidden = false;
      } finally {
        submitBtn.disabled = false;
      }
      return;
    }

    // Creating a new task: send it to PostgreSQL via POST /api/tasks.
    const requestBody = {
      title: document.getElementById("formTitle").value.trim(),
      description: document.getElementById("formDescription").value.trim() || null,
      assignee_id: document.getElementById("formAssignee").value ? Number(document.getElementById("formAssignee").value) : null,
      cluster: document.getElementById("formCluster").value,
      priority: document.getElementById("formPriority").value,
      status: document.getElementById("formStatus").value,
      deadline: document.getElementById("formDeadline").value || null,
      article_id: document.getElementById("formArticle").value ? Number(document.getElementById("formArticle").value) : null,
      request_id: document.getElementById("formRequest").value ? Number(document.getElementById("formRequest").value) : null,
    };

    const submitBtn = document.getElementById("taskFormSubmit");
    const errorEl = document.getElementById("taskFormError");
    errorEl.hidden = true;

    try {
      submitBtn.disabled = true;

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create task");
      }

      // PostgreSQL is the source of truth: reload the list from the API
      // (the same function Pass 6A uses) instead of inventing a local task.
      await fetchTasks();
      closeTaskForm();
    } catch (err) {
      console.error("Could not create task", err);
      errorEl.textContent = "Failed to create task. Please try again.";
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function initBoardClicks() {
  document.getElementById("taskBoard").addEventListener("click", (e) => {
    if (e.target.dataset.completeToggle) return;
    const card = e.target.closest(".task-card");
    if (!card) return;
    const task = tasks.find((t) => String(t.id) === String(card.dataset.id));
    if (task) openTaskForm(task);
  });

  document.getElementById("taskBoard").addEventListener("change", (e) => {
    const id = e.target.dataset.completeToggle;
    if (!id) return;
    const task = tasks.find((t) => String(t.id) === String(id));
    if (task) {
      task.status = e.target.checked ? "Completed" : "Not Started";
      logHistory(task, e.target.checked ? "Marked complete" : "Reopened");
      saveTasks();
      renderAll();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  populateFilterOptions();
  await populateFormOptions();
  initFilters();
  initViews();
  initSort();
  initTaskForm();
  initBoardClicks();
  await fetchTasks();
});