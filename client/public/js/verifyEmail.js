const inputs = document.querySelectorAll("input");
const button = document.querySelector("button");

// Focus on the first input on page load
window.addEventListener("load", () => inputs[0].focus());

// Iterate over all inputs
inputs.forEach((input, index1) => {
    input.addEventListener("keyup", (e) => {
        const currentInput = input;
        const nextInput = input.nextElementSibling;
        const prevInput = input.previousElementSibling;

        // Prevent more than one digit in each box
        if (currentInput.value.length > 1) {
            currentInput.value = "";
            return;
        }

        // Enable the next input if this one has a value
        if (nextInput && nextInput.hasAttribute("disabled") && currentInput.value !== "") {
            nextInput.removeAttribute("disabled");
            nextInput.focus();
        }

        // Handle backspace: move back and clear previous input
        if (e.key === "Backspace") {
            if (prevInput) {
                inputs.forEach((input, index2) => {
                    if (index1 <= index2) {
                        input.setAttribute("disabled", true);
                        input.value = "";
                    }
                });
                prevInput.focus();
            }
        }

        // Enable the button if all inputs are filled
        if (Array.from(inputs).every(input => input.value !== "")) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
});

// Submit OTP code on button click
button.addEventListener("click", async (event) => {
    event.preventDefault();

    const otpCode = Array.from(inputs).map(input => input.value).join("");

    if (otpCode.length !== 6) {
        alert("Please enter the 6-digit OTP.");
        return;
    }

    try {
        const response = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: otpCode }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            window.location.href = "/admin/login"; // Redirect to the login page
        } else {
            alert(data.message || "Verification failed. Please try again.");
        }
    } catch (error) {
        alert("An error occurred. Please try again later.");
        console.error("Error:", error);
    }
});
