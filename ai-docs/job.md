# Job Queue (`yao/job`)

> **Process group:** `job`

Async job execution with worker pool, progress tracking, and status management.

### Job Lifecycle

| Operation | Go API | Description |
|-----------|--------|-------------|
| Create once job | `job.Once(options)` / `job.OnceAndSave(options)` | One-time job |
| Create cron job | `job.Cron(options)` / `job.CronAndSave(options)` | Scheduled job |
| Create daemon | `job.Daemon(options)` / `job.DaemonAndSave(options)` | Long-running job |
| Add execution | `job.Add(opts, processName, args...)` | Add Yao Process execution |
| Add command | `job.AddCommand(opts, cmd, args, env)` | Add system command execution |
| Add function | `job.AddFunc(opts, name, fn, args)` | Add Go function execution |
| Push | `job.Push()` | Submit all executions to worker queue |
| Stop | `job.Stop()` | Cancel job and running executions |
| Destroy | `job.Destroy()` | Stop and mark as deleted |

### Query Processes (registered)

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `job.jobs.list` | `page`, `pageSize`, `filters?` | `ListResult` | List jobs (paginated) |
| `job.jobs.get` | `jobID` | `Job` | Get job details + status |
| `job.jobs.count` | `filters?` | `number` | Count jobs |
| `job.jobs.stop` | `jobID` | — | Stop a job |
| `job.executions.list` | `jobID`, `page`, `pageSize` | `ListResult` | List executions |
| `job.executions.get` | `executionID` | `Execution` | Get execution details + result |
| `job.executions.count` | `filters?` | `number` | Count executions |
| `job.executions.stop` | `executionID` | — | Stop execution |
| `job.logs.list` | `filters` | `Log[]` | List execution logs |
| `job.categories.list` | `page`, `pageSize` | `ListResult` | List job categories |

### Execution Modes

| Mode | How it runs | Use when |
|------|------------|----------|
| **GOROUTINE** | In-process via goroutine | Default, fast, shares memory |
| **PROCESS** | Separate `yao run` subprocess | Isolation needed |

### Execution Status Flow

```
queued → running → completed
                 → failed
                 → cancelled
```

### Progress Tracking

- **Goroutine mode:** `proc.WithCallback()` receives `{type: "progress", progress: N, message: "..."}`
- **Process mode:** Use `YAO_JOB_ID` + `YAO_EXECUTION_ID` env vars for external progress updates
- **Query:** `job.executions.get(executionID)` returns `progress` (0-100) and `status`

### Worker Pool

- Workers: `runtime.NumCPU() * 4` by default
- Queue: buffered channel (`maxWorkers * 4`)
- Health checker: every 5 minutes
- Data retention: 90 days (auto-cleanup)

### SharedData

Pass data between executions via `SharedData`:
- Goroutine mode: `proc.WithGlobal()`
- Process mode: `YAO_JOB_SHARED_<key>` environment variables

**Keeper usage:** Scheduled RSS/Notion sync, background PDF/video processing — any long-running task that shouldn't block the UI. Batch URL fetch now uses `All()` for synchronous concurrent execution (see [concurrent.md](./concurrent.md)).
