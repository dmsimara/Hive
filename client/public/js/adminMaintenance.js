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
    const moreIcon = document.querySelector(".more-icon");
    const popupMenu = document.querySelector(".popup-menu");

    moreIcon.addEventListener("click", () => {
        popupMenu.classList.toggle("hidden");
    });

    // Optional: Hide the popup when clicking outside of it
    document.addEventListener("click", (event) => {
        if (!popupMenu.contains(event.target) && event.target !== moreIcon) {
            popupMenu.classList.add("hidden");
        }
    });
});