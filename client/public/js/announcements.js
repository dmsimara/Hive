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
    const noticesContainer = document.getElementById("notices-container");

    pinnedButton.addEventListener("click", () => fetchFilteredNotices("/admin/announcements?filter=pinned"));
    permanentButton.addEventListener("click", () => fetchFilteredNotices("/admin/announcements?filter=permanent"));
    allButton.addEventListener("click", () => fetchFilteredNotices("/admin/announcements"));

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

            if (!response.ok) throw new Error("Failed to add notice");

            const { success, message } = await response.json();
            if (success) {
                alert("Notice added successfully!");
                addNoticeForm.reset();
                fetchFilteredNotices("/admin/announcements");
            } else alert(message);
        } catch (error) {
            console.error("Error submitting notice:", error);
            alert("Error submitting notice.");
        }
    });

    window.togglePinned = async (noticeId) => {
        const noticeElement = document.querySelector(`[data-id="${noticeId}"]`);

        const isPinned = noticeElement && noticeElement.dataset.pinned === "true"; 

        const confirmationMessage = isPinned 
            ? "Are you sure you want to unpin this notice?" 
            : "Are you sure you want to pin this notice?";

        const userConfirmed = confirm(confirmationMessage);
        if (!userConfirmed) {
        }

        try {
            const response = await fetch(`/api/auth/view/notices/${noticeId}/toggle_pinned`, { method: "PATCH" });
            const data = await response.json();
            
            if (data.success) {
                const actionMessage = data.isPinned ? "Notice pinned!" : "Notice unpinned!";
                alert(actionMessage);

                if (noticeElement) {
                    noticeElement.dataset.pinned = data.isPinned ? "true" : "false"; 
                    noticeElement.querySelector(".material-icons.pinned").textContent = data.isPinned ? "push_pin" : "push_pin_outlined"; // Change icon based on pinned state
                }

                fetchFilteredNotices("/admin/announcements");  
            } else {
                alert("Failed to update pinned status.");
            }
        } catch (error) {
            console.error("Error toggling pinned status:", error);
            alert("Error toggling pinned status.");
        }
    };

    window.togglePermanent = async (noticeId) => {
        const isPermanent = document.querySelector(`[data-id="${noticeId}"].permanent`).textContent === "note";
        const confirmationMessage = isPermanent 
            ? "Are you sure you want to remove this notice from permanent?" 
            : "Are you sure you want to mark this notice as permanent?";

        const userConfirmed = confirm(confirmationMessage);
        if (!userConfirmed) {
            return; 
        }

        try {
            const response = await fetch(`/api/auth/view/notices/${noticeId}/toggle_permanent`, { method: "PATCH" });
            const data = await response.json();
            
            if (data.success) {
                const actionMessage = data.isPermanent ? "Notice marked as permanent!" : "Notice unmarked as permanent!";
                alert(actionMessage);

                const permanentButton = document.querySelector(`[data-id="${noticeId}"].permanent`);
                if (permanentButton) {
                    permanentButton.textContent = data.isPermanent ? "note" : "note_add"; 
                }

                fetchFilteredNotices("/admin/announcements");  
            } else {
                alert("Failed to update permanent status.");
            }
        } catch (error) {
            console.error("Error toggling permanent status:", error);
            alert("Error toggling permanent status.");
        }
    };

    async function fetchFilteredNotices(url) {
        try {
            const response = await fetch(url, { headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error("Failed to fetch notices");

            const { notices } = await response.json();
            noticesContainer.innerHTML = notices.length
                ? notices
                      .map(
                          (n) => `
                    <div data-id="${n.notice_id}" data-pinned="${n.pinned}" class="notice-item ${n.pinned ? 'pinned' : ''} ${n.permanent ? 'permanent' : ''}">
                        <h2 class="notice-title">${n.title}</h2>
                        <p class="notice-content">${n.content}</p>
                        <span class="notice-meta">
                            ${n.pinned ? '<span class="badge pinned-badge">Pinned</span>' : ''}
                            ${n.permanent ? '<span class="badge permanent-badge">Permanent</span>' : ''}
                            <span class="notice-date">${new Date(n.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </span>
                        <i class="material-icons pinned" onclick="togglePinned(${n.notice_id})">
                            ${n.pinned ? "push_pin" : "push_pin_outlined"}
                        </i>
                        <i class="material-icons permanent" onclick="togglePermanent(${n.notice_id})">
                            ${n.permanent ? "note" : "note_add"}
                        </i>
                    </div>
                `
                      )
                      .join("")
                : "<p>No notices available.</p>";
        } catch (error) {
            console.error("Error fetching notices:", error);
        }
    }

    fetchFilteredNotices("/admin/announcements");
});
