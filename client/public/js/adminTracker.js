let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        headerToolbar: {
            left: 'prev today next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        initialView: 'dayGridMonth',
        editable: true,
        selectable: true,
        selectHelper: true,
        select: function (info) {
            const selectedDate = info.startStr;
            document.getElementById('start').value = `${selectedDate}T00:00`; // Default time 00:00
            document.getElementById('end').value = `${selectedDate}T23:59`; // Default time 23:59
            const modal = new bootstrap.Modal(document.getElementById('eventModal'));
            modal.show();
        },
        events: [],
        datesSet: function () {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            document.querySelectorAll('.fc-daygrid-day').forEach(cell => {
                const cellDate = new Date(cell.getAttribute('data-date'));
                cell.style.backgroundColor = cellDate.getTime() === today.getTime() ? '#FFFB97' : '';
            });
        }
    });

    async function loadEvents() {
        try {
            // Show loading message while events are being fetched
            const loadingMessage = document.getElementById('loadingMessage') || document.createElement('p');
            loadingMessage.id = 'loadingMessage';
            loadingMessage.textContent = 'Loading events...';
            calendarEl.parentElement.appendChild(loadingMessage);

            // Fetch events from the backend API
            const response = await fetch('/api/auth/view/events');
            if (!response.ok) throw new Error(`Failed to fetch events: ${response.statusText}`);

            const events = await response.json();
            console.log("Fetched events: ", events); // Log fetched events for debugging

            // Format event data for FullCalendar
            const formattedEvents = events.map(event => {
                const start = new Date(event.start); // Parse the start date
                const end = new Date(event.end); // Parse the end date

                return {
                    id: event.id,
                    title: event.title,
                    start: start.toISOString(), // Convert start date to ISO format
                    end: end.toISOString(), // Convert end date to ISO format
                    description: event.description,
                    status: event.status
                };
            });

            console.log("Formatted Events: ", formattedEvents); // Log formatted events for debugging

            // Add events to the calendar
            calendar.removeAllEventSources(); // Clear existing events
            calendar.addEventSource(formattedEvents); // Add the formatted events to the calendar

        } catch (error) {
            console.error('Error fetching events:', error);
            alert('Failed to load events. Please try again later.');
        } finally {
            const loadingMessage = document.getElementById('loadingMessage');
            if (loadingMessage) loadingMessage.remove(); // Remove loading message after fetching
        }
    }

    // Handle the "Add Event" button click
    document.querySelector('.btn-primary').addEventListener('click', function () {
        document.getElementById('addEventForm').reset(); // Reset the form
        const now = new Date().toISOString().slice(0, 16);
        document.getElementById('start').value = now;
        document.getElementById('end').value = now;
    });

    // Save event when the "Save Event" button is clicked
    document.getElementById('saveEvent').addEventListener('click', async function (event) {
        event.preventDefault();

        const eventData = {
            event_name: document.getElementById('event_name').value,
            event_description: document.getElementById('event_description').value,
            start: document.getElementById('start').value,
            end: document.getElementById('end').value,
            status: document.getElementById('status').value
        };

        try {
            const response = await fetch('/api/auth/add/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });

            const result = await response.json();
            if (result.success) {
                alert('Event added successfully!');
                const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
                modal.hide();
                loadEvents(); // Reload the events after saving a new one
            } else {
                alert(`Error adding event: ${result.message}`);
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('An error occurred while saving the event. Please try again.');
        }
    });

    // Load events when the page is ready
    loadEvents();
    calendar.render(); // Render the calendar
});
