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
            if (!confirmLogout) return;

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
                    alert('Failed to log out. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    } else {
        console.error('Logout button not found on the page.');
    }

    const form = document.querySelector("#feedbackForm");

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const userName = document.querySelector("#userName").value.trim();
            const feedback = document.querySelector('input[name="feedback"]:checked')?.value;
            const content = document.querySelector("textarea[name='content']").value.trim();

            if (!userName || !content || !feedback) {
                alert("Please fill in all required fields.");
                return;
            }

            const feedbackData = { userName, feedback, content };

            try {
                const response = await fetch("/api/auth/submit-feedback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(feedbackData),
                });

                const data = await response.json();

                if (data.message) {
                    alert(data.message);
                    form.reset(); 
                } else {
                    alert("Failed to submit feedback. Please try again.");
                }
            } catch (error) {
                console.error("Error submitting feedback:", error);
                alert("An error occurred while submitting your feedback.");
            }
        });
    } else {
        console.error("Feedback form not found on the page.");
    }
});

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
