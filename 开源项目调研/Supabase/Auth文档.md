# Supabase Auth Documentation

## Overview

Supabase Auth makes it easy to implement authentication and authorization in your app. It provides client SDKs and API endpoints to help you create and manage users.

## Authentication vs Authorization

### Authentication
Checking that a user is who they say they are.

### Authorization
Checking what resources a user is allowed to access.

## Core Features

### Authentication Methods

Supabase Auth supports multiple authentication methods:

1. **Password-based** - Traditional email/password authentication
2. **Email (Magic Link or OTP)** - Passwordless authentication via email
3. **Phone Login** - SMS-based authentication
4. **Social Login (OAuth)** - Third-party social authentication
5. **Enterprise SSO** - Single sign-on for enterprises
6. **Custom OAuth/OIDC Providers** - Custom identity providers
7. **Anonymous Sign-Ins** - Anonymous user sessions
8. **Web3 (Ethereum or Solana)** - Blockchain-based authentication
9. **Mobile Deep Linking** - Mobile app authentication
10. **Identity Linking** - Link multiple authentication methods

### Multi-Factor Authentication (MFA)

- Time-based one-time passwords (TOTP)
- SMS-based verification
- Advanced MFA add-ons available

## Social Auth Providers

### Supported Providers

Social authentication with 18+ supported providers:

- Apple
- Azure (Microsoft)
- Bitbucket
- Discord
- Facebook
- Figma
- GitHub
- GitLab
- Google
- Kakao
- Keycloak
- LinkedIn
- Notion
- Slack
- Spotify
- Twitter
- Twitch
- WorkOS
- Zoom

### Custom OAuth/OIDC

You can add any OAuth2 or OIDC-compatible identity provider using Custom OAuth/OIDC Providers.

## Phone Auth

### Supported SMS Providers

- MessageBird
- Twilio
- Vonage

## Technical Architecture

### JWT-Based Authentication

- Uses JSON Web Tokens (JWTs) for authentication
- Complete JWT fields reference available
- Token signing keys configurable
- Secure token management

### Database Integration

- Auth uses your project's Postgres database
- Stores user data in special schema
- Can connect to your own tables via triggers and foreign keys
- Integrates with Row Level Security (RLS)

### API Integration

- Enables access control to REST API
- Automatic Auth Token inclusion with SDK requests
- Row-by-row access control with RLS policies

## User Management

### User Concepts

- **Users** - Main user entities
- **Identities** - Authentication methods linked to users
- **Sessions** - Active user sessions

### User Management Features

- User registration
- User login/logout
- Session management
- Password reset
- Email verification
- User profile management

## Security Features

### Password Security

- Secure password hashing
- Password strength requirements
- Breached password detection
- Secure password reset flows

### Rate Limits

- Configurable rate limiting
- Protection against brute force attacks
- API endpoint throttling

### Bot Detection

- CAPTCHA integration
- Bot detection mechanisms
- Fraud prevention

### Audit Logs

- Comprehensive logging
- Security event tracking
- Compliance support

## Server-Side Rendering

### SSR Support

- Next.js integration
- Astro integration
- React integration
- React Native integration
- React Native with Expo & Social Auth

## Configuration

### General Configuration

- Site URLs
- Redirect URLs
- Email templates
- Custom SMTP configuration
- Auth hooks

### Email Configuration

- Custom SMTP server support
- Email template customization
- Email provider integration

### Redirect URLs

- Configure allowed redirect URLs
- OAuth callback URLs
- Deep linking configuration

## OAuth 2.1 Server

### OAuth Server Features

- OAuth 2.1 compliant
- Multiple OAuth flows
- MCP authentication support
- Token security & RLS integration

## Third-Party Auth Integration

### Migration Support

- Clerk migration
- Firebase Auth migration
- Auth0 migration
- AWS Cognito (Amplify) migration
- WorkOS integration

## Error Handling

### Error Codes

Comprehensive error code system for debugging authentication issues.

### Troubleshooting

Detailed troubleshooting guide for common authentication problems.

## Pricing

### Billing Models

Charges apply to:

- **Monthly Active Users (MAU)** - Standard user authentication
- **Monthly Active Third-Party Users (Third-Party MAU)** - Social auth users
- **Monthly Active SSO Users (SSO MAU)** - Enterprise SSO users
- **Advanced MFA Add-ons** - Phone-based MFA

### Detailed Pricing

- Pricing MAU
- Pricing Third-Party MAU
- Pricing SSO MAU
- Advanced MFA - Phone

## Developer Experience

### Client SDKs

Available for multiple platforms:
- JavaScript/TypeScript
- React
- React Native
- Flutter
- Swift (iOS)
- Kotlin (Android)
- Python
- Go
- .NET
- Java

### API Endpoints

Comprehensive REST API for:
- User authentication
- User management
- Session management
- Token refresh
- Password operations

## Best Practices

### Security Best Practices

1. Always use HTTPS in production
2. Implement proper session management
3. Use appropriate OAuth scopes
4. Enable MFA for sensitive applications
5. Regularly audit authentication logs
6. Implement proper rate limiting
7. Use secure token storage

### Implementation Best Practices

1. Plan your authentication flow
2. Test all authentication methods
3. Handle edge cases properly
4. Implement proper error handling
5. Monitor authentication metrics
6. Provide clear user feedback

## Resources

### Documentation

- Auth overview and architecture
- Getting started guides
- Concept documentation
- Flow guides
- Server-side rendering guides
- Configuration guides
- Security documentation

### Community Resources

- GitHub templates and examples
- Community integrations
- Video tutorials
- Blog posts

### Support

- Community Discord
- GitHub Discussions
- GitHub Issues
- Official documentation

## Migration from Other Providers

### Migration Guides

- Firebase Auth
- Auth0
- Clerk
- AWS Cognito
- Custom auth systems

### Migration Tools

- Data migration scripts
- Token conversion utilities
- User mapping tools

## Advanced Features

### Identity Linking

Link multiple authentication methods to a single user account.

### Mobile Deep Linking

Support for mobile app authentication with deep linking.

### Web3 Authentication

Support for Ethereum and Solana blockchain authentication.

### Anonymous Sign-Ins

Allow anonymous users with optional account upgrade.

## Enterprise Features

### Enterprise SSO

- SAML 2.0 support
- OIDC support
- Active Directory integration
- Custom SSO providers

### Advanced Security

- Advanced bot detection
- Custom security policies
- Audit log export
- Compliance reporting

## Monitoring and Analytics

### Authentication Metrics

- Login/logout rates
- Failed authentication attempts
- Active sessions
- User registration trends

### Security Monitoring

- Suspicious activity detection
- Anomaly detection
- Real-time alerts
- Security audit logs