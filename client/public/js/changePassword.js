document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById("resetForm");

    resetForm.addEventListener("submit", async (event) => {
        event.preventDefault(); 

        const adminPassword = document.getElementById("adminPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (adminPassword !== confirmPassword) {
            alert("Passwords do not match. Please try again.");
            return;
        }

        const resetToken = window.location.pathname.split("/").pop(); 

        try {
            const response = await fetch(`/api/auth/reset-password/${resetToken}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ adminPassword }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                alert("Password has been updated successfully!");
                window.location.href = "/admin/login";
            } else {
                throw new Error(result.message || "Failed to reset password. Please try again.");
            }
        } catch (error) {
            alert(error.message || "An unexpected error occurred.");
        }
    });
});
