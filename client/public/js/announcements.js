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
    const submitNoticeButton = document.getElementById("submitNotice");
    const addNoticeForm = document.getElementById("addNoticeForm");

    // Filter buttons
    pinnedButton.addEventListener("click", function (event) {
        event.preventDefault();
        fetchFilteredNotices('/admin/announcements?filter=pinned');
        setActiveButton(pinnedButton);
    });

    permanentButton.addEventListener("click", function (event) {
        event.preventDefault();
        fetchFilteredNotices('/admin/announcements?filter=permanent');
        setActiveButton(permanentButton);
    });

    allButton.addEventListener("click", function (event) {
        event.preventDefault();
        fetchFilteredNotices('/admin/announcements');
        setActiveButton(allButton);
    });

    submitNoticeButton.addEventListener("click", async function (event) {
        event.preventDefault();
    
        const title = document.getElementById("title").value;
        const content = document.getElementById("content").value;
    
        // Check if title and content are provided
        if (!title || !content) {
            alert("Title and content are required!");
            return;
        }
    
        const noticeData = {
            title: title,
            content: content,
            pinned: false, // Default to false (can be toggled later)
            permanent: false // Default to false (can be toggled later)
        };
    
        try {
            const response = await fetch('/api/auth/view/notices/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(noticeData),
            });
    
            // Check if response is OK
            if (!response.ok) {
                const errorText = await response.text();
                alert("Error: " + errorText);
                return;
            }
    
            const data = await response.json();
    
            if (data.success) { // Check if the response was successful
                alert("Notice added successfully!");
    
                // Reset the form
                addNoticeForm.reset();
    
                // Close the modal (assuming the modal has an ID of 'addNoticeModal')
                const modal = document.getElementById("addNoticeModal");
                const bootstrapModal = bootstrap.Modal.getInstance(modal); // Use Bootstrap's Modal API
                bootstrapModal.hide(); // Close the modal
    
                // Reload the notices
                fetchFilteredNotices('/admin/announcements');
            } else {
                alert("Failed to add notice: " + data.message);
            }
        } catch (error) {
            console.error('Error submitting notice:', error);
            alert("Error submitting notice.");
        }
    });    

    // Toggle pinned status
    window.togglePinned = async function(noticeId) {
        try {
            const response = await fetch(`/api/auth/view/notices/${noticeId}/toggle_pinned`, { method: 'PATCH' });
            const data = await response.json();
            if (data.success) {
                const pinnedIcon = document.querySelector(`.pinned[data-id="${noticeId}"]`);
                pinnedIcon.textContent = data.isPinned ? "push_pin" : "push_pin_outlined"; // Change icon
                alert(data.isPinned ? "Notice pinned!" : "Notice unpinned!");
            } else {
                alert("Failed to update pinned status.");
            }
        } catch (error) {
            console.error('Error toggling pinned status:', error);
            alert("Error toggling pinned status: " + error.message);
        }
    };

    // Toggle permanent status
    window.togglePermanent = async function(noticeId) {
        try {
            const response = await fetch(`/api/auth/view/notices/${noticeId}/toggle_permanent`, { method: 'PATCH' });
            const data = await response.json();
            if (data.success) {
                const permanentIcon = document.querySelector(`.permanent[data-id="${noticeId}"]`);
                permanentIcon.textContent = data.isPermanent ? "note" : "note_outlined"; // Change icon
                alert(data.isPermanent ? "Notice marked permanent!" : "Notice unmarked as permanent!");
            } else {
                alert("Failed to update permanent status.");
            }
        } catch (error) {
            console.error('Error toggling permanent status:', error);
            alert("Error toggling permanent status: " + error.message);
        }
    };

    // Set active button for filter
    function setActiveButton(activeButton) {
        const buttons = document.querySelectorAll('.filter-link');
        buttons.forEach(button => button.classList.remove('active'));
        activeButton.classList.add('active');
    }

    // Fetch notices based on filter
    async function fetchFilteredNotices(url) {
        try {
            const response = await fetch(url, { headers: { "Accept": "application/json" } });

            if (!response.ok) {
                throw new Error('Failed to fetch notices');
            }

            const content = await response.json();

            const noticesContainer = document.getElementById("notices-container");
            noticesContainer.innerHTML = ""; // Clear existing notices

            if (content.notices.length === 0) {
                noticesContainer.innerHTML = "<p>No notices available at the moment.</p>";
                return;
            }

            content.notices.forEach(notice => {
                const noticeDiv = document.createElement("div");
                noticeDiv.classList.add("notice-item");
                if (notice.pinned) noticeDiv.classList.add("pinned");
                if (notice.permanent) noticeDiv.classList.add("permanent");
                noticeDiv.innerHTML = `
                    <h2 class="notice-title">${notice.title}</h2>
                    <p class="notice-content">${notice.content}</p>
                    <span class="notice-meta">
                        ${notice.pinned ? '<span class="badge pinned-badge">Pinned</span>' : ''}
                        ${notice.permanent ? '<span class="badge permanent-badge">Permanent</span>' : ''}
                        <span class="notice-date">${notice.updated_at}</span>
                    </span>
                    <i class="material-icons pinned" data-id="${notice.notice_id}" onclick="togglePinned(${notice.notice_id})">push_pin</i>
                    <i class="material-icons permanent" data-id="${notice.notice_id}" onclick="togglePermanent(${notice.notice_id})">note</i>
                `;
                noticesContainer.appendChild(noticeDiv);
            });
        } catch (error) {
            console.error("Error fetching notices:", error);
            alert("Error fetching notices: " + error.message);
        }
    }

    // Initial load
    fetchFilteredNotices('/admin/announcements');
});
