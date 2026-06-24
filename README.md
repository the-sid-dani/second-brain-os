# Second-Brain OS

A personal AI workspace that runs on your own computer. You talk to it in plain language — it handles your morning briefing, your contacts, your projects, meeting prep, finding old notes, even design mockups.

```
You:  "morning, what's on my plate today?"
You:  "tell me about Sarah"
You:  "I just spoke with Sarah about the launch"
You:  "do I have any notes on Q3 planning?"
You:  "let's start a new project for the product launch"
```

No commands to memorize — it figures out which built-in workflow you need and runs it.

---

## What this is

It turns [Claude Code](https://claude.com/claude-code) into your personal **chief of staff** — or research companion, engineering co-pilot, whatever fits (you pick during setup). You set it up once, then just talk to it like a sharp assistant who knows your projects, your people, and your priorities.

It's not an app or a website. It's a folder on your Mac that Claude Code reads from. **Your data stays on your machine** — nothing leaves unless you explicitly ask it to send something (like posting a Slack message).

---

## Set it up (about 5 minutes)

You need a Mac, [Claude Code](https://claude.com/claude-code), and `git`. Then:

```bash
git clone https://github.com/the-sid-dani/second-brain-os ~/Desktop/second-brain-os
cd ~/Desktop/second-brain-os
claude
```

Inside the Claude session that opens, type:

```
/bootstrap
```

That's the whole setup. `/bootstrap` is a short guided walkthrough — it asks your name, what you want to call your assistant, a sample of how you write, picks a visual style, and creates your folders. It explains each step as it goes and never changes anything without asking.

> Missing `git` or Claude Code? `/bootstrap` checks your machine and tells you exactly what to install. No separate installer needed for the everyday setup.

When it finishes, try **"morning, what's on my plate today?"** or **"let's start a new project for X."**

---

## Talk to it

You don't memorize slash commands — just say what you want, and it picks the right workflow:

| You say | What happens |
|---|---|
| "morning, what's on my plate?" | Builds your daily briefing |
| "tell me about Alex" | Pulls up everything you know about a person |
| "I just talked to Alex about the launch" | Logs it to their profile |
| "do I have anything on prompt caching?" | Searches all your notes + projects |
| "let's start a new project for Q3 planning" | Sets up a new project |
| "what's gone stale?" | Reviews projects you've stopped touching |
| "make me a landing page for the launch" | Renders an HTML mockup (72+ brand styles) |
| "how does X work in this OS?" | Explains itself — reads its own docs live |

You *can* type `/briefing`, `/contact`, etc. directly if you prefer — both work.

---

## Where your stuff lives

`/bootstrap` creates one tidy folder structure (PARA — a simple convention from Tiago Forte's *Building a Second Brain*): a single root folder with six subfolders.

- **`0-Inbox/`** — quick capture, sort later
- **`1-Projects/`** — active work with an end in sight
- **`2-Areas/`** — ongoing areas of responsibility (starts empty; grows as you do)
- **`3-Coding/`** — code repos
- **`4-Resources/`** — your reference library + everything the assistant writes for you (briefings, notes)
- **`5-Archive/`** — finished work (moved here, never deleted)

The assistant knows where everything goes — you mostly never think about it.

---

## Going further (optional)

- **Power-user / coding skills** — want `/research`, `/autonomous`, code review, and AST-aware editing? Run `./scripts/install.sh --with-coding` *before* `claude` (adds a heavier toolchain, ~15 min). The everyday chief-of-staff + design skills need none of it. Details in **`INSTALL.md`**.
- **Bring in your existing work** — already have projects from past Claude Cowork sessions? Run `/migrate-work` (also offered at the end of `/bootstrap`) to discover and import them into your workspace — it **copies, never moves** your originals.
- **Back it up to GitHub** — the steps above clone to your Mac only. To keep a backup or sync across machines, **fork** the repo and clone your fork instead: `gh repo fork the-sid-dani/second-brain-os --clone`.
- **Connect your tools** — `/bootstrap` asks which connectors you use (Google Workspace + Slack recommended; Atlassian and Figma too) and wires them up; you authorize with `/mcp` afterward. Web search and image analysis work out of the box.

---

## How it works (under the hood)

- **Skills** are the pre-built workflows — markdown files in `.claude/skills/`, each describing when Claude should use it. That's how "what's on my plate?" knows to run your briefing.
- **It can explain itself** — ask *"how does X work in this OS?"* (or run `/os-guide`) anytime. It reads its own documentation live, so the answer is never out of date.
- **Deeper docs** — `INSTALL.md` for manual/advanced install, `CHANGELOG.md` for what's changed. Your identity and settings live in one `## Configuration` block in `CLAUDE.md`, which `/bootstrap` fills in.

---

That's the whole thing — clone, `/bootstrap`, talk to it.
