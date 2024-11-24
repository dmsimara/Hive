let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    const tenantForm = document.getElementById("tenantForm");
    const editTenantForm = document.getElementById("editForm"); // updated form ID
    const roomDropdown = document.getElementById("roomSelection");

    // Logout button click event
    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        if (!isConfirmed) return;

        try {
            const response = await fetch("/api/auth/adminLogout", { method: "POST", headers: { "Content-Type": "application/json" } });
            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                window.location.href = "/";
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Logout failed. Please try again.");
            }
        } catch (error) {
            alert("An error occurred during logout. Please try again later.");
            console.error("Error:", error);
        }
    });

    // Fetch available rooms when the "Add Tenant" modal is shown
    document.getElementById("addTenantModal").addEventListener("show.bs.modal", async () => {
        try {
            const response = await fetch('/api/auth/getAvailableRooms');
            if (!response.ok) throw new Error("Failed to fetch available rooms");

            const data = await response.json();
            roomDropdown.innerHTML = '<option value="" disabled selected>Select a room</option>';
            data.availableRooms?.forEach(room => {
                const option = document.createElement("option");
                option.value = room.room_id;
                option.textContent = `Room ${room.roomNumber} - ${room.roomType} (Floor ${room.floorNumber})`;
                roomDropdown.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching available rooms:", error);
            alert("An error occurred while fetching available rooms.");
        }
    });

    // Tenant form submission for adding new tenant
    tenantForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const tenantData = {
            tenantFirstName: document.getElementById("tenantFirstName").value.trim(),
            tenantLastName: document.getElementById("tenantLastName").value.trim(),
            tenantEmail: document.getElementById("tenantEmail").value.trim(),
            mobileNum: document.getElementById("mobileNum").value.trim(),
            tenantPassword: document.getElementById("tenantPassword").value.trim(),
            tenantConfirmPassword: document.getElementById("tenantConfirmPassword").value.trim(),
            gender: document.getElementById("gender").value.trim(),
            stayFrom: document.getElementById("stayFrom").value.trim(),
            stayTo: document.getElementById("stayTo").value.trim(),
            room_id: document.getElementById("roomSelection").value.trim(),
            tenantGuardianName: document.getElementById("tenantGuardianName").value.trim(),
            tenantAddress: document.getElementById("tenantAddress").value.trim(),
            tenantGuardianNum: document.getElementById("tenantGuardianNum").value.trim(),
            dateJoined: new Date().toISOString()
        };

        // Validate tenant data
        if (!validateTenantData(tenantData)) {
            alert("Please fill in all required fields.");
            return;
        }

        if (tenantData.tenantPassword !== tenantData.tenantConfirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (new Date(tenantData.stayTo) < new Date(tenantData.stayFrom)) {
            alert("End date cannot be before start date.");
            return;
        }

        try {
            const response = await fetch('/api/auth/addTenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tenantData)
            });
            const data = await response.json();
            if (data.success) {
                alert("Tenant added successfully!");
                tenantForm.reset();
                window.location.href = '/admin/dashboard/userManagement';
            } else {
                alert("Error adding tenant: " + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error adding the tenant.');
        }
    });

    // Edit tenant form submission
    editTenantForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const tenantId = document.getElementById("tenantId").value;
        const tenantData = {
            tenantFirstName: document.getElementById("editFirstName").value.trim(),
            tenantLastName: document.getElementById("editLastName").value.trim(),
            tenantEmail: document.getElementById("editEmail").value.trim(),
            mobileNum: document.getElementById("editMobile").value.trim(),
            gender: document.getElementById("editGender").value.trim(),
            tenantGuardianName: document.getElementById("editTenantGuardianName").value.trim(),
            tenantAddress: document.getElementById("editTenantAddress").value.trim(),
            tenantGuardianNum: document.getElementById("editTenantGuardianNum").value.trim()
        };

        if (!validateTenantData(tenantData)) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const response = await fetch(`/api/auth/updateTenant/${tenantId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tenantData)
            });
            const data = await response.json();
            if (data.success) {
                alert("Tenant updated successfully!");
                window.location.href = '/admin/dashboard/userManagement';
            } else {
                alert("Error updating tenant: " + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error updating the tenant.');
        }
    });
});

function validateTenantData(tenantData) {
    const requiredFields = ['tenantGuardianName', 'tenantAddress', 'tenantGuardianNum'];
    for (let field of requiredFields) {
        if (!tenantData[field] || tenantData[field].trim() === '') {
            alert(`Please fill in the ${field.replace('tenant', '').replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
            return false;
        }
    }
    return true;
}

function deleteTenant(tenantId) {
    console.log('tenantId passed:', tenantId);

    if (!tenantId) {
        alert("Tenant ID is missing");
        return;
    }

    if (!confirm("Are you sure you want to delete this tenant?")) return;

    fetch(`/api/auth/deleteTenant/${tenantId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Tenant successfully deleted');
                location.reload();
            } else {
                alert('Error deleting tenant: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the tenant: ' + error.message);
        });
}
