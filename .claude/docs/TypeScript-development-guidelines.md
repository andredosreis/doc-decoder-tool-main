# TypeScript Development Guidelines

## Project Stack

The following libraries were specified for reference in this project:

**User-Specified Libraries**:
- **ORM**: Prisma (v5.x) — Type-safe database ORM with declarative schema and generated client — https://www.prisma.io
- **Web Framework**: Express (v4.x) — Minimal, unopinionated HTTP server framework for Node.js — https://expressjs.com
- **Testing**: Jest (v29.x) — Delightful testing framework with built-in mocking, snapshots, and coverage — https://jestjs.io
- **Validation**: Zod (v3.x) — TypeScript-first schema validation with static type inference — https://zod.dev

**Auto-Populated Essential Tools**:
- **Formatting**: Prettier (v3.x) — Opinionated code formatter — https://prettier.io
- **Linting**: ESLint (v9.x) + typescript-eslint — Pluggable static analysis — https://eslint.org
- **Type Checking**: tsc — Official TypeScript compiler — https://www.typescriptlang.org
- **Logging**: Pino (v9.x) — Very low overhead JSON logger — https://getpino.io
- **Build Tool**: npm / pnpm — Package manager and script runner — https://pnpm.io

> **Note**: This section lists libraries for quick reference.
> All code examples in this guideline use standard library or language-native features.
> Principles and patterns apply regardless of library choices.

---

## 1. Core Principles

### 1.1 Philosophy and Style
- Enable `strict: true` in `tsconfig.json` — never disable strict null checks
- Use `unknown` instead of `any`; treat `any` as an escape hatch that requires justification
- Prefer immutability (`readonly`, `const`, `as const`) over mutation
- Let the compiler infer types when obvious; annotate at module boundaries
- Format with Prettier and lint with ESLint on save and in CI

### 1.2 Clarity over Brevity
- Names communicate intent: `userIdsToInvite` beats `arr` or `data`
- Self-explanatory code reduces comments; comments explain *why*, not *what*
- Avoid premature optimization; profile before micro-tuning
- Prefer flat, early-return code over deeply nested conditionals
- Prefer pure functions; isolate side effects at module edges

---

## 2. Project Initialization

### 2.1 Creating New Project

```bash
mkdir my-app && cd my-app
npm init -y
npm install --save-dev typescript @types/node tsx
npx tsc --init --strict --target ES2022 --module NodeNext --moduleResolution NodeNext
```

Minimal `tsconfig.json` essentials:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2.2 Dependency Management

```bash
npm install <pkg>             # runtime dependency
npm install --save-dev <pkg>  # dev-only dependency
npm uninstall <pkg>           # remove
npm update                    # update within semver range
npm outdated                  # list outdated packages
npm audit fix                 # patch known vulnerabilities
```

Pin engines in `package.json`:

```json
{ "engines": { "node": ">=20.0.0" } }
```

---

## 3. Project Structure

Standard layout for a Node.js + TypeScript service:

```
my-app/
├── src/
│   ├── domain/          # Business entities and rules
│   ├── application/     # Use cases / services
│   ├── infrastructure/  # DB, external APIs, frameworks
│   ├── interfaces/      # HTTP/CLI controllers
│   ├── shared/          # Utilities, types, errors
│   └── index.ts         # Entry point
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/             # Build, migration, utility scripts
├── dist/                # Compiled output (gitignored)
├── .env.example         # Documented env vars (no secrets)
├── .gitignore
├── .eslintrc.json
├── .prettierrc.json
├── tsconfig.json
├── package.json
└── README.md
```

Co-locate tests when preferred: `src/foo/foo.ts` + `src/foo/foo.test.ts`. Pick one convention per repo and enforce it.

---

## 4. Container Development (Docker)

### 4.1 Container Philosophy
Use Docker for development to guarantee identical Node version, native modules, and database services across machines. No global Node installs required.

### 4.2 Docker File Structure
- `Dockerfile` — image definition for development
- `docker-compose.yaml` — services (app, db, cache)
- `.dockerignore` — exclude `node_modules`, `dist`, `.git`

### 4.3 Dockerfile for Development

```dockerfile
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["sleep", "infinity"]
```

### 4.4 Docker Compose

```yaml
services:
  app:
    build: .
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
      NODE_ENV: development
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 5

volumes:
  pgdata:
```

### 4.5 .dockerignore

```
node_modules
dist
.git
.env
.env.*
coverage
*.log
.DS_Store
```

### 4.6 Essential Commands

| Command | Purpose |
|---------|---------|
| `docker compose up -d` | Start environment in background |
| `docker compose logs -f app` | Tail application logs |
| `docker compose exec app npm run dev` | Run dev server |
| `docker compose exec app npm test` | Run test suite |
| `docker compose exec app sh` | Interactive shell |
| `docker compose down` | Stop environment (keep volumes) |
| `docker compose down -v` | Stop and wipe volumes |

### 4.8 Best Practices
- Use Alpine variants for smaller images
- Mount source as volume; keep `node_modules` inside container to avoid arch mismatch
- Pin major Node version in image tag
- Define healthchecks for dependencies the app waits on

---

## 5. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `user-service.ts`, `auth-controller.ts` |
| Test files | mirror source | `user-service.test.ts` |
| Classes | PascalCase | `UserRepository` |
| Interfaces / Types | PascalCase, no `I` prefix | `User`, `HttpClient` |
| Enums | PascalCase, singular | `OrderStatus` (members in PascalCase) |
| Functions / methods | camelCase, verb-first | `fetchUser`, `calculateTotal` |
| Variables | camelCase | `userCount`, `isReady` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT_MS` |
| Booleans | predicate prefix | `isActive`, `hasPermission`, `canEdit` |
| Generics | single uppercase or `T`-prefix | `T`, `TKey`, `TValue` |

Avoid Hungarian notation, abbreviations (`usr`, `cfg`), and meaningless suffixes (`Manager`, `Helper`, `Util`) unless the role is genuinely a manager/helper/util.

---

## 6. Types and Type System

### 6.1 Type Declaration

```typescript
type UserId = string & { readonly __brand: 'UserId' };

interface User {
  readonly id: UserId;
  readonly email: string;
  readonly createdAt: Date;
}

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled';

type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Prefer `interface` for public object contracts (extensible), `type` for unions, intersections, and aliases.

### 6.2 Type Safety

Good vs Bad — using `unknown` over `any`:

```typescript
// BAD: any disables type checking
function parse(input: any): User {
  return { id: input.id, email: input.email, createdAt: new Date() };
}

// GOOD: unknown forces validation at the boundary
function parse(input: unknown): User {
  if (
    typeof input !== 'object' || input === null ||
    typeof (input as Record<string, unknown>).id !== 'string'
  ) {
    throw new TypeError('Invalid user payload');
  }
  const obj = input as { id: string; email: string };
  return { id: obj.id as UserId, email: obj.email, createdAt: new Date() };
}
```

Rules:
- Enable `noUncheckedIndexedAccess` so `arr[i]` is `T | undefined`
- Use discriminated unions over optional flags
- Avoid type assertions (`as`) unless narrowing is provably safe
- Never use `as any` or `// @ts-ignore` — use `// @ts-expect-error <reason>` if unavoidable

### 6.3 Allocation and Initialization

```typescript
const config = {
  port: 3000,
  host: 'localhost',
} as const;

const empty: ReadonlyArray<string> = [];
const map = new Map<UserId, User>();
```

Use `as const` for literal-narrowed config. Prefer `ReadonlyArray<T>`, `ReadonlyMap`, `ReadonlySet` for shared data.

---

## 7. Functions and Methods

### 7.1 Signatures

```typescript
async function fetchUser(
  id: UserId,
  options: { signal?: AbortSignal } = {},
): Promise<User | null> {
  const response = await fetch(`/api/users/${id}`, { signal: options.signal });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`fetchUser failed: ${response.status}`);
  }
  return (await response.json()) as User;
}
```

Guidelines:
- Annotate parameter and return types at exported boundaries
- Use object parameters when arity exceeds 3
- Mark async functions returning `Promise<T>` explicitly
- Make optional behavior opt-in via options objects, never positional booleans

### 7.2 Returns and Errors

Good vs Bad — error handling in returns:

```typescript
// BAD: swallows error, returns sentinel ambiguous with valid value
async function getPriceBad(sku: string): Promise<number> {
  try {
    return await pricingApi.lookup(sku);
  } catch {
    return -1; // caller can't distinguish error from real -1
  }
}

// GOOD: explicit Result type or thrown error with context
async function getPrice(sku: string): Promise<Result<number>> {
  try {
    const value = await pricingApi.lookup(sku);
    return { ok: true, value };
  } catch (cause) {
    return {
      ok: false,
      error: new Error(`pricing lookup failed for sku=${sku}`, { cause }),
    };
  }
}
```

### 7.3 Best Practices
- One reason to change per function (single responsibility)
- Maximum 3-4 positional parameters; use options object beyond that
- Pure functions are easier to test; isolate side effects
- Document non-obvious preconditions with TSDoc `@throws`, `@param`

---

## 8. Error Handling

### 8.1 Philosophy

TypeScript inherits JavaScript's `throw`/`try`/`catch`. Always type caught errors as `unknown` and narrow before use.

```typescript
export class DomainError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {}
export class ValidationError extends DomainError {
  constructor(message: string, public readonly fields: Record<string, string>) {
    super(message);
  }
}

try {
  await repository.save(user);
} catch (cause) {
  throw new DomainError(`save failed for user=${user.id}`, { cause });
}
```

### 8.2 Conventions

Good vs Bad — error context:

```typescript
// BAD: silent swallow loses signal
try {
  await sendEmail(user);
} catch {
  // ignored
}

// BAD: rethrow without context
try {
  await sendEmail(user);
} catch (err) {
  throw err;
}

// GOOD: enrich and propagate
try {
  await sendEmail(user);
} catch (cause) {
  throw new Error(`sendEmail failed for user=${user.id}`, { cause });
}
```

Always type catch as `unknown`:

```typescript
try {
  doWork();
} catch (err: unknown) {
  if (err instanceof ValidationError) {
    return reply.badRequest(err.fields);
  }
  if (err instanceof Error) {
    logger.error({ err }, 'unexpected failure');
  }
  throw err;
}
```

### 8.3 Best Practices
- Never `catch` without inspecting the error
- Wrap errors with `cause` to preserve the original stack
- Domain errors as classes; transport errors handled at the edge
- Log once at the boundary (HTTP handler, queue consumer), not at every layer
- Distinguish recoverable (validation) from unrecoverable (programmer) errors

---

## 9. Concurrency and Parallelism

### 9.1 Concurrency Model
Node.js runs a single-threaded event loop with non-blocking I/O. Concurrency uses Promises and `async`/`await`. CPU-bound work belongs in `worker_threads`.

```typescript
async function loadDashboard(userId: UserId) {
  const [profile, orders, notifications] = await Promise.all([
    fetchProfile(userId),
    fetchOrders(userId),
    fetchNotifications(userId),
  ]);
  return { profile, orders, notifications };
}
```

### 9.2 Synchronization

```typescript
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await promise;
  } finally {
    clearTimeout(timeout);
  }
}

async function processBatch<T>(items: T[], concurrency: number, worker: (i: T) => Promise<void>) {
  const queue = [...items];
  const runners = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await worker(item);
    }
  });
  await Promise.all(runners);
}
```

### 9.3 Best Practices
- Always pass and respect `AbortSignal` for cancellable I/O
- Bound concurrency (`p-limit` pattern); never `Promise.all` an unbounded array
- Use `Promise.allSettled` when partial failures are acceptable
- Implement graceful shutdown on `SIGTERM`/`SIGINT`

### 9.4 Common Pitfalls
- Forgetting `await` — silent unhandled rejection
- Mixing callbacks and promises — use `util.promisify`
- Mutating shared state across awaits — race conditions
- Long-running synchronous loops blocking the event loop

---

## 10. Interfaces and Abstractions

### 10.1 Interface Design

Keep interfaces small and role-focused; prefer many narrow interfaces over one wide one.

```typescript
interface Reader {
  read(id: string): Promise<Buffer>;
}

interface Writer {
  write(id: string, data: Buffer): Promise<void>;
}

interface Storage extends Reader, Writer {}
```

### 10.2 Implementation

```typescript
class S3Storage implements Storage {
  constructor(private readonly bucket: string) {}
  async read(id: string): Promise<Buffer> { /* ... */ return Buffer.alloc(0); }
  async write(id: string, data: Buffer): Promise<void> { /* ... */ }
}
```

### 10.3 Composition
Compose behavior via interface intersection or higher-order functions; prefer composition over inheritance.

```typescript
type Cached<T> = T & { invalidate(): void };

function withCache<T extends Reader>(reader: T): Cached<T> {
  const cache = new Map<string, Buffer>();
  return Object.assign(reader, {
    async read(id: string) {
      if (!cache.has(id)) cache.set(id, await reader.read(id));
      return cache.get(id)!;
    },
    invalidate() { cache.clear(); },
  });
}
```

---

## 11. Unit Tests

### 11.1 Structure

Use Node's built-in `node:test` (Node 20+) for stdlib examples; the same patterns apply to Jest/Vitest.

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { add } from './math.ts';

describe('add', () => {
  it('returns the sum of two positive numbers', () => {
    assert.equal(add(2, 3), 5);
  });

  it('handles negative numbers', () => {
    assert.equal(add(-1, -2), -3);
  });
});
```

Naming: `subject_when_then` or descriptive sentences. Tests live in `*.test.ts` adjacent to source or under `tests/`.

### 11.2 Table-Driven Tests

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const cases: Array<{ name: string; input: string; expected: boolean }> = [
  { name: 'valid email', input: 'a@b.co', expected: true },
  { name: 'missing @', input: 'ab.co', expected: false },
  { name: 'empty string', input: '', expected: false },
];

describe('isEmail', () => {
  for (const tc of cases) {
    it(tc.name, () => {
      assert.equal(isEmail(tc.input), tc.expected);
    });
  }
});
```

### 11.3 Assertions
- Use strict equality (`assert.equal`, `assert.deepStrictEqual`)
- Assert on behavior and observable state, not implementation
- One logical assertion per test; multiple `assert` calls are fine if they verify the same behavior
- Prefer `assert.rejects(fn, ErrorClass)` over try/catch in async tests

### 11.4 Commands

```bash
node --test                                  # run all tests (Node 20+)
node --test src/users.test.ts                # run a specific file
node --test --test-name-pattern="email"      # filter by test name
node --test --experimental-test-coverage     # collect coverage
node --watch --test                          # watch mode
```

For Jest projects:
```bash
npx jest                       # all tests
npx jest path/to/file.test.ts  # specific file
npx jest --coverage            # with coverage
npx jest --watch               # watch mode
```

---

## 12. Mocks and Testability

### 12.1 Mock Strategies
- Manual fakes (preferred): hand-written stand-ins implementing the same interface
- Library mocks: Jest `jest.fn()`, Vitest `vi.fn()`, Node `mock.fn()`
- Avoid mocking what you don't own — wrap third-party libs in your own interface

### 12.2 Dependency Injection

```typescript
interface Clock { now(): Date; }
interface Mailer { send(to: string, body: string): Promise<void>; }

class WelcomeService {
  constructor(private clock: Clock, private mailer: Mailer) {}
  async greet(user: User) {
    const stamp = this.clock.now().toISOString();
    await this.mailer.send(user.email, `Welcome at ${stamp}`);
  }
}
```

### 12.3 Test Doubles

```typescript
import { mock } from 'node:test';

const send = mock.fn(async () => {});
const fixedClock: Clock = { now: () => new Date('2026-01-01T00:00:00Z') };

await new WelcomeService(fixedClock, { send }).greet(user);

assert.equal(send.mock.callCount(), 1);
assert.deepEqual(send.mock.calls[0].arguments, [user.email, 'Welcome at 2026-01-01T00:00:00.000Z']);
```

---

## 13. Integration Tests

### 13.1 Structure and Organization
- Place under `tests/integration/` with `*.int.test.ts` suffix
- Separate from unit tests via filename pattern or test runner project config
- Each test owns its data setup and teardown; no order dependence

### 13.2 Selective Execution

```bash
node --test "tests/unit/**/*.test.ts"           # unit only
node --test "tests/integration/**/*.int.test.ts" # integration only
```

`package.json` scripts:
```json
{
  "scripts": {
    "test:unit": "node --test \"src/**/*.test.ts\"",
    "test:int": "node --test \"tests/integration/**/*.int.test.ts\""
  }
}
```

### 13.3 Real Dependencies
Use Testcontainers (`@testcontainers/postgresql`) to spin up real Postgres/Redis per test suite. Avoids mock/prod divergence and gives high confidence in DB queries and migrations.

---

## 14. Load and Stress Tests

### 14.1 Tools
- `autocannon` — fast HTTP benchmarking from Node
- `k6` — scripted load tests in JavaScript
- `artillery` — scenario-based load testing

### 14.2 Load Benchmarks

```bash
npx autocannon -c 100 -d 30 http://localhost:3000/api/health
# -c connections, -d duration in seconds
```

### 14.3 Concurrency Tests
Validate behavior under contention — race conditions, connection pool exhaustion, lock starvation. Run with `-c` significantly higher than expected production concurrency to find tipping points.

---

## 15. Profiling and Diagnostics

### 15.1 CPU and Memory Profiling

```bash
node --inspect dist/index.js              # attach Chrome DevTools at chrome://inspect
node --prof dist/index.js                 # V8 sampling profile
node --prof-process isolate-*.log         # convert to readable report
node --heapsnapshot-signal=SIGUSR2 app.js # heap snapshot on signal
```

### 15.2 Diagnostic Tools
- Chrome DevTools — interactive flame graphs, heap diff
- `clinic.js` — `clinic doctor`, `clinic flame`, `clinic bubbleprof`
- `0x` — flame graphs from a single command
- Built-in `--trace-warnings`, `--trace-deprecation` for noisy issues

### 15.3 Performance Analysis
1. Reproduce load (`autocannon`) while profiling
2. Capture CPU profile or heap snapshot
3. Identify hot paths — focus on the top 5 functions by self-time
4. Verify with a second profile after the fix

---

## 16. Benchmarks

### 16.1 Writing Benchmarks

```typescript
import { performance } from 'node:perf_hooks';

function bench(name: string, fn: () => void, iterations = 100_000) {
  fn(); // warm up
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;
  console.log(`${name}: ${(elapsed / iterations).toFixed(4)}ms/op`);
}

bench('JSON.parse small', () => JSON.parse('{"a":1,"b":2}'));
```

### 16.2 Sub-benchmarks

```typescript
for (const size of [10, 100, 1000, 10_000]) {
  const arr = Array.from({ length: size }, (_, i) => i);
  bench(`sum n=${size}`, () => arr.reduce((a, b) => a + b, 0));
}
```

### 16.3 Execution and Analysis

```bash
node --expose-gc bench.ts                # allow manual GC between runs
node --allow-natives-syntax bench.ts     # V8 internals (advanced)
```

Compare runs by saving output to file and diffing:
```bash
node bench.ts > before.txt
# apply change
node bench.ts > after.txt
diff before.txt after.txt
```

---

## 17. Optimization

### 17.1 Principles
- Measure first; never optimize on intuition
- Pick low-hanging fruit: I/O batching, N+1 queries, missing indexes before micro-tuning
- Document trade-offs in code when readability is sacrificed for performance

### 17.2 Common Optimizations

```typescript
// Pre-allocate arrays of known size
const out = new Array<number>(items.length);
for (let i = 0; i < items.length; i++) out[i] = items[i] * 2;

// Cache by key with Map (faster than Object for dynamic keys)
const cache = new Map<string, Result>();

// Reuse Buffer pool for binary work
const buf = Buffer.allocUnsafe(1024);
```

### 17.3 Memory Optimization
- Avoid creating closures in hot loops
- Stream large payloads (`stream.Readable`) instead of buffering
- Release references in long-lived caches; use `WeakMap`/`WeakRef` when keys are object identities
- Beware monomorphism — V8 deoptimizes when an object's hidden class changes

### 17.4 Basic Performance
- Use `String#concat` or template literals over `+` only when readable; perf is similar
- `for` loops outperform `.map`/`.forEach` in the hottest paths
- Prefer `JSON.stringify` over manual serialization
- Use `Buffer.from(str, 'utf8')` not implicit conversions

---

## 18. Security

### 18.1 Essential Practices
- Never hardcode secrets — load from environment via a validated config schema
- Validate all external input at the boundary; never trust client data
- Enforce HTTPS/TLS in transport; disable weak ciphers
- Apply rate limiting on public endpoints
- Keep dependencies updated; subscribe to advisories
- Run with least-privilege user (non-root in containers)

### 18.2 Tools

```bash
npm audit                      # check for known vulnerabilities
npm audit fix                  # auto-patch when possible
npx snyk test                  # deeper scan via Snyk
npx better-npm-audit audit     # CI-friendly output
```

### 18.3 Security at API Boundaries
- Parse, don't validate — convert raw input into a typed domain object once at the edge
- Defensive copy mutable input before storing
- Escape output for the destination context (HTML, SQL, shell)
- Use parameterized queries; never build SQL with template strings

```typescript
function loadConfig(env: NodeJS.ProcessEnv) {
  const port = Number(env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number');
  }
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return { port, databaseUrl: env.DATABASE_URL } as const;
}
```

---

## 19. Code Patterns

### 19.1 Early Return

```typescript
// BAD: pyramid of doom
function process(user: User | null) {
  if (user) {
    if (user.isActive) {
      if (user.email) {
        return send(user.email);
      }
    }
  }
  return null;
}

// GOOD: guard clauses
function process(user: User | null) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.email) return null;
  return send(user.email);
}
```

### 19.2 Separation of Concerns
- Keep pure logic (calculations, validation, transformations) free of I/O
- Push side effects (DB, HTTP, fs) to the edges
- Controllers orchestrate; services hold logic; repositories own persistence

### 19.3 DRY
Extract duplication only after the third occurrence (rule of three). Premature abstraction is worse than duplication.

### 19.4 Variable Scope
Declare variables in the smallest scope that needs them. Prefer `const`; use `let` only when reassignment is required; never `var`.

---

## 20. Dependency Management

### 20.1 Principles
- Standard library and Node built-ins first
- Prefer well-maintained, single-purpose packages over kitchen-sink frameworks
- Minimize dependency footprint; every dep is supply-chain risk
- Pin versions in `package-lock.json`; commit it

### 20.2 Commands

```bash
npm ci                         # install from lockfile (CI)
npm outdated                   # list packages with newer versions
npm update                     # upgrade within semver range
npm install <pkg>@latest       # bump to newest major
npm prune                      # remove packages not in package.json
npm dedupe                     # flatten duplicate sub-deps
npm audit signatures           # verify npm package signatures
```

Use `pnpm` for stricter dependency isolation and faster installs:
```bash
pnpm install
pnpm update --interactive --latest
```

---

## 21. Comments and Documentation

### 21.1 Code Comments
Comment *why*, never *what*. The code already shows what it does.

```typescript
// BAD: restates the code
// increment counter by 1
counter += 1;

// GOOD: explains a non-obvious constraint
// API rate limit resets every 60s; pad by 5s to avoid clock skew
await sleep(65_000);
```

### 21.2 API Documentation
Use TSDoc on exported symbols:

```typescript
/**
 * Sends a transactional email and retries on transient failures.
 *
 * @param to   - recipient address (RFC 5322)
 * @param body - rendered HTML body
 * @returns the provider message id on success
 * @throws {DeliveryError} when all retries are exhausted
 */
export async function sendEmail(to: string, body: string): Promise<string> { /* ... */ }
```

### 21.3 Package Documentation
Each package/module has a `README.md` describing purpose, install, usage, and a minimal example. Keep public exports listed in `index.ts` for a clear surface area.

---

## 22. Database

### 22.1 Approach
TypeScript supports three database approaches, each with trade-offs:

| Approach | Pros | Cons |
|----------|------|------|
| **Raw SQL** (`pg`, `mysql2`) | Full control, transparent, no abstraction overhead | Manual mapping, no compile-time SQL safety |
| **Query Builder** (Knex, Kysely) | Composable, type-safe queries, partial DSL | Learning curve, leaky abstraction over dialects |
| **ORM** (Prisma, TypeORM, Drizzle) | Schema-first, migrations, generated types | Performance overhead, hides SQL complexity |

Choose based on team experience and query complexity. Raw SQL is fine for small services; ORMs pay off in larger domain models.

### 22.2 Connection and Driver

Connection setup using the standard `pg` driver:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // max connections
  idleTimeoutMillis: 30_000,  // close idle clients after 30s
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('unexpected pool error', err);
});

export async function shutdown() {
  await pool.end();
}
```

Parameterized query execution:

```typescript
interface UserRow {
  id: string;
  email: string;
  created_at: Date;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  // GOOD: parameterized — no SQL injection
  const result = await pool.query<UserRow>(
    'SELECT id, email, created_at FROM users WHERE email = $1 LIMIT 1',
    [email],
  );
  return result.rows[0] ?? null;
}

export async function insertUser(email: string): Promise<UserRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<UserRow>(
      'INSERT INTO users (email) VALUES ($1) RETURNING id, email, created_at',
      [email],
    );
    await client.query('COMMIT');
    return result.rows[0]!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

### 22.3 Migrations
Migrations are versioned, ordered SQL files (or DSL definitions) that evolve schema deterministically. Common ecosystem tools: `node-pg-migrate`, `knex migrate`, `drizzle-kit`, framework-bundled CLIs. Convention:
- One migration file per change, timestamped (`20260101120000_add_users.sql`)
- Each migration is reversible when feasible (`up` + `down`)
- Run on deploy before app starts; gate on success
- Never edit a migration after it's been applied to a shared environment

### 22.4 Best Practices
- Always use parameterized queries — never string-concatenate user input
- Add indexes on columns used in `WHERE`, `ORDER BY`, `JOIN`
- Pool connections (default pool size 10-20 for typical services)
- Wrap multi-statement work in transactions; release clients in `finally`
- Set query timeouts (`statement_timeout`) to prevent runaway queries
- Use `EXPLAIN ANALYZE` to validate query plans on real data volumes

---

## 23. Logs and Observability

### 23.1 Log Levels
- **DEBUG** — verbose tracing for development
- **INFO** — normal operational events (request handled, job started)
- **WARN** — unexpected but recoverable (retry triggered, deprecated path)
- **ERROR** — operation failed; needs investigation
- **FATAL** — process must exit; data loss imminent

Default to `INFO` in production; raise to `DEBUG` only with structured sampling.

### 23.2 Structured Logs

Structured logs emit one JSON object per line. Machine-parseable, indexable, and filterable.

Logger setup using Node's `console` with a thin wrapper:

```typescript
type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LEVELS: Record<Level, number> = {
  debug: 10, info: 20, warn: 30, error: 40, fatal: 50,
};

const threshold = LEVELS[(process.env.LOG_LEVEL as Level) ?? 'info'];

export const logger = {
  log(level: Level, msg: string, fields: Record<string, unknown> = {}) {
    if (LEVELS[level] < threshold) return;
    const entry = {
      time: new Date().toISOString(),
      level,
      msg,
      ...fields,
    };
    process.stdout.write(JSON.stringify(entry) + '\n');
  },
  debug(msg: string, fields?: Record<string, unknown>) { this.log('debug', msg, fields); },
  info(msg: string, fields?: Record<string, unknown>)  { this.log('info', msg, fields); },
  warn(msg: string, fields?: Record<string, unknown>)  { this.log('warn', msg, fields); },
  error(msg: string, fields?: Record<string, unknown>) { this.log('error', msg, fields); },
  fatal(msg: string, fields?: Record<string, unknown>) { this.log('fatal', msg, fields); },
};
```

### 23.3 Logging Implementation

Practical use with correlation context:

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  requestId: string;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function logWithContext(level: 'info' | 'error', msg: string, fields: Record<string, unknown> = {}) {
  const ctx = requestContext.getStore() ?? {};
  logger[level](msg, { ...ctx, ...fields });
}

// Usage inside a handler:
async function handleCheckout(orderId: string) {
  try {
    logWithContext('info', 'checkout started', { orderId });
    await processPayment(orderId);
    logWithContext('info', 'checkout completed', { orderId });
  } catch (err) {
    logWithContext('error', 'checkout failed', {
      orderId,
      err: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
    });
    throw err;
  }
}
```

Rules:
- Never log secrets, tokens, passwords, full PII
- Log once per failure at the boundary; let errors propagate with context
- Include identifiers (request id, user id, order id) in every log line
- Output to stdout/stderr; let the platform collect and route logs

### 23.4 Metrics and Observability
Collect the four golden signals: latency, traffic, errors, saturation.

- Instrument I/O calls (DB, HTTP, queue) with duration histograms
- Expose `/health` (liveness), `/ready` (readiness), `/metrics` (Prometheus format) endpoints
- Use OpenTelemetry SDK for traces and metrics — vendor-neutral
- Keep label cardinality bounded — never label with user id, request id, or other unbounded values
- Sample traces at 1-10% in high-traffic services; sample 100% on errors

---

## 24. Golden Rules

1. **Simplicity** — clear code beats clever code; the next reader matters more than today's keystrokes
2. **Explicit Errors** — never swallow; always wrap with context
3. **Tests** — write tests that fail before the fix and pass after; cover the unhappy paths
4. **Documentation** — TSDoc on exports; README on every package; comment the *why*
5. **Measured Performance** — profile before optimizing; document trade-offs in code

---

## 25. Pre-Commit Checklist

### Code
- [ ] `npx prettier --check .` passes
- [ ] `npx eslint .` reports no errors
- [ ] `npx tsc --noEmit` reports no type errors
- [ ] No `any`, `// @ts-ignore`, or unjustified `as` assertions added

### Tests
- [ ] All unit tests pass (`npm test`)
- [ ] Coverage ≥ 70% on changed files; ≥ 80% on critical paths
- [ ] Integration tests pass when DB/external dependencies changed
- [ ] Benchmarks rerun if hot paths were touched

### Quality
- [ ] Errors handled explicitly with context
- [ ] All resources (DB clients, file handles, timers) released in `finally`
- [ ] No hardcoded secrets, URLs, or credentials
- [ ] `npm audit` reports no high/critical vulnerabilities
- [ ] No `console.log` left in production code paths

### Documentation
- [ ] Public functions, classes, and types documented with TSDoc
- [ ] README updated if API or setup changed
- [ ] Comments explain *why*, not *what*
- [ ] CHANGELOG entry added for user-visible changes

### Docker
- [ ] `docker compose build` succeeds
- [ ] `docker compose up` starts cleanly
- [ ] Application health endpoint returns 200 in container

---

## 26. References

### Official Documentation
- TypeScript Handbook — https://www.typescriptlang.org/docs/handbook/intro.html
- TypeScript Release Notes — https://www.typescriptlang.org/docs/handbook/release-notes/overview.html
- Node.js API Documentation — https://nodejs.org/api/
- ECMAScript Specification — https://tc39.es/ecma262/
- TSConfig Reference — https://www.typescriptlang.org/tsconfig

### Style Guides
- Google TypeScript Style Guide — https://google.github.io/styleguide/tsguide.html
- Microsoft TypeScript Coding Guidelines — https://github.com/microsoft/TypeScript/wiki/Coding-guidelines
- Airbnb JavaScript Style Guide — https://github.com/airbnb/javascript

### Essential Tools
- npm — https://docs.npmjs.com
- pnpm — https://pnpm.io
- Prettier — https://prettier.io/docs/en/
- ESLint — https://eslint.org/docs/latest/
- typescript-eslint — https://typescript-eslint.io

### Testing and Performance
- Node test runner — https://nodejs.org/api/test.html
- Jest — https://jestjs.io/docs/getting-started
- Vitest — https://vitest.dev
- autocannon — https://github.com/mcollina/autocannon
- clinic.js — https://clinicjs.org
- 0x flame graphs — https://github.com/davidmarkclements/0x
- Testcontainers Node — https://node.testcontainers.org

### Security
- OWASP Node.js Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html
- Snyk Vulnerability DB — https://security.snyk.io
- npm Security Best Practices — https://docs.npmjs.com/packages-and-modules/securing-your-code

### Observability
- OpenTelemetry JS — https://opentelemetry.io/docs/instrumentation/js/
- Pino — https://getpino.io
- Winston — https://github.com/winstonjs/winston

### Community
- Node.js Best Practices (goldbergyoni) — https://github.com/goldbergyoni/nodebestpractices
- Awesome TypeScript — https://github.com/dzharii/awesome-typescript
- TypeScript Deep Dive — https://basarat.gitbook.io/typescript
