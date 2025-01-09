 function toggleDarkMode() {
     const isDark = document.body.classList.toggle("dark-theme");
     localStorage.setItem("theme", isDark ? "dark" : "light");

     const btnText = document.getElementById("btnText");
     const btnIcon = document.getElementById("btnIcon");
     const logo = document.getElementById("logo");

     if (isDark) {
         btnIcon.innerHTML = "light_mode";  
         btnText.innerHTML = "Light"; 
         logo.src = "/images/hiveDark.png";  
     } else {
         btnIcon.innerHTML = "dark_mode";  
         btnText.innerHTML = "Dark"; 
         logo.src = "/images/hiveLight.png";  
     }
 }

 document.addEventListener("DOMContentLoaded", () => {
     const savedTheme = localStorage.getItem("theme");
     if (savedTheme === "dark") {
         document.body.classList.add("dark-theme");

         document.getElementById("btnIcon").innerHTML = "light_mode";
         document.getElementById("btnText").innerHTML = "Light";
         document.getElementById("logo").src = "/images/hiveDark.png";
     } else {
         document.getElementById("btnIcon").innerHTML = "dark_mode";
         document.getElementById("btnText").innerHTML = "Dark";
         document.getElementById("logo").src = "/images/hiveLight.png";
     }
});

document.getElementById("btn").onclick = toggleDarkMode;
