let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = confirm("Are you sure you want to log out?");
        
        if (!isConfirmed) return;

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

document.addEventListener('DOMContentLoaded', function() {
    // Ensure elements are in the DOM before adding event listeners
    const closeModalButton = document.getElementById('closeModal');
    const openModalButton = document.getElementById('openModal');

    if (closeModalButton) {
        closeModalButton.onclick = function() {
            document.getElementById('myModal').style.display = 'none'; 
            document.body.style.overflow = 'auto';
        };
    }

    if (openModalButton) {
        openModalButton.onclick = function() {
            document.getElementById('myModal').style.display = 'block'; 
            document.body.style.overflow = 'hidden';
        };
    }
});

  
document.addEventListener("DOMContentLoaded", function () {
    const pinnedButton = document.getElementById("pinned-notices-btn");
    const permanentButton = document.getElementById("permanent-notices-btn");
    const allButton = document.getElementById("all-notices-btn");
  
    pinnedButton.addEventListener("click", function (event) {
      event.preventDefault(); 
      fetchFilteredNotices('/admin/announcements?filter=pinned'); 
      setActiveButton(pinnedButton);
    });
  
    permanentButton.addEventListener("click", function (event) {
      event.preventDefault();
      fetchFilteredNotices('/admin/announcements?filter=permanent');
    });
  
    allButton.addEventListener("click", function (event) {
      event.preventDefault(); 
      fetchFilteredNotices('/admin/announcements'); 
      setActiveButton(allButton);
    });
  
    function setActiveButton(activeButton) {
      const buttons = document.querySelectorAll('.filter-link');
      buttons.forEach(button => {
        button.classList.remove('active'); 
      });
      activeButton.classList.add('active'); 
    }
  
    async function fetchFilteredNotices(url) {
      try {
        const response = await fetch(url, {
          headers: {
            "Accept": "application/json", 
          },
        });
  
        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
  
          if (data.success) {
            renderNotices(data.notices);
          } else {
            renderNoNotices("No notices available at the moment.");
          }
        } else {
          renderNoNotices("Error fetching notices.");
          console.error('Response is not JSON:', await response.text()); 
        }
      } catch (error) {
        renderNoNotices("Error fetching notices.");
        console.error('Error fetching notices:', error);
      }
    }
  
    function renderNotices(notices) {
      const noticesContainer = document.getElementById("notices-container");
      noticesContainer.innerHTML = ""; 
  
      notices.forEach(notice => {
        const noticeElement = document.createElement("div");
        noticeElement.classList.add("notice");
  
        noticeElement.innerHTML = `
          <h3>${notice.title}</h3>
          <p>${notice.content}</p>
          <small>Updated at: ${notice.updated_at}</small>
        `;
  
        noticesContainer.appendChild(noticeElement);
      });
    }
  
    function renderNoNotices(message) {
      const noticesContainer = document.getElementById("notices-container");
      noticesContainer.innerHTML = `<p>${message}</p>`;
    }
});

// Store state of pinned and permanent for the new notice
let newNoticePinned = false;
let newNoticePermanent = false;

// Toggle Pinned State
function togglePinned(noticeId) {
    newNoticePinned = !newNoticePinned; // Toggle pinned state
    document.querySelector(`[data-id="${noticeId}"].pinned`).classList.toggle("active", newNoticePinned);
}

// Toggle Permanent State
function togglePermanent(noticeId) {
    newNoticePermanent = !newNoticePermanent; // Toggle permanent state
    document.querySelector(`[data-id="${noticeId}"].permanent`).classList.toggle("active", newNoticePermanent);
}

// Handle Add Notice Form Submission
document.getElementById("addNoticeForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;

    // Send POST request to backend to add the notice
    const noticeData = {
        title,
        content,
        pinned: newNoticePinned,
        permanent: newNoticePermanent,
    };

    try {
        const response = await fetch('/admin/announcements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noticeData),
        });

        const data = await response.json();
        
        if (data.success) {
            // Optionally refresh the notices list or update the UI
            alert("Notice added successfully!");
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error adding notice:', error);
        alert('Failed to add notice. Please try again.');
    }
});
