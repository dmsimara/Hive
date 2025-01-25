// document.querySelector('.get-hive-free').addEventListener('click', function(e) {
//     e.preventDefault();
//     this.innerText = 'Downloading...';
//     setTimeout(() => {
//         window.location.href = '#';
//     }, 1000); 
// });

document.querySelector('.get-hive-free').addEventListener('click', function (e) {
    e.preventDefault();  
    this.innerText = 'Downloading...';  
    setTimeout(() => {
        alert('Your Hive app download is starting now. If the download doesn’t begin, please try again.');  
        this.innerText = 'Download App';  
    }, 1000);
});
