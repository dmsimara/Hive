document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addForm');
    const alertMessage = document.getElementById('alertMessage');

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const establishmentId = document.getElementById('establishment_id').value; // Assuming there's a hidden input for establishment_id
        data.establishment_id = establishmentId;

        try {
            const response = await fetch('/api/auth/addTenant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const result = await response.json();
                alertMessage.textContent = result.message || 'An error occurred. Please try again.';
                alertMessage.classList.remove('alert-success');
                alertMessage.classList.add('alert-danger');
                alertMessage.style.display = 'block';
                return; // Stop further execution
            }

            const result = await response.json();
            
            // Clear previous alert message
            alertMessage.style.display = 'none';
            alertMessage.classList.remove('alert-success', 'alert-danger');

            if (result.success) {
                alertMessage.textContent = 'Tenant added successfully!';
                alertMessage.classList.add('alert-success');
                alertMessage.style.display = 'block';
                setTimeout(() => window.location.href = '/admin/dashboard/userManagement', 2000); // Redirect after 2 seconds
            } else {
                alertMessage.textContent = result.message;
                alertMessage.classList.add('alert-danger');
                alertMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            alertMessage.textContent = 'An error occurred. Please try again.';
            alertMessage.classList.add('alert-danger');
            alertMessage.style.display = 'block';
        }
    });
});
