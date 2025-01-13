document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) {
            return;
        }
        
        try {
            const response = await fetch("/api/auth/tenantLogout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); 
                window.location.href = "/"; 
            } else {
                alert(data.message || "Logout failed. Please try again.");
            }
        } catch (error) {
            alert("An error occurred during logout. Please try again later.");
            console.error("Error:", error);
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const maintenanceForm = document.getElementById("maintenanceForm");

    maintenanceForm.addEventListener("submit", async (event) => {
        event.preventDefault();  

        const formData = new FormData(maintenanceForm);

        try {
            const response = await fetch("/api/auth/add/maintenance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: formData.get("type"),
                    description: formData.get("description"),
                    urgency: formData.get("urgency"),
                    scheduledDate: formData.get("scheduledDate"),
                    contactNum: formData.get("contactNum"),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Maintenance request submitted successfully!");
                window.location.reload(); 
            } else {
                alert(data.message || "Failed to submit the request. Please try again.");
            }
        } catch (error) {
            alert("An error occurred during form submission. Please try again later.");
            console.error("Error:", error);
        }
    });
});
