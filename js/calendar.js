document.addEventListener('DOMContentLoaded', () => {
  let currentDate = new Date();
  let allEvents = [];

  // Exact IDs matching calendar.html
  const calendarGrid = document.getElementById('calendarGrid');
  const monthDisplay = document.getElementById('calendarMonthLabel');
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  const eventModalOverlay = document.getElementById('eventModalOverlay');
  const eventModalClose = document.getElementById('eventModalClose');
  const eventModalBody = document.getElementById('eventModalBody');
  const eventModalTitle = document.getElementById('eventModalTitle');
  const eventModalSubtitle = document.getElementById('eventModalSubtitle');

  // Main initialization
  async function initCalendar() {
      if (prevBtn) prevBtn.addEventListener('click', () => changeMonth(-1));
      if (nextBtn) nextBtn.addEventListener('click', () => changeMonth(1));

      // Setup modal close events
      if (eventModalClose) {
          eventModalClose.addEventListener('click', closeModal);
      }
      window.addEventListener('click', (e) => {
          if (e.target === eventModalOverlay) closeModal();
      });

      await fetchAllEvents();
      renderCalendar();
  }

  async function fetchAllEvents() {
    const endpoints = {
        article: '/api/articles',
        request: '/api/requests',
        task: '/api/tasks'
    };

    allEvents = [];

    for (const [type, url] of Object.entries(endpoints)) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            // FIX: Un-wrap the array whether it's the root object or tucked inside a property (like data.data)
            const eventList = Array.isArray(data) ? data : (data.data || Object.values(data).find(Array.isArray));

            // If we still didn't find a valid list of records, skip to the next endpoint
            if (!eventList || !Array.isArray(eventList)) {
                console.warn(`Could not find an array in the response for ${type}s`, data);
                continue;
            }

            const normalizedEvents = eventList
                .filter(item => item.deadline) 
                .map(item => {
                    return {
                        id: `${type}-${item.id}`,
                        title: item.title || item.subject,
                        date: extractDate(item.deadline),
                        type: type,
                        status: item.status,
                        rawData: item
                    };
                });

            allEvents = allEvents.concat(normalizedEvents);
        } catch (error) {
            console.error(`Error fetching ${type}s:`, error);
        }
    }
}

  function extractDate(deadlineStr) {
      if (!deadlineStr) return null;
      if (typeof deadlineStr === 'string' && deadlineStr.length >= 10) {
          return deadlineStr.substring(0, 10);
      }
      const d = new Date(deadlineStr);
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }

  function changeMonth(offset) {
      currentDate.setMonth(currentDate.getMonth() + offset);
      renderCalendar(); 
  }

  function renderCalendar() {
      if (!calendarGrid) return;

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      if (monthDisplay) {
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          monthDisplay.textContent = `${monthNames[month]} ${year}`;
      }

      calendarGrid.innerHTML = '';

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Padding days before the 1st
      for (let i = 0; i < firstDay; i++) {
          const emptyCell = document.createElement('div');
          emptyCell.className = 'calendar-day empty';
          calendarGrid.appendChild(emptyCell);
      }

      // Actual days
      for (let day = 1; day <= daysInMonth; day++) {
          const dayCell = document.createElement('div');
          dayCell.className = 'calendar-day';

          // Highlight today
          const today = new Date();
          if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
              dayCell.classList.add('is-today');
          }

          const dateLabel = document.createElement('div');
          dateLabel.className = 'calendar-day-number';
          dateLabel.textContent = day;
          dayCell.appendChild(dateLabel);

          const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = allEvents.filter(e => e.date === currentDayStr);

          dayEvents.forEach(eventData => {
              const eventEl = document.createElement('div');
              // Exact classes matching calendar.css
              eventEl.className = `calendar-event-chip type-${eventData.type}`;
              eventEl.textContent = eventData.title;
              
              eventEl.addEventListener('click', (e) => {
                  e.stopPropagation(); // Prevents day cell click interference
                  openModal(eventData);
              });
              dayCell.appendChild(eventEl);
          });

          calendarGrid.appendChild(dayCell);
      }
  }

  function openModal(event) {
      if (!eventModalOverlay) return;

      // Populate header
      if (eventModalTitle) eventModalTitle.textContent = event.title;
      if (eventModalSubtitle) eventModalSubtitle.textContent = `${capitalize(event.type)} Deadline`;

      // Format body matching your CSS detail-grid
      let detailsHTML = `<div class="detail-grid">`;
      detailsHTML += `<div class="detail-field"><span class="detail-field-label">Status</span><span class="detail-field-value">${event.status || 'N/A'}</span></div>`;
      detailsHTML += `<div class="detail-field"><span class="detail-field-label">Deadline</span><span class="detail-field-value">${event.date}</span></div>`;

      const d = event.rawData;
      if (event.type === 'task') {
          detailsHTML += `<div class="detail-field"><span class="detail-field-label">Assignee</span><span class="detail-field-value">${d.assignee || 'Unassigned'}</span></div>`;
          detailsHTML += `<div class="detail-field"><span class="detail-field-label">Related Article</span><span class="detail-field-value">${d.related_article || 'None'}</span></div>`;
      } else if (event.type === 'request') {
          detailsHTML += `<div class="detail-field"><span class="detail-field-label">Priority</span><span class="detail-field-value">${d.priority || 'N/A'}</span></div>`;
          detailsHTML += `<div class="detail-field"><span class="detail-field-label">Assigned To</span><span class="detail-field-value">${d.assigned_to || 'Unassigned'}</span></div>`;
      } else if (event.type === 'article') {
          detailsHTML += `<div class="detail-field"><span class="detail-field-label">Author</span><span class="detail-field-value">${d.author || 'N/A'}</span></div>`;
      }
      detailsHTML += `</div>`;

      if (eventModalBody) {
          eventModalBody.innerHTML = detailsHTML;
      }

      // Show modal via the overlay
      eventModalOverlay.style.display = 'flex';
      eventModalOverlay.classList.add('show');
  }

  function closeModal() {
      if (eventModalOverlay) {
          eventModalOverlay.style.display = 'none';
          eventModalOverlay.classList.remove('show');
      }
  }

  function capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
  }

  initCalendar();
});