<p align="center">
  <img src="provider-switcher.jpeg" alt="Provider Switcher" width="280">
</p>

# Payment Provider Switcher

A payment provider failover system with automatic retry logic and health monitoring.

## Intro

Manages multiple payment providers with intelligent failover, retry mechanisms, and health checks. When a provider fails, the system automatically switches to the next available provider.

## Features

- **Multi-provider support** - Seamlessly switch between providers
- **Retry logic** - Configurable retry attempts with exponential backoff
- **Structured logging** - Including level, metadata and context

## Tech Stack
- NestJS, TypeScript
- TypeORM + SQLite
- Mockoon for MockAPI
- Axios for HTTP requests
- Jest for testing

## Architecture


### Context Diagram

Shows the system's interaction with users and external payment providers.
```mermaid
graph TB
    subgraph "Provider Switcher System"
        User[📱 User<br/>Deposits Money]
        PaymentSystem[💲 Payment Service<br/> in NestJS]
        ProviderA[Payments Provider A<br/>Main]
        ProviderB[Payments Provider B<br/>Backup 1]
        ProviderC[Payments Provider C<br/>Backup 2]
        DB[(💾 SQLite<br/>Providers & Transactions)]
    end
    
    User -->|POST /payments| PaymentSystem
    PaymentSystem -.->|1- Primary Attempt| ProviderA
    PaymentSystem -.->|2- If A fails| ProviderB
    PaymentSystem -.->|3- If B fails| ProviderC
    PaymentSystem -->|Persists data| DB
```

### Containers Diagram

Responsibility Pattern: Each ProviderHandler wraps a provider service and automatically passes failed requests to the next handler in the chain. If all providers fail, a custom exception returns a 503 Service Unavailable response.

```mermaid
graph TB    
    subgraph PaymentSystem["Payment Service<br/>[NestJS Application]"]
        API["PaymentsController<br/>[REST API /payments]<br/>"]
        
        Orchestrator["PaymentsService<br/>[Service]<br/>Payment processing"]
        
        Switcher["ProviderSwitcherService<br/>[Service]<br/>Manages the chain"]
        
        ChainHandler["PaymentHandler<br/>[abstract]<br/><br/>Chain of Responsibility<br/>base class"]
        
        Exception["PaymentProvidersUnavailableException<br/>[Custom Exception]<br/>503 Service Unavailable"]
        
        subgraph Handlers["Handler Chain"]
            HA["ProviderHandler<br/>[Concrete Handler]<br/>Wraps ProviderAService"]
            HB["ProviderHandler<br/>[Concrete Handler]<br/>Wraps ProviderBService"]
            HC["ProviderHandler<br/>[Concrete Handler]<br/>Wraps ProviderCService"]
        end
    end
    
    ExtA["Provider A API<br/>[External REST API]"]
    ExtB["Provider B API<br/>[External REST API]"]
    ExtC["Provider C API<br/>[External REST API]"]
    
    API --> Orchestrator
    Orchestrator --> Switcher
    Switcher --> ChainHandler
    ChainHandler -.-> HA
    HA -->|"on failure"| HB
    HB -->|"on failure"| HC
    HC -.->|"all failed"| Exception
    Exception -.->|"503 response"| API
    
    HA -->|"HTTP Request"| ExtA
    HB -->|"HTTP Request"| ExtB
    HC -->|"HTTP Request"| ExtC
```

### Design Patterns and Best Practices

The implementation leverages proven architectural patterns:
- **Chain of Responsibility** - Sequential provider fallback handling
- **Dependency Injection** - Loose coupling and testability via NestJS
- **Repository Pattern** - Data access abstraction with TypeORM
- **Retry with exponential backoff** - Resilient HTTP request handling
- **Custom logger implementation** - Structured logging with context

## Setup

```bash
npm install
npm start:dev
```

## Testing

### Unit Tests
Tests for individual services, utilities, and components:
```bash
npm test                # Run all unit tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Run tests with coverage report
```


## Provider Response Matrix

Simulates real-world API behavior across providers. Each provider returns different responses on consecutive calls to test failover scenarios and retry logic.

| Provider | Endpoint | Response 1 | Response 2 | Response 3 |
|----------|----------|------------|------------|------------|
| Provider A | /api/v1/payments | 200 - Approved | 500 - Internal Server Error | 504 - Gateway Timeout |
| Provider B | /payments | 200 - Approved | 429 - Rate Limit Exceeded | 503 - Service Unavailable |
| Provider C | /payments | 200 - OK | 401 - Unauthorized | 429 - Too Many Requests |

## Future Enhancements

- **Configuration** - Mock API response distribution, retry mechanism
- **Data persistence** - Store transaction history and provider metrics
  - Entity Relation Diagram for database schema
  
```mermaid
erDiagram
    PAYMENT_TRANSACTIONS ||--o{ TRANSACTION_ATTEMPTS : "has_many"
    PAYMENT_TRANSACTIONS }o--|| PAYMENT_PROVIDERS : "used_provider"
    TRANSACTION_ATTEMPTS }o--|| PAYMENT_PROVIDERS : "attempted_with"
    PROVIDER_HEALTH_CHECKS }o--|| PAYMENT_PROVIDERS : "checks"
    
    PAYMENT_TRANSACTIONS {
        uuid id PK "Primary key"
        string transaction_id UK "Unique transaction identifier"
        string customer_id "Customer identifier"
        string customer_email "Customer email"
        decimal amount "Payment amount"
        string currency "Currency code (USD, EUR, etc)"
        string status "success, failed, pending"
        uuid final_provider_id FK "Provider that successfully processed"
        int retry_count "Number of retries"
        timestamp created_at "Transaction creation time"
        timestamp completed_at "Transaction completion time"
    }

    TRANSACTION_ATTEMPTS {
        uuid id PK "Primary key"
        uuid transaction_id FK "Reference to transaction"
        uuid provider_id FK "Provider used in this attempt"
        int attempt_number "Sequential attempt number (1, 2, 3)"
        string status "success, failed, timeout"
        string error_message "Error message if failed"
        timestamp attempted_at "When attempt was made"
    }

    PAYMENT_PROVIDERS {
        uuid id PK "Primary key"
        string name UK "Provider name (Provider A, B, C)"
        string code UK "Provider code (PROVIDER_A, PROVIDER_B, PROVIDER_C)"
        int priority "Provider priority (1=primary, 2=secondary, 3=tertiary)"
        boolean is_active "Provider is enabled"
        boolean is_healthy "Current health status"
        timestamp last_health_check "Last health check time"
        int consecutive_failures "Consecutive failure count"
        int consecutive_success_checks "Consecutive successful health checks"
        timestamp marked_unhealthy_at "When provider was marked unhealthy"
        timestamp recovered_at "When provider recovered to healthy"
    }

    PROVIDER_HEALTH_CHECKS {
        uuid id PK "Primary key"
        uuid provider_id FK "Provider being checked"
        string status "healthy, down"
        string error_message "Error if health check failed"
        timestamp checked_at "When check was performed"
    }
```

- **Circuit breaker pattern** - Automatic health check, provider recovery and self-healing capabilities
- **Provider weighting** - Priority-based routing

## License

MIT License
