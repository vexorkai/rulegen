# rulegen

A Claude Code skill that generates `CLAUDE.md` through a guided interview — not static code scanning.

Claude can read your codebase. What it can't do is read your mind. rulegen asks the right questions to surface what's in your head: the conventions you enforce, the workflows you follow, the things that trip up every AI assistant that touches your project.

## What it extracts

- **Project orientation** — what this project does, who it's for, what "done" looks like
- **Conventions** — naming, patterns, things that aren't written anywhere but matter
- **Workflow** — how you actually develop, test, and validate
- **Agentic loop design** — stop conditions, retry limits, how Claude should self-verify
- **Gotchas** — the things that always go wrong, the footguns, the tribal knowledge

## Install

```bash
mkdir -p ~/.claude/skills
curl -o ~/.claude/skills/rulegen.md https://raw.githubusercontent.com/vexorkai/rulegen/master/rulegen.md
```

Claude Code auto-loads skills from `~/.claude/skills/`.

## Usage

In a Claude Code session, type:

```
/rulegen
```

Claude will walk through a structured interview with you. Answer honestly — the output quality scales directly with how much you share. The more specific you are, the more useful the generated `CLAUDE.md` will be.

At the end, Claude writes `CLAUDE.md` to your project root.

## Why interview-driven?

Static analysis tells Claude what your stack is. It already knows that from reading your files.

What it doesn't know: why you made the decisions you did, what patterns you refuse to break, how to test without breaking prod, when to stop and ask vs. when to keep going. That knowledge lives in your head. rulegen pulls it out.

## License

MIT
