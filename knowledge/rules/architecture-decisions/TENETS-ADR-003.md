---
id: TENETS-ADR-003
title: Superseded decisions preserve history
kind: rule
status: stable
category: architecture-decisions
severity: warning
profiles: ["core"]
related: ["TENETS-ADR-001", "TENETS-ADR-002"]
aliases: []
---
## Rule

Record a materially changed decision in a new ADR and retain the previous ADR with a status that points to its replacement.

## Rationale

Preserved history explains the assumptions behind existing code and prevents later edits from rewriting the rationale that maintainers originally followed.

## Incorrect

```text
Edit an accepted ADR's Decision section until it describes its replacement.
```

## Correct

```markdown
## Status

Superseded by ADR-0019
```

## Remediation

Restore the historical decision where possible, create a replacement ADR, and link the old and new records.

## Review check

Verify that material decision changes create new records while maintenance edits remain limited to status, links, corrections, references, and clearly marked later context.
