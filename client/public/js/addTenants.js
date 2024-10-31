document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevents default form submission

        const tenantFirstName = document.getElementById("tenantFirstName").value;
        const tenantLastName = document.getElementById("tenantLastName").value;
        const tenantEmail = document.getElementById("tenantEmail").value;
        const gender = document.getElementById("gender").value;
        const mobileNum = document.getElementById("mobileNum").value;
        const tenantPassword = document.getElementById("tenantPassword").value;
        const tenantConfirmPassword = document.getElementById("tenantConfirmPassword").value;

        // Check if passwords match
        if (tenantPassword !== tenantConfirmPassword) {
            alert("Passwords do not match. Please try again.");
            return; 
        }

        try {
            const response = await fetch("/api/auth/addTenant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tenantFirstName,
                    tenantLastName,
                    tenantEmail,
                    gender,
                    mobileNum,
                    tenantPassword
                }),
            });

            // Handle response status to determine the next action
            if (response.redirected) {
                // If the response redirected, use window.location
                window.location.href = response.url; // Redirect to the new URL
            } else {
                const data = await response.json();
                alert(data.message || "Registration failed. Please try again.");
            }
        } catch (error) {
            alert("An error occurred. Please try again later.");
            console.error("Error:", error);
        }
    });
});
