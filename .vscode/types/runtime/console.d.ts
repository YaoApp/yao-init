export interface Console {
  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/log_static)
   * @param data Data to log
   */
  log(...data: any[]): void;

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/error_static)
   * @param data Data to log
   */
  error(...data: any[]): void;

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/warn_static)
   * @param data Data to log
   */
  warn(...data: any[]): void;

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/info_static)
   * @param data Data to log
   */
  info(...data: any[]): void;
}

export declare var console: Console;
