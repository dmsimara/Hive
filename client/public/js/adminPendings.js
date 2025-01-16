let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) {
            return;
        }
        
        try {
            const response = await fetch("/api/auth/adminLogout", {
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
    const rowContainer = document.querySelector('.row-container');
    const totalCards = rowContainer.querySelectorAll('.card').length;
    
    if (totalCards < 3) {
        const numEmptyCards = 3 - totalCards;  
        
        for (let i = 0; i < numEmptyCards; i++) {
            const emptyCard = document.createElement('div');
            emptyCard.classList.add('empty-card');
            rowContainer.appendChild(emptyCard);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const deetsButton = document.querySelectorAll('.deets-btn');
    const decisionForm = document.getElementById('decisionForm');
    const requestIdInput = document.getElementById('request_id');
    const adminComments = document.getElementById('adminComments');
    const approveButton = document.getElementById('approveButton');
    const rejectButton = document.getElementById('rejectButton');
    const submitButton = decisionForm.querySelector('.decision-btn');
    let apiUrl = '';
  
    deetsButton.forEach(button => {
      button.addEventListener('click', () => {
        const requestId = button.getAttribute('data-requests-id');
        requestIdInput.value = requestId; 
      });
    });
  
    approveButton.addEventListener('click', () => {
      const requestId = requestIdInput.value.trim();
      if (requestId) {
        apiUrl = `/api/auth/requests/${requestId}/approved`;
        decisionForm.querySelector('input[placeholder="APPROVED/REJECTED"]').value = 'APPROVED';
      } else {
        alert('Error: Request ID is missing.');
      }
    });
  
    rejectButton.addEventListener('click', () => {
      const requestId = requestIdInput.value.trim();
      if (requestId) {
        apiUrl = `/api/auth/requests/${requestId}/rejected`;
        decisionForm.querySelector('input[placeholder="APPROVED/REJECTED"]').value = 'REJECTED';
      } else {
        alert('Error: Request ID is missing.');
      }
    });
  
    submitButton.addEventListener('click', async () => {
      if (!apiUrl) {
        alert('Error: No valid API URL. Please try again.');
        return;
      }
  
      const comments = adminComments.value.trim();
  
      if (!comments) {
        alert('Please provide comments before submitting.');
        return;
      }
  
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminComments: comments }),
        });
  
        if (response.ok) {
          const result = await response.json();
          alert(result.message || 'Request processed successfully!');
          location.reload();
        } else {
          const error = await response.json();
          alert(error.message || 'Something went wrong. Please try again.');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while processing the request. Please try again.');
      }
    });
  });
  