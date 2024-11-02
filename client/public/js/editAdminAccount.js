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

document.addEventListener("DOMContentLoaded", () => {
    const updateForm = document.getElementById("updateAdminForm");
    
    if (updateForm) {
        updateForm.addEventListener("submit", async (event) => {
            event.preventDefault(); 
            
            const formData = new FormData(updateForm); 
            
            try {
                const response = await fetch(updateForm.action, {
                    method: updateForm.method,
                    body: formData,
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert("Profile updated successfully!");
                    location.reload(); 
                } else {
                    alert(data.message || "Failed to update profile.");
                }
            } catch (error) {
                alert("An error occurred while updating the profile. Please try again later.");
                console.error("Error:", error);
            }
        });
    }
});
