

| Provider | Endpoint | Response 1 | Response 2 | Response 3 |
|----------|----------|------------|------------|------------|
| Provider A | /api/v1/payments | 200 - Approved | 500 - Internal Server Error | 504 - Gateway Timeout |
| Provider B | /payments | 200 - Approved | 429 - Rate Limit Exceeded | 503 - Service Unavailable |
| Provider C | /payments | 200 - OK | 401 - Unauthorized | 429 - Too Many Requests |