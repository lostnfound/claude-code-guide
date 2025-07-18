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

// Google Sheets에 데이터를 저장하는 엔드포인트
function doPost(e) {
  try {
    // 요청 본문이 없는 경우 처리
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'No data received' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    const eventType = data.eventType;
    
    // 피드백 이벤트 특별 처리
    if (eventType === 'feedback_submitted') {
      // 피드백 데이터 직접 저장
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Feedback_Events');
      if (sheet) {
        sheet.appendRow([
          new Date(data.timestamp),
          data.userId,
          data.sessionId,
          data.emoji,
          data.feedbackText || '',
          data.email || ''
        ]);
      }
      
      // users 카운터 업데이트 (새로운 사용자만)
      updateUniqueUsers(data.userId);
      
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 일반 이벤트 처리
    saveEventData(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET 요청 처리
function doGet(e) {
  try {
    // processFeedback 파라미터가 있으면 피드백 처리
    if (e.parameter.processFeedback === 'true') {
      return processFeedback(e);
    }
    
    // 카운터 증가 액션
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

    // 카운터 조회
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
    
    // 일반 GET 요청 처리
    const eventType = e.parameter.eventType;
    
    if (!eventType) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'No event type specified' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // GET 파라미터를 데이터 객체로 변환
    const data = {
      eventType: eventType,
      userId: e.parameter.userId || '',
      sessionId: e.parameter.sessionId || '',
      timestamp: e.parameter.timestamp || new Date().toISOString(),
      pageUrl: e.parameter.pageUrl || '',
      pageTitle: e.parameter.pageTitle || '',
      os: e.parameter.os || '',
      browser: e.parameter.browser || '',
      device: e.parameter.device || '',
      referrer: e.parameter.referrer || '',
      duration: e.parameter.duration ? parseInt(e.parameter.duration) : null
    };
    
    // 이벤트별 추가 파라미터 처리
    if (eventType === 'scroll_depth') {
      data.percent = e.parameter.percent ? parseInt(e.parameter.percent) : 0;
      data.page = e.parameter.page || '';
    } else if (eventType === 'cta_click') {
      data.button_text = e.parameter.button_text || '';
      data.button_location = e.parameter.button_location || '';
    } else if (eventType === 'outbound_click') {
      data.link_url = e.parameter.link_url || '';
      data.link_text = e.parameter.link_text || '';
    }
    
    // 이벤트 데이터 저장
    saveEventData(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 피드백 처리 함수 (GET 요청용)
function processFeedback(e) {
  try {
    const emoji = e.parameter.emoji || '';
    const feedbackText = e.parameter.feedbackText || '';
    const userId = e.parameter.userId || '';
    const sessionId = e.parameter.sessionId || '';
    const email = e.parameter.email || '';
    
    // Feedback_Events 시트에 저장
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Feedback_Events');
    if (sheet) {
      sheet.appendRow([
        new Date(),
        userId,
        sessionId,
        emoji,
        feedbackText,
        email
      ]);
    }
    
    // users 카운터 업데이트 (새로운 사용자만)
    updateUniqueUsers(userId);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*'
      });
      
  } catch (error) {
    console.error('Error in processFeedback:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*'
      });
  }
}

// 이벤트 데이터 저장
function saveEventData(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw_Events');
  
  if (!sheet) {
    console.error('Raw_Events sheet not found');
    return;
  }
  
  // 기본 데이터
  const row = [
    new Date(data.timestamp),
    data.eventType,
    data.userId || '',
    data.sessionId || '',
    data.pageUrl || '',
    data.pageTitle || '',  // Page_Title 추가됨
    data.os || '',
    data.browser || '',
    data.device || '',     // Device 추가됨
    data.referrer || '',
    data.duration || ''    // Duration 추가됨
  ];
  
  // 이벤트별 추가 데이터
  if (data.eventType === 'scroll_depth') {
    row.push(data.percent || '');
    row.push(data.page || '');
  } else if (data.eventType === 'cta_click') {
    row.push(data.button_text || '');
    row.push(data.button_location || '');
  } else if (data.eventType === 'outbound_click') {
    row.push(data.link_url || '');
    row.push(data.link_text || '');
  } else if (data.eventType === 'step_completed') {
    row.push(data.stepNumber || '');
    row.push(data.stepTitle || '');
  } else if (data.eventType === 'guide_started' || data.eventType === 'guide_completed') {
    row.push(data.guideId || '');
    row.push(data.guideName || '');
  }
  
  sheet.appendRow(row);
  
  // 카운터 업데이트
  if (data.eventType === 'guide_started') {
    incrementCounter('starts');
    updateUniqueUsers(data.userId);
  } else if (data.eventType === 'guide_completed') {
    incrementCounter('completions');
  }
}

// 카운터 증가 함수
function incrementCounter(counterType) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CountAPI_Data');
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === counterType) {
      const currentValue = data[i][2] || 0;
      sheet.getRange(i + 1, 3).setValue(currentValue + 1);
      sheet.getRange(i + 1, 4).setValue(new Date());
      break;
    }
  }
}

// 고유 사용자 업데이트
function updateUniqueUsers(userId) {
  if (!userId) return;
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Unique_Users');
  if (!sheet) return;
  
  // 이미 존재하는 사용자인지 확인
  const existingUsers = sheet.getDataRange().getValues();
  for (let i = 1; i < existingUsers.length; i++) {
    if (existingUsers[i][0] === userId) {
      // 이미 존재하면 마지막 활동 시간만 업데이트
      sheet.getRange(i + 1, 3).setValue(new Date());
      return;
    }
  }
  
  // 새로운 사용자 추가
  sheet.appendRow([userId, new Date(), new Date()]);
  
  // users 카운터 증가
  incrementCounter('users');
}

// 주기적으로 실행될 트리거 함수
function updateCounters() {
  updateCountAPIData();
  updateGA4Data();
}

// CountAPI 데이터 업데이트
function updateCountAPIData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const countSheet = ss.getSheetByName('CountAPI_Data');
  const rawSheet = ss.getSheetByName('Raw_Events');
  const uniqueUsersSheet = ss.getSheetByName('Unique_Users');
  
  if (!countSheet || !rawSheet) return;
  
  const now = new Date();
  
  // Raw_Events에서 각 이벤트 수 계산
  const rawData = rawSheet.getDataRange().getValues();
  let startsCount = 0;
  let completionsCount = 0;
  
  for (let i = 1; i < rawData.length; i++) {
    const eventType = rawData[i][1];
    if (eventType === 'guide_started') startsCount++;
    else if (eventType === 'guide_completed') completionsCount++;
  }
  
  // Unique_Users에서 고유 사용자 수 계산
  const uniqueUsersCount = uniqueUsersSheet ? uniqueUsersSheet.getLastRow() - 1 : 0;
  
  // CountAPI_Data 시트 업데이트
  countSheet.getRange(2, 3).setValue(uniqueUsersCount);
  countSheet.getRange(2, 4).setValue(now);
  
  countSheet.getRange(3, 3).setValue(startsCount);
  countSheet.getRange(3, 4).setValue(now);
  
  countSheet.getRange(4, 3).setValue(completionsCount);
  countSheet.getRange(4, 4).setValue(now);
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

// GA4 데이터 업데이트 함수
function updateGA4Data() {
  try {
    const propertyId = '468692924'; // GA4 Property ID
    const serviceAccountEmail = 'claude-code-guide@claude-code-guide.iam.gserviceaccount.com';
    const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8pMa/qiS7O5Rw
tQnOqRGMNXOCCb0EQYiQ8E7PFMC0/mZJNAULM1XPBs/6+iRMG2YZuKQS4w3WfJhP
2jUCz0G+q+fMnNjDBP3rBAU+kKq0w+tDf1ehmFqylL2H6zKq7p7+VsAkkV3x8Gok
gPBj3YlOz7Q3l8hCJa5WKJRQpQCL+K3fJNZYoF+3iEE5aTgdJMUhXdmcCzQRTznC
y1v0U7gnhYAA0vdCvCLjSvD9O4LzQBOT0s5KzFx+Mx3h9XBwJ9ojJwKRxdCz0/Mq
XWwl49e0RSRNOmAaUIJ/Mb5I6BvYHzKMkZ6vUdHC5yoC1UrHfrJdU8ULKa2F+iKm
5UJPLgCnAgMBAAECggEABYh2t8XiLmPDMN3pqY0AwG4+gU4XNhZhyAIBBaEEhGBj
OFdMvTT15N1QLBmN//G7E31qv3F8yX7igKIRkPnqoTbG7yrJ4aKdLHxq0zDUHrI5
xAKvbyKFJLFgz6F+OfSBZE4vH2H5vqmKY1aUqtCnBG4tfKj7KGDjLF8Tgmde1d2Y
x8GYUzEfD/mK9mJJ6W7pVbJhCJdJyxs3e63vOZaS3JjZeadhQppQmBhBP0HRBhPH
OqB4YjdE6q+rnYP8hCtqQ5t7OVYSYQMBAQqRIa9LyBpyC1dEzO1Xm7xZ9LJFQxxd
R3GDKcC3GBXN6eKOtFTMXg8LkQJYNKRwOUKGX4ZzUQKBgQDrbRxrXEUZJfUvGzEE
9fYIGHEPQ3nJRRdVjHdJqXHd7nIQggtFCL21MJQlOJTWcuWDbLPZ4iWGqEQekNGq
eO8VvCnuY2DxcaBu+v2H1t7JIzguvXVMOuA9rYOUo/YRXoMdOgFpCQRBpqnE4UIA
jHNGO1JXQnCb8lD3gKnrAg6HFwKBgQDNFf2xFGBnGWxkVYzRz/yE8qJjhN5yoABc
qj0CmDKxQxpxUrMLQJ9VRJdP2lJa9oMFSLdcvJMJWzSXFLFHvuJCSkd6LhJvHiH/
TBdO7aaNpg7Kz5xXOo+h5j8a2B/0VT37xO1WkKcL2D5nQCjxo3U5Cg8T0fKcIMxJ
OROzgLO10QKBgCdbDJMcJKnQ+UvL5qiRJf8cElktCQxqcvPy0Y3FZUC/w4XBT5Hd
fNgf5L4ojmnJGsZHSEcxCRBuJ8T9IDr5kJYtGOhHLdKB9bFnkiRaJvR3lCG5C8WY
Vr4lKRE9TxwCJyRoQFXh1K6xnQKAg8XEo8TgSgXOsVa5pT9Ft6LrbhCZAoGAVEZY
ZOUfQGNLxj5+O0tWgcHBSJEq8YruPiqQ+4hJzRKMJJJa+/6cKGvN29UMGUP4rXe+
GJ2ogWAXa9TevU5GKVMYSvuJrLJGJFBWaI1yNhVGsU1nQc2eLgRa/t2gtnJLJYQn
xRp8J7PCRFR8Rp3h7MhGdBK3HrFiDf5c0OEQKRECgYEAxR8o3gB/+mhQksT5h0m+
kTD3oZU6H5QpQ5KKBLkP/yIUr+bCb0r7jj1B9t5nR7E+xON8gJGEJcz0Fm4Pq7pV
x7u/VVbCrC6P7yLHM2yIeJvP2nLJH/W3Xhv9g7uI2GFKGUFNdgHFkojFKOwHjEJH
lBzWzQR3mW6vdbv3eGu4+Fs=
-----END PRIVATE KEY-----`;

    const startDate = '30daysAgo';
    const endDate = 'today';
    
    // 액세스 토큰 가져오기
    const accessToken = getAccessToken(serviceAccountEmail, privateKey);
    console.log('Access token obtained');
    
    // GA4 API를 통해 데이터 가져오기
    const request = {
      dateRanges: [{startDate: startDate, endDate: endDate}],
      dimensions: [
        {name: 'date'}
      ],
      metrics: [
        {name: 'sessions'},
        {name: 'totalUsers'}, 
        {name: 'screenPageViews'},
        {name: 'averageSessionDuration'},
        {name: 'bounceRate'}
      ],
      orderBys: [{
        dimension: {
          dimensionName: 'date'
        }
      }]
    };
    
    const response = UrlFetchApp.fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'post',
        headers: {
          'Authorization': 'Bearer ' + getAccessToken(serviceAccountEmail, privateKey),
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(request)
      }
    );
    
    const data = JSON.parse(response.getContentText());
    
    if (data.rows) {
      // GA4_Data 시트에 데이터 저장
      saveGA4DataToSheet(data.rows);
      SpreadsheetApp.getActiveSpreadsheet().toast(`GA4 데이터 ${data.rows.length}개 행 저장 완료`, '성공', 3);
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast('GA4 데이터가 없습니다', '알림', 3);
      console.log('GA4 Response:', data);
    }
    
  } catch (error) {
    console.error('Error updating GA4 data:', error);
    SpreadsheetApp.getActiveSpreadsheet().toast(`오류: ${error.toString()}`, '오류', 5);
    
    // Error_Log 시트에 오류 기록
    const errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Error_Log');
    if (errorSheet) {
      errorSheet.appendRow([
        new Date(),
        'GA4_Update_Error',
        error.toString(),
        error.stack || ''
      ]);
    }
  }
}

// GA4 데이터를 시트에 저장
function saveGA4DataToSheet(rows) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GA4_Data');
  if (!sheet) return;
  
  // 기존 데이터 삭제 (헤더 제외)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // 새 데이터 추가
  rows.forEach(row => {
    const date = row.dimensionValues[0].value;
    const sessions = row.metricValues[0].value;
    const users = row.metricValues[1].value;
    const pageViews = row.metricValues[2].value;
    const avgDurationSeconds = parseFloat(row.metricValues[3].value) || 0;
    const avgDurationMinutes = (avgDurationSeconds / 60).toFixed(2); // 초를 분으로 변환
    const bounceRateValue = parseFloat(row.metricValues[4].value) || 0;
    const bounceRate = (bounceRateValue * 100).toFixed(2); // 소수를 백분율로 변환
    
    sheet.appendRow([
      new Date(date),
      '/',           // Page_Path에 기본값 '/' 설정
      sessions,
      users,
      pageViews,
      avgDurationMinutes, // 분 단위로 저장
      bounceRate,
      new Date()     // Last_Updated
    ]);
  });
}

// 액세스 토큰 생성 함수
function getAccessToken(serviceAccountEmail, privateKey) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;
    
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    
    const claim = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: expiry,
      iat: now
    };
    
    const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header));
    const encodedClaim = Utilities.base64EncodeWebSafe(JSON.stringify(claim));
    const signatureInput = encodedHeader + '.' + encodedClaim;
    
    // privateKey 정리
    const cleanedKey = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\n/g, '');
    
    const signature = Utilities.computeRsaSha256Signature(signatureInput, cleanedKey);
    const encodedSignature = Utilities.base64EncodeWebSafe(signature);
    
    const jwt = signatureInput + '.' + encodedSignature;
    
    const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
      method: 'post',
      payload: {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      }
    });
    
    const token = JSON.parse(response.getContentText());
    return token.access_token;
  } catch (error) {
    console.error('Access token error:', error);
    throw new Error(`토큰 생성 실패: ${error.toString()}`);
  }
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
    .addItem('🔐 GA4 권한 확인', 'checkGA4Access')
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

// GA4 권한 및 속성 확인
function checkGA4Access() {
  try {
    // AnalyticsData 서비스 확인
    if (typeof AnalyticsData === 'undefined') {
      SpreadsheetApp.getUi().alert(
        'Google Analytics Data API 미설정',
        '서비스 > (+) 버튼 > Google Analytics Data API 추가가 필요합니다.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // 현재 사용자 이메일
    const userEmail = Session.getActiveUser().getEmail();
    console.log('현재 사용자:', userEmail);
    
    // Settings에서 속성 ID 가져오기
    const config = getConfig();
    const configPropertyId = config.GA4_PROPERTY_ID || '468692924';
    
    let message = `현재 사용자: ${userEmail}\n`;
    message += `설정된 속성 ID: ${configPropertyId}\n\n`;
    
    // 접근 가능한 GA4 속성 나열 시도
    try {
      // 간단한 테스트 요청
      const testResponse = AnalyticsData.Properties.runReport({
        dateRanges: [{startDate: 'yesterday', endDate: 'yesterday'}],
        metrics: [{name: 'sessions'}],
        limit: 1
      }, `properties/${configPropertyId}`);
      
      if (testResponse) {
        message += `✅ 속성 ID ${configPropertyId}에 접근 가능합니다.\n`;
        message += `\n테스트 성공! GA4 데이터를 가져올 수 있습니다.`;
        
        SpreadsheetApp.getUi().alert('GA4 권한 확인 성공', message, SpreadsheetApp.getUi().ButtonSet.OK);
      }
    } catch (permError) {
      // 권한 오류 처리
      message += `❌ GA4 속성에 접근할 수 없습니다.\n\n`;
      message += `오류: ${permError.toString()}\n\n`;
      message += `해결 방법:\n`;
      message += `1. GA4 속성 ID가 올바른지 확인\n`;
      message += `   - GA4 > 관리 > 속성 정보에서 속성 ID 확인\n`;
      message += `   - Settings 시트에서 'GA4 속성 ID' 값 수정\n\n`;
      message += `2. 접근 권한 확인\n`;
      message += `   - GA4 > 관리 > 속성 접근 관리\n`;
      message += `   - ${userEmail} 계정에 최소 "뷰어" 권한 필요\n\n`;
      message += `3. Google Analytics Data API 활성화 확인\n`;
      message += `   - Google Cloud Console에서 API 활성화 상태 확인`;
      
      SpreadsheetApp.getUi().alert('GA4 권한 오류', message, SpreadsheetApp.getUi().ButtonSet.OK);
      
      // Error_Log에 기록
      const errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Error_Log');
      if (errorSheet) {
        errorSheet.appendRow([
          new Date(),
          'GA4_Access_Check',
          permError.toString(),
          `User: ${userEmail}, Property: ${configPropertyId}`
        ]);
      }
    }
    
  } catch (error) {
    console.error('권한 확인 오류:', error);
    SpreadsheetApp.getUi().alert(
      '오류',
      `권한 확인 중 오류 발생:\n${error.toString()}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

// GA4 속성 목록 가져오기
function listGA4Properties() {
  try {
    if (typeof AnalyticsAdmin === 'undefined') {
      SpreadsheetApp.getUi().alert(
        'Google Analytics Admin API 필요',
        'GA4 속성 목록을 보려면:\n\n' +
        '1. 서비스 > (+) 버튼 클릭\n' +
        '2. "Google Analytics Admin API" 검색\n' +
        '3. 추가 (식별자: AnalyticsAdmin)\n\n' +
        '또는 GA4 웹사이트에서 직접 속성 ID를 확인하세요.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // 계정 목록 가져오기
    const accounts = AnalyticsAdmin.Accounts.list();
    let propertiesList = '';
    
    if (accounts.accounts) {
      accounts.accounts.forEach(account => {
        const properties = AnalyticsAdmin.Properties.list({
          filter: `parent:${account.name}`
        });
        
        if (properties.properties) {
          properties.properties.forEach(property => {
            // 속성 ID 추출 (properties/123456789 형식에서 숫자만)
            const propertyId = property.name.split('/')[1];
            propertiesList += `\n- ${property.displayName}: ${propertyId}`;
          });
        }
      });
    }
    
    if (propertiesList) {
      SpreadsheetApp.getUi().alert(
        'GA4 속성 목록',
        `접근 가능한 GA4 속성들:${propertiesList}\n\n` +
        'Settings 시트의 "GA4 속성 ID"에 원하는 ID를 입력하세요.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        'GA4 속성 없음',
        '접근 가능한 GA4 속성이 없습니다.\n' +
        'GA4 계정 접근 권한을 확인하세요.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
    
  } catch (error) {
    console.error('속성 목록 오류:', error);
    SpreadsheetApp.getUi().alert(
      '오류',
      `속성 목록을 가져올 수 없습니다:\n${error.toString()}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
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

// 수동 카운터 업데이트
function manualCountAPIFetch() {
  saveCountAPIData();
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

// GA4 자동 수집 트리거 설정 (하루 2번)
function setupGA4Trigger() {
  // 기존 트리거 제거
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'fetchGA4Data' || trigger.getHandlerFunction() === 'updateGA4Data') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 오전 9시 트리거
  ScriptApp.newTrigger('updateGA4Data')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();

  // 오후 6시 트리거
  ScriptApp.newTrigger('updateGA4Data')
    .timeBased()
    .atHour(18)
    .everyDays(1)
    .create();

  SpreadsheetApp.getActiveSpreadsheet().toast('GA4 자동 수집이 설정되었습니다 (하루 2번: 오전 9시, 오후 6시)', '완료', 3);
}

// GA4 연동 테스트
function testGA4Connection() {
  try {
    // AnalyticsData 서비스 확인
    if (typeof AnalyticsData === 'undefined') {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Google Analytics Data API 서비스를 추가해주세요!',
        '설정 필요',
        5
      );
      return;
    }
    
    // Settings에서 속성 ID 가져오기
    const config = getConfig();
    const propertyId = config.GA4_PROPERTY_ID || '497175038';
    const propertyPath = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    // 간단한 테스트 요청
    const testResponse = AnalyticsData.Properties.runReport({
      "dateRanges": [{"startDate": "yesterday", "endDate": "today"}],
      "metrics": [{"name": "sessions"}],
      "limit": 1
    }, propertyPath);
    
    console.log('GA4 테스트 성공:', JSON.stringify(testResponse));
    SpreadsheetApp.getActiveSpreadsheet().toast('GA4 연결 성공!', '성공', 3);
    
    // 전체 데이터 가져오기
    fetchGA4DataUsingService();
    
  } catch (error) {
    console.error('GA4 연결 실패:', error);
    SpreadsheetApp.getActiveSpreadsheet().toast('GA4 연결 실패: ' + error.toString(), '오류', 5);
    
    // Error_Log에 기록
    const errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Error_Log');
    if (errorSheet) {
      errorSheet.appendRow([
        new Date(),
        'GA4_Connection_Test',
        error.toString(),
        error.stack || ''
      ]);
    }
  }
}

// 메뉴에서 호출하는 GA4 데이터 가져오기 함수
function fetchGA4Data() {
  try {
    // AnalyticsData 서비스 사용 가능 여부 확인
    if (typeof AnalyticsData !== 'undefined') {
      fetchGA4DataUsingService();
    } else {
      // 서비스가 없으면 HTTP 요청 사용
      updateGA4Data();
    }
  } catch (error) {
    console.error('GA4 데이터 가져오기 오류:', error);
    SpreadsheetApp.getActiveSpreadsheet().toast(`오류: ${error.toString()}`, '오류', 5);
  }
}

// AnalyticsData 서비스를 사용한 GA4 데이터 가져오기
function fetchGA4DataUsingService() {
  try {
    const config = getConfig();
    const propertyId = config.GA4_PROPERTY_ID || '497175038';
    
    // propertyId가 'properties/' 접두사를 포함하는지 확인
    const propertyPath = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    console.log('Using property:', propertyPath);
    
    // GA4 API 요청
    const request = {
      "dateRanges": [{"startDate": "30daysAgo", "endDate": "today"}],
      "dimensions": [{"name": "date"}],
      "metrics": [
        {"name": "sessions"},
        {"name": "totalUsers"},
        {"name": "screenPageViews"},
        {"name": "averageSessionDuration"},
        {"name": "bounceRate"}
      ],
      "orderBys": [{"dimension": {"dimensionName": "date"}}]
    };
    
    // AnalyticsData API 호출 - 올바른 형식
    const response = AnalyticsData.Properties.runReport(request, propertyPath);
    
    if (response && response.rows) {
      saveGA4DataToSheet(response.rows);
      SpreadsheetApp.getActiveSpreadsheet().toast(`GA4 데이터 ${response.rows.length}개 행 저장 완료`, '성공', 3);
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast('GA4 데이터가 없습니다', '알림', 3);
      console.log('GA4 Response:', response);
    }
    
  } catch (error) {
    console.error('GA4 서비스 오류:', error);
    SpreadsheetApp.getActiveSpreadsheet().toast(`오류: ${error.toString()}`, '오류', 5);
    
    // Error_Log 시트에 오류 기록
    const errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Error_Log');
    if (errorSheet) {
      errorSheet.appendRow([
        new Date(),
        'GA4_Service_Error',
        error.toString(),
        error.stack || ''
      ]);
    }
  }
}


// 알림 전송
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

// 오류 로깅
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

// 테스트 시트 구조 확인
function testSheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const requiredSheets = ['Raw_Events', 'Feedback_Events', 'GA4_Data', 'CountAPI_Data', 'Unique_Users'];
  
  requiredSheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      console.log(`✓ ${sheetName} 시트 존재`);
    } else {
      console.log(`✗ ${sheetName} 시트 없음`);
    }
  });
}

// 종합 통계 수집 함수들 (호환성 유지)
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

// 통계 계산
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

// 피드백 이벤트 저장
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

// 에러 이벤트 저장
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

// 일반 이벤트 저장
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

// 중요 이벤트 처리
function processImportantEvent(data) {
  const config = getConfig();

  // 가이드 완료 이벤트
  if (data.eventType === 'guide_completed') {
    updateCompletionStats();
    // 카운터 증가는 guide-manager.js에서 직접 처리하므로 여기서는 제거
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

// 완료율 업데이트
function updateCompletionStats() {
  // Dashboard 시트 업데이트 트리거
  updateDashboard();
}

// 오류율 체크
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