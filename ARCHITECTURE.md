# 🏛️ Architecture & System Design Specification
## AI Task Processing Platform — Web Application (`NexusAI v2.4 Core`)

---

## 1. Executive Summary & Overview

The **AI Task Processing Platform** is an enterprise-grade, asynchronous task distribution and execution system. It is designed to ingest high-throughput user operations (`UPPERCASE`, `LOWERCASE`, `REVERSE`, `WORD COUNT`, `SUMMARIZATION`, `CODE REFACTOR`), push jobs into a distributed **Redis stream queue**, and execute background processing via an asynchronous worker daemon pool.

---

## 2. End-to-End System Topology & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|  React 19 + TypeScript + Vite + Tailwind CSS v4                                   |
|  TanStack Query (1000ms polling / optimistic state mutations)                     |
+----------------------------------------+------------------------------------------+
                                         |
                                  HTTP / REST API
                                         |
+----------------------------------------v------------------------------------------+
|                              BACKEND / SERVER LAYER                               |
|  Node.js + Express 5 (`server/index.ts`)                                          |
|  - Auth Middleware: `requireSupabaseAuth` (JWT Bearer Token validation)          |
|  - Input Validation: Zod `CreateTaskSchema` (Title max 100, prompt non-empty)     |
|  - Rate Limiter: `checkAndIncrementRateLimit` (Table-based 10 tasks / 60s)        |
|  - Async Worker Function: `runTask(taskId)`                                       |
+-------------------+---------------------------------------+-----------------------+
                    |                                       |
          Persist Task & Logs                    Push Job Payload
                    |                                       |
+-------------------v-------------------+       +-----------v-----------------------+
|          DATABASE LAYER               |       |         QUEUE BROKER              |
| PostgreSQL / Lovable Cloud            |       | Redis Stream (`tasks:queue`)      |
| Tables:                               |       +-----------+-----------------------+
|  - `profiles`                         |                   |
|  - `tasks`                            |            Poll Jobs & Process
|  - `task_logs`                        |                   |
|  - `user_roles`                       |       +-----------v-----------------------+
|  - `rate_limits`                      |       |       ASYNC WORKER POOL           |
| Security: Row Level Security (RLS)    |       | Python 3.11 Daemon (`worker.py`)  |
| Stored Procedure: `has_role()`        |       | Exec state transition handler     |
+---------------------------------------+       +-----------------------------------+
```

---

## 3. Data Model & Row Level Security (RLS)

### 3.1 Relational Tables
1. **`profiles`**: Maps 1:1 with `auth.users(id)`. Holds `display_name` and registration timestamp.
2. **`tasks`**: Core task record holding `user_id`, `title`, `input_text`, `operation`, `status` (`pending`, `running`, `success`, `failed`), `result`, `created_at`, `started_at`, `finished_at`.
3. **`task_logs`**: Foreign key to `tasks(id)` storing level (`info`, `warn`, `error`, `debug`), `message`, and timestamp.
4. **`user_roles`**: Maps user roles (`admin`, `operator`, `viewer`) for platform authorization.
5. **`rate_limits`**: Per-user sliding window counter for rate limit enforcement.

### 3.2 RLS Policies
- **Tasks Policy**: `USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))`
- **Logs Policy**: Users access logs only for tasks they own.

---

## 4. Asynchronous State Machine (`Pending` → `Running` → `Success` / `Failed`)

```
 [User Submits Task]
         |
         v
    +---------+
    | PENDING | ----(Rate Limit Exceeded / Invalid Input) ----> [400/429 Error]
    +----+----+
         |
    Worker Picked Up
         |
         v
    +---------+
    | RUNNING | ----(Log: "Started execution of UPPERCASE")
    +----+----+
         |
   +-----+-----+
   |           |
Success      Error
   |           |
   v           v
+---------+ +--------+
| SUCCESS | | FAILED | ----(Write Error Log & DLQ entry)
+---------+ +--------+
```

---

## 5. Security & Rate Limiting Controls

1. **Authentication**: All API endpoints gated via `requireSupabaseAuth` middleware enforcing JWT token integrity.
2. **Schema Sanitization**: Zod `CreateTaskSchema` validates string bounds, non-empty inputs, and operation enum choices.
3. **Rate Limiting**: Table-based sliding window counter enforcing a strict limit of 10 task creations per 60 seconds per user ID.
4. **Zero Hardcoded Secrets**: All keys and credentials loaded via `process.env`.

---

## 6. Infrastructure & Deployment Topology

- **Docker Compose**: Orchestrates Redis 7, Express Backend, Python Worker, and React Nginx frontend locally.
- **Kubernetes**: Manifests in `k8s/` directory supporting ClusterIP services, NGINX Ingress, ConfigMaps, Secrets, Liveness/Readiness probes, and resource limits.
- **Argo CD GitOps**: Continuously syncs K8s state from Git repo commit hooks.
- **GitHub Actions CI/CD**: Runs linting, type checks, Docker multi-stage builds, registry pushes, and GitOps image tag updates automatically.
