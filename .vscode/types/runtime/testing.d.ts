/**
 * Testing namespace for Yao agent script testing.
 * Provides Go-style testing primitives for TypeScript test scripts.
 *
 * Test functions follow the convention: function TestXxx(t: testing.T, ctx: testing.Context)
 * Test files follow the convention: xxx_test.ts
 */
export declare namespace testing {
  /**
   * T is the testing object passed to test functions.
   * It provides assertion methods and test control flow.
   *
   * @example
   * ```ts
   * function TestExample(t: testing.T, ctx: testing.Context) {
   *   t.log("running test");
   *   t.assert.True(1 + 1 === 2, "math works");
   *   t.assert.Equal(result, expected, "values should match");
   * }
   * ```
   */
  export interface T {
    /** The name of the test function */
    name: string;

    /** Whether the test has failed */
    failed: boolean;

    /** The assert object with all assertion methods */
    assert: Assert;

    /**
     * Log a message (similar to console.log for tests)
     * @param args - Values to log
     */
    log(...args: any[]): void;

    /**
     * Mark the test as failed with an error message (test continues running)
     * @param args - Error message parts
     */
    error(...args: any[]): void;

    /**
     * Skip the current test with an optional reason
     * @param reason - Reason for skipping
     */
    skip(reason?: string): void;

    /**
     * Mark the test as failed with an optional reason (test continues running)
     * @param reason - Failure reason
     */
    fail(reason?: string): void;

    /**
     * Mark the test as failed and stop execution (throws an exception)
     * @param reason - Fatal error reason
     */
    fatal(reason?: string): void;
  }

  /**
   * Assert provides assertion methods for test validation.
   * All assertion methods accept an optional message as the last parameter.
   */
  export interface Assert {
    /**
     * Assert that a value is truthy
     * @param value - The value to check
     * @param message - Optional failure message
     */
    True(value: any, message?: string): void;

    /**
     * Assert that a value is falsy
     * @param value - The value to check
     * @param message - Optional failure message
     */
    False(value: any, message?: string): void;

    /**
     * Assert that two values are deeply equal
     * @param actual - The actual value
     * @param expected - The expected value
     * @param message - Optional failure message
     */
    Equal(actual: any, expected: any, message?: string): void;

    /**
     * Assert that two values are not equal
     * @param actual - The actual value
     * @param expected - The value it should not equal
     * @param message - Optional failure message
     */
    NotEqual(actual: any, expected: any, message?: string): void;

    /**
     * Assert that a value is null or undefined
     * @param value - The value to check
     * @param message - Optional failure message
     */
    Nil(value: any, message?: string): void;

    /**
     * Assert that a value is not null and not undefined
     * @param value - The value to check
     * @param message - Optional failure message
     */
    NotNil(value: any, message?: string): void;

    /**
     * Assert that a string contains a substring
     * @param str - The string to search in
     * @param substr - The substring to search for
     * @param message - Optional failure message
     */
    Contains(str: string, substr: string, message?: string): void;

    /**
     * Assert that a string does not contain a substring
     * @param str - The string to search in
     * @param substr - The substring that should not be present
     * @param message - Optional failure message
     */
    NotContains(str: string, substr: string, message?: string): void;

    /**
     * Assert that a value has the expected length (array, string, or object keys)
     * @param value - The value to check length of
     * @param length - The expected length
     * @param message - Optional failure message
     */
    Len(value: any[] | string | Record<string, any>, length: number, message?: string): void;

    /**
     * Assert that a > b (numeric comparison)
     * @param a - The first value
     * @param b - The second value
     * @param message - Optional failure message
     */
    Greater(a: number, b: number, message?: string): void;

    /**
     * Assert that a >= b (numeric comparison)
     * @param a - The first value
     * @param b - The second value
     * @param message - Optional failure message
     */
    GreaterOrEqual(a: number, b: number, message?: string): void;

    /**
     * Assert that a < b (numeric comparison)
     * @param a - The first value
     * @param b - The second value
     * @param message - Optional failure message
     */
    Less(a: number, b: number, message?: string): void;

    /**
     * Assert that a <= b (numeric comparison)
     * @param a - The first value
     * @param b - The second value
     * @param message - Optional failure message
     */
    LessOrEqual(a: number, b: number, message?: string): void;

    /**
     * Assert that a value is an error (not null/undefined)
     * @param err - The error value to check
     * @param message - Optional failure message
     */
    Error(err: any, message?: string): void;

    /**
     * Assert that a value is not an error (null/undefined)
     * @param err - The error value to check
     * @param message - Optional failure message
     */
    NoError(err: any, message?: string): void;

    /**
     * Assert that a function throws an error
     * @param fn - The function that should throw
     * @param message - Optional failure message
     */
    Panic(fn: () => void, message?: string): void;

    /**
     * Assert that a function does not throw an error
     * @param fn - The function that should not throw
     * @param message - Optional failure message
     */
    NoPanic(fn: () => void, message?: string): void;

    /**
     * Assert that a string matches a regex pattern
     * @param value - The string to test
     * @param pattern - The regex pattern string
     * @param message - Optional failure message
     */
    Match(value: string, pattern: string, message?: string): void;

    /**
     * Assert that a string does not match a regex pattern
     * @param value - The string to test
     * @param pattern - The regex pattern string
     * @param message - Optional failure message
     */
    NotMatch(value: string, pattern: string, message?: string): void;

    /**
     * Assert the JavaScript type of a value
     * @param value - The value to check
     * @param typeName - Expected type: "string" | "number" | "boolean" | "object" | "array" | "function" | "null" | "undefined"
     * @param message - Optional failure message
     */
    Type(value: any, typeName: "string" | "number" | "boolean" | "object" | "array" | "function" | "null" | "undefined", message?: string): void;

    /**
     * Assert a value at a JSON path
     * @param obj - The object to extract from
     * @param path - The JSON path (e.g., "$.field.nested" or "field.nested")
     * @param expected - The expected value at that path
     * @param message - Optional failure message
     */
    JSONPath(obj: any, path: string, expected: any, message?: string): void;

    /**
     * Use a validator agent to assert the response
     * @param response - The response to validate
     * @param agentID - The validator agent ID (no "agents:" prefix needed)
     * @param options - Optional validation options
     */
    Agent(
      response: any,
      agentID: string,
      options?: {
        /** Validation criteria passed to the validator agent */
        criteria?: any;
        /** Custom metadata passed to the validator agent */
        metadata?: Record<string, any>;
        /** Override the validator agent's default connector */
        connector?: string;
      }
    ): void;
  }

  /**
   * Context is the agent context object passed to test functions.
   * It provides access to the test execution environment.
   */
  export interface Context {
    /** The chat session ID */
    chat_id: string;

    /** The assistant ID being tested */
    assistant_id: string;

    /** The locale setting (e.g., "en-us") */
    locale: string;

    /** Client information */
    client: {
      /** Client type (e.g., "test") */
      type: string;
      /** Client user agent string */
      user_agent: string;
      /** Client IP address */
      ip: string;
    };

    /** The referer */
    referer: string;

    /** The accept format */
    accept: string;

    /** Custom metadata */
    metadata: Record<string, any>;

    /** Authorized info */
    authorized?: {
      /** Subject identifier */
      sub?: string;
      /** User ID */
      user_id?: string;
      /** Team/Tenant ID */
      team_id?: string;
      /** Tenant ID */
      tenant_id?: string;
      /** Client ID */
      client_id?: string;
      /** Session ID */
      session_id?: string;
      /** Access scope */
      scope?: string;
    };
  }
}
