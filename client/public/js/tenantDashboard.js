document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    // Logout process when the button is clicked
    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        // If not confirmed, stop the process
        if (!isConfirmed) {
            return;
        }
        
        try {
            // Send logout request to the server
            const response = await fetch("/api/auth/tenantLogout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            // If logout is successful, show message and redirect
            if (response.ok) {
                alert(data.message); 
                window.location.href = "/"; 
            } else {
                // If logout fails, show error message
                alert(data.message || "Logout failed. Please try again.");
            }
        } catch (error) {
            // Show error message if request fails
            alert("An error occurred during logout. Please try again later.");
            console.error("Error:", error);
        }
    });
});

// Set the date picker to today's date
document.addEventListener("DOMContentLoaded", function () {
    const datePicker = document.getElementById("datePicker");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); 
    const dd = String(today.getDate()).padStart(2, '0');
    
    // Set the value of the date picker to today's date
    datePicker.value = `${yyyy}-${mm}-${dd}`;
});
