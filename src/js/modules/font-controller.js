// Font Size Controller
export const FontController = {
    currentSize: 'normal', // small, normal, large, xlarge
    
    init() {
        this.loadFontSize();
        this.setupControls();
    },
    
    setupControls() {
        const decreaseBtn = document.getElementById('decreaseFont');
        const increaseBtn = document.getElementById('increaseFont');
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                this.changeFontSize(-1);
            });
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                this.changeFontSize(1);
            });
        }
    },
    
    changeFontSize(direction) {
        const sizes = ['small', 'normal', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(this.currentSize);
        const newIndex = Math.max(0, Math.min(sizes.length - 1, currentIndex + direction));
        
        this.currentSize = sizes[newIndex];
        this.applyFontSize();
        this.saveFontSize();
        
        // Show toast notification
        if (window.showToast) {
            const sizeNames = {
                small: '작게',
                normal: '보통',
                large: '크게',
                xlarge: '매우 크게'
            };
            window.showToast(`글자 크기: ${sizeNames[this.currentSize]}`, 'info');
        }
    },
    
    applyFontSize() {
        if (this.currentSize === 'normal') {
            document.documentElement.removeAttribute('data-font-size');
        } else {
            document.documentElement.setAttribute('data-font-size', this.currentSize);
        }
    },
    
    saveFontSize() {
        localStorage.setItem('claude-guide-font-size', this.currentSize);
    },
    
    loadFontSize() {
        const saved = localStorage.getItem('claude-guide-font-size');
        if (saved && ['small', 'normal', 'large', 'xlarge'].includes(saved)) {
            this.currentSize = saved;
            this.applyFontSize();
        }
    }
};

// Global function for HTML onclick (원본 호환성)
window.changeFontSize = function(direction) {
    FontController.changeFontSize(direction);
};