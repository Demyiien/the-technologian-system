const workflowStages = [
    "Pitch", "Assigned", "Research", "Writing", "Editing",
    "Creatives", "Production", "Online Publishing", "Published", "Archived",
  ];
  
  const mockUsers = [
    { name: "Maria Santos", role: "News Writer" },
    { name: "Paolo Reyes", role: "Feature Writer" },
    { name: "Ana Cruz", role: "Editorial Writer" },
    { name: "Jake Lim", role: "News Writer" },
    { name: "Carlo Mendoza", role: "Section Editor" },
    { name: "Bea Fernandez", role: "Section Editor" },
    { name: "Rico Alonzo", role: "Cluster Head" },
  ];
  
  let articles = [
    {
      id: "a1", title: "Enrollment Numbers Hit Record High", category: "News", cluster: "Writing",
      writer: "Maria Santos", editor: "Carlo Mendoza", priority: "High", deadline: "Sep 2",
      status: "Editing", progress: 70, lastActivity: "12 minutes ago",
      members: [{ name: "Maria Santos", role: "News Writer" }, { name: "Carlo Mendoza", role: "Section Editor" }],
      tasks: [
        { id: "t1", title: "Interview registrar's office", assignee: "Maria Santos", done: true },
        { id: "t2", title: "Verify enrollment figures with admin", assignee: "Maria Santos", done: false },
      ],
      requests: [{ id: "r1", title: "Request enrollment data chart", type: "Creatives Request", status: "Pending" }],
      comments: [{ author: "Carlo Mendoza", time: "1 hour ago", text: "Good draft, tighten the second paragraph." }],
      files: [{ name: "enrollment-draft-v2.docx", size: "48 KB" }],
      approvalHistory: [{ stage: "Writing", by: "Carlo Mendoza", date: "Aug 27", decision: "Approved" }],
      activityHistory: [
        { text: "Maria Santos moved article to Editing", time: "12 minutes ago" },
        { text: "Maria Santos submitted draft", time: "2 hours ago" },
      ],
    },
    {
      id: "a2", title: "Campus Wi-Fi Upgrade Explained", category: "Campus Life", cluster: "Online & Digital",
      writer: "Paolo Reyes", editor: "Bea Fernandez", priority: "Medium", deadline: "Sep 5",
      status: "Writing", progress: 30, lastActivity: "40 minutes ago",
      members: [{ name: "Paolo Reyes", role: "Feature Writer" }],
      tasks: [{ id: "t3", title: "Draft first 500 words", assignee: "Paolo Reyes", done: false }],
      requests: [], comments: [], files: [], approvalHistory: [],
      activityHistory: [{ text: "Paolo Reyes started writing", time: "40 minutes ago" }],
    },
    {
      id: "a3", title: "Student Council Election Results", category: "News", cluster: "Writing",
      writer: "Ana Cruz", editor: "Carlo Mendoza", priority: "High", deadline: "Aug 30",
      status: "Published", progress: 100, lastActivity: "1 day ago",
      members: [{ name: "Ana Cruz", role: "Editorial Writer" }, { name: "Carlo Mendoza", role: "Section Editor" }],
      tasks: [{ id: "t4", title: "Fact-check vote count", assignee: "Ana Cruz", done: true }],
      requests: [],
      comments: [{ author: "Rico Alonzo", time: "1 day ago", text: "Clean writeup, published as-is." }],
      files: [{ name: "election-results-final.docx", size: "52 KB" }],
      approvalHistory: [
        { stage: "Editing", by: "Carlo Mendoza", date: "Aug 29", decision: "Approved" },
        { stage: "Online Publishing", by: "Rico Alonzo", date: "Aug 30", decision: "Approved" },
      ],
      activityHistory: [{ text: "Article published", time: "1 day ago" }],
    },
    {
      id: "a4", title: "Behind the Lens: Foundation Week", category: "Features", cluster: "Creatives",
      writer: "Miguel Torres", editor: "Bea Fernandez", priority: "Medium", deadline: "Sep 3",
      status: "Creatives", progress: 85, lastActivity: "3 hours ago",
      members: [{ name: "Miguel Torres", role: "Feature Writer" }],
      tasks: [{ id: "t5", title: "Select final photo set", assignee: "Miguel Torres", done: false }],
      requests: [{ id: "r2", title: "Request layout design", type: "Creatives Request", status: "In Progress" }],
      comments: [],
      files: [{ name: "foundation-week-photos.zip", size: "18.4 MB" }],
      approvalHistory: [],
      activityHistory: [{ text: "Moved to Creatives for layout", time: "3 hours ago" }],
    },
    {
      id: "a5", title: "New Library Hours Announced", category: "Campus Life", cluster: "Writing",
      writer: "Maria Santos", editor: "Carlo Mendoza", priority: "Low", deadline: "Aug 28",
      status: "Published", progress: 100, lastActivity: "2 days ago",
      members: [{ name: "Maria Santos", role: "News Writer" }],
      tasks: [], requests: [], comments: [],
      files: [{ name: "library-hours.docx", size: "20 KB" }],
      approvalHistory: [{ stage: "Online Publishing", by: "Rico Alonzo", date: "Aug 28", decision: "Approved" }],
      activityHistory: [{ text: "Article published", time: "2 days ago" }],
    },
    {
      id: "a6", title: "Esports Team Qualifies for Regionals", category: "Sports", cluster: "Online & Digital",
      writer: "Jake Lim", editor: "Bea Fernandez", priority: "Medium", deadline: "Sep 6",
      status: "Research", progress: 15, lastActivity: "5 hours ago",
      members: [{ name: "Jake Lim", role: "News Writer" }],
      tasks: [{ id: "t6", title: "Contact team captain for quotes", assignee: "Jake Lim", done: false }],
      requests: [], comments: [], files: [], approvalHistory: [],
      activityHistory: [{ text: "Research assignment started", time: "5 hours ago" }],
    },
    {
      id: "a7", title: "Editorial: On Academic Freedom", category: "Opinion", cluster: "Writing",
      writer: "Ana Cruz", editor: "Rico Alonzo", priority: "High", deadline: "Sep 1",
      status: "Editing", progress: 60, lastActivity: "10 minutes ago",
      members: [{ name: "Ana Cruz", role: "Editorial Writer" }, { name: "Rico Alonzo", role: "Cluster Head" }],
      tasks: [{ id: "t7", title: "Address editor's notes on tone", assignee: "Ana Cruz", done: false }],
      requests: [{ id: "r3", title: "Request fact-check on cited policy", type: "Editorial Request", status: "Pending" }],
      comments: [{ author: "Rico Alonzo", time: "10 minutes ago", text: "Strong stance, just soften the closing line." }],
      files: [{ name: "academic-freedom-draft.docx", size: "31 KB" }],
      approvalHistory: [],
      activityHistory: [{ text: "Ana Cruz was assigned this article", time: "1 day ago" }],
    },
    {
      id: "a8", title: "Freshmen Orientation Recap", category: "Campus Life", cluster: "Writing",
      writer: "", editor: "", priority: "Low", deadline: "Sep 10",
      status: "Pitch", progress: 0, lastActivity: "1 hour ago",
      members: [], tasks: [], requests: [], comments: [], files: [], approvalHistory: [],
      activityHistory: [{ text: "Pitch submitted for review", time: "1 hour ago" }],
    },
    {
      id: "a9", title: "Intramurals Schedule Released", category: "Sports", cluster: "Writing",
      writer: "Jake Lim", editor: "", priority: "Medium", deadline: "Sep 4",
      status: "Assigned", progress: 5, lastActivity: "2 hours ago",
      members: [{ name: "Jake Lim", role: "News Writer" }],
      tasks: [{ id: "t8", title: "Pull schedule from sports office", assignee: "Jake Lim", done: false }],
      requests: [], comments: [], files: [], approvalHistory: [],
      activityHistory: [{ text: "Jake Lim was assigned this article", time: "2 hours ago" }],
    },
  ];
  
  const filters = { status: "all", category: "all", cluster: "all", priority: "all" };
  let activeArticleId = null;
  const STORAGE_KEY = "ttsp_newsroom_articles";

  function saveArticles() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  }

  function loadArticles() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      articles = JSON.parse(saved);
    } catch (e) {
      // ignore corrupted storage, fall back to defaults
    }
  }
  
  function priorityBadgeClass(priority) {
    if (priority === "High") return "priority-badge-high";
    if (priority === "Medium") return "priority-badge-medium";
    return "priority-badge-low";
  }
  
  function uniqueValues(key) {
    return [...new Set(articles.map((a) => a[key]).filter(Boolean))];
  }
  
  function populateFilterOptions() {
    const map = { filterCategory: "category", filterCluster: "cluster", filterPriority: "priority" };
    Object.entries(map).forEach(([selectId, key]) => {
      const select = document.getElementById(selectId);
      uniqueValues(key).forEach((value) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value;
        select.appendChild(opt);
      });
    });
  
    const statusSelect = document.getElementById("filterStatus");
    workflowStages.forEach((stage) => {
      const opt = document.createElement("option");
      opt.value = stage;
      opt.textContent = stage;
      statusSelect.appendChild(opt);
    });
  }
  
  function filteredArticles() {
    return articles.filter((a) =>
      (filters.status === "all" || a.status === filters.status) &&
      (filters.category === "all" || a.category === filters.category) &&
      (filters.cluster === "all" || a.cluster === filters.cluster) &&
      (filters.priority === "all" || a.priority === filters.priority)
    );
  }
  
  function renderWorkflow() {
    const stepper = document.getElementById("workflowStepper");
    stepper.innerHTML = workflowStages.map((stage, i) => {
      const count = articles.filter((a) => a.status === stage).length;
      const active = filters.status === stage ? "is-active" : "";
      return `
        <button class="workflow-step ${active}" type="button" data-stage="${stage}">
          <span class="workflow-step-index">${String(i + 1).padStart(2, "0")}</span>
          <span class="workflow-step-count">${count}</span>
          <span class="workflow-step-label">${stage}</span>
        </button>
      `;
    }).join("");
  }
  
  function renderTable() {
    const tbody = document.getElementById("articleTableBody");
    const emptyState = document.getElementById("articleEmptyState");
    const rows = filteredArticles();
    emptyState.hidden = rows.length !== 0;
  
    tbody.innerHTML = rows.map((a) => `
      <tr data-id="${a.id}">
        <td>${a.title}</td>
        <td>${a.category}</td>
        <td>${a.writer || "—"}</td>
        <td>${a.editor || "—"}</td>
        <td><span class="badge ${priorityBadgeClass(a.priority)}">${a.priority}</span></td>
        <td>${a.deadline}</td>
        <td><span class="badge">${a.status}</span></td>
        <td>
          <div class="progress-row">
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${a.progress}%"></div></div>
            <span class="progress-value">${a.progress}%</span>
          </div>
        </td>
        <td>${a.lastActivity}</td>
      </tr>
    `).join("");
  }
  
  function renderAll() {
    renderWorkflow();
    renderTable();
  }
  
  function userOptions(selected) {
    return mockUsers.map((u) =>
      `<option value="${u.name}" ${u.name === selected ? "selected" : ""}>${u.name} (${u.role})</option>`
    ).join("");
  }
  
  function renderOverviewPanel(a) {
    return `
      <div class="detail-stage-row">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="stageSelect">Current Stage</label>
          <select class="form-select" id="stageSelect">
            ${workflowStages.map((s) => `<option value="${s}" ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-field">
          <span class="detail-field-label">Category</span>
          <span class="detail-field-value">${a.category}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Cluster</span>
          <span class="detail-field-value">${a.cluster}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Priority</span>
          <span class="badge ${priorityBadgeClass(a.priority)}">${a.priority}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Deadline</span>
          <span class="detail-field-value">${a.deadline}</span>
        </div>
      </div>
      <div class="detail-grid">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="writerSelect">Writer</label>
          <select class="form-select" id="writerSelect">
            <option value="">Unassigned</option>
            ${userOptions(a.writer)}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" for="editorSelect">Editor</label>
          <select class="form-select" id="editorSelect">
            <option value="">Unassigned</option>
            ${userOptions(a.editor)}
          </select>
        </div>
      </div>
      <div class="detail-field-label" style="margin-top:var(--space-md);margin-bottom:var(--space-xs);">Assigned Members</div>
      <div class="detail-members">
        ${a.members.length ? a.members.map((m) => `
          <span class="member-chip">
            <span class="avatar avatar-sm">${m.name.split(" ").map((n) => n[0]).join("")}</span>
            ${m.name} <span class="member-chip-role">· ${m.role}</span>
          </span>
        `).join("") : "<span class=\"form-hint\">No members assigned yet.</span>"}
      </div>
    `;
  }
  
  function renderTasksPanel(a) {
    if (!a.tasks.length) return "<div class=\"empty-state\"><p class=\"empty-state-title\">No tasks yet</p></div>";
    return `<div class="detail-list">${a.tasks.map((t) => `
      <div class="detail-list-item" data-task-id="${t.id}">
        <div class="task-checkbox-row">
          <input type="checkbox" ${t.done ? "checked" : ""} data-task-toggle="${t.id}">
          <div>
            <div class="detail-list-item-title">${t.title}</div>
            <div class="detail-list-item-meta">Assigned to ${t.assignee || "—"}</div>
          </div>
        </div>
      </div>
    `).join("")}</div>`;
  }
  
  function renderRequestsPanel(a) {
    if (!a.requests.length) return "<div class=\"empty-state\"><p class=\"empty-state-title\">No requests yet</p></div>";
    return `<div class="detail-list">${a.requests.map((r) => `
      <div class="detail-list-item" data-request-id="${r.id}">
        <div class="detail-list-item-header">
          <span class="detail-list-item-title">${r.title}</span>
          <span class="badge">${r.status}</span>
        </div>
        <div class="detail-list-item-meta">${r.type} · <a href="#" data-view-request="${r.id}">View reference</a></div>
      </div>
    `).join("")}</div>`;
  }
  
  function renderCommentsPanel(a) {
    const list = a.comments.length
      ? a.comments.map((c) => `
          <div class="comment-item">
            <span class="comment-author">${c.author}</span><span class="comment-time">${c.time}</span>
            <div class="comment-text">${c.text}</div>
          </div>
        `).join("")
      : "<div class=\"empty-state\"><p class=\"empty-state-title\">No comments yet</p></div>";
    return `
      <div class="detail-list">${list}</div>
      <form class="comment-form" id="commentForm">
        <textarea class="form-textarea" id="commentInput" placeholder="Write a comment..."></textarea>
        <button class="btn btn-primary" type="submit">Post</button>
      </form>
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
  
  function renderHistoryPanel(a) {
    const approvals = a.approvalHistory.map((h) => `
      <div class="detail-list-item">
        <div class="detail-list-item-header">
          <span class="detail-list-item-title">${h.stage} — ${h.decision}</span>
          <span class="detail-list-item-meta">${h.date}</span>
        </div>
        <div class="detail-list-item-meta">By ${h.by}</div>
      </div>
    `).join("");
    const activity = a.activityHistory.map((h) => `
      <div class="detail-list-item">
        <div class="detail-list-item-title">${h.text}</div>
        <div class="detail-list-item-meta">${h.time}</div>
      </div>
    `).join("");
    return `
      <div class="detail-field-label" style="margin-bottom:var(--space-xs);">Approval History</div>
      <div class="detail-list" style="margin-bottom:var(--space-md);">${approvals || "<span class=\"form-hint\">No approvals yet.</span>"}</div>
      <div class="detail-field-label" style="margin-bottom:var(--space-xs);">Activity History</div>
      <div class="detail-list">${activity || "<span class=\"form-hint\">No activity yet.</span>"}</div>
    `;
  }
  
  function renderModalPanels() {
    const a = articles.find((x) => x.id === activeArticleId);
    if (!a) return;
    document.getElementById("articleModalTitle").textContent = a.title;
    document.getElementById("articleModalSubtitle").textContent = `${a.category} · ${a.cluster}`;
    document.getElementById("panelOverview").innerHTML = renderOverviewPanel(a);
    document.getElementById("panelTasks").innerHTML = renderTasksPanel(a);
    document.getElementById("panelRequests").innerHTML = renderRequestsPanel(a);
    document.getElementById("panelComments").innerHTML = renderCommentsPanel(a);
    document.getElementById("panelFiles").innerHTML = renderFilesPanel(a);
    document.getElementById("panelHistory").innerHTML = renderHistoryPanel(a);
  }
  
  function switchTab(tab) {
    document.querySelectorAll("#articleModalTabs .tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === tab));
    document.querySelectorAll(".modal-tab-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === tab));
  }
  
  function openArticleModal(id) {
    activeArticleId = id;
    renderModalPanels();
    switchTab("overview");
    document.getElementById("articleModalOverlay").classList.add("is-open");
    history.replaceState(null, "", `newsroom.html?article=${id}`);
  }
  
  function closeArticleModal() {
    activeArticleId = null;
    document.getElementById("articleModalOverlay").classList.remove("is-open");
    history.replaceState(null, "", "newsroom.html");
  }
  
  function logActivity(a, text) {
    a.activityHistory.unshift({ text, time: "Just now" });
  }
  
  function initFilters() {
    ["filterStatus", "filterCategory", "filterCluster", "filterPriority"].forEach((id) => {
      document.getElementById(id).addEventListener("change", (e) => {
        const key = id.replace("filter", "").toLowerCase();
        filters[key] = e.target.value;
        renderAll();
      });
    });
    document.getElementById("clearFiltersBtn").addEventListener("click", () => {
      filters.status = filters.category = filters.cluster = filters.priority = "all";
      ["filterStatus", "filterCategory", "filterCluster", "filterPriority"].forEach((id) => {
        document.getElementById(id).value = "all";
      });
      renderAll();
    });
  }
  
  function initWorkflowClicks() {
    document.getElementById("workflowStepper").addEventListener("click", (e) => {
      const btn = e.target.closest(".workflow-step");
      if (!btn) return;
      const stage = btn.dataset.stage;
      filters.status = filters.status === stage ? "all" : stage;
      document.getElementById("filterStatus").value = filters.status;
      renderAll();
    });
  }
  
  function initTableClicks() {
    document.getElementById("articleTableBody").addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      if (!row) return;
      openArticleModal(row.dataset.id);
    });
  }
  
  function initModal() {
    document.getElementById("articleModalClose").addEventListener("click", closeArticleModal);
    document.getElementById("articleModalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "articleModalOverlay") closeArticleModal();
    });
    document.getElementById("articleModalTabs").addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (btn) switchTab(btn.dataset.tab);
    });
  
    const modalBody = document.querySelector(".article-modal .modal-body");
  
    modalBody.addEventListener("change", (e) => {
      const a = articles.find((x) => x.id === activeArticleId);
      if (!a) return;
  
      if (e.target.id === "stageSelect") {
        a.status = e.target.value;
        a.lastActivity = "Just now";
        logActivity(a, `Stage changed to ${a.status}`);
        saveArticles();
        renderAll();
      }
      if (e.target.id === "writerSelect") {
        a.writer = e.target.value;
        logActivity(a, `Writer set to ${a.writer || "Unassigned"}`);
        saveArticles();
        renderAll();
      }
      if (e.target.id === "editorSelect") {
        a.editor = e.target.value;
        logActivity(a, `Editor set to ${a.editor || "Unassigned"}`);
        saveArticles();
        renderAll();
      }
      if (e.target.dataset.taskToggle) {
        const task = a.tasks.find((t) => t.id === e.target.dataset.taskToggle);
        if (task) {
          task.done = e.target.checked;
          logActivity(a, `Task "${task.title}" marked ${task.done ? "done" : "not done"}`);
          saveArticles();
        }
      }
    });
  
    modalBody.addEventListener("submit", (e) => {
      if (e.target.id !== "commentForm") return;
      e.preventDefault();
      const input = document.getElementById("commentInput");
      const text = input.value.trim();
      if (!text) return;
      const a = articles.find((x) => x.id === activeArticleId);
      a.comments.push({ author: "Juan Dela Cruz", time: "Just now", text });
      logActivity(a, "Juan Dela Cruz added a comment");
      saveArticles();
      renderModalPanels();
      switchTab("comments");
    });
  
    modalBody.addEventListener("click", (e) => {
      const ref = e.target.closest("[data-view-request]");
      if (ref) {
        e.preventDefault();
        ref.textContent = "Reference not yet available in this prototype";
      }
    });
  }
  
  function openFromQueryString() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("article");
    if (id && articles.some((a) => a.id === id)) openArticleModal(id);
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    loadArticles();
    populateFilterOptions();
    renderAll();
    initFilters();
    initWorkflowClicks();
    initTableClicks();
    initModal();
    openFromQueryString();
  });