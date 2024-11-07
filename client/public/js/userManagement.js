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

function deleteTenant(tenantId) {
    const confirmation = confirm("Are you sure you want to delete this tenant?");
    if (confirmation) {
        fetch(`/api/auth/deleteTenant/${tenantId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())  
        .then(data => {
            if (data.success) {
                alert('Tenant successfully deleted');
                location.reload(); 
            } else {
                alert('Error deleting tenant: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the tenant.');
        });
    } else {
        alert('Deletion canceled.');
    }
}

document.getElementById("tenantForm").addEventListener("submit", async function(event) {
    event.preventDefault();  

    const tenantFirstName = document.getElementById("tenantFirstName").value.trim();
    const tenantLastName = document.getElementById("tenantLastName").value.trim();
    const tenantEmail = document.getElementById("tenantEmail").value.trim();
    const mobileNum = document.getElementById("mobileNum").value.trim();
    const tenantPassword = document.getElementById("tenantPassword").value.trim();
    const tenantConfirmPassword = document.getElementById("tenantConfirmPassword").value.trim(); 
    const gender = document.getElementById("gender").value.trim();
    const stayFrom = document.getElementById("stayFrom").value.trim();
    const stayTo = document.getElementById("stayTo").value.trim();

    const dateJoined = new Date().toISOString();  

    if (!tenantFirstName || !tenantLastName || !tenantEmail || !mobileNum || !tenantPassword || !tenantConfirmPassword || !gender || !stayTo || !stayFrom) {
        alert("Please fill in all required fields.");
        return;
    }

    if (tenantPassword !== tenantConfirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    if (isNaN(Date.parse(stayFrom)) || isNaN(Date.parse(stayTo))) {
        alert("Please enter valid dates for Stay From and Stay To.");
        return;
    }

    if (new Date(stayTo) < new Date(stayFrom)) {
        alert("End date cannot be before start date.");
        return;
    }

    const tenantData = {
        tenantFirstName,
        tenantLastName,
        tenantEmail,
        mobileNum,
        tenantPassword,
        tenantConfirmPassword,  
        gender,
        stayFrom,
        stayTo,
        dateJoined
    };

    try {
        const response = await fetch('/api/auth/addTenant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tenantData)
        });

        const data = await response.json();
        if (data.success) {
            alert("Tenant added successfully!");
            document.getElementById("tenantForm").reset();
            const addTenantModal = new bootstrap.Modal(document.getElementById("addTenantModal"));
            addTenantModal.hide();
            
            window.location.href = '/admin/dashboard/userManagement';
        } else {
            alert("Error adding tenant: " + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error adding the tenant.');
    }
});
