// Wait for the page to fully load
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form"); // Get the form

    // When the form is submitted
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Stop the form from submitting normally

        // Get the email and password from the form
        const tenantEmail = document.getElementById("tenantEmail").value;
        const tenantPassword = document.getElementById("tenantPassword").value;

        try {
            // Send the login details to the server
            const response = await fetch("/api/auth/tenantLogin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Tell the server we're sending JSON
                },
                body: JSON.stringify({ tenantEmail, tenantPassword }), // Send the email and password
                credentials: "include" // Include cookies with the request
            });

            const data = await response.json(); // Get the server's response

            if (response.ok) {
                alert(data.message); // Show success message
                window.location.href = "/tenant/dashboard"; // Go to the dashboard
            } else {
                alert(data.message || "Login failed. Please try again."); // Show error message
            }
        } catch (error) {
            // If there's an error
            alert("An error occurred. Please try again later.");
            console.error("Error:", error); // Log the error to the console
        }
    });
});
