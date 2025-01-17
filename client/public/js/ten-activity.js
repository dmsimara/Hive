document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) {
            return;
        }
        
        try {
            const response = await fetch("/api/auth/tenantLogout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); 
                window.location.href = "/"; 
            } else {
                alert(data.message || "Logout failed. Please try again.");
            }
        } catch (error) {
            alert("An error occurred during logout. Please try again later.");
            console.error("Error:", error);
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Current URL:', window.location.href);

    fetchTenantActivities(); 
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

let currentPage = 1;
let totalPages = 1;

const fetchTenantActivities = async (page = 1) => {
    try {
        const response = await fetch(`/api/auth/activity-log?page=${page}`);
        const data = await response.json();

        console.log('Fetched tenant activity log:', data); 

        if (data.success) {
            totalPages = data.totalPages;
            renderActivities(data.activities);
            renderPagination();
        } else {
            console.log('No activities found.');
        }
    } catch (error) {
        console.error('Error fetching tenant activity log:', error);
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
        timestampCell.textContent = formatTimestamp(activity.timestamp);  
        row.appendChild(timestampCell);

        activitiesTableBody.appendChild(row);
    });
};

const renderPagination = () => {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    if (totalPages > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => changePage(currentPage - 1));
        paginationContainer.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.disabled = i === currentPage;
            pageButton.addEventListener('click', () => changePage(i));
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => changePage(currentPage + 1));
        paginationContainer.appendChild(nextButton);
    }
};

const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    fetchTenantActivities(page);
};

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;

    const pathToButtonId = {
        '/tenant/customize': 'customize-link',
        '/tenant/feedback': 'feedback-link',
        '/tenant/resetPassword': 'resetPassword-link',
        '/tenant/settings/activity-log': 'activity-log-link',
    };

    const activeButtonId = Object.keys(pathToButtonId).find(path => currentPath.startsWith(path));

    if (activeButtonId) {
        const activeLink = document.getElementById(pathToButtonId[activeButtonId]);
        activeLink?.classList.add('active');
    }
});
