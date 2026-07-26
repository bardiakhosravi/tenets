# Knowledge Authoring

Tenets separates canonical knowledge from agent-facing delivery views.

## Structure

```text
knowledge/
  rules/       one independently remediable policy per file
  patterns/    reusable implementation guidance
  schema.json  canonical metadata contract
  views.json   generated compatibility-view definitions
catalog/
  rules.json   generated machine-readable catalog
context/       agent-facing guides; some are generated views
```

Files containing `<!-- tenets:generated-source -->` must not be edited directly.
Change their source entries or `knowledge/views.json` and regenerate them.

## Rule Contract

Every rule has a permanent `TENETS-{AREA}-{NNN}` ID and these sections:

- `Rule`
- `Rationale`
- `Incorrect`
- `Correct`
- `Remediation`
- `Review check`

Every pattern has `Purpose`, `Implementation`, `Trade-offs`, and
`Related rules`. Metadata follows `knowledge/schema.json`. `related` records
useful neighbours, `requires` records prerequisites, and `supersedes` records
policy lineage. Use `profiles` to identify general and language-specific
applicability.

An ID identifies policy meaning, not a filename or heading. Never renumber,
reuse, or silently change the meaning of an ID. A removed policy remains
resolvable as `deprecated`, supplies `replaced_by`, and may retain old IDs in
the replacement's `aliases`.

## Examples

Examples belong to one hypothetical multi-tenant commerce SaaS. Use coherent
contexts such as Identity, Customer Accounts, Catalog, Ordering, Inventory,
Billing, and Notifications. Do not introduce an unrelated example domain into
canonical knowledge.

## Build and Validate

From `cli/`:

```bash
npm run catalog
npm test
npm run bundle
```

`npm run catalog` validates metadata, required sections, IDs, aliases, and
references before generating `catalog/rules.json` and compatibility views.
`npm test` checks that generated files are current. `npm run bundle` packages
the catalog and views for offline CLI use.

Inspect a bundled entry with:

```bash
node bin/tenets.js explain TENETS-PORT-005
node bin/tenets.js explain TENETS-PORT-005 --json
```
