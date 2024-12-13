let subMenu = document.getElementById("subMenu");

// Function to toggle submenu visibility
function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

// Show/hide password when clicking the toggle button for password field
document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordField = document.getElementById('tenantPassword');
   
    passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
    this.querySelector('i').textContent = passwordField.type === 'password' ? 'visibility_off' : 'visibility';
});

// Show/hide password when clicking the toggle button for confirm password field
document.getElementById('toggleConfirmPassword').addEventListener('click', function () {
    const confirmPasswordField = document.getElementById('tenantConfirmPassword');

    confirmPasswordField.type = confirmPasswordField.type === 'password' ? 'text' : 'password';
    this.querySelector('i').textContent = confirmPasswordField.type === 'password' ? 'visibility_off' : 'visibility';
});

// When the page is loaded, handle events like logout, form submission, and room selection
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    const tenantForm = document.getElementById("tenantForm");
    const roomDropdown = document.getElementById("roomSelection");

    // Logout button functionality
    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        if (!isConfirmed) return;
        try {
            const response = await fetch("/api/auth/adminLogout", { method: "POST" });
            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                window.location.href = "/";
            } else {
                alert("Logout failed. Please try again.");
            }
        } catch (error) {
            alert("An error occurred. Please try again later.");
        }
    });

    // When the "Add Tenant" modal is shown, fetch available rooms
    document.getElementById("addTenantModal").addEventListener("show.bs.modal", async () => {
        try {
            const response = await fetch('/api/auth/getAvailableRooms');
            const data = await response.json();
            roomDropdown.innerHTML = '<option value="" disabled selected>Select a room</option>';
            data.availableRooms.forEach(room => {
                const option = document.createElement("option");
                option.value = room.room_id;
                option.textContent = `Room ${room.roomNumber} - ${room.roomType} (Floor ${room.floorNumber})`;
                roomDropdown.appendChild(option);
            });
        } catch (error) {
            alert("Error fetching available rooms.");
        }
    });

    // Handle the tenant form submission
    tenantForm.addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent default form submission
        const tenantData = {
            tenantFirstName: document.getElementById("tenantFirstName").value.trim(),
            tenantLastName: document.getElementById("tenantLastName").value.trim(),
            tenantEmail: document.getElementById("tenantEmail").value.trim(),
            tenantPassword: document.getElementById("tenantPassword").value.trim(),
            tenantConfirmPassword: document.getElementById("tenantConfirmPassword").value.trim(),
            room_id: document.getElementById("roomSelection").value.trim()
        };

        // Check if all required fields are filled
        if (!validateTenantData(tenantData)) {
            alert("Please fill in all required fields.");
            return;
        }

        // Check if passwords match
        if (tenantData.tenantPassword !== tenantData.tenantConfirmPassword) {
            alert("Passwords do not match!");
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
                tenantForm.reset(); // Reset the form
                window.location.href = '/admin/dashboard/userManagement'; // Redirect to user management page
            } else {
                alert("Error adding tenant: " + data.message);
            }
        } catch (error) {
            alert('Error adding tenant.');
        }
    });
});

// Validate if required fields are filled in the tenant form
function validateTenantData(tenantData) {
    const requiredFields = ['tenantFirstName', 'tenantLastName', 'tenantEmail'];
    for (let field of requiredFields) {
        if (!tenantData[field]) {
            alert(`Please fill in the ${field.replace('tenant', '').toLowerCase()}.`);
            return false;
        }
    }
    return true;
}

// Function to delete a tenant
function deleteTenant(tenantId) {
    if (!tenantId) {
        alert("Tenant ID is missing");
        return;
    }

    if (!confirm("Are you sure you want to delete this tenant?")) return;

    // Send delete request to the server
    fetch(`/api/auth/deleteTenant/${tenantId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Tenant successfully deleted');
                location.reload(); // Reload the page to update the list
            } else {
                alert('Error deleting tenant: ' + data.message);
            }
        })
        .catch(error => {
            alert('Error occurred while deleting tenant.');
        });
}
