// Global data stores
let articlesData = [];
let requestsData = [];
let tasksData = [];

// Status styling maps
const statusBadgeClass = {
  "Draft": "badge",
  "Not Started": "badge",
  "Pending": "badge-warning",
  "In Progress": "badge-info",
  "For Review": "badge-warning",
  "Approved": "badge-info",
  "Published": "badge-success",
  "Completed": "badge-success"
};

// Map HTML tab dataset filters to actual database statuses
const storyFilterMap = {
  "draft": ["Draft", "Not Started"],
  "in-review": ["In Progress", "For Review"],
  "approved": ["Approved"],
  "published": ["Published", "Completed"]
};

// Utility to safely unwrap API responses (handles { data: [...] } or direct arrays)
function extractData(data) {
    if (!data) return [];
    return Array.isArray(data) ? data : (data.data || Object.values(data).find(Array.isArray) || []);
}

// 1. Fetch Data
async function fetchDashboardData() {
  try {
    const endpoints = [
      fetch('/api/articles').catch(() => ({ ok: false })),
      fetch('/api/requests').catch(() => ({ ok: false })),
      fetch('/api/tasks').catch(() => ({ ok: false }))
    ];

    const [articlesRes, requestsRes, tasksRes] = await Promise.all(endpoints);

    if (articlesRes.ok) articlesData = extractData(await articlesRes.json());
    if (requestsRes.ok) requestsData = extractData(await requestsRes.json());
    if (tasksRes.ok) tasksData = extractData(await tasksRes.json());

    renderAll();
  } catch (error) {
    console.error("Dashboard API Error:", error);
    showError("Unable to load live dashboard data. Please check your connection.");
  }
}

// 2. Render Functions
function renderAll() {
  setDashDate();
  renderAttention();
  renderStoryTable("all");
  renderEvents();
  renderActivity();
  renderClusters();
}

function setDashDate() {
  const today = new Date();
  const formatted = today.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const dateEl = document.getElementById("dashDate");
  if (dateEl) dateEl.textContent = formatted;
}

function showError(message) {
  const grid = document.getElementById("attentionGrid");
  if (grid) {
      grid.innerHTML = `<div class="calendar-error" style="display:block; grid-column: 1 / -1;">${message}</div>`;
  }
}

// STEP 3, 4, 5: Connect Statistics to "Needs Attention" Grid
function renderAttention() {
  const grid = document.getElementById("attentionGrid");
  if (!grid) return;

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate stats from real data
  const tasksDueToday = tasksData.filter(t => t.deadline && t.deadline.startsWith(todayStr) && t.status !== 'Completed').length;
  const overdueTasks = tasksData.filter(t => t.deadline && t.deadline < todayStr && t.status !== 'Completed').length;
  const pendingRequests = requestsData.filter(r => r.status === 'Pending').length;
  const articlesReview = articlesData.filter(a => a.status === 'For Review').length;
  
  const allDeadlines = [...tasksData, ...requestsData, ...articlesData]
      .filter(x => x.deadline && x.deadline > todayStr && !['Completed', 'Published'].includes(x.status)).length;

  const attentionStats = [
    { label: "Tasks Due Today", count: tasksDueToday, urgent: tasksDueToday > 0 },
    { label: "Overdue Tasks", count: overdueTasks, urgent: overdueTasks > 0 },
    { label: "Pending Requests", count: pendingRequests, urgent: false },
    { label: "Articles For Review", count: articlesReview, urgent: false },
    { label: "Upcoming Deadlines", count: allDeadlines, urgent: false },
  ];

  grid.innerHTML = attentionStats.map((item) => `
    <button class="attention-card ${item.urgent ? "is-urgent" : ""}" type="button">
      <span class="attention-count">${item.count}</span>
      <span class="attention-label">${item.label}</span>
    </button>
  `).join("");
}

// Render Story Activity (Articles)
function renderStoryTable(filter) {
  const tbody = document.getElementById("storyTableBody");
  const emptyState = document.getElementById("storyEmptyState");
  if (!tbody || !emptyState) return;

  let rows = articlesData;

  // Filter based on tab mapping
  if (filter !== "all") {
    const allowedStatuses = storyFilterMap[filter] || [];
    rows = articlesData.filter((a) => allowedStatuses.includes(a.status));
  }

  emptyState.hidden = rows.length !== 0;

  tbody.innerHTML = rows.map((a) => {
    const status = a.status || 'Draft';
    const badgeClass = statusBadgeClass[status] || 'badge';
    const deadline = a.deadline ? new Date(a.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No deadline';
    const progress = getProgressForStatus(status);

    return `
      <tr>
        <td>${a.title || 'Untitled'}</td>
        <td>Writing</td> <!-- Articles implicitly belong to writing in this MVP -->
        <td>Author #${a.author_id || 'N/A'}</td>
        <td><span class="badge ${badgeClass}">${status}</span></td>
        <td>${deadline}</td>
        <td>
          <div class="progress-row">
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
            <span class="progress-value">${progress}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function getProgressForStatus(status) {
    switch((status || '').toLowerCase()) {
        case 'draft': return 25;
        case 'in progress': return 50;
        case 'for review': return 80;
        case 'approved': return 90;
        case 'published': return 100;
        case 'completed': return 100;
        default: return 10;
    }
}

// STEP 6: Upcoming Deadlines combined from all modules
function renderEvents() {
  const list = document.getElementById("eventList");
  if (!list) return;

  const allItems = [
    ...articlesData.map(a => ({...a, _type: 'Article', _title: a.title, _cluster: 'Writing'})),
    ...requestsData.map(r => ({...r, _type: 'Request', _title: r.subject, _cluster: r.target_cluster})),
    ...tasksData.map(t => ({...t, _type: 'Task', _title: t.title, _cluster: t.cluster}))
  ];

  // Filter items with deadlines, sort nearest first
  const upcoming = allItems
    .filter(i => i.deadline && !['Completed', 'Published'].includes(i.status))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5); // Limit to top 5

  if (upcoming.length === 0) {
      list.innerHTML = `<li class="activity-item"><span class="activity-text">No upcoming deadlines</span></li>`;
      return;
  }

  list.innerHTML = upcoming.map((e) => {
    const d = new Date(e.deadline);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'short' });
    const clusterText = e._cluster ? ` · ${e._cluster}` : '';

    return `
      <li class="event-item">
        <div class="event-date">
          <span class="event-date-day">${day}</span>
          <span class="event-date-month">${month}</span>
        </div>
        <div class="event-body">
          <span class="event-title">${e._title || 'Untitled'} <span class="badge ${statusBadgeClass[e.status] || 'badge'}">${e._type}</span></span>
          <span class="event-meta">${e.status || 'Pending'}${clusterText}</span>
        </div>
      </li>
    `;
  }).join("");
}

// STEP 11: Recent Activity connected to real database insertions
function renderActivity() {
  const list = document.getElementById("activityList");
  if (!list) return;

  const allItems = [
    ...articlesData.map(a => ({...a, _type: 'Article', _title: a.title})),
    ...requestsData.map(r => ({...r, _type: 'Request', _title: r.subject})),
    ...tasksData.map(t => ({...t, _type: 'Task', _title: t.title}))
  ];

  // Filter out items without creation dates and sort newest first
  const recent = allItems
    .filter(i => i.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (recent.length === 0) {
      list.innerHTML = `<li class="activity-item"><span class="activity-text">No recent activity</span></li>`;
      return;
  }

  list.innerHTML = recent.map((a) => {
    let actionText = `New ${a._type} created: "${a._title || 'Untitled'}"`;
    if (a.status === 'Completed' || a.status === 'Published') {
        actionText = `${a._type} "${a._title}" was marked as ${a.status}`;
    }

    return `
      <li class="activity-item">
        <span class="activity-icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
        </span>
        <div class="activity-body">
          <span class="activity-text">${actionText}</span>
          <span class="activity-time">${timeAgo(a.updated_at || a.created_at)}</span>
        </div>
      </li>
    `;
  }).join("");
}

function timeAgo(dateString) {
  if (!dateString) return 'Recently';
  const d = new Date(dateString);
  const diffMin = Math.round((new Date() - d) / 60000);
  if (diffMin < 60) return `${diffMin || 1} minutes ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hours ago`;
  return `${Math.round(diffHr / 24)} days ago`;
}

// Cluster Overview Aggregation
function renderClusters() {
  const grid = document.getElementById("clusterGrid");
  if (!grid) return;

  const clusterNames = ["Writing", "Creatives", "Online & Digital"];
  
  const metrics = clusterNames.map(name => {
    // Exact or partial match for clusters
    const activeTasks = tasksData.filter(t => t.cluster && t.cluster.includes(name.split(' ')[0]) && t.status !== 'Completed').length;
    const pendingReqs = requestsData.filter(r => r.target_cluster && r.target_cluster.includes(name.split(' ')[0]) && r.status === 'Pending').length;
    
    // Articles implicitly belong to writing
    const articlesInProgress = name === "Writing" ? articlesData.filter(a => ['Draft', 'In Progress', 'For Review'].includes(a.status)).length : 0;

    return { name, activeTasks, pendingReqs, articlesInProgress };
  });

  grid.innerHTML = metrics.map((c) => `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${c.name}</h3>
      </div>
      <div class="cluster-card-metrics">
        <div class="cluster-metric"><span>Active Tasks</span><strong>${c.activeTasks}</strong></div>
        <div class="cluster-metric"><span>Pending Requests</span><strong>${c.pendingReqs}</strong></div>
        <div class="cluster-metric"><span>Articles in Progress</span><strong>${c.articlesInProgress}</strong></div>
      </div>
    </div>
  `).join("");
}

function initStoryTabs() {
  const tabs = document.getElementById("storyTabs");
  if (!tabs) return;

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    btn.classList.add("is-active");
    renderStoryTable(btn.dataset.filter);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initStoryTabs();
  fetchDashboardData();
});