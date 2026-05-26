---
name: code-reasoning
description: >
  A complete reasoning protocol for any AI model or agent tasked with writing,
  understanding, or debugging code in a complex codebase. Follow this skill
  any time you encounter: multi-file codebases, unfamiliar code you must modify,
  bugs with unclear root causes, architecture decisions, refactoring tasks,
  performance investigations, or any task where a wrong step could cascade into
  larger breakage. This skill encodes the full mental process — from first
  contact with a codebase to confident, verified output.
---

# Code Reasoning Skill
### A Protocol for Writing & Debugging Complex Codebases

---

## 0. Core Philosophy (Read This First)

Before any rules, internalize these axioms. Every specific instruction below
derives from them.

> **Axiom 1 — Understand before you act.**
> You cannot write correct code for a system you do not understand. Reading is
> not wasted time. It is the work.

> **Axiom 2 — Never assume. Verify.**
> Assumptions compound silently. One unchecked assumption makes the next one
> feel safe, and so on. Treat every "I think this does X" as a question, not a
> fact.

> **Axiom 3 — The codebase is the truth.**
> Documentation lies. Comments drift. Variable names mislead. Only the actual
> running code tells you what actually happens. When in doubt, trace execution.

> **Axiom 4 — Small, reversible steps.**
> Large leaps introduce large unknowns. Every step should be small enough that
> you can fully understand and verify it before taking the next.

> **Axiom 5 — Leave a clean trail.**
> You will revisit your reasoning. Write your intermediate conclusions down
> (in scratchpad, comments, or notes). Never hold more than you can reconstruct.

---

## Phase 1 — First Contact: Understanding the Codebase

### 1.1 — Orient Before You Read

When you encounter a codebase for the first time, resist the urge to start
reading files immediately. First, answer these orienting questions:

- **What is this system supposed to do?** (from the task description, README,
  or user's words — not from the code itself yet)
- **What kind of codebase is this?** (web app, library, CLI tool, API service,
  data pipeline, embedded system, etc.)
- **What language and runtime?** (affects how control flow, memory, and errors
  work)
- **What is the entry point?** (where does execution begin?)
- **What does "working correctly" look like?** (what is the success criterion
  for your task?)

Write these answers down before reading a single source file. They are your
anchor. You will return to them constantly.

### 1.2 — Build the Directory Map

List the top-level directory structure. Do NOT read file contents yet.
Your goal is to build a mental map of *regions* of the codebase:

```
src/
  api/         → HTTP layer, routes, request/response handling
  services/    → business logic
  models/      → data structures and DB interaction
  utils/       → shared helpers
  config/      → environment configuration
tests/
  unit/
  integration/
```

Label each folder with a one-line description of its responsibility.
If a folder's purpose is unclear from the name, note it as "unknown — investigate."

Do not proceed until you can sketch this map from memory. If you cannot, you
have not built a real mental model yet.

### 1.3 — Identify the Spine

Every codebase has a *spine* — the chain of files and modules that carry the
most critical functionality. Find it:

1. Start at the entry point (e.g., `main.py`, `index.ts`, `app.js`, `server.go`).
2. Follow the primary execution path through 3–5 function calls without
   branching. Note each hop.
3. Identify where the core data transformation happens (input → processing →
   output).
4. Mark the boundary layers: where external data enters the system, where it
   leaves, and where side effects occur (DB writes, API calls, file I/O).

The spine is where you will spend 80% of your effort. Know it before anything
else.

### 1.4 — Understand the Data Model

Before writing any logic, understand the primary data structures:

- What are the core types/classes/interfaces/structs?
- What does the "main object" look like? (e.g., a `User`, `Order`, `Event`)
- What is mutable vs. immutable?
- Where does data come from (DB schema, external API contract, user input)?
- What are the invariants? (properties that must always be true)

If there is a schema file (`.prisma`, `.sql`, JSON Schema, TypeScript interfaces,
Protobuf definitions), read it completely before reading any logic code.
The shape of data constrains every function that touches it.

---

## Phase 2 — Targeted Reading: Going Deeper

### 2.1 — Read With a Question

You should never open a file without a specific question you are trying to
answer. Purposeless reading fills your context window without building
understanding.

Good reading questions:
- "How does authentication work in this codebase?"
- "Where is the database connection established and closed?"
- "What happens when this function returns an error?"
- "What calls this function, and what does it expect back?"

Write the question before opening the file. After reading, write the answer.
If you cannot answer it after reading, note why and what would help.

### 2.2 — Read Call Sites Before Implementations

When you encounter an unfamiliar function, read how it is *called* before you
read how it is *implemented*. The call site tells you:

- What inputs are expected (including implicit assumptions about their state)
- What the caller does with the return value
- Whether errors are being handled or ignored
- What the contract is from the caller's perspective

This is critical because implementations often have dead code, side effects, or
surprising behaviors that only make sense when you understand why they were
built that way.

### 2.3 — Trace Data, Not Just Code

Most bugs and architectural confusion come from data reaching an unexpected
state. When reading, actively trace the data:

1. Pick a specific input value (a real one, not a hypothetical).
2. Follow it step by step through the code.
3. At each function boundary, ask: "What is the exact shape and value of this
   data right now?"
4. Note every transformation, filtering step, or mutation.
5. Continue until the data reaches its final destination.

This "concrete instance tracing" will reveal assumptions that abstract reading
misses every time.

### 2.4 — Annotate Uncertainty Explicitly

As you read, maintain a running list in this format:

```
KNOWN:
  - UserService.createUser() always hashes the password before writing
  - The DB pool is initialized once at startup in db.ts

UNCERTAIN:
  - Does getUserById() return null or throw when user is not found?
  - Is the `updated_at` field set by the application or the database trigger?

UNKNOWN:
  - What the `legacy_mode` flag in config actually enables
  - Why there is a second Redis client initialized in cache.ts
```

You must make your uncertainty explicit. An uncatalogued assumption is a
ticking time bomb.

---

## Phase 3 — Writing New Code

### 3.1 — Plan Before You Type

Never write a single line of code before you have a plan at least one level
of abstraction above the code itself. For any non-trivial function or feature:

1. Write a pseudocode or plain-English description of what you will do.
2. List the functions or modules you will call or create.
3. Identify the exact inputs and outputs of your new code.
4. Identify every external dependency your code will touch.
5. Identify every failure mode: what can go wrong, and what should happen.

If you cannot do steps 1–5, you do not understand the task well enough to
write code yet. Go back to Phase 1 or 2.

### 3.2 — Match the Codebase's Conventions

Before writing, observe the codebase's style decisions:

- **Naming conventions**: camelCase, snake_case, PascalCase, screaming_snake?
  Functions vs. classes vs. constants?
- **Error handling pattern**: exceptions, error return values, Result types,
  callbacks with `(err, result)`, or something else?
- **Async pattern**: async/await, Promises, callbacks, goroutines, coroutines?
- **Logging pattern**: structured JSON logs? printf-style? A specific logger
  library?
- **Abstraction level**: Does this codebase favor thin functions and flat
  modules, or deep class hierarchies?

Your new code must be indistinguishable from the existing code in style.
Inconsistency is technical debt and the source of real bugs (e.g., mixing
two error-handling patterns means errors will silently swallow in the seam
between them).

### 3.3 — Write in Layers, Innermost First

For any new feature that spans multiple functions or files:

1. **Write the core transformation first.** The pure function that does the
   actual work, with no I/O, no side effects, just input → output.
2. **Write the data access layer.** Functions that fetch or persist data.
3. **Write the orchestration layer.** The function that coordinates the above.
4. **Write the interface layer last.** The HTTP handler, CLI command, or event
   listener that is the public entry point.

This order keeps each layer testable and reviewable independently.
Never write the interface layer first — it locks in assumptions before you
know if the inner logic is sound.

### 3.4 — Name Everything Precisely

Poor names are silent bugs. Rules for naming:

- A function name must describe *what it does*, not *how it does it*.
  `getUserById` is good. `fetchFromDB` is too vague. `runQuery47` is terrible.
- A boolean variable or parameter should be a yes/no question.
  `isActive`, `hasPermission`, `shouldRetry` — not `active`, `permission`,
  `retry`.
- A function that returns a boolean should be named as a predicate.
  `isValid()`, `canAccess()`, `hasExpired()` — not `validate()`, `check()`.
- If you find yourself adding a comment to explain what a variable *is*,
  that comment should be the variable name.

### 3.5 — Handle Every Edge Case Explicitly

When writing a function, do not just write the happy path. Before you consider
the function done, explicitly enumerate and handle:

- **Null / undefined / empty inputs**: What happens if the input is null,
  an empty list, or a zero-length string?
- **Boundary values**: What happens at the minimum and maximum valid values?
- **Concurrency**: If two callers call this simultaneously, is the result
  correct? Are there race conditions on shared state?
- **Partial failure**: If this function does three things and the second one
  fails, what state is the system left in? Is that safe?
- **Network/IO failure**: If any external call in this function fails, is the
  error surfaced clearly or silently swallowed?

Each of these should either be handled in code or explicitly documented as a
known limitation.

### 3.6 — Write the Verification Step Before Finishing

Before marking any code as done, define the condition that would prove it
works:

- What exact input would exercise the new code path?
- What exact output or side effect would confirm it ran correctly?
- What input would exercise the main error path?

If you cannot define this, your implementation criteria are not specific
enough. Return to 3.1.

---

## Phase 4 — Debugging

### 4.1 — Define the Bug Precisely First

The most common debugging mistake is starting to look for a cause before
defining the problem. Before reading any code, answer:

- **What is the exact observed behavior?** (not "it crashes" — the exact error
  message, the exact wrong output value, the exact incorrect state)
- **What is the expected behavior?** (the specific correct output or state)
- **When does it occur?** (every time? under specific conditions? after a
  certain event?)
- **When does it NOT occur?** (this is often the most informative question)
- **What changed recently?** (new deployment, new input, config change?)

Write this down. You are not allowed to form a hypothesis until you have
written out all five answers.

### 4.2 — Reproduce Before You Investigate

A bug you cannot reproduce is a bug you cannot fix. Before searching for the
root cause:

1. Find or construct the minimal input or sequence of steps that reliably
   triggers the bug.
2. Verify you can trigger it consistently.
3. Verify you know what "fixed" looks like (you can recognize when the bug
   is gone).

If you cannot reproduce it, your investigation will be guesswork. Do not
proceed until reproduction is confirmed.

### 4.3 — Bisect the Problem Space

Once you can reproduce the bug, do not start reading code at random.
Narrow the search space systematically:

**Step 1: Identify the fault boundary.**
The bug lives somewhere between the input entering the system and the wrong
output being produced. Your goal is to find the *smallest possible section of
code* that contains the bug.

Ask: "At what point in the execution does the data first have a wrong value
or wrong state?"

Work backwards from the wrong output, or forwards from the correct input, until
you find the exact function or line where the data goes wrong.

**Step 2: Use binary elimination.**
If the execution path is long (10+ steps), do not read all of them.
Check the midpoint first:
- Is the data correct halfway through the execution? If yes, the bug is in the
  second half. If no, it is in the first half.
- Repeat until you have isolated the faulty section to 1–3 functions.

**Step 3: Never skip ahead.**
Do not jump to a "likely" suspect before eliminating other candidates.
Confirmation bias in debugging wastes more time than any other single error.

### 4.4 — Form Hypotheses Formally

Once you have isolated the suspect code region, form a hypothesis:

```
HYPOTHESIS: [specific claim about the cause]
PREDICTION: [if this hypothesis is true, then I would expect to see X]
TEST: [the exact check that would confirm or deny this hypothesis]
```

Example:
```
HYPOTHESIS: The `calculateTotal()` function does not account for items with
  quantity = 0, causing them to be included in the sum.
PREDICTION: If I trace calculateTotal() with a cart that has a zero-quantity
  item, the result will be larger than the sum of non-zero items.
TEST: Read calculateTotal() and trace it with input [{price: 10, qty: 0},
  {price: 5, qty: 2}]. Expected correct output: 10. If output is 20, hypothesis
  is confirmed.
```

You must have a falsifiable prediction before running any test. If your test
does not distinguish between "hypothesis true" and "hypothesis false," it
is not a test — it is speculation.

### 4.5 — Read Error Messages Completely and Literally

Error messages are frequently misread. Rules:

- Read the **full** error message, including the parts after the first line.
  Stack traces and chained error messages almost always contain the most useful
  information in lines 2 and beyond.
- Take the wording **literally**. "Cannot read property 'id' of undefined"
  does not mean "something is wrong with `id`" — it means a specific object
  that was expected to exist is `undefined`. The variable before `.id` is the
  problem.
- Check the **line number and file** cited in the error. Read that exact line
  in full context (3–5 lines above and below).
- For compilation errors: fix them in the order they appear. Errors cascade —
  later errors are often symptoms of earlier ones.

### 4.6 — Check Assumptions at Every Layer

When a bug is not where you expect it to be, it is usually because an
assumption is false at a layer boundary. At each function boundary in the
suspect region, verify:

- **Input assumptions**: Is the input actually what the function thinks it is?
  (right type? right shape? not null? correctly encoded?)
- **State assumptions**: Is the global or object state what the function
  assumes it to be when it runs?
- **Timing assumptions**: Is this running in the order you think?
  (especially relevant with async code, event listeners, and caches)
- **Environmental assumptions**: Are environment variables, config files, and
  feature flags set to the values you believe?

Incorrect assumptions at layer boundaries account for a majority of bugs that
are "impossible" on first inspection.

### 4.7 — Fix the Root Cause, Not the Symptom

Before applying a fix, ask: "Is this the deepest cause, or is it a symptom of
something further upstream?"

A symptom fix passes the immediate test but leaves the real cause in place,
where it will re-emerge in a different form.

Signs you are fixing a symptom:
- Your fix involves adding a null check for something that "should never be
  null."
- Your fix involves catching an error that "should never be thrown."
- Your fix makes one specific test pass but feels wrong for the general case.

If any of those apply, trace the bug one level upstream and ask why the
unexpected state exists in the first place. Fix it there.

### 4.8 — Verify the Fix Does Not Break Adjacent Behavior

After applying a fix, your verification must cover more than the original bug:

1. **Confirm the bug is gone**: Does the original reproducing case now produce
   the correct output?
2. **Test the adjacent happy paths**: Does the code still work correctly for
   inputs that were working before?
3. **Test the adjacent edge cases**: Does the fix hold up at boundary values,
   empty inputs, and error paths?
4. **Check for new assumptions introduced by the fix**: Does your fix itself
   assume something that could be false?

A fix that breaks adjacent behavior is net negative — it trades one bug for
another.

---

## Phase 5 — Cross-Cutting Principles

These apply to both writing and debugging at all times.

### 5.1 — Track Your Context Window

You can only hold a limited amount of code in your working memory at once.
When the relevant code spans many files:

- Maintain an explicit list of the files you have read and what you learned.
- When moving from one file to another, write a one-sentence summary of the
  previous file before leaving it.
- If you feel confused, the most likely cause is that your mental model has
  drifted. Re-read the orienting notes from Phase 1.

### 5.2 — Know the Difference Between Correlation and Causation in Code

Just because two things happen together does not mean one causes the other.
This is especially common in async and event-driven code. A function that runs
right before a bug appears is a witness, not necessarily the cause.

Always trace from the symptom backwards through the data flow to identify
cause. Do not work from temporal proximity alone.

### 5.3 — Distinguish Configuration From Logic Bugs

A significant class of bugs are not logic errors — they are configuration
errors (wrong environment variable, wrong feature flag, wrong database URL,
wrong version of a library). Before deep-diving into business logic, check:

- Are all required environment variables set and set correctly?
- Is the application connecting to the environment it thinks it is? (staging
  vs. production, local vs. remote DB)
- Is the version of every dependency what the code was written against?

### 5.4 — Surface Uncertainty, Never Hide It

When you are not certain about a conclusion, say so explicitly. The format is:

```
CONFIDENT: X is true because Y and Z both confirm it.
LIKELY: X is probably true because Y, but I have not confirmed Z.
UNCERTAIN: X might be true, but I lack evidence. The key unknown is [Q].
```

Never present a likely conclusion as a confident one. The downstream consumer
of your analysis (a human, another agent, or your own next step) will act on
your confidence level. Misrepresented certainty causes compounding errors.

### 5.5 — Do Not Refactor While Debugging

When debugging, your only job is to understand the current behavior and restore
correct behavior. Refactoring while debugging:

- Changes the code, making it harder to confirm your reproduction case
- Introduces new bugs that mix with the original bug
- Makes it impossible to isolate whether a change fixed the original issue or
  introduced a new (accidentally correct) behavior

Log refactoring opportunities as notes. Do them in a separate pass after the
bug is fixed and verified.

### 5.6 — Prefer Explicit Over Clever

When writing a fix or new code, always choose the more explicit implementation
over the clever one:

- Clever code impresses no one when it is wrong and is nearly impossible to
  debug.
- Explicit code reveals its assumptions. Clever code hides them.
- If you find yourself writing a solution that you cannot explain in plain
  English in one sentence, it is too clever. Decompose it.

### 5.7 — Verify, Do Not Trust Memory

In long reasoning sessions, you will believe you read something in a file that
you actually did not, or that a function works in a way it does not. This is
not a flaw — it is universal. The mitigation is:

- Before making a claim about a specific function's behavior, re-verify it
  against the source.
- Before writing code that calls a function, re-read the function's signature
  and contract.
- Before claiming a bug is fixed, re-trace the execution path with the fix in
  place.

Memory degrades. Source code does not.

---

## Phase 6 — Checklists

### Pre-Code Checklist (run before writing any implementation)

```
[ ] I can describe what this system does without looking at it
[ ] I know the entry point and the spine of the codebase
[ ] I have read the core data model / schema
[ ] I know the error handling pattern used in this codebase
[ ] I know the naming and style conventions used in this codebase
[ ] I have written a plain-English description of what my code will do
[ ] I have listed every external function, module, or service I will call
[ ] I have listed every failure mode and decided what to do for each
[ ] I know what "correct" output looks like for the main case
[ ] I know what "correct" output looks like for the edge cases
```

### Pre-Debug Checklist (run before investigating any bug)

```
[ ] I have written down the exact observed wrong behavior
[ ] I have written down the exact expected correct behavior
[ ] I have identified when it occurs and when it does not
[ ] I have identified what recently changed
[ ] I can reproduce the bug reliably
[ ] I know what "fixed" looks like
[ ] I have identified the full execution path from input to wrong output
[ ] I have not yet formed a hypothesis (too early until checklist is done)
```

### Post-Fix Checklist (run before declaring a bug fixed)

```
[ ] The original reproducing case now produces correct output
[ ] The code still works for inputs that worked before the fix
[ ] The fix handles edge cases (null, empty, boundary values)
[ ] The fix addresses the root cause, not just the symptom
[ ] I can explain in plain English why the fix works
[ ] I have not introduced new assumptions that could be false
[ ] There is no refactoring mixed into the fix
```

---

## Appendix: Common Reasoning Errors to Avoid

| Error | Description | Antidote |
|---|---|---|
| **Assumption stacking** | Building each step on an unverified assumption from the last | Explicitly mark every assumption; verify before acting on it |
| **Confirmation bias** | Looking for evidence that your hypothesis is right instead of testing if it is wrong | Write a test that would *disprove* the hypothesis, not just confirm it |
| **Depth-first tunnel vision** | Following one path so deep you forget you chose it arbitrarily | Periodically resurface and ask: "Is this the highest-priority path to investigate?" |
| **Symptom fixation** | Fixing the place where the error surfaces rather than where it originates | Always trace one level upstream; ask "why is this in a wrong state?" |
| **Context drift** | Your mental model of a file drifts from reality as the session progresses | Re-read critical sections rather than relying on earlier notes |
| **Clever-code trap** | Writing an elegant solution that optimizes for brevity at the cost of clarity | If you cannot explain it in one sentence, decompose it |
| **Parallelism blindness** | Treating async / concurrent code as if it executes sequentially | Always ask: "What is the guaranteed execution order here? Could this run out of order?" |
| **Interface trust** | Trusting a function's name or documentation without reading its actual behavior | Read the implementation, not just the signature, for anything critical |
| **Scope creep while debugging** | Refactoring or "improving" code while the original bug is still open | No changes except the minimum necessary to fix the specific bug |
| **False binary** | Assuming a problem must be in one of two places | Enumerate all possible locations systematically before ruling any out |

---

*This skill encodes a systematic, verifiable reasoning process. Every rule exists
because the opposite behavior produces silent, compounding errors in complex
systems. Apply it in full — partial application produces partial results.*
