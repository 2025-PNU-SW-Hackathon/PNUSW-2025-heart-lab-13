import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  evaluationModel: process.env.EVALUATION_MODEL || 'o1-mini',
  analysisModel: process.env.ANALYSIS_MODEL || 'claude-3-5-sonnet-20241022',
  reportModel: process.env.REPORT_MODEL || 'gpt-4o',
  // GitHub MCP Server Configuration

  githubMcpUrl: process.env.GITHUB_MCP_URL || '',
}));
