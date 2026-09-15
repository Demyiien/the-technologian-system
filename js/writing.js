// Pipeline stages now mirror the articles table's real status values
// (see server/schema.sql VALID_STATUSES), instead of the old mock
// stage names ("Pitch", "Assigned", ...) which don't exist in the DB.
const pipelineStages = ["Draft", "In Progress", "For Review", "Ready", "Published"];

// Rough progress-bar percentage per status, since the DB doesn't store a
// numeric progress value. Kept simple on purpose — not invented per-article.
const statusProgress = { "Draft": 0, "In Progress": 40, "For Review": 70, "Ready": 90, "Published": 100 };

// Articles are now loaded from PostgreSQL via GET /api/articles (see
// fetchArticles() below). This array just holds whatever was fetched.
let writingArticles = [];

const roster = [
  { name: "Rico Alonzo", role: "Cluster Head" },
  { name: "Carlo Mendoza", role: "Section Editor" },
  { name: "Maria Santos", role: "News Writer" },
  { name: "Ana Cruz", role: "Editorial Writer" },
  { name: "Jake Lim", role: "News Writer" },
];

const writingActivity = [
  { text: "Ana Cruz was assigned \"Editorial: On Academic Freedom\"", time: "10 minutes ago" },
  { text: "Maria Santos moved \"Enrollment Numbers Hit Record High\" to Editing", time: "12 minutes ago" },
  { text: "Carlo Mendoza commented on the enrollment draft", time: "1 hour ago" },
  { text: "Jake Lim was assigned \"Intramurals Schedule Released\"", time: "2 hours ago" },
  { text: "\"New Library Hours Announced\" was published", time: "2 days ago" },
];

let assignmentFilter = "all";

// Formats an ISO date string (e.g. "2026-09-25T00:00:00.000Z") into the
// short "Sep 25" form the existing UI expects (pipeline cards, calendar).
function formatDate(isoString) {
  if (!isoString) return "TBD";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Maps an article row returned by GET /api/articles (snake_case DB fields,
// plus the joined author_name) into the shape the existing Writing UI
// already expects. "editor" isn't a column in the articles table, so it's
// left blank rather than invented. tasks/requests aren't nested under an
// article by the API, so those stay empty arrays.
function mapApiArticle(apiArticle) {
  return {
    id: apiArticle.id,
    title: apiArticle.title || "",
    description: apiArticle.description || "",
    writer: apiArticle.author_name || "",
    authorId: apiArticle.author_id,
    editor: "",
    status: apiArticle.status || "Draft",
    deadline: formatDate(apiArticle.deadline),
    deadlineRaw: apiArticle.deadline ? String(apiArticle.deadline).slice(0, 10) : "",
    progress: statusProgress[apiArticle.status] ?? 0,
    tasks: [],
    requests: [],
  };
}

// Loads articles from PostgreSQL through the backend API and renders them
// using the existing UI. Shows a friendly loading/error/empty message
// instead of a raw error if the request fails.
async function fetchArticles() {
  const statusEl = document.getElementById("writingStatusMessage");
  statusEl.hidden = false;
  statusEl.textContent = "Loading articles...";

  try {
    const response = await fetch("/api/articles");
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "API returned an error");

    writingArticles = result.data.map(mapApiArticle);
    statusEl.hidden = writingArticles.length !== 0;
    statusEl.textContent = "No articles found.";
    renderAssignmentTabs();
    renderAll();
  } catch (e) {
    console.error("Could not load articles from the API", e);
    statusEl.textContent = "Failed to load articles. Please try again.";
    statusEl.hidden = false;
    writingArticles = [];
    renderAll();
  }
}

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("");
}

function renderMetrics() {
  const activeAssignments = writingArticles.filter((a) => !["Published", "Archived"].includes(a.status)).length;
  const pendingRequests = writingArticles.reduce((sum, a) => sum + a.requests.length, 0);
  const tasksDue = writingArticles.reduce((sum, a) => sum + a.tasks.filter((t) => !t.done).length, 0);
  const inEditing = writingArticles.filter((a) => a.status === "Editing").length;

  const metrics = [
    { label: "Active Assignments", count: activeAssignments },
    { label: "Pending Research Requests", count: pendingRequests },
    { label: "Tasks Due", count: tasksDue },
    { label: "Articles in Editing", count: inEditing },
  ];

  document.getElementById("writingMetrics").innerHTML = metrics.map((m) => `
    <div class="metric-card">
      <span class="metric-count">${m.count}</span>
      <span class="metric-label">${m.label}</span>
    </div>
  `).join("");
}

function renderPipeline() {
  const board = document.getElementById("pipelineBoard");
  board.innerHTML = pipelineStages.map((stage) => {
    const items = writingArticles.filter((a) => a.status === stage);
    return `
      <div class="pipeline-column">
        <div class="pipeline-column-header"><span>${stage}</span><span>${items.length}</span></div>
        ${items.length ? items.map((a) => `
          <a class="pipeline-card" href="newsroom.html?article=${a.id}">
            <div class="pipeline-card-title">${a.title}</div>
            <div class="pipeline-card-meta">${a.writer || "Unassigned"} · ${a.deadline}</div>
          </a>
        `).join("") : "<div class=\"pipeline-empty\">No articles</div>"}
      </div>
    `;
  }).join("");
}

function renderAssignments() {
  const rows = assignmentFilter === "all"
    ? writingArticles
    : writingArticles.filter((a) => a.writer === assignmentFilter);

  document.getElementById("assignmentsTableBody").innerHTML = rows.map((a) => `
    <tr>
      <td>${a.title}</td>
      <td>${a.writer || "—"}</td>
      <td>${a.editor || "—"}</td>
      <td><span class="badge">${a.status}</span></td>
      <td>${a.deadline}</td>
      <td>
        <div class="progress-row">
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${a.progress}%"></div></div>
          <span class="progress-value">${a.progress}%</span>
        </div>
      </td>
      <td>
        <div style="display:flex; gap:var(--space-xs, 6px);">
          <button type="button" class="btn btn-ghost btn-sm" data-edit-article="${a.id}">Edit</button>
          <button type="button" class="btn btn-ghost btn-sm" data-delete-article="${a.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderTasks() {
  const allTasks = writingArticles.flatMap((a) => a.tasks.map((t) => ({ ...t, articleId: a.id, articleTitle: a.title })));
  document.getElementById("taskList").innerHTML = allTasks.length
    ? allTasks.map((t) => `
        <div class="detail-list-item">
          <div class="task-checkbox-row">
            <input type="checkbox" ${t.done ? "checked" : ""} data-task-toggle="${t.articleId}:${t.id}">
            <div>
              <div class="detail-list-item-title">${t.title}</div>
              <div class="detail-list-item-meta">${t.articleTitle} · ${t.assignee} · <a href="newsroom.html?article=${t.articleId}">View in Newsroom</a></div>
            </div>
          </div>
        </div>
      `).join("")
    : "<div class=\"empty-state\"><p class=\"empty-state-title\">No open tasks</p></div>";
}

function renderRequests() {
  const allRequests = writingArticles.flatMap((a) => a.requests.map((r) => ({ ...r, articleId: a.id, articleTitle: a.title })));
  document.getElementById("requestList").innerHTML = allRequests.length
    ? allRequests.map((r) => `
        <div class="detail-list-item">
          <div class="detail-list-item-header">
            <span class="detail-list-item-title">${r.title}</span>
            <span class="badge">${r.status}</span>
          </div>
          <div class="detail-list-item-meta">${r.articleTitle} · <a href="newsroom.html?article=${r.articleId}">View reference</a></div>
        </div>
      `).join("")
    : "<div class=\"empty-state\"><p class=\"empty-state-title\">No pending requests</p></div>";
}

function renderEditingStatus() {
  const editing = writingArticles.filter((a) => a.status === "For Review");
  document.getElementById("editingList").innerHTML = editing.length
    ? editing.map((a) => `
        <div class="detail-list-item">
          <div class="detail-list-item-header">
            <span class="detail-list-item-title">${a.title}</span>
            <span class="badge">${a.progress}%</span>
          </div>
          <div class="detail-list-item-meta">Editor: ${a.editor || "Unassigned"} · Due ${a.deadline}</div>
        </div>
      `).join("")
    : "<div class=\"empty-state\"><p class=\"empty-state-title\">Nothing in editing right now</p></div>";
}

function renderCalendar() {
  const upcoming = writingArticles
    .filter((a) => !["Published", "Archived"].includes(a.status))
    .map((a) => {
      const [month, day] = a.deadline.split(" ");
      return { day, month, title: a.title, meta: `Due · ${a.status}` };
    });

  document.getElementById("writingCalendar").innerHTML = upcoming.length
    ? upcoming.map((e) => `
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
      `).join("")
    : "<li class=\"form-hint\">No upcoming deadlines.</li>";
}

function renderRoster() {
  document.getElementById("rosterGrid").innerHTML = roster.map((m) => {
    const load = writingArticles.filter((a) => a.writer === m.name && !["Published", "Archived"].includes(a.status)).length;
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
  document.getElementById("writingActivityList").innerHTML = writingActivity.map((a) => `
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
  renderPipeline();
  renderAssignments();
  renderTasks();
  renderRequests();
  renderEditingStatus();
  renderCalendar();
  renderRoster();
}

// Rebuilds the assignment filter tabs from the writers actually present in
// the loaded articles, replacing the old hardcoded mock names.
function renderAssignmentTabs() {
  const tabs = document.getElementById("assignmentTabs");
  const writers = [...new Set(writingArticles.map((a) => a.writer).filter(Boolean))];
  const activeFilter = tabs.querySelector(".tab.is-active")?.dataset.filter || "all";
  assignmentFilter = writers.includes(activeFilter) || activeFilter === "all" ? activeFilter : "all";

  tabs.innerHTML = `<button class="tab${assignmentFilter === "all" ? " is-active" : ""}" data-filter="all">All</button>` +
    writers.map((w) => `<button class="tab${assignmentFilter === w ? " is-active" : ""}" data-filter="${w}">${w}</button>`).join("");
}

function initAssignmentTabs() {
  const tabs = document.getElementById("assignmentTabs");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    btn.classList.add("is-active");
    assignmentFilter = btn.dataset.filter;
    renderAssignments();
  });
}

function initTaskToggles() {
  document.getElementById("taskList").addEventListener("change", (e) => {
    const key = e.target.dataset.taskToggle;
    if (!key) return;
    const [articleId, taskId] = key.split(":");
    const article = writingArticles.find((a) => a.id === articleId);
    const task = article && article.tasks.find((t) => t.id === taskId);
    if (task) {
      task.done = e.target.checked;
      renderMetrics();
      renderTasks();
    }
  });
}

// Real users loaded from GET /api/users, used to populate the New Article
// form's Author dropdown with valid user IDs.
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

async function populateArticleFormOptions() {
  formUsers = await fetchFormUsers();
  const authorSelect = document.getElementById("formArticleAuthor");
  authorSelect.innerHTML = formUsers.map((u) => `<option value="${u.id}">${u.name}</option>`).join("");
}

// Tracks whether articleForm is currently in create mode or edit mode.
// null = creating a new article; otherwise the id of the article being edited.
let editingArticleId = null;

function openArticleForm() {
  editingArticleId = null;
  document.getElementById("articleForm").reset();
  document.getElementById("articleFormError").hidden = true;
  document.getElementById("articleFormModalTitle").textContent = "New Article";
  document.getElementById("articleFormSubmit").textContent = "Create Article";
  document.getElementById("articleFormModalOverlay").classList.add("is-open");
}

// Opens the existing article modal pre-filled with the selected article's
// current values, for PASS 7C's update flow. Reuses the same form/modal
// used for article creation instead of building a separate edit UI.
function openArticleEditForm(articleId) {
  const article = writingArticles.find((a) => String(a.id) === String(articleId));
  if (!article) return;

  editingArticleId = article.id;
  document.getElementById("articleForm").reset();
  document.getElementById("articleFormError").hidden = true;
  document.getElementById("articleFormModalTitle").textContent = "Edit Article";
  document.getElementById("articleFormSubmit").textContent = "Save Changes";

  document.getElementById("formArticleTitle").value = article.title || "";
  document.getElementById("formArticleDescription").value = article.description || "";
  document.getElementById("formArticleStatus").value = article.status || "Draft";
  if (article.authorId !== undefined && article.authorId !== null) {
    document.getElementById("formArticleAuthor").value = String(article.authorId);
  }
  document.getElementById("formArticleDeadline").value = article.deadlineRaw || "";

  document.getElementById("articleFormModalOverlay").classList.add("is-open");
}

function closeArticleForm() {
  document.getElementById("articleFormModalOverlay").classList.remove("is-open");
  document.getElementById("articleForm").reset();
  document.getElementById("articleFormError").hidden = true;
  editingArticleId = null;
}

function initArticleForm() {
  document.getElementById("newArticleBtn").addEventListener("click", openArticleForm);
  document.getElementById("articleFormClose").addEventListener("click", closeArticleForm);
  document.getElementById("articleFormCancel").addEventListener("click", closeArticleForm);
  document.getElementById("articleFormModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "articleFormModalOverlay") closeArticleForm();
  });

  // Existing Edit button in the Article Assignments table opens the same
  // modal in edit mode instead of a separate edit interface.
  document.getElementById("assignmentsTableBody").addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit-article]");
    if (editBtn) {
      openArticleEditForm(editBtn.dataset.editArticle);
      return;
    }
    const deleteBtn = e.target.closest("[data-delete-article]");
    if (deleteBtn) {
      openDeleteArticleModal(deleteBtn.dataset.deleteArticle);
    }
  });

  document.getElementById("articleForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("formArticleTitle").value.trim();
    const authorId = document.getElementById("formArticleAuthor").value;
    const errorEl = document.getElementById("articleFormError");
    errorEl.hidden = true;

    if (!title || !authorId) {
      errorEl.textContent = "Title and author are required.";
      errorEl.hidden = false;
      return;
    }

    const requestBody = {
      title,
      description: document.getElementById("formArticleDescription").value.trim() || null,
      status: document.getElementById("formArticleStatus").value,
      author_id: Number(authorId),
      deadline: document.getElementById("formArticleDeadline").value || null,
    };

    const submitBtn = document.getElementById("articleFormSubmit");
    const isEditing = editingArticleId !== null;

    try {
      submitBtn.disabled = true;

      const response = await fetch(
        isEditing ? `/api/articles/${editingArticleId}` : "/api/articles",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || (isEditing ? "Failed to update article" : "Failed to create article"));
      }

      // PostgreSQL is the source of truth: reload the list from the API
      // instead of patching the local array by hand.
      closeArticleForm();
      await fetchArticles();
    } catch (err) {
      console.error(isEditing ? "Could not update article" : "Could not create article", err);
      const fallback = isEditing ? "Failed to update article. Please try again." : "Failed to create article. Please try again.";
      errorEl.textContent = err.message && err.message !== "Failed to create article" && err.message !== "Failed to update article"
        ? err.message
        : fallback;
      errorEl.hidden = false;
      // Keep the form open with the user's entered changes on failure.
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// Tracks which article the delete confirmation modal is currently targeting.
let deletingArticleId = null;

function openDeleteArticleModal(articleId) {
  const article = writingArticles.find((a) => String(a.id) === String(articleId));
  deletingArticleId = articleId;
  document.getElementById("deleteArticleMessage").textContent = article
    ? `Are you sure you want to delete "${article.title}"?`
    : "Are you sure you want to delete this article?";
  document.getElementById("deleteArticleError").hidden = true;
  document.getElementById("deleteArticleModalOverlay").classList.add("is-open");
}

function closeDeleteArticleModal() {
  document.getElementById("deleteArticleModalOverlay").classList.remove("is-open");
  document.getElementById("deleteArticleError").hidden = true;
  deletingArticleId = null;
}

function initDeleteArticleModal() {
  document.getElementById("deleteArticleClose").addEventListener("click", closeDeleteArticleModal);
  document.getElementById("deleteArticleCancel").addEventListener("click", closeDeleteArticleModal);
  document.getElementById("deleteArticleModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "deleteArticleModalOverlay") closeDeleteArticleModal();
  });

  document.getElementById("deleteArticleConfirm").addEventListener("click", async () => {
    if (deletingArticleId === null) return;
    const confirmBtn = document.getElementById("deleteArticleConfirm");
    const errorEl = document.getElementById("deleteArticleError");
    errorEl.hidden = true;

    try {
      confirmBtn.disabled = true;

      const response = await fetch(`/api/articles/${deletingArticleId}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete article");
      }

      // PostgreSQL is the source of truth: reload the list from the API
      // rather than removing the article from the local array only.
      closeDeleteArticleModal();
      await fetchArticles();
    } catch (err) {
      console.error("Could not delete article", err);
      // Foreign-key conflicts (article referenced by a request/task) land
      // here too; the backend's message is shown as-is and the article
      // stays visible/untouched.
      errorEl.textContent = err.message || "Failed to delete article. Please try again.";
      errorEl.hidden = false;
    } finally {
      confirmBtn.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  renderActivity();
  initAssignmentTabs();
  initTaskToggles();
  initArticleForm();
  initDeleteArticleModal();
  await populateArticleFormOptions();
  await fetchArticles();
});