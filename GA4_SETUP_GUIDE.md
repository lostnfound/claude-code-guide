# GA4 Data API 설정 가이드

이 가이드는 Google Sheets에서 GA4 데이터를 자동으로 수집하기 위한 설정 방법을 설명합니다.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성 또는 선택
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 1.2 Google Analytics Data API 활성화
1. 왼쪽 메뉴에서 "API 및 서비스" → "라이브러리" 클릭
2. "Google Analytics Data API" 검색
3. 클릭 후 "사용" 버튼 클릭

### 1.3 서비스 계정 생성
1. "API 및 서비스" → "사용자 인증 정보" 클릭
2. "사용자 인증 정보 만들기" → "서비스 계정" 선택
3. 서비스 계정 이름 입력 (예: "ga4-sheets-integration")
4. "만들기 및 계속" 클릭
5. 역할은 "뷰어"로 설정
6. "완료" 클릭

### 1.4 서비스 계정 키 생성
1. 생성된 서비스 계정 클릭
2. "키" 탭으로 이동
3. "키 추가" → "새 키 만들기" → "JSON" 선택
4. JSON 파일 다운로드 (안전하게 보관)

## 2. Google Analytics 4 설정

### 2.1 GA4 속성 ID 확인
1. [Google Analytics](https://analytics.google.com/)에 접속
2. 속성 선택
3. 설정(톱니바퀴) → "속성 설정"
4. "속성 ID" 복사 (예: 123456789)

### 2.2 서비스 계정에 권한 부여
1. GA4에서 설정 → "속성 액세스 관리"
2. "+" 버튼 클릭 → "사용자 추가"
3. 서비스 계정 이메일 입력 (예: ga4-sheets@project-id.iam.gserviceaccount.com)
4. 역할: "뷰어" 선택
5. "추가" 클릭

## 3. Google Apps Script 설정

### 3.1 서비스 계정 키 추가
1. Google Apps Script 편집기 열기
2. 프로젝트 설정(톱니바퀴) 클릭
3. "스크립트 속성" 섹션에서 "스크립트 속성 추가"
4. 다음 속성들 추가:
   - 이름: `GA4_PRIVATE_KEY` / 값: JSON 파일의 private_key 값 (따옴표 제외)
   - 이름: `GA4_CLIENT_EMAIL` / 값: JSON 파일의 client_email 값

### 3.2 OAuth2 라이브러리 추가
1. Apps Script 편집기에서 "라이브러리" 클릭
2. 스크립트 ID 입력: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`
3. "조회" 클릭
4. 버전 선택 (최신 버전)
5. "추가" 클릭

### 3.3 Google Sheets Settings 시트 업데이트
Settings 시트에서 다음 값들 입력:
- GA4 속성 ID: 위에서 복사한 속성 ID

## 4. 자동 수집 트리거 설정

### 4.1 Apps Script에서 트리거 추가
1. Apps Script 편집기에서 시계 아이콘 클릭 (트리거)
2. "트리거 추가" 클릭
3. 설정:
   - 실행할 함수: `updateGA4Data`
   - 이벤트 소스: 시간 기반
   - 시간 기반 트리거 유형: 일 타이머
   - 시간 선택: 오전 2-3시 (트래픽이 적은 시간)
4. "저장" 클릭

## 5. 테스트

### 5.1 수동 실행 테스트
1. Apps Script 편집기에서 `updateGA4Data` 함수 선택
2. "실행" 버튼 클릭
3. 첫 실행 시 권한 승인 필요
4. GA4_Data 시트에 데이터가 입력되는지 확인

### 5.2 오류 확인
실행 로그에서 오류 메시지 확인:
- "API not enabled": GA4 Data API 활성화 확인
- "Permission denied": 서비스 계정 권한 확인
- "Invalid property ID": 속성 ID 확인

## 수집되는 데이터

GA4_Data 시트에 다음 데이터가 자동으로 수집됩니다:
- 날짜별 사용자 수
- 신규 사용자 수
- 세션 수
- 페이지뷰
- 평균 세션 시간
- 이탈률
- 이벤트 통계

## 주의사항

1. **API 할당량**: 무료 할당량은 일일 25,000개 요청
2. **데이터 지연**: GA4 데이터는 최대 24-48시간 지연될 수 있음
3. **보안**: 서비스 계정 키는 절대 공개하지 말 것
4. **권한**: 최소 권한 원칙 적용 (뷰어 권한만 부여)

## 문제 해결

### API 오류
- Google Cloud Console에서 API 활성화 상태 확인
- 할당량 초과 여부 확인

### 권한 오류
- 서비스 계정 이메일이 GA4에 추가되었는지 확인
- 올바른 권한(뷰어)이 부여되었는지 확인

### 데이터 없음
- GA4 속성 ID가 올바른지 확인
- 최근 48시간 내 트래픽이 있었는지 확인