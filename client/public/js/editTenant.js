document.addEventListener("DOMContentLoaded", () => {
    const editForm = document.getElementById("editForm");
    const alertMessageDiv = document.getElementById("alertMessage");

    editForm.addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(editForm);
        const formDataJSON = Object.fromEntries(formData.entries()); // Convert to JSON

        fetch(editForm.action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formDataJSON)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert(data.message, 'success');
                setTimeout(() => {
                    window.location.href = '/admin/dashboard/userManagement';
                }, 1000); 
            } else {
                showAlert(data.message, 'danger');
            }
        })
        .catch(error => {
            showAlert("An unexpected error occurred. Please try again later.", 'danger');
        });
    });

    function showAlert(message, type) {
        alertMessageDiv.style.display = 'block';
        alertMessageDiv.className = `alert alert-${type}`;
        alertMessageDiv.textContent = message;
        setTimeout(() => {
            alertMessageDiv.style.display = 'none';
        }, 2000); 
    }
});
