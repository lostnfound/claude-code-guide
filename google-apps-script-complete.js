/**
 * Claude Code Guide Analytics
 * 통합 분석 시스템 - 메인 파일
 */

// ===== 전역 설정 =====
function getConfig() {
  const settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
  const settings = {};

  if (settingsSheet) {
    const data = settingsSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        settings[data[i][0]] = data[i][1];
      }
    }
  }

  return {
    GA4_PROPERTY_ID: settings['GA4 속성 ID'] || '',
    MEASUREMENT_ID: settings['측정 ID'] || '',
    ALERT_EMAIL: settings['알림 이메일'] || '',
    ERROR_THRESHOLD: parseInt(settings['오류 임계값']) || 10,
    COMPLETION_THRESHOLD: parseInt(settings['완료율 임계값']) || 30,
    COUNTAPI_NS: settings['CountAPI NS'] || 'claude-code-guide',
    COUNTAPI_KEY: settings['CountAPI Key'] || 'users'
  };
}

function doPost(e) {
  try {
    // 디버깅 로그 추가
    console.log('doPost 호출됨');
    console.log('e:', JSON.stringify(e));
    console.log('e.postData:', e.postData);
    console.log('e.parameter:', e.parameter);
    
    // postData가 없거나 contents가 없는 경우 처리
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      // URL 파라미터로 온 경우 - customData 처리 필요
      data = e.parameter;
      
      // customData가 문자열로 온 경우 파싱
      if (data.customData && typeof data.customData === 'string') {
        try {
          data.customData = JSON.parse(data.customData);
        } catch (err) {
          console.log('customData 파싱 실패:', err);
        }
      }
      
      // 디버깅 로그
      console.log('Parameter로 받은 data:', JSON.stringify(data));
    } else {
      console.error('요청 데이터가 없습니다');
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'error',
          message: 'No data received'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 프로덕션 URL 체크
    if (data.pageUrl && !data.pageUrl.includes('claude-code-guide-sooty.vercel.app')) {
      console.log('Non-production URL - skipping:', data.pageUrl);
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Non-production URL - not recorded'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timestamp = new Date();

    // 이벤트 타입에 따라 다른 시트에 저장
    switch(data.eventType) {
      case 'feedback_submitted':
        saveFeedbackEvent(ss, data, timestamp);
        break;

      case 'error_occurred':
        saveErrorEvent(ss, data, timestamp);
        break;

      case 'feedback_emoji_selected':
        // 이모지 선택은 로그만 남기고 별도 저장하지 않음 (최종 제출시만 저장)
        console.log('Emoji selected:', data.customData?.emoji);
        break;

      default:
        saveGeneralEvent(ss, data, timestamp);
        break;
    }

    // 중요 이벤트 처리
    processImportantEvent(data);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Event recorded successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    logError('doPost', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveFeedbackEvent(ss, data, timestamp) {
  // ss가 undefined인지 확인
  if (!ss) {
    console.error('스프레드시트 객체가 없습니다');
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  const sheet = ss.getSheetByName('Feedback_Events');
  if (!sheet) {
    console.error('Feedback_Events sheet not found');
    // 시트가 없으면 생성
    createFeedbackEventsSheet(ss);
    return saveFeedbackEvent(ss, data, timestamp);
  }

  // customData 또는 직접 데이터에서 가져오기
  const customData = data.customData || {};
  
  // 디버깅용 로그
  console.log('전체 data:', JSON.stringify(data));
  console.log('customData:', JSON.stringify(customData));
  console.log('feedbackText 위치:', {
    'data.feedbackText': data.feedbackText,
    'customData.feedbackText': customData.feedbackText,
    'data.customData.feedbackText': data.customData?.feedbackText
  });

  const row = [
    timestamp,
    data.userId || '',
    data.sessionId || '',
    customData.emoji || data.emoji || '',
    customData.feedbackText || data.feedbackText || '',  // 두 위치 모두 체크
    customData.completionTime || '',
    customData.completedSteps || 0,
    customData.lastStep || '',
    customData.darkMode || '',
    customData.firstVisit || '',
    customData.errorSteps || '',
    customData.errorResolved || '',
    customData.screenResolution || '',
    data.os || '',
    data.browser || ''
  ];

  sheet.appendRow(row);
  console.log('저장된 row:', row);
}

// ===== 누락된 saveErrorEvent 함수 추가 =====
function saveErrorEvent(ss, data, timestamp) {
  // ss가 undefined인지 확인
  if (!ss) {
    console.error('스프레드시트 객체가 없습니다');
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  let sheet = ss.getSheetByName('Error_Events');
  if (!sheet) {
    console.error('Error_Events sheet not found - creating new sheet');
    // 시트가 없으면 생성
    sheet = createErrorEventsSheet(ss);
  }

  const customData = data.customData || {};

  // 디버깅용 로그
  console.log('Error event data:', JSON.stringify(data));
  console.log('Error customData:', JSON.stringify(customData));

  const row = [
    timestamp,
    data.userId || '',
    data.sessionId || '',
    data.pageUrl || '',
    customData.stepNumber || data.stepNumber || '',
    customData.stepName || data.stepName || '',
    customData.errorType || data.errorType || 'unknown',
    customData.errorMessage || data.errorMessage || '',
    customData.errorDetails || data.errorDetails || JSON.stringify(customData),
    data.os || '',
    data.browser || ''
  ];

  sheet.appendRow(row);
  console.log('Error event saved successfully');
}

function saveGeneralEvent(ss, data, timestamp) {
  const sheet = ss.getSheetByName('Raw_Events');

  // 기본 이벤트 정보만 저장 (간소화)
  const row = [
    timestamp,
    data.eventType || '',
    data.userId || '',
    data.sessionId || '',
    data.pageUrl || '',
    data.pageTitle || '',
    data.os || '',
    data.browser || '',
    data.device || '',
    data.referrer || '',
    data.duration || '',
    JSON.stringify(data.customData || {})
  ];

  sheet.appendRow(row);
}

// 시트 자동 생성 함수들
function createFeedbackEventsSheet(ss) {
  const sheet = ss.insertSheet('Feedback_Events');
  const headers = [
    'Timestamp', 'User_ID', 'Session_ID', 'Emoji', 'Feedback_Text',
    'Completion_Time', 'Completed_Steps_Count', 'Last_Step', 'Dark_Mode',
    'First_Visit', 'Error_Steps', 'Error_Resolved', 'Screen_Resolution',
    'OS', 'Browser'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  return sheet;
}

function createErrorEventsSheet(ss) {
  const sheet = ss.insertSheet('Error_Events');
  const headers = [
    'Timestamp', 'User_ID', 'Session_ID', 'Page_URL', 'Step_Number',
    'Step_Name', 'Error_Type', 'Error_Message', 'Error_Details',
    'OS', 'Browser'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  return sheet;
}

// GET 엔드포인트에 카운터 정보 추가
function doGet(e) {
  try {
    // feedback_submitted 이벤트를 GET으로 받는 경우
    if (e.parameter.eventType === 'feedback_submitted') {
      console.log('GET으로 feedback_submitted 받음');
      return doPost(e); // doPost로 전달
    }
    
    // ⭐ 카운터 증가 액션 추가 (이 부분이 새로 추가됨)
    if (e.parameter.action === 'incrementCounter') {
      const metricType = e.parameter.metric || 'users';
      const newValue = incrementCounter(metricType);

      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          value: newValue,
          metric: metricType
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 경로 파라미터 확인 (기존 코드)
    if (e.parameter.action === 'getCounter') {
      const metricType = e.parameter.metric || 'users';
      const value = getCounterValue(metricType);

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          value: value,
          metric: metricType
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 통계 반환 (이제 여러 시트에서 수집)
    const stats = getComprehensiveStats();
    return ContentService
      .createTextOutput(JSON.stringify(stats))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    logError('doGet', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 종합 통계 수집
function getComprehensiveStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 각 시트에서 통계 수집
  const generalStats = getGeneralStats(ss.getSheetByName('Raw_Events'));
  const feedbackStats = getFeedbackStats(ss.getSheetByName('Feedback_Events'));
  const errorStats = getErrorStats(ss.getSheetByName('Error_Events'));

  // 기존 getDashboardStats와 호환성 유지
  const dashboardStats = getDashboardStats();

  return {
    ...dashboardStats,
    feedback: feedbackStats,
    errors: errorStats,
    timestamp: new Date().toISOString()
  };
}

function getGeneralStats(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return { total: 0 };

  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);

  return {
    total: rows.length,
    users: new Set(rows.map(r => r[2])).size,
    pageViews: rows.filter(r => r[1] === 'page_view').length,
    guideStarts: rows.filter(r => r[1] === 'guide_started').length
  };
}

function getFeedbackStats(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return { total: 0 };

  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);

  const emojiCounts = {
    love: rows.filter(r => r[3] === 'love').length,
    good: rows.filter(r => r[3] === 'good').length,
    neutral: rows.filter(r => r[3] === 'neutral').length
  };

  // 평균 완료 시간 계산
  const completionTimes = rows
    .map(r => r[5])
    .filter(t => t && t.includes('분'))
    .map(t => parseInt(t.replace('분', '')))
    .filter(t => !isNaN(t));

  const avgCompletionTime = completionTimes.length > 0
    ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
    : 0;

  return {
    total: rows.length,
    emojiCounts: emojiCounts,
    avgCompletionTime: avgCompletionTime,
    withFeedbackText: rows.filter(r => r[4] && r[4].length > 0).length
  };
}

function getErrorStats(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return { total: 0 };

  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);

  // 단계별 에러 카운트
  const stepErrors = {};
  rows.forEach(r => {
    const stepName = r[5] || 'unknown';
    stepErrors[stepName] = (stepErrors[stepName] || 0) + 1;
  });

  return {
    total: rows.length,
    byStep: stepErrors,
    last24h: rows.filter(r => {
      const errorTime = new Date(r[0]);
      const now = new Date();
      return (now - errorTime) < (24 * 60 * 60 * 1000);
    }).length
  };
}

// processImportantEvent 함수 수정
function processImportantEvent(data) {
  const config = getConfig();

  // 가이드 완료 이벤트
  if (data.eventType === 'guide_completed') {
    updateCompletionStats();
    // 자체 카운터 증가
    incrementCounter('completions');
  }

  // 오류 발생 이벤트
  if (data.eventType === 'error_occurred') {
    checkErrorRate();
  }

  // 가이드 시작 이벤트
  if (data.eventType === 'guide_started') {
    incrementCounter('starts');
  }

  // 새 사용자 이벤트
  if (data.eventType === 'page_view' && data.customData && data.customData.firstVisit) {
    incrementCounter('users');
  }
}

// ===== 통계 계산 =====
function getDashboardStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw_Events');
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { status: 'no_data' };
  }

  const rows = data.slice(1);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const stats = {
    total: {
      events: rows.length,
      users: new Set(rows.map(r => r[2])).size,
      guideStarts: rows.filter(r => r[1] === 'guide_started').length,
      guideCompleted: rows.filter(r => r[1] === 'guide_completed').length,
      errors: rows.filter(r => r[1] === 'error_occurred').length
    },
    today: {
      events: rows.filter(r => new Date(r[0]) >= today).length,
      users: new Set(rows.filter(r => new Date(r[0]) >= today).map(r => r[2])).size
    }
  };

  stats.completionRate = stats.total.guideStarts > 0
    ? (stats.total.guideCompleted / stats.total.guideStarts * 100).toFixed(1)
    : 0;

  return stats;
}

// ===== 오류율 체크 =====
function checkErrorRate() {
  const config = getConfig();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Error_Events');

  if (!sheet) {
    // Error_Events 시트가 없으면 Raw_Events에서 체크 (호환성)
    checkErrorRateFromRawEvents();
    return;
  }

  const data = sheet.getDataRange().getValues();

  // 최근 1시간 데이터
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const recentErrors = data.filter(row =>
    new Date(row[0]) > oneHourAgo
  );

  if (recentErrors.length > config.ERROR_THRESHOLD) {
    sendAlert(
      '⚠️ 높은 오류율 감지',
      `최근 1시간 동안 ${recentErrors.length}건의 오류가 발생했습니다.\n` +
      `임계값: ${config.ERROR_THRESHOLD}건`
    );
  }
}

// 호환성을 위한 기존 방식의 에러 체크
function checkErrorRateFromRawEvents() {
  const config = getConfig();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw_Events');
  const data = sheet.getDataRange().getValues();

  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const recentErrors = data.filter(row =>
    new Date(row[0]) > oneHourAgo && row[1] === 'error_occurred'
  );

  if (recentErrors.length > config.ERROR_THRESHOLD) {
    sendAlert(
      '⚠️ 높은 오류율 감지',
      `최근 1시간 동안 ${recentErrors.length}건의 오류가 발생했습니다.\n` +
      `임계값: ${config.ERROR_THRESHOLD}건`
    );
  }
}

// ===== 완료율 업데이트 =====
function updateCompletionStats() {
  // Dashboard 시트 업데이트 트리거
  updateDashboard();
}

// ===== 알림 전송 =====
function sendAlert(subject, message) {
  const config = getConfig();
  if (!config.ALERT_EMAIL) return;

  try {
    MailApp.sendEmail({
      to: config.ALERT_EMAIL,
      subject: `[Claude Code Guide] ${subject}`,
      body: message + '\n\n' +
            '대시보드: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    });
  } catch (error) {
    logError('sendAlert', error);
  }
}

// ===== 오류 로깅 =====
function logError(functionName, error) {
  const errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Error_Log');
  if (!errorSheet) return;

  errorSheet.appendRow([
    new Date(),
    functionName,
    error.toString(),
    error.stack || ''
  ]);
}

// ===== 메뉴 추가 =====
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Analytics')
    .addItem('🔄 대시보드 업데이트', 'updateDashboard')
    .addItem('📈 수동 이벤트 전송', 'testEventLogging')
    .addItem('🔄 카운터 데이터 수집', 'manualCountAPIFetch')
    .addSeparator()
    .addItem('⏰ 카운터 자동 수집 시작', 'setupCounterTrigger')
    .addItem('🛑 카운터 자동 수집 중지', 'stopCounterTrigger')
    .addSeparator()
    .addItem('🔗 GA4 연결 테스트', 'testGA4Connection')
    .addItem('📊 GA4 데이터 가져오기', 'fetchGA4Data')
    .addItem('⏰ GA4 자동 수집 시작', 'setupGA4Trigger')
    .addSeparator()
    .addItem('📧 알림 테스트', 'testAlert')
    .addItem('🔧 설정 확인', 'showCurrentConfig')
    .addSeparator()
    .addItem('⚙️ 트리거 설정', 'setupTriggers')
    .addItem('ℹ️ 도움말', 'showHelp')
    .addToUi();
}

// ===== 도움말 =====
function showHelp() {
  const helpText = `
Claude Code Guide Analytics 사용법:

1. 웹 앱 배포 (Step 3에서 진행)
2. 카운터 설정 (Step 4에서 진행)
3. GA4 연동 (Step 5에서 진행)
4. 웹사이트 코드 연동 (Step 6에서 진행)

현재 설정:
- GA4 속성 ID: ${getConfig().GA4_PROPERTY_ID}
- 알림 이메일: ${getConfig().ALERT_EMAIL}
`;

  SpreadsheetApp.getUi().alert('도움말', helpText, SpreadsheetApp.getUi().ButtonSet.OK);
}

// ===== 테스트 함수 =====
function testEventLogging() {
  const testData = {
    eventType: 'test_event',
    userId: 'test_user_001',
    sessionId: 'test_session_001',
    pageUrl: 'https://test.com',
    pageTitle: 'Test Page',
    customData: { test: true }
  };

  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  const result = doPost(e);
  SpreadsheetApp.getActiveSpreadsheet().toast('테스트 이벤트가 기록되었습니다!', '성공', 3);
}

function testAlert() {
  sendAlert('테스트 알림', '이것은 테스트 알림입니다.\n알림이 정상적으로 작동하고 있습니다.');
  SpreadsheetApp.getActiveSpreadsheet().toast('테스트 알림이 전송되었습니다!', '성공', 3);
}

function testWebAppDeployment() {
  const webAppUrl = 
'https://script.google.com/macros/s/AKfycbw9IG4a8jKUPG9s_ouhY6yk8xn3UUP-sDri8wDm9_WGct4cbGsWp6P1X45Ei5DUf-Q5/exec'; //


  const payload = {
    eventType: 'deployment_test',
    userId: 'test_user_deployment',
    sessionId: 'test_session_deployment',
    pageUrl: 'https://deployment-test.com'
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  try {
    const response = UrlFetchApp.fetch(webAppUrl, options);
    console.log('Response:', response.getContentText());
    SpreadsheetApp.getActiveSpreadsheet().toast('웹 앱 테스트 성공!', '성공', 3);
  } catch (error) {
    console.error('Error:', error);
    SpreadsheetApp.getActiveSpreadsheet().toast('웹 앱 테스트 실패: ' + error, '오류', 5);
  }
}

// 현재 설정 확인
function showCurrentConfig() {
  const config = getConfig();
  const configText = `
현재 설정값:

GA4 속성 ID: ${config.GA4_PROPERTY_ID}
측정 ID: ${config.MEASUREMENT_ID}
알림 이메일: ${config.ALERT_EMAIL}
오류 임계값: ${config.ERROR_THRESHOLD}
완료율 임계값: ${config.COMPLETION_THRESHOLD}%
CountAPI Namespace: ${config.COUNTAPI_NS}
CountAPI Key: ${config.COUNTAPI_KEY}
`;

  SpreadsheetApp.getUi().alert('현재 설정', configText, SpreadsheetApp.getUi().ButtonSet.OK);
}

// updateDashboard 함수 (임시)
function updateDashboard() {
  SpreadsheetApp.getActiveSpreadsheet().toast('대시보드 업데이트 기능은 Dashboard.gs에서 구현됩니다', '정보', 3);
}

// setupTriggers 함수 수정
function setupTriggers() {
  setupCounterTrigger();  // 카운터 자동 수집 (1시간마다)
  setupGA4Trigger();      // GA4 데이터 수집 (하루 2번)

  SpreadsheetApp.getActiveSpreadsheet().toast('모든 자동화 트리거가 설정되었습니다', '완료', 3);
}

// ===== 자체 카운터 시스템 =====

// 카운터 데이터 초기화
function initializeCounters() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CountAPI_Data');

  // 초기 데이터 확인
  if (sheet.getLastRow() <= 1) {
    // 초기값 설정
    const initialData = [
      [new Date(), 30, 0, 0, 0, 0, 'users'],      // 현재 사이트에 하드코딩된 값
      [new Date(), 0, 0, 0, 0, 0, 'starts'],
      [new Date(), 0, 0, 0, 0, 0, 'completions']
    ];

    initialData.forEach(row => {
      sheet.appendRow(row);
    });

    SpreadsheetApp.getActiveSpreadsheet().toast('카운터 초기화 완료', '성공', 3);
  }
}

// 카운터 값 가져오기
function getCounterValue(metricType) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CountAPI_Data');
  const data = sheet.getDataRange().getValues();

  // 해당 메트릭의 최신 값 찾기
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][6] === metricType) {
      return data[i][1]; // Total 값 반환
    }
  }

  return 0;
}

// 카운터 증가 (웹 앱에서 호출)
function incrementCounter(metricType) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CountAPI_Data');
  const currentValue = getCounterValue(metricType);
  const newValue = currentValue + 1;

  const row = [
    new Date(),
    newValue,
    1, // Daily_Change (증가분)
    0, // Weekly_Change (나중에 계산)
    0, // Monthly_Change (나중에 계산)
    0, // Growth_Rate (나중에 계산)
    metricType
  ];

  sheet.appendRow(row);

  // 주간/월간 변화량 계산
  calculatePeriodChanges();

  return newValue;
}

// 카운터 데이터 업데이트 (자체 통계 업데이트용)
function saveCountAPIData() {
  try {
    // 먼저 초기화 확인
    initializeCounters();

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CountAPI_Data');

    // Raw_Events에서 통계 계산
    const rawSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw_Events');
    const rawData = rawSheet.getDataRange().getValues();

    if (rawData.length > 1) {
      const rows = rawData.slice(1);

      // 각 메트릭별 카운트
      const stats = {
        users: new Set(rows.map(r => r[2])).size,
        starts: rows.filter(r => r[1] === 'guide_started').length,
        completions: rows.filter(r => r[1] === 'guide_completed').length
      };

      // 각 메트릭 업데이트
      Object.entries(stats).forEach(([metricType, newValue]) => {
        const currentValue = getCounterValue(metricType);

        if (newValue !== currentValue) {
          const row = [
            new Date(),
            newValue,
            newValue - currentValue, // Daily_Change
            0, // Weekly_Change
            0, // Monthly_Change
            0, // Growth_Rate
            metricType
          ];

          sheet.appendRow(row);
        }
      });

      // 주간/월간 변화량 계산
      calculatePeriodChanges();
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('카운터 데이터를 업데이트했습니다', '완료', 3);

  } catch (error) {
    console.error('Error in saveCountAPIData:', error);
    logError('COUNTER_UPDATE', error);
  }
}

// 수동 카운터 업데이트
function manualCountAPIFetch() {
  saveCountAPIData();
}

// 주간/월간 변화량 계산
function calculatePeriodChanges() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CountAPI_Data');
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 각 메트릭별로 처리
  const metrics = ['users', 'starts', 'completions'];
  metrics.forEach(metric => {
    const metricData = data.filter(row => row[6] === metric);
    if (metricData.length < 2) return;

    const latestRow = metricData[metricData.length - 1];
    const latestValue = latestRow[1];
    const latestRowIndex = data.indexOf(latestRow) + 1;

    // 주간 변화량
    const weekData = metricData.filter(row => new Date(row[0]) >= weekAgo);
    if (weekData.length > 0) {
      const weekStartValue = weekData[0][1];
      const weeklyChange = latestValue - weekStartValue;
      sheet.getRange(latestRowIndex, 4).setValue(weeklyChange);
    }

    // 월간 변화량
    const monthData = metricData.filter(row => new Date(row[0]) >= monthAgo);
    if (monthData.length > 0) {
      const monthStartValue = monthData[0][1];
      const monthlyChange = latestValue - monthStartValue;
      sheet.getRange(latestRowIndex, 5).setValue(monthlyChange);

      // 성장률 계산
      if (monthStartValue > 0) {
        const growthRate = ((latestValue - monthStartValue) / monthStartValue) * 100;
        sheet.getRange(latestRowIndex, 6).setValue(growthRate.toFixed(2));
      }
    }
  });
}

// 시간별 트리거 설정 (1시간마다 실행)
function setupCounterTrigger() {
  // 기존 트리거 제거
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'saveCountAPIData') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 새 트리거 생성
  ScriptApp.newTrigger('saveCountAPIData')
    .timeBased()
    .everyHours(1)
    .create();

  SpreadsheetApp.getActiveSpreadsheet().toast('카운터 자동 수집이 설정되었습니다 (1시간마다)', '완료', 3);
}

// 카운터 트리거 중지 함수
function stopCounterTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = false;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'saveCountAPIData') {
      ScriptApp.deleteTrigger(trigger);
      removed = true;
    }
  });

  if (removed) {
    SpreadsheetApp.getActiveSpreadsheet().toast('카운터 자동 수집이 중지되었습니다', '완료', 3);
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast('실행 중인 트리거가 없습니다', '정보', 3);
  }
}

// ===== GA4 Data API 연동 =====

// GA4 데이터 가져오기
function fetchGA4Data() {
  try {
    const config = getConfig();
    const propertyId = config.GA4_PROPERTY_ID;

    if (!propertyId) {
      throw new Error('GA4 속성 ID가 설정되지 않았습니다');
    }

    // 오늘 날짜
    const today = new Date();
    const startDate = Utilities.formatDate(today, 'GMT', 'yyyy-MM-dd');
    const endDate = startDate;

    // GA4 보고서 요청 생성
    const request = {
      property: propertyId,
      dateRanges: [{
        startDate: startDate,
        endDate: endDate
      }],
      dimensions: [
        { name: 'date' },
        { name: 'sessionSource' },
        { name: 'country' }
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ]
    };

    // API 호출
    const response = AnalyticsData.Properties.runReport(request, propertyId);

    // 데이터 처리 및 저장
    saveGA4DataToSheet(response);

    // 이벤트 데이터도 가져오기
    fetchGA4Events();

    SpreadsheetApp.getActiveSpreadsheet().toast('GA4 데이터를 가져왔습니다', '완료', 3);

  } catch (error) {
    console.error('GA4 데이터 가져오기 오류:', error);
    logError('fetchGA4Data', error);
    SpreadsheetApp.getActiveSpreadsheet().toast('GA4 데이터 가져오기 실패: ' + error.toString(), '오류', 5);
  }
}

// GA4 이벤트 데이터 가져오기
function fetchGA4Events() {
  try {
    const config = getConfig();
    const propertyId = config.GA4_PROPERTY_ID;

    const today = new Date();
    const startDate = Utilities.formatDate(today, 'GMT', 'yyyy-MM-dd');
    const endDate = startDate;

    const request = {
      property: propertyId,
      dateRanges: [{
        startDate: startDate,
        endDate: endDate
      }],
      dimensions: [
        { name: 'eventName' },
        { name: 'customEvent:guide_step' }
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'eventCountPerUser' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: ['guide_started', 'guide_completed', 'step_completed', 'error_occurred']
          }
        }
      }
    };

    const response = AnalyticsData.Properties.runReport(request, propertyId);

    // 이벤트 데이터 처리
    processGA4EventData(response);

  } catch (error) {
    console.error('GA4 이벤트 데이터 가져오기 오류:', error);
    logError('fetchGA4Events', error);
  }
}

// GA4 데이터를 시트에 저장
function saveGA4DataToSheet(response) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GA4_Data');
  const timestamp = new Date();

  if (!response.rows || response.rows.length === 0) {
    console.log('GA4 데이터가 없습니다');
    return;
  }

  // 데이터 집계
  let totalUsers = 0;
  let totalNewUsers = 0;
  let totalSessions = 0;
  let totalPageViews = 0;
  let totalDuration = 0;
  let totalBounceRate = 0;
  let rowCount = 0;

  response.rows.forEach(row => {
    const metrics = row.metricValues;
    totalUsers += parseInt(metrics[0].value) || 0;
    totalNewUsers += parseInt(metrics[1].value) || 0;
    totalSessions += parseInt(metrics[2].value) || 0;
    totalPageViews += parseInt(metrics[3].value) || 0;
    totalDuration += parseFloat(metrics[4].value) || 0;
    totalBounceRate += parseFloat(metrics[5].value) || 0;
    rowCount++;
  });

  // 평균 계산
  const avgDuration = rowCount > 0 ? totalDuration / rowCount : 0;
  const avgBounceRate = rowCount > 0 ? totalBounceRate / rowCount : 0;

  // 시트에 데이터 추가
  const newRow = [
    timestamp,
    totalUsers,
    totalNewUsers,
    totalSessions,
    totalPageViews,
    avgDuration.toFixed(2),
    avgBounceRate.toFixed(2) + '%',
    '', // Events
    '', // Conversions
    ''  // Custom_Data
  ];

  sheet.appendRow(newRow);
}

// GA4 이벤트 데이터 처리
function processGA4EventData(response) {
  if (!response.rows || response.rows.length === 0) {
    console.log('GA4 이벤트 데이터가 없습니다');
    return;
  }

  const eventSummary = {};

  response.rows.forEach(row => {
    const eventName = row.dimensionValues[0].value;
    const eventCount = parseInt(row.metricValues[0].value) || 0;

    if (!eventSummary[eventName]) {
      eventSummary[eventName] = 0;
    }
    eventSummary[eventName] += eventCount;
  });

  // GA4_Data 시트의 마지막 행에 이벤트 데이터 업데이트
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GA4_Data');
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const eventsJson = JSON.stringify(eventSummary);
    sheet.getRange(lastRow, 8).setValue(eventsJson); // Events 열에 저장
  }
}

// GA4 실시간 데이터 가져오기
function fetchGA4RealtimeData() {
  try {
    const config = getConfig();
    const propertyId = config.GA4_PROPERTY_ID;

    if (!propertyId) {
      throw new Error('GA4 속성 ID가 설정되지 않았습니다');
    }

    const request = {
      property: propertyId,
      dimensions: [
        { name: 'country' },
        { name: 'city' }
      ],
      metrics: [
        { name: 'activeUsers' }
      ]
    };

    const response = AnalyticsData.Properties.runRealtimeReport(request, propertyId);

    // 실시간 사용자 수 계산
    let totalActiveUsers = 0;
    if (response.rows) {
      response.rows.forEach(row => {
        totalActiveUsers += parseInt(row.metricValues[0].value) || 0;
      });
    }

    console.log('실시간 활성 사용자:', totalActiveUsers);
    return totalActiveUsers;

  } catch (error) {
    console.error('GA4 실시간 데이터 가져오기 오류:', error);
    return 0;
  }
}

// GA4 자동 수집 트리거 설정 (하루 2번)
function setupGA4Trigger() {
  // 기존 트리거 제거
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'fetchGA4Data') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 오전 9시 트리거
  ScriptApp.newTrigger('fetchGA4Data')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();

  // 오후 6시 트리거
  ScriptApp.newTrigger('fetchGA4Data')
    .timeBased()
    .atHour(18)
    .everyDays(1)
    .create();

  SpreadsheetApp.getActiveSpreadsheet().toast('GA4 자동 수집이 설정되었습니다 (하루 2번: 오전 9시, 오후 6시)', '완료', 3);
}

// GA4 연동 테스트
function testGA4Connection() {
  try {
    const config = getConfig();
    const propertyId = config.GA4_PROPERTY_ID;

    if (!propertyId) {
      SpreadsheetApp.getActiveSpreadsheet().toast('GA4 속성 ID를 먼저 설정해주세요', '오류', 5);
      return;
    }

    // 간단한 테스트 요청
    const request = {
      property: propertyId,
      dateRanges: [{
        startDate: '7daysAgo',
        endDate: 'today'
      }],
      metrics: [{ name: 'activeUsers' }]
    };

    const response = AnalyticsData.Properties.runReport(request, propertyId);

    if (response) {
      SpreadsheetApp.getActiveSpreadsheet().toast('GA4 연결 성공!', '성공', 3);
      console.log('GA4 연결 테스트 성공:', response);
    }

  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast('GA4 연결 실패: ' + error.toString(), '오류', 5);
    console.error('GA4 연결 테스트 실패:', error);
  }
}

function testFeedbackEvent() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  console.log('스프레드시트 이름:', ss.getName());

  // Feedback_Events 시트 확인
  const feedbackSheet = ss.getSheetByName('Feedback_Events');
  if (!feedbackSheet) {
    console.log('Feedback_Events 시트를 찾을 수 없습니다!');
  } else {
    console.log('Feedback_Events 시트를 찾았습니다');
  }

  const testData = {
    eventType: 'feedback_submitted',
    userId: 'test_user_001',
    sessionId: 'test_session_001',
    pageUrl: 'https://claude-code-guide-sooty.vercel.app/guide.html',
    os: 'MacOS',
    browser: 'Chrome',
    customData: {
      emoji: 'love',
      feedbackText: '테스트 피드백입니다',
      completionTime: '10분',
      completedSteps: 6
    }
  };

  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  console.log('doPost 함수 호출 전');
  const result = doPost(e);
  console.log('doPost 결과:', result.getContent());

  SpreadsheetApp.getActiveSpreadsheet().toast('테스트 완료!', '성공', 3);
}

// 간단한 로그 확인 함수
function checkLastFeedback() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Feedback_Events');
  if (!sheet) {
    console.log('Feedback_Events 시트가 없습니다');
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    console.log('데이터가 없습니다');
    return;
  }
  
  const data = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  console.log('마지막 행 데이터:');
  console.log('Timestamp:', data[0]);
  console.log('User_ID:', data[1]);
  console.log('Session_ID:', data[2]);
  console.log('Emoji:', data[3]);
  console.log('Feedback_Text:', data[4]);
  console.log('Completion_Time:', data[5]);
}

// 최근 실행 로그 확인
function checkRecentLogs() {
  // Raw_Events 시트에서 최근 feedback_submitted 이벤트 확인
  const rawSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw_Events');
  if (!rawSheet) {
    console.log('Raw_Events 시트가 없습니다');
    return;
  }
  
  const data = rawSheet.getDataRange().getValues();
  const feedbackEvents = data.filter((row, index) => {
    return index > 0 && row[1] === 'feedback_submitted';
  });
  
  if (feedbackEvents.length > 0) {
    const lastEvent = feedbackEvents[feedbackEvents.length - 1];
    console.log('마지막 feedback_submitted 이벤트:');
    console.log('Timestamp:', lastEvent[0]);
    console.log('Event Type:', lastEvent[1]);
    console.log('Custom Data:', lastEvent[11]);
    
    try {
      const customData = JSON.parse(lastEvent[11] || '{}');
      console.log('Parsed Custom Data:', customData);
    } catch (e) {
      console.log('Custom Data 파싱 실패:', e);
    }
  } else {
    console.log('feedback_submitted 이벤트가 없습니다');
  }
}