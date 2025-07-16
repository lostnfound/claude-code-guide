// OS Detection and Management
export const OSDetector = {
    currentOS: 'mac', // default
    
    init() {
        // 1. 기본 OS 감지
        this.detectOS();
        
        // 2. URL에서 OS 정보 확인 (있으면 덮어쓰기)
        this.loadOSFromURL();
        
        // 3. UI 업데이트
        this.updateOSDisplay();
        this.updateOSContent();
        
        // 4. 이벤트 리스너 설정
        this.setupOSToggle();
    },
    
    detectOS() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Windows')) {
            this.currentOS = 'windows';
        } else if (userAgent.includes('Mac')) {
            this.currentOS = 'mac';
        } else {
            this.currentOS = 'mac'; // default
        }
    },
    
    setupOSToggle() {
        const osToggle = document.getElementById('osToggle');
        if (osToggle) {
            osToggle.addEventListener('click', () => {
                this.toggleOS();
            });
        }
    },
    
    toggleOS() {
        this.currentOS = this.currentOS === 'mac' ? 'windows' : 'mac';
        this.updateOSDisplay();
        this.updateOSContent();
        this.updateURL();
        
        // Update progress bar for new OS
        if (window.GuideManager) {
            // Reset everything for OS change
            window.GuideManager.resetForOSChange();
            
            // Setup for new OS
            window.GuideManager.setupProgressBar();
            window.GuideManager.updateProgress();
            
            // Expand first step after OS switch
            const firstSection = document.querySelector('.step-section[data-os="' + this.currentOS + '"]');
            if (firstSection) {
                firstSection.classList.add('active', 'expanded');
                
                // Add "여기에서 시작하세요" tag to first step
                const header = firstSection.querySelector('.step-header');
                const stepNumber = header?.querySelector('.step-number');
                if (header && stepNumber && !header.querySelector('.step-tag')) {
                    const startTag = document.createElement('span');
                    startTag.className = 'step-tag';
                    startTag.textContent = '여기에서 시작하세요';
                    stepNumber.insertAdjacentElement('afterend', startTag);
                }
            }
        }
    },
    
    updateOSDisplay() {
        const osText = document.getElementById('currentOS');
        if (osText) {
            osText.textContent = this.currentOS === 'mac' ? 'Mac' : 'Windows';
        }
    },
    
    updateOSContent() {
        // Update body attribute for CSS
        document.body.setAttribute('data-current-os', this.currentOS);
    },
    
    updateURL() {
        const url = new URL(window.location);
        // OS 변경 시 진행 상황 리셋하므로 관련 파라미터 제거
        url.searchParams.delete('os');
        url.searchParams.delete('current');
        url.searchParams.delete('done');
        url.searchParams.set('os', this.currentOS);
        window.history.replaceState({}, '', url.toString());
    },
    
    loadOSFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const osParam = urlParams.get('os');
        
        if (osParam && (osParam === 'mac' || osParam === 'windows')) {
            this.currentOS = osParam;
        }
    },
    
    getCurrentOS() {
        return this.currentOS;
    }
};

// Make it globally available
window.OSDetector = OSDetector;