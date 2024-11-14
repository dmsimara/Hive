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

document.getElementById('searchTenantsInput').addEventListener('input', function () {
    const searchTerm = this.value.trim(); 

    if (searchTerm === '') {
        fetch('/admin/dashboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' 
            },
            body: JSON.stringify({ searchTenants: '' }) 
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateTenantCards(data.tenants); 
            }
        })
        .catch(error => {
            console.error('Error fetching all tenants:', error);
        });
    } else {
        fetch('/admin/dashboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ searchTenants: searchTerm })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateTenantCards(data.tenants); 
            }
        })
        .catch(error => {
            console.error('Error fetching tenant data:', error);
        });
    }
});

function updateTenantCards(tenants) {
    const tenantCardsContainer = document.getElementById('tenantCardsContainer');
    tenantCardsContainer.innerHTML = ''; 

    if (tenants.length > 0) {
        tenants.forEach(tenant => {
            const tenantCard = document.createElement('a');
            tenantCard.classList.add('card-link');
            tenantCard.href = `/admin/tenant/${tenant.tenantId}`;

            tenantCard.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        <img src="${tenant.tenantProfile ? `/images/upload/${tenant.tenantProfile}` : '/images/defaultUser.webp'}" alt="Profile" width="40px" class="me-2" />
                        <h5 class="card-title d-inline">${tenant.tenantFirstName} ${tenant.tenantLastName}</h5>
                    </div>
                </div>`;
            tenantCardsContainer.appendChild(tenantCard);
        });
    } else {
        tenantCardsContainer.innerHTML = '<p>No active tenants found.</p>';
    }
}