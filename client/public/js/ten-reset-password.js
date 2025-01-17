document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const message = urlParams.get('message');

    if (message) {
        const decodedMessage = decodeURIComponent(message);
        if (success === 'true') {
            alert(`Success: ${decodedMessage}`);
        } else {
            alert(`Error: ${decodedMessage}`);
        }
    }

    const updatePasswordForm = document.querySelector("#updatePasswordForm");
    if (updatePasswordForm) {
        updatePasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const currentPassword = document.getElementById("currentPassword").value.trim();
            const newPassword = document.getElementById("newPassword").value.trim();
            const confirmPassword = document.getElementById("confirmPassword").value.trim();

            if (!currentPassword || !newPassword || !confirmPassword) {
                alert("All fields are required.");
                return;
            }
            if (newPassword !== confirmPassword) {
                alert("New passwords do not match.");
                return;
            }

            const payload = { currentPassword, newPassword };

            try {
                const response = await fetch("/api/auth/update-tenant-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();
                if (response.ok) {
                    window.location.href = `/tenant/resetPassword?success=true&message=${encodeURIComponent(data.message)}`;
                } else {
                    window.location.href = `/tenant/resetPassword?success=false&message=${encodeURIComponent(data.message)}`;
                }
            } catch (error) {
                alert("An unexpected error occurred. Please try again later.");
            }
        });
    }

    const logoutButton = document.querySelector("#logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            const confirmLogout = confirm("Are you sure you want to log out?");
            if (!confirmLogout) return;

            try {
                const response = await fetch("/api/auth/tenantLogout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                });

                if (response.ok) {
                    console.log("Logout successful");
                    window.location.href = "/";
                } else {
                    const errorData = await response.json();
                    console.error("Logout failed:", errorData.message);
                    alert("Failed to log out. Please try again.");
                }
            } catch (error) {
                console.error("Error during logout:", error);
                alert("An error occurred while logging out. Please try again later.");
            }
        });
    } else {
        console.error("Logout button not found on the page.");
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
