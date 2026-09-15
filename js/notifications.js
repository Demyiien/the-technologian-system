const STORAGE_KEY = "technologian_notifications";

const notificationTypes = [
  "New request", "Task assigned", "Deadline approaching", "Article approved", "Revision requested",
  "Mention", "New group message", "File uploaded", "Request completed",
];

const defaultNotifications = [
  {
    id: "N001", type: "New request", text: "Bea Fernandez sent a Technical Support request to Online & Digital",
    meta: "Requests · REQ-005", time: "10 minutes ago", read: false, link: "requests.html?request=REQ-005",
  },
  {
    id: "N002", type: "Task assigned", text: "You were assigned \"Update site favicon and metadata\"",
    meta: "Tasks · TASK-011", time: "25 minutes ago", read: false, link: "tasks.html",
  },
  {
    id: "N003", type: "Deadline approaching", text: "Research request due tomorrow",
    meta: "Online & Digital · REQ-001", time: "40 minutes ago", read: false, link: "requests.html?request=REQ-001",
  },
  {
    id: "N004", type: "Article approved", text: "\"New Library Hours Announced\" was approved",
    meta: "Writing · Newsroom", time: "1 hour ago", read: false, link: "newsroom.html?article=a5",
  },
  {
    id: "N005", type: "Revision requested", text: "Rico Alonzo requested a revision on the editorial cartoon",
    meta: "Creatives · Editorial: On Academic Freedom", time: "2 hours ago", read: true, link: "creatives.html",
  },
  {
    id: "N006", type: "Mention", text: "Carlo Mendoza mentioned you in a comment on the enrollment draft",
    meta: "Newsroom · Enrollment Numbers Hit Record High", time: "3 hours ago", read: false, link: "newsroom.html?article=a1",
  },
  {
    id: "N007", type: "New group message", text: "New message in the Writing Cluster group chat",
    meta: "Chat · Writing", time: "3 hours ago", read: true, link: "",
  },
  {
    id: "N008", type: "File uploaded", text: "Miguel Torres uploaded 12 files to Foundation Week",
    meta: "Creatives · Behind the Lens: Foundation Week", time: "4 hours ago", read: true, link: "creatives.html",
  },
  {
    id: "N009", type: "Deadline approaching", text: "Article deadline in 2 days",
    meta: "Writing · Enrollment Numbers Hit Record High", time: "5 hours ago", read: true, link: "newsroom.html?article=a1",
  },
  {
    id: "N010", type: "Request completed", text: "\"Caption Copy for Foundation Week Gallery\" was marked completed",
    meta: "Requests · REQ-008", time: "1 day ago", read: true, link: "requests.html?request=REQ-008",
  },
  {
    id: "N011", type: "Deadline approaching", text: "Editorial meeting at 10:00 AM",
    meta: "Writing · Calendar", time: "1 day ago", read: true, link: "calendar.html",
  },
  {
    id: "N012", type: "New request", text: "Jake Lim sent a Social Media request to Online & Digital",
    meta: "Requests · REQ-009", time: "1 day ago", read: true, link: "requests.html?request=REQ-009",
  },
  {
    id: "N013", type: "Task assigned", text: "Ella Navarro was assigned \"Verify enrollment historical data\"",
    meta: "Tasks · TASK-009", time: "2 days ago", read: true, link: "tasks.html",
  },
  {
    id: "N014", type: "Article approved", text: "\"Student Council Election Results\" was approved for publishing",
    meta: "Writing · Newsroom", time: "2 days ago", read: true, link: "newsroom.html?article=a3",
  },
];

function loadNotifications() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Could not load saved notifications", e);
  }
  return defaultNotifications;
}

let notifications = loadNotifications();

function saveNotifications() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error("Could not save notifications", e);
  }
}

const typeIcons = {
  "New request": '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  "Task assigned": '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M8 12l3 3 5-6"/>',
  "Deadline approaching": '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>',
  "Article approved": '<path d="M20 6 9 17l-5-5"/>',
  "Revision requested": '<path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/>',
  "Mention": '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5"/>',
  "New group message": '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  "File uploaded": '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>',
  "Request completed": '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
};

const filters = { unreadOnly: false, type: "all" };

function populateTypeFilter() {
  const select = document.getElementById("filterType");
  notificationTypes.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });
}

function filteredNotifications() {
  return notifications.filter((n) =>
    (!filters.unreadOnly || !n.read) &&
    (filters.type === "all" || n.type === filters.type)
  );
}

function renderMetrics() {
  const unread = notifications.filter((n) => !n.read).length;
  const mentions = notifications.filter((n) => n.type === "Mention").length;
  const deadlines = notifications.filter((n) => n.type === "Deadline approaching").length;
  const today = notifications.filter((n) => n.time.includes("minutes ago") || n.time.includes("hour")).length;

  const metrics = [
    { label: "Unread", count: unread },
    { label: "Today", count: today },
    { label: "Deadlines", count: deadlines },
    { label: "Mentions", count: mentions },
  ];

  document.getElementById("notificationsMetrics").innerHTML = metrics.map((m) => `
    <div class="metric-card">
      <span class="metric-count">${m.count}</span>
      <span class="metric-label">${m.label}</span>
    </div>
  `).join("");
}

function renderList() {
  const list = document.getElementById("notificationList");
  const emptyState = document.getElementById("notificationsEmptyState");
  const rows = filteredNotifications();
  emptyState.hidden = rows.length !== 0;

  list.innerHTML = rows.map((n) => `
    <div class="notification-item ${n.read ? "" : "is-unread"}" data-id="${n.id}">
      <span class="notification-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">${typeIcons[n.type] || '<circle cx="12" cy="12" r="9"/>'}</svg>
      </span>
      <div class="notification-body">
        <div class="notification-title-row">
          <span class="notification-text">${n.text}</span>
          ${n.read ? "" : "<span class=\"notification-unread-dot\"></span>"}
        </div>
        <span class="notification-meta">${n.type} · ${n.meta} · ${n.time}</span>
      </div>
    </div>
  `).join("");
}

function renderAll() {
  renderMetrics();
  renderList();
}

function initTabs() {
  const tabs = document.getElementById("notificationTabs");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    btn.classList.add("is-active");
    filters.unreadOnly = btn.dataset.filter === "unread";
    renderList();
  });

  document.getElementById("filterType").addEventListener("change", (e) => {
    filters.type = e.target.value;
    renderList();
  });
}

function initListClicks() {
  document.getElementById("notificationList").addEventListener("click", (e) => {
    const item = e.target.closest(".notification-item");
    if (!item) return;
    const n = notifications.find((x) => x.id === item.dataset.id);
    if (!n) return;
    if (!n.read) {
      n.read = true;
      saveNotifications();
      renderAll();
    }
    if (n.link) window.location.href = n.link;
  });
}

function initMarkAllRead() {
  document.getElementById("markAllReadBtn").addEventListener("click", () => {
    notifications.forEach((n) => { n.read = true; });
    saveNotifications();
    renderAll();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  populateTypeFilter();
  renderAll();
  initTabs();
  initListClicks();
  initMarkAllRead();
});
