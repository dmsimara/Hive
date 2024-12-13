// Wait until the page content is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Get the logout button
    const logoutButton = document.getElementById("logoutButton");

     // Handle logout click
    logoutButton.addEventListener("click", async () => {
        // Confirm logout
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) {
            return; // Exit if the user cancels
        }
        
        try {
              // Send logout request
            const response = await fetch("/api/auth/tenantLogout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); // Show success message
                window.location.href = "/"; // Redirect to homepage
            } else {
                alert(data.message || "Logout failed. Please try again."); // Show error message
            }
        } catch (error) {
            alert("An error occurred during logout. Please try again later."); // Handle errors
            console.error("Error:", error);
        }
    });
});
