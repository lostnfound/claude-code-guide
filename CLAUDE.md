# Claude Code Guide - 프로젝트 메모리

## 프로젝트 개요
Claude Code 설치 가이드 웹사이트 - "코딩 몰라도 OK, 터미널 무서워도 OK"를 슬로건으로 하는 초보자 친화적 가이드

**타겟 사용자**: 개발자가 아닌 일반인 (사업자, 블로거, 학생 등)
**목표**: AI 도구에 관심있는 사람들이 쉽게 Claude Code를 설치할 수 있도록 돕기

## 기술 스택
- **프론트엔드**: Vanilla HTML/CSS/JavaScript
- **빌드 도구**: Vite
- **배포**: Vercel (자동 배포)
- **분석**: Google Analytics 4 + 커스텀 Google Sheets 시스템
- **백엔드**: Google Apps Script (서버리스)

## 현재 URL 구조 (2025-07-17 개선)
- **메인**: `https://claude-code-guide-sooty.vercel.app/`
- **가이드**: `/guide.html` (이전: `/pages/guide.html`)
- **소개**: `/about.html` (이전: `/pages/about.html`)
- **FAQ**: `/faq.html` (이전: `/pages/faq.html`)

## 분석 시스템 구조

### Google Sheets Dashboard
**URL**: Claude Code Guide Analytics Dashboard (Google Sheets)

#### 시트 구성:
1. **Raw_Events**: 모든 사용자 이벤트 로그
2. **CountAPI_Data**: 사용자 카운터 통계 (users, starts, completions)
3. **GA4_Data**: Google Analytics 데이터
4. **Dashboard**: 시각화 대시보드
5. **Settings**: 설정값
6. **Error_Log**: 오류 로그

### Google Apps Script
**기능**:
- 사용자 카운터 관리 (`incrementCounter`, `getCounter`)
- GA4 Data API 연동
- 이벤트 데이터 수집 및 저장
- 자동 대시보드 업데이트

### 주요 이벤트 타입
- `page_view`: 페이지 방문
- `guide_started`: 가이드 시작
- `step_completed`: 단계 완료
- `guide_completed`: 가이드 완료
- `error_occurred`: 오류 발생

## 최근 주요 업데이트 (2025-07-17)

### 1. URL 구조 개선
- `/pages/` 폴더 제거, 루트 레벨로 이동
- 301 리다이렉트 설정으로 SEO 보존
- 모든 내부 링크 및 메타태그 업데이트

### 2. SEO 최적화
- **robots.txt 수정**: JavaScript/CSS 파일 허용
- Google Search Console 재등록
- 사이트맵 업데이트

### 3. 소셜미디어 공유 기능
- 축하 모달의 공유 버튼을 드롭다운 메뉴로 확장
- 지원 플랫폼: 링크 복사, 트위터, 페이스북, 링크드인
- 사용자 타겟에 맞는 플랫폼 선별 (일반인 중심)

### 4. 데이터 정확성 개선
- 프로덕션 환경만 추적 (`claude-code-guide-sooty.vercel.app`)
- 테스트/프리뷰 URL 필터링

## 브랜드 가이드
- **주 색상**: #CC785C (연어/테라코타 색상)
- **파비콘**: 로봇 모양 SVG
- **톤**: 친근하고 접근하기 쉬운 언어 사용
- **메시지**: "터미널이 처음이어도 걱정 없습니다"

## 개발 명령어
```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 배포 (GitHub push 시 자동)
git push origin main
```

## 중요 파일 위치
- **메인 스크립트**: `src/js/main.js`
- **가이드 매니저**: `src/js/modules/guide-manager.js`
- **분석 모듈**: `src/js/modules/analytics.js`
- **메인 스타일**: `src/css/`
- **Vercel 설정**: `vercel.json`

## 참고사항
- 방문자 카운터: 50명 미만일 때 특별 메시지, 50명 이상일 때 실제 숫자 표시
- 세션 기반 중복 방문 방지 (sessionStorage 사용)
- 모든 분석 데이터는 실시간으로 Google Sheets에 저장
- 사용자 개인정보 보호를 위한 익명화 처리

## 알려진 이슈
- Apps Script의 일일 호출 제한 (현재 문제없음)
- 브라우저별 sessionStorage 동작 차이 (해결됨)

## 다음 개선 계획
- Apps Script에 프로덕션 URL 필터링 추가 (pending)
- 사용자 피드백 시스템 개선
- 가이드 완료율 향상 방안

---
**최종 업데이트**: 2025-07-17
**개발자**: JONGJIN CHOI
**문의**: Claude Code를 통한 협업