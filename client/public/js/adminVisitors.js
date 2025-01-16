let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) {
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
    const checkInButtons = document.querySelectorAll(".checkin-btn");
    const checkOutButtons = document.querySelectorAll(".checkout-btn");

    // Function to handle API calls
    const handleRequest = async (url, requestId, actionType, row) => {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ requestId }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Visitor marked ${actionType} successfully.`);

                // Update the `data-checkin` attribute dynamically
                if (actionType === "check-in") {
                    row.dataset.checkin = "true";
                } else if (actionType === "check-out") {
                    row.dataset.checkin = "false";
                }

                // Optionally, disable/enable buttons for better UX
                const checkInButton = row.querySelector(".checkin-btn");
                const checkOutButton = row.querySelector(".checkout-btn");

                if (actionType === "check-in") {
                    checkInButton.disabled = true;
                    checkOutButton.disabled = false;
                } else if (actionType === "check-out") {
                    checkInButton.disabled = false;
                    checkOutButton.disabled = true;
                }
            } else {
                alert(`Failed to mark ${actionType}: ${data.message}`);
            }
        } catch (error) {
            console.error(`Error during ${actionType}:`, error);
            alert(`An error occurred while trying to mark ${actionType}.`);
        }
    };

    // Add event listeners for check-in buttons
    checkInButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const row = button.closest("tr");
            const requestId = row.dataset.requestId; // Assuming each row has a data-request-id attribute
            if (requestId) {
                handleRequest("/api/auth/request/checkin", requestId, "check-in", row);
            } else {
                alert("Request ID is missing.");
            }
        });
    });

    // Add event listeners for check-out buttons
    checkOutButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const row = button.closest("tr");
            const requestId = row.dataset.requestId; // Get request ID
            const checkInStatus = row.dataset.checkin === "true"; // Convert data-checkin to boolean

            if (!checkInStatus) {
                alert("This visitor has not checked in yet.");
                return;
            }

            if (requestId) {
                handleRequest("/api/auth/request/checkout", requestId, "check-out", row);
            } else {
                alert("Request ID is missing.");
            }
        });
    });
});
