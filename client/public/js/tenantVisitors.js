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
    const visitorForm = document.getElementById("visitorForm");
    const regularButton = document.getElementById("regularButton");
    const overnightButton = document.getElementById("overnightButton");
    const saveButton = visitorForm.querySelector('button[type="submit"]');

    let selectedRequestType = null;

    const resetActiveStates = () => {
        regularButton.classList.remove("active");
        overnightButton.classList.remove("active");
    };

    regularButton.addEventListener("click", () => {
        selectedRequestType = "regular";
        resetActiveStates();
        regularButton.classList.add("active");
    });

    overnightButton.addEventListener("click", () => {
        selectedRequestType = "overnight";
        resetActiveStates();
        overnightButton.classList.add("active");
    });

    const convertToUTC = (localDateTime) => {
        const date = new Date(localDateTime);

        if (isNaN(date.getTime())) {
            alert("Invalid date format");
            return null;
        }

        const utcDate = new Date(date.getTime() - (8 * 60 * 60 * 1000)); 
        return utcDate.toISOString(); 
    };

    saveButton.addEventListener("click", (event) => {
        event.preventDefault();

        if (!selectedRequestType) {
            alert("Please select Regular or Overnight.");
            return;
        }

        const formData = new FormData(visitorForm);

        const visitDateFrom = convertToUTC(formData.get("visitDateFrom"));
        const visitDateTo = convertToUTC(formData.get("visitDateTo"));

        const data = {
            visitorName: `${formData.get("visitorFirstName")} ${formData.get("visitorLastName")}`,
            contactInfo: formData.get("contactInfo"),
            purpose: formData.get("purpose"),
            visitDateFrom: visitDateFrom, 
            visitDateTo: visitDateTo, 
            visitorAffiliation: formData.get("visitorAffiliation"),
        };

        const apiEndpoint =
            selectedRequestType === "regular"
                ? "/api/auth/add/regular/request"
                : "/api/auth/add/overnight/request";

        fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((err) => {
                        throw new Error(err.message || "Something went wrong.");
                    });
                }
                return response.json();
            })
            .then((result) => {
                alert(
                    selectedRequestType === "regular"
                        ? "Regular Visitor Request has been submitted!"
                        : "Overnight Visitor Request has been submitted!"
                );
                window.location.reload();
            })
            .catch((error) => {
                console.error("Error submitting request:", error);
                alert("Failed to submit the request. Please try again.");
            });
    });
});
