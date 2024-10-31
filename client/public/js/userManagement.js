// document.addEventListener('DOMContentLoaded', function() {
//     const urlParams = new URLSearchParams(window.location.search);
//     if (urlParams.has('updateSuccess')) {
//         alert('Tenant updated successfully!');
//     }
// });

function deleteTenant(tenantId) {
    const confirmation = confirm("Are you sure you want to delete this tenant?");
    if (confirmation) {
        fetch(`/api/auth/deleteTenant/${tenantId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                alert('Tenant successfully deleted');
                location.reload(); 
            } else {
                alert('Error deleting tenant');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the tenant.');
        });
    } else {
        alert('Deletion canceled.');
    }
}