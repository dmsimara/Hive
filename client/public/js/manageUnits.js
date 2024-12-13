let subMenu = document.getElementById("subMenu");

// Toggle the submenu open/close
if (subMenu) {
    function toggleMenu() {
        subMenu.classList.toggle("open-menu");
    }
}

// Wait for the page to load
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");


// Handle logout functionality
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            const isConfirmed = confirm("Are you sure you want to log out?");
            
            if (!isConfirmed) {
                return;
            }
            
            try {
                  // Send logout request to server
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
    }
});

// Load tenants for a specific room
function loadTenants(roomId) {
    fetch(`/admin/manage/unit/tenants?room_id=${roomId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const tenantList = document.getElementById("tenantList");
            const totalSlot = document.getElementById("totalSlot");
            const rentedSlot = document.getElementById("rentedSlot");
            const remainingSlot = document.getElementById("remainingSlot");

             // Clear the existing tenant list
            if (tenantList) tenantList.innerHTML = ''; 

            const roomTotalSlot = data.roomTotalSlot || 0;
            const roomRemainingSlot = data.roomRemainingSlot || 0;

            const roomRentedSlot = roomTotalSlot - roomRemainingSlot;

            // Update room slot details
            if (totalSlot) totalSlot.textContent = roomTotalSlot;
            if (rentedSlot) rentedSlot.textContent = roomRentedSlot;
            if (remainingSlot) remainingSlot.textContent = roomRemainingSlot;

            const dateNow = new Date();

            // Display tenants or a message if none exist
            if (!data.tenants || data.tenants.length === 0) {
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan="6" class="text-center">No tenants assigned yet</td>`;
                if (tenantList) tenantList.appendChild(row);
            } else {
                data.tenants.forEach(tenant => {
                    const row = document.createElement("tr");

                     // Format tenant stay dates
                    const stayFromDate = new Date(tenant.stayFrom);
                    const stayToDate = new Date(tenant.stayTo);

                    const stayFromFormatted = isNaN(stayFromDate) ? 'Invalid date' : stayFromDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                    const stayToFormatted = isNaN(stayToDate) ? 'Invalid date' : stayToDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

                    const periodRemaining = isNaN(stayToDate) ? 'Invalid date' : Math.ceil((stayToDate - dateNow) / (1000 * 60 * 60 * 24));

                    // Add tenant data to table row
                    row.innerHTML = `
                        <td>${tenant.tenant_id}</td>
                        <td>${tenant.tenantFirstName} ${tenant.tenantLastName}</td>
                        <td>${stayFromFormatted}</td>
                        <td>${stayToFormatted}</td>
                        <td>${periodRemaining} days</td>
                        <td class="text-end">
                            <button class="btn btn-danger btn-small" onclick="removeTenant('${tenant.tenant_id}', '${roomId}')">Remove</button>
                        </td>
                    `;

                    if (tenantList) tenantList.appendChild(row);
                });
            }
        })
        .catch(error => console.error('Error loading tenants:', error));
}

// Remove a tenant from a room
function removeTenant(tenantId, roomId) {
    if (confirm("Are you sure you want to remove this tenant?")) {
        fetch(`/api/auth/deleteTenant/${tenantId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert("Tenant removed successfully");
                location.reload();
            } else {
                alert("Error removing tenant");
            }
        })
        .catch(error => console.error('Error removing tenant:', error));
    }
}

// Delete a room
function deleteUnit(roomId) {
    if (confirm("Are you sure you want to delete this room?")) {
        fetch(`/api/auth/deleteUnit/${roomId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert("Room deleted successfully");
                location.reload();
            } else {
                alert("Error deleting room");
            }
        })
        .catch(error => console.error('Error deleting room:', error));
    }
}
