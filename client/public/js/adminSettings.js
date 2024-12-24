let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    if (subMenu) {
        subMenu.classList.toggle("open-menu");
    }
}

function deleteAdmin(adminId) {
    console.log('adminId passed:', adminId);

    if (!adminId) {
        alert("Admin ID is missing");
        return;
    }

    if (!confirm("Are you sure you want to delete this admin account?")) return;

    fetch(`/api/auth/deleteAdmin/${adminId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Admin account successfully deleted');
                window.location.href = '/';  // Redirect to homepage
            } else {
                alert('Error deleting admin: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the admin account: ' + error.message);
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    
    // Handle form submission
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            alert("New password and confirm password do not match.");
            return;
        }

        // Check if any field is empty
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert("Please fill in all fields.");
            return;
        }

        const adminId = document.getElementById('adminId') ? document.getElementById('adminId').value : null;

        fetch('/api/auth/update-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword,
                adminId: adminId, 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Password updated successfully!');
                window.location.reload();  
            } else {
                alert('Error updating password: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while updating the password: ' + error.message);
        });
    });
});