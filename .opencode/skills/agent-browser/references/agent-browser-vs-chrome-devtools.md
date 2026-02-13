# agent-browser vs chrome-devtools

Detailed comparison guide for choosing between browser automation skills.

## Feature Comparison

| Feature | agent-browser | chrome-devtools |
|---------|---------------|-----------------|
| **Engine** | Playwright (via Rust CLI) | Puppeteer |
| **Refs system** | `@e1` inline | `[ref=e1]` YAML |
| **Session persistence** | Named sessions (`--session`) | `.browser-session.json` |
| **Screenshot** | Basic | Auto-compress >5MB (Sharp) |
| **Network intercept** | `route` command | `network.js` script |
| **Console capture** | Basic | With filtering |
| **WebSocket debug** | Limited | Full frames support |
| **Video recording** | Built-in `record` | Not available |
| **PDF export** | Built-in `pdf` | Via Puppeteer API |
| **Auth persistence** | `state save/load` | `inject-auth.js` |
| **Multi-tab** | Full support | Limited |
| **Cloud browsers** | Browserbase native | Manual setup |
| **Performance** | Rust CLI (fast) | Node.js |
| **Custom scripts** | None (CLI only) | 20+ utilities |

## Token Efficiency Benchmarks

| Metric | agent-browser | chrome-devtools | Playwright MCP |
|--------|---------------|-----------------|----------------|
| Homepage snapshot | ~280 chars | ~300-500 chars | ~8,247 chars |
| Context reduction | 93% vs MCP | 90% vs MCP | Baseline |
| Tool definitions | ~2K tokens | 0 (CLI scripts) | ~17K tokens |

**Conclusion:** Both agent-browser and chrome-devtools are similarly efficient. Both dramatically outperform Playwright MCP.

## Use Case Decision Tree

```
Need browser automation?
|
+-- Long autonomous AI session?
|   +-- YES --> agent-browser (better context efficiency)
|   +-- NO --> Continue
|
+-- Need video recording?
|   +-- YES --> agent-browser (built-in)
|   +-- NO --> Continue
|
+-- Cloud browser (CI/CD)?
|   +-- YES --> agent-browser (Browserbase native)
|   +-- NO --> Continue
|
+-- Custom Puppeteer scripts?
|   +-- YES --> chrome-devtools (20+ utilities)
|   +-- NO --> Continue
|
+-- WebSocket debugging?
|   +-- YES --> chrome-devtools (full frames)
|   +-- NO --> Continue
|
+-- Screenshot auto-compression?
|   +-- YES --> chrome-devtools (Sharp)
|   +-- NO --> agent-browser OR chrome-devtools
```

## Parallel Usage Patterns

Both skills can coexist - use the right tool for each task:

```bash
# Quick screenshot with compression -> chrome-devtools
node "$SKILL_DIR/screenshot.js" --url https://example.com --output ss.png

# Long autonomous session -> agent-browser
agent-browser --session test1 open https://example.com
agent-browser snapshot -i
# ... many interactions ...
agent-browser close
```

## Migration Guide

### From chrome-devtools to agent-browser

| chrome-devtools | agent-browser |
|-----------------|---------------|
| `node navigate.js --url X` | `agent-browser open X` |
| `node aria-snapshot.js --url X` | `agent-browser open X && agent-browser snapshot -i` |
| `node select-ref.js --ref e5 --action click` | `agent-browser click @e5` |
| `node fill.js --selector "#email" --value "X"` | `agent-browser fill @e1 "X"` |
| `node screenshot.js --output X.png` | `agent-browser screenshot -o X.png` |
| `node console.js --types error` | No direct equivalent |
| `node network.js` | No direct equivalent |

### Key Differences

1. **Refs format:** `[ref=e5]` vs `@e5`
2. **Session:** File-based vs named sessions
3. **Commands:** Node scripts vs CLI commands
4. **Output:** JSON always vs JSON with `--json` flag

## When to Switch

**Switch to agent-browser when:**
- Starting new long-running automation
- Need video recording capability
- Moving to cloud browsers (Browserbase)
- Want simpler CLI syntax

**Keep chrome-devtools when:**
- Existing workflows depend on custom scripts
- Need WebSocket full-frame debugging
- Need automatic screenshot compression
- Need fine-grained console log filtering
