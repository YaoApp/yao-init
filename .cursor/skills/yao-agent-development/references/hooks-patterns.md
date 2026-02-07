# Hooks Patterns Reference

Common patterns and best practices for Create and Next hooks.

## Hook Signatures

```typescript
function Create(
  ctx: agent.Context,
  messages: agent.Message[],
  options?: Record<string, any>
): agent.Create | null;

function Next(
  ctx: agent.Context,
  payload: agent.Payload,
  options?: Record<string, any>
): agent.Next | null;
```

## Create Hook Return

```typescript
interface CreateResponse {
  messages?: Message[];           // Modified messages
  temperature?: number;           // Override temperature
  max_tokens?: number;            // Max tokens
  connector?: string;             // Override connector
  prompt_preset?: string;         // Prompt preset name
  disable_global_prompts?: boolean;
  mcp_servers?: MCPServerConfig[];
  uses?: { search?: string };     // "disabled" | "<agent>"
  locale?: string;
  metadata?: Record<string, any>;
  
  // Or delegate
  delegate?: {
    agent_id: string;
    messages: Message[];
    options?: Record<string, any>;
  };
}
```

## Next Hook Payload

```typescript
interface Payload {
  messages: Message[];            // Messages sent to LLM
  completion?: {
    content: string;              // LLM response
    tool_calls?: ToolCall[];      // Requested tool calls
    usage?: UsageInfo;
  };
  tools?: ToolCallResponse[];     // Tool results
  error?: string;                 // Error if LLM failed
}

interface ToolCallResponse {
  toolcall_id: string;
  server: string;
  tool: string;
  arguments?: any;
  result?: any;
  error?: string;
}
```

## Next Hook Return

```typescript
interface NextResponse {
  delegate?: {
    agent_id: string;
    messages: Message[];
    options?: Record<string, any>;
  };
  data?: any;                     // Custom return data
  metadata?: Record<string, any>;
}
```

---

## Pattern: System Initialization

Check and initialize system state before processing.

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  if (!SystemReady(ctx)) {
    ctx.Send("⚙️ Initializing system...");
    Setup(ctx);
  }
  return { messages };
}

function SystemReady(ctx: agent.Context): boolean {
  const ownerID = ctx.authorized?.team_id || ctx.authorized?.user_id;
  if (!ownerID) return false;
  
  try {
    const records = Process("models.agents.myapp.setting.Get", {
      wheres: [{ column: "user_id", value: ownerID }],
      limit: 1,
    });
    return Array.isArray(records) && records.length > 0;
  } catch (e) {
    return false;
  }
}

function Setup(ctx: agent.Context): void {
  const ownerID = ctx.authorized?.team_id || ctx.authorized?.user_id;
  Process("models.agents.myapp.setting.Create", {
    user_id: ownerID,
    initialized: true,
    __yao_created_by: ctx.authorized?.user_id,
    __yao_team_id: ctx.authorized?.team_id,
  });
}
```

---

## Pattern: Loading Indicator

Show loading state during processing.

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  const loadingId = ctx.Send({
    type: "loading",
    props: { message: isChinese(ctx) ? "处理中..." : "Processing..." },
  });
  ctx.memory.context.Set("loading_id", loadingId);
  ctx.memory.context.Set("start_time", Date.now());
  
  return { messages };
}

function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const loadingId = ctx.memory.context.Get("loading_id");
  const isZh = isChinese(ctx);
  
  const closeLoading = (message: string, success = true) => {
    if (loadingId) {
      ctx.Replace(loadingId, {
        type: "loading",
        props: {
          message: success ? `✅ ${message}` : `❌ ${message}`,
          done: true,
        },
      });
    }
  };
  
  if (payload.error) {
    closeLoading(isZh ? "处理失败" : "Processing failed", false);
    return { data: { status: "error", message: payload.error } };
  }
  
  closeLoading(isZh ? "处理完成" : "Processing complete");
  return null;
}

function isChinese(ctx: agent.Context): boolean {
  const locale = ctx.locale?.toLowerCase() || "";
  return locale.startsWith("zh") || locale === "cn";
}
```

---

## Pattern: Intent-Based Routing

Route to different agents based on detected intent.

```typescript
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const { tools, error } = payload;
  
  if (error) {
    return { data: { status: "error", message: error } };
  }
  
  if (tools && tools.length > 0) {
    const result = tools[0].result;
    const intent = result?.intent;
    
    if (intent) {
      // Show what was understood
      ctx.Send(`📝 Detected intent: **${intent}**`);
      
      // Delegate to specialized agent
      return {
        delegate: {
          agent_id: `myapp.${intent}`,  // e.g., myapp.query, myapp.submit
          messages: payload.messages,
        },
      };
    }
  }
  
  return null;
}
```

---

## Pattern: Multi-Turn Self-Delegation

Handle multi-phase tasks by delegating to self.

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  // Check if this is a continuation
  const phase = ctx.memory.context.Get("phase") || "initial";
  
  if (phase === "initial") {
    ctx.memory.context.Set("phase", "processing");
    ctx.memory.context.Set("start_time", Date.now());
  }
  
  return { messages };
}

function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const phase = ctx.memory.context.Get("phase");
  
  if (phase === "processing") {
    const { tools } = payload;
    
    if (tools && tools[0]?.result?.needs_review) {
      // Continue to review phase
      ctx.memory.context.Set("phase", "reviewing");
      ctx.memory.context.Set("data", tools[0].result.data);
      
      return {
        delegate: {
          agent_id: ctx.assistant_id,  // Self-delegation
          messages: [
            { role: "user", content: "Please review the result" },
          ],
        },
      };
    }
  }
  
  if (phase === "reviewing") {
    // Final phase
    const data = ctx.memory.context.Get("data");
    const duration = Date.now() - ctx.memory.context.Get("start_time");
    
    return {
      data: {
        status: "success",
        data,
        duration_ms: duration,
      },
    };
  }
  
  return null;
}
```

---

## Pattern: Streaming Results

Output results progressively.

```typescript
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const { tools, error } = payload;
  
  if (error) {
    ctx.Send(`❌ Error: ${error}`);
    return { data: { status: "error" } };
  }
  
  if (tools && tools.length > 0) {
    const msgId = ctx.SendStream("## Results\n\n");
    
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      ctx.Append(msgId, `### ${i + 1}. ${tool.tool}\n`);
      
      if (tool.error) {
        ctx.Append(msgId, `❌ Error: ${tool.error}\n\n`);
      } else {
        ctx.Append(msgId, `${formatResult(tool.result)}\n\n`);
      }
    }
    
    ctx.End(msgId);
    
    return {
      data: {
        status: "success",
        tool_count: tools.length,
      },
    };
  }
  
  return null;
}

function formatResult(result: any): string {
  if (typeof result === "string") return result;
  return "```json\n" + JSON.stringify(result, null, 2) + "\n```";
}
```

---

## Pattern: Error Recovery with Retry

Handle errors and retry with guidance.

```typescript
const MAX_RETRIES = 3;

function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const { tools, error } = payload;
  const retryCount = ctx.memory.context.Get("retry_count") || 0;
  
  // Check for validation errors in tool results
  const validationError = tools?.find(t => t.result?.validation_error);
  
  if (validationError && retryCount < MAX_RETRIES) {
    ctx.memory.context.Set("retry_count", retryCount + 1);
    
    ctx.Send(`⚠️ Validation error: ${validationError.result.validation_error}`);
    ctx.Send(`Retry ${retryCount + 1}/${MAX_RETRIES}...`);
    
    // Continue conversation with error info
    return {
      delegate: {
        agent_id: ctx.assistant_id,
        messages: [
          {
            role: "user",
            content: `Fix this error: ${validationError.result.validation_error}`,
          },
        ],
      },
    };
  }
  
  if (retryCount >= MAX_RETRIES) {
    ctx.memory.context.Del("retry_count");
    ctx.Send("❌ Max retries exceeded. Please try with different input.");
    return { data: { status: "max_retries_exceeded" } };
  }
  
  // Success - clear retry count
  ctx.memory.context.Del("retry_count");
  return null;
}
```

---

## Pattern: Parallel Agent Execution

Call multiple agents in parallel.

```typescript
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const { tools } = payload;
  
  if (tools && tools[0]?.result?.items) {
    const items = tools[0].result.items;
    
    // Process items in parallel
    const results = ctx.agent.All(
      items.map((item, i) => ({
        agent: "myapp.processor",
        messages: [
          { role: "user", content: `Process item ${i}: ${JSON.stringify(item)}` },
        ],
      })),
      {
        onChunk: (agentId, index, msg) => {
          console.log(`Agent ${agentId}[${index}]:`, msg.type);
          return 0;
        },
      }
    );
    
    // Collect results
    const processed = results.map((r, i) => ({
      index: i,
      success: !r.error,
      data: r.content,
    }));
    
    return {
      data: {
        status: "success",
        processed,
      },
    };
  }
  
  return null;
}
```

---

## Pattern: Navigate to Page

Open a custom page after processing.

```typescript
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const { tools } = payload;
  
  if (tools && tools[0]?.result?.success) {
    const result = tools[0].result;
    
    // Navigate to result page
    ctx.Send({
      type: "action",
      props: {
        name: "navigate",
        payload: {
          route: `/agents/${ctx.assistant_id}/result`,
          title: "Results",
          query: { id: result.id },
        },
      },
    });
    
    return {
      data: { status: "success", redirected: true },
    };
  }
  
  return null;
}
```

---

## Best Practices

1. **Always handle errors** - Check `payload.error` and tool errors
2. **Use memory.context** - Pass data between Create and Next hooks
3. **Clear state on completion** - Clean up retry counts, temp data
4. **Provide user feedback** - Use loading indicators, progress messages
5. **Validate tool results** - Don't assume tool calls succeed
6. **Handle locale** - Support multiple languages in messages
7. **Log for debugging** - Use `ctx.trace` for visibility
8. **Keep hooks focused** - Delegate complex logic to tools/agents
