// Guide Progress Management
export const GuideManager = {
    currentStep: 0,
    completedSteps: new Set(),
    totalSteps: { mac: 6, windows: 6 },
    
    init() {
        this.loadProgress();
        this.setupProgressBar();
        this.setupResultButtons();
        this.setupTroubleshooting();
        this.setupAccordion();
        this.updateProgress();
    },
    
    resetForOSChange() {
        // Reset progress
        this.currentStep = 0;
        this.completedSteps.clear();
        
        // Remove all expanded, active, completed classes
        document.querySelectorAll('.step-section').forEach(section => {
            section.classList.remove('expanded', 'active', 'completed');
        });
        
        // Remove all progress tags
        this.removeAllProgressTags();
        
        // Clear selected buttons
        this.selectedButtons = {};
    },
    
    setupProgressBar() {
        const container = document.getElementById('progressSteps');
        if (!container) return;
        
        const os = window.OSDetector?.getCurrentOS() || 'mac';
        const total = this.totalSteps[os];
        
        container.innerHTML = '';
        for (let i = 0; i < total; i++) {
            const step = document.createElement('div');
            step.className = 'progress-step';
            step.addEventListener('click', () => this.goToStep(i));
            container.appendChild(step);
        }
    },
    
    setupResultButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.result-btn')) {
                const button = e.target.closest('.result-btn');
                const step = button.getAttribute('data-step');
                const result = button.getAttribute('data-result');
                
                this.handleResultClick(step, result, button);
            }
        });
    },
    
    setupTroubleshooting() {
        // Mac type selector
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mac-type-btn')) {
                const button = e.target.closest('.mac-type-btn');
                const type = button.getAttribute('data-type');
                
                // Update button states
                document.querySelectorAll('.mac-type-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Show/hide solutions
                document.querySelectorAll('.mac-solution').forEach(solution => {
                    solution.classList.remove('active');
                });
                document.getElementById(`${type}-solution`)?.classList.add('active');
            }
        });
    },
    
    setupAccordion() {
        // Setup accordion functionality for step sections
        document.querySelectorAll('.step-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.parentElement;
                
                // Only allow clicking on active or completed sections
                if (section.classList.contains('active') || section.classList.contains('completed')) {
                    section.classList.toggle('expanded');
                }
            });
        });
        
        // Don't auto-expand anything here - let updateProgress handle it
    },
    
    handleResultClick(step, result, button) {
        // Store selected button
        if (!this.selectedButtons) {
            this.selectedButtons = {};
        }
        this.selectedButtons[step] = result;
        
        if (result === 'success') {
            // Mark button as selected
            this.markButtonAsSelected(step, button);
            
            // Close current step
            const currentStepElement = document.getElementById(`step-${step}`);
            if (currentStepElement) {
                currentStepElement.classList.remove('expanded');
            }
            
            this.completeStep(step);
            this.hideTroubleshooting(step);
            this.goToNextStep();
        } else if (result === 'error') {
            this.showTroubleshooting(step);
        }
        
        // Visual feedback
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    },
    
    markButtonAsSelected(step, button) {
        // Remove selected class from all buttons in this step
        const stepElement = document.getElementById(`step-${step}`);
        if (stepElement) {
            stepElement.querySelectorAll('.result-btn').forEach(btn => {
                btn.classList.remove('selected');
                btn.querySelectorAll('.selected-indicator, .selected-label').forEach(el => el.remove());
            });
        }
        
        // Add selected class and indicators to the clicked button
        button.classList.add('selected');
        
        // Add checkmark
        const indicator = document.createElement('div');
        indicator.className = 'selected-indicator';
        indicator.innerHTML = '✓';
        button.appendChild(indicator);
        
        // Add "선택됨" label
        const label = document.createElement('span');
        label.className = 'selected-label';
        label.textContent = '선택됨';
        button.appendChild(label);
    },
    
    disableNonSelectedButtons(stepSection, selectedResult) {
        // Disable all buttons that weren't selected in completed steps
        stepSection.querySelectorAll('.result-btn').forEach(btn => {
            if (btn.getAttribute('data-result') !== selectedResult) {
                btn.disabled = true;
                btn.classList.add('disabled');
                btn.style.cursor = 'not-allowed';
                btn.style.opacity = '0.5';
            }
        });
    },
    
    completeStep(step) {
        this.completedSteps.add(step);
        this.saveProgress();
        this.updateProgress();
        
        // 1단계 완료 시 사용자 카운트 증가
        const stepNames = {
            'start': '시작하기 전에',
            'homebrew': 'Homebrew 설치',
            'node': 'Node.js 설치',
            'start-windows': '시작하기 전에',
            'git-windows': 'Git 설치'
        };
        
        // 첫 번째 단계(시작하기 전에) 완료 시 카운트
        if ((step === 'start' || step === 'start-windows') && !this.hasCountedUser()) {
            this.incrementUserCount();
        }
        
        // Show success toast
        if (window.showToast) {
            const stepNames = {
                'start': '시작하기 전에',
                'homebrew': 'Homebrew 설치',
                'node': 'Node.js 설치',
                'claude': 'Claude Code 설치',
                'auth': '인증 설정',
                'project': '첫 프로젝트',
                'start-windows': '시작하기 전에',
                'git-windows': 'Git for Windows 설치',
                'node-windows': 'Node.js 설치',
                'claude-windows': 'Claude Code 설치',
                'auth-windows': '인증 설정',
                'project-windows': '첫 프로젝트'
            };
            const stepName = stepNames[step] || '단계';
            // 첫 단계 완료 시 특별한 메시지
            if ((step === 'start' || step === 'start-windows') && !this.hasCountedUser()) {
                window.showToast(`🎉 ${stepName} 완료! Claude Code 가족이 되신 것을 환영합니다!`, 'success');
            } else {
                window.showToast(`${stepName} 완료!`, 'success');
            }
        }
        
        // Mark step as completed
        const stepSection = document.getElementById(`step-${step}`);
        if (stepSection) {
            stepSection.classList.add('completed');
            
            // Update step header for completed state
            const header = stepSection.querySelector('.step-header');
            if (header) {
                // Remove "여기에서 시작하세요" tag
                const startTag = header.querySelector('.step-tag');
                if (startTag && startTag.textContent.includes('여기에서 시작하세요')) {
                    startTag.remove();
                }
                
                // Add "(완료)" to title
                const title = header.querySelector('h2');
                if (title && !title.textContent.includes('(완료)')) {
                    title.innerHTML = title.textContent + ' <span class="completed-text">(완료)</span>';
                }
                
                // Replace time estimate with "읽기전용" button
                const timeEstimate = header.querySelector('.time-estimate');
                if (timeEstimate) {
                    timeEstimate.innerHTML = '<button class="read-only-btn">읽기전용</button>';
                }
            }
            
            // Add summary view
            if (!stepSection.querySelector('.step-summary')) {
                this.addSummaryView(stepSection, step);
            }
            
            // Close the completed step
            stepSection.classList.remove('expanded');
            
            // Restore selected button state for completed step
            if (this.selectedButtons && this.selectedButtons[step]) {
                const selectedResult = this.selectedButtons[step];
                const button = stepSection.querySelector(`.result-btn[data-result="${selectedResult}"]`);
                if (button && !button.classList.contains('selected')) {
                    this.markButtonAsSelected(step, button);
                }
                // Disable non-selected buttons
                this.disableNonSelectedButtons(stepSection, selectedResult);
            }
        }
    },
    
    goToNextStep() {
        const os = window.OSDetector?.getCurrentOS() || 'mac';
        const total = this.totalSteps[os];
        
        if (this.currentStep < total - 1) {
            // Remove "현재 진행 중" tag from all steps before moving to next
            this.removeAllProgressTags();
            
            this.currentStep++;
            this.saveProgress();
            this.updateProgress();
            
            // Get step IDs based on OS
            let stepIds;
            if (os === 'windows') {
                stepIds = ['start-windows', 'git-windows', 'node-windows', 'claude-windows', 'auth-windows', 'project-windows'];
            } else {
                stepIds = ['start', 'homebrew', 'node', 'claude', 'auth', 'project'];
            }
            
            // Expand the next step and add "현재 진행 중" tag
            const nextStepId = stepIds[this.currentStep];
            if (nextStepId) {
                const nextStepElement = document.getElementById(`step-${nextStepId}`);
                if (nextStepElement) {
                    nextStepElement.classList.add('expanded');
                    
                    // Add "현재 진행 중" tag to the next step (only if it's not the first step)
                    if (this.currentStep > 0) {
                        const header = nextStepElement.querySelector('.step-header');
                        const stepNumber = header.querySelector('.step-number');
                        if (header && stepNumber && !header.querySelector('.progress-tag')) {
                            const progressTag = document.createElement('span');
                            progressTag.className = 'step-tag progress-tag';
                            progressTag.textContent = '현재 진행 중';
                            stepNumber.insertAdjacentElement('afterend', progressTag);
                        }
                    }
                }
            }
            
            this.scrollToCurrentStep();
        } else {
            // All steps completed
            this.showCompletionModal();
        }
    },
    
    removeAllProgressTags() {
        document.querySelectorAll('.progress-tag').forEach(tag => tag.remove());
    },
    
    goToStep(stepIndex, skipSave = false) {
        this.currentStep = stepIndex;
        if (!skipSave) {
            this.saveProgress();
        }
        this.updateProgress();
        this.scrollToCurrentStep();
    },
    
    scrollToCurrentStep() {
        const os = window.OSDetector?.getCurrentOS() || 'mac';
        let steps, suffix;
        
        if (os === 'windows') {
            steps = ['start-windows', 'git-windows', 'node-windows', 'claude-windows', 'auth-windows', 'project-windows'];
            suffix = '';
        } else {
            steps = ['start', 'homebrew', 'node', 'claude', 'auth', 'project'];
            suffix = '';
        }
        
        const stepId = steps[this.currentStep];
        const stepElement = document.getElementById(`step-${stepId}`);
        
        if (stepElement) {
            stepElement.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    },
    
    updateProgress() {
        const os = window.OSDetector?.getCurrentOS() || 'mac';
        const total = this.totalSteps[os];
        const completed = this.completedSteps.size;
        const percentage = Math.round((completed / total) * 100);
        
        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        // Update progress text
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = `${percentage}% 완료 (${completed}/${total})`;
        }
        
        // Update current step text
        const progressTime = document.querySelector('.progress-time');
        if (progressTime) {
            const stepNames = {
                'start': '시작하기 전에',
                'homebrew': 'Homebrew 설치',
                'node': 'Node.js 설치',
                'claude': 'Claude Code 설치',
                'auth': '인증 설정',
                'project': '첫 프로젝트',
                'start-windows': '시작하기 전에',
                'git-windows': 'Git for Windows 설치',
                'node-windows': 'Node.js 설치',
                'claude-windows': 'Claude Code 설치',
                'auth-windows': '인증 설정',
                'project-windows': '첫 프로젝트'
            };
            
            const currentStepId = os === 'windows' ? 
                ['start-windows', 'git-windows', 'node-windows', 'claude-windows', 'auth-windows', 'project-windows'][this.currentStep] :
                ['start', 'homebrew', 'node', 'claude', 'auth', 'project'][this.currentStep];
            
            const currentStepName = stepNames[currentStepId] || '시작하기 전에';
            progressTime.textContent = `현재: ${currentStepName}`;
        }
        
        // Update step indicators
        const stepElements = document.querySelectorAll('.progress-step');
        stepElements.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            
            if (index < completed) {
                step.classList.add('completed');
            } else if (index === this.currentStep) {
                step.classList.add('active');
            }
        });
        
        // Update step sections
        let stepIds;
        
        if (os === 'windows') {
            stepIds = ['start-windows', 'git-windows', 'node-windows', 'claude-windows', 'auth-windows', 'project-windows'];
        } else {
            stepIds = ['start', 'homebrew', 'node', 'claude', 'auth', 'project'];
        }
        
        // Remove active from all sections and remove all progress tags
        document.querySelectorAll('.step-section').forEach(section => {
            section.classList.remove('active');
        });
        this.removeAllProgressTags();
        
        // Add active to current step and expand it
        const currentStepId = stepIds[this.currentStep];
        if (currentStepId) {
            const currentStepElement = document.getElementById(`step-${currentStepId}`);
            if (currentStepElement) {
                currentStepElement.classList.add('active');
                
                // Only expand if not completed
                if (!currentStepElement.classList.contains('completed')) {
                    currentStepElement.classList.add('expanded');
                    
                    // Add "현재 진행 중" tag if not already present (but not for the first step)
                    if (this.currentStep > 0) {
                        const header = currentStepElement.querySelector('.step-header');
                        const stepNumber = header?.querySelector('.step-number');
                        if (header && stepNumber && !header.querySelector('.progress-tag')) {
                            const progressTag = document.createElement('span');
                            progressTag.className = 'step-tag progress-tag';
                            progressTag.textContent = '현재 진행 중';
                            stepNumber.insertAdjacentElement('afterend', progressTag);
                        }
                    }
                }
            }
        }
    },
    
    showTroubleshooting(step) {
        const troubleshooting = document.getElementById(`troubleshooting-${step}`);
        if (troubleshooting) {
            troubleshooting.classList.add('active');
            
            // 기본적으로 Apple Silicon 솔루션을 표시 (이미 HTML에서 active 클래스 추가됨)
            // 추가 로직이 필요한 경우 여기에 작성
        }
    },
    
    hideTroubleshooting(step) {
        const troubleshooting = document.getElementById(`troubleshooting-${step}`);
        if (troubleshooting) {
            troubleshooting.classList.remove('active');
        }
    },
    
    showCompletionModal() {
        // Create and show completion modal
        const modal = document.createElement('div');
        modal.className = 'completion-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close-btn" onclick="GuideManager.closeCompletionModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-icon">🎉</div>
                <h2>축하합니다!</h2>
                <p>Claude Code 설치가 모두 완료되었습니다.</p>
                <p class="modal-subtitle">이제 터미널에서 <code>claude-code</code> 명령어로 언제든지 시작할 수 있습니다.</p>
                
                <div class="completion-actions">
                    <button class="action-btn" onclick="window.location.href='../index.html'">
                        <i class="fas fa-home"></i>
                        홈으로 가기
                    </button>
                    <button class="action-btn" onclick="window.open('https://docs.anthropic.com/en/docs/claude-code', '_blank')">
                        <i class="fas fa-book"></i>
                        공식문서 보기
                    </button>
                </div>
                
                <div class="completion-newsletter">
                    <h3>💌 메이커의 뉴스레터 구독하기</h3>
                    <p>Claude Code 업데이트와 개발 인사이트를 받아보세요</p>
                    <form class="newsletter-form" onsubmit="GuideManager.handleNewsletterSubmit(event)">
                        <input type="email" placeholder="이메일 입력" required>
                        <button type="submit">구독하기</button>
                    </form>
                </div>
                
                <button class="btn-text-secondary" onclick="GuideManager.closeCompletionModal()">
                    나중에 하기
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCompletionModal();
            }
        });
    },
    
    
    handleNewsletterSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const email = form.querySelector('input[type="email"]').value;
        
        // 여기에 실제 뉴스레터 구독 로직 추가
        console.log('Newsletter subscription:', email);
        
        // 성공 메시지 표시
        form.innerHTML = '<div class="newsletter-success"><i class="fas fa-check-circle"></i> 구독 완료! 감사합니다.</div>';
    },
    
    closeCompletionModal() {
        const modal = document.querySelector('.completion-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                window.location.href = '../index.html';
            }, 300);
        }
    },
    
    saveProgress() {
        const os = window.OSDetector?.getCurrentOS() || 'mac';
        const progress = {
            os: os,
            currentStep: this.currentStep,
            completedSteps: Array.from(this.completedSteps),
            selectedButtons: this.selectedButtons || {},
            timestamp: Date.now()
        };
        
        localStorage.setItem('claude-guide-progress', JSON.stringify(progress));
        
        // Only update URL if there's actual progress
        if (this.currentStep > 0 || this.completedSteps.size > 0) {
            const url = new URL(window.location);
            
            // Convert to human-readable step numbers (1-based instead of 0-based)
            url.searchParams.set('current', this.currentStep + 1);
            
            // Create done range (e.g., "1-3" for steps 0,1,2)
            if (this.completedSteps.size > 0) {
                const completedArray = Array.from(this.completedSteps);
                const stepIndices = this.getStepIndices(completedArray);
                if (stepIndices.length > 0) {
                    const minStep = Math.min(...stepIndices) + 1;
                    const maxStep = Math.max(...stepIndices) + 1;
                    url.searchParams.set('done', minStep === maxStep ? `${minStep}` : `${minStep}-${maxStep}`);
                }
            }
            
            window.history.replaceState({}, '', url);
        }
    },
    
    getStepIndices(stepIds) {
        const os = window.OSDetector?.getCurrentOS() || 'mac';
        let stepIdArray;
        
        if (os === 'windows') {
            stepIdArray = ['start-windows', 'git-windows', 'node-windows', 'claude-windows', 'auth-windows', 'project-windows'];
        } else {
            stepIdArray = ['start', 'homebrew', 'node', 'claude', 'auth', 'project'];
        }
        
        return stepIds.map(id => stepIdArray.indexOf(id)).filter(index => index !== -1);
    },
    
    loadProgress() {
        // Load from URL first
        const urlParams = new URLSearchParams(window.location.search);
        const currentParam = urlParams.get('current');
        const doneParam = urlParams.get('done');
        
        // Also check old format for backward compatibility
        const oldStepParam = urlParams.get('step');
        const oldCompletedParam = urlParams.get('completed');
        
        if (currentParam !== null) {
            // New format: current is 1-based, so convert to 0-based
            this.currentStep = (parseInt(currentParam) || 1) - 1;
        } else if (oldStepParam !== null) {
            // Old format: already 0-based
            this.currentStep = parseInt(oldStepParam) || 0;
        }
        
        const os = window.OSDetector?.getCurrentOS() || 'mac';
        let stepIdArray;
        
        if (os === 'windows') {
            stepIdArray = ['start-windows', 'git-windows', 'node-windows', 'claude-windows', 'auth-windows', 'project-windows'];
        } else {
            stepIdArray = ['start', 'homebrew', 'node', 'claude', 'auth', 'project'];
        }
        
        if (doneParam) {
            // New format: "1-3" or "1"
            const parts = doneParam.split('-');
            if (parts.length === 2) {
                // Range format: "1-3"
                const start = parseInt(parts[0]) - 1; // Convert to 0-based
                const end = parseInt(parts[1]) - 1;   // Convert to 0-based
                this.completedSteps = new Set();
                for (let i = start; i <= end && i < stepIdArray.length; i++) {
                    this.completedSteps.add(stepIdArray[i]);
                }
            } else {
                // Single number: "1"
                const index = parseInt(parts[0]) - 1; // Convert to 0-based
                if (index >= 0 && index < stepIdArray.length) {
                    this.completedSteps = new Set([stepIdArray[index]]);
                }
            }
        } else if (oldCompletedParam) {
            // Old format: comma-separated step IDs
            const completed = oldCompletedParam.split(',').filter(s => s).map(s => s.trim());
            this.completedSteps = new Set(completed);
        }
        
        // Load selected buttons from localStorage if we have URL params
        if (currentParam !== null || doneParam || oldStepParam !== null || oldCompletedParam) {
            const saved = localStorage.getItem('claude-guide-progress');
            if (saved) {
                try {
                    const progress = JSON.parse(saved);
                    this.selectedButtons = progress.selectedButtons || {};
                } catch (e) {
                    console.warn('Failed to load selected buttons:', e);
                }
            }
        }
        
        // If no URL params, start fresh (ignore localStorage)
        if (!currentParam && !doneParam && oldStepParam === null && !oldCompletedParam) {
            this.currentStep = 0;
            this.completedSteps = new Set();
            this.selectedButtons = {};
        }
        
        // Apply completed state UI updates
        this.applyCompletedStatesUI();
    },
    
    applyCompletedStatesUI() {
        // Apply UI changes for all completed steps
        const os = window.OSDetector?.getCurrentOS() || 'mac';
        let stepIds;
        
        if (os === 'windows') {
            stepIds = ['start-windows', 'git-windows', 'node-windows', 'claude-windows', 'auth-windows', 'project-windows'];
        } else {
            stepIds = ['start', 'homebrew', 'node', 'claude', 'auth', 'project'];
        }
        
        this.completedSteps.forEach(stepId => {
            const stepSection = document.getElementById(`step-${stepId}`);
            if (stepSection) {
                stepSection.classList.add('completed');
                
                // Update step header for completed state
                const header = stepSection.querySelector('.step-header');
                if (header) {
                    // Remove "여기에서 시작하세요" tag
                    const startTag = header.querySelector('.step-tag');
                    if (startTag && startTag.textContent.includes('여기에서 시작하세요')) {
                        startTag.remove();
                    }
                    
                    // Add "(완료)" to title
                    const title = header.querySelector('h2');
                    if (title && !title.textContent.includes('(완료)')) {
                        title.innerHTML = title.textContent + ' <span class="completed-text">(완료)</span>';
                    }
                    
                    // Replace time estimate with "읽기전용" button
                    const timeEstimate = header.querySelector('.time-estimate');
                    if (timeEstimate) {
                        timeEstimate.innerHTML = '<button class="read-only-btn">읽기전용</button>';
                    }
                }
                
                // Make sure completed steps are not expanded
                stepSection.classList.remove('expanded');
                
                // Add summary view if not already present
                if (!stepSection.querySelector('.step-summary')) {
                    this.addSummaryView(stepSection, stepId);
                }
                
                // Restore selected button state
                if (this.selectedButtons && this.selectedButtons[stepId]) {
                    const selectedResult = this.selectedButtons[stepId];
                    const button = stepSection.querySelector(`.result-btn[data-result="${selectedResult}"]`);
                    if (button) {
                        this.markButtonAsSelected(stepId, button);
                    }
                    // Disable non-selected buttons in completed steps
                    this.disableNonSelectedButtons(stepSection, selectedResult);
                }
            }
        });
    },
    
    addSummaryView(stepSection, stepId) {
        const summaryData = this.getSummaryData(stepId);
        if (!summaryData) return;
        
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'step-summary';
        summaryDiv.innerHTML = `
            <div class="step-summary-content">
                <i class="fas fa-check-circle step-summary-icon"></i>
                <div class="step-summary-text">${summaryData.text}</div>
            </div>
            <button class="view-full-content-btn">
                <i class="fas fa-expand"></i>
                전체 내용 다시 보기
            </button>
        `;
        
        // Insert after header
        const header = stepSection.querySelector('.step-header');
        header.insertAdjacentElement('afterend', summaryDiv);
        
        // Add "back to summary" button to content if not already present
        const stepContent = stepSection.querySelector('.step-content');
        if (stepContent && !stepContent.querySelector('.back-to-summary-btn')) {
            const backBtn = document.createElement('button');
            backBtn.className = 'back-to-summary-btn';
            backBtn.innerHTML = `
                <i class="fas fa-compress"></i>
                요약으로 돌아가기
            `;
            stepContent.insertAdjacentElement('afterbegin', backBtn);
            
            // Add click handler to back button
            backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                stepSection.classList.remove('show-full');
            });
        }
        
        // Add click handler to view full button
        const viewFullBtn = summaryDiv.querySelector('.view-full-content-btn');
        viewFullBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stepSection.classList.add('show-full');
        });
    },
    
    getSummaryData(stepId) {
        const summaries = {
            'start': { text: '터미널 사용법 숙지 완료 • 기본 명령어 이해' },
            'start-windows': { text: '터미널 사용법 숙지 완료 • 기본 명령어 이해' },
            'homebrew': { text: 'Homebrew 패키지 관리자 설치 완료' },
            'git-windows': { text: 'Git for Windows 설치 완료' },
            'node': { text: 'Node.js 및 npm 설치 완료' },
            'node-windows': { text: 'Node.js 및 npm 설치 완료' },
            'claude': { text: 'Claude Code CLI 설치 완료' },
            'claude-windows': { text: 'Claude Code CLI 설치 완료' },
            'auth': { text: 'Anthropic API 키 설정 완료' },
            'auth-windows': { text: 'Anthropic API 키 설정 완료' },
            'project': { text: '첫 프로젝트 생성 및 실행 완료' },
            'project-windows': { text: '첫 프로젝트 생성 및 실행 완료' }
        };
        
        return summaries[stepId];
    },
    
    resetProgress() {
        this.currentStep = 0;
        this.completedSteps.clear();
        
        // Clear URL parameters except OS
        const url = new URL(window.location);
        url.searchParams.delete('step');
        url.searchParams.delete('completed');
        window.history.replaceState({}, '', url);
        
        // Clear localStorage
        localStorage.removeItem('claude-guide-progress');
        
        this.setupProgressBar();
        this.updateProgress();
        
        // Remove completed states
        document.querySelectorAll('.step-section').forEach(section => {
            section.classList.remove('completed');
        });
        
        // Hide troubleshooting
        document.querySelectorAll('.troubleshooting').forEach(troubleshooting => {
            troubleshooting.classList.remove('active');
        });
    },
    
    // 사용자 카운트 관련 메서드들
    hasCountedUser() {
        return localStorage.getItem('claude-guide-counted') === 'true';
    },
    
    markUserCounted() {
        localStorage.setItem('claude-guide-counted', 'true');
        localStorage.setItem('claude-guide-counted-date', new Date().toISOString());
    },
    
    async incrementUserCount() {
        try {
            // CountAPI를 사용하여 카운트 증가
            const response = await fetch('https://api.countapi.xyz/hit/claude-code-guide/users');
            const data = await response.json();
            console.log(`새로운 사용자! 총 사용자 수: ${data.value}`);
            
            // 로컬에 카운트 완료 표시
            this.markUserCounted();
        } catch (error) {
            console.error('사용자 카운트 실패:', error);
            // 실패해도 로컬에는 표시하여 중복 카운트 방지
            this.markUserCounted();
        }
    }
};

// Global functions for HTML onclick (원본 호환성)
window.handleResultClick = function(step, result, button) {
    GuideManager.handleResultClick(step, result, button);
};

window.handleResolutionClick = function(element, step) {
    if (!element.classList.contains('resolved')) {
        element.classList.add('resolved');
        const icon = element.querySelector('.resolution-check-icon i');
        if (icon) {
            icon.style.display = 'block';
        }
        
        // Mark the error button as selected if it's not already selected
        const stepElement = document.getElementById(`step-${step}`);
        if (stepElement) {
            const errorButton = stepElement.querySelector('.result-btn.error');
            if (errorButton && !GuideManager.selectedButtons[step]) {
                GuideManager.markButtonAsSelected(step, errorButton);
                GuideManager.selectedButtons[step] = 'error';
            }
        }
        
        // Complete the step and go to next
        setTimeout(() => {
            GuideManager.completeStep(step);
            GuideManager.hideTroubleshooting(step);
            GuideManager.goToNextStep();
        }, 500);
        
        // Hide troubleshooting after resolution
        setTimeout(() => {
            const troubleshooting = document.getElementById(`troubleshooting-${step}`);
            if (troubleshooting) {
                troubleshooting.classList.remove('active');
            }
        }, 1000);
    }
};

window.toggleOS = function() {
    window.OSDetector.toggleOS();
};

window.toggleTheme = function() {
    window.ThemeManager.toggle();
};

// Make GuideManager globally available
window.GuideManager = GuideManager;