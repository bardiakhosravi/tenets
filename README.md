# Tenets

The tenets of writing quality backend code -- starting with Hexagonal Architecture and Domain-Driven Design.

**Tenets** provides opinionated, battle-tested rules that your AI coding agents follow when building backend services. Install them with a single command and your agent immediately knows how to structure domains, ports, adapters, and everything in between.

## 🤖 Why This Exists

AI coding agents like Claude Code, Cursor, and GitHub Copilot can generate incredible amounts of code quickly. But **code quality still matters**. We're not at the point where we can be completely hands-off -- we constantly review, iterate, and guide these tools toward better implementations.

For effective code review and collaboration with AI agents, we need **predictable design patterns**. This is even more crucial with AI-generated code since these tools can produce entire features at once, making architectural consistency vital for maintainability.

Tenets solves this by giving your coding agents the context and rules they need upfront, so every generated line of code follows the same architectural principles your team agreed on.

## 🚀 Quick Start

### Install with the CLI

```bash
npx tenets init --claude
```

That's it. The DDD + Hexagonal Architecture tenets are now in your project's `CLAUDE.md`, ready for Claude Code to follow.

### Pick Your Tool

```bash
npx tenets init --cursor        # writes to .cursorrules
npx tenets init --copilot       # writes to .github/copilot-instructions.md
npx tenets init --agents        # writes to AGENTS.md
npx tenets init --claude        # writes to CLAUDE.md
```

| Flag | Tool | Target File |
|------|------|-------------|
| `--claude` | Claude Code | `CLAUDE.md` |
| `--cursor` | Cursor | `.cursorrules` |
| `--copilot` | GitHub Copilot | `.github/copilot-instructions.md` |
| `--agents` | AGENTS.md | `AGENTS.md` |

### Interactive Mode

Not sure which tool? Just run it without flags and follow the prompts:

```bash
npx tenets init
```

The CLI will walk you through selecting your tool and confirming the install.

### Keeping Tenets Up to Date

As Tenets evolves with new patterns and learnings, update your project to the latest version:

```bash
npx tenets update
```

This pulls the latest rules and updates the files that were previously installed in your project.

## 🏗️ What's Inside

These tenets are based on years of building backend services using:

- **Domain-Driven Design (DDD)** -- Rich domain models, ubiquitous language, clear bounded contexts
- **Hexagonal Architecture (Ports & Adapters)** -- Separation of concerns, testability, technology independence
- **Practical Patterns** -- Aggregate design, domain events, application services, repository contracts, and more

Tenets covers the full spectrum of backend service development:

1. **Getting started** with a new service from scratch
2. **Evolving** an existing service with new features and capabilities
3. **Building multiple services** that interact with each other

## 🎯 Language Support

Tenets currently focuses on Python implementations, providing concrete examples and patterns optimized for Python's language features and ecosystem.

We'd love to collaborate with experts in other languages to expand coverage. If you're experienced with Java, C#, Go, TypeScript, or other languages, contributions that translate these architectural rules into language-specific implementations are welcome.

## 🤝 Contributing

This is a living set of tenets based on real-world experience, and there's always room for improvement.

### How to Contribute

1. **Open an Issue** -- Propose new tenets, improvements, or discuss existing ones
2. **Submit a PR** -- Add new patterns, fix examples, or improve clarity
3. **Share Examples** -- Real-world implementations that follow Tenets rules
4. **Language Adaptations** -- Help translate tenets to other languages

### What We're Looking For

- 🔍 **Uncovered Scenarios** -- Backend development situations not yet addressed by the current tenets
- 🎨 **Missing Design Patterns** -- Additional patterns that complement DDD and Hexagonal Architecture
- 🛠️ **Implementation Strategies** -- Better approaches for distributed systems, event sourcing, or CQRS
- 🧪 **Advanced Testing Patterns** -- Testing strategies for complex domain logic and integration scenarios
- 📊 **Real-World Examples** -- Case studies showing Tenets rules applied in production systems

## 🧠 Philosophy

> "I think of AI coding agents as another developer on my team -- I expect them to follow the same best practices."

These tenets ensure that:

- **Code is reviewable** -- Predictable patterns make AI-generated code easier to understand
- **Architecture is consistent** -- Clear tenets prevent architectural drift across features and services
- **Teams can collaborate** -- Shared tenets improve team efficiency, whether the author is human or AI
- **Systems remain maintainable** -- Good architecture scales with your codebase

## 📚 Additional Resources

- [Domain-Driven Design by Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)
- [Hexagonal Architecture by Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture by Robert Martin](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)

## 📄 License

MIT License -- see [LICENSE](LICENSE) file for details.

## ⭐ Support

If Tenets helps you build better backend services with AI agents, please:

- ⭐ Star this repository
- 🔗 Share with your team
- 💬 Open discussions for improvements
- 🤝 Contribute your own learnings

---

*Tenets for better backend services -- one rule at a time.*
