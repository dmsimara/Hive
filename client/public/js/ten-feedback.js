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
                const response = await fetch("/api/auth/tenant/submit-feedback", {
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
