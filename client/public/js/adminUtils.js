let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

// async function handleLogout() {
//     const isConfirmed = confirm("Are you sure you want to logout?");
//     
//     if (!isConfirmed) {
//         return;
//     }
//
//     try {
//         const response = await fetch('/api/auth/adminLogout', {
//             method: 'POST',  
//             credentials: 'include',  
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });
//
//         const data = await response.json();
//
//         if (response.ok) {
//             alert(data.message);  
//             window.location.href = "/";  
//         } else {
//             alert(`Logout failed: ${data.message || 'An error occurred'}`);
//         }
//     } catch (error) {
//         console.error('Error logging out:', error);
//         alert('An error occurred while logging out. Please try again.');
//     }
// }

// document.getElementById('logoutButton').addEventListener('click', handleLogout);

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    const utilityForm = document.getElementById("utilityForm");
    const roomDropdown = document.getElementById("roomSelection");

    // Logout button functionality
    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        if (!isConfirmed) return;

        try {
            const response = await fetch("/api/auth/adminLogout", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                window.location.href = "/";
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Logout failed. Please try again.");
            }
        } catch (error) {
            alert("An error occurred during logout. Please try again later.");
            console.error("Error:", error);
        }
    });

    document.getElementById("addUtilityModal").addEventListener("show.bs.modal", async () => {
        try {
            const response = await fetch('/api/auth/getAvailableRooms');
            if (!response.ok) throw new Error("Failed to fetch available rooms");

            const data = await response.json();
            roomDropdown.innerHTML = '<option value="" disabled selected>Select a room</option>';
            data.availableRooms?.forEach(room => {
                const option = document.createElement("option");
                option.value = room.room_id;
                option.textContent = `Room ${room.roomNumber} - ${room.roomType} (Floor ${room.floorNumber})`;
                roomDropdown.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching available rooms:", error);
            alert("An error occurred while fetching available rooms.");
        }
    });

    utilityForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const utilityData = {
            utilityType: document.getElementById("utilityType").value.trim(),
            roomId: document.getElementById("roomSelection").value.trim(),
            charge: parseFloat(document.getElementById("charge").value.trim()),
            statementDate: document.getElementById("statementDate").value.trim(),
            dueDate: document.getElementById("dueDate").value.trim(),
            status: document.getElementById("status").value.trim()
        };

        try {
            const response = await fetch('/api/auth/add/utility', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(utilityData)
            });
        
            const data = await response.json();
        
            if (data.success) {
                utilityForm.reset();
                alert("Utility added successfully!");
        
                const utilityModal = new bootstrap.Modal(document.getElementById('addUtilityModal'));
                utilityModal.hide();
            } else {
                alert(data.message || "An unknown error occurred");
            }
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error adding the utility.');
        } finally {
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
        
    });
});

async function deleteUtility(utilityId) {
    console.log('utilityId passed:', utilityId);

    if (!utilityId) {
        alert("Utility ID is missing");
        return;
    }

    const isConfirmed = confirm("Are you sure you want to delete this utility?");
    if (!isConfirmed) return;

    try {
        const response = await fetch(`/api/auth/delete/utility/${utilityId}`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
            alert('Utility successfully deleted');
            location.reload();
        } else {
            alert('Error deleting utility: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while deleting the utility: ' + error.message);
    }
}

function loadTenants(room_id) {
    fetch(`/admin/utilities/${room_id}`)  
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const utilityList = document.getElementById("utilityList");

            if (utilityList) utilityList.innerHTML = ''; 

            if (!data.utilities || data.utilities.length === 0) {
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan="5" class="text-center">No utilities added yet</td>`;  
                if (utilityList) utilityList.appendChild(row);
            } else {
                data.utilities.forEach(utility => {
                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${utility.utilityType}</td>
                        <td>${utility.charge}</td>
                        <td>${utility.statementDate}</td>
                        <td>${utility.dueDate} days</td>
                        <td>${utility.status}</td>
                        <td class="text-end">
                            <a class="btn btn-primary btn-sm edit-btn" href="/admin/utilities/edit/${utility.utility_id}">Edit</a>
                            <button class="btn btn-danger btn-small remove-btn" onclick="removeUtility('${utility.utility_id}')">Remove</button>
                        </td>
                    `;

                    if (utilityList) utilityList.appendChild(row);
                });
            }
        })
        .catch(error => {
            console.error('Error loading utilities:', error);
            alert("An error occurred while loading the utilities.");
        });
}

async function removeUtility(utilityId) {
    if (confirm("Are you sure you want to remove this utility?")) {
        try {
            const response = await fetch(`/api/auth/delete/utility/${utilityId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                alert("Utility removed successfully");
                location.reload();
            } else {
                alert("Error removing tenant");
            }
        } catch (error) {
            console.error('Error removing utility:', error);
        }
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    const roomRows = document.querySelectorAll('.room-row');
    const seenRooms = new Set();
  
    roomRows.forEach(row => {
      const roomNumber = row.dataset.roomNumber;
  
      if (seenRooms.has(roomNumber)) {
        row.remove();  // Remove duplicate row
      } else {
        seenRooms.add(roomNumber);  // Mark this room as seen
      }
    });
});
