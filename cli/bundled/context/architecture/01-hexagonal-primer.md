# Hexagonal Architecture Primer

Hexagonal architecture, also known as Ports and Adapters, is a design pattern that separates business logic from technical concerns. It aims to isolate the core domain from external systems, making the application more maintainable, testable, and adaptable to change.

This architecture organizes the system into four main components:

- **Domain**: The core business logic and rules, independent of frameworks and technologies.  
- **Application**: Coordinates domain logic and defines application-specific tasks.  
- **Ports**: Interfaces that define communication between the application and the outside world.  
- **Adapters**: Implementations of ports that connect to external systems like databases, APIs, or user interfaces.

See [components.md](./components.md) for detailed responsibilities and checklists.
