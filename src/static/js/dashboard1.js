// for styles to be applied not just with hover - tabs header
const tabs = document.querySelectorAll('.tabs ul li a');

const currentPath = window.location.pathname.split("/").pop();

tabs.forEach(tab => {
    const tabPath = tab.getAttribute('href').split("/").pop();
    if (tabPath === currentPath) {
        tab.classList.add('active-tab');
    }
});


// for tenants info pop-up
function toggle() {
    var blur = document.getElementById('blur');
    blur.classList.toggle('active'); // Toggles blur effect
    var popup = document.getElementById('popup');
    popup.classList.toggle('active'); // Toggles popup visibility
}