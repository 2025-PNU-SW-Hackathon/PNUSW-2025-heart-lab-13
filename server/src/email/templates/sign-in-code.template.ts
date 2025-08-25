export const signInCodeTemplate = {
  subject: '[Moti] 🔐 로그인 인증 코드',
  html: `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>로그인 인증 코드</title>
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
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
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
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
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
        .code-section {
          background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
          border-radius: 16px;
          padding: 40px 30px;
          margin: 30px 0;
          text-align: center;
          border: 2px solid #4299e1;
        }
        .code-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 20px;
        }
        .code-display {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          padding: 25px 20px;
          border-radius: 12px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 8px;
          text-align: center;
          margin: 25px 0;
          box-shadow: 0 8px 25px rgba(66, 153, 225, 0.3);
          border: 3px solid #2b77cb;
        }
        .code-instructions {
          font-size: 14px;
          color: #4a5568;
          margin-top: 15px;
          padding: 15px;
          background: #f7fafc;
          border-radius: 8px;
          border-left: 4px solid #4299e1;
        }
        .info-box {
          background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%);
          border: 2px solid #f6ad55;
          border-radius: 16px;
          padding: 25px;
          margin: 25px 0;
          color: #c05621;
        }
        .info-box .icon {
          font-size: 24px;
          margin-bottom: 15px;
          display: block;
        }
        .info-box h4 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 15px;
          color: #c05621;
        }
        .info-box ul {
          list-style: none;
          padding-left: 0;
        }
        .info-box li {
          padding: 5px 0;
          padding-left: 25px;
          position: relative;
        }
        .info-box li:before {
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
          color: #4299e1;
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
          .code-display {
            font-size: 24px;
            letter-spacing: 4px;
            padding: 20px 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">🔐 Moti</div>
          <div class="header-subtitle">안전한 로그인 인증</div>
        </div>
        
        <div class="content">
          <h1 class="greeting">🔑 로그인 인증 코드</h1>
          
          <p class="main-text">
            안전한 로그인을 위해 인증 코드를 발송해드렸습니다.<br>
            아래 코드를 입력하여 로그인을 완료해주세요.
          </p>
          
          <div class="code-section">
            <h3 class="code-title">🔢 인증 코드</h3>
            <div class="code-display">{{code}}</div>
            
            <div class="code-instructions">
              <strong>📝 입력 방법:</strong><br>
              로그인 페이지에서 위 6자리 숫자를 정확히 입력해주세요.
            </div>
          </div>
          
          <div class="info-box">
            <span class="icon">⏰</span>
            <h4>중요 안내사항</h4>
            <ul>
              <li>이 인증 코드는 <strong>{{expirationTime}}분</strong> 후에 만료됩니다</li>
              <li>코드는 일회용이며, 사용 후 자동으로 무효화됩니다</li>
              <li>타인과 절대 공유하지 마세요</li>
              <li>의심스러운 로그인 시도라면 즉시 고객지원팀에 연락하세요</li>
            </ul>
          </div>
          
          <p style="text-align: center; color: #718096; font-size: 14px; margin-top: 30px;">
            이 로그인 시도를 하지 않으셨다면, 즉시 계정 보안을 확인해주세요.
          </p>
        </div>
        
        <div class="footer">
          <p class="footer-text">© 2024 Moti. All rights reserved.</p>
          <p class="footer-text">계정 보안을 위해 항상 노력하겠습니다 🛡️</p>
          <div class="footer-links">
            <a href="#" class="footer-link">고객지원</a>
            <a href="#" class="footer-link">보안 센터</a>
            <a href="#" class="footer-link">계정 설정</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
🔐 Moti - 로그인 인증 코드

🔑 로그인 인증 코드

안전한 로그인을 위해 인증 코드를 발송해드렸습니다.
아래 코드를 입력하여 로그인을 완료해주세요.

🔢 인증 코드: {{code}}

📝 입력 방법:
로그인 페이지에서 위 6자리 숫자를 정확히 입력해주세요.

⏰ 중요 안내사항:
🔸 이 인증 코드는 {{expirationTime}}분 후에 만료됩니다
🔸 코드는 일회용이며, 사용 후 자동으로 무효화됩니다
🔸 타인과 절대 공유하지 마세요
🔸 의심스러운 로그인 시도라면 즉시 고객지원팀에 연락하세요

이 로그인 시도를 하지 않으셨다면, 즉시 계정 보안을 확인해주세요.

© 2024 Moti. All rights reserved.
계정 보안을 위해 항상 노력하겠습니다 🛡️
  `,
};
