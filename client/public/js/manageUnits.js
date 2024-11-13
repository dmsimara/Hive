let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) return;

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

function deleteUnit(roomId) {
    const confirmation = confirm("Are you sure you want to delete this room?");
    
    if (confirmation) {
        fetch(`/api/auth/deleteUnit/${roomId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                alert('Room successfully deleted');
                location.reload();
            } else {
                alert('Error deleting room');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the room.');
        });
    } else {
        alert('Deletion canceled.');
    }
}

function formatDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(date).toLocaleDateString('en-GB', options);
}

function calculateRemainingPeriod(stayTo) {
    if (!stayTo) return null;
    
    const today = new Date();
    const endDate = new Date(stayTo);

    const timeDiff = endDate - today; 
    const remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
    
    return remainingDays >= 0 ? remainingDays : 0; 
}

function loadTenants(roomId) {
    const tenantList = document.getElementById("tenantList");
    tenantList.innerHTML = "<tr><td colspan='6' class='text-center'>Loading tenants...</td></tr>";

    fetch(`/admin/manage/unit/tenants?room_id=${roomId}`)
      .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
      })
      .then(data => {
        const totalSlot = data.roomTotalSlot || 0;
        const remainingSlot = data.roomRemainingSlot || 0;
        const rentedSlot = data.rented || 0;

        document.getElementById("totalSlot").innerText = totalSlot;
        document.getElementById("rentedSlot").innerText = rentedSlot;
        document.getElementById("remainingSlot").innerText = remainingSlot;

        tenantList.innerHTML = ""; // Clear loading message

        if (data.tenants && data.tenants.length > 0) {
            data.tenants.forEach(tenant => {
                const row = document.createElement("tr");

                const formattedStayFrom = tenant.stayFrom ? formatDate(tenant.stayFrom) : '';
                const formattedStayTo = tenant.stayTo ? formatDate(tenant.stayTo) : '';
                const periodRemaining = calculateRemainingPeriod(tenant.stayTo);

                row.innerHTML = `
                  <th scope="row">${tenant.tenant_id}</th>
                  <td>${tenant.tenantFirstName} ${tenant.tenantLastName}</td>
                  <td>${formattedStayFrom}</td>
                  <td>${formattedStayTo}</td>
                  <td>${periodRemaining} days</td>
                  <td class="text-end">
                    <a href="#" onclick="checkoutTenant('${tenant.tenant_id}')" class="btn btn-light btn-small">Check Out</a>
                  </td>
                `;
                tenantList.appendChild(row);
            });
        } else {
            tenantList.innerHTML = `<tr><td colspan="6" class="text-center">No tenants assigned</td></tr>`;
        }
      })
      .catch(error => {
          console.error('Error loading tenant data:', error);
          alert("Error loading tenant data. Please try again.");
      });
}

function checkoutTenant(tenantId) {
    console.log('tenantId passed:', tenantId);

    if (!tenantId) {
        alert("Tenant ID is missing");
        return;
    }

    if (!confirm("Are you sure you want to check out this tenant?")) return;

    fetch(`/api/auth/deleteTenant/${tenantId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Tenant successfully checked out');
                location.reload();
            } else {
                alert('Error checking out tenant: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while checking out the tenant: ' + error.message);
        });
}
