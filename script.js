// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    
    // Elements for Greeting Feature
    const greetBtn = document.getElementById('greet-btn');
    const userNameInput = document.getElementById('user-name');
    const greetingText = document.getElementById('greeting-text');

    // Elements for Dark Mode Feature
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // 1. Greeting Logic
    greetBtn.addEventListener('click', () => {
        const name = userNameInput.value.trim();
        
        if (name === '') {
            greetingText.textContent = "Please enter a valid name!";
            greetingText.style.color = "red";
        } else {
            greetingText.textContent = `Hello, ${name}! Welcome to your new site.`;
            greetingText.style.color = "var(--primary-color)";
            userNameInput.value = ''; // Clear input field
        }
    });

    // 2. Dark Mode Logic
    themeToggleBtn.addEventListener('click', () => {
        // Check current theme attribute
        const currentTheme = htmlElement.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            htmlElement.removeAttribute('data-theme');
        } else {
            htmlElement.setAttribute('data-theme', 'dark');
        }
    });
});