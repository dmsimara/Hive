const alertMessage = document.getElementById('alertMessage');
const form = document.querySelector('form'); // Ensure you define the form variable

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('Form submission started');

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const establishmentIdInput = document.querySelector('input[name="establishmentId"]');
    data.establishmentId = establishmentIdInput.value;

    try {
        const response = await fetch('/api/auth/addUnit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert('Room added successfully!');
            form.reset();
            window.location.href = '/admin/manage/unit'; // Redirect to manageUnit.hbs
        } else {
            const result = await response.json();
            alert(result.message || 'An error occurred. Please try again.');
        }
    } catch (error) {
        alert('An error occurred. Please try again.');
        console.error('Error adding unit:', error);
    }
});

const subMenu = document.getElementById("subMenu");

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
            console.error("Error during logout:", error);
        }
    });
});
