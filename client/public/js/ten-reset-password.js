document.addEventListener('DOMContentLoaded', () => {
    const updatePasswordForm = document.querySelector("#updatePasswordForm");

    if (updatePasswordForm) {
        updatePasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const currentPassword = document.getElementById("currentPassword").value.trim();
            const newPassword = document.getElementById("newPassword").value.trim();
            const confirmPassword = document.getElementById("confirmPassword").value.trim();

            // Validation
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

                // Validate JSON response format
                if (!response.ok) {
                    const errorMessage = `HTTP Error: ${response.status}`;
                    console.error(errorMessage);
                    alert("Failed to update password. " + errorMessage);
                    return;
                }

                const data = await response.json();

                // Ensure the response has the expected structure
                if (data && data.success && data.message) {
                    alert(data.message); // Show the success message
                    location.reload(); // Reload the page after success
                } else {
                    const errorMsg = data?.message || "Unknown error occurred.";
                    alert("Error: " + errorMsg);
                }
            } catch (error) {
                console.error("Error:", error);
                alert("An unexpected error occurred. Please try again later.");
            }
        });
    } else {
        console.warn("Password update form not found on the page.");
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
