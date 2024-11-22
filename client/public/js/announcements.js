let subMenu = document.getElementById("subMenu");

function toggleMenu() {
    subMenu.classList.toggle("open-menu");
}

document.addEventListener("DOMContentLoaded", () => {
    // Select the "Logout" button and "View Account" link
    const logoutButton = document.getElementById("logoutButton");
    const viewAccountButton = document.querySelector(".sub-menu-link[href='/admin/dashboard/view/account']");

    // Check if the elements are found
    console.log("logoutButton:", logoutButton);
    console.log("viewAccountButton:", viewAccountButton);

    if (logoutButton) {
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
    } else {
        console.log("logoutButton not found");
    }

    if (viewAccountButton) {
        viewAccountButton.addEventListener("click", () => {
            console.log("View Account button clicked");
        });
    } else {
        console.log("viewAccountButton not found");
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const pinnedButton = document.getElementById("pinned-notices-btn");
    const permanentButton = document.getElementById("permanent-notices-btn");
    const allButton = document.getElementById("all-notices-btn");
    const submitNoticeButton = document.getElementById("submitNotice");
    const addNoticeForm = document.getElementById("addNoticeForm");
    const closeModalButton = document.getElementById('closeModal');
    const openModalButton = document.getElementById('openModal');
    const noticesContainer = document.getElementById("notices-container");

    const addNoticeModal = new bootstrap.Modal(document.getElementById('addNotice'));

    if (closeModalButton) {
        closeModalButton.onclick = function() {
            addNoticeModal.hide(); 
            document.body.style.overflow = 'auto';
        };
    }

    if (openModalButton) {
        openModalButton.onclick = function() {
            addNoticeModal.show(); 
            document.body.style.overflow = 'hidden';
        };
    }

    const buttons = [allButton, pinnedButton, permanentButton];
    let currentFilter = "/admin/announcements";

    function setActiveButton(activeButton) {
        buttons.forEach((button) => button.classList.remove("active"));
        activeButton.classList.add("active");
    }

    async function fetchFilteredNotices(url) {
        try {
            const response = await fetch(url, { headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error("Failed to fetch notices");

            const { notices } = await response.json();
            noticesContainer.innerHTML = notices.length
                ? notices
                      .map(
                          (n) => `
                    <div data-id="${n.notice_id}" class="notice-item">
                        <h3>${n.title}</h3>
                        <p>${n.content}</p>
                        <i class="material-icons pinned" data-id="${n.notice_id}" onclick="togglePinned(${n.notice_id}, ${n.pinned})">
                            ${n.pinned ? 'book' : 'bookmark'}
                        </i>
                        <i class="material-icons permanent" data-id="${n.notice_id}" onclick="togglePermanent(${n.notice_id}, ${n.permanent})">
                            ${n.permanent ? 'note_add' : 'description'}
                        </i>
                        <i class="material-icons delete" data-id="${n.notice_id}" onclick="deleteNotice(${n.notice_id})">delete</i>
                    </div>
                `).join("")
                : "<p>No notices found</p>";
        } catch (error) {
            console.error("Error fetching notices:", error);
            alert("Failed to fetch notices.");
        }
    }

    pinnedButton.addEventListener("click", () => {
        setActiveButton(pinnedButton);
        currentFilter = "/admin/announcements?filter=pinned";
        fetchFilteredNotices(currentFilter);
    });

    permanentButton.addEventListener("click", () => {
        setActiveButton(permanentButton);
        currentFilter = "/admin/announcements?filter=permanent";
        fetchFilteredNotices(currentFilter);
    });

    allButton.addEventListener("click", () => {
        setActiveButton(allButton);
        currentFilter = "/admin/announcements";
        fetchFilteredNotices(currentFilter);
    });

    submitNoticeButton.addEventListener("click", async () => {
        const title = document.getElementById("title").value;
        const content = document.getElementById("content").value;

        if (!title || !content) return alert("Title and content are required!");

        try {
            const response = await fetch("/api/auth/view/notices/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, pinned: false, permanent: false }),
            });

            if (!response.ok) throw new Error("Failed to add announcement");

            alert("Announcement added successfully!");
            addNoticeForm.reset();
            setActiveButton(allButton);
            fetchFilteredNotices("/admin/announcements");

            addNoticeModal.hide();

            console.log("Modal should be closed now!");
        } catch (error) {
            console.error("Error submitting notice:", error);
            alert("Error submitting notice.");
        }
    });

    window.togglePinned = async (noticeId, isPinned) => {
        const action = isPinned ? "unpin" : "pin";
        if (!confirm(`Are you sure you want to ${action} this announcement?`)) return;
    
        try {
            const response = await fetch(`/api/auth/view/notices/${noticeId}/toggle_pinned`, { method: "PATCH" });
            if (!response.ok) throw new Error("Failed to toggle pinned status");
    
            location.reload(); 
        } catch (error) {
            console.error("Error toggling pinned status:", error);
        }
    };
    
    window.togglePermanent = async (noticeId, isPermanent) => {
        const action = isPermanent ? "unmark permanent" : "mark permanent";
        if (!confirm(`Are you sure you want to ${action} this announcement?`)) return;
    
        try {
            const response = await fetch(`/api/auth/view/notices/${noticeId}/toggle_permanent`, { method: "PATCH" });
            if (!response.ok) throw new Error("Failed to toggle permanent status");
    
            location.reload(); 
        } catch (error) {
            console.error("Error toggling permanent status:", error);
        }
    };

    window.deleteNotice = async (noticeId) => {
        const confirmed = confirm("Are you sure you want to delete this announcement?");
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/auth/view/notices/${noticeId}/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error("Failed to delete announcement");

            alert("Announcement deleted successfully!");
            fetchFilteredNotices("/admin/announcements"); 
        } catch (error) {
            console.error("Error deleting notice:", error);
            alert("Error deleting notice.");
        }
    };
});
