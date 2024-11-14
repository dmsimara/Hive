let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    const tenantForm = document.getElementById("tenantForm");
    const editTenantForm = document.getElementById("editForm"); // updated form ID
    const roomDropdown = document.getElementById("roomSelection");

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
            dateJoined: new Date().toISOString()
        };
    
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

    async function loadTenantData(tenantId) {
        try {
            const response = await fetch(`/api/auth/editTenant/${tenantId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('Fetched Tenant Data:', data);
    
            if (data.tenant) {
                document.getElementById("tenantId").value = data.tenant.tenant_id;
                document.getElementById("editFirstName").value = data.tenant.tenantFirstName;
                document.getElementById("editLastName").value = data.tenant.tenantLastName;
                document.getElementById("editEmail").value = data.tenant.tenantEmail;
                document.getElementById("editMobile").value = data.tenant.mobileNum;
                document.getElementById("editGender").value = data.tenant.gender;
            } else {
                alert('Tenant not found.');
            }
        } catch (error) {
            console.error('Error loading tenant data:', error);
            alert('Failed to load tenant data.');
        }
    }

    document.querySelectorAll(".edit-tenant-button").forEach(button => {
        button.addEventListener("click", function() {
            const tenantId = this.getAttribute("data-tenant-id");  
            console.log("Tenant ID for editing:", tenantId);  
            loadTenantData(tenantId); 
        });
    });

    editTenantForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const tenantId = document.getElementById("tenantId").value;
        const tenantData = {
            tenantFirstName: document.getElementById("editFirstName").value.trim(),
            tenantLastName: document.getElementById("editLastName").value.trim(),
            tenantEmail: document.getElementById("editEmail").value.trim(),
            mobileNum: document.getElementById("editMobile").value.trim(),
            gender: document.getElementById("editGender").value.trim()
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
    return Object.values(tenantData).every(value => value);
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