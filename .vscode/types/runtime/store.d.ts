/**
 * Represents a map of options for store configuration.
 */
export type Option = { [key: string]: any };

/**
 * Represents the store instance configuration.
 */
export interface Instance {
  /** Store name */
  name: string;
  /** Optional store description */
  description?: string;
  /** Optional connector */
  connector?: string;
  /** Store type (deprecated in new versions) */
  type?: string;
  /** Store options */
  option?: Option;
}

/**
 * Represents the Store class for interacting with the key-value store.
 */
export declare class Store {
  /**
   * Create a new instance of Store
   * @param widgetID - The Store Widget ID
   */
  constructor(widgetID: string);

  /**
   * Sets a value in the store.
   * @param key - The key for the store item
   * @param value - The value to store
   * @param ttl - Time to live in seconds
   */
  Set(key: string, value: any, ttl?: number): void;

  /**
   * Gets a value from the store.
   * @param key - The key for the store item to get
   * @returns The value from the store or undefined if not found
   */
  Get(key: string): any;

  /**
   * Gets a value from the store, or sets it using the provided function if not found.
   * @param key - The key for the store item
   * @param getValue - Function to get the value if not found
   * @param ttl - Time to live in seconds
   * @returns The value from the store
   */
  GetSet(key: string, getValue: (key: string) => any, ttl?: number): any;

  /**
   * Gets a value from the store and deletes it.
   * @param key - The key for the store item
   * @returns The value from the store or undefined if not found
   */
  GetDel(key: string): any;

  /**
   * Checks if a key exists in the store.
   * @param key - The key to check
   * @returns True if the key exists, otherwise false
   */
  Has(key: string): boolean;

  /**
   * Deletes a key from the store.
   * @param key - The key to delete
   */
  Del(key: string): void;

  /**
   * Retrieves all keys in the store.
   * @returns An array of keys in the store
   */
  Keys(): string[];

  /**
   * Retrieves the number of items in the store.
   * @returns The number of items in the store
   */
  Len(): number;

  /**
   * Clears all items in the store.
   */
  Clear(): void;

  /**
   * Sets multiple key-value pairs at once.
   * @param values - Object containing key-value pairs to set
   * @param ttl - Time to live in seconds
   */
  SetMulti(values: { [key: string]: any }, ttl?: number): void;

  /**
   * Gets multiple values from the store.
   * @param keys - Array of keys to retrieve
   * @returns Object containing key-value pairs for existing keys
   */
  GetMulti(keys: string[]): { [key: string]: any };

  /**
   * Deletes multiple keys from the store.
   * @param keys - Array of keys to delete
   */
  DelMulti(keys: string[]): void;

  /**
   * Gets multiple values from the store, or sets them using the provided function if not found.
   * @param keys - Array of keys to retrieve
   * @param getValue - Function to get the value if not found
   * @param ttl - Time to live in seconds
   * @returns Object containing key-value pairs
   */
  GetSetMulti(
    keys: string[],
    getValue: (key: string) => any,
    ttl?: number
  ): { [key: string]: any };

  // List Operations

  /**
   * Add elements to the end of a list.
   * @param key - The key for the list
   * @param values - Values to add to the list
   */
  Push(key: string, ...values: any[]): void;

  /**
   * Remove and return an element from a list.
   * @param key - The key for the list
   * @param position - Position to pop from (1 = end, -1 = beginning)
   * @returns The removed element
   */
  Pop(key: string, position: number): any;

  /**
   * Remove all occurrences of a specific value from a list.
   * @param key - The key for the list
   * @param value - The value to remove
   */
  Pull(key: string, value: any): void;

  /**
   * Remove all occurrences of multiple values from a list.
   * @param key - The key for the list
   * @param values - Values to remove from the list
   */
  PullAll(key: string, ...values: any[]): void;

  /**
   * Add elements to a list only if they don't already exist (ensures uniqueness).
   * @param key - The key for the list
   * @param values - Values to add to the list (duplicates ignored)
   */
  AddToSet(key: string, ...values: any[]): void;

  /**
   * Get the length of a list.
   * @param key - The key for the list
   * @returns The number of elements in the list
   */
  ArrayLen(key: string): number;

  /**
   * Get an element at a specific index in a list.
   * @param key - The key for the list
   * @param index - Zero-based index of the element
   * @returns The element at the specified index
   */
  ArrayGet(key: string, index: number): any;

  /**
   * Set an element at a specific index in a list.
   * @param key - The key for the list
   * @param index - Zero-based index of the element
   * @param value - New value to set at the specified index
   */
  ArraySet(key: string, index: number, value: any): void;

  /**
   * Get a slice of elements from a list with skip and limit.
   * @param key - The key for the list
   * @param skip - Number of elements to skip from the beginning
   * @param limit - Maximum number of elements to return
   * @returns Array of elements in the specified range
   */
  ArraySlice(key: string, skip: number, limit: number): any[];

  /**
   * Get a specific page of elements from a list.
   * @param key - The key for the list
   * @param page - Page number (starting from 1)
   * @param pageSize - Number of items per page
   * @returns Array of elements for the specified page
   */
  ArrayPage(key: string, page: number, pageSize: number): any[];

  /**
   * Get all elements in a list.
   * @param key - The key for the list
   * @returns Array containing all elements in the list
   */
  ArrayAll(key: string): any[];
}
