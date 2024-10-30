// for styles to be applied not just with hover - tabs header
const tabs = document.querySelectorAll('.tabs ul li a');

const currentPath = window.location.pathname.split("/").pop();

tabs.forEach(tab => {
    const tabPath = tab.getAttribute('href').split("/").pop();
    if (tabPath === currentPath) {
        tab.classList.add('active-tab');
    }
});


// for tenants info pop-up
function toggle1() {
    var blur = document.getElementById('blur');
    blur.classList.toggle('active'); 
    var popup = document.getElementById('popup');
    popup.classList.toggle('active'); 
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#show-seemore').addEventListener('click', function() {
        console.log("See More clicked"); // Debugging
        document.querySelector('.seemore-popup').classList.add('active1');
    });

    document.querySelector('.seemore-popup .close-btn').addEventListener('click', function() {
        document.querySelector('.seemore-popup').classList.remove('active1');
    });
});

// sample

const tenantData = {
    tenantA: {
        name: "Tenant A",
        phone: "+639123456789",
        email: "tenantA@example.com",
        id: "2024 - 12345",
        joined: "October 12, 2024",
        school: "Polytechnic University of the Philippines",
        address: "64 Royal Ln. Sta. Mesa",
        guardian: "Angelica Payne",
        guardianPhone: "+63123456789"
    },
    tenantB: {
        name: "Tenant B",
        phone: "+639987654321",
        email: "tenantB@example.com",
        id: "2024 - 54321",
        joined: "September 10, 2024",
        school: "University of Santo Tomas",
        address: "23 King St. Manila",
        guardian: "Juan Dela Cruz",
        guardianPhone: "+63234567890"
    },
};

function showTenantPopup(tenantKey) {
    // Get tenant data
    const tenant = tenantData[tenantKey];

    // Update popup content with tenant details
    document.getElementById('tenant-name').textContent = tenant.name;
    document.getElementById('tenant-phone').textContent = tenant.phone;
    document.getElementById('tenant-email').textContent = tenant.email;
    document.getElementById('tenant-id').textContent = tenant.id;
    document.getElementById('tenant-joined').textContent = tenant.joined;
    document.getElementById('tenant-school').textContent = tenant.school;
    document.getElementById('tenant-address').textContent = tenant.address;
    document.getElementById('tenant-guardian').textContent = tenant.guardian;
    document.getElementById('tenant-guardian-phone').textContent = tenant.guardianPhone;

    // Show the tenant-popup
    document.getElementById('popup').style.display = 'block';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

element.closest('.tenant-container').style.display = 'none';
