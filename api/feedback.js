/**
 * Vercel Serverless Function - Feedback Proxy
 * CORS 문제를 해결하고 POST 요청을 가능하게 하는 프록시 서버
 */

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 요청 데이터 검증
    const { emoji, feedbackText, email, userId, sessionId } = req.body;
    
    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    // Google Apps Script로 전달할 데이터 준비
    const payload = {
      eventType: 'feedback_submitted',
      userId: userId || '',
      sessionId: sessionId || '',
      emoji: emoji,
      feedbackText: feedbackText || '',
      email: email || '', // 이메일 추가
      timestamp: new Date().toISOString(),
      pageUrl: req.headers.referer || '',
      userAgent: req.headers['user-agent'] || ''
    };

    // Google Apps Script 엔드포인트
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw9IG4a8jKUPG9s_ouhY6yk8xn3UUP-sDri8wDm9_WGct4cbGsWp6P1X45Ei5DUf-Q5/exec';

    // Google Apps Script로 POST 요청
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    // 응답 처리
    const responseText = await response.text();
    
    // 응답 파싱 시도
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      // JSON 파싱 실패 시 텍스트 그대로 반환
      result = { status: 'success', message: responseText };
    }

    // 클라이언트에 응답
    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: result
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}