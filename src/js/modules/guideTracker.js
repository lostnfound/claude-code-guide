// Guide Tracking Module
import { Analytics } from './analytics.js';

export const GuideTracker = {
    // 현재 가이드 정보
    currentGuide: null,
    currentStep: 0,
    startTime: null,
    
    // 가이드 시작
    startGuide(guideId, guideName) {
        this.currentGuide = guideId;
        this.currentStep = 0;
        this.startTime = Date.now();
        
        // GA와 Apps Script에 이벤트 전송
        Analytics.trackEvent('guide_started', {
            guide_id: guideId,
            guide_name: guideName,
            start_time: new Date().toISOString()
        });
        
        // Apps Script에 직접 전송 (중요 이벤트)
        Analytics.sendToGoogleSheets('guide_started', {
            guide_id: guideId,
            guide_name: guideName,
            step_number: 0,
            step_name: 'Start'
        });
        
        console.log(`Guide started: ${guideName}`);
    },
    
    // 단계 완료
    completeStep(stepNumber, stepName) {
        const stepDuration = this.startTime ? Math.round((Date.now() - this.startTime) / 1000) : 0;
        
        Analytics.trackEvent('step_completed', {
            guide_id: this.currentGuide,
            step_number: stepNumber,
            step_name: stepName,
            duration: stepDuration
        });
        
        // Apps Script에 직접 전송
        Analytics.sendToGoogleSheets('step_completed', {
            guide_id: this.currentGuide,
            step_number: stepNumber,
            step_name: stepName,
            duration: stepDuration
        });
        
        this.currentStep = stepNumber;
        console.log(`Step completed: ${stepName} (${stepDuration}s)`);
    },
    
    // 가이드 완료
    completeGuide() {
        const totalDuration = this.startTime ? Math.round((Date.now() - this.startTime) / 1000) : 0;
        
        Analytics.trackEvent('guide_completed', {
            guide_id: this.currentGuide,
            total_steps: this.currentStep,
            total_duration: totalDuration
        });
        
        // Apps Script에 직접 전송
        Analytics.sendToGoogleSheets('guide_completed', {
            guide_id: this.currentGuide,
            total_steps: this.currentStep,
            duration: totalDuration
        });
        
        // 카운터 업데이트
        this.updateCounter();
        
        console.log(`Guide completed: ${this.currentGuide} (${totalDuration}s)`);
        
        // 초기화
        this.currentGuide = null;
        this.currentStep = 0;
        this.startTime = null;
    },
    
    // 에러 발생
    trackError(errorMessage, errorDetails) {
        Analytics.trackEvent('error_occurred', {
            guide_id: this.currentGuide,
            step_number: this.currentStep,
            error_message: errorMessage,
            error_details: errorDetails
        });
        
        // Apps Script에 직접 전송
        Analytics.sendToGoogleSheets('error_occurred', {
            guide_id: this.currentGuide,
            step_number: this.currentStep,
            error_details: errorMessage
        });
        
        console.error(`Error in guide: ${errorMessage}`);
    },
    
    // 카운터 업데이트
    async updateCounter() {
        try {
            // Apps Script에서 현재 카운터 값 가져오기
            const response = await fetch(Analytics.APPS_SCRIPT_URL + '?action=getCounter&metric=users');
            const data = await response.json();
            
            // 카운터 UI 업데이트
            const counterElement = document.getElementById('visitor-count');
            if (counterElement && data.value) {
                counterElement.textContent = data.value.toLocaleString();
            }
        } catch (error) {
            console.error('Failed to update counter:', error);
        }
    },
    
    // 첫 방문 체크 및 기록
    checkFirstVisit() {
        const isFirstVisit = !localStorage.getItem('claude_guide_visited');
        
        if (isFirstVisit) {
            localStorage.setItem('claude_guide_visited', 'true');
            
            // 새 사용자 이벤트
            Analytics.sendToGoogleSheets('page_view', {
                customData: { firstVisit: true }
            });
        }
        
        return isFirstVisit;
    }
};