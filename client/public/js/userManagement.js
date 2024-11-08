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

function deleteTenant(tenantId) {
    const confirmation = confirm("Are you sure you want to delete this tenant?");
    if (!confirmation) return;

    fetch(`/api/auth/deleteTenant/${tenantId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Tenant successfully deleted');
            location.reload();  // Reload to reflect the changes
        } else {
            alert('Error deleting tenant: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the tenant: ' + error.message);
    });
}


// Handle form submission for adding a tenant
document.getElementById("tenantForm").addEventListener("submit", async function(event) {
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
        dateJoined: new Date().toISOString()
    };

    if (!Object.values(tenantData).every(value => value)) {
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tenantData)
        });

        const data = await response.json();
        if (data.success) {
            alert("Tenant added successfully!");
            document.getElementById("tenantForm").reset();
            const addTenantModal = new bootstrap.Modal(document.getElementById("addTenantModal"));
            addTenantModal.hide();
            window.location.href = '/admin/dashboard/userManagement';
        } else {
            alert("Error adding tenant: " + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error adding the tenant.');
    }
});

// Handle tenant editing
document.getElementById("editTenantForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const tenantId = document.getElementById("tenantId").value;
    const tenantData = {
        tenantFirstName: document.getElementById("editFirstName").value.trim(),
        tenantLastName: document.getElementById("editLastName").value.trim(),
        tenantEmail: document.getElementById("editEmail").value.trim(),
        mobileNum: document.getElementById("editMobile").value.trim(),
        gender: document.getElementById("editGender").value.trim()
    };

    if (!Object.values(tenantData).every(value => value)) {
        alert("Please fill in all required fields.");
        return;
    }

    try {
        const response = await fetch(`/api/auth/updateTenant/${tenantId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tenantData)
        });
    
        const data = await response.json();
        if (response.ok) {
            alert("Tenant updated successfully!");
            const editTenantModal = new bootstrap.Modal(document.getElementById("editTenantModal"));
            editTenantModal.hide();
            location.reload();
        } else {
            alert("Error updating tenant: " + (data.message || "Unknown error"));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error updating the tenant.');
    }
});
