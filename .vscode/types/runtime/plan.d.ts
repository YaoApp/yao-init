/**
 * The status of a plan or task
 */
export type PlanStatus =
  | "created"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "destroyed"
  | "unknown";

/**
 * Get the assets content
 * @param name - The name of the assets
 * @param data - The data of the assets
 */
export declare function Assets(
  name: string,
  data?: Record<string, any>
): string;

/**
 * The plan class
 */
export declare class Plan {
  /**
   * @param plan_id - The ID of the plan
   */
  constructor(plan_id: string);

  /**
   * Subscribe to the plan
   * @param key - The key to subscribe to
   * @param subscribe_fn - The function to execute when the plan changes
   */
  Subscribe(
    key: string,
    subscribe_fn:
      | string
      | ((plan_id: string, key: string, value: any, ...args: any[]) => void),
    ...subscribe_args: any[]
  ): void;

  /**
   * Add a task to the plan
   * @param task_id - The ID of the task
   * @param order - The order of the task
   * @param task_process - The process to execute for the task
   * @param task_args - The arguments to pass to the task
   */
  Add(
    task_id: string,
    order: number,
    task_process:
      | string
      | ((plan_id: string, task_id: string, ...args: any[]) => void),
    ...task_args: any[]
  ): void;

  /**
   * Run the plan, synchronously
   */
  Run(): void;

  /**
   * Release the plan
   */
  Release(): void;

  /**
   * Get the status and each task's status
   */
  Status(): {
    plan: PlanStatus;
    tasks: Record<string, PlanStatus>;
  };

  /**
   * Get the status of a task
   */
  TaskStatus(task_id: string): PlanStatus;

  /**
   * Get or set the data of a task, if no data is provided, the current data is returned, otherwise the data is set and the previous data is returned
   */
  TaskData(task_id: string, data?: any): any;

  /**
   * Get shared data
   */
  Get(key: string): any;

  /**
   * Set shared data
   */
  Set(key: string, value: any): void;

  /**
   * Delete shared data
   */
  Del(key: string): void;

  /**
   * Clear shared data
   */
  Clear(): void;
}
