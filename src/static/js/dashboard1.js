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
function toggle1() {
    var blur = document.getElementById('blur');
    blur.classList.toggle('active'); 
    var popup = document.getElementById('popup');
    popup.classList.toggle('active'); 
}

// for seemore button popup
// document.querySelector('#show-seemore').addEventListener('click', function() {
//     document.querySelector('.seemore-popup').classList.add('active1');
// });

// document.querySelector('.seemore-popup .close-btn').addEventListener('click', function() {
//     document.querySelector('.seemore-popup').classList.remove('active1');
// });

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#show-seemore').addEventListener('click', function() {
        console.log("See More clicked"); // Debugging
        document.querySelector('.seemore-popup').classList.add('active1');
    });

    document.querySelector('.seemore-popup .close-btn').addEventListener('click', function() {
        document.querySelector('.seemore-popup').classList.remove('active1');
    });
});