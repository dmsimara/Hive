document.addEventListener("DOMContentLoaded", () => {
    // Function to handle API requests
    async function sendApiRequest(url, options) {
        try {
            const response = await fetch(url, options);
            const data = await response.json();

            if (response.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || "Request failed. Please try again." };
            }
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "An error occurred. Please try again later." };
        }
    }

    // Logout functionality
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            const isConfirmed = confirm("Are you sure you want to log out?");
            if (!isConfirmed) return;

            const result = await sendApiRequest("/api/auth/tenantLogout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            alert(result.message);
            if (result.success) window.location.href = "/";
        });
    }

    // Profile picture update functionality
    const profileImage = document.getElementById('profileImage');
    const fileInput = document.getElementById('fileInput');
    const updateForm = document.getElementById("updateTenantForm");

    if (profileImage && fileInput) {
        profileImage.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => profileImage.src = e.target.result;
                reader.readAsDataURL(file);
            }
        });
    }

    // Form submission for profile update
    if (updateForm) {
        updateForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const formData = new FormData(updateForm);

            if (fileInput.files.length === 0) formData.delete("profilePicture");

            const result = await sendApiRequest(updateForm.action, {
                method: updateForm.method,
                body: formData,
            });

            alert(result.message);
            if (result.success) window.location.href = "/tenant/room-details/view/account";
        });
    }

    // Cancel button functionality
    const cancelButton = document.querySelector(".cancel");
    if (cancelButton) {
        cancelButton.addEventListener("click", (event) => {
            event.preventDefault();

            const isConfirmed = confirm("Are you sure you want to cancel? Any unsaved changes will be lost.");
            if (isConfirmed) {
                setTimeout(() => {
                    window.location.href = "/tenant/room-details/view/account";
                }, 1000);
            }
        });
    }
});