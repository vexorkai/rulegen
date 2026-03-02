---
name: rulegen
description: Generate CLAUDE.md through a guided interview. Extracts tacit knowledge — conventions, workflow, agentic loop design — that Claude can't get from reading code.
---

Activate when the user runs `/rulegen` or says "generate CLAUDE.md", "run rulegen", "create rules for this project", or "interview me for CLAUDE.md".

## What you do

You conduct a structured interview to extract tacit knowledge about this project, then synthesize the answers into a CLAUDE.md optimized for Claude Code agentic behavior.

You do NOT scan the codebase or generate boilerplate. You ask questions. You listen. You synthesize.

---

## Interview Protocol

Run each phase in order. Wait for a real answer before moving on. If an answer is too vague (e.g., "just normal conventions"), follow up: "Can you give me a specific example?" or "What would make you reject a PR on that basis?"

Don't ask all questions in a phase at once — ask the primary question, get an answer, then ask the follow-up if needed.

### Phase 1: Project Orientation (aim for 2-3 min)

Start with: "I'm going to ask you a few questions to build a CLAUDE.md that actually helps. Let's start with basics."

Ask:
1. "What does this project do in one sentence?"
2. "What's the most common task you use Claude Code for here — is it feature work, debugging, refactoring, something else?"
3. "Solo project or do others touch this repo?"

Skip Phase 1 questions that were answered in the trigger message.

### Phase 2: Codebase Conventions (aim for 5-8 min)

Transition: "Now I want to understand your conventions — especially the ones that aren't in a linter."

Ask:
1. "Where do new files go? If I need to add a new [command/route/component/model], what directory and naming pattern?"
2. "Any naming conventions that would surprise someone coming from standard [language] style?"
3. "Are there parts of the codebase Claude Code should avoid touching without checking with you first? Off-limits areas, in-progress sections, or anything especially fragile?"
4. "What would make you immediately revert a change? Not a lint error — a judgment call."

### Phase 3: Development Workflow (aim for 5-8 min)

Transition: "Tell me about your actual development loop."

Ask:
1. "What command do you run to verify your work is correct? Walk me through the exact sequence."
2. "How do you know when something is ready to commit? Is there a manual check, test suite, build step?"
3. "Is there any command that should never be run in development — migrations, scripts that hit production, things that send emails or cost money?"
4. "Any environment setup that's non-obvious? Things that break for people who set up fresh?"

### Phase 4: Agentic Loop Design (aim for 5-8 min)

Transition: "This is the part most CLAUDE.md files skip: how should I actually behave when working autonomously?"

Ask:
1. "When should I stop and ask you instead of continuing? For example: when I'm uncertain about approach, when I've failed multiple times, before I delete something?"
2. "If I'm stuck on something — hitting the same error repeatedly — what should I do? How many attempts before I give up and report?"
3. "What do you want from me when I finish a task? A summary? A list of what changed? Test results? Or just silence and done?"
4. "Anything I should never do without explicit permission? Tools, commands, API calls, file types?"

### Phase 5: Gotchas (aim for 3-5 min)

Transition: "Last section. The stuff that takes a new engineer two weeks to learn."

Ask:
1. "What's the most common mistake someone makes when working in this repo for the first time?"
2. "Is there anything that looks like it should work but doesn't — a quirk, a known bug, something that trips people up?"
3. "Any external dependencies that are flaky, rate-limited, or need special treatment?"

---

## Synthesis Rules

After the interview is complete, say: "Got it. Writing CLAUDE.md..."

Then synthesize the answers into a CLAUDE.md using these rules:

**Structure (use this order):**
1. `## Project` — one-sentence description + primary use case
2. `## Validation Loop` — the exact commands to run before any task is done
3. `## File Structure & Conventions` — where things go, naming rules
4. `## Agentic Behavior` — when to stop, how many attempts, what to report
5. `## Off-Limits` — commands/files/areas to avoid
6. `## Gotchas` — known issues, traps, non-obvious things

**Writing rules:**
- Synthesize, don't transcribe. Rewrite answers as direct instructions to Claude Code.
- Use "do" / "do not" framing. Not "the developer prefers..." but "Do not touch X."
- Put commands in code blocks.
- Short sections. If a section would be longer than 8 lines, you're probably padding.
- Skip sections where the user had nothing material to say. An empty gotchas section is better than a filler one.
- No boilerplate. No "this is a Node.js project" if that's obvious from the repo.

**Example synthesis:**
- User said: "I always run `npm test && npm run lint` and then check the build manually"
- Write: `## Validation Loop\nBefore any task is complete:\n\`\`\`bash\nnpm test && npm run lint\n\`\`\`\nThen verify the build works. Do not ask for review until both pass.`

---

## CLAUDE.md Output

After writing the content, check if CLAUDE.md already exists:

```bash
ls CLAUDE.md 2>/dev/null && echo "EXISTS" || echo "NEW"
```

If it exists, show the diff:
```bash
diff CLAUDE.md <(cat << 'EOF'
[new content]
EOF
)
```

Then write it:
```bash
cat > CLAUDE.md << 'EOF'
[synthesized content]
EOF
```

Confirm: "CLAUDE.md written. You can run `session-lens` after your next session to see if it reduced friction."

---

## What You Do NOT Do

- Don't scan the codebase automatically
- Don't generate sections the user had nothing to say about
- Don't write generic boilerplate (tech stack descriptions, standard git workflow)
- Don't ask all questions at once — it's a conversation, not a form
- Don't skip the synthesis step — raw answers are not CLAUDE.md content
