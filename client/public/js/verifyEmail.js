// Select inputs and button
const inputs = document.querySelectorAll("input");
const button = document.querySelector("button");

// Focus first input on load
window.addEventListener("load", () => inputs[0].focus());

// Add events to inputs
inputs.forEach((input, index1) => {
    input.addEventListener("keyup", (e) => {
        const nextInput = input.nextElementSibling;
        const prevInput = input.previousElementSibling;

        // Allow one digit only
        if (input.value.length > 1) {
            input.value = "";
            return;
        }

        // Move to next input if filled
        if (nextInput && nextInput.disabled && input.value) {
            nextInput.disabled = false;
            nextInput.focus();
        }

        // Handle backspace
        if (e.key === "Backspace" && prevInput) {
            inputs.forEach((inp, index2) => {
                if (index1 <= index2) {
                    inp.disabled = true;
                    inp.value = "";
                }
            });
            prevInput.focus();
        }

        // Enable/disable button
        if (Array.from(inputs).every(inp => inp.value)) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
});

// Submit OTP on button click
button.addEventListener("click", async (event) => {
    event.preventDefault();

    // Combine input values
    const otpCode = Array.from(inputs).map(input => input.value).join("");

    // Check OTP length
    if (otpCode.length !== 6) {
        alert("Please enter the 6-digit OTP.");
        return;
    }

    try {
        // Send OTP to server
        const response = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: otpCode }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message); // Success
            window.location.href = "/admin/login";
        } else {
            alert(data.message || "Verification failed.");
        }
    } catch (error) {
        alert("An error occurred.");
        console.error("Error:", error);
    }
});
