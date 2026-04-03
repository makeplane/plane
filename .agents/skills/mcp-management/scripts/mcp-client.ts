#!/usr/bin/env node
/**
 * MCP Client - Core client for interacting with MCP servers
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

interface MCPConfig {
  mcpServers: {
    [key: string]: {
      command: string;
      args: string[];
      env?: Record<string, string>;
    };
  };
}

interface ToolInfo {
  serverName: string;
  name: string;
  description: string;
  inputSchema: any;
  outputSchema?: any;
}

interface PromptInfo {
  serverName: string;
  name: string;
  description: string;
  arguments?: any[];
}

interface ResourceInfo {
  serverName: string;
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export class MCPClientManager {
  private config: MCPConfig | null = null;
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();

  async loadConfig(configPath: string = '.claude/.mcp.json'): Promise<MCPConfig> {
    const fullPath = resolve(process.cwd(), configPath);
    const content = await readFile(fullPath, 'utf-8');
    const config = JSON.parse(content) as MCPConfig;
    this.config = config;
    return config;
  }

  async connectToServer(serverName: string): Promise<Client> {
    if (!this.config?.mcpServers[serverName]) {
      throw new Error(`Server ${serverName} not found in config`);
    }

    const serverConfig = this.config.mcpServers[serverName];
    const transport = new StdioClientTransport({
      command: serverConfig.command,
      args: serverConfig.args,
      env: serverConfig.env
    });

    const client = new Client({
      name: `mcp-manager-${serverName}`,
      version: '1.0.0'
    }, { capabilities: {} });

    await client.connect(transport);
    this.clients.set(serverName, client);
    this.transports.set(serverName, transport); // Track transport!
    return client;
  }

  async connectAll(): Promise<void> {
    if (!this.config) {
      throw new Error('Config not loaded. Call loadConfig() first.');
    }

    const serverNames = Object.keys(this.config.mcpServers);
    console.log(`Connecting to ${serverNames.length} servers sequentially...`);

    for (const serverName of serverNames) {
      try {
        await this.connectToServer(serverName);
        console.log(`✓ ${serverName} connected`);
      } catch (error) {
        console.error(`✗ ${serverName} failed:`, error);
        // Continue with other servers
      }
    }
  }

  async getAllTools(): Promise<ToolInfo[]> {
    const allTools: ToolInfo[] = [];
    for (const [serverName, client] of this.clients.entries()) {
      try {
        const response = await client.listTools({}, { timeout: 300000 });
        for (const tool of response.tools) {
          allTools.push({
            serverName,
            name: tool.name,
            description: tool.description || '',
            inputSchema: tool.inputSchema,
            outputSchema: (tool as any).outputSchema
          });
        }
      } catch (error: any) {
        if (error?.code === -32601) {
          console.warn(`${serverName} does not support listTools`);
        } else {
          console.error(`Error from ${serverName}:`, error);
        }
        // Continue with other servers!
      }
    }
    return allTools;
  }

  async getAllPrompts(): Promise<PromptInfo[]> {
    const allPrompts: PromptInfo[] = [];
    for (const [serverName, client] of this.clients.entries()) {
      try {
        const response = await client.listPrompts({}, { timeout: 300000 });
        for (const prompt of response.prompts) {
          allPrompts.push({
            serverName,
            name: prompt.name,
            description: prompt.description || '',
            arguments: prompt.arguments
          });
        }
      } catch (error: any) {
        if (error?.code === -32601) {
          console.warn(`${serverName} does not support listPrompts`);
        } else {
          console.error(`Error from ${serverName}:`, error);
        }
        // Continue with other servers!
      }
    }
    return allPrompts;
  }

  async getAllResources(): Promise<ResourceInfo[]> {
    const allResources: ResourceInfo[] = [];
    for (const [serverName, client] of this.clients.entries()) {
      try {
        const response = await client.listResources({}, { timeout: 300000 });
        for (const resource of response.resources) {
          allResources.push({
            serverName,
            uri: resource.uri,
            name: resource.name,
            description: resource.description,
            mimeType: resource.mimeType
          });
        }
      } catch (error: any) {
        if (error?.code === -32601) {
          console.warn(`${serverName} does not support listResources`);
        } else {
          console.error(`Error from ${serverName}:`, error);
        }
        // Continue with other servers!
      }
    }
    return allResources;
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`Not connected to server: ${serverName}`);
    return await client.callTool(
      { name: toolName, arguments: args },
      undefined,
      { timeout: 300000 }
    );
  }

  async getPrompt(serverName: string, promptName: string, args?: any): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`Not connected to server: ${serverName}`);
    return await client.getPrompt({ name: promptName, arguments: args }, { timeout: 300000 });
  }

  async readResource(serverName: string, uri: string): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`Not connected to server: ${serverName}`);
    return await client.readResource({ uri }, { timeout: 300000 });
  }

  async cleanup(): Promise<void> {
    // Close clients with timeout
    const cleanupPromises: Promise<void>[] = [];
    for (const [serverName, client] of this.clients.entries()) {
      cleanupPromises.push(
        (async () => {
          try {
            await client.close();
          } catch (error) {
            console.warn(`Warning closing ${serverName}:`, error);
          }
        })()
      );
    }

    await Promise.race([
      Promise.all(cleanupPromises),
      new Promise<void>((resolve) => setTimeout(resolve, 5000))
    ]);

    // CRITICAL: Close transports to kill subprocesses
    for (const [serverName, transport] of this.transports.entries()) {
      try {
        await transport.close();
      } catch (error) {
        console.warn(`Warning closing ${serverName} transport:`, error);
      }
    }

    this.clients.clear();
    this.transports.clear();
  }
}
