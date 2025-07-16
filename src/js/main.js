// Main JavaScript entry point
import { ThemeManager } from './modules/theme.js';
import { CounterAnimation } from './modules/counter.js';
import { initVersionUpdater } from './version-updater.js';

// Initialize theme system immediately
ThemeManager.init();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize landing page counter
  initializeLandingCounter();
  
  // Initialize version updater for guide and FAQ pages
  initVersionUpdater();
});

// Initialize landing page counter
async function initializeLandingCounter() {
  const counterEl = document.getElementById('successCounter');
  if (!counterEl) return;
  
  // CountAPI에서 실제 사용자 수 가져오기
  const actualUserCount = await fetchUserCount();
  
  if (actualUserCount < 50) {
    // 50명 미만일 때 격려 메시지
    counterEl.setAttribute('data-special', 'true');
    document.getElementById('counter').textContent = '✨';
    document.getElementById('counterText').textContent = '당신의 특별한 여정을 시작하세요';
  } else {
    // 50명 이상일 때 실제 사용자 수 표시
    document.getElementById('counter').textContent = '0';
    document.getElementById('counterText').textContent = '명이 이미 시작했습니다';
    
    // 0부터 올라가는 애니메이션 (재미 요소)
    setTimeout(() => {
      CounterAnimation.animate('counter', actualUserCount, 2000);
    }, 800);
  }
}

// CountAPI에서 사용자 수 가져오기
async function fetchUserCount() {
  try {
    const response = await fetch('https://api.countapi.xyz/get/claude-code-guide/users');
    const data = await response.json();
    return data.value || 0;
  } catch (error) {
    console.error('사용자 수 가져오기 실패:', error);
    return 0; // 실패 시 0 반환
  }
}