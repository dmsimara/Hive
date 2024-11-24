document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) {
            return;
        }
        
        try {
            const response = await fetch("/api/auth/tenantLogout", {
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
    const profileImage = document.getElementById('profileImage');
    const fileInput = document.getElementById('fileInput');
    const updateForm = document.getElementById("updateTenantForm");

    profileImage.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profileImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    if (updateForm) {
        updateForm.addEventListener("submit", async (event) => {
            event.preventDefault(); 

            const formData = new FormData(updateForm);
            
            if (fileInput.files.length === 0) {
                formData.delete("profilePicture"); 
            }

            try {
                const response = await fetch(updateForm.action, {
                    method: updateForm.method,
                    body: formData,
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Profile updated successfully!");
                    window.location.href = "/tenant/room-details/view/account";
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


document.addEventListener("DOMContentLoaded", () => {
    const cancelButton = document.querySelector(".cancel");

    cancelButton.addEventListener("click", (event) => {
        event.preventDefault(); 

        const isConfirmed = confirm("Are you sure you want to cancel? Any unsaved changes will be lost.");
        
        if (isConfirmed) {
            setTimeout(() => {
                window.location.href = "/tenant/dashboard"; 
            }, 1000); 
        }
    });
});
