// FAQ Page JavaScript
import { ThemeManager } from './modules/theme.js';
import { OSDetector } from './modules/os-detector.js';
import { FontController } from './modules/font-controller.js';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme manager
    ThemeManager.init();
    
    // Initialize OS detector
    OSDetector.init();
    
    // Initialize font controller
    FontController.init();
    
    // Initialize FAQ functionality
    initFAQ();
});

function initFAQ() {
    // Add click event listeners to FAQ questions
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const isActive = faqItem.classList.contains('active');
            
            // Close all other FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current FAQ item
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
    
    // Add keyboard navigation
    document.querySelectorAll('.faq-question').forEach(question => {
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');
        
        question.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // Update aria-expanded when FAQ items are toggled
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const faqItem = mutation.target;
                const question = faqItem.querySelector('.faq-question');
                const isActive = faqItem.classList.contains('active');
                
                if (question) {
                    question.setAttribute('aria-expanded', isActive ? 'true' : 'false');
                }
            }
        });
    });
    
    // Observe all FAQ items for class changes
    document.querySelectorAll('.faq-item').forEach(item => {
        observer.observe(item, { attributes: true, attributeFilter: ['class'] });
    });
}

// Add smooth scrolling to FAQ items if coming from a hash link
if (window.location.hash && window.location.hash.startsWith('#faq-')) {
    window.addEventListener('load', function() {
        const faqNumber = window.location.hash.replace('#faq-', '');
        const faqItem = document.querySelector(`[data-faq="${faqNumber}"]`)?.closest('.faq-item');
        
        if (faqItem) {
            // Open the FAQ item
            faqItem.classList.add('active');
            
            // Scroll to it after a brief delay to ensure rendering
            setTimeout(() => {
                faqItem.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 100);
        }
    });
}