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

<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", function () {
    const datePicker = document.getElementById("datePicker");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); 
    const dd = String(today.getDate()).padStart(2, '0');
    
    datePicker.value = `${yyyy}-${mm}-${dd}`;
});

document.getElementById("customizeButton").addEventListener("click", function () {
    toggleContent("customizeContent");
});

document.getElementById("feedbackButton").addEventListener("click", function () {
    toggleContent("feedbackContent");
});

document.getElementById("passwordResetButton").addEventListener("click", function () {
    toggleContent("passwordResetContent");
});

function toggleContent(contentId) {
    document.querySelectorAll(".content-section").forEach(function (section) {
        section.classList.add("hidden");
    });
    document.getElementById(contentId).classList.remove("hidden");
}
=======
>>>>>>> 7edcfb35ddc5575f3e4ed8263804cbf85938b823
