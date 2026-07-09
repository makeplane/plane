# Common Patterns

## AI Code Execution with Code Context

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { code, variables } = await request.json();
    const sandbox = getSandbox(env.Sandbox, 'ai-agent');
    
    // Create context with persistent variables
    const ctx = await sandbox.createCodeContext({
      language: 'python',
      variables: variables || {}
    });
    
    // Execute with rich outputs (text, images, HTML)
    const result = await sandbox.runCode(code, { context: ctx });
    
    return Response.json({
      results: result.results,  // RichOutput[] (text, html, png, json, etc.)
      error: result.error,
      success: !result.error
    });
  }
};
```

## Interactive Dev Environment

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const proxyResponse = await proxyToSandbox(request, env);
    if (proxyResponse) return proxyResponse;
    
    const sandbox = getSandbox(env.Sandbox, 'ide', { normalizeId: true });
    
    if (request.url.endsWith('/start')) {
      await sandbox.exec('curl -fsSL https://code-server.dev/install.sh | sh');
      await sandbox.startProcess('code-server --bind-addr 0.0.0.0:8080', {
        processId: 'vscode'
      });
      
      const exposed = await sandbox.exposePort(8080);
      return Response.json({ url: exposed.url });
    }
    
    return new Response('Try /start');
  }
};
```

## WebSocket Real-Time Service

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const proxyResponse = await proxyToSandbox(request, env);
    if (proxyResponse) return proxyResponse;

    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const sandbox = getSandbox(env.Sandbox, 'realtime-service');
      return await sandbox.wsConnect(request, 8080);
    }

    // Non-WebSocket: expose preview URL
    const sandbox = getSandbox(env.Sandbox, 'realtime-service');
    const { url } = await sandbox.exposePort(8080, {
      hostname: new URL(request.url).hostname
    });
    return Response.json({ wsUrl: url.replace('https', 'wss') });
  }
};
```

**Dockerfile**:
```dockerfile
FROM docker.io/cloudflare/sandbox:0.7.0
RUN npm install -g ws
EXPOSE 8080
```

## Process Readiness Pattern

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const sandbox = getSandbox(env.Sandbox, 'app-server');
    
    // Start server
    const process = await sandbox.startProcess(
      'node server.js',
      { processId: 'server' }
    );
    
    // Wait for server to be ready
    await process.waitForPort(8080);  // Wait for port listening
    
    // Now safe to expose
    const { url } = await sandbox.exposePort(8080);
    return Response.json({ url });
  }
};
```

## Persistent Data with Bucket Mounting

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const sandbox = getSandbox(env.Sandbox, 'data-processor');
    
    // Mount R2 bucket (production only)
    await sandbox.mountBucket(env.DATA_BUCKET, '/data', {
      readOnly: false
    });
    
    // Process files in bucket
    const result = await sandbox.exec('python3 /workspace/process.py', {
      env: { DATA_DIR: '/data/input' }
    });
    
    // Results written to /data/output are persisted in R2
    return Response.json({ success: result.success });
  }
};
```

## CI/CD Pipeline

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { repo, branch } = await request.json();
    const sandbox = getSandbox(env.Sandbox, `ci-${repo}-${Date.now()}`);
    
    await sandbox.exec(`git clone -b ${branch} ${repo} /workspace/repo`);
    
    const install = await sandbox.exec('npm install', {
      cwd: '/workspace/repo',
      stream: true,
      onOutput: (stream, data) => console.log(data)
    });
    
    if (!install.success) {
      return Response.json({ success: false, error: 'Install failed' });
    }
    
    const test = await sandbox.exec('npm test', { cwd: '/workspace/repo' });
    
    return Response.json({
      success: test.success,
      output: test.stdout,
      exitCode: test.exitCode
    });
  }
};
```





## Multi-Tenant Pattern

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const userId = request.headers.get('X-User-ID');
    const sandbox = getSandbox(env.Sandbox, 'multi-tenant');
    
    // Each user gets isolated session
    let session;
    try {
      session = await sandbox.getSession(userId);
    } catch {
      session = await sandbox.createSession({
        id: userId,
        cwd: `/workspace/users/${userId}`,
        env: { USER_ID: userId }
      });
    }
    
    const code = await request.text();
    const result = await session.exec(`python3 -c "${code}"`);
    
    return Response.json({ output: result.stdout });
  }
};
```

## Git Operations

```typescript
// Clone repo
await sandbox.exec('git clone https://github.com/user/repo.git /workspace/repo');

// Authenticated (use env secrets)
await sandbox.exec(`git clone https://${env.GITHUB_TOKEN}@github.com/user/repo.git`);
```
