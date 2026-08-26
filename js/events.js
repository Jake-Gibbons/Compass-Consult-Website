
        document.addEventListener('DOMContentLoaded', function () {
            const viewRoot = document.getElementById('events-view-root');
            const standardView = document.getElementById('events-standard-view');
            const calendarView = document.getElementById('events-calendar-view');
            const viewButtons = Array.from(document.querySelectorAll('[data-events-view]'));
            const calendarGrid = document.getElementById('eventsCalendarGrid');
            const calendarAgenda = document.getElementById('eventsCalendarAgenda');
            const calendarMonthLabel = document.getElementById('calendarMonthLabel');
            const calendarMonthSummary = document.getElementById('calendarMonthSummary');
            const calendarPrevMonth = document.getElementById('calendarPrevMonth');
            const calendarNextMonth = document.getElementById('calendarNextMonth');
            const calendarViewAllEvents = document.getElementById('calendarViewAllEvents');
            const weekdayFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
            const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
            const agendaDayFormatter = new Intl.DateTimeFormat('en-GB', { month: 'short' });

            const escapeHtml = (value) => String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            const parseEventDate = (card) => {
                const raw = card.getAttribute('data-event-date');
                if (!raw) return null;
                const timestamp = new Date(raw).getTime();
                return Number.isNaN(timestamp) ? null : timestamp;
            };

            const monthStartForTimestamp = (timestamp) => {
                const date = new Date(timestamp);
                return new Date(date.getFullYear(), date.getMonth(), 1);
            };

            const isSameMonth = (leftDate, rightDate) => leftDate.getFullYear() === rightDate.getFullYear() && leftDate.getMonth() === rightDate.getMonth();

            const getAllEventCards = () => Array.from(document.querySelectorAll('#upcoming-events-list .event-card, #past-events-list .event-card'));

            const revealEventCard = (card) => {
                if (!card) return;

                const toggleButton = card.querySelector('.event-card-toggle');

                if (toggleButton && !card.classList.contains('is-expanded')) {
                    toggleButton.click();
                }

                window.setTimeout(() => {
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 120);
            };

            let currentView = 'list';
            let calendarMonthIndex = 0;
            let calendarMonths = [];
            let eventMetadata = [];

            const sortEventCards = (containerId, newestFirst) => {
                const container = document.getElementById(containerId);
                if (!container) return;

                const cards = Array.from(container.children).filter((element) => element.classList.contains('event-card'));
                cards.sort((leftCard, rightCard) => {
                    const leftDate = parseEventDate(leftCard);
                    const rightDate = parseEventDate(rightCard);

                    if (leftDate === null && rightDate === null) return 0;
                    if (leftDate === null) return 1;
                    if (rightDate === null) return -1;

                    return newestFirst ? rightDate - leftDate : leftDate - rightDate;
                });

                cards.forEach((card) => container.appendChild(card));
            };

            let isNewestFirst = true;

            const sortLabel = document.getElementById('eventSortLabel');

            const updateSortLabel = () => {
                if (!sortLabel) return;
                sortLabel.textContent = isNewestFirst
                    ? 'Order: Newest to Oldest'
                    : 'Order: Oldest to Newest';
            };

            const applySort = () => {
                sortEventCards('upcoming-events-list', isNewestFirst);
                sortEventCards('past-events-list', isNewestFirst);
                eventMetadata = buildEventMetadata();

                if (currentView === 'calendar') {
                    renderCalendar();
                }
            };

            const buildEventMetadata = () => getAllEventCards().map((card, index) => {
                if (!card.id) {
                    card.id = `event-card-${index + 1}`;
                }

                const timestamp = parseEventDate(card);
                const detailValues = Array.from(card.querySelectorAll('.event-card-detail-item span')).map((item) => item.textContent.trim()).filter(Boolean);

                return {
                    id: card.id,
                    card,
                    title: card.querySelector('h2')?.textContent.trim() || 'Event',
                    subtitle: card.querySelector('h3')?.textContent.trim() || '',
                    dateLabel: detailValues[0] || 'Date to be announced',
                    locationLabel: detailValues[1] || (card.closest('#upcoming-events-list') ? 'Upcoming event' : 'Past event'),
                    timestamp,
                    dateObject: timestamp === null ? null : new Date(timestamp),
                    isUpcoming: Boolean(card.closest('#upcoming-events-list'))
                };
            });

            const setActiveViewButton = (view) => {
                viewButtons.forEach((button) => {
                    const isActive = button.getAttribute('data-events-view') === view;
                    button.classList.toggle('is-active', isActive);
                    button.setAttribute('aria-pressed', String(isActive));
                });
            };

            const getCalendarMonths = () => {
                const monthMap = new Map();

                eventMetadata.forEach((event) => {
                    if (event.timestamp === null) return;

                    const monthStart = monthStartForTimestamp(event.timestamp);
                    monthMap.set(monthStart.getTime(), monthStart);
                });

                return Array.from(monthMap.values()).sort((left, right) => left.getTime() - right.getTime());
            };

            const renderCalendar = () => {
                if (!calendarGrid || !calendarAgenda || !calendarMonthLabel || !calendarMonthSummary) {
                    return;
                }

                calendarMonths = getCalendarMonths();

                if (!calendarMonths.length) {
                    calendarMonthLabel.textContent = 'Event Calendar';
                    calendarMonthSummary.textContent = 'No dated events are available to show right now.';
                    calendarGrid.innerHTML = '<div class="calendar-empty-state" style="grid-column: 1 / -1;">Add dates to your events to populate the calendar view.</div>';
                    calendarAgenda.innerHTML = '';

                    if (calendarPrevMonth) calendarPrevMonth.disabled = true;
                    if (calendarNextMonth) calendarNextMonth.disabled = true;
                    return;
                }

                calendarMonthIndex = Math.max(0, Math.min(calendarMonthIndex, calendarMonths.length - 1));

                const activeMonth = calendarMonths[calendarMonthIndex];
                const activeMonthEvents = eventMetadata
                    .filter((event) => event.dateObject && isSameMonth(event.dateObject, activeMonth))
                    .sort((left, right) => left.timestamp - right.timestamp);
                const undatedCount = eventMetadata.filter((event) => event.timestamp === null).length;
                const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
                const firstDayIndex = (new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1).getDay() + 6) % 7;
                const today = new Date();

                calendarMonthLabel.textContent = monthFormatter.format(activeMonth);
                calendarMonthSummary.textContent = undatedCount
                    ? `${activeMonthEvents.length} dated events in view. ${undatedCount} undated event${undatedCount === 1 ? '' : 's'} remain list-only.`
                    : `${activeMonthEvents.length} dated events in view.`;

                const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    .map((label) => `<div class="calendar-weekday">${label}</div>`)
                    .join('');

                const dayCells = [];

                for (let blankIndex = 0; blankIndex < firstDayIndex; blankIndex += 1) {
                    dayCells.push('<div class="calendar-day is-empty" aria-hidden="true"></div>');
                }

                for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
                    const dayEvents = activeMonthEvents.filter((event) => event.dateObject && event.dateObject.getDate() === dayNumber);
                    const isToday = today.getFullYear() === activeMonth.getFullYear() && today.getMonth() === activeMonth.getMonth() && today.getDate() === dayNumber;

                    dayCells.push(`
                        <div class="calendar-day${isToday ? ' is-today' : ''}">
                            <span class="calendar-day-number">${dayNumber}</span>
                            ${dayEvents.map((event) => `
                                <button type="button" class="calendar-event-pill ${event.isUpcoming ? 'calendar-event-pill--upcoming' : 'calendar-event-pill--past'}" data-event-target="${escapeHtml(event.id)}">
                                    ${escapeHtml(event.title)}
                                </button>
                            `).join('') || '<span class="text-xs text-gray-400">No events</span>'}
                        </div>
                    `);
                }

                calendarGrid.innerHTML = weekdayLabels + dayCells.join('');

                if (activeMonthEvents.length) {
                    calendarAgenda.innerHTML = activeMonthEvents.map((event) => `
                        <button type="button" class="calendar-agenda-item" data-event-target="${escapeHtml(event.id)}">
                            <span class="calendar-agenda-date">
                                <strong>${event.dateObject.getDate()}</strong>
                                <span>${agendaDayFormatter.format(event.dateObject)}</span>
                            </span>
                            <span>
                                <span class="block text-base font-bold text-gray-900">${escapeHtml(event.title)}</span>
                                <span class="mt-1 block text-sm text-gray-500">${escapeHtml(event.dateLabel)}</span>
                                <span class="mt-1 block text-sm text-gray-500">${escapeHtml(event.locationLabel)}</span>
                            </span>
                        </button>
                    `).join('');
                } else {
                    calendarAgenda.innerHTML = '<div class="calendar-empty-state">No events fall within this month.</div>';
                }

                if (calendarPrevMonth) {
                    calendarPrevMonth.disabled = calendarMonthIndex === 0;
                }

                if (calendarNextMonth) {
                    calendarNextMonth.disabled = calendarMonthIndex === calendarMonths.length - 1;
                }

                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            };

            const setView = (view) => {
                currentView = view;
                setActiveViewButton(view);

                if (viewRoot) {
                    viewRoot.setAttribute('data-events-view', view);
                }

                const isCalendarView = view === 'calendar';

                if (standardView) {
                    standardView.classList.toggle('hidden', isCalendarView);
                }

                if (calendarView) {
                    calendarView.classList.toggle('hidden', !isCalendarView);
                }

                if (isCalendarView) {
                    renderCalendar();
                }
            };

            const sortToggle = document.getElementById('eventSortToggle');

            if (sortToggle) {
                sortToggle.addEventListener('click', () => {
                    isNewestFirst = !isNewestFirst;
                    updateSortLabel();
                    applySort();
                });
            }

            viewButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    const nextView = button.getAttribute('data-events-view');
                    if (!nextView || nextView === currentView) return;
                    setView(nextView);
                });
            });

            if (calendarPrevMonth) {
                calendarPrevMonth.addEventListener('click', () => {
                    if (calendarMonthIndex === 0) return;
                    calendarMonthIndex -= 1;
                    renderCalendar();
                });
            }

            if (calendarNextMonth) {
                calendarNextMonth.addEventListener('click', () => {
                    if (calendarMonthIndex >= calendarMonths.length - 1) return;
                    calendarMonthIndex += 1;
                    renderCalendar();
                });
            }

            if (calendarView) {
                calendarView.addEventListener('click', (event) => {
                    const targetButton = event.target.closest('[data-event-target]');
                    if (!targetButton) return;

                    const targetCard = document.getElementById(targetButton.getAttribute('data-event-target'));
                    if (!targetCard) return;

                    setView('list');
                    revealEventCard(targetCard);
                });
            }

            if (calendarViewAllEvents) {
                calendarViewAllEvents.addEventListener('click', () => {
                    setView('list');
                    if (standardView) {
                        standardView.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            }

            updateSortLabel();
            eventMetadata = buildEventMetadata();

            const initialMonths = getCalendarMonths();
            if (initialMonths.length) {
                const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
                const nearestMonthIndex = initialMonths.findIndex((month) => month.getTime() >= currentMonthStart);
                calendarMonthIndex = nearestMonthIndex === -1 ? initialMonths.length - 1 : nearestMonthIndex;
            }

            applySort();
            setView('list');

            const eventCards = document.querySelectorAll('.event-card');

            eventCards.forEach((card) => {
                const toggleButton = card.querySelector('.event-card-toggle');
                if (!toggleButton) return;

                const hiddenContent = card.querySelector('.event-card-hidden');
                const icon = toggleButton.querySelector('i');
                
                if (!hiddenContent) {
                    toggleButton.classList.add('hidden');
                    return;
                }

                toggleButton.addEventListener('click', () => {
                    const isExpanded = card.classList.toggle('is-expanded');
                    card.classList.toggle('is-collapsed', !isExpanded);

                    if (isExpanded) {
                        hiddenContent.style.maxHeight = hiddenContent.scrollHeight + 'px';
                    } else {
                        hiddenContent.style.maxHeight = '0';
                    }

                    toggleButton.firstChild.textContent = isExpanded ? 'Show less ' : 'Read more ';

                    if (icon) {
                        icon.setAttribute('data-lucide', isExpanded ? 'chevron-up' : 'chevron-down');
                        if (window.lucide && typeof window.lucide.createIcons === 'function') {
                            window.lucide.createIcons();
                        }
                    }
                });
            });
        });
    