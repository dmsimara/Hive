document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); 

        const adminEmail = document.getElementById("adminEmail").value;
        const adminPassword = document.getElementById("adminPassword").value;

        try {
            const response = await fetch("/api/auth/adminLogin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ adminEmail, adminPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); 
                window.location.href = "/admin/dashboard"; 
            } else {
                alert(data.message || "Login failed. Please try again.");
                console.error("Login error data:", data); // Log additional data for debugging
            }
        } catch (error) {
            alert("An error occurred. Please try again later.");
            console.error("Error:", error);
        }
    });
});
