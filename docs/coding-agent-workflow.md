# Coding Agent Workflow

This project was developed with the assistance of AI coding agents (Cursor, Claude Code, Codex).

## How the Agent Was Used

The coding agent assisted with:

1. **Project scaffolding** — Next.js setup, TypeScript config, Tailwind CSS, shadcn/ui
2. **Type system design** — JobRecord, ScraperHealth, HealingEvent types
3. **Bright Data integration** — Client, validator, health checker, self-healing modules
4. **Risk engine** — Deterministic scoring rules and detection functions
5. **Duplicate detection** — Normalization, hashing, similarity detection
6. **Dashboard pages** — All UI components, charts, data tables
7. **API routes** — Clean REST endpoints with proper error handling
8. **Demo mode** — Interactive self-healing demonstration
9. **Documentation** — README, workflow docs, architecture diagrams

## Example Prompts

```
Create the Bright Data scraper for publicly available job listings.
```

```
Validate the collector output against the JobListing schema.
```

```
Detect extraction degradation when required fields disappear.
```

```
Trigger the self-healing workflow when field completeness drops below threshold.
```

```
Build a polished cybersecurity-themed dashboard with dark mode support.
```

## Developer Responsibility

The developer:

- Reviewed all generated code for correctness
- Verified the architecture decisions
- Tested the risk scoring engine
- Validated the self-healing workflow
- Ensured no secrets were exposed
- Confirmed the build succeeds
- Deployed and tested the production build
