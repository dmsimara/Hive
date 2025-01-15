document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById("resetForm");

    resetForm.addEventListener("submit", async (event) => {
        event.preventDefault();  

        const tenantEmail = document.getElementById("tenantEmail").value;

        try {
            const response = await fetch("/api/auth/tenant/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ tenantEmail }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                window.location.href = `/tenant/reset-password?tenantEmail=${encodeURIComponent(tenantEmail)}`;
            } else {
                throw new Error(result.message || "Failed to send reset link. Please try again.");
            }
        } catch (error) {
            alert(error.message || "An unexpected error occurred.");
        }
    });
});
