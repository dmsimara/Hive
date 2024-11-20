let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) return;

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

// JavaScript to close the modal
document.getElementById('closeModal').onclick = function() {
    document.getElementById('myModal').style.display = 'none'; // Hide the modal
    document.body.style.overflow = 'auto'; // Restore scrolling
  }
  
  // Example to open the modal (you can trigger this as needed)
  document.getElementById('openModal').onclick = function() {
    document.getElementById('myModal').style.display = 'block'; // Show the modal
    document.body.style.overflow = 'hidden'; // Prevent background scrolling when modal is open
  }
  