// Google Analytics 4 Integration
export const Analytics = {
    // GA4 측정 ID
    GA_MEASUREMENT_ID: 'G-2XGK1CF366',
    
    // 초기화
    init() {
        // GA4 스크립트 동적 로드
        this.loadGoogleAnalytics();
        
        // 페이지뷰 추적
        this.trackPageView();
        
        // 커스텀 이벤트 리스너 설정
        this.setupEventListeners();
    },
    
    // Google Analytics 스크립트 로드
    loadGoogleAnalytics() {
        // gtag 스크립트 추가
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);
        
        // gtag 초기화
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
            window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', this.GA_MEASUREMENT_ID, {
            // 개인정보 보호 설정
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
        });
    },
    
    // 페이지뷰 추적
    trackPageView() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: window.location.pathname
            });
        }
    },
    
    // 이벤트 추적
    trackEvent(eventName, parameters = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, parameters);
        }
        
        // Google Sheets에도 동시에 기록 (중요 이벤트만)
        if (this.isImportantEvent(eventName)) {
            this.sendToGoogleSheets(eventName, parameters);
        }
    },
    
    // 중요 이벤트 판단
    isImportantEvent(eventName) {
        const importantEvents = [
            'guide_started',
            'guide_completed',
            'step_completed',
            'error_occurred',
            'feedback_submitted',
            'installation_started',
            'installation_completed'
        ];
        return importantEvents.includes(eventName);
    },
    
    // Google Sheets로 데이터 전송
    sendToGoogleSheets(eventName, parameters) {
        // GuideManager의 SHEET_URL 사용
        if (window.GuideManager && window.GuideManager.SHEET_URL) {
            fetch(window.GuideManager.SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                    event: eventName,
                    ...parameters,
                    timestamp: new Date().toISOString()
                })
            }).catch(err => console.error('Failed to send to Google Sheets:', err));
        }
    },
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        // CTA 버튼 클릭 추적
        document.querySelectorAll('.cta-btn, .btn-primary').forEach(btn => {
            btn.addEventListener('click', () => {
                this.trackEvent('cta_click', {
                    button_text: btn.textContent,
                    button_location: btn.closest('section')?.className || 'unknown'
                });
            });
        });
        
        // 외부 링크 클릭 추적
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            link.addEventListener('click', () => {
                this.trackEvent('outbound_click', {
                    link_url: link.href,
                    link_text: link.textContent
                });
            });
        });
        
        // 스크롤 깊이 추적
        this.trackScrollDepth();
    },
    
    // 스크롤 깊이 추적
    trackScrollDepth() {
        let maxScroll = 0;
        const thresholds = [25, 50, 75, 90, 100];
        const trackedThresholds = new Set();
        
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                thresholds.forEach(threshold => {
                    if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
                        trackedThresholds.add(threshold);
                        this.trackEvent('scroll_depth', {
                            percent: threshold,
                            page: window.location.pathname
                        });
                    }
                });
            }
        });
    },
    
    // 가이드 관련 이벤트 추적
    trackGuideEvent(action, label, value = null) {
        const parameters = {
            event_category: 'guide',
            event_action: action,
            event_label: label
        };
        
        if (value !== null) {
            parameters.value = value;
        }
        
        this.trackEvent('guide_interaction', parameters);
    },
    
    // 에러 추적
    trackError(errorMessage, errorSource) {
        this.trackEvent('error', {
            error_message: errorMessage,
            error_source: errorSource,
            page: window.location.pathname
        });
    },
    
    // 세션 시간 추적
    trackSessionTime() {
        const startTime = Date.now();
        
        window.addEventListener('beforeunload', () => {
            const sessionDuration = Math.round((Date.now() - startTime) / 1000);
            
            // Beacon API 사용하여 페이지 떠날 때도 전송 보장
            if (navigator.sendBeacon && window.GuideManager) {
                const data = new FormData();
                data.append('event', 'session_end');
                data.append('duration', sessionDuration);
                data.append('page', window.location.pathname);
                
                navigator.sendBeacon(window.GuideManager.SHEET_URL, data);
            }
        });
    }
};