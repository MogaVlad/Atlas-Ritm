#!/usr/bin/env bash
# setup-claude.sh — installs the Claude Code skills + MCP servers for the hackathon project.
#
# Run from anywhere inside the project's git repo:   bash scripts/setup-claude.sh
# Safe to run more than once. Works on macOS, Linux and Windows (Git Bash / WSL).
#
# What it installs (project level, so it can be committed and shared with the team):
#   Skills  -> .claude/skills/
#     - frontend-design              (Anthropic)  distinctive, non-generic UI
#     - webapp-testing               (Anthropic)  Playwright testing + screenshots of the local app
#     - web-design-guidelines        (Vercel)     UI / accessibility / UX audit
#     - vercel-react-best-practices  (Vercel)     React + Next.js best practices
#   MCP servers -> .mcp.json
#     - context7    up-to-date library docs (Next.js, Tailwind, shadcn/ui, ...)
#     - playwright  lets Claude open the app in a browser and see it
#   Machine-level extras (per developer, not committed):
#     - Chromium for Playwright, Python Playwright for the webapp-testing skill (if Python exists)

set -u

# ---------- pretty output ----------
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
err()  { printf '  \033[31m✗\033[0m %s\n' "$1"; }
step() { printf '\n\033[1m%s\033[0m\n' "$1"; }

FAILED=()

# ---------- 0. preconditions ----------
step "0. Checking prerequisites"

if ! command -v git >/dev/null 2>&1; then err "git not found. Install Git first."; exit 1; fi
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "${ROOT}" ]; then err "Not inside a git repository. Run this from the project repo."; exit 1; fi
cd "${ROOT}" || exit 1
ok "Project root: ${ROOT}"

if ! command -v node >/dev/null 2>&1 || ! command -v npx >/dev/null 2>&1; then
  err "Node.js (with npx) not found. Install Node.js 20+ from https://nodejs.org and rerun."; exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "${NODE_MAJOR}" -lt 18 ]; then err "Node ${NODE_MAJOR} is too old. Install Node.js 20+."; exit 1; fi
ok "Node $(node -v)"

if command -v claude >/dev/null 2>&1; then ok "Claude Code CLI found"; else warn "Claude Code CLI not on PATH (fine if you run Claude Code another way)"; fi

# ---------- 1. skills ----------
step "1. Installing Claude Code skills into .claude/skills/"

install_skill () {
  local repo="$1" skill="$2"
  if npx -y skills add "${repo}" --skill "${skill}" --agent claude-code -y >/tmp/skill-install-$$.log 2>&1 \
     && [ -f ".claude/skills/${skill}/SKILL.md" ]; then
    ok "${skill}  (${repo})"
  else
    err "${skill}  (${repo})  — see log below"; tail -n 15 /tmp/skill-install-$$.log | sed 's/^/      /'
    FAILED+=("skill:${skill}")
  fi
  rm -f /tmp/skill-install-$$.log
}

install_skill anthropics/claude-plugins-official frontend-design
install_skill anthropics/skills                  webapp-testing
install_skill vercel-labs/agent-skills           web-design-guidelines
install_skill vercel-labs/agent-skills           vercel-react-best-practices

# ---------- 2. MCP servers (.mcp.json, merged, never overwritten) ----------
step "2. Registering MCP servers in .mcp.json"

if node - <<'NODE'
const fs = require("fs");
const file = ".mcp.json";
let cfg = {};
if (fs.existsSync(file)) {
  try { cfg = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { console.error("  .mcp.json exists but is not valid JSON: " + e.message); process.exit(1); }
}
cfg.mcpServers = cfg.mcpServers || {};
const wanted = {
  context7:   { command: "npx", args: ["-y", "@upstash/context7-mcp"] },
  playwright: { command: "npx", args: ["-y", "@playwright/mcp@latest"] },
};
for (const [name, def] of Object.entries(wanted)) {
  if (!cfg.mcpServers[name]) cfg.mcpServers[name] = def;
}
fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
console.log("  servers now registered: " + Object.keys(cfg.mcpServers).join(", "));
NODE
then ok ".mcp.json ready (context7, playwright)"; else err ".mcp.json could not be written"; FAILED+=("mcp.json"); fi

# ---------- 3. machine-level extras (each developer) ----------
step "3. Machine-level extras (browsers for testing)"

if npx -y playwright install chromium >/tmp/pw-$$.log 2>&1; then
  ok "Chromium for Playwright installed"
else
  warn "Chromium install failed (Playwright MCP may still use your installed Chrome)"; tail -n 5 /tmp/pw-$$.log | sed 's/^/      /'
fi
rm -f /tmp/pw-$$.log

PY=""
# "$c -c ''" skips the Windows Store alias stub, which exists on PATH but is not Python
for c in python3 python; do command -v "$c" >/dev/null 2>&1 && "$c" -c '' >/dev/null 2>&1 && { PY="$c"; break; }; done
if [ -n "${PY}" ]; then
  if "${PY}" -m pip install --quiet playwright >/dev/null 2>&1 \
     || "${PY}" -m pip install --quiet --user playwright >/dev/null 2>&1 \
     || "${PY}" -m pip install --quiet --break-system-packages playwright >/dev/null 2>&1; then
    "${PY}" -m playwright install chromium >/dev/null 2>&1 && ok "Python Playwright ready (webapp-testing skill)" \
      || warn "Python Playwright installed, browser download failed"
  else
    warn "Could not pip-install Python Playwright; webapp-testing can still guide JS Playwright tests"
  fi
else
  warn "Python not found; skipping Python Playwright (webapp-testing will use JS Playwright instead)"
fi

# ---------- 4. summary ----------
step "4. Summary"
echo "  Skills installed:"; for d in .claude/skills/*/; do [ -f "${d}SKILL.md" ] && echo "    - $(basename "$d")"; done
echo "  MCP servers in .mcp.json:"; node -p 'Object.keys(require("./.mcp.json").mcpServers).map(s=>"    - "+s).join("\n")'

if [ "${#FAILED[@]}" -gt 0 ]; then
  printf '\n\033[31mSome steps failed:\033[0m %s\n' "${FAILED[*]}"
  echo "Fix the issue above and rerun: bash scripts/setup-claude.sh"
  exit 1
fi

cat <<'NEXT'

All done. Next steps:
  1. Restart Claude Code in this folder (skills and MCP servers load at startup).
  2. When Claude Code asks to approve the project MCP servers (context7, playwright), approve them.
     You can check them anytime with:  /mcp
  3. Only ONE person commits these files for the team:
       git add .claude/skills skills-lock.json .mcp.json && git commit -m "chore: Claude Code skills + MCP setup"
NEXT
