export const TOOL_TYPE = {
  GITHUB: 'GITHUB',
  JIRA: 'JIRA',
  SLACK: 'SLACK',
  NOTION: 'NOTION',
} as const;

export type ToolType = (typeof TOOL_TYPE)[keyof typeof TOOL_TYPE];
