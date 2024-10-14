// for styles to be applied not just with hover
// Get all the tab links
const tabs = document.querySelectorAll('.tabs ul li a');

// Get the current URL path (only the file name)
const currentPath = window.location.pathname.split("/").pop();

// Loop through each tab and add 'active-tab' to the corresponding tab based on URL
tabs.forEach(tab => {
    const tabPath = tab.getAttribute('href').split("/").pop();
    if (tabPath === currentPath) {
        tab.classList.add('active-tab');
    }
});



// for see more dropdown functionality
const dropdowns = document.querySelectorAll('.dropdown');

dropdowns.forEach(dropdown => {
    const select = dropdown.querySelector('.select');
    const caret = dropdown.querySelector('.caret');
    const menu = dropdown.querySelector('.menu');
    const options = dropdown.querySelectorAll('.menu li');
    const selected = dropdown.querySelector('.selected');

    select.addEventListener('click', () => {
        select.classList.toggle('select-clicked');
        caret.classList.toggle('caret-rotate');
        menu.classList.toggle('menu-open'); 
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            selected.innerText = option.innerText;
            select.classList.remove('select-clicked');
            caret.classList.remove('caret-rotate');
            menu.classList.remove('menu-open');

            options.forEach(opt => {
                opt.classList.remove('active');
            });
            option.classList.add('active');
        });
    });
});
