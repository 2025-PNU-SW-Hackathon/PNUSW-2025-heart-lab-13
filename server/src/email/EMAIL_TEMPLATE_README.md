# 이메일 템플릿 시스템

이메일 템플릿 시스템을 사용하여 파라미터만 채워서 이메일을 간단하게 발송할 수 있습니다.

## 📁 프로젝트 구조

```
src/email/
├── interface/
│   └── email-template.interface.ts     # 이메일 템플릿 인터페이스 정의
├── templates/
│   ├── index.ts                        # 템플릿 인덱스
│   ├── email-verification.template.ts  # 이메일 인증 템플릿
│   ├── password-reset.template.ts      # 비밀번호 재설정 템플릿
│   ├── welcome.template.ts             # 환영 메시지 템플릿
│   └── notification.template.ts        # 일반 알림 템플릿
├── email-template.service.ts           # 템플릿 렌더링 서비스
├── emailContent.writer.ts              # 이메일 컨텐츠 생성 서비스
├── email.service.ts                    # 이메일 발송 서비스
├── email.module.ts                     # 이메일 모듈
└── email-usage.example.ts              # 사용 예시
```

## 🚀 주요 기능

### 1. 템플릿 타입

- `EMAIL_VERIFICATION`: 이메일 인증
- `PASSWORD_RESET`: 비밀번호 재설정
- `WELCOME`: 환영 메시지
- `NOTIFICATION`: 일반 알림

### 2. 템플릿 엔진 기능

- **변수 치환**: `{{variable}}` 형태로 변수 주입
- **조건부 블록**: `{{#if variable}}...{{/if}}` 조건부 렌더링
- **반대 조건부**: `{{#unless variable}}...{{/unless}}` 반대 조건
- **중첩 객체**: `{{user.name}}` 형태로 중첩된 객체 접근

## 📖 사용 방법

### 기본 사용법

```typescript
import { EmailService } from './email/email.service';

@Injectable()
export class YourService {
  constructor(private readonly emailService: EmailService) {}

  // 이메일 인증 발송
  async sendVerification() {
    await this.emailService.sendEmailVerification({
      to: 'user@example.com',
      username: '홍길동',
      verificationUrl: 'https://moti.com/verify?token=abc123',
      expirationTime: 30,
    });
  }

  // 비밀번호 재설정 발송
  async sendPasswordReset() {
    await this.emailService.sendPasswordReset({
      to: 'user@example.com',
      username: '홍길동',
      resetUrl: 'https://moti.com/reset?token=xyz789',
      expirationTime: 15,
    });
  }

  // 환영 메시지 발송
  async sendWelcome() {
    await this.emailService.sendWelcomeEmail({
      to: 'user@example.com',
      username: '홍길동',
      dashboardUrl: 'https://moti.com/dashboard',
    });
  }

  // 일반 알림 발송
  async sendNotification() {
    await this.emailService.sendNotification({
      to: 'user@example.com',
      username: '홍길동',
      notificationTitle: '새로운 알림',
      notificationMessage: '새로운 업데이트가 있습니다.',
      actionUrl: 'https://moti.com/updates',
      actionText: '확인하기',
    });
  }
}
```

### 고급 사용법

```typescript
// 템플릿을 직접 사용
await this.emailService.sendTemplateEmail({
  to: 'user@example.com',
  templateType: EmailTemplateType.EMAIL_VERIFICATION,
  context: {
    username: '홍길동',
    verificationUrl: 'https://moti.com/verify?token=abc123',
    expirationTime: 30,
    // 추가 커스텀 변수
    companyName: 'Moti Corp',
    supportEmail: 'support@moti.com',
  },
});

// 복수 수신자
await this.emailService.sendTemplateEmail({
  to: ['user1@example.com', 'user2@example.com'],
  templateType: EmailTemplateType.NOTIFICATION,
  context: {
    username: '팀원들',
    notificationTitle: '시스템 점검 안내',
    notificationMessage: '시스템 점검이 예정되어 있습니다.',
  },
});
```

## 🎨 템플릿 커스터마이징

### 새로운 템플릿 추가

1. **인터페이스에 새 타입 추가**:

```typescript
// interface/email-template.interface.ts
export enum EmailTemplateType {
  // ... 기존 타입들
  NEW_TEMPLATE = 'new-template',
}
```

2. **템플릿 파일 생성**:

```typescript
// templates/new-template.template.ts
export const newTemplate = {
  subject: '[Moti] {{title}}',
  html: `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>{{title}}</h1>
        <p>{{message}}</p>
      </body>
    </html>
  `,
  text: `{{title}}\n\n{{message}}`,
};
```

3. **인덱스 파일에 추가**:

```typescript
// templates/index.ts
import { newTemplate } from './new-template.template';

export const emailTemplates: Record<EmailTemplateType, EmailTemplate> = {
  // ... 기존 템플릿들
  [EmailTemplateType.NEW_TEMPLATE]: newTemplate,
};
```

### 템플릿 문법

```html
<!-- 변수 치환 -->
<p>안녕하세요, {{username}}님!</p>

<!-- 조건부 렌더링 -->
{{#if verificationUrl}}
<a href="{{verificationUrl}}">인증하기</a>
{{/if}}

<!-- 반대 조건 -->
{{#unless hasAccount}}
<p>계정을 생성해주세요.</p>
{{/unless}}

<!-- 중첩 객체 -->
<p>{{user.profile.name}}님의 이메일: {{user.email}}</p>
```

## 🔧 설정

`EmailModule`을 앱 모듈에 추가하세요:

```typescript
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    // ... 다른 모듈들
    EmailModule,
  ],
})
export class AppModule {}
```

## ⚡ 성능 고려사항

- 템플릿은 런타임에 렌더링되므로 복잡한 로직보다는 단순한 변수 치환을 권장합니다.
- 대량 발송 시에는 SES의 발송 제한을 고려하세요.
- 템플릿 캐싱이 필요한 경우 Redis 등의 캐시 시스템을 도입하세요.

## 🐛 문제 해결

### 변수가 치환되지 않는 경우

- 변수명이 정확한지 확인하세요: `{{username}}` (camelCase)
- 중첩 객체의 경우 전체 경로를 확인하세요: `{{user.profile.name}}`

### 조건부 블록이 작동하지 않는 경우

- 조건 변수가 truthy/falsy 값인지 확인하세요
- 블록이 올바르게 닫혔는지 확인하세요: `{{#if}}...{{/if}}`

### 이메일이 발송되지 않는 경우

- AWS SES 설정이 올바른지 확인하세요
- 발신자 이메일이 SES에서 인증되었는지 확인하세요
- AWS 권한 설정을 확인하세요

## 📝 예시

더 자세한 사용 예시는 `email-usage.example.ts` 파일을 참고하세요.
