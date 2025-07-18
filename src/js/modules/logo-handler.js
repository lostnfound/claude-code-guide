/**
 * 로고 클릭 핸들러
 * 홈 이동, 가이드 진행 상태 확인, 이스터 에그 등 처리
 */

import { Analytics } from './analytics.js';

export const LogoHandler = {
    clickCount: 0,
    clickTimer: null,
    
    init() {
        this.setupLogoClickHandler();
    },
    
    setupLogoClickHandler() {
        // nav-logo와 logo 클래스 모두 처리
        const logos = document.querySelectorAll('.nav-logo, .logo');
        
        logos.forEach(logo => {
            logo.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogoClick();
            });
        });
    },
    
    handleLogoClick() {
        const currentPath = window.location.pathname;
        const isGuidePage = currentPath.includes('guide.html');
        const isHomePage = currentPath === '/' || currentPath.includes('index.html');
        
        // 클릭 카운트 증가
        this.clickCount++;
        
        // 타이머 리셋 (2초 내 연속 클릭만 카운트)
        clearTimeout(this.clickTimer);
        this.clickTimer = setTimeout(() => {
            this.clickCount = 0;
        }, 2000);
        
        // 이스터 에그 체크
        if (this.clickCount >= 3) {
            this.triggerEasterEgg();
            // 이스터 에그 후에도 정상 동작은 계속
        }
        
        // 모든 페이지에서 맨 위로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
        Analytics.trackEvent('logo_click', { 
            action: 'scroll_to_top',
            page: currentPath
        });
    },
    
    triggerEasterEgg() {
        const logos = document.querySelectorAll('.nav-logo, .logo');
        
        // 흔들림 애니메이션
        logos.forEach(logo => {
            logo.classList.add('shake');
            setTimeout(() => logo.classList.remove('shake'), 300);
        });
        
        // 이스터 에그 메시지 표시
        if (this.clickCount === 3) {
            this.showTooltip('안녕하세요! 👋');
        } else if (this.clickCount === 5) {
            this.showTooltip('Claude Code와 함께 즐거운 코딩하세요! 🚀');
        } else if (this.clickCount === 7) {
            this.showTooltip('Made with ❤️ by Jongjin Choi');
            // 7번째 클릭 후 리셋
            this.clickCount = 0;
        }
        
        Analytics.trackEvent('logo_easter_egg', { click_count: this.clickCount });
    },
    
    showTooltip(message) {
        // 기존 툴팁 제거
        const existingTooltip = document.querySelector('.logo-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // 툴팁 생성
        const tooltip = document.createElement('div');
        tooltip.className = 'logo-tooltip';
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(tooltip);
        
        // 페이드 인
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
        });
        
        // 3초 후 제거
        setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.remove(), 300);
        }, 3000);
    }
};

// 모듈 로드 시 자동 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LogoHandler.init());
} else {
    LogoHandler.init();
}

export default LogoHandler;