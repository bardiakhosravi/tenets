# Architecture Review Demo Fixture

This small FastAPI Ordering service exists to demonstrate the Tenets
installation and focused architecture-review workflow. It intentionally
contains three boundary violations:

1. A use case imports a concrete repository adapter.
2. A secondary port receives naked primitives for domain-semantic values.
3. A secondary adapter receives a repository and loads an aggregate.

Do not use this fixture as a reference implementation. The violations are
preserved by contract tests so the recorded demo remains reproducible.

Run the fixture tests from the repository root:

```bash
python3 -m unittest discover examples/architecture-review-demo/tests
```

Generate a temporary initialized copy and capture the real CLI output:

```bash
demo/act-009/capture-demo.sh
```

The complete recording source and reproduction instructions live under
[`demo/act-009/`](../../demo/act-009/README.md).
