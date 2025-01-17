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
