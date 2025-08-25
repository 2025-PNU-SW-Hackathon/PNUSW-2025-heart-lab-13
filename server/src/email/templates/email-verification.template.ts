export const emailVerificationTemplate = {
  subject: '[Moti] 이메일 인증을 완료해주세요 ✨',
  html: `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>이메일 인증</title>
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .welcome-text {
          font-size: 16px;
          color: #4a5568;
          margin-bottom: 30px;
          text-align: center;
          line-height: 1.8;
        }
        .verification-section {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 16px;
          padding: 30px;
          margin: 30px 0;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        .verification-button {
          display: inline-block;
          padding: 16px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .verification-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
        }
        .verification-code {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 4px;
          text-align: center;
          margin: 25px 0;
          box-shadow: 0 8px 25px rgba(66, 153, 225, 0.3);
        }
        .url-fallback {
          background: #f7fafc;
          padding: 15px;
          border-radius: 8px;
          font-size: 14px;
          color: #4a5568;
          word-break: break-all;
          margin: 20px 0;
          border-left: 4px solid #667eea;
        }
        .info-box {
          background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
          border: 1px solid #fc8181;
          border-radius: 12px;
          padding: 20px;
          margin: 25px 0;
          color: #c53030;
        }
        .info-box .icon {
          font-size: 20px;
          margin-right: 10px;
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
          color: #667eea;
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
          .verification-button {
            padding: 14px 30px;
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">✨ Moti</div>
          <div class="header-subtitle">당신의 성장을 함께하는 파트너</div>
        </div>
        
        <div class="content">
          <h1 class="greeting">🎉 환영합니다, 고객님!</h1>
          
          <p class="welcome-text">
            Moti 서비스에 가입해주셔서 진심으로 감사합니다.<br>
            이메일 인증을 완료하여 멋진 여정을 시작해보세요!
          </p>
          
          {{#if verificationUrl}}
          <div class="verification-section">
            <h3 style="color: #4a5568; margin-bottom: 15px;">🔐 이메일 인증하기</h3>
            <p style="color: #718096; margin-bottom: 20px;">아래 버튼을 클릭하여 계정을 활성화하세요</p>
            <a href="{{verificationUrl}}" class="verification-button">
              🚀 지금 인증하기
            </a>
            
            <div class="url-fallback">
              <strong>버튼이 작동하지 않나요?</strong><br>
              아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
              <span style="color: #667eea; font-weight: 600;">{{verificationUrl}}</span>
            </div>
          </div>
          {{/if}}
          
          {{#if verificationCode}}
          <div class="verification-section">
            <h3 style="color: #4a5568; margin-bottom: 15px;">🔑 인증 코드</h3>
            <p style="color: #718096; margin-bottom: 20px;">아래 코드를 입력해주세요</p>
            <div class="verification-code">{{verificationCode}}</div>
          </div>
          {{/if}}
          
          <div class="info-box">
            <span class="icon">⏰</span>
            <strong>중요:</strong> 이 인증 링크는 <strong>{{expirationTime}}분</strong> 후에 만료됩니다.
          </div>
          
          <p style="text-align: center; color: #718096; font-size: 14px; margin-top: 30px;">
            이 이메일을 요청하지 않으셨다면, 안전하게 무시하셔도 됩니다.
          </p>
        </div>
        
        <div class="footer">
          <p class="footer-text">© 2024 Moti. All rights reserved.</p>
          <p class="footer-text">더 나은 서비스로 보답하겠습니다 💜</p>
          <div class="footer-links">
            <a href="#" class="footer-link">고객지원</a>
            <a href="#" class="footer-link">개인정보처리방침</a>
            <a href="#" class="footer-link">서비스 이용약관</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
✨ Moti - 이메일 인증

🎉 환영합니다, 고객님!

Moti 서비스에 가입해주셔서 진심으로 감사합니다.
이메일 인증을 완료하여 멋진 여정을 시작해보세요!

{{#if verificationUrl}}
🔐 이메일 인증하기
아래 링크를 클릭하여 계정을 활성화하세요:
{{verificationUrl}}
{{/if}}

{{#if verificationCode}}
🔑 인증 코드: {{verificationCode}}
{{/if}}

⏰ 중요: 이 인증 링크는 {{expirationTime}}분 후에 만료됩니다.

이 이메일을 요청하지 않으셨다면, 안전하게 무시하셔도 됩니다.

© 2024 Moti. All rights reserved.
더 나은 서비스로 보답하겠습니다 💜
  `,
};
