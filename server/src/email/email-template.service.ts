import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EmailTemplateContext,
  EmailTemplateType,
} from './interface/email-template.interface';
import { emailTemplates } from './templates';
import { ExceptionMessage } from 'src/constants/ExceptionMessage';

@Injectable()
export class EmailTemplateService {
  /**
   * 템플릿을 렌더링합니다
   * @param templateType 템플릿 타입
   * @param context 템플릿에 주입할 데이터
   * @returns 렌더링된 이메일 컨텐츠
   */
  renderTemplate(
    templateType: EmailTemplateType,
    context: EmailTemplateContext,
  ) {
    const template = emailTemplates[templateType];
    if (!template) {
      throw new NotFoundException(
        ExceptionMessage.EMAIL_TEMPLATE_NOT_FOUND,
        templateType,
      );
    }

    return {
      subject: this.interpolateString(template.subject, context),
      html: this.interpolateString(template.html, context),
      text: template.text
        ? this.interpolateString(template.text, context)
        : undefined,
    };
  }

  /**
   * 문자열에서 템플릿 변수를 실제 값으로 치환합니다
   * 지원하는 패턴:
   * - {{variable}} : 단순 변수 치환
   * - {{#if variable}}...{{/if}} : 조건부 블록
   * - {{#unless variable}}...{{/unless}} : 반대 조건부 블록
   */
  private interpolateString(
    template: string,
    context: EmailTemplateContext,
  ): string {
    let result = template;

    // 조건부 블록 처리 ({{#if variable}}...{{/if}})
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, variable: string, content: string) => {
        const value = this.getNestedValue(context, variable);
        return value ? this.interpolateString(content, context) : '';
      },
    );

    // 반대 조건부 블록 처리 ({{#unless variable}}...{{/unless}})
    result = result.replace(
      /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
      (match, variable: string, content: string) => {
        const value = this.getNestedValue(context, variable);
        return !value ? this.interpolateString(content, context) : '';
      },
    );

    // 단순 변수 치환 ({{variable}})
    result = result.replace(/\{\{(\w+)\}\}/g, (match, variable: string) => {
      const value = this.getNestedValue(context, variable);
      return value !== undefined ? this.safeStringify(value) : match;
    });

    // 중첩 객체 접근 ({{object.property}})
    result = result.replace(/\{\{([\w.]+)\}\}/g, (match, path: string) => {
      const value = this.getNestedValue(context, path);
      return value !== undefined ? this.safeStringify(value) : match;
    });

    return result;
  }

  /**
   * 중첩된 객체에서 값을 가져옵니다
   * 예: getNestedValue({user: {name: 'John'}}, 'user.name') => 'John'
   */
  private getNestedValue(obj: EmailTemplateContext, path: string): unknown {
    return path.split('.').reduce((current: any, key: string): any => {
      if (current && typeof current === 'object' && key in current) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return current[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * 값을 안전하게 문자열로 변환합니다
   */
  private safeStringify(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    // 마지막 fallback - 이미 위에서 object는 처리됨
    return '';
  }

  /**
   * 템플릿에서 사용할 수 있는 공통 헬퍼 함수들
   */
  getCommonContext(): EmailTemplateContext {
    return {
      currentYear: new Date().getFullYear(),
      currentDate: new Date().toLocaleDateString('ko-KR'),
      supportEmail: 'support@moti.com',
      websiteUrl: 'https://moti.com',
    };
  }
}
