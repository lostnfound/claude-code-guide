/**
 * Mobile Detection and Blocking System
 * Detects mobile devices and displays a desktop-only message
 */

class MobileDetector {
    constructor() {
        this.init();
    }

    /**
     * Initialize mobile detection
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.checkAndBlock();
            });
        } else {
            this.checkAndBlock();
        }
    }

    /**
     * Check if device is mobile and apply blocking if needed
     */
    checkAndBlock() {
        if (this.isMobileDevice()) {
            this.createBlockOverlay();
            this.showMobileBlock();
        }
    }

    /**
     * Comprehensive mobile device detection
     * @returns {boolean} True if mobile device detected
     */
    isMobileDevice() {
        // Method 1: User Agent detection
        const userAgent = navigator.userAgent.toLowerCase();
        const mobilePatterns = [
            /mobile/i,
            /android/i,
            /iphone/i,
            /ipad/i,
            /ipod/i,
            /blackberry/i,
            /windows phone/i,
            /webos/i,
            /bada/i,
            /tizen/i,
            /kindle/i,
            /silk/i,
            /mobile safari/i,
            /opera mini/i,
            /opera mobi/i
        ];

        const isMobileUserAgent = mobilePatterns.some(pattern => pattern.test(userAgent));

        // Method 2: Screen size detection (as backup)
        const isMobileScreen = window.innerWidth <= 768 && window.innerHeight <= 1024;

        // Method 3: Touch support detection
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Method 4: Orientation support (mobile specific)
        const hasOrientationSupport = typeof window.orientation !== 'undefined';

        // Combine multiple detection methods for better accuracy
        // Primary: User Agent + Screen Size
        // Secondary: Touch + Orientation as supporting evidence
        return isMobileUserAgent || (isMobileScreen && (hasTouchSupport || hasOrientationSupport));
    }

    /**
     * Create the mobile block overlay HTML structure
     */
    createBlockOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-block-overlay';
        overlay.id = 'mobile-block-overlay';

        overlay.innerHTML = `
            <div class="mobile-block-content">
                <div class="mobile-block-icon">
                    <i class="fas fa-desktop"></i>
                </div>
                <h2 class="mobile-block-title">데스크탑에서 이용해주세요</h2>
                <p class="mobile-block-message">
                    이 가이드는 터미널 명령어를 실행하고 코드를 복사하여 붙여넣는 과정이 포함되어 있어, 
                    데스크탑 또는 노트북에서 사용하시는 것을 강력히 권장합니다.
                </p>
                
                <div class="mobile-block-recommendations">
                    <h4>권장 환경</h4>
                    <ul>
                        <li>Windows 10/11 데스크탑 또는 노트북</li>
                        <li>macOS 데스크탑 또는 MacBook</li>
                        <li>터미널/명령 프롬프트 접근 가능한 환경</li>
                        <li>코드 복사/붙여넣기가 원활한 브라우저</li>
                    </ul>
                </div>
                
                <div class="mobile-block-footer">
                    Claude Code 설치 가이드 | 데스크탑 전용
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    /**
     * Show mobile block overlay and hide main content
     */
    showMobileBlock() {
        const overlay = document.getElementById('mobile-block-overlay');
        if (overlay) {
            overlay.classList.add('active');
            document.body.classList.add('mobile-blocked');
            
            // Prevent scrolling
            document.body.style.overflow = 'hidden';
            
            // Set page title to indicate mobile blocking
            document.title = '데스크탑에서 이용해주세요 - Claude Code Guide';
        }
    }

    /**
     * Hide mobile block overlay (for testing purposes)
     */
    hideMobileBlock() {
        const overlay = document.getElementById('mobile-block-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.classList.remove('mobile-blocked');
            document.body.style.overflow = '';
        }
    }

    /**
     * Force mobile block for testing
     */
    forceShowMobileBlock() {
        this.createBlockOverlay();
        this.showMobileBlock();
    }
}

// Initialize mobile detector when script loads
const mobileDetector = new MobileDetector();

// Expose to global scope for debugging
window.mobileDetector = mobileDetector;