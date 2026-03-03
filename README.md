# rulegen

A Claude Code plugin that generates `CLAUDE.md` through a guided interview — not static code scanning.

Claude can read your codebase. What it can't do is read your mind. rulegen asks the right questions to surface what's in your head: the conventions you enforce, the workflows you follow, the things that trip up every AI assistant that touches your project.

## What it extracts

- **Project orientation** — what this project does, who it's for, what "done" looks like
- **Conventions** — naming, patterns, things that aren't written anywhere but matter
- **Workflow** — how you actually develop, test, and validate
- **Agentic loop design** — stop conditions, retry limits, how Claude should self-verify
- **Gotchas** — the things that always go wrong, the footguns, the tribal knowledge

## Install

From the CLI:

```bash
claude plugin marketplace add vexorkai/rulegen
claude plugin install rulegen@vexorkai-rulegen
```

Or from inside a Claude Code session:

```
/plugin marketplace add vexorkai/rulegen
/plugin install rulegen@vexorkai-rulegen
```

## Usage

In a Claude Code session, type:

```
/rulegen
```

Claude walks through a structured interview — project orientation, conventions, workflow, agentic behavior, and gotchas. At the end, it writes `CLAUDE.md` to your project root.

## Why interview-driven?

Static analysis tells Claude what your stack is. It already knows that from reading your files.

What it doesn't know: why you made the decisions you did, what patterns you refuse to break, how to test without breaking prod, when to stop and ask vs. when to keep going. That knowledge lives in your head. rulegen pulls it out.

## License

MIT
