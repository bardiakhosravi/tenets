# Architecture Profiles

Tenets profiles let a repository choose how much architectural policy its
coding agents must enforce. Profiles are cumulative:

| Profile | Intended use | Includes |
|---|---|---|
| `core` | Minimum viable architecture boundaries | Essential dependency direction, domain boundaries, ports, and adapter isolation |
| `pragmatic` | Recommended default for production services | `core` plus production-oriented modeling, testing, transactions, and maintainability guidance |
| `strict` | Teams adopting the complete Tenets standard | The entire applicable catalog, including advanced reliability and governance requirements |

Fresh installations use `pragmatic` unless a profile is selected explicitly:

```bash
npx tenets init --claude --profile core
npx tenets init --augment --profile pragmatic
npx tenets init --cursor --profile strict
```

Change an installed repository's commitment level and regenerate every
configured agent integration with:

```bash
npx tenets update --profile strict
```

The selected profile is stored in `.tenets.json`. `tenets update`,
`tenets diff`, and `tenets doctor` use this repository policy. Existing
installations that predate profiles migrate to `strict` with unrestricted
technology applicability so an update does not silently remove rules.

## Enforcement

Profiles affect both context and compliance:

- Generated agent rule files contain only entries active for the selected
  profile and repository technology.
- Architecture-review commands receive an explicit allowlist of active rule
  IDs. An inactive rule cannot be reported as a Tenets violation.
- `tenets explain <rule-id>` can still inspect any catalog entry and reports
  whether it is active for the repository.

This keeps the complete knowledge base discoverable without making every
practice mandatory in every repository.

## Technology Applicability

Profile commitment and technology applicability are separate decisions.
`minimum_profile` says when a rule becomes mandatory; `applies_to` says which
technology contexts can use it. For example, a Flask adapter pattern can require
the `pragmatic` profile while remaining inactive in a FastAPI repository.

Tenets detects applicability during a fresh installation and persists the
result in `.tenets.json`. An empty applicability list means the catalog is not
technology-filtered.
