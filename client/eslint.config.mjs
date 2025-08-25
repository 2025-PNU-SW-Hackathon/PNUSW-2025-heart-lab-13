// eslint.config.js        (Node ≥ 20.11이면 .mjs 확장 안 써도 됨)
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

export default [
  /* ① Next + Prettier 레거시 규칙 → 플랫으로 변환 */
  ...compat.config({
    extends: [
      'next/core-web-vitals',
      'next/typescript',
      'plugin:prettier/recommended' // ← prettier 플러그인 포함
    ]
  }),

  /* ②(선택) TypeScript 프로젝트 경로 지정 */
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { project: './tsconfig.json' } }
  },

  /* ③ **이 부분 추가** : prettier/prettier 옵션 덮어쓰기 */
  {
    rules: {
      // ↙ endOfLine 옵션만 덮어쓰면 “Delete ␍” 오류 사라짐
      'prettier/prettier': ['error', { endOfLine: 'auto' }]
    }
  }
]
