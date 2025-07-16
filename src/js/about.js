// About page JavaScript
import { ThemeManager } from './modules/theme.js';

// Initialize theme system
ThemeManager.init();

// Initialize FAQ accordion
document.addEventListener('DOMContentLoaded', () => {
    initializeFAQ();
});

// FAQ accordion functionality
function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isActive = question.classList.contains('active');
            
            // Close all other FAQs
            faqQuestions.forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling.classList.remove('active');
            });
            
            // Toggle current FAQ
            if (!isActive) {
                question.classList.add('active');
                answer.classList.add('active');
            }
        });
    });
}

