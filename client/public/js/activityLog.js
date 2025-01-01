let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    if (subMenu) {
        subMenu.classList.toggle("open-menu");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('#logoutButton');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            const confirmLogout = confirm('Are you sure you want to log out?');
            if (!confirmLogout) {
                return; 
            }

            try {
                const response = await fetch('/api/auth/adminLogout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (response.ok) {
                    console.log('Logout successful');
                    window.location.href = '/'; 
                } else {
                    const errorData = await response.json();
                    console.error('Logout failed:', errorData.message);
                    alert('Failed to logout. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    } else {
        console.error('Logout button not found on the page.');
    }
});


document.addEventListener('DOMContentLoaded', () => {
    console.log('Current URL:', window.location.href);

    const pathParts = window.location.pathname.split('/');

    const adminId = pathParts[pathParts.length - 1];

    console.log('Extracted adminId:', adminId); 

    if (adminId && adminId !== 'activity-log') {
        fetchActivities(adminId); 
    } else {
        console.error('Admin ID not found or URL is malformed.');
    }
});

const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp); 

    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,  
    };

    return date.toLocaleString('en-US', options);  
};

const fetchActivities = async (adminId) => {
    try {
        const response = await fetch(`/api/auth/activity-log/${adminId}`);
        const data = await response.json();

        console.log('Fetched activity log:', data); 

        if (data.success) {
            renderActivities(data.activities);
        } else {
            console.log('No activities found.');
        }
    } catch (error) {
        console.error('Error fetching activity log:', error);
    }
};

const renderActivities = (activities) => {
    const activitiesTableBody = document.querySelector('#activitiesTableBody'); 

    activitiesTableBody.innerHTML = '';

    if (activities.length === 0) {
        activitiesTableBody.innerHTML = '<tr><td colspan="3">No activities found.</td></tr>';
        return;
    }

    activities.forEach(activity => {
        const row = document.createElement('tr');

        const actionTypeCell = document.createElement('td');
        actionTypeCell.textContent = activity.actionType;
        row.appendChild(actionTypeCell);

        const actionDetailsCell = document.createElement('td');
        actionDetailsCell.textContent = activity.actionDetails;
        row.appendChild(actionDetailsCell);

        const timestampCell = document.createElement('td');
        timestampCell.textContent = formatTimestamp(activity.timestamp); // Format the timestamp
        row.appendChild(timestampCell);

        activitiesTableBody.appendChild(row);
    });
};
