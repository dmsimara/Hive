document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const submitButton = form.querySelector("button[type='submit']");
    const errorMessageDiv = document.createElement("div");
    errorMessageDiv.className = "text-danger"; // Class for styling error messages
    form.appendChild(errorMessageDiv);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Collect values from the form
        const adminFirstName = document.getElementById("adminFirstName").value;
        const adminLastName = document.getElementById("adminLastName").value;
        const adminEmail = document.getElementById("adminEmail").value;
        const adminPassword = document.getElementById("adminPassword").value;
        const adminConfirmPassword = document.getElementById("adminConfirmPassword").value;
        const eName = document.getElementById("eName").value;

        // Clear previous error messages
        errorMessageDiv.textContent = "";

        // Validate password
        if (adminPassword !== adminConfirmPassword) {
            errorMessageDiv.textContent = "Passwords do not match. Please try again.";
            return;
        }

        // Disable the submit button to prevent duplicate submissions
        submitButton.disabled = true;

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
                    eName
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.href = "/admin/login"; 
            } else {
                errorMessageDiv.textContent = data.message || "Registration failed. Please try again.";
            }
        } catch (error) {
            errorMessageDiv.textContent = "An error occurred. Please try again later.";
            console.error("Error:", error);
        } finally {
            submitButton.disabled = false;
        }
    });
});
