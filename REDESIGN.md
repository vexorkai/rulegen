# rulegen — Redesign: Interview-Driven Knowledge Extraction

## What Went Wrong in v0.1

v0.1 scans your codebase and generates CLAUDE.md from what it finds — package.json,
directory structure, lint configs, that kind of thing. The output is technically accurate
and completely useless.

Why? Because the things Claude Code actually needs to know are not in the code.

- Your team's naming conventions are in someone's head, not a linter rule.
- Your validation workflow ("always run the integration test suite before committing") is
  a habit, not a script.
- Your agentic loop design ("if the agent fails twice, stop and ask") is a policy decision.
- Your project's gotchas ("the API client is not thread-safe, don't parallelize those calls")
  exist nowhere except the memory of whoever hit that bug.

Code scanning can surface stack and structure. It can't extract tacit knowledge.

The new rulegen is built around one insight: the fastest way to capture tacit knowledge
is to ask good questions.

---

## What the New rulegen Does

An interview. You run it, it asks questions, you answer, it writes CLAUDE.md.

Not a survey — a branching conversation. It follows up based on what you say. It knows
which topics matter for your stack. It pushes back when your answer is too vague to be
useful ("tell me more" / "what does that look like in practice?").

At the end, it produces a CLAUDE.md that reads like it was written by a senior engineer
who has been on your team for six months and knows exactly what Claude Code needs to not
step on landmines.

---

## The Interview Structure

### Phase 1: Project Orientation (2-3 min)
Quick facts. Mostly for context, not for CLAUDE.md output directly.

Questions:
- What does this project do in one sentence?
- Who is the primary user of Claude Code on this repo? (solo, small team, large team)
- What's the most common task you use Claude Code for here?

Why: Shapes the depth and focus of everything that follows. Solo developer on a side
project needs different CLAUDE.md content than a team with a shared repo.

### Phase 2: Codebase Conventions (5-8 min)
The stuff that's not in the linter.

Questions:
- Walk me through how you name things: files, functions, variables. Any patterns that
  would surprise someone coming from a standard Python/JS/Go convention?
- Where do new files go? If I need to add a new command / route / model, what directory,
  what naming pattern?
- What would make you immediately reject a PR? Not a lint issue — a judgment call.
- Are there parts of the codebase that are intentionally messy or in-progress? Where
  should Claude Code NOT touch without checking first?

Why: These are the "file does not exist" errors and wrong-path mistakes from session-lens
data. Most friction comes from the agent not knowing project layout and conventions.

### Phase 3: Development Workflow (5-8 min)
How you actually work.

Questions:
- Describe your test-run-verify loop. What command do you run to know if something works?
- How do you know when a change is ready to commit? Is there a manual check, a test suite,
  a build step?
- What's your debugging flow when something breaks? Do you add print statements, use a
  debugger, check logs?
- Is there a "don't run this in development" command? Migrations that cost money, tests
  that hit prod APIs, scripts that send emails?

Why: The validation loop is the most important thing in a CLAUDE.md. If Claude doesn't
know how to verify its own work, it will ship broken changes and you'll spend turns
correcting it.

### Phase 4: Agentic Loop Design (5-8 min)
How Claude Code should behave in autonomous mode.

Questions:
- When should Claude Code stop and check with you instead of continuing?
  (Examples: uncertain about approach, hitting errors repeatedly, about to delete something)
- How many attempts should it make before giving up on a subtask?
- What output do you want when it finishes a task? (Summary? Changed files? Test results?
  Nothing, just done?)
- Do you want it to suggest next steps, or just do exactly what was asked?
- Are there tools or commands it should avoid? (network calls, API writes, anything dangerous)

Why: This is almost never written down anywhere. Most CLAUDE.md files don't address
agentic behavior at all. This is the highest-leverage section.

### Phase 5: Domain-Specific Gotchas (3-5 min)
The stuff that would take a new engineer two weeks to learn.

Questions:
- What's the most common mistake a new contributor makes in this repo?
- What's one thing that looks like it should work but doesn't?
- Any external dependencies that are flaky, rate-limited, or need special handling?
- Anything about auth, credentials, or environment setup that's non-obvious?

Why: Session data shows agents hitting the same environment and path errors repeatedly.
These are usually known issues that just never made it into documentation.

---

## Output Format

The interview produces a structured CLAUDE.md, not a dump of your answers.

The tool synthesizes. It takes "I always run `make test && make lint` before committing"
and writes:

```markdown
## Validation Loop
Before considering any task complete, run:
```bash
make test && make lint
```
Both must pass. Do not ask me to review until they do.
```

Not a transcript. Not your raw words. A document optimized for Claude Code consumption:
- Short sections with clear headers
- Commands in code blocks
- Explicit "do" / "do not" framing
- Ordered by priority (validation loop first, gotchas last)

---

## CLI vs Skill

Both. Different entry points, same interview engine.

### As a Claude Code skill (`/rulegen`)
You run it inside an active Claude Code session. Claude Code conducts the interview
interactively using its conversation interface. Output gets written to CLAUDE.md in the
current project directory. Natural fit for developers already in Claude Code.

Skill trigger: `/rulegen` or "generate CLAUDE.md for this project"

The skill has Claude Code ask each question in sequence, wait for a real answer, and
follow up. At the end it writes CLAUDE.md and shows a diff if one already exists.

### As a standalone CLI (`rulegen interview`)
You run it in a terminal. A Node.js CLI using readline/inquirer for the interface.
Better for: CI setup, offline use, teams where not everyone uses Claude Code.

```bash
npx rulegen interview         # full interview, writes CLAUDE.md
npx rulegen interview --section workflow  # just the workflow section
npx rulegen update            # re-runs interview for sections that seem stale
```

The CLI version can still use an LLM (via claude CLI or API) to synthesize answers into
clean CLAUDE.md prose, or it can template-fill without LLM if you want zero API cost.

---

## What We Don't Do

- We don't scan your code. v0.1 did this. It's not the point.
- We don't generate boilerplate sections (project description, tech stack). Those are
  filler. A good CLAUDE.md is short and specific, not comprehensive and generic.
- We don't auto-update on every commit. The interview is intentional — it captures
  judgment calls, not file changes.
- We don't try to cover everything. A 20-line CLAUDE.md that covers your validation loop
  and three critical gotchas is worth more than a 200-line one that's 90% obvious.

---

## Differentiation vs. What Exists

Existing tools (including rulegen v0.1, similar projects):
- Scan code → generate docs. Fast, shallow, mostly useless for agentic behavior.

What we do:
- Extract tacit knowledge through structured interview.
- Focus specifically on agentic loop design (how should Claude behave autonomously?).
- Synthesize answers into opinionated, Claude-optimized CLAUDE.md, not generic docs.

The closest analog is how a good onboarding document is written: by sitting with the
team lead and asking questions, not by running `find .` on the repo.

---

## MVP Scope

v0.2 is the skill version only. Fastest path to dogfooding.

Deliverable:
- `rulegen.md` skill file in `~/.claude/skills/`
- Skill conducts the 4-phase interview via Claude Code conversation
- Writes `CLAUDE.md` to current project directory at end
- Diff shown if CLAUDE.md already exists
- No external API calls required (Claude Code already running)

After dogfooding on 3+ real projects, decide:
- Is the interview length right? (too long = people bail)
- Is the output quality good enough to be worth the time?
- Is there a section that generates 80% of the value? (probably validation loop + gotchas)

Then build the CLI if the skill proves the concept.

---

## Success Metric

After running rulegen on a project, the next Claude Code session on that project should
have measurably fewer correction turns and tool errors than before. That's the test.

session-lens can measure this directly. Run a session, /reflect, note error rate.
Add rulegen CLAUDE.md. Run a comparable session, /reflect again, compare.

These two tools are meant to be used together.

---

## Implementation Notes (v0.2 Skill)

### What was built

`rulegen.md` — a Claude Code skill file that conducts the 5-phase interview and writes CLAUDE.md.

Installed at `~/.claude/skills/rulegen.md`.

### Testing on robinhood-cli

Conducted a synthetic interview on robinhood-cli using session-lens data + code inspection as input. Key findings:

**What the interview surface that code scanning would miss:**
- The pre-tool-use Write hook that rejects certain file paths (visible in session-lens error data — not in any config file)
- The "read-only by design" constraint that shapes ALL command decisions
- The PyInstaller gotcha about data files + robinhood.spec
- The robin_stocks API centralization rule (calls only in api.py)

**Skill behavior notes:**
- Phase 4 (agentic behavior) is the highest-leverage section. The robinhood-cli CLAUDE.md's "Stop and ask before" and "fails twice = stop and report" rules came from that phase.
- Phase 5 (gotchas) captured the PyInstaller issue and the 401 behavior — these are exactly the kind of things that cause session-lens to show repeated errors.
- The no-scan rule holds. Nothing in the generated CLAUDE.md came from `find .` or `cat package.json`.

**Output quality:**
- 5 sections, ~50 lines, no padding.
- Reads like it was written by someone who has been burned by each gotcha.

### What would improve it

1. The skill currently has no way to follow up on previous CLAUDE.md — "update" mode (re-running specific sections) would be useful after the codebase evolves.
2. Phase 2 (conventions) questions are slightly too abstract for CLI projects. Would benefit from stack-aware branching: different questions for Python CLI vs React app vs Node.js service.
3. The skill can't run itself on the existing CLAUDE.md to check for contradictions or staleness. Future: add a `/rulegen check` variant that audits the current file.

### Verdict

The skill approach works. The interview structure surfaces tacit knowledge that code scanning cannot. session-lens + rulegen together close the loop: see where friction is happening, fix the CLAUDE.md that's supposed to prevent it.

Build the CLI version after dogfooding the skill on 3+ real projects.
