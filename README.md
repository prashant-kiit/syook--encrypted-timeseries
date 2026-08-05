# Syook Encrypted Timeseries

A microservice pipeline that generates synthetic event data, encrypts it, streams it over Socket.IO, verifies its integrity, persists it as time-series data in MongoDB, and surfaces a rolling success-rate metric on a live dashboard.

## Architecture

```
emitter-service  --Socket.IO-->  listener-service  --BullMQ/Redis-->  worker
   (encrypt +                     (queue producer)                  (decrypt +
    checksum)                                                        verify +
                                                                       persist)
                                                                          |
                                                                          v
                                                                      MongoDB
                                                              (message_timeseries,
                                                             rolling_window_results)
                                                                          ^
                                                                          |
                                                              change-stream aggregation
                                                                          |
                                       dashboard-frontend <--Socket.IO-- dashboard-backend
                                          (React/Vite)      (polls & streams)
```

### Services

| Service | Port | Responsibility |
|---|---|---|
| [emitter-service](emitter-service) | 3000 | Generates random `{name, origin, destination}` messages, appends a SHA-256 checksum, encrypts each with AES-256-CTR, batches them, and emits them to the listener over a Socket.IO connection on a fixed interval. |
| [listener-service](listener-service) | 4000 | Accepts the encrypted batch over Socket.IO, splits it into individual messages, and enqueues each as a BullMQ job. A worker decrypts the payload, re-computes the checksum to verify data integrity, and stores the result (success/failure) in a minute-bucketed MongoDB collection. A MongoDB change-stream watcher recomputes a rolling-window success rate on every write. |
| [dashboard-backend](dashboard-backend) | 5000 | Polls the latest rolling-window results from MongoDB and streams them to connected dashboards over Socket.IO. |
| [dashboard-frontend](dashboard-frontend) | 5173 → 80 | React + Vite single-page app that renders the live success-rate table. |
| redis | 6379 | Backing store for the BullMQ queue between listener and its worker. |
| mongodb | 27017 | Single-node replica set (`rs0`), required for change streams; stores raw time-series records and computed rolling-window results. |

### Data flow

1. **Emit** – `emitter-service` picks random names/cities from `src/data.json`, builds a message, hashes it (SHA-256) as a tamper-check `secret_key`, encrypts the JSON with AES-256-CTR using a shared `PASS_KEY`, and emits a batch of 49–499 encrypted messages joined by `|`.
2. **Queue** – `listener-service` receives the batch over its Socket.IO server, splits it, and pushes each message onto a `message-stream` BullMQ queue backed by Redis.
3. **Verify & Persist** – A worker (concurrency 20) decrypts each message, validates its shape with Zod, and recomputes the checksum to flag it as `isSuccess: true/false`. The record is pushed into a per-minute bucket document in the `message_timeseries` collection.
4. **Aggregate** – A MongoDB change stream on `message_timeseries` triggers, on every insert/update, a re-aggregation of the trailing `ROLLING_WINDOW_MINUTES` window (total/success/fail counts, success rate), upserted into `rolling_window_results`.
5. **Serve** – `dashboard-backend` polls `rolling_window_results` for the latest `DATA_RANGE` windows and pushes them to the frontend over Socket.IO.
6. **Display** – `dashboard-frontend` renders the incoming rows as a live table of window start time vs. success rate.

## Tech stack

- **Runtime**: Node.js 22 (TypeScript, ESM) for all backend services
- **Transport**: Socket.IO (emitter → listener, dashboard-backend → dashboard-frontend)
- **Queue**: BullMQ on Redis
- **Database**: MongoDB 7 (single-node replica set, for change streams)
- **Validation**: Zod
- **Frontend**: React 19 + Vite
- **Containerization**: Docker Compose

## Prerequisites

- Docker & Docker Compose
- `make`
- OpenSSL (used by `make mongo-keyfile` to generate MongoDB's replica-set auth key)

## Getting started

```bash
# 1. Generate the MongoDB keyfile (required for replica-set auth)
make mongo-keyfile

# 2. Build all service images
make build

# 3. Start the stack
make run

# Dashboard is now available at http://localhost:5173
```

Other Makefile targets:

| Command | Description |
|---|---|
| `make stop` | Stop all containers (keep volumes) |
| `make stop-v` | Stop all containers and remove volumes (redis/mongo data) |

On first boot, the `mongo-init` container initializes the MongoDB replica set (`rs0`) automatically.

## Configuration

Each service reads its config from its own `.env` file:

| Service | Variable | Description |
|---|---|---|
| emitter-service | `LISTENER_URL` | Socket.IO URL of the listener service |
| | `RAW_DATA_PATH` | Path to the JSON file with sample `names`/`cities` |
| | `PASS_KEY` | Shared secret used to derive the AES-256 key |
| | `EMISSION_TIME_INTERVAL` | Milliseconds between emitted batches |
| listener-service | `LISTENER_PORT` | Port the Socket.IO/HTTP server listens on |
| | `REDIS_HOST` / `REDIS_PORT` | Redis connection for BullMQ |
| | `PASS_KEY` | Must match the emitter's key, used to decrypt |
| | `MONGO_URI` | MongoDB connection string (replica set) |
| | `ROLLING_WINDOW_MINUTES` | Width of the rolling success-rate window |
| dashboard-backend | `LISTENER_PORT` | Port the dashboard backend's HTTP/Socket.IO server listens on |
| | `MONGO_URI` | MongoDB connection string |
| | `POLLING_TIMEOUT` | Milliseconds between polls of `rolling_window_results` |
| | `DATA_RANGE` | Number of most recent windows to send per poll |
| dashboard-frontend | `VITE_SOCKET_URL` | URL of the dashboard-backend Socket.IO server |

> ⚠️ The `PASS_KEY` must be identical across `emitter-service` and `listener-service` or all messages will fail integrity verification.

## Project structure

```
.
├── emitter-service/      # Generates, checksums, encrypts, and streams synthetic data
├── listener-service/      # Queues, decrypts, verifies, persists, and aggregates
├── dashboard-backend/      # Streams rolling success-rate data to the frontend
├── dashboard-frontend/     # React dashboard UI
├── docker-compose.yml      # Full-stack orchestration (app services + redis + mongodb)
├── Makefile                # mongo-keyfile / build / run / stop helpers
└── .github/workflows/       # CI/CD pipeline (builds & pushes images on merge to master)
```

## CI/CD

On every pull request merged into `master`, [.github/workflows/build.yml](.github/workflows/build.yml) builds and publishes Docker images for all four services to Docker Hub.

## License

Apache License 2.0 — see [LICENSE](LICENSE).
