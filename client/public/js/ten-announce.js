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
    const buttons = document.querySelectorAll(".filter-link");
    const noticesContainer = document.getElementById("notices-container");

    const fetchAndRenderNotices = async (filter) => {
        const currentFilter = document.querySelector(".filter-link.active");
        if (currentFilter && currentFilter.id === `${filter}-notices-btn`) {
            return;
        }

        buttons.forEach(button => button.classList.remove("active"));
        const activeButton = document.getElementById(`${filter}-notices-btn`);
        if (activeButton) activeButton.classList.add("active");

        try {
            const url = `/tenant/announcement?filter=${filter}`;
            const response = await fetch(url, { method: "GET" });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const pageContent = await response.text(); 
            const parser = new DOMParser();
            const doc = parser.parseFromString(pageContent, 'text/html');
            const newNotices = doc.querySelector("#notices-container"); 

            if (newNotices) {
                noticesContainer.innerHTML = newNotices.innerHTML;
            }
        } catch (error) {
            console.error("Failed to fetch notices:", error);
            noticesContainer.innerHTML = "<p>Error loading notices. Please try again later.</p>";
        }
    };

    buttons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault();

            const filter = button.id.replace("-notices-btn", "");
            fetchAndRenderNotices(filter);
        });
    });

    const initialButton = document.getElementById("all-notices-btn");
    if (initialButton) {
        initialButton.click();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const datePicker = document.getElementById("datePicker");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const dd = String(today.getDate()).padStart(2, '0');
    
    // Set the date picker's value to today's date
    datePicker.value = `${yyyy}-${mm}-${dd}`;
});