document.addEventListener("DOMContentLoaded", () => {
    // Get all the necessary elements
    const logoutButton = document.getElementById("logoutButton");
    const editInfoButton = document.querySelector('.edit-info-btn');
    const editModal = document.getElementById('editModal');
    const closeButton = document.querySelector('.close-modal');
    const editForm = document.getElementById('editForm');
    const modal = document.getElementById('editModal');
    const closeModalButton = document.querySelector('.close-modal');
    const datePicker = document.getElementById("datePicker");

    // Logout button functionality
    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) return;

        try {
            const response = await fetch("/api/auth/tenantLogout", {
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

    // Show modal when "Edit Info" is clicked
    editInfoButton.addEventListener('click', () => {
        editModal.classList.remove('hidden');
    });

    // Close the modal when the close button is clicked
    closeButton.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

    // Handle form submission for editing tenant info
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form behavior

        const updatedData = {
            tenantId: document.getElementById('tenantId').value,
            name: document.getElementById('tenantName').value,
            contact: document.getElementById('tenantContact').value,
            email: document.getElementById('tenantEmail').value,
        };

        try {
            const response = await fetch('/updateTenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                alert('Tenant info updated successfully!');
                editModal.classList.add('hidden'); // Close modal
            } else {
                alert('Failed to update tenant info.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    });

    closeModalButton.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const dd = String(today.getDate()).padStart(2, '0');
    datePicker.value = `${yyyy}-${mm}-${dd}`;
});
