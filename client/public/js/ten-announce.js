document.addEventListener("DOMContentLoaded", () => {
    // Get logout button
    const logoutButton = document.getElementById("logoutButton");

    // Logout on button click
    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) return; // Exit if not confirmed

        try {
            // Send logout request
            const response = await fetch("/api/auth/tenantLogout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            // Show message and redirect
            if (response.ok) {
                alert(data.message); 
                window.location.href = "/"; // Go to homepage
            } else {
                alert(data.message || "Logout failed.");
            }
        } catch (error) {
            // Show error if request fails
            alert("Logout error.");
            console.error("Error:", error);
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    // Get filter buttons and notices container
    const buttons = document.querySelectorAll(".filter-link");
    const noticesContainer = document.getElementById("notices-container");

    // Fetch and display notices based on filter
    const fetchAndRenderNotices = async (filter) => {
        const currentFilter = document.querySelector(".filter-link.active");
        if (currentFilter && currentFilter.id === `${filter}-notices-btn`) {
            return; // Do nothing if filter is already active
        }

        buttons.forEach(button => button.classList.remove("active"));
        const activeButton = document.getElementById(`${filter}-notices-btn`);
        if (activeButton) activeButton.classList.add("active");

        try {
            const url = `/tenant/announcement?filter=${filter}`;
            const response = await fetch(url, { method: "GET" });

            if (!response.ok) throw new Error("Error fetching notices");

            const pageContent = await response.text(); 
            const parser = new DOMParser();
            const doc = parser.parseFromString(pageContent, 'text/html');
            const newNotices = doc.querySelector("#notices-container");

            if (newNotices) {
                noticesContainer.innerHTML = newNotices.innerHTML; // Update notices
            }
        } catch (error) {
            console.error("Error:", error);
            noticesContainer.innerHTML = "<p>Error loading notices.</p>";
        }
    };

    // Add click event to filter buttons
    buttons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            const filter = button.id.replace("-notices-btn", "");
            fetchAndRenderNotices(filter); // Fetch notices
        });
    });

    // Trigger default "all-notices" filter
    const initialButton = document.getElementById("all-notices-btn");
    if (initialButton) {
        initialButton.click();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // Set date picker to today’s date
    const datePicker = document.getElementById("datePicker");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    datePicker.value = `${yyyy}-${mm}-${dd}`; // Set value
});
