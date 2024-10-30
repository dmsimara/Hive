document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        // Ask for confirmation before logging out
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) {
            // User chose not to log out, simply return to the dashboard
            return;
        }
        
        try {
            const response = await fetch("/api/auth/adminLogout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); // Optional feedback to the user
                window.location.href = "/"; // Redirect to the home page
            } else {
                alert(data.message || "Logout failed. Please try again.");
            }
        } catch (error) {
            alert("An error occurred during logout. Please try again later.");
            console.error("Error:", error);
        }
    });
});
