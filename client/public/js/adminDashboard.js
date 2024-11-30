
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
        const profileImageUrl = tenant.tenantProfile ? `/images/upload/${tenant.tenantProfile}` : "/images/defaultUser.webp";
        
        modalBody.innerHTML = `
            <div class="profile-container">
                <img src="${profileImageUrl}" alt="Tenant Profile" class="img-fluid"/>
                <div class="profile-details">
                    <p class="name">${tenant.tenantFirstName} ${tenant.tenantLastName}</p>
                    <div class="contact-info">
                        <p class="mobileNum"><span class="material-icons call-icon">call</span> ${tenant.mobileNum || "N/A"}</p>
                        <p class="email"><span class="material-icons email-icon">mail</span> ${tenant.tenantEmail || "N/A"}</p>
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
            <div class="bills-container">
                <div class="bills-header">
                    <p>Monthly Bills</p>
                    <a href="#" class="btn btn-edit btn-sm"><i class="material-icons edit-icon">edit</i>Edit</a>
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
                        <tr>
                            <th scope="row">Unit Rental</th>
                            <td>PHP 2,000</td>
                            <td>October 15, 2024</td>
                            <td>October 23, 2024</td>
                            <td class="paid">Paid</td>
                        </tr>
                        <tr>
                            <th scope="row">Electricity Consumption</th>
                            <td>PHP 2,000</td>
                            <td>October 15, 2024</td>
                            <td>October 23, 2024</td>
                            <td class="unpaid">Unpaid</td>
                        </tr>
                        <tr>
                            <th scope="row">Water Usage</th>
                            <td>PHP 2,000</td>
                            <td>October 15, 2024</td>
                            <td>October 23, 2024</td>
                            <td class="paid">Paid</td>
                        </tr>
                        <tr>
                            <th scope="row">Water Usage</th>
                            <td>PHP 2,000</td>
                            <td>October 15, 2024</td>
                            <td>October 23, 2024</td>
                            <td class="paid">Paid</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    } else {
        modalBody.innerHTML = "<p>Tenant details are unavailable.</p>";
    }
    
    
    const modal = new bootstrap.Modal(document.getElementById("tenantModal"));
    modal.show();
}

document.addEventListener('DOMContentLoaded', function () {
    var rentTitle = document.querySelector('.rent-title');
    rentTitle.style.fontWeight = '700'; 
    rentTitle.style.color = '#333'; 
    rentTitle.style.marginBottom = '10px';

    var canvas = document.getElementById('rentPieChart');
    
    canvas.width = 90; 
    canvas.height = 90; 

    var ctx = canvas.getContext('2d');
    
    var gray = getComputedStyle(document.documentElement).getPropertyValue('--gray');
    var maroon = getComputedStyle(document.documentElement).getPropertyValue('--maroon');
    var orange = getComputedStyle(document.documentElement).getPropertyValue('--orange');

    var paidGradient = ctx.createLinearGradient(0, 0, 0, 400);
    paidGradient.addColorStop(0, gray);
    paidGradient.addColorStop(0.5, maroon);
    paidGradient.addColorStop(1, orange);

    var pendingColor = '#ECECEC';

    var rentPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Paid', 'Pending'],
            datasets: [{
                data: [80, 20], 
                backgroundColor: [paidGradient, pendingColor],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            aspectRatio: 1,
            layout: {
                padding: {
                    top: 0,
                    left: 0,
                    right: 20,
                    bottom: 20
                }
            },
            plugins: {
                legend: {
                    position: 'right', 
                    align: 'start',
                    labels: {
                        boxWidth: 20,
                        padding: 10,
                        color: '#333',  
                        font: {
                            weight: 'bold', 
                        } 
                    }
                }
            }
        }
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const progressBars = document.querySelectorAll('.progress-bar');
  
    progressBars.forEach(function(progressBar) {
      const progressValue = progressBar.getAttribute('data-progress');
      progressBar.style.width = `${progressValue}%`;
    });
  });
  