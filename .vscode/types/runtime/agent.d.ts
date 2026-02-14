/**
 * Agent namespace for Yao Agent Hook scripts.
 * Defines the context, hooks, messages, and sub-APIs exposed to JavaScript via V8.
 *
 * Hook scripts are defined in `src/index.ts` of each assistant directory.
 * Available hooks: Create, Next
 *
 * @example
 * ```ts
 * import { agent, Process } from "@yao/runtime";
 *
 * export function Create(ctx: agent.Context, messages: agent.Message[], options: agent.HookOptions): agent.Create {
 *   return { messages };
 * }
 *
 * export function Next(ctx: agent.Context, payload: agent.Payload, options: agent.HookOptions): agent.Next {
 *   return { data: { status: "ok" } };
 * }
 * ```
 */
export declare namespace agent {
  // ==================== Context ====================

  /**
   * The agent context object passed to Hook functions.
   * Provides access to session state, messaging, memory, sandbox, sub-APIs, and more.
   * Created by Go `context.Context.NewObject()` (agent/context/jsapi.go).
   */
  export interface Context {
    /** Chat session ID */
    chat_id: string;
    /** Assistant ID */
    assistant_id: string;
    /** Locale setting (e.g., "en-us", "zh-cn") */
    locale: string;
    /** UI theme */
    theme: string;
    /** Request referer */
    referer: string;
    /** Accept format (e.g., "standard") */
    accept: string;
    /** Route path */
    route: string;

    /** Client information */
    client: {
      /** Client type (e.g., "web", "mobile", "test") */
      type: string;
      /** Client user agent string */
      user_agent: string;
      /** Client IP address */
      ip: string;
    };

    /** Custom metadata (key-value store, shared across hooks) */
    metadata: Record<string, any>;

    /** Authorized user information */
    authorized: {
      /** Subject identifier (JWT sub) */
      subject?: string;
      /** User ID */
      user_id?: string;
      /** Team ID */
      team_id?: string;
      /** Tenant ID */
      tenant_id?: string;
      /** Client ID (OAuth) */
      client_id?: string;
      /** Session ID */
      session_id?: string;
      /** Access scope */
      scope?: string;
      /** Remember me flag */
      remember_me?: boolean;
      /** Data access constraints */
      constraints?: {
        owner_only?: boolean;
        creator_only?: boolean;
        editor_only?: boolean;
        team_only?: boolean;
        extra?: Record<string, any>;
      };
    };

    // ---- Output methods ----

    /**
     * Send a message to the client stream.
     * Automatically generates MessageID/BlockID and flushes output.
     * @param message - A string (shorthand for text) or a message object
     * @param blockId - Optional block ID to group messages
     * @returns The generated message_id
     */
    Send(message: string | OutputMessage, blockId?: string): string;

    /**
     * Start a streaming message that can be appended to.
     * Must be finalized with `ctx.End(msgId)`.
     * @param message - Initial message content
     * @param blockId - Optional block ID
     * @returns The generated message_id
     */
    SendStream(message: string | OutputMessage, blockId?: string): string;

    /**
     * Replace an existing message entirely (delta replace).
     * @param messageId - The message ID to replace
     * @param message - New message content
     * @returns The message_id
     */
    Replace(messageId: string, message: string | OutputMessage): string;

    /**
     * Append content to an existing message (delta append).
     * @param messageId - The message ID to append to
     * @param content - Content to append
     * @param path - Optional JSON path (e.g., "props.content")
     * @returns The message_id
     */
    Append(messageId: string, content: string | OutputMessage, path?: string): string;

    /**
     * Merge data into an existing message object (delta merge).
     * @param messageId - The message ID to merge into
     * @param data - Data to merge
     * @param path - Optional JSON path (e.g., "props")
     * @returns The message_id
     */
    Merge(messageId: string, data: OutputMessage | Record<string, any>, path?: string): string;

    /**
     * Set a field value in an existing message (delta set).
     * @param messageId - The message ID
     * @param data - Value to set
     * @param path - Required JSON path (e.g., "props.status")
     * @returns The message_id
     */
    Set(messageId: string, data: any, path: string): string;

    /**
     * Finalize a streaming message started with SendStream().
     * @param messageId - The message ID to finalize
     * @param finalContent - Optional final content to append before ending
     * @returns The message_id
     */
    End(messageId: string, finalContent?: string): string;

    /**
     * End a message block.
     * @param blockId - The block ID to end
     */
    EndBlock(blockId: string): void;

    // ---- ID generators ----

    /** Generate a unique message ID (e.g., "M1", "M2") */
    MessageID(): string;
    /** Generate a unique block ID (e.g., "B1", "B2") */
    BlockID(): string;
    /** Generate a unique thread ID (e.g., "T1", "T2") */
    ThreadID(): string;

    // ---- Release ----

    /** Release the context (cleanup Go-side resources) */
    Release(): void;

    // ---- Sub-objects ----

    /** Memory - persistent key-value store with four namespaces */
    memory: Memory;

    /** Sandbox - file system and command execution in isolated environment (only available when sandbox is configured) */
    sandbox?: Sandbox;

    /** MCP - Model Context Protocol operations */
    mcp: MCP;

    /** Search - web, knowledge base, and database search */
    search: SearchAPI;

    /** Agent - call other agents */
    agent: AgentAPI;

    /** LLM - direct LLM calls */
    llm: LlmAPI;

    /** Trace - distributed tracing */
    trace: Trace;
  }

  // ==================== Memory ====================

  /**
   * Memory provides persistent key-value storage with four namespaces.
   * Each namespace supports: Get, Set, Del, Has, Keys, Len, Clear, Incr, Decr, GetDel
   */
  export interface Memory {
    /** User-scoped storage (persists across chats for the same user) */
    user: MemoryNamespace;
    /** Team-scoped storage (shared across team members) */
    team: MemoryNamespace;
    /** Chat-scoped storage (persists within a single chat session) */
    chat: MemoryNamespace;
    /** Context-scoped storage (persists within a single request lifecycle) */
    context: MemoryNamespace;
  }

  /** A single memory namespace with KV store methods */
  export interface MemoryNamespace {
    /** Get a value by key. Returns null if not found. */
    Get(key: string): any;
    /** Set a value. Optional TTL in milliseconds. */
    Set(key: string, value: any, ttlMs?: number): void;
    /** Delete a key */
    Del(key: string): void;
    /** Check if a key exists */
    Has(key: string): boolean;
    /** Get all keys */
    Keys(): string[];
    /** Get the number of entries */
    Len(): number;
    /** Clear all entries */
    Clear(): void;
    /** Increment a numeric value. Returns the new value. */
    Incr(key: string, delta?: number): number;
    /** Decrement a numeric value. Returns the new value. */
    Decr(key: string, delta?: number): number;
    /** Get a value and delete it immediately. Returns null if not found. */
    GetDel(key: string): any;
  }

  // ==================== Sandbox ====================

  /** Sandbox provides isolated file system and command execution */
  export interface Sandbox {
    /** Working directory path inside the sandbox */
    workdir: string;
    /** Sandbox container ID */
    sandbox_id: string;
    /** VNC URL for browser preview (empty if not available) */
    vnc_url: string;

    /**
     * Read a file from the sandbox
     * @param path - File path relative to workdir
     * @returns File content as string
     */
    ReadFile(path: string): string;

    /**
     * Write a file to the sandbox
     * @param path - File path relative to workdir
     * @param content - Content to write
     */
    WriteFile(path: string, content: string): void;

    /**
     * List directory contents
     * @param path - Directory path
     * @returns Array of file info objects
     */
    ListDir(path: string): Array<{ name: string; size: number; is_dir: boolean }>;

    /**
     * Execute a command in the sandbox
     * @param cmd - Command as array of strings (e.g., ["ls", "-la"])
     * @returns Command output as string
     */
    Exec(cmd: string[]): string;

    /** Get the VNC URL */
    GetVNCUrl(): string;

    /** Get the sandbox ID */
    GetSandboxID(): string;
  }

  // ==================== MCP ====================

  /** MCP (Model Context Protocol) operations */
  export interface MCP {
    // ---- Resource operations ----

    /** List resources from an MCP server */
    ListResources(mcp: string, cursor?: string): any;
    /** Read a resource by URI */
    ReadResource(mcp: string, uri: string): any;

    // ---- Tool operations ----

    /** List available tools from an MCP server */
    ListTools(mcp: string, cursor?: string): any;
    /**
     * Call a single tool
     * @returns Parsed tool result
     */
    CallTool(mcp: string, name: string, args?: Record<string, any>): any;
    /** Call multiple tools sequentially */
    CallTools(mcp: string, tools: Array<{ name: string; arguments?: Record<string, any> }>): any[];
    /** Call multiple tools in parallel */
    CallToolsParallel(mcp: string, tools: Array<{ name: string; arguments?: Record<string, any> }>): any[];

    // ---- Cross-server parallel operations (Promise-like) ----

    /** Execute tool calls across multiple MCP servers, wait for all (like Promise.all) */
    All(requests: Array<{ mcp: string; tool: string; arguments?: any }>): any[];
    /** Return when any succeeds (like Promise.any) */
    Any(requests: Array<{ mcp: string; tool: string; arguments?: any }>): any[];
    /** Return when any completes (like Promise.race) */
    Race(requests: Array<{ mcp: string; tool: string; arguments?: any }>): any[];

    // ---- Prompt operations ----

    /** List available prompts */
    ListPrompts(mcp: string, cursor?: string): any;
    /** Get a specific prompt */
    GetPrompt(mcp: string, name: string, args?: Record<string, any>): any;

    // ---- Sample operations ----

    /** List available samples */
    ListSamples(mcp: string, type: string, name: string): any;
    /** Get a specific sample */
    GetSample(mcp: string, type: string, name: string, index: number): any;
  }

  // ==================== Search API ====================

  /** Search API for web, knowledge base, and database search */
  export interface SearchAPI {
    /**
     * Web search
     * @param query - Search query
     * @param options - Search options (limit, sites, time_range, rerank)
     */
    Web(query: string, options?: {
      limit?: number;
      sites?: string[];
      time_range?: "day" | "week" | "month" | "year";
      rerank?: { top_n: number };
    }): any;

    /**
     * Knowledge base search
     * @param query - Search query
     * @param options - Search options (collections, threshold, limit, graph, rerank)
     */
    KB(query: string, options?: {
      collections?: string[];
      threshold?: number;
      limit?: number;
      graph?: boolean;
      rerank?: { top_n: number };
    }): any;

    /**
     * Database search
     * @param query - Search query
     * @param options - Search options (models, wheres, orders, select, limit, rerank)
     */
    DB(query: string, options?: {
      models?: string[];
      wheres?: any[];
      orders?: any[];
      select?: string[];
      limit?: number;
      rerank?: { top_n: number };
    }): any;

    /** Execute all searches and wait for all (like Promise.all) */
    All(requests: Array<{ type: "web" | "kb" | "db"; query: string; [key: string]: any }>): any[];
    /** Return when any succeeds (like Promise.any) */
    Any(requests: Array<{ type: "web" | "kb" | "db"; query: string; [key: string]: any }>): any[];
    /** Return when any completes (like Promise.race) */
    Race(requests: Array<{ type: "web" | "kb" | "db"; query: string; [key: string]: any }>): any[];
  }

  // ==================== Agent API ====================

  /** Agent API for calling other agents */
  export interface AgentAPI {
    /**
     * Call a single agent
     * @param agentID - Target agent ID
     * @param messages - Messages to send
     * @param options - Call options (connector, onChunk, etc.)
     * @returns { agent_id, response, content, error }
     */
    Call(
      agentID: string,
      messages: Array<{ role: string; content: any }>,
      options?: {
        connector?: string;
        /** Streaming callback: return non-zero to stop */
        onChunk?: (msg: any) => number;
        [key: string]: any;
      }
    ): { agent_id: string; response: any; content: any; error?: string };

    /** Execute all agent calls and wait for all (like Promise.all) */
    All(
      requests: Array<{ agent: string; messages: Array<{ role: string; content: any }>; options?: Record<string, any> }>,
      options?: { onChunk?: (agentID: string, index: number, msg: any) => number }
    ): any[];

    /** Return when any succeeds (like Promise.any) */
    Any(
      requests: Array<{ agent: string; messages: Array<{ role: string; content: any }>; options?: Record<string, any> }>,
      options?: { onChunk?: (agentID: string, index: number, msg: any) => number }
    ): any[];

    /** Return when any completes (like Promise.race) */
    Race(
      requests: Array<{ agent: string; messages: Array<{ role: string; content: any }>; options?: Record<string, any> }>,
      options?: { onChunk?: (agentID: string, index: number, msg: any) => number }
    ): any[];
  }

  // ==================== LLM API ====================

  /** LLM API for direct LLM calls */
  export interface LlmAPI {
    /**
     * Call LLM with streaming output
     * @param connector - Connector ID (e.g., "gpt-4o", "claude-3")
     * @param messages - Chat messages
     * @param options - LLM options (temperature, onChunk, etc.)
     * @returns { connector, response, content, error }
     */
    Stream(
      connector: string,
      messages: Array<{ role: string; content: any }>,
      options?: {
        temperature?: number;
        max_tokens?: number;
        /** Streaming callback: return non-zero to stop */
        onChunk?: (msg: any) => number;
        [key: string]: any;
      }
    ): { connector: string; response: any; content: any; error?: string };

    /** Execute all LLM calls and wait for all (like Promise.all) */
    All(
      requests: Array<{ connector: string; messages: Array<{ role: string; content: any }>; options?: Record<string, any> }>,
      options?: { onChunk?: (connectorID: string, index: number, msg: any) => number }
    ): any[];

    /** Return when any succeeds (like Promise.any) */
    Any(
      requests: Array<{ connector: string; messages: Array<{ role: string; content: any }>; options?: Record<string, any> }>,
      options?: { onChunk?: (connectorID: string, index: number, msg: any) => number }
    ): any[];

    /** Return when any completes (like Promise.race) */
    Race(
      requests: Array<{ connector: string; messages: Array<{ role: string; content: any }>; options?: Record<string, any> }>,
      options?: { onChunk?: (connectorID: string, index: number, msg: any) => number }
    ): any[];
  }

  // ==================== Trace ====================

  /** Trace provides distributed tracing support */
  export interface Trace {
    /** Start a new trace span */
    Start(name: string, attributes?: Record<string, any>): any;
    /** End the current trace span */
    End(result?: any): void;
    /** Add an event to the current span */
    Event(name: string, attributes?: Record<string, any>): void;
    /** Release trace resources */
    Release(): void;
  }

  // ==================== Message Types ====================

  /**
   * OpenAI-compatible chat message (input).
   * Supports: developer, system, user, assistant, tool roles.
   */
  export interface Message {
    /** Message author role */
    role: "developer" | "system" | "user" | "assistant" | "tool";
    /** Message content: string or array of ContentPart for multimodal */
    content?: string | ContentPart[] | any;
    /** Optional participant name */
    name?: string;
    /** Tool call ID (required for tool messages) */
    tool_call_id?: string;
    /** Tool calls generated by the model (assistant messages) */
    tool_calls?: ToolCall[];
    /** Refusal message (assistant messages) */
    refusal?: string;
  }

  /** Content part for multimodal messages */
  export interface ContentPart {
    /** Content type */
    type: "text" | "image_url" | "input_audio" | "file" | "data";
    /** Text content (for type "text") */
    text?: string;
    /** Image URL (for type "image_url") */
    image_url?: { url: string; detail?: "auto" | "low" | "high" };
    /** Audio data (for type "input_audio") */
    input_audio?: { data: string; format: "wav" | "mp3" };
    /** File info (for type "file") */
    file?: { file_id?: string; filename?: string };
    /** Generic data */
    [key: string]: any;
  }

  /** Tool call from assistant response */
  export interface ToolCall {
    /** Tool call ID */
    id: string;
    /** Tool type (always "function") */
    type: "function";
    /** Function details */
    function: { name: string; arguments: string };
  }

  /** Output message for ctx.Send() */
  export interface OutputMessage {
    /** Message type (e.g., "text", "action", "error") */
    type?: string;
    /** Message properties */
    props?: Record<string, any>;
    /** Message ID (auto-generated if not set) */
    message_id?: string;
    /** Block ID for grouping */
    block_id?: string;
    /** Actions */
    actions?: Array<{ name?: string; type: string; payload?: any }>;
    /** Attachments */
    attachments?: Attachment[];
    /** Any additional fields */
    [key: string]: any;
  }

  /** File attachment */
  export interface Attachment {
    /** Name of the attachment */
    name?: string;
    /** URL to access the attachment */
    url?: string;
    /** Type of the attachment */
    type?: string;
    /** MIME type */
    content_type?: string;
    /** Size in bytes */
    bytes?: number;
    /** Creation timestamp */
    created_at?: number;
    /** Unique file identifier */
    file_id?: string;
    /** Chat ID */
    chat_id?: string;
    /** Assistant ID */
    assistant_id?: string;
  }

  // ==================== Hook Types ====================

  /** Options map passed to hook functions (3rd argument) */
  export type HookOptions = Record<string, any>;

  /**
   * Create hook return type (HookCreateResponse).
   * Return null/undefined to use defaults.
   */
  export type Create =
    | {
        /** Override messages to send to LLM */
        messages?: Message[];
        /** Audio configuration */
        audio?: { voice?: string; format?: string };
        /** Override temperature */
        temperature?: number;
        /** Override max tokens */
        max_tokens?: number;
        /** Override max completion tokens */
        max_completion_tokens?: number;
        /** Add/override MCP servers */
        mcp_servers?: Array<{ server_id: string; [key: string]: any }>;
        /** Select prompt preset (e.g., "chat.friendly") */
        prompt_preset?: string;
        /** Disable global prompts for this request */
        disable_global_prompts?: boolean;
        /** Override connector */
        connector?: string;
        /** Override locale */
        locale?: string;
        /** Override theme */
        theme?: string;
        /** Override route */
        route?: string;
        /** Override/merge metadata */
        metadata?: Record<string, any>;
        /** Override wrapper configurations (vision, audio, search, fetch) */
        uses?: Record<string, any>;
        /** Force using wrapper tools regardless of model capabilities */
        force_uses?: boolean;
        /** Control search behavior: true/false or fine-grained SearchIntent */
        search?: boolean | Record<string, any>;
        /** Delegate to another agent immediately (skip LLM) */
        delegate?: { agent_id: string; messages: Message[]; options?: Record<string, any> };
      }
    | null
    | void;

  /**
   * Next hook payload (2nd argument to Next function).
   * Contains the completion result, tool calls, and any errors.
   */
  export interface Payload {
    /** Messages that were sent */
    messages?: Message[];
    /** LLM completion response */
    completion?: {
      /** Response content */
      content?: any;
      /** Finish reason */
      finish_reason?: string;
      /** Token usage */
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      /** Model used */
      model?: string;
    };
    /** Tool call results */
    tools?: Array<{
      toolcall_id: string;
      server: string;
      tool: string;
      arguments?: any;
      result?: any;
      error?: string;
    }>;
    /** Error message if the completion failed */
    error?: string;
  }

  /**
   * Next hook return type (NextHookResponse).
   * Return null/undefined for standard completion response.
   */
  export type Next =
    | {
        /** Delegate to another agent (recursive call) */
        delegate?: { agent_id: string; messages: Message[]; options?: Record<string, any> };
        /** Custom response data to return to user */
        data?: any;
        /** Additional metadata */
        metadata?: Record<string, any>;
      }
    | null
    | void;
}
