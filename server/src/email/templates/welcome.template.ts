export const welcomeTemplate = {
  subject: '[Moti] 환영합니다! 계정이 성공적으로 생성되었습니다',
  html: `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>환영합니다</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #28a745;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #28a745;
        }
        .content {
          padding: 20px 0;
        }
        .welcome-box {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          margin: 20px 0;
        }
        .cta-button {
          display: inline-block;
          padding: 15px 30px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .feature-list {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 14px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Moti</div>
      </div>
      
      <div class="welcome-box">
        <h1>🎉 환영합니다!</h1>
        <p>고객님의 Moti 여정을 시작합니다</p>
      </div>
      
      <div class="content">
        <p>안녕하세요, 고객님!</p>
        
        <p>Moti에 가입해주셔서 진심으로 감사합니다. 이제 다양한 기능을 사용하실 수 있습니다.</p>
        
        <div class="feature-list">
          <h3>🚀 주요 기능들</h3>
          <ul>
            <li><strong>GitHub 연동:</strong> 프로젝트 관리를 더욱 효율적으로</li>
            <li><strong>실시간 협업:</strong> 팀원들과 함께 작업하세요</li>
            <li><strong>스마트 알림:</strong> 중요한 업데이트를 놓치지 마세요</li>
            <li><strong>보안 관리:</strong> 안전한 데이터 보호</li>
          </ul>
        </div>
        
        <p>지금 바로 시작해보세요:</p>
        
        <div style="text-align: center;">
          <a href="{{dashboardUrl}}" class="cta-button">대시보드로 이동</a>
        </div>
        
        <p>궁금한 점이 있으시거나 도움이 필요하시면 언제든 문의해주세요. 저희 팀이 도와드리겠습니다!</p>
        
        <p>다시 한번 Moti에 오신 것을 환영합니다! 🎊</p>
      </div>
      
      <div class="footer">
        <p>© 2024 Moti. All rights reserved.</p>
        <p>더 나은 서비스를 제공하기 위해 항상 노력하겠습니다.</p>
      </div>
    </body>
    </html>
  `,
  text: `
🎉 환영합니다!

안녕하세요, 고객님!

Moti에 가입해주셔서 진심으로 감사합니다. 이제 다양한 기능을 사용하실 수 있습니다.

🚀 주요 기능들:
- GitHub 연동: 프로젝트 관리를 더욱 효율적으로
- 실시간 협업: 팀원들과 함께 작업하세요
- 스마트 알림: 중요한 업데이트를 놓치지 마세요
- 보안 관리: 안전한 데이터 보호

지금 바로 시작해보세요:
{{dashboardUrl}}

궁금한 점이 있으시거나 도움이 필요하시면 언제든 문의해주세요. 저희 팀이 도와드리겠습니다!

다시 한번 Moti에 오신 것을 환영합니다! 🎊

© 2024 Moti. All rights reserved.
  `,
};
