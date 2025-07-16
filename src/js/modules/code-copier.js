// Code Copy Functionality
export const CodeCopier = {
    init() {
        this.setupCopyButtons();
    },
    
    setupCopyButtons() {
        document.addEventListener('click', async (e) => {
            if (e.target.closest('.copy-btn')) {
                const button = e.target.closest('.copy-btn');
                const codeBlock = button.closest('.code-block');
                const code = codeBlock.querySelector('code');
                
                if (code) {
                    await this.copyCode(code.textContent, button);
                }
            }
        });
    },
    
    async copyCode(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Visual feedback
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i><span>복사됨!</span>';
            button.classList.add('copied');
            
            // Reset after 2 seconds
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 2000);
            
            // Show toast notification
            if (window.showToast) {
                window.showToast('명령어가 복사되었습니다!', 'success');
            }
        } catch (err) {
            console.error('Copy failed:', err);
            
            // Fallback for older browsers
            this.fallbackCopy(text, button);
        }
    },
    
    fallbackCopy(text, button) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            
            // Visual feedback
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i><span>복사됨!</span>';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 2000);
            
            if (window.showToast) {
                window.showToast('명령어가 복사되었습니다!', 'success');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            if (window.showToast) {
                window.showToast('복사에 실패했습니다.', 'error');
            }
        }
        
        document.body.removeChild(textArea);
    }
};

// Global function for HTML onclick (원본 호환성)
window.copyCode = function(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('code');
    
    if (code) {
        CodeCopier.copyCode(code.textContent, button);
    }
};