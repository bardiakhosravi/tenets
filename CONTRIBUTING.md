# Contributing to AI Agent Backend Standards

Thank you for your interest in contributing to this project! This repository provides battle-tested architectural standards for AI agents building Python backend services.

## How to Contribute

### Types of Contributions

1. **Rule improvements**: Clarify existing rules, add examples, or improve explanations
2. **New rules**: Add new architectural patterns based on real-world experience
3. **Example implementations**: Create reference implementations that demonstrate the rules
4. **Documentation**: Improve README, add guides, or enhance explanations

### Getting Started

1. **Fork the repository** and create a feature branch
2. **Read the canonical rules** under `knowledge/rules/` and the
   [knowledge authoring guide](docs/knowledge-authoring.md)
3. **Check existing issues** to see what's needed or create a new issue to discuss your idea
4. **Make your changes** following the guidelines below

### Guidelines for Rule Contributions

- **Be practical**: Rules should be based on real-world experience, not theoretical ideals
- **Provide context**: Explain why the rule matters and when to apply it
- **Include examples**: Show good and bad examples where helpful
- **Consider AI agents**: Write rules that AI coding assistants can understand and apply

### Guidelines for Code Examples

- **Follow the applicable stable rules** in your implementation
- **Use modern Python**: Type hints, Pydantic, FastAPI, etc.
- **Include tests**: Demonstrate testing strategies from the rules
- **Document patterns**: Explain how DDD/Hexagonal patterns are applied
- **Keep it realistic**: Use practical examples, not toy problems

### Pull Request Process

1. **Create an issue first** for significant changes to discuss the approach
2. **Write clear commit messages** following conventional commits format
3. **Test your changes** if contributing code examples
4. **Update documentation** if you're changing or adding rules
5. **Request review** - all PRs require approval before merging

### Rule IDs and Generated Views

- Request the next unused `TENETS-{AREA}-{NNN}` ID; never renumber or reuse an
  existing ID.
- Put one independently remediable policy in each rule file.
- Keep aliases for renamed or deprecated IDs and identify replacements.
- Edit `knowledge/`, not generated `context/` views.
- Run `cd cli && npm run catalog && npm test && npm run bundle`.

### Style Guidelines

- Use clear, concise language
- Follow the existing format for consistency
- Use British English spelling where applicable
- Include code examples in Python with proper syntax highlighting

## Questions?

- Open an issue for questions about contributing
- Check existing issues and discussions
- Review the README for project philosophy

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
