let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordField = document.getElementById('tenantPassword');
    const isPassword = passwordField.type === 'password';
    passwordField.type = isPassword ? 'text' : 'password';
    this.querySelector('i').textContent = isPassword ? 'visibility_off' : 'visibility';
});

document.getElementById('toggleConfirmPassword').addEventListener('click', function () {
    const confirmPasswordField = document.getElementById('tenantConfirmPassword');
    const isPassword = confirmPasswordField.type === 'password';
    confirmPasswordField.type = isPassword ? 'text' : 'password';
    this.querySelector('i').textContent = isPassword ? 'visibility_off' : 'visibility';
});

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    const tenantForm = document.getElementById("tenantForm");
    const roomDropdown = document.getElementById("roomSelection");

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

    document.getElementById("addTenantModal").addEventListener("show.bs.modal", async () => {
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

    tenantForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const tenantData = {
            tenantFirstName: document.getElementById("tenantFirstName").value.trim(),
            tenantLastName: document.getElementById("tenantLastName").value.trim(),
            tenantEmail: document.getElementById("tenantEmail").value.trim(),
            mobileNum: document.getElementById("mobileNum").value.trim(),
            tenantPassword: document.getElementById("tenantPassword").value.trim(),
            tenantConfirmPassword: document.getElementById("tenantConfirmPassword").value.trim(),
            gender: document.getElementById("gender").value.trim(),
            stayFrom: document.getElementById("stayFrom").value.trim(),
            stayTo: document.getElementById("stayTo").value.trim(),
            room_id: document.getElementById("roomSelection").value.trim(),
            tenantGuardianName: document.getElementById("tenantGuardianName").value.trim(),
            tenantAddress: document.getElementById("tenantAddress").value.trim(),
            tenantGuardianNum: document.getElementById("tenantGuardianNum").value.trim(),
            dateJoined: new Date().toISOString()
        };

        if (!validateTenantData(tenantData)) {
            alert("Please fill in all required fields.");
            return;
        }

        if (tenantData.tenantPassword !== tenantData.tenantConfirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (new Date(tenantData.stayTo) < new Date(tenantData.stayFrom)) {
            alert("End date cannot be before start date.");
            return;
        }

        try {
            const response = await fetch('/api/auth/addTenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tenantData)
            });
            const data = await response.json();

            if (data.success) {
                tenantForm.reset();
                alert("Tenant added successfully!");
                setTimeout(() => {
                    window.location.href = '/admin/dashboard/userManagement';
                }, 1000);
            } else {
                alert("Error adding tenant: " + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error adding the tenant.');
        }
    });
});

function validateTenantData(tenantData) {
    const requiredFields = ['tenantGuardianName', 'tenantAddress', 'tenantGuardianNum'];
    for (let field of requiredFields) {
        if (!tenantData[field] || tenantData[field].trim() === '') {
            alert(`Please fill in the ${field.replace('tenant', '').replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
            return false;
        }
    }
    return true;
}

function deleteTenant(tenantId) {
    console.log('tenantId passed:', tenantId);

    if (!tenantId) {
        alert("Tenant ID is missing");
        return;
    }

    if (!confirm("Are you sure you want to delete this tenant?")) return;

    fetch(`/api/auth/deleteTenant/${tenantId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Tenant successfully deleted');
                location.reload();
            } else {
                alert('Error deleting tenant: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the tenant: ' + error.message);
        });
}

const searchInput = document.querySelector('#search');
const resultsBody = document.querySelector('#results');

loadData();

function loadData(query = '') {
    const request = new XMLHttpRequest();

    request.open('GET', `/api/auth/search?q=${query}`);

    request.onload = () => {
        try {
            const response = JSON.parse(request.responseText); 

            let html = '';

            if (response.success && response.tenants.length > 0) {
                response.tenants.forEach(result => {
                    html += `
                        <tr>
                            <th scope="row">${result.tenant_id}</th>
                            <td>${result.tenantFirstName}</td>
                            <td>${result.tenantLastName}</td>
                            <td>${result.tenantEmail}</td>
                            <td>${result.gender}</td>
                            <td>${result.mobileNum}</td>
                            <td class="text-end">
                                <a href="/admin/dashboard/userManagement/editTenant/${result.tenant_id}" class="btn btn-edit btn-sm">
                                    <i class="material-icons edit-icon">edit</i> Edit
                                </a>
                                <a href="#" onclick="deleteTenant(${result.tenant_id})" class="btn btn-delete btn-sm">
                                    <i class="material-icons person-icon">person_remove</i> Delete
                                </a>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html += `
                    <tr>
                        <td colspan="7" class="text-center">No tenants found</td>
                    </tr>
                `;
            }

            resultsBody.innerHTML = html;

        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('An error occurred. Please try again.');
        }
    };

    request.onerror = () => {
        alert('An error occurred with the request.');
    };

    request.send();
}

searchInput.addEventListener('input', () => {
    const query = searchInput.value;
    loadData(query);  
});
