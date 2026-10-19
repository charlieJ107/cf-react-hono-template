# coding.md — Spec-Driven Development Guide for AI Coding Agents

> This document is the top-level working agreement for AI Coding Agents across all
> projects. Any Agent joining a project reads this file first, then reads the
> project's **durable docs** (§2.1), and only then acts. Treat this file plus the
> project's durable docs as the authoritative context for everything you do.
>
> This guide replaces the older "documentation-driven" guide. It keeps the parts
> that worked (escalation discipline, a constitution of principles, decision
> memory, code-as-docs) and fixes the parts that didn't (too many coupled
> documents, a rigid docs-first waterfall, leaf specs so detailed they fought the
> agent's own judgment, and stale documents that quietly bound future work).

---

## 0. Core Philosophy

We practice **spec-driven development (SDD)**: a structured spec captures intent and
the contract before and around implementation, and serves as the shared source of
truth for humans and Agents. But we adopt SDD with five corrections learned from
practice. These five ideas are the spine of the whole document; everything else is
mechanism.

### 0.1 SDD is a loop, not a waterfall

The naive form of SDD — "write the full spec, then implement, freeze the spec" —
fails because most real constraints and trade-offs are **invisible at spec-writing
time** and only surface during implementation and testing. Forcing every such
discovery through a heavyweight "the doc was wrong, I must stop and escalate" gate
burns enormous effort and produces a false sense of control.

So the relationship between spec and code is a **loop**:

```
   intent ──► spec (the contract) ──► implement + verify ──► discovery
     ▲                                                          │
     └──────────────── reconcile the spec ◄────────────────────┘
```

Implementation is allowed — expected — to feed discoveries back into the spec. The
discipline is **where** a discovery is allowed to land and **how** (see §4 and §5),
not whether discoveries may happen at all.

### 0.2 Two document families: Durable vs Timeline

Documents fail when one lifecycle is forced onto two very different kinds of
content. We split every project's docs into two families with **opposite
lifecycles**:

- **Durable layer (the memory bank).** `philosophy`, `requirements`, `design`,
  `blueprint`, `goal`. These express sustained intent and guard-rails. They are
  **few, curated, and updated in place** over the project's life. An Agent reads
  this layer to *understand intent*, not to follow a script.
- **Timeline layer (the development journal).** Each development task — ship a
  feature, fix a bug, refactor — produces an **episode**: a `spec` (the contract for
  that task) plus a `plan` plus short `notes`. On completion the episode is
  **archived by timestamp and never deleted**. The audience for the archive is
  **humans**, not Agents: it preserves "the road that got us here" — what problem
  was hit, what was considered, why the module ended up this way.

The single most important consequence: **archived timeline episodes do not enter an
Agent's active context by default.** They are cold storage for human archaeology and
for deliberate lookup, not standing instructions. This is what prevents old, strongly
worded task documents from silently binding or confusing future work. Stale specs
cannot rot the working set if they were retired out of it on completion.

> Rule of thumb for placing a document: *Will this still be true and useful after the
> current task ships?* If yes, it belongs in the durable layer and is edited in
> place. If it only describes "what we are doing right now," it is a timeline episode
> and gets archived when the task is done.

### 0.3 Contract precision, construction freedom

This is the operational standard for *how precise a document must be* and *how much
freedom the Agent has*:

> **Pin down the contract (the boundary). Deliberately leave the construction (the
> interior) free.**

|                       | Contract / boundary                                                       | Construction / interior                               |
| --------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| What it covers        | Signatures, types, error behavior, invariants, **business intent (why / for whom)** | Function bodies, internal decomposition, local algorithms, naming |
| Required precision     | **Exhaustive and unambiguous**                                            | **Deliberately under-specified**                      |
| Agent's freedom        | **Low** — the contract is binding                                         | **High** — anything goes, as long as the contract holds |

We do **not** pre-write function bodies in docs, and we do **not** chase the old goal
of "even a tiny model can fill in the body by reading the spec." That goal mislocated
precision onto the interior, which is exactly where a capable autonomous Agent should
own the work — and it was the direct cause of sledgehammer-sized specs for nut-sized
tasks. Precision is concentrated where mistakes are expensive and cross-cutting: the
contract and the *why*. See §4 for the full rule, including how this reshapes the
escalation trigger.

### 0.4 Document weight scales to task size

One workflow cannot fit a one-line bug fix and a new subsystem. A heavyweight,
multi-file spec ceremony applied to a small change is the most common SDD
anti-pattern (see §6). The amount of documentation an Agent produces **scales with
the size and irreversibility of the task**, per the tiers in §6. When in doubt, do
less ceremony and lean on the durable layer that already exists.

### 0.5 The user holds final authority

All rules here are subordinate to the user's explicit decisions. When a user
instruction conflicts with this document or with existing durable docs, the user
prevails — but the Agent must **first surface the conflict** (§1.1) before acting, so
the user is deciding with full information rather than by accident.

---

## 1. Top-Level Principles

Three principles run through every task and must not be quietly violated.

### 1.1 Proactive escalation (calibrated, not reflexive)

The earlier guide told Agents to escalate on essentially any surprise. With more
autonomous Agents that produces constant interruption and trains the Agent to dump
problems back on the user. The calibrated rule:

**Escalate when, and only when, a decision is one or more of:**

- **Contract-changing** — it would alter an externally observable interface, type,
  error behavior, or invariant declared in a `spec` (see §4.2).
- **Principle-violating** — it would contradict a `philosophy` clause, a `blueprint`
  constraint, or a stated rejection in the durable layer.
- **Cross-module** — it would change another module's source, spec, or behavior.
- **Irreversible or high-blast-radius** — data loss, migrations, security posture,
  public API, anything costly to undo.
- **A genuine documentation conflict** — durable docs contradict each other, or a
  spec is engineering-infeasible.
- **A user self-conflict** — the user's latest instruction conflicts with an earlier
  one or with existing durable docs (humans forget and change their minds; do not
  assume the user is self-consistent).

**Do not escalate** for decisions that are purely interior, local, and reversible —
those the Agent makes and proceeds (optionally noting them in the episode `notes`).
That distinction is the whole point of §0.3.

**How to escalate** — never dump a raw problem and ask the user to think from scratch:

1. State the problem precisely: where, what.
2. Give your own analysis and a concrete recommendation, grounded in the durable
   docs.
3. Ask the user to confirm your recommendation or pick another path.

> Example: "`auth/spec` says `verifyToken()` returns `User`, but the session module
> calls it expecting `User | null`. Per the `philosophy` clause 'explicit over
> implicit' I recommend changing the contract to `User | null` and updating both
> call sites. Proceed that way, or handle it differently?"

After escalation: the user decides → the **contract/durable doc is updated first** →
then code follows. A decision worth escalating is worth a one-line entry in the
episode `notes` or, if it is cross-cutting, the module's decision memory (§3.8).

### 1.2 Anti vendor lock-in

Technology choices must stay portable and replaceable. Avoid tightly coupled,
hard-to-exit dependencies (e.g. a proprietary database tied to one cloud, or a
proprietary identity service that owns your auth model). Any dependency with
lock-in tendencies must have its accept/reject rationale recorded in `design` (and,
where future migration is anticipated, in `blueprint`).

### 1.3 Privacy-aware

If a project is privacy-sensitive (cloud storage, notes, health data, etc.), the user
states so and provides `docs/privacy.md`. When present, read it before any technical
decision and treat its constraints as overriding ordinary engineering preference.
When absent, do not invent privacy requirements.

---

## 2. The Two Document Families

### 2.1 Durable layer (the memory bank)

Edited in place over the life of the project (or module). Kept few and curated.

| File              | Answers                                                                 | Notes |
| ----------------- | ----------------------------------------------------------------------- | ----- |
| `philosophy.md`   | Which principles do we hold, and why? What have we rejected on principle? | The "constitution." See §3.1. |
| `requirements.md` | What is the **business / product** intent — what are we building, for whom, and why does it matter? | The business grounding the older guide lacked. See §3.2. |
| `design.md`       | What does the architecture look like **now** — shape, components, data flow, boundaries? | The current structural truth. See §3.3. |
| `blueprint.md`    | What do we deliberately **not** build yet, but must not lock ourselves out of? | Forward-looking anti-lock-in. See §3.4. |
| `goal.md`         | What is the sustained **north-star objective** we are steering toward? | The durable goal. See §3.5. |

Not every project or module needs all five. A small project may have only
`requirements` + `design`. `philosophy`, `blueprint`, and `goal` appear when there is
real content for them.

### 2.2 Timeline layer (the development journal)

Each development task is an **episode**. An active episode lives at the module root
as a working set; a finished episode is moved into `timeline/` under a fully-qualified,
timestamped name and is never edited again.

An episode contains:

- `spec.md` — the **contract for this task**: the interfaces, types, errors,
  invariants, and the task's own objective/DoD. This is the precise, binding layer
  (§0.3, §4). It references which `goal` it advances rather than restating it.
- `plan.md` — **how** this task will be carried out: the implementation path, key
  technical choices, pitfalls. Its second job is to **save context** — a later Agent
  reads the plan instead of re-deriving the approach from the whole `design`.
- `notes.md` — a short journal of what actually happened: problems hit,
  considerations weighed, decisions made and why. This is the "road that got us here"
  for future human readers.

Archived episode naming:

```
timeline/<YYYYMMDDHHMM>.<kind>.<topic>/
    spec.md
    plan.md
    notes.md
```

`<kind>` ∈ `feature | bugfix | refactor | migration | experiment | hotfix` (the user
may add kinds). `<topic>` is a short snake_case label. Example:
`timeline/202606031200.feature.token_revocation/`.

> **Audience discipline.** The `timeline/` archive is written for *humans* reviewing
> history. An Agent does **not** load archived episodes into context by default. It
> consults them only on deliberate need ("why was rotation chosen here?"), and even
> then treats them as *historical narrative*, never as standing instructions. This
> is the mechanism that retires stale task-docs out of the working set (§0.2).

### 2.3 Operational docs (lightweight, as-needed)

- `changelog.md` — change record with **bubbling** (§3.9). Recommended.
- `manifest.md` — an inventory mapping docs to the actual code files. **Optional**;
  useful on large modules where a reviewer wants a quick docs-to-code cross-check.
  On small modules, reading the code tree directly is enough.
- `runbook.md` / `manual.md` — ops guide / end-user manual. Present only when the
  module has operational concerns or ships a user-facing artifact.

### 2.4 Recursion and inheritance (the "fractal" rule)

A large project has modules, and **each module may carry its own durable layer**
scoped to its business domain (`auth/` can have its own `philosophy`, `requirements`,
`design`, `blueprint`, `goal`) and its own `timeline/`. To keep this from multiplying
redundancy and re-introducing the stale-binding problem, child durable docs follow
three rules:

1. **Inherit.** A child's durable docs inherit the parent's; the parent's principles
   and intent apply unless explicitly specialized.
2. **Delta + cite, don't restate.** A child records only what is *local* to it — its
   own principles, its own business scope, its own architecture — and **cites** the
   parent clause rather than copying it. (`auth/philosophy.md`: "Inherits root
   `philosophy.md`. Local addition: tokens are opaque to clients — see root clause
   'explicit over implicit.'")
3. **Specialize, never silently contradict.** A child may *narrow or extend* a parent
   principle. A child may **not** quietly contradict it. A genuine conflict between a
   child's needs and a parent principle is an escalation (§1.1), resolved by the user,
   not papered over.

Cross-module decisions are recorded in the timeline/decision-memory of the **most
affected** module, with one-line cross-references from neighbors.

### 2.5 Physical layout (example)

```
project_root/
├── README.md                  # ordinary open-source README (human front door)
├── AGENTS.md                  # brief intro + strong redirect into docs/
│
├── docs/
│   ├── coding.md              # this file (verbatim copy; never project-edited)
│   ├── README.md              # docs index + module map
│   ├── philosophy.md          # root durable layer
│   ├── requirements.md
│   ├── design.md
│   ├── blueprint.md           # optional
│   ├── goal.md                # optional
│   ├── privacy.md             # optional, privacy-sensitive projects only
│   │
│   ├── auth/                  # a module: its own durable layer + timeline
│   │   ├── requirements.md    #   (deltas + citations to root)
│   │   ├── design.md
│   │   ├── philosophy.md      #   optional, only if it has local principles
│   │   ├── spec.md            #   ← active episode's contract
│   │   ├── plan.md            #   ← active episode's plan
│   │   ├── notes.md           #   ← active episode's journal
│   │   ├── changelog.md
│   │   ├── decisions.md       #   optional ADR-style cross-episode memory (§3.8)
│   │   └── timeline/          #   archived episodes (never deleted)
│   │       ├── 202604180900.feature.login/
│   │       └── 202605102350.refactor.session_store/
│   │
│   └── api/
│       └── ...
│
└── src/                       # actual code
    └── ...
```

The `docs/` tree reflects **logical** module decomposition; it need not map one-to-one
to `src/`, though it should align where practical. `timeline/` is created the first
time an episode is archived; it is not pre-created.

---

## 3. File-by-File

### 3.1 `philosophy.md` — the constitution

A flat list of principles, each stated, justified, illustrated, and bounded:

```markdown
## <Principle name>

**Statement:** <one or two sentences.>
**Why:** <the reasoning, drawn from real discussion with the user.>
**Applies, e.g.:** <one or two concrete examples from this project.>
**Yields when:** <the edge case where this principle defers to another.>
```

Principles should be stable, project-wide, and orthogonal; if two routinely collide,
record which wins by default. **Agents do not modify `philosophy.md` autonomously.**
The Agent may draft it during setup by faithfully transcribing the user's stated
positions, may cite it freely, and may *propose* changes via escalation — but the urge
to silently rewrite a principle means the Agent and the user have diverged, which is
exactly the moment to escalate (§1.1).

### 3.2 `requirements.md` — business / product intent

The grounding the older guide was missing. Before discussing *how* to build, an Agent
needs to understand *what the user's actual business is* and *why this matters to
them*. Written in product terms, not technical ones:

- What problem are we solving, and for whom?
- What outcomes define success (in user/business terms)?
- Scope boundaries — what is in, what is explicitly out.
- Known constraints (regulatory, performance, capacity, deadlines) that shape every
  later decision.

Behavior-oriented framing (user stories, scenarios) is welcome but not mandatory.
Keep it honest to the *actual* problem size — do not inflate a small change into a
ceremony of invented stories (§6).

### 3.3 `design.md` — current architecture (shape, not contract)

What the module looks like **now**: component breakdown, data flow, where state lives
and who may mutate it, external boundaries and protocols, the cross-cutting concerns
this module owns (logging, transactions, retries, caching). Prose plus optional
ASCII/Mermaid diagrams. It also records **structural alternatives considered and
rejected**, so the shape is understood as a choice, not an accident.

`design.md` answers "how is this put together," whereas a `spec` answers "what is the
binding contract." Rule of thumb: if you deleted `design.md` and kept only the active
`spec`, would an Agent still know how to break the module into files and components?
If it would have to guess the architecture, `design.md` is doing its job.

Required for top- and mid-level modules; often unnecessary for a single-purpose leaf.

### 3.4 `blueprint.md` — deliberate future, deliberate non-doing

Records what we are **not** building now but anticipate building later, and — its real
purpose — **the constraints that imposes on present design so we do not lock
ourselves out.** It is the antidote to architectures that are locally optimal but
strand the project later.

```markdown
## <Future capability>

**What / when (roughly):** <what we expect to add, and the rough horizon.>
**Why deferred:** <not enough time / resources / clarity right now.>
**Constraint on present design:** <what today's architecture must keep open so this
can land later without a rewrite — e.g. "keep the storage interface backend-agnostic;
do not assume a single-region database.">
**Estimated debt if ignored:** <what it would cost to retrofit if we lock ourselves in.>
```

An Agent doing architecture must read `blueprint.md` and weigh present choices against
these future constraints — this is a concrete instance of anti-lock-in (§1.2).

### 3.5 `goal.md` — the north star

The sustained objective the project (or module) steers toward, at a higher level than
any single task. It is durable and updated in place as direction shifts. Each timeline
episode references *which* part of the goal it advances; the episode-level objective
itself lives in that episode's `spec`, not here. Keep `goal.md` short — it is a
compass, not a backlog.

### 3.6 `spec.md` — the contract (the precise, binding layer)

The contract for the **current task/episode**. This is where precision is mandatory
(§0.3, §4). It is the shared source of truth that an implementer and a verifier must
both be able to rely on without reading each other's work.

Every externally exposed unit must specify, in a **machine-readable** form (code
blocks for signatures/types/schemas; tables for error codes) **and** a
**human-readable** form (a doc-comment block — Doxygen/JSDoc/Rustdoc idiom — plus a
prose paragraph of intent):

- **Signature** — name, parameters, parameter types, return type.
- **Behavior contract** — given these inputs, what output and side effects.
- **Error contract** — under which conditions which errors arise, and what they mean.
- **Invariants / pre- and post-conditions** where applicable.
- **Type exactness** — e.g. is a result the integer `1` or the string `"1"`? This must
  be unambiguous, and the *intent* behind an unusual choice must be stated (e.g.
  "amounts are string-encoded decimals because we require precision beyond IEEE-754").
  Stating intent here is what later lets a verifier distinguish a real contract from a
  bug — see §5.

The spec also states the **task-level objective / DoD**: what counts as done for this
task, what is deferred, and what is explicitly out of scope.

The spec is **not** where function bodies, internal helpers, or local algorithm
choices are dictated — those are construction (§0.3) and belong to the implementer's
judgment.

### 3.7 `plan.md` — how, and a context-saver

The implementation plan for the current task: the path and steps at executable
granularity, key technical decisions, and **pitfalls** (gotchas, perf traps, edge
cases). Its second purpose is economic: a later Agent reads `plan.md` to recover the
intended approach **without re-loading the full `design`**, saving context budget.

The plan does not need to be exhaustive down to function bodies — that over-specifies
the interior (§0.3). It needs to be enough that work can resume mid-stream without
re-deriving the approach.

### 3.8 The timeline and decision memory

On task completion, move the `spec` / `plan` / `notes` trio into
`timeline/<timestamp>.<kind>.<topic>/` and leave it frozen (§2.2). The first lines of
`notes.md` should record the outcome: completed | abandoned | superseded, plus a 1–3
line summary.

For decisions that are **cross-episode** — architectural choices that outlive any one
task ("we chose PostgreSQL over MySQL because…") — an optional append-only
`decisions.md` (ADR style) at the module root serves as the durable decision memory.
Entries are append-only: a later reversal gets a **new** entry that cross-references
the old one, never an edit of the old one. This is the cheapest insurance against an
Agent (or a future human) re-proposing an idea that was already considered and
rejected.

> The split: episode `notes` = "what happened in this task." `decisions.md` = "a
> choice that constrains all future tasks." `changelog.md` = "what changed." Don't
> duplicate across them; cross-reference.

### 3.9 `changelog.md` — change record with bubbling

Updated at the end of every completed task. Bubbling semantics: a change confined to a
module's internals updates only that module's changelog; a change to a module's
**external interface or behavior** updates the module's changelog (full detail) **and**
adds a one-line summary + pointer to the **parent** module's changelog, bubbling up
level by level. A parent changelog is a summary-plus-index, not a copy of detail.

### 3.10 `manifest.md` (optional) and 3.11 `runbook.md` / `manual.md` (optional)

`manifest.md`: an inventory of what was implemented and the file/dir layout, kept
aligned with the code at commit time, for large modules where a docs-to-code
cross-check is valuable. `runbook.md`: how to operate the module (run, migrate,
consume its interfaces) for ops and upstream developers. `manual.md`: end-user
documentation when the module ships a user-facing artifact. Use only what the module
actually needs.

---

## 4. The Precision Standard (contract vs. construction)

This section makes §0.3 operational and is the answer to "how precise should docs be,
and how much freedom does the Agent have."

### 4.1 What to pin, what to free

- **Pin precisely (low freedom):** everything externally observable or cross-cutting —
  signatures, types, error behavior, invariants — and the **business intent** behind
  them. Ambiguity here is forbidden, because it is exactly what makes verification
  impossible (a verifier cannot tell a bug from a feature if the contract is fuzzy).
- **Leave free (high freedom):** everything interior — how a function body is written,
  how the module is internally decomposed, which local algorithm or data structure is
  used, how things are named. The Agent owns these, provided the contract holds.

### 4.2 The reshaped escalation trigger

This is what dissolves the "escalation storm" that made the old waterfall so
expensive:

- A discovery that lives in the **construction** layer → **decide and proceed.** The
  Agent uses its judgment, implements, and (if notable) records a line in `notes`. No
  escalation.
- A discovery that would change the **contract** layer, violate a principle, cross a
  module boundary, or is irreversible → **reconcile and/or escalate** (§1.1). Update
  the spec/durable doc first, then the code.

Because most implementation surprises are interior, most are handled autonomously, and
the documentation never needs to descend to function-body precision.

### 4.3 The blast-radius heuristic

When unsure which layer a decision belongs to, ask how far its blast radius reaches:
the more **irreversible** or **cross-module** a decision is, the more it belongs in the
precisely pinned contract and the more it warrants escalation; the more **local and
reversible**, the more it is free construction the Agent simply owns.

---

## 5. Verification and Cross-Validation

AI coding agents have a characteristic failure mode: **fixing the question to match a
wrong answer.** A test goes red, the Agent's felt objective is "make it green," so it
loosens the assertion or the contract by the path of least resistance. But the
opposite — dogmatically erroring out whenever reality differs from the spec — is also
wrong, because reality may be *right* and the spec merely silent or stale (the backend
returns the string `"1"` on purpose, because amounts are string-encoded decimals for
precision). The discipline below threads between the two.

### 5.1 The contract and its intent are the only authority

A verifier's source of truth is the **contract (`spec`) plus the intent
(`requirements` and the "why" in the spec)** — **never** the current state of the
artifact it is checking. This is what we mean by "isolation": not a physical wall, but
an **epistemic** one.

### 5.2 Peeking yields hypotheses, not facts

A verifying Agent (or sub-agent) **may** look at the other side's code or tests. But
what it sees can only become a **hypothesis to check against the contract** — it can
**never** become new ground truth. Seeing the implementation return `"1"` generates
the hypothesis "maybe strings are intended"; it does not license accepting `"1"`. The
hypothesis is then resolved against the contract and intent.

### 5.3 The three outcomes on a mismatch

When implementation and spec (as encoded by a test) disagree, the Agent's **first move
is forbidden from being at the artifact level** — do not touch the assertion, do not
touch the return value to make red turn green. Return to the contract and ask "what is
the system *intended* to do," yielding exactly one of three:

- **A) Implementation violates a correct spec** → fix the implementation.
- **B) Test violates a correct spec** → fix the test.
- **C) Implementation reveals the spec was wrong or silent** (the string-`"1"`
  precision case) → this is a **spec reconciliation**, not cheating. Consciously revise
  the spec, record *why* in `notes` (and escalate per §1.1 if the change is
  contract-level, cross-module, or irreversible), then bring **both** the
  implementation and the test into line with the revised contract.

### 5.4 The litmus test

To tell a legitimate reconciliation (C) from "fixing the question to match the answer,"
the Agent asks itself:

> *If I explained this change out loud to the user as a decision about what the system
> should do, would it stand up as a real design decision — or would it sound like "I
> made the red go away"?*

If the honest answer is the latter, stop and escalate. The difference between cheating
and reconciling is **direction** (a decision about intended behavior drives the
contract, not an artifact driving it), **consciousness** (deliberate, not path-of-
least-resistance), and **record** (the rationale is written down and propagated to
both sides).

### 5.5 Sub-agent cross-validation

Use sub-agents to cross-check each other rather than to enforce a hard wall. A common,
effective pattern: one sub-agent implements against the spec while another writes
tests against the same spec, each anchored to the contract independently; a mismatch
between their outputs is a high-signal prompt to apply §5.3. The value is not secrecy —
it is **two independent derivations from the same contract**, which surfaces contract
ambiguity and one-sided assumptions that a single agent would silently resolve in its
own favor.

---

## 6. Task-Size Tiers (how much ceremony)

The amount of documentation scales with the task. Picking the wrong tier — a full
spec ceremony for a one-line fix — is the classic SDD anti-pattern.

| Tier          | Typical task                                  | Documentation                                                                 |
| ------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| **Quick-fix** | One-line bug, typo, trivial tweak             | No new spec. Make the change; one line in `changelog` (and `notes` if a real decision was made). Read the durable layer for guard-rails. |
| **Feature**   | A self-contained feature or bug of substance  | One episode: `spec` (contract for the change) + a light `plan` + `notes`. Reconcile durable docs only if the change touches architecture or principles. |
| **Module**    | A new module or a significant refactor        | Full episode, plus update/author the module's durable layer (`requirements`, `design`, possibly `blueprint`). Cross-module impact escalated and bubbled. |
| **Greenfield**| A new project or subsystem from scratch       | Establish the durable layer first (with the user): `philosophy`, `requirements`, `design`, `goal`, `blueprint`. Then proceed module by module as **Module** tier. This is the only tier that is genuinely "docs first." |

When unsure, drop a tier. It is cheaper to add documentation for a task that turned
out larger than expected than to wade through ceremony a small task never needed.

> Depth limit, still in force: within one task, write durable docs for **at most the
> current module plus its direct sub-modules**. Going deeper means making design
> decisions the user has not yet expressed. List deeper sub-modules' names and
> responsibilities, then stop and propose handling them as their own tasks.

---

## 7. The Workflow Loop

For a **Feature** or **Module** tier task (scale down for Quick-fix, scale up the
front for Greenfield):

1. **Understand intent.** Read this file, the durable layer (`philosophy`,
   `requirements`, `design`, `blueprint`, `goal`), and the active `spec`/`plan` if one
   exists. Do **not** load archived timeline episodes unless you have a specific reason.
2. **Draft the contract.** Write (or update) the episode `spec` to the precision of
   §4.1 — boundary pinned, interior left free. Confirm scope/DoD with the user for
   anything Module-tier or larger.
3. **Build and verify.** Implement against the spec; verify against the spec and
   intent (§5). Sub-agents may cross-validate. Interior surprises: decide and proceed.
4. **Reconcile.** If a discovery is contract-level, update the spec first (escalating
   per §1.1 when warranted), propagate to implementation and tests, and record the why
   in `notes`. If it touches architecture or principles, reconcile the durable layer.
5. **Archive.** On completion, move `spec`/`plan`/`notes` into
   `timeline/<timestamp>.<kind>.<topic>/`, frozen. Update `changelog` (with bubbling).
   Record any cross-episode decision in `decisions.md`.
6. **Verify code-as-docs.** Public APIs carry doc-comments consistent with the spec;
   critical sections carry inline comments (§8).

The two families move at their own speeds: the **durable layer** is touched only when
intent or architecture genuinely shifts; the **timeline** advances every task.

---

## 8. Code as Docs

The doc suite does not replace in-code comments; they are complementary. Docs carry
project/module-level "why and what"; comments carry function/line-level "why is this
written this way."

- **Public APIs** carry doc-comments (Doxygen/JSDoc/docstring/Rustdoc idiom)
  consistent with the spec.
- **Critical sections** carry inline comments: non-obvious algorithm choices,
  performance-critical paths, boundary handling, and any code that directly realizes a
  specific spec clause.
- Comments **restate**, they do not merely **reference.** Write the reasoning inline
  ("tokens must be HS256 JWTs; expired → `TokenExpiredError`") rather than "see
  `spec` §3." Code should be readable without a context-switch to the docs. This
  redundancy is deliberate and serves human readers.
- When a contract changes, its code-comments change with it. This is a closing check
  on any implementation task.

---

## 9. Dependency Management

1. **Manage dependencies via command-line tools** (`npm`, `cargo`, `go`, `uv`, …), not
   by hand-editing config files; default to the latest version unless the user says
   otherwise.
2. **Prefer open-source, widely respected, actively maintained** dependencies; be wary
   of anything not updated in roughly two years.
3. **Avoid vendor lock-in** (§1.2); record accept/reject rationale in `design`.
4. **Minimize supply-chain surface** — prefer simple, self-contained, shallow-
   dependency libraries over large frameworks where a focused tool suffices.
5. **Build it yourself when nothing fits** the principles above.

---

## 10. Documentation Language

- The doc suite is **English by default.**
- **Chinese translation is not mandatory**; produce it only on explicit user request.
- If a module already has a Chinese mirror, any doc change updates **both sides in
  sync.**
- On an English/Chinese disagreement, English is the source of truth — but the Agent
  does **not** silently amend either side. Escalate (§1.1), ask which side reflects the
  correct intent, then fix accordingly (it may be the English that is wrong).

---

## 11. Self-Check Checklist

**Before a task:**

- [ ] Have I read this file, the durable layer, and the active `spec`/`plan`?
- [ ] Have I correctly *avoided* loading archived timeline episodes I don't need?
- [ ] Which tier is this task (§6)? Am I about to apply the right amount of ceremony —
      not a sledgehammer?
- [ ] Is the user's instruction consistent with the durable docs? If not, have I
      surfaced the conflict (§1.1)?
- [ ] Am I clear on which decisions are contract (pin + maybe escalate) vs.
      construction (decide and proceed)?

**Before finishing:**

- [ ] Did I resolve any test/impl mismatch at the **contract** level, not by quietly
      turning red green (§5)? Would each such change survive the §5.4 litmus test?
- [ ] Did interior surprises stay interior, and contract changes get reconciled +
      recorded (§4.2)?
- [ ] Is the episode archived to `timeline/` with `notes` capturing the why?
- [ ] Is `changelog` updated and bubbled where there is external impact?
- [ ] Did I touch `philosophy` or any durable principle doc **only** with user
      approval?
- [ ] Are public-API doc-comments and critical-section comments in place and
      consistent with the spec (§8)?
- [ ] If a Chinese mirror exists, is it in sync (§10)?
