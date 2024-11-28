
let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    const searchInput = document.getElementById("searchTenantsInput");

    if (!window.establishmentId) {
        console.error("establishmentId is not defined. Ensure it is passed correctly.");
        return;
    }

    fetchTenants("", window.establishmentId);

    searchInput.addEventListener("input", function () {
        const searchTerm = this.value.trim();
        fetchTenants(searchTerm, window.establishmentId);
    });

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        if (!isConfirmed) return;

        try {
            const response = await fetch("/api/auth/adminLogout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

async function fetchTenants(searchTerm, establishmentId) {
    try {
        const response = await fetch(`/admin/dashboard?searchTerm=${searchTerm}&establishmentId=${establishmentId}`, {
            headers: {
                "Accept": "application/json",
            }
        });

        if (response.headers.get("Content-Type").includes("text/html")) {
            console.error("Received HTML instead of JSON, likely due to a redirect or error page.");
            return;
        }

        const data = await response.json(); 

        if (response.ok && data.success) {
            updateTenantCards(data.tenants); 
        } else {
            console.error("Error fetching tenants:", data.message || "Unknown error");
        }
    } catch (error) {
        console.error("Error fetching tenants:", error);
    }
}

function updateTenantCards(tenants) {
    const tenantCardsContainer = document.getElementById("tenantCardsContainer");
    tenantCardsContainer.innerHTML = "";

    if (tenants.length > 0) {
        tenants.forEach((tenant) => {
            const tenantCard = document.createElement("a");
            tenantCard.classList.add("card-link");
            tenantCard.href = "#";

            tenantCard.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        <img src="${tenant.tenantProfile ? `/images/upload/${tenant.tenantProfile}` : "/images/defaultUser.webp"}" 
                             alt="Profile" width="40px" class="me-2" />
                        <h5 class="card-title d-inline">${tenant.tenantFirstName} ${tenant.tenantLastName}</h5>
                    </div>
                </div>`;

            tenantCard.addEventListener("click", (event) => {
                event.preventDefault();
                openTenantModal(tenant);
            });

            tenantCardsContainer.appendChild(tenantCard);
        });
    } else {
        tenantCardsContainer.innerHTML = "<p>No active tenants found.</p>";
    }
}

function openTenantModal(tenant) {
    const modalBody = document.querySelector("#tenantModal .modal-body");
    if (!modalBody) {
        console.error("Modal body not found!");
        return;
    }

    if (tenant && tenant.tenantFirstName && tenant.tenantLastName) {
        modalBody.innerHTML = `
            <p><strong>Name:</strong> ${tenant.tenantFirstName} ${tenant.tenantLastName}</p>
            <p><strong>Email:</strong> ${tenant.tenantEmail || "N/A"}</p>
            <p><strong>Phone:</strong> ${tenant.mobileNum || "N/A"}</p>
            <p><strong>Gender:</strong> ${tenant.gender || "N/A"}</p>
            <p><strong>Guardian Number:</strong> ${tenant.tenantGuardianNum || "N/A"}</p>
            <p><strong>Tenant ID:</strong> ${tenant.tenant_id || "N/A"}</p>`;

        const profileImageUrl = tenant.tenantProfile ? `/images/upload/${tenant.tenantProfile}` : "/images/defaultUser.webp";
        modalBody.innerHTML += `
            <h5>Profile Picture</h5>
            <img src="${profileImageUrl}" alt="Tenant Profile" class="img-fluid" style="max-width: 200px;"/>`;
    } else {
        modalBody.innerHTML = "<p>Tenant details are unavailable.</p>";
    }

    const modal = new bootstrap.Modal(document.getElementById("tenantModal"));
    modal.show();
}