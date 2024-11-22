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

// Function to load tenants for a specific room
function loadTenants(roomId) {
    fetch(`/admin/manage/unit/tenants/${roomId}`)
        .then(response => response.json())
        .then(data => {
            const tenantList = document.getElementById("tenantList");
            const totalSlot = document.getElementById("totalSlot");
            const rentedSlot = document.getElementById("rentedSlot");
            const remainingSlot = document.getElementById("remainingSlot");

            tenantList.innerHTML = ''; // Clear previous data

            // Populate total, rented, and remaining slots
            totalSlot.textContent = data.totalSlot;
            rentedSlot.textContent = data.rentedSlot;
            remainingSlot.textContent = data.remainingSlot;

            // Create table rows for tenants
            data.tenants.forEach(tenant => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${tenant.tenant_id}</td>
                    <td>${tenant.name}</td>
                    <td>${tenant.rent_from}</td>
                    <td>${tenant.rent_until}</td>
                    <td>${tenant.period_remaining}</td>
                    <td class="text-end">
                        <button class="btn btn-danger btn-small" onclick="removeTenant('${tenant.tenant_id}', '${roomId}')">Remove</button>
                    </td>
                `;

                tenantList.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading tenants:', error));
}

// Function to remove a tenant
function removeTenant(tenantId, roomId) {
    // Add logic to remove tenant here
    console.log(`Remove tenant ${tenantId} from room ${roomId}`);
}

// Function to delete a unit
function deleteUnit(roomId) {
    if (confirm("Are you sure you want to delete this room?")) {
        fetch(`/admin/manage/unit/delete/${roomId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Room deleted successfully");
                    location.reload(); // Reload the page to reflect changes
                } else {
                    alert("Error deleting room");
                }
            })
            .catch(error => console.error('Error deleting room:', error));
    }
}
