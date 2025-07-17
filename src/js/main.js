// Main JavaScript entry point
import { ThemeManager } from './modules/theme.js';
import { CounterAnimation } from './modules/counter.js';
import { initVersionUpdater } from './version-updater.js';
import { Analytics } from './modules/analytics.js';
import { GuideTracker } from './modules/guideTracker.js';

// Initialize theme system immediately
ThemeManager.init();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize analytics
  Analytics.init();
  
  // Check first visit
  GuideTracker.checkFirstVisit();
  
  // Initialize landing page counter
  initializeLandingCounter();
  
  // Initialize version updater for guide and FAQ pages
  initVersionUpdater();
  
  // Initialize theme toggle button
  initThemeToggle();
  
  // Initialize guide tracking if on guide page
  initGuideTracking();
});

// Initialize landing page counter
async function initializeLandingCounter() {
  const counterEl = document.getElementById('successCounter');
  if (!counterEl) return;
  
  // CountAPI에서 실제 사용자 수 가져오기
  const actualUserCount = await fetchUserCount();
  
  if (actualUserCount < 50) {
    // 50명 미만일 때는 바로 특별한 메시지만 표시
    counterEl.setAttribute('data-special', 'true');
    document.getElementById('counter').textContent = '✨';
    document.getElementById('counterText').textContent = '당신의 특별한 여정을 시작하세요';
  } else {
    // 50명 이상일 때만 카운터 애니메이션 표시
    document.getElementById('counter').textContent = '0';
    document.getElementById('counterText').textContent = '명이 이미 시작했습니다';
    
    // 0부터 올라가는 애니메이션
    setTimeout(() => {
      CounterAnimation.animate('counter', actualUserCount, 2000);
    }, 800);
  }
}

// Apps Script에서 사용자 수 가져오기
async function fetchUserCount() {
  try {
    const response = await fetch(Analytics.APPS_SCRIPT_URL + '?action=getCounter&metric=users');
    const data = await response.json();
    return data.value || 30; // 기본값 30
  } catch (error) {
    console.error('사용자 수 가져오기 실패:', error);
    return 30; // 실패 시 기본값 반환
  }
}

// Theme toggle for landing page
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      ThemeManager.toggle();
    });
  }
}

// Initialize guide tracking
function initGuideTracking() {
  // 가이드 페이지인지 확인
  if (window.location.pathname.includes('/guide')) {
    // 예시: 가이드 시작 버튼에 이벤트 리스너 추가
    const startButtons = document.querySelectorAll('.start-guide-btn');
    startButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const guideId = btn.dataset.guideId || 'setup-guide';
        const guideName = btn.dataset.guideName || 'Claude Code Setup Guide';
        GuideTracker.startGuide(guideId, guideName);
      });
    });
    
    // 단계 완료 버튼
    const stepButtons = document.querySelectorAll('.complete-step-btn');
    stepButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const stepNumber = parseInt(btn.dataset.stepNumber) || 1;
        const stepName = btn.dataset.stepName || 'Step ' + stepNumber;
        GuideTracker.completeStep(stepNumber, stepName);
      });
    });
    
    // 가이드 완료 버튼
    const completeButtons = document.querySelectorAll('.complete-guide-btn');
    completeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        GuideTracker.completeGuide();
      });
    });
  }
}

// Export for use in other modules
window.GuideTracker = GuideTracker;