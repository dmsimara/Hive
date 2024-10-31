document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); 

        const tenantEmail = document.getElementById("tenantEmail").value;
        const tenantPassword = document.getElementById("tenantPassword").value;

        try {
            const response = await fetch("/api/auth/tenantLogin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ tenantEmail, tenantPassword }),
                credentials: "include" // Ensure cookies are included in the request
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); 
                window.location.href = "/tenant/dashboard"; 
            } else {
                alert(data.message || "Login failed. Please try again.");
            }
        } catch (error) {
            alert("An error occurred. Please try again later.");
            console.error("Error:", error);
        }
    });
});
