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

// editTenant.js

document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        tenantId: document.getElementById('tenantId').value,
        tenantFirstName: document.getElementById('editFirstName').value,
        tenantLastName: document.getElementById('editLastName').value,
        tenantEmail: document.getElementById('editEmail').value,
        mobileNum: document.getElementById('editMobile').value,
        gender: document.getElementById('editGender').value,
    };

    await handleEditTenant(formData);
});

async function handleEditTenant(formData) {
    const tenantId = formData.tenantId;

    try {
        const response = await fetch(`/api/auth/updateTenant/${tenantId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Tenant updated successfully:', data);

            // Show success alert
            alert('Tenant updated successfully!');

            // Redirect to user management page after successful update
            window.location.href = '/admin/dashboard/userManagement';
        } else {
            const error = await response.text();
            console.error('Error:', error);
            alert('Error updating tenant');
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error occurred');
    }
}
