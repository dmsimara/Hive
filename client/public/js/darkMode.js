function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDark ? "dark" : "light");

    const logo = document.getElementById("logo");
    if (isDark) {
        logo.src = "/images/hiveDark.png"; 
    } else {
        logo.src = "/images/hiveLight.png";  
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    
    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
        document.getElementById("darkModeRadio").checked = true;
        document.getElementById("logo").src = "/images/hiveDark.png"; 
    } else {
        document.getElementById("lightModeRadio").checked = true;
        document.getElementById("logo").src = "/images/hiveLight.png"; 
    }

    document.getElementById("lightModeRadio").addEventListener("change", () => {
        if (document.getElementById("lightModeRadio").checked) {
            document.body.classList.remove("dark-theme");
            localStorage.setItem("theme", "light");
            document.getElementById("logo").src = "/images/hiveLight.png"; 
        }
    });

    document.getElementById("darkModeRadio").addEventListener("change", () => {
        if (document.getElementById("darkModeRadio").checked) {
            document.body.classList.add("dark-theme");
            localStorage.setItem("theme", "dark");
            document.getElementById("logo").src = "/images/hiveDark.png"; 
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const fontSizeSelect = document.getElementById("fontSize");
    const zoomDisplaySelect = document.getElementById("zoomDisplay");

    const savedFontSize = localStorage.getItem("fontSize");
    const savedZoomDisplay = localStorage.getItem("zoomDisplay");

    if (savedFontSize) {
        document.body.style.fontSize = savedFontSize;
        fontSizeSelect.value = savedFontSize;  
    }

    if (savedZoomDisplay) {
        document.body.style.zoom = savedZoomDisplay;
        zoomDisplaySelect.value = savedZoomDisplay.replace('%', '');  
    }

    fontSizeSelect.addEventListener("change", (event) => {
        const fontSize = event.target.value;

        if (fontSize) {
            document.body.style.fontSize = fontSize;
            localStorage.setItem("fontSize", fontSize); 
        } else {
            document.body.style.fontSize = ""; 
            localStorage.removeItem("fontSize"); 
        }
    });

    zoomDisplaySelect.addEventListener("change", (event) => {
        const zoomLevel = event.target.value;

        if (zoomLevel) {
            document.body.style.zoom = zoomLevel + "%";
            localStorage.setItem("zoomDisplay", zoomLevel + "%");
        } else {
            document.body.style.zoom = ""; 
            localStorage.removeItem("zoomDisplay"); 
        }
    });
});
