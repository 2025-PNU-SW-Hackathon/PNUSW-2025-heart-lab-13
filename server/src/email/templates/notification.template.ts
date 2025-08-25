export const notificationTemplate = {
  subject: '[Moti] {{notificationType}} 알림',
  html: `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>알림</title>
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
          border-bottom: 2px solid #6f42c1;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #6f42c1;
        }
        .content {
          padding: 20px 0;
        }
        .notification-box {
          background-color: #f8f9fa;
          border-left: 4px solid #6f42c1;
          padding: 20px;
          margin: 20px 0;
        }
        .action-button {
          display: inline-block;
          padding: 12px 25px;
          background-color: #6f42c1;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 15px 0;
          font-weight: bold;
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
      
      <div class="content">
        <h2>{{notificationTitle}}</h2>
        
        <p>안녕하세요, 고객님!</p>
        
        <div class="notification-box">
          <p>{{notificationMessage}}</p>
        </div>
        
        {{#if actionUrl}}
        <div style="text-align: center;">
          <a href="{{actionUrl}}" class="action-button">{{actionText}}</a>
        </div>
        {{/if}}
        
        {{#if additionalInfo}}
        <p><strong>추가 정보:</strong></p>
        <p>{{additionalInfo}}</p>
        {{/if}}
        
        <p>이 알림에 대한 설정을 변경하려면 계정 설정 페이지를 방문하세요.</p>
      </div>
      
      <div class="footer">
        <p>© 2024 Moti. All rights reserved.</p>
        <p>이 이메일은 자동으로 발송되었습니다.</p>
      </div>
    </body>
    </html>
  `,
  text: `
{{notificationTitle}}

안녕하세요, 고객님!

{{notificationMessage}}

{{#if actionUrl}}
자세한 내용: {{actionUrl}}
{{/if}}

{{#if additionalInfo}}
추가 정보: {{additionalInfo}}
{{/if}}

이 알림에 대한 설정을 변경하려면 계정 설정 페이지를 방문하세요.

© 2024 Moti. All rights reserved.
  `,
};
