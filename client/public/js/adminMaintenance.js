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

document.addEventListener("DOMContentLoaded", () => {
    const deleteButtons = document.querySelectorAll('.delete-btn');

    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const maintenanceId = this.getAttribute('data-id'); 

            const confirmation = confirm("Are you sure you want to mark this maintenance as done?");
            if (confirmation) {
                fetch(`/api/auth/update/maintenance/${maintenanceId}/done`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Maintenance marked as done successfully') {
                        alert('Maintenance marked as done successfully!');
                        window.location.reload();
                    } else {
                        alert('Failed to mark maintenance as done. Please try again.');
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Failed to mark maintenance as done. Please try again.');
                });
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const rowContainer = document.querySelector('.row-container');
    const totalCards = rowContainer.querySelectorAll('.card').length;
    
    if (totalCards < 3) {
        const numEmptyCards = 3 - totalCards;  
        
        for (let i = 0; i < numEmptyCards; i++) {
            const emptyCard = document.createElement('div');
            emptyCard.classList.add('empty-card');
            rowContainer.appendChild(emptyCard);
        }
    }
});
