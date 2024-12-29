let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    const closeButton = document.getElementById("closeButton");
    const editForm = document.getElementById("editForm");

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            const isConfirmed = confirm("Are you sure you want to log out?");
            if (!isConfirmed) return;

            try {
                const response = await fetch("/api/auth/adminLogout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
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
    }

    if (closeButton) {
        closeButton.addEventListener("click", (e) => {
            const isConfirmed = confirm("Your changes will not be saved. Are you sure you want to close?");
            if (isConfirmed) {
                window.location.href = "/admin/utilities";
            } else {
                e.preventDefault();
            }
        });
    }

    if (editForm) {
        editForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = {
                utilityId: document.getElementById("utilityId").value,
                utilityType: document.getElementById("editUtilityType").value,
                charge: document.getElementById("editCharge").value,
                statementDate: document.getElementById("editStatementDate").value,
                dueDate: document.getElementById("editDueDate").value,
                status: document.getElementById("editStatus").value,
            };

            await handleEditUtility(formData);
        });
    }
});

async function handleEditUtility(formData) {
    try {
        const response = await fetch(`/api/auth/editUtility/${formData.utilityId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            alert("Utility updated successfully!");
            window.location.href = "/admin/utilities";
        } else {
            const error = await response.text();
            alert(`Error: ${error}`);
            console.error("Error:", error);
        }
    } catch (error) {
        alert("Network error occurred. Please try again.");
        console.error("Network error:", error);
    }
}
