document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton"); // Get logout button

    // Log out when the button is clicked
    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?"); // Confirm logout
        
        if (!isConfirmed) {
            return; // If not confirmed, do nothing
        }

        try {
            // Send a request to log out
            const response = await fetch("/api/auth/tenantLogout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Set content type
                },
            });

            const data = await response.json(); // Get response data

            if (response.ok) {
                alert(data.message); // Show success message
                window.location.href = "/"; // Redirect to home page
            } else {
                alert(data.message || "Logout failed. Please try again."); // Show error message
            }
        } catch (error) {
            // Handle errors
            alert("An error occurred during logout. Please try again later.");
            console.error("Error:", error); // Log the error
        }
    });
});
