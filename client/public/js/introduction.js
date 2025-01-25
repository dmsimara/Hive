document.querySelector('.get-hive-free').addEventListener('click', function (e) {
    e.preventDefault();  

    this.innerText = 'Downloading...'; 

    setTimeout(() => {
        alert('Your Hive app download is starting now. If the download doesn’t begin, please try again.');
        this.innerText = 'Get Hive Free';

        window.location.href = 'https://drive.google.com/uc?export=download&id=1QjCzqeozzzO9ztjJthNrXhsof-ot0eWV';
    }, 1000); 
});
