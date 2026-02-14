// TypeScript Declarations for YAO Pure JavaScript SDK
// Author: Max <max@iqka.com>
// Maintainer: https://yaoapps.com

/**
 * The data fetched from the server.
 */
export declare const __sui_data: Record<string, any>;

/**
 * The localized messages and settings.
 */
export declare function __m(message: string): string;

/**
 * Translate a message key to the current locale.
 * Alias for __m() — shorter and more convenient for use in code.
 *
 * @example
 * T("Save")          // => "保存" (zh-cn) or "Save" (en-us)
 * T("Hello %s")      // => "你好 %s" — use .replace() for interpolation
 */
export declare function T(message: string): string;

// @ts-ignore: Ignore the specific error
export declare const arguments: any[] = [];

/**
 * Headers object for requests.
 */
export type Headers =
  | Record<string, string>
  | Record<string, string | string[]>;

/**
 * Localized messages and settings interface.
 */
export declare interface Locale {
  /**
   * Locale name, e.g., "en-US".
   */
  name?: string;

  /**
   * Key-value pairs for translations.
   */
  keys?: Record<string, string>;

  /**
   * Message templates or labels.
   */
  messages?: Record<string, string>;

  /**
   * Text direction (left-to-right or right-to-left).
   */
  direction?: "ltr" | "rtl";

  /**
   * Timezone, formatted as UTC offsets (e.g., "+05:30").
   */
  timezone?:
    | "-12:00"
    | "-11:00"
    | "-10:00"
    | "-09:30"
    | "-09:00"
    | "-08:00"
    | "-07:00"
    | "-06:00"
    | "-05:00"
    | "-04:30"
    | "-04:00"
    | "-03:30"
    | "-03:00"
    | "-02:00"
    | "-01:00"
    | "+00:00"
    | "+01:00"
    | "+02:00"
    | "+03:00"
    | "+03:30"
    | "+04:00"
    | "+04:30"
    | "+05:00"
    | "+05:30"
    | "+05:45"
    | "+06:00"
    | "+06:30"
    | "+07:00"
    | "+08:00"
    | "+08:45"
    | "+09:00"
    | "+09:30"
    | "+10:00"
    | "+10:30"
    | "+11:00"
    | "+12:00"
    | "+12:45"
    | "+13:00"
    | "+14:00";
}

/**
 * Component type definition for modular UI components.
 */
export declare type Component = {
  /**
   * The root HTML element of the component.
   */
  root: HTMLElement;

  /**
   * Component state management interface.
   */
  state: ComponentState;

  /**
   * Component store for state persistence.
   */
  store: ComponentStore;

  /**
   * Query object for DOM traversal and manipulation.
   */
  $root: SUIQuery;

  /**
   * Find an element inside the component.
   */
  find: (selector: string | HTMLElement) => SUIQuery | null;

  /**
   * Query a single matching element.
   */
  query: (selector: string) => HTMLElement | null;

  /**
   * Query all matching elements.
   */
  queryAll: (selector: string) => NodeListOf<Element> | null;

  /**
   * Emit an event.
   */
  emit: (name: string, detail?: EventData) => void;

  /**
   * Render a partial view with data.
   */
  render: (
    name: string,
    data: Record<string, any>,
    option?: RenderOption
  ) => Promise<string>;

  /**
   * Optional lifecycle method called once.
   */
  once?: () => void;

  /**
   * State watchers for reactive updates.
   */
  watch?: Record<string, (value?: any) => void>;

  /**
   * Optional constants for the component.
   */
  Constants?: Record<string, any>;

  [key: string]: any;
};

/**
 * Options for rendering components.
 */
export declare type RenderOption = {
  /**
   * Target container for rendering.
   */
  target?: HTMLElement;

  /**
   * Show loader during rendering.
   */
  showLoader?: HTMLElement | string | boolean;

  /**
   * Whether to replace the existing content.
   */
  replace?: boolean;

  /**
   * Whether to include page data in rendering.
   */
  withPageData?: boolean;

  /**
   * The route of the component.
   */
  route?: string;
};

/**
 * Interface for managing component state.
 */
export declare type ComponentState = {
  /**
   * Set a state property.
   */
  Set: (key: string, value?: any) => void;
};

/**
 * Interface for managing component store data.
 */
export declare type ComponentStore = {
  /**
   * Get a value by key.
   */
  Get: (key: string) => string;

  /**
   * Set a value by key.
   */
  Set: (key: string, value: string) => void;

  /**
   * Get JSON data by key.
   */
  GetJSON: (key: string) => any;

  /**
   * Set JSON data by key.
   */
  SetJSON: (key: string, value: any) => void;

  /**
   * Retrieve all data.
   */
  GetData: () => Record<string, any>;
};

/**
 * Helper function to retrieve a component by root element or selector.
 */
export declare const $$: (selector: HTMLElement | string) => Component;

/**
 * Data structure for event details.
 */
export declare type EventDetail<T = HTMLElement> = {
  /**
   * Root element of the component.
   */
  rootElement: HTMLElement;

  /**
   * Event target element.
   */
  targetElement: T;
};

/**
 * Generic type for event data.
 */
export declare type EventData = Record<string, any>;

/**
 * State object for event propagation.
 */
export declare type State = {
  /**
   * Target element.
   */
  target: HTMLElement;

  /**
   * Stop event propagation.
   */
  stopPropagation(): void;
};

/**
 * Create a rendering instance for a component.
 */
export declare function $Render(
  component: Component | string,
  option?: RenderOption
): SUIRender;

/**
 * Class representing a rendering operation for components.
 */
export declare class SUIRender {
  /**
   * Create a rendering instance.
   */
  constructor(comp: Component | string, option?: RenderOption);

  /**
   * Execute a partial view render with provided data.
   */
  Exec(name: string, data: Record<string, any>): Promise<string>;
}

/**
 * Get the store associated with an element or selector.
 */
export declare function $Store(
  selector: HTMLElement | string
): ComponentStore | null;

/**
 * Query the DOM for an element or elements.
 */
export declare function $Query(selector: string | HTMLElement): SUIQuery;

/**
 * Class for DOM manipulation and traversal.
 */
export declare class SUIQuery {
  /**
   * The selector or element used for querying.
   */
  selector: string | Element;

  /**
   * The current element or null.
   */
  element: Element | null;

  /**
   * All matched elements or null.
   */
  elements: NodeListOf<Element> | null;

  /**
   * Create a query instance.
   */
  constructor(selector: string | Element);

  /**
   * Iterate over elements.
   */
  each(callback: (element: SUIQuery, index: number) => void): void;

  /**
   * Get the current element.
   */
  elm(): Element | null;

  /**
   * Get all matched elements.
   */
  elms(): NodeListOf<Element> | null;

  /**
   * Find child elements by selector.
   */
  find(selector: string): SUIQuery | null;

  /**
   * Find the closest matching ancestor.
   */
  closest(selector: string): SUIQuery | null;

  /**
   * Add event listener.
   */
  on(event: string, callback: (event: Event) => void): SUIQuery;

  /**
   * Get the associated component.
   */
  $$(): Component | null;

  /**
   * Get the associated store.
   */
  store(): ComponentStore | null;

  /**
   * Get an attribute value.
   */
  attr(name: string): string | null;

  /**
   * Get data-attribute value.
   */
  data(name: string): string | null;

  /**
   * Get JSON data.
   */
  json(name: string): any | null;

  /**
   * Check if the element has a class.
   */
  hasClass(className: string): boolean;

  /**
   * Get a property value.
   */
  prop(name: string): any | null;

  /**
   * Remove classes.
   */
  removeClass(className: string | string[]): SUIQuery;

  /**
   * Toggle classes.
   */
  toggleClass(className: string | string[]): SUIQuery;

  /**
   * Add classes.
   */
  addClass(className: string | string[]): SUIQuery;

  /**
   * Get or set inner HTML.
   */
  html(html?: string): SUIQuery | string;
}

/**
 * Create a backend request handler for calling APIs.
 */
export declare function $Backend<T = any>(
  route?: string,
  headers?: Headers
): SUIBackend<T>;

/**
 * Class for backend API calls.
 */
export declare class SUIBackend<T = any> {
  /**
   * Create a backend instance.
   */
  constructor(route?: string, headers?: Headers);

  /**
   * Call a backend API method with arguments.
   */
  Call(method: string, ...args: any): Promise<T>;
}

/**
 * Class for handling YAO API interactions.
 */
export declare class Yao {
  /**
   * Initialize Yao API client.
   */
  constructor(host?: string);

  /**
   * Perform a GET request.
   */
  Get(path: string, params?: object, headers?: Headers): Promise<any>;

  /**
   * Perform a POST request.
   */
  Post(
    path: string,
    data?: object,
    params?: object,
    headers?: Headers
  ): Promise<any>;

  /**
   * Download a file from the API.
   */
  Download(
    path: string,
    params: object,
    savefile: string,
    headers?: Headers
  ): Promise<void>;

  /**
   * Perform a fetch request to the API.
   */
  Fetch(
    method: string,
    path: string,
    params?: object,
    data?: object,
    headers?: Headers,
    isblob?: boolean
  ): Promise<any>;

  /**
   * Get the stored token.
   */
  Token(): string;

  /**
   * Get a cookie value.
   */
  Cookie(cookieName: string): string | null;

  /**
   * Set a cookie.
   */
  SetCookie(cookieName: string, cookieValue: string, expireDays?: number): void;

  /**
   * Delete a cookie.
   */
  DeleteCookie(cookieName: string): void;
}

// ============================================================================
// OpenAPI Client
// ============================================================================

/**
 * Configuration for OpenAPI client.
 */
export declare interface OpenAPIConfig {
  baseURL: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

/**
 * Error response from API calls.
 */
export declare interface OpenAPIErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
  [key: string]: any;
}

/**
 * API response wrapper.
 */
export declare interface ApiResponse<T = any> {
  data?: T;
  error?: OpenAPIErrorResponse;
  status: number;
  headers: Headers;
}

/**
 * Options for file uploads.
 */
export declare interface FileUploadOptions {
  uploaderID?: string;
  originalFilename?: string;
  groups?: string[];
  gzip?: boolean;
  compressImage?: boolean;
  compressSize?: number;
  path?: string;
  chunked?: boolean;
  chunkSize?: number;
  public?: boolean;
  share?: "private" | "team";
}

/**
 * Options for listing files.
 */
export declare interface FileListOptions {
  uploaderID?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  contentType?: string;
  name?: string;
  orderBy?: string;
  select?: string[];
}

/**
 * File information returned by API.
 */
export declare interface FileInfo {
  file_id: string;
  user_path: string;
  path: string;
  bytes: number;
  created_at: number;
  filename: string;
  content_type: string;
  status: string;
  url?: string;
  metadata?: Record<string, any>;
  uploader?: string;
  groups?: string[];
  public?: boolean;
  share?: "private" | "team";
}

/**
 * Response for file list queries.
 */
export declare interface FileListResponse {
  data: FileInfo[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Response for file existence check.
 */
export declare interface FileExistsResponse {
  exists: boolean;
  fileId: string;
}

/**
 * Response for file deletion.
 */
export declare interface FileDeleteResponse {
  message: string;
  fileId: string;
}

/**
 * Upload progress callback.
 */
export declare type UploadProgressCallback = (progress: {
  loaded: number;
  total: number;
  percentage: number;
}) => void;

/**
 * Lightweight HTTP client for Yao OpenAPI endpoints.
 *
 * Features:
 * - RESTful API methods (GET, POST, PUT, DELETE, Upload)
 * - Secure cookie authentication
 * - CSRF protection
 * - File upload with progress tracking
 * - Cross-origin support
 *
 * Usage:
 *   const api = new OpenAPI({ baseURL: '/v1' })
 *   const response = await api.Get('/users')
 *   if (api.IsError(response)) {
 *     console.error(response.error)
 *   } else {
 *     console.log(response.data)
 *   }
 */
export declare class OpenAPI {
  constructor(config: OpenAPIConfig);

  /**
   * Perform a GET request.
   */
  Get<T = any>(
    path: string,
    query?: Record<string, string>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>>;

  /**
   * Perform a POST request.
   */
  Post<T = any>(
    path: string,
    payload: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>>;

  /**
   * Perform a PUT request.
   */
  Put<T = any>(
    path: string,
    payload: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>>;

  /**
   * Perform a DELETE request.
   */
  Delete<T = any>(
    path: string,
    headers?: Record<string, string>,
    payload?: any
  ): Promise<ApiResponse<T>>;

  /**
   * Upload a file via FormData.
   */
  Upload<T = any>(
    path: string,
    formData: FormData,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>>;

  /**
   * Check if the response contains an error.
   */
  IsError<T>(
    response: ApiResponse<T>
  ): response is ApiResponse<T> & { error: OpenAPIErrorResponse };

  /**
   * Extract data from a response.
   */
  GetData<T>(response: ApiResponse<T>): T | null;

  /**
   * Set CSRF token in localStorage.
   */
  SetCSRFToken(token: string): void;

  /**
   * Clear stored tokens.
   */
  ClearTokens(): void;

  /**
   * Check if the API URL is cross-origin.
   */
  IsCrossOrigin(): boolean;

  /**
   * Get the configured base URL.
   */
  getBaseURL(): string;
}

/**
 * File management API built on top of OpenAPI client.
 *
 * Supports file upload (including chunked), download, list, retrieve, delete, and existence check.
 *
 * Usage:
 *   const api = new OpenAPI({ baseURL: '/v1' })
 *   const files = new FileAPI(api)
 *   const result = await files.Upload(file, { path: '/uploads' })
 */
export declare class FileAPI {
  constructor(api: OpenAPI, defaultUploader?: string);

  /**
   * Upload a file.
   */
  Upload(
    file: File,
    options?: FileUploadOptions,
    onProgress?: UploadProgressCallback
  ): Promise<ApiResponse<FileInfo>>;

  /**
   * Upload multiple files.
   */
  UploadMultiple(
    files: File[],
    options?: FileUploadOptions,
    onProgress?: (
      fileIndex: number,
      progress: { loaded: number; total: number; percentage: number }
    ) => void
  ): Promise<ApiResponse<FileInfo>[]>;

  /**
   * List uploaded files.
   */
  List(options?: FileListOptions): Promise<ApiResponse<FileListResponse>>;

  /**
   * Retrieve file info by ID.
   */
  Retrieve(fileID: string, uploaderID?: string): Promise<ApiResponse<FileInfo>>;

  /**
   * Delete a file by ID.
   */
  Delete(
    fileID: string,
    uploaderID?: string
  ): Promise<ApiResponse<FileDeleteResponse>>;

  /**
   * Download a file by ID.
   */
  Download(fileID: string, uploaderID?: string): Promise<ApiResponse<Blob>>;

  /**
   * Check if a file exists.
   */
  Exists(
    fileID: string,
    uploaderID?: string
  ): Promise<ApiResponse<FileExistsResponse>>;

  /**
   * Format file size to human-readable string.
   */
  static FormatSize(bytes: number): string;

  /**
   * Get file extension from filename.
   */
  static GetExtension(filename: string): string;

  /**
   * Check if content type is an image.
   */
  static IsImage(contentType: string): boolean;

  /**
   * Check if content type is a document.
   */
  static IsDocument(contentType: string): boolean;
}

// ============================================================================
// Agent
// ============================================================================

/**
 * Event types that can be listened to
 */
export declare type AgentEvent = "message" | "done";

/**
 * Attachment information for file uploads
 */
export declare interface AgentAttachment {
  name: string;
  url: string;
  type: string;
  content_type: string;
  bytes: number;
  created_at: string | number;
  file_id: string;
  chat_id?: string;
  assistant_id?: string;
  description?: string;
}

/**
 * Input content structure for agent calls
 */
export declare interface AgentInputContent {
  text: string;
  attachments?: AgentAttachment[];
}

/**
 * Input type for agent calls, can be either a string or a structured input
 */
export declare type AgentInput =
  | string
  | {
      text: string;
      attachments?: AgentAttachment[];
    };

/**
 * Agent initialization options
 */
export declare interface AgentOption {
  token: string;
  host?: string;
  chat_id?: string;
  context?: AgentContext;
}

/**
 * Agent context
 */
export declare interface AgentContext {
  namespace: string;
  stack: string;
  pathname: string;
  signal?: any;
}

/**
 * Message structure for agent responses
 */
export declare interface AgentMessage {
  text: string;
  type?: string;
  result?: any;
  done?: boolean;
  is_neo?: boolean;
  assistant_id?: string;
  assistant_name?: string;
  assistant_avatar?: string;
  props?: Record<string, any>;
  tool_id?: string;
  new?: boolean;
  delta?: boolean;
}

/**
 * Message handler function type
 */
export declare interface MessageHandler {
  (message: AgentMessage): void;
}

/**
 * Done event handler function type
 */
export declare interface DoneHandler {
  (messages: AgentMessage[]): void;
}

/**
 * Event handlers record type
 */
export declare interface EventHandlers {
  message?: MessageHandler;
  done?: DoneHandler;
}

/**
 * Class for handling AI Agent interactions
 */
export declare class Agent {
  /**
   * Agent constructor
   * @param assistant_id The ID of the assistant
   * @param option Agent initialization options
   */
  constructor(assistant_id: string, option: AgentOption);

  /**
   * Register an event handler
   * @param event Event type to listen for ("message" or "done")
   * @param handler Function to handle the event
   * @returns The Agent instance for chaining
   */
  On<E extends AgentEvent>(
    event: E,
    handler: E extends "message" ? MessageHandler : DoneHandler
  ): Agent;

  /**
   * Cancel the agent
   */
  Cancel(): void;

  /**
   * Call the AI Agent
   * @param input Text message or input object with text and optional attachments
   * @param args Additional arguments to pass to the agent
   */
  Call(input: AgentInput, ...args: any[]): void;
}
