const editInfoButton = document.querySelector('.edit-info-btn'); // The "Edit Info" button
const editModal = document.getElementById('editModal'); // The modal
const closeButton = document.querySelector('.close-modal'); // Close button in modal
const editForm = document.getElementById('editForm'); // The form in the modal

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) {
            return;
        }
        
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
});

// Show the modal when "Edit Info" is clicked
editInfoButton.addEventListener('click', () => {
    editModal.classList.remove('hidden');
});

closeButton.addEventListener('click', () => {
    editModal.classList.add('hidden');
});

// Handle form submission
editForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form behavior

    // Collect updated form data
    const updatedData = {
        tenantId: document.getElementById('tenantId').value,
        name: document.getElementById('tenantName').value,
        contact: document.getElementById('tenantContact').value,
        email: document.getElementById('tenantEmail').value,
    };

    try {
        // Send data to backend
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

// Modal functionality (optional)
const modal = document.getElementById('editModal');
const closeModalButton = document.querySelector('.close-modal');

closeModalButton.addEventListener('click', () => {
    modal.classList.add('hidden');
});

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) {
            return;
        }
        
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
});

document.addEventListener("DOMContentLoaded", function () {
    const datePicker = document.getElementById("datePicker");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const dd = String(today.getDate()).padStart(2, '0');
    
    // Set the date picker's value to today's date
    datePicker.value = `${yyyy}-${mm}-${dd}`;
});