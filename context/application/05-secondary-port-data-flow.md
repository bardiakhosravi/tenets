# Secondary Port Data Flow Rules

## Core Principle
- Use cases orchestrate workflows.
- Repositories retrieve domain models.
- Secondary ports execute outbound capabilities.
- Secondary ports receive domain models, value objects, or cohesive application-owned capability contracts, never repositories.

## Repository Ownership Rules
- Repositories are dependencies of the application layer use cases, not dependencies of secondary ports.
- Use cases MUST load all domain objects required to complete the workflow before invoking a secondary port.
- Secondary ports MUST NOT receive repository instances.
- Secondary port implementations MUST NOT call repositories internally.
- If a secondary port needs more data, add that data to the port contract and have the use case supply it.

```python
# Good: the use case loads the required domain objects, then invokes the port.
class SendInvoiceUseCase:
    def __init__(
        self,
        customer_repository: CustomerRepository,
        invoice_repository: InvoiceRepository,
        email_port: InvoiceEmailPort,
    ):
        self._customer_repository = customer_repository
        self._invoice_repository = invoice_repository
        self._email_port = email_port

    def execute(self, command: SendInvoiceCommand) -> None:
        customer = self._customer_repository.get(command.customer_id)
        if customer is None:
            raise CustomerNotFoundError(command.customer_id)

        invoice = self._invoice_repository.get(command.invoice_id)
        if invoice is None:
            raise InvoiceNotFoundError(command.invoice_id)

        self._email_port.send_invoice(customer, invoice)
```

```python
# Bad: the port hides persistence access behind the outbound capability.
class SmtpInvoiceEmailAdapter(InvoiceEmailPort):
    def __init__(self, customer_repository: CustomerRepository, smtp_client: SmtpClient):
        self._customer_repository = customer_repository
        self._smtp_client = smtp_client

    def send_invoice(self, customer_id: CustomerId, invoice: Invoice) -> None:
        customer = self._customer_repository.get(customer_id)
        # ...
```

## Port Contract Data Rules
- Public secondary-port methods MUST NOT accept naked primitives for domain-semantic values.
- Secondary ports should operate on rich domain objects when the capability requires domain state.
- Use a domain value object when the capability needs one domain concept.
- Use an immutable application-owned capability contract when the capability needs a deliberate subset of domain values.
- Capability contracts use domain value objects for fields with domain meaning; they are not adapter DTOs, HTTP models, persistence models, or vendor SDK objects.
- Prefer passing the appropriate aggregate, entity, value object, or capability contract over passing primitive IDs and duplicated fields.
- Do not pass persistence entities, ORM models, database records, query result rows, or adapter-specific DTOs into secondary ports.
- When identity alone is sufficient, pass a domain ID value object or local cross-context reference ID value object, never a primitive ID.
- Pass a full aggregate only when the capability genuinely needs its cohesive state or behavior.

```python
# Good: aligned with domain language and avoids parameter explosion.
email_port.send_welcome_email(customer)
```

```python
# Also good: a focused capability contract when the port needs only a stable subset.
email_port.send_welcome_email(
    WelcomeEmail(
        recipient=customer.email,
        display_name=customer.display_name,
    )
)
```

```python
# Avoid: primitives duplicate a domain concept the use case already has.
email_port.send_welcome_email(
    customer_id=customer.id,
    email=customer.email,
    first_name=customer.first_name,
    last_name=customer.last_name,
)
```

## Secondary Port Responsibility Rules
- A secondary port should perform one outbound business capability only, such as sending an email, publishing a domain event, generating a PDF, uploading a document, calling an external API, or sending an SMS.
- Fetching domain objects is not part of a secondary port's responsibility.
- Secondary ports should not orchestrate multi-step application workflows.
- Secondary ports must remain persistence-agnostic and have no knowledge of repositories, SQL, ORMs, database schemas, or persistence models.

## Review Checklist
- Does the use case load every aggregate/entity the workflow needs before calling the port?
- Does the secondary port contract avoid repositories, persistence models, ORM rows, database records, and adapter DTOs?
- Does every domain-semantic parameter use an entity, aggregate, value object, domain specification, or cohesive capability contract?
- Does the adapter implement only its outbound capability, without additional repository queries?
- If the port needs only identity, does it receive a domain or local reference ID value object instead of a primitive?
- If the adapter needs more data, should that data be added to the port contract instead of being loaded inside the adapter?
