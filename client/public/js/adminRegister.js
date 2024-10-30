document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const adminFirstName = document.getElementById("adminFirstName").value;
        const adminLastName = document.getElementById("adminLastName").value;
        const adminEmail = document.getElementById("adminEmail").value;
        const adminPassword = document.getElementById("adminPassword").value;
        const adminConfirmPassword = document.getElementById("adminConfirmPassword").value;
        const eName = document.getElementById("eName").value;

        if (adminPassword !== adminConfirmPassword) {
            alert("Passwords do not match. Please try again.");
            return; 
        }

        try {
            const response = await fetch("/api/auth/adminRegister", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    adminFirstName,
                    adminLastName,
                    adminEmail,
                    adminPassword,
                    adminConfirmPassword,
                    eName
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.href = "/admin/register/verifyEmail"; 
            } else {
                alert(data.message || "Registration failed. Please try again.");
            }
        } catch (error) {
            alert("An error occurred. Please try again later.");
            console.error("Error:", error);
        }
    });
});
