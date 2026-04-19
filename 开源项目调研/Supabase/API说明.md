# Supabase API Documentation

## Overview

Supabase provides comprehensive API capabilities through multiple interfaces, making it easy to interact with your database and services from any application.

## Data REST API (PostgREST)

### What is PostgREST?

Supabase auto-generates an API directly from your database schema using **PostgREST**. This is a very thin API layer on top of Postgres that exposes a restful interface.

### Key Features

#### Auto-Generated and Instant
- API is automatically reflected from your database schema
- Changes to database are immediately accessible through API
- No code generation required
- Zero configuration for basic operations

#### Self-Documenting
- Supabase generates documentation in the Dashboard
- Documentation updates as you make database changes
- OpenAPI/Swagger support
- Interactive API explorer

#### Secure
- Configured to work with Postgres Row Level Security (RLS)
- Provisioned behind an API gateway with key-auth enabled
- JWT-based authentication
- Role-based access control

#### Fast
- Benchmarks show 300%+ faster than Firebase for basic reads
- Very thin layer on top of Postgres
- Postgres does most of the heavy lifting
- Optimized query execution

#### Scalable
- Serves thousands of simultaneous requests
- Works well for Serverless workloads
- Connection pooling via Supavisor
- Horizontal scaling support

### API Capabilities

The REST API retains most of Postgres' capabilities:

1. **Basic CRUD Operations**
   - Create (POST)
   - Read (GET)
   - Update (PATCH/PUT)
   - Delete (DELETE)

2. **Relationships**
   - Arbitrarily deep relationships among tables/views
   - Functions that return table types can nest related tables
   - Automatic foreign key resolution
   - Join operations

3. **Advanced Database Features**
   - Works with Postgres Views
   - Works with Materialized Views
   - Works with Foreign Tables
   - Works with Postgres Functions
   - User-defined computed columns
   - Computed relationships

4. **Security Model**
   - Row Level Security
   - Database Roles
   - Grant permissions
   - Column-level security

### API Endpoints

#### Base URL
```
https://<project_ref>.supabase.co/rest/v1/
```

#### Available Endpoints

**Tables/Views:**
- `GET /rest/v1/{table}` - List records
- `POST /rest/v1/{table}` - Create record
- `PATCH /rest/v1/{table}` - Update records
- `DELETE /rest/v1/{table}` - Delete records

**Functions:**
- `POST /rest/v1/rpc/{function}` - Call Postgres function

### Query Features

#### Filtering
- Equals: `eq`
- Not equals: `neq`
- Greater than: `gt`
- Less than: `lt`
- Contains: `cs`
- In array: `in`
- And/Or logic

#### Sorting
- Order by columns
- Ascending/descending
- Multiple sort columns

#### Pagination
- Limit results
- Offset pagination
- Cursor-based pagination

#### Selection
- Select specific columns
- Nested resource selection
- Computed columns

## GraphQL API (pg_graphql)

### Overview

Supabase provides GraphQL capabilities through `pg_graphql`, extending Postgres with GraphQL functionality.

### Features

- GraphQL schema generation from Postgres
- Query and mutation support
- Subscriptions via Realtime
- Type-safe operations
- Relation mapping

### Usage

GraphQL endpoint is available alongside REST API:
```
https://<project_ref>.supabase.co/graphql/v1/
```

## Management API

### Overview

The Management API allows you to manage your Supabase projects programmatically.

### Authentication

All API requests require a Supabase Personal token:
```
Authorization: Bearer <supabase_personal_token>
```

### Capabilities

- Project management
- Database management
- Function deployment
- Configuration management
- Team collaboration

### Status

The Management API is currently in **beta** and may have breaking changes.

### Usage Example

```bash
curl https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer sbp_bdd0••••••••••••••••••••••••••••••••4f23"
```

## Client SDKs

### JavaScript/TypeScript

The `@supabase/supabase-js` client provides a unified interface to all Supabase APIs.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Database operations
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', 1)

// Storage operations
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar.png', file)

// Auth operations
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})
```

### Other Languages

SDKs available for:
- Python
- Go
- Rust
- Java
- .NET
- Swift
- Kotlin
- Dart (Flutter)

## API Architecture

### Three-Tier vs Two-Tier

**Two-Tier Architecture:**
- Browser → API → Database
- Direct API access from client
- Simpler deployment
- Faster development

**Three-Tier Architecture:**
- Browser → API Server → API → Database
- Additional server layer
- More control over business logic
- Better security isolation

### API Gateway (Kong)

All API requests go through Kong API Gateway:
- Authentication
- Rate limiting
- Request routing
- Response transformation
- Security policies

## Authentication & Authorization

### API Keys

Two types of API keys:

1. **ANON_KEY** - Client-side key with limited permissions
   - Public key safe for browser
   - Restricted by RLS policies
   - For frontend applications

2. **SERVICE_ROLE_KEY** - Server-side key with full access
   - Never expose in client code
   - Bypasses RLS policies
   - For backend operations only

### JWT Authentication

- JWT tokens for authenticated requests
- Automatic token inclusion with SDKs
- Token refresh handling
- Multi-provider authentication

### Row Level Security (RLS)

- Database-level security policies
- Fine-grained access control
- User-specific data filtering
- Policy-based permissions

## Performance Optimization

### Query Optimization

- Use specific column selection
- Implement proper indexes
- Use appropriate filtering
- Leverage database functions

### Caching

- HTTP caching headers
- CDN integration
- Query result caching
- Edge function caching

### Connection Management

- Connection pooling via Supavisor
- Transaction vs session modes
- Connection reuse
- Load balancing

## API Features

### Real-time Subscriptions

Subscribe to database changes:
```javascript
const subscription = supabase
  .channel('custom-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'users'
  }, (payload) => console.log('Change received!', payload))
  .subscribe()
```

### Edge Functions

Deploy server-side functions:
- TypeScript/JavaScript support
- Deno runtime
- Global edge deployment
- Database access

### Storage API

File management operations:
- Upload/download
- Folder operations
- Public/private access
- Transformations

## Best Practices

### Security

1. Always use appropriate API keys
2. Implement proper RLS policies
3. Never expose service role key
4. Use HTTPS in production
5. Validate input data
6. Implement rate limiting

### Performance

1. Select only needed columns
2. Use efficient queries
3. Implement pagination
4. Use database indexes
5. Cache frequently accessed data
6. Monitor query performance

### Architecture

1. Choose appropriate tier architecture
2. Implement proper error handling
3. Use transactions when needed
4. Design efficient data models
5. Plan for scalability

## API Comparison

### REST vs GraphQL

**REST:**
- Simpler to implement
- Better caching
- More mature tooling
- Standard HTTP methods

**GraphQL:**
- Flexible queries
- Type-safe
- Single endpoint
- Reduced over-fetching

### API Selection Guide

Choose REST for:
- Simple CRUD operations
- Mobile applications
- Serverless functions
- Standard web APIs

Choose GraphQL for:
- Complex data relationships
- Type-safe operations
- Flexible query requirements
- Real-time subscriptions

## Rate Limits & Quotas

### Managed Platform

- Fair-use policy applies
- Rate limits may be introduced
- Resources subject to pricing

### Self-Hosted

- Configure your own limits
- No external rate limiting
- Infrastructure-dependent limits

## Resources

### Documentation

- REST API reference
- GraphQL API reference
- Management API docs
- Client SDK documentation

### Tools

- API explorer in Dashboard
- PostgREST documentation
- GraphQL playground
- OpenAPI specifications

### Community

- GitHub templates
- Community integrations
- Example applications
- Best practice guides