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

    logoutButton.addEventListener("click", logout);
});

async function handleLogout() {
    const isConfirmed = confirm("Are you sure you want to logout?");
    
    if (!isConfirmed) {
        return;
    }

    try {
        const response = await fetch('/api/auth/adminLogout', {
            method: 'POST',  
            credentials: 'include',  
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);  
            window.location.href = "/";  
        } else {
            alert(`Logout failed: ${data.message || 'An error occurred'}`);
        }
    } catch (error) {
        console.error('Error logging out:', error);
        alert('An error occurred while logging out. Please try again.');
    }
}

document.getElementById('logoutButton').addEventListener('click', handleLogout);

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
            tenantCard.dataset.id = tenant.tenant_id;

            tenantCard.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        <img src="${tenant.tenantProfile ? `/images/upload/${tenant.tenantProfile}` : '/images/defaultUser.webp'}" 
                             alt="Profile" width="40px" class="me-2" />
                        <h5 class="card-title d-inline">${tenant.tenantFirstName} ${tenant.tenantLastName}</h5>
                    </div>
                </div>
            `;

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
    const tenantId = tenant.tenant_id;  
    console.log("Tenant ID: ", tenantId); 

    const modalBody = document.querySelector("#tenantModal .modal-body");

    if (!modalBody) {
        console.error("Modal body not found!");
        return;
    }

    fetch(`/api/auth/tenant/utilities?id=${tenantId}`)
        .then((response) => response.json())
        .then((data) => {
            const tenant = data.tenant;
            const utilities = data.utilities;

            console.log("Tenant Data: ", tenant);  
            console.log("Utilities: ", utilities);  

            const profileImageUrl = tenant.tenantProfile
                ? `/images/upload/${tenant.tenantProfile}`
                : "/images/defaultUser.webp";

            const tenantDetailsHTML = `
                <div class="profile-container">
                    <img src="${profileImageUrl}" alt="Tenant Profile" class="img-fluid"/>
                    <div class="profile-details">
                        <p class="name">${tenant.tenantFirstName || "Unknown"} ${tenant.tenantLastName || ""}</p>
                        <div class="contact-info">
                            <p class="mobileNum">
                                <span class="material-icons call-icon">call</span> 
                                ${tenant.mobileNum || "N/A"}
                            </p>
                            <p class="email">
                                <span class="material-icons email-icon">mail</span> 
                                ${tenant.tenantEmail || "N/A"}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="details-container">
                    <div class="details-row">
                        <p><strong>Tenant ID:</strong> <span>${tenant.tenant_id || "N/A"}</span></p>
                        <p><strong>Guardian:</strong> <span>${tenant.tenantGuardianName || "N/A"}</span></p>
                    </div>
                    <div class="second-row">
                        <p><strong>Gender:</strong> <span>${tenant.gender || "N/A"}</span></p>
                        <p><strong>Guardian Number:</strong> <span>${tenant.tenantGuardianNum || "N/A"}</span></p>
                    </div>
                </div>
            `;

            let utilitiesHTML = "";
            if (utilities && utilities.length > 0) {
                utilitiesHTML = utilities
                    .map(
                        (utility) => `
                        <tr>
                            <th scope="row">${utility.utilityType || "Unknown Utility"}</th>
                            <td>${utility.charge ? `PHP ${utility.charge}` : "N/A"}</td>
                            <td>${utility.statementDate || "N/A"}</td>
                            <td>${utility.dueDate || "N/A"}</td>
                            <td class="${utility.status ? utility.status.toLowerCase() : "unknown"}">
                                ${
                                    utility.status === "Paid"
                                        ? '<span class="badge bg-success">Paid</span>'
                                        : '<span class="badge bg-warning">Pending</span>'
                                }
                            </td>
                        </tr>
                    `
                    )
                    .join("");
            } else {
                utilitiesHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No utilities available</td>
                    </tr>
                `;
            }

            const utilitiesContainerHTML = `
                <div class="bills-container">
                    <div class="bills-header">
                        <p>Monthly Bills</p>
                        <a href="#" class="btn btn-edit btn-sm">
                            <i class="material-icons edit-icon">edit</i>Edit
                        </a>
                    </div>
                    <table class="table table-bordered">
                        <thead class="table-dark">
                            <tr>
                                <th scope="col">Utilities</th>
                                <th scope="col">Charge</th>
                                <th scope="col">Statement Date</th>
                                <th scope="col">Due Date</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${utilitiesHTML}
                        </tbody>
                    </table>
                </div>
            `;

            modalBody.innerHTML = tenantDetailsHTML + utilitiesContainerHTML;

            const modal = new bootstrap.Modal(document.getElementById("tenantModal"));
            modal.show();
        })
        .catch((error) => {
            console.error("Error fetching tenant and utilities data:", error);
        });
}

const searchInput = document.querySelector('#search');
const resultsBody = document.querySelector('#tenantCardsContainer');

loadData(); 

function loadData(query = '') {
    const request = new XMLHttpRequest();

    request.open('GET', `/api/auth/searchTenants?q=${query}`);

    request.onload = () => {
        try {
            const response = JSON.parse(request.responseText);

            let html = '';

            if (response.success && response.tenants.length > 0) {
                response.tenants.forEach(result => {
                    const tenantProfileImage = result.tenantProfile
                        ? `/images/upload/${result.tenantProfile}`
                        : '/images/defaultUser.webp'; 

                    html += `
                        <div class="card mb-3">
                            <div class="card-body">
                                <img src="${tenantProfileImage}" alt="Profile" class="me-2" />
                                <h5 class="card-title">${result.tenantFirstName} ${result.tenantLastName}</h5>
                            </div>
                        </div>
                    `;
                });
            } else {
                html = `<p>No tenants found</p>`;
            }

            resultsBody.innerHTML = html;
        } catch (e) {
            resultsBody.innerHTML = `<p>Error loading data. Please try again later.</p>`;
            console.error(e);
        }
    };

    request.onerror = () => {
        resultsBody.innerHTML = `<p>Network error. Please try again later.</p>`;
    };

    request.send();
}

searchInput.addEventListener('input', (event) => {
    loadData(event.target.value);
});

const isDarkTheme = document.body.classList.contains('dark-theme');

const logo = document.getElementById('logo');
if (isDarkTheme) {
    logo.src = '/images/hiveDark.png'; 
} else {
    logo.src = '/images/hiveLight.png'; 
}
