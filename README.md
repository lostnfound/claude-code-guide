# Claude Code Guide 🤖

> 코딩 몰라도 OK, 터미널 무서워도 OK! AI와 함께하는 코딩의 첫걸음

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-CC785C?style=for-the-badge)](https://claude-code-guide-sooty.vercel.app/)

## 🎯 프로젝트 소개

Claude Code Guide는 프로그래밍 경험이 없는 일반인들도 쉽게 Claude Code(Anthropic의 공식 CLI)를 설치하고 사용할 수 있도록 돕는 인터랙티브 가이드 웹사이트입니다.

### 주요 특징

- 🚀 **단계별 가이드**: 복잡한 설치 과정을 친근한 대화형 인터페이스로 안내
- 💡 **실시간 도움말**: 각 단계마다 필요한 정보를 즉시 제공
- 🎨 **직관적인 UI**: 프로그래밍 지식 없이도 따라할 수 있는 시각적 가이드
- 📊 **진행 상황 추적**: 설치 진행률을 실시간으로 확인
- 🌙 **다크 모드 지원**: 눈의 피로를 줄이는 다크 테마
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원

## 🛠️ 기술 스택

### Frontend
- **HTML5/CSS3/JavaScript**: 순수 바닐라 JS로 구현
- **Vite**: 빠른 개발 환경과 최적화된 빌드
- **Vercel**: 자동 배포 및 호스팅

### Analytics & Backend
- **Google Analytics 4**: 사용자 행동 분석
- **Google Apps Script**: 서버리스 백엔드
- **Google Sheets**: 실시간 데이터 대시보드
- **Custom Analytics System**: 맞춤형 이벤트 추적 시스템

## 📂 프로젝트 구조

```
claude-code-guide/
├── src/
│   ├── js/
│   │   ├── main.js              # 메인 진입점
│   │   └── modules/
│   │       ├── guide-manager.js  # 가이드 로직 관리
│   │       ├── analytics.js      # 분석 모듈
│   │       ├── theme-toggle.js   # 다크모드 전환
│   │       └── logo-handler.js   # 로고 인터랙션
│   └── css/
│       ├── style.css            # 메인 스타일
│       ├── guide.css            # 가이드 페이지 스타일
│       └── components/          # 컴포넌트별 스타일
├── index.html                   # 메인 페이지
├── guide.html                   # 가이드 페이지
├── about.html                   # 소개 페이지
└── faq.html                     # FAQ 페이지
```

## 🚀 시작하기

### 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/yourusername/claude-code-guide.git
cd claude-code-guide

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_GA_MEASUREMENT_ID=your-ga4-measurement-id
VITE_APPS_SCRIPT_URL=your-apps-script-web-app-url
```

## 📊 분석 시스템

이 프로젝트는 사용자 행동을 추적하고 분석하는 커스텀 시스템을 포함합니다:

- **실시간 사용자 추적**: 방문자 수, 가이드 시작/완료율 모니터링
- **상세 이벤트 로깅**: 모든 사용자 인터랙션 기록 및 분석
- **오류 모니터링**: 실시간 오류 감지 및 개선
- **GA4 통합**: Google Analytics와 연동하여 종합적인 분석

이 분석 시스템을 통해 사용자 경험을 지속적으로 개선하고 있습니다.

## 💌 피드백

버그를 발견하셨거나 제안사항이 있으신가요?
- 이메일: me@jongjinchoi.com
- Issues: [GitHub Issues](https://github.com/jongjinchoi/claude-code-guide/issues)

## 👨‍💻 만든 이

**Jongjin Choi**
- Email: me@jongjinchoi.com
- GitHub: [@jongjinchoi](https://github.com/jongjinchoi)
- LinkedIn: [jongjinchoi](https://www.linkedin.com/in/jongjinchoi/)

## 🙏 감사의 말

- [Anthropic](https://www.anthropic.com/) - Claude Code 개발
- 모든 베타 테스터분들
- 피드백을 주신 모든 사용자분들

---

<p align="center">
  Made with ❤️ by Jongjin Choi
</p>

<p align="center">
  <a href="https://claude-code-guide-sooty.vercel.app/">
    <img src="https://img.shields.io/badge/🚀%20Try%20It%20Now-CC785C?style=for-the-badge" alt="Try It Now">
  </a>
</p>