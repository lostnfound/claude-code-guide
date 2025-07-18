// GA4 자동수집을 위해 Google Apps Script에 추가해야 할 코드

// 1. setupGA4Trigger 함수를 다음으로 교체:
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

// 2. 새로운 updateGA4Data 함수 추가:
function updateGA4Data() {
  try {
    fetchGA4Data();
    SpreadsheetApp.getActiveSpreadsheet().toast('GA4 데이터가 업데이트되었습니다', '완료', 3);
  } catch (error) {
    console.error('GA4 데이터 업데이트 실패:', error);
    logError('updateGA4Data', error);
  }
}