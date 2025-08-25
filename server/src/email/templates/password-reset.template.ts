export const passwordResetTemplate = {
  subject: '[Moti] 🔐 비밀번호 재설정 요청',
  html: `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>비밀번호 재설정</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.8;
          color: #2d3748;
          background: linear-gradient(135deg, #fc8181 0%, #e53e3e 100%);
          padding: 40px 20px;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        .header {
          background: linear-gradient(135deg, #fc8181 0%, #e53e3e 100%);
          padding: 40px 20px;
          text-align: center;
          color: white;
        }
        .logo {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .header-subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }
        .content {
          padding: 50px 40px;
        }
        .greeting {
          font-size: 28px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 20px;
          text-align: center;
        }
        .main-text {
          font-size: 16px;
          color: #4a5568;
          margin-bottom: 30px;
          text-align: center;
          line-height: 1.8;
        }
        .reset-section {
          background: linear-gradient(135deg, #fed7d7 0%, #fbb6ce 100%);
          border-radius: 16px;
          padding: 30px;
          margin: 30px 0;
          text-align: center;
          border: 1px solid #fc8181;
        }
        .reset-button {
          display: inline-block;
          padding: 16px 40px;
          background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
          color: white;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(229, 62, 62, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(229, 62, 62, 0.4);
        }
        .url-fallback {
          background: #f7fafc;
          padding: 15px;
          border-radius: 8px;
          font-size: 14px;
          color: #4a5568;
          word-break: break-all;
          margin: 20px 0;
          border-left: 4px solid #e53e3e;
        }
        .warning {
          background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%);
          border: 2px solid #f6ad55;
          border-radius: 16px;
          padding: 25px;
          margin: 25px 0;
          color: #c05621;
        }
        .warning .icon {
          font-size: 24px;
          margin-bottom: 15px;
          display: block;
        }
        .warning h4 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 15px;
          color: #c05621;
        }
        .warning ul {
          list-style: none;
          padding-left: 0;
        }
        .warning li {
          padding: 5px 0;
          padding-left: 25px;
          position: relative;
        }
        .warning li:before {
          content: "🔸";
          position: absolute;
          left: 0;
        }
        .footer {
          background: #f8fafc;
          padding: 30px 40px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer-text {
          font-size: 14px;
          color: #718096;
          margin-bottom: 10px;
        }
        .footer-links {
          margin-top: 20px;
        }
        .footer-link {
          color: #e53e3e;
          text-decoration: none;
          margin: 0 15px;
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          .content {
            padding: 30px 20px;
          }
          .greeting {
            font-size: 24px;
          }
          .reset-button {
            padding: 14px 30px;
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">🔐 Moti</div>
          <div class="header-subtitle">계정 보안 관리</div>
        </div>
        
        <div class="content">
          <h1 class="greeting">🔑 비밀번호 재설정</h1>
          
          <p class="main-text">
            안녕하세요, 고객님!<br>
            Moti 계정의 비밀번호 재설정을 요청하셨습니다.
          </p>
          
          <div class="reset-section">
            <h3 style="color: #c53030; margin-bottom: 15px;">🛡️ 새 비밀번호 설정</h3>
            <p style="color: #9c4221; margin-bottom: 20px;">아래 버튼을 클릭하여 안전하게 비밀번호를 변경하세요</p>
            <a href="{{resetUrl}}" class="reset-button">
              🔒 비밀번호 재설정하기
            </a>
            
            <div class="url-fallback">
              <strong>버튼이 작동하지 않나요?</strong><br>
              아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
              <span style="color: #e53e3e; font-weight: 600;">{{resetUrl}}</span>
            </div>
          </div>
          
          <div class="warning">
            <span class="icon">⚠️</span>
            <h4>보안 알림</h4>
            <ul>
              <li>이 링크는 <strong>{{expirationTime}}분</strong> 후에 만료됩니다</li>
              <li>이 요청을 하지 않으셨다면, 즉시 계정 보안을 확인하세요</li>
              <li>링크를 다른 사람과 절대 공유하지 마세요</li>
              <li>의심스러운 활동이 발견되면 즉시 고객지원팀에 연락하세요</li>
            </ul>
          </div>
          
          <p style="text-align: center; color: #718096; font-size: 14px; margin-top: 30px;">
            이 요청을 하지 않으셨다면, 이 이메일을 무시하시고 계정 보안을 확인해주세요.
          </p>
        </div>
        
        <div class="footer">
          <p class="footer-text">© 2024 Moti. All rights reserved.</p>
          <p class="footer-text">계정 보안에 문제가 있다면 즉시 연락주세요 🚨</p>
          <div class="footer-links">
            <a href="#" class="footer-link">긴급 고객지원</a>
            <a href="#" class="footer-link">보안 센터</a>
            <a href="#" class="footer-link">계정 설정</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
🔐 Moti - 비밀번호 재설정

🔑 비밀번호 재설정 요청

안녕하세요, 고객님!
Moti 계정의 비밀번호 재설정을 요청하셨습니다.

🛡️ 새 비밀번호 설정
아래 링크를 클릭하여 안전하게 비밀번호를 변경하세요:
{{resetUrl}}

⚠️ 보안 알림:
🔸 이 링크는 {{expirationTime}}분 후에 만료됩니다
🔸 이 요청을 하지 않으셨다면, 즉시 계정 보안을 확인하세요
🔸 링크를 다른 사람과 절대 공유하지 마세요
🔸 의심스러운 활동이 발견되면 즉시 고객지원팀에 연락하세요

이 요청을 하지 않으셨다면, 이 이메일을 무시하시고 계정 보안을 확인해주세요.

© 2024 Moti. All rights reserved.
계정 보안에 문제가 있다면 즉시 연락주세요 🚨
  `,
};
