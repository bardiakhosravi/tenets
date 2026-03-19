# Hexagonal Architecture Project Structure

This document defines the standard folder structure for Python backend services following Domain Driven Design and Hexagonal Architecture (Ports & Adapters) patterns.

## Overview

- Organize by hexagonal architecture layers with clear port placement
- **Domain ports**: Repository interfaces and domain service ports in domain layer
- **Primary ports**: (driving) define application use cases - belong in application layer
- **Infrastructure secondary ports** (email, messaging, external APIs) - belong in application layer
- **Secondary adapters**: Organize by technology for shared infrastructure and easier maintenance
- **Technology-specific models**: Persistence models live within their respective technology adapters
- **Configuration layer**: Cross-cutting concerns that wire all layers together
- Domain and application layers should only depend on their respective port interfaces
- Adapters layer contains all adapter implementations

## Standard Structure

```
src/
├── domain/
│   ├── model/
│   │   ├── user/
│   │   │   ├── user.py              # Entity
│   │   │   └── email.py             # Value Object
│   │   └── order/
│   ├── ports/                       # Domain Ports (Secondary)
│   │   ├── user_repository.py       # Repository interface (domain concept)
│   │   ├── order_repository.py
│   │   ├── pricing_service_port.py  # Domain service interface
│   │   ├── inventory_service_port.py
│   │   └── domain_event_store_port.py  # Domain-specific event storage
│   └── events/                      # Domain Events
├── application/
│   ├── ports/
│   │   ├── primary/                 # Primary Ports (Use Cases)
│   │   │   ├── create_user_port.py          # Primary Port
│   │   │   ├── change_user_email_port.py    # Primary Port
│   │   │   └── deactivate_user_port.py      # Primary Port
│   │   └── secondary/               # Infrastructure Ports (Secondary)
│   │       ├── email_notification_port.py   # Infrastructure service
│   │       ├── event_publisher_port.py      # Infrastructure service
│   │       └── payment_gateway_port.py      # Infrastructure service
│   ├── use_cases/
│   │   ├── create_user_use_case.py          # Use Case (Primary Port Implementation)
│   │   ├── change_user_email_use_case.py    # Use Case (Primary Port Implementation)
│   │   └── deactivate_user_use_case.py      # Use Case (Primary Port Implementation)
│   ├── commands/
│   ├── queries/
│   └── handlers/
├── adapters/
│   ├── primary/
│   │   ├── web/
│   │   │   ├── user_controller.py       # Primary Adapter
│   │   │   └── order_controller.py
│   │   ├── cli/
│   │   └── messaging/
│   └── secondary/                       # Organized by Technology
│       ├── sql/
│       │   ├── models/                          # SQLAlchemy models
│       │   │   ├── user_model.py
│       │   │   └── order_model.py
│       │   ├── base_sql_repository.py          # Shared base class
│       │   ├── sql_connection_manager.py       # Shared connection handling
│       │   ├── sql_user_repository.py          # Implements UserRepository
│       │   ├── sql_order_repository.py         # Implements OrderRepository
│       │   └── sql_domain_event_store.py       # Implements DomainEventStorePort
│       ├── mongodb/
│       │   ├── schemas/                         # MongoDB schemas
│       │   │   ├── user_schema.py
│       │   │   └── order_schema.py
│       │   ├── mongo_connection.py             # Shared connection
│       │   ├── mongo_user_repository.py        # Implements UserRepository
│       │   └── mongo_order_repository.py       # Implements OrderRepository
│       ├── http/
│       │   ├── base_http_client.py             # Shared HTTP utilities
│       │   ├── http_retry_policy.py            # Shared retry logic
│       │   ├── http_pricing_service.py         # Implements PricingServicePort
│       │   ├── http_payment_gateway.py         # Implements PaymentGatewayPort
│       │   └── http_email_service.py           # Implements EmailNotificationPort
│       ├── messaging/
│       │   ├── rabbitmq_connection.py          # Shared connection
│       │   ├── rabbitmq_event_publisher.py     # Implements EventPublisherPort
│       │   └── rabbitmq_notification_sender.py # Implements NotificationPort
│       └── redis/
│           ├── redis_connection.py             # Shared connection
│           ├── redis_cache_service.py          # Implements CacheServicePort
│           └── redis_session_store.py          # Implements SessionStorePort
└── configuration/                           # Cross-cutting Configuration Layer
    ├── di_container.py                      # Dependency injection container
    ├── database_config.py                  # Database configuration
    ├── app_settings.py                     # Application settings
    └── environment_config.py               # Environment-specific config
```

## Layer Descriptions

### Domain Layer (`src/domain/`)
- **model/**: Contains Entities, Value Objects, and Aggregates organized by domain concept
- **ports/**: Repository interfaces and domain service ports (secondary ports from domain perspective)
- **events/**: Domain event definitions

### Application Layer (`src/application/`)
- **ports/primary/**: Primary ports defining use case interfaces
- **ports/secondary/**: Infrastructure service ports (email, messaging, external APIs)
- **use_cases/**: Use case implementations that implement primary ports
- **commands/**: Command objects for write operations
- **queries/**: Query objects for read operations
- **handlers/**: Event handlers and other cross-cutting handlers

### Adapters Layer (`src/adapters/`)
- **primary/**: Entry point adapters (web controllers, CLI, message consumers)
- **secondary/**: Organized by technology (sql, mongodb, http, messaging, redis, etc.)
  - Each technology folder contains its own models/schemas and adapter implementations
  - Shared infrastructure code (connections, base classes, utilities) lives within technology folders

### Configuration Layer (`src/configuration/`)
- Dependency injection container
- Database and infrastructure configuration
- Environment-specific settings
- Wires all layers together at application startup

## Key Principles

1. **Port Placement**:
   - Domain ports (repositories, domain services) → `domain/ports/`
   - Primary ports (use case interfaces) → `application/ports/primary/`
   - Infrastructure ports (external services) → `application/ports/secondary/`

2. **Adapter Organization**:
   - Primary adapters → `infrastructure/adapters/primary/` (organized by adapter type)
   - Secondary adapters → `infrastructure/adapters/secondary/` (organized by technology)

3. **Technology-Specific Models**:
   - SQLAlchemy models → `infrastructure/adapters/secondary/sql/models/`
   - MongoDB schemas → `infrastructure/adapters/secondary/mongodb/schemas/`
   - Keep persistence models close to their adapter implementations

4. **Dependency Direction**:
   - Domain layer → No external dependencies
   - Application layer → Depends on domain ports only
   - Infrastructure layer → Implements all ports, depends on external frameworks
   - Configuration layer → Depends on all layers to wire them together