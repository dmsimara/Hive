let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
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
                window.location.href = '/';  
            } else {
                alert('Error deleting admin: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the admin account: ' + error.message);
        });
}
