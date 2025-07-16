// Theme management module - exactly like original
export const ThemeManager = {
    themes: {
        day: {
            name: '밝은',
            theme: 'light',
            icon: 'fas fa-sun',
            hours: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]  // 오전 5시 ~ 오후 7시 (15시간)
        },
        night: {
            name: '어두운',
            theme: 'dark',
            icon: 'fas fa-moon',
            hours: [20, 21, 22, 23, 0, 1, 2, 3, 4]  // 오후 8시 ~ 오전 4시 (9시간)
        }
    },

    // 현재 시간에 맞는 테마 가져오기
    getTimeBasedTheme() {
        const hour = new Date().getHours();
        
        for (const [key, theme] of Object.entries(this.themes)) {
            if (theme.hours.includes(hour)) {
                return { key, ...theme };
            }
        }
        
        // 기본값 (안전장치)
        return { key: 'day', ...this.themes.day };
    },

    // 테마 적용
    applyTheme(themeConfig, isManual = false) {
        document.documentElement.setAttribute('data-theme', themeConfig.theme);
        
        // 테마 토글 버튼 업데이트
        this.updateToggleButton(themeConfig);
        
        // 수동 변경인 경우 저장 (테마 key와 theme 값 모두 저장)
        if (isManual) {
            localStorage.setItem('claude-code-guide-manual-theme', JSON.stringify({
                date: new Date().toDateString(),
                themeKey: themeConfig.key,  // day, night 중 하나
                theme: themeConfig.theme     // light, dark 중 하나
            }));
        }
    },

    // 토글 버튼 업데이트
    updateToggleButton(themeConfig) {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('.theme-text');
        
        if (icon) {
            icon.className = themeConfig.icon;
        }
        if (text) {
            text.textContent = themeConfig.name + ' 모드';
        }
    },

    // 초기화
    init() {
        // 수동 테마 확인
        const manualTheme = localStorage.getItem('claude-code-guide-manual-theme');
        if (manualTheme) {
            const { date, themeKey, theme } = JSON.parse(manualTheme);
            const today = new Date().toDateString();
            
            // 오늘 수동으로 변경한 경우 유지
            if (date === today) {
                let themeConfig;
                if (themeKey && this.themes[themeKey]) {
                    themeConfig = { key: themeKey, ...this.themes[themeKey] };
                } else {
                    // 구버전 호환성을 위해 theme 값으로 찾기
                    const entry = Object.entries(this.themes).find(([key, t]) => t.theme === theme);
                    if (entry) {
                        themeConfig = { key: entry[0], ...entry[1] };
                    }
                }
                
                if (themeConfig) {
                    this.applyTheme(themeConfig);
                    return;
                }
            }
        }
        
        // 시간 기반 테마 적용
        const currentTheme = this.getTimeBasedTheme();
        this.applyTheme(currentTheme);
    },

    // 테마 토글 (수동 전환)
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newThemeKey = currentTheme === 'dark' ? 'day' : 'night';
        const newTheme = { key: newThemeKey, ...this.themes[newThemeKey] };
        this.applyTheme(newTheme, true);
        
        // 토스트 알림 표시
        if (window.showToast) {
            window.showToast(`${newTheme.name} 모드로 전환되었습니다. 오늘 하루 동안 유지됩니다.`, 'info');
        }
    }
};

// 즉시 테마 적용 (깜빡임 방지)
(function() {
    // 먼저 localStorage에서 수동 테마 확인
    const manualTheme = localStorage.getItem('claude-code-guide-manual-theme');
    if (manualTheme) {
        const { date, themeKey, theme } = JSON.parse(manualTheme);
        const today = new Date().toDateString();
        
        if (date === today) {
            // 수동 테마가 오늘 설정된 경우
            const targetTheme = themeKey === 'night' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', targetTheme);
            return;
        }
    }
    
    // 시간 기반 테마 적용
    const hour = new Date().getHours();
    const isDark = hour >= 20 || hour < 5;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
})();