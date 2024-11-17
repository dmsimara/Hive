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

    fetchTenants('');
});

document.getElementById('searchTenantsInput').addEventListener('input', function () {
    const searchTerm = this.value.trim(); 

    fetchTenants(searchTerm);
});

async function fetchTenants(searchTerm) {
    try {
        const response = await fetch('/admin/dashboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' 
            },
            body: JSON.stringify({ searchTenants: searchTerm })
        });

        const data = await response.json();

        if (data.success) {
            updateTenantCards(data.tenants); 
        } else {
            console.error('Error fetching tenants:', data.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error fetching tenants:', error);
    }
}

function updateTenantCards(tenants) {
    const tenantCardsContainer = document.getElementById('tenantCardsContainer');
    tenantCardsContainer.innerHTML = ''; 

    if (tenants.length > 0) {
        tenants.forEach(tenant => {
            const tenantCard = document.createElement('a');
            tenantCard.classList.add('card-link');
            tenantCard.href = "#"; 

            tenantCard.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        <img src="${tenant.tenantProfile ? `/images/upload/${tenant.tenantProfile}` : '/images/defaultUser.webp'}" alt="Profile" width="40px" class="me-2" />
                        <h5 class="card-title d-inline">${tenant.tenantFirstName} ${tenant.tenantLastName}</h5>
                    </div>
                </div>`;

            tenantCard.addEventListener('click', (event) => {
                event.preventDefault();  
                openTenantModal(tenant);  
            });

            tenantCardsContainer.appendChild(tenantCard);
        });
    } else {
        tenantCardsContainer.innerHTML = '<p>No active tenants found.</p>';
    }
}

function openTenantModal(tenant) {
    const tenantModal = new bootstrap.Modal(document.getElementById('tenantModal'));
    const modalTitle = document.querySelector('#tenantModal .modal-title');
    const modalBody = document.querySelector('#tenantModal .modal-body');

    modalTitle.textContent = `${tenant.tenantFirstName} ${tenant.tenantLastName}`;

    modalBody.innerHTML = `
        <p><strong>Email:</strong> ${tenant.tenantEmail}</p>
        <p><strong>Phone:</strong> ${tenant.mobileNum || 'N/A'}</p>
        <p><strong>Gender:</strong> ${tenant.gender || 'N/A'}</p>
        <p><strong>Guardian Number:</strong> ${tenant.tenantGuardianNum || 'N/A'}</p>
        <p><strong>Tenant ID:</strong> ${tenant.tenant_id}</p>
        <p><strong>Date Joined:</strong> ${tenant.dateJoined ? new Date(tenant.dateJoined).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Profile Picture:</strong><br/>
        <img src="${tenant.tenantProfile ? `/images/upload/${tenant.tenantProfile}` : '/images/defaultUser.webp'}" alt="Profile Picture" width="150px"></p>
    `;

    tenantModal.show();
}
