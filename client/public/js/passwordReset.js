let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    if (subMenu) {
        subMenu.classList.toggle("open-menu");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const updatePasswordForm = document.querySelector("#updatePasswordForm");
    if (updatePasswordForm) {
        updatePasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const currentPassword = document.getElementById("currentPassword")?.value.trim();
            const newPassword = document.getElementById("newPassword")?.value.trim();
            const confirmPassword = document.getElementById("confirmPassword")?.value.trim();

            if (!currentPassword || !newPassword || !confirmPassword) {
                alert("All fields are required. Please fill out the form completely.");
                return;
            }

            if (newPassword !== confirmPassword) {
                alert("New password and confirm password do not match. Please try again.");
                return;
            }

            const payload = { currentPassword, newPassword };

            try {
                const response = await fetch("/api/auth/update-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify(payload),
                });

                const result = await response.json();
                if (result.success) {
                    alert(result.message || "Password updated successfully!");
                    console.log("Reloading the page now..."); 
                    window.location.reload(); 
                } else {
                    alert(`Error updating password: ${result.message || "Unknown error occurred."}`);
                }
            } catch (error) {
                console.error("Error updating password:", error);
                alert("An error occurred. Please try again later.");
            }
        });
    } else {
        console.warn('Password update form not found on the page.');
    }

    const logoutButton = document.querySelector("#logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            const confirmLogout = confirm("Are you sure you want to log out?");
            if (!confirmLogout) return;

            try {
                const response = await fetch("/api/auth/adminLogout", {
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

