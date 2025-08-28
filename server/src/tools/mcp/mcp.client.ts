import { MultiServerMCPClient } from '@langchain/mcp-adapters';

export type McpMode = 'process' | 'url';

export interface McpConfig {
  mode: McpMode;
  serverName: string; // e.g., 'github'
  // process mode
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // url mode
  url?: string;
}

export interface McpToolLike {
  name: string;
  description?: string;
  invoke: (args: Record<string, unknown>) => Promise<unknown>;
}

export class McpClient {
  private client: MultiServerMCPClient | null = null;
  private tools: McpToolLike[] = [];
  private serverName = 'server';

  async init(config: McpConfig): Promise<void> {
    this.serverName = config.serverName || 'server';

    // Create proper config for MultiServerMCPClient
    const mcpServers: Record<
      string,
      | {
          command: string;
          args: string[];
          env?: Record<string, string>;
        }
      | { url: string; headers: Record<string, string> }
    > = {};

    if (config.mode === 'process') {
      if (!config.command || !config.args) {
        throw new Error('MCP process mode requires command and args');
      }
      mcpServers[this.serverName] = {
        command: config.command,
        args: config.args,
        ...(config.env ? { env: config.env } : {}),
      };
    } else if (config.mode === 'url') {
      if (!config.url) {
        throw new Error('MCP url mode requires url');
      }
      if (!config.env?.GITHUB_TOKEN) {
        throw new Error('MCP url mode requires GITHUB_TOKEN in env');
      }
      mcpServers[this.serverName] = {
        url: config.url,
        headers: {
          Authorization: `Bearer ${config.env.GITHUB_TOKEN}`,
        },
      };
    }

    this.client = new MultiServerMCPClient({ mcpServers });

    // Initialize connections and get tools
    await this.client.initializeConnections();
    const allTools = await this.client.getTools();

    // Convert to our interface
    this.tools = allTools.map((tool) => ({
      name: tool.name,
      description: tool.description || '',
      invoke: async (args: Record<string, unknown>): Promise<unknown> => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = await tool.invoke(args);
        return result as unknown;
      },
    }));
  }

  listTools(): McpToolLike[] {
    return this.tools;
  }

  findToolByIncludes(includes: string[]): McpToolLike | undefined {
    const lower = includes.map((s) => s.toLowerCase());
    return this.tools.find((t) =>
      lower.some((s) => t.name.toLowerCase().includes(s)),
    );
  }
}
