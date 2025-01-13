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

// document.addEventListener("DOMContentLoaded", () => {
//     const assignButtons = document.querySelectorAll('.assign-btn');
//     const assignModal = document.getElementById('assignModal');

//     // Select modal elements
//     const modalPicture = assignModal.querySelector('.dynamic-modal-picture');
//     const modalTitle = assignModal.querySelector('.dynamic-modal-title');
//     const roomNumber = assignModal.querySelector('.dynamic-room-number');
//     const maintenanceType = assignModal.querySelector('.dynamic-maintenance-type');
//     const urgency = assignModal.querySelector('.dynamic-urgency');
//     const dateTime = assignModal.querySelector('.dynamic-date-time');
//     const contactNumber = assignModal.querySelector('.dynamic-contact-number');
//     const description = assignModal.querySelector('.dynamic-description');
//     const fixIdInput = document.getElementById('maintenance_id');

//     // Add click event listener to each assign button
//     assignButtons.forEach(button => {
//         button.addEventListener('click', () => {
//             const fixId = button.getAttribute('data-maintenance-id');

//             // Fetch the correct fix data from the globally available `fixes` variable
//             const fix = window.fixes.find(f => f.maintenance_id == fixId);

//             if (fix) {
//                 // Dynamically update modal content
//                 modalPicture.src = fix.tenantProfile || '/images/defaultUser.webp';
//                 modalTitle.textContent = `${fix.tenantFirstName} ${fix.tenantLastName}`;
//                 roomNumber.textContent = `Room Number: ${fix.tenantRoomNumber || '-'}`;
//                 maintenanceType.textContent = fix.type || '-';
//                 urgency.textContent = fix.urgency || '-';
//                 dateTime.textContent = fix.tenantScheduledDate || '-';
//                 contactNumber.textContent = fix.tenantContactNumber || '-';
//                 description.textContent = fix.tenantDescription || '-';
//                 fixIdInput.value = fix.maintenance_id;
//             } else {
//                 console.error(`No fix found with ID: ${fixId}`);
//             }
//         });
//     });
// });
