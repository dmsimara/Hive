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
                    window.location.href = '/'
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

function deleteAdmin(adminId) {
    console.log('adminId passed:', adminId);

    if (!adminId) {
        alert("Admin ID is missing");
        return;
    }

    if (!confirm("Are you sure you want to delete this admin account?")) return;

    fetch(`/api/auth/deleteAdmin/${adminId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Admin account successfully deleted');
                window.location.href = '/';  
            } else {
                alert('Error deleting admin: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the admin account: ' + error.message);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname; 

    const pathToButtonId = {
        '/admin/settings/feedback-support': 'feedback-link',
        '/admin/settings/password-reset': 'password-link',
        '/admin/settings/delete-account': 'delete-link',
        '/admin/settings/activity-log': 'activity-link',
        '/admin/settings': 'appearance-link',
    };

    const activeButtonId = Object.keys(pathToButtonId).find(path => currentPath.startsWith(path));
    if (!activeButtonId && currentPath.startsWith('/admin/settings/delete-account')) {
        const activeLink = document.getElementById('delete-link');
        activeLink?.querySelector('.pages-link').classList.add('active');
    } else if (activeButtonId) {
        const activeLink = document.getElementById(pathToButtonId[activeButtonId]);
        activeLink?.querySelector('.pages-link').classList.add('active');
    }
});
