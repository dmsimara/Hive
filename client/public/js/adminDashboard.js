const tabs = document.querySelectorAll('.tabs ul li a');

const currentPath = window.location.pathname.split("/").pop();

tabs.forEach(tab => {
    const tabPath = tab.getAttribute('href').split("/").pop();
    if (tabPath === currentPath) {
        tab.classList.add('active-tab');
    }
});