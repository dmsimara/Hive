
function selectCard(element) {
    // Change the check icon to a check mark when the card is clicked
    const checkIcon = element.querySelector('.check');
    checkIcon.textContent = 'task_alt'; // Change to check icon

    // Optional: Reset other icons if you want only one to be selected at a time
    const allCards = document.querySelectorAll('.user-choice a');
    allCards.forEach(card => {
        if (card !== element) {
            const otherCheckIcon = card.querySelector('.check');
            otherCheckIcon.textContent = 'check_circle'; // Reset other icons back
        }
    });
}