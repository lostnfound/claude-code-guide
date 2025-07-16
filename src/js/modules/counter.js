// Counter animation module - exactly like original
export const CounterAnimation = {
    animate(elementId, target, duration = 2000) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const start = 0;
        const startTime = performance.now();
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }
};