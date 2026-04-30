# Gravity Forms & GravityFlow REST API Extension for Directus

Seamlessly integrate Gravity Forms and GravityFlow v2 REST APIs into your Directus Flows for powerful form management and workflow automation.

## Overview

This extension provides comprehensive integration with Gravity Forms and GravityFlow, allowing you to manage forms, process entries, send notifications, and automate workflows directly from Directus.

## Features

### Core Capabilities
- ✅ **Forms Management**: Create, read, update, and delete Gravity Forms
- ✅ **Entry Processing**: Submit, retrieve, and manage form entries
- ✅ **Notifications**: Send and manage form notifications
- ✅ **Workflow Automation**: Full GravityFlow integration for workflow management
- ✅ **OAuth 1.0a Authentication**: Secure API authentication with HMAC-SHA1
- ✅ **Error Handling**: Comprehensive error handling with automatic retries
- ✅ **Retry Logic**: Exponential backoff for rate limits and server errors

### Advanced Features
- **Automatic Retries**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Smart Error Handling**: User-friendly error messages for all HTTP status codes
- **Structured Logging**: Detailed logs with context for debugging
- **Dynamic UI**: Contextual form fields based on selected endpoint and action

## Supported Endpoints

### 📝 Forms
- List all forms with filters
- Get specific form details
- Create new forms
- Update existing forms
- Delete forms (with trash support)

### 📋 Entries
- List entries with pagination and filters
- Get individual entry details
- Submit new form entries
- Update entry data and status
- Delete entries

### 📧 Notifications
- List form notifications
- Get notification details
- Send/resend notifications
- Override notification settings (recipient, subject, message)

### 🔄 Workflows (GravityFlow)
- List and manage workflows
- Get workflow details and steps
- Create and update workflows
- Complete workflow steps
- Restart or cancel workflows
- Check entry workflow status

## Installation

### Prerequisites
- **Directus**: 10.10.0 or higher
- **WordPress**: 5.0 or higher
- **Gravity Forms**: 2.5 or higher
- **GravityFlow**: 2.0 or higher (optional, for workflow features)

### From Directus Extensions Marketplace (Recommended)

1. Open Directus Admin Panel
2. Navigate to **Settings → Extensions → Marketplace**
3. Search for "Gravity Forms"
4. Click **Install**

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/your-org/gravity-forms-extension.git

# Navigate to extension directory
cd extensions/operations/gravity-forms-operation

# Install dependencies
npm install

# Build the extension
npm run build

# Copy to Directus extensions directory
cp -r dist /path/to/directus/extensions/operations/gravity-forms-operation

# Restart Directus
npx directus bootstrap
npx directus start
```

## Quick Start

### 1. Configure WordPress

1. Go to **Forms → Settings → REST API** in WordPress
2. Click **Add Key**
3. Fill in:
   - Description: "Directus Integration"
   - User: Select administrator
   - Permissions: Read/Write
4. Click **Generate API Keys**
5. **Copy the Consumer Key and Consumer Secret** (shown only once!)

### 2. Create a Flow in Directus

1. Go to **Settings → Flows**
2. Click **Create Flow**
3. Set up a trigger (Webhook, Schedule, Event Hook, etc.)
4. Add **Gravity Forms Operation**

### 3. Configure the Operation

**Basic Settings:**
- **WordPress Site URL**: `https://your-wordpress-site.com`
- **Consumer Key**: Paste from WordPress
- **Consumer Secret**: Paste from WordPress

**Choose Endpoint & Action:**
- **Endpoint**: Forms, Entries, Notifications, or Workflows
- **Action**: Select the specific action to perform

**Fill in Parameters:**
Dynamic fields appear based on your selected action.

## Usage Examples

### Example 1: Submit a Form Entry

```json
{
  "endpoint": "entries",
  "action": "submit",
  "form_id": "1",
  "input_values": {
    "1": "{{$trigger.body.name}}",
    "2": "{{$trigger.body.email}}",
    "3": "{{$trigger.body.message}}"
  },
  "source_url": "https://example.com/contact"
}
```

### Example 2: List Forms

```json
{
  "endpoint": "forms",
  "action": "list",
  "active": true
}
```

### Example 3: Send Notification

```json
{
  "endpoint": "notifications",
  "action": "send",
  "form_id": "1",
  "entry_id": "10",
  "notification_id": "abc123",
  "send_to": "customer@example.com"
}
```

### Example 4: Complete Workflow Step

```json
{
  "endpoint": "workflows",
  "action": "complete_step",
  "entry_id": "10",
  "note": "Approved via Directus",
  "assignee": "user@example.com"
}
```

## Documentation

- **[Setup Guide](./docs/setup-guide.md)**: Complete installation and configuration guide
- **[API Reference](./docs/api-reference.md)**: Full API documentation for all endpoints
- **[Troubleshooting](./docs/troubleshooting.md)**: Common issues and solutions
- **[Task Management](./tasks/README.md)**: Development tasks and status

## Project Structure

```
src/
├── api.ts                 # Backend API handler
├── app.ts                 # Frontend app configuration
├── gravity-forms.ts       # Gravity Forms client class
├── gravity-flow.ts        # GravityFlow client class
├── options.vue            # Configuration UI
└── endpoints/
    ├── index.ts           # Endpoint exports
    ├── forms.ts           # Forms endpoint handlers
    ├── entries.ts         # Entries endpoint handlers
    ├── notifications.ts   # Notifications endpoint handlers
    └── workflows.ts       # Workflows endpoint handlers
```

## Error Handling

The extension includes comprehensive error handling:

### HTTP Status Codes
- **400**: Bad Request - Invalid parameters
- **401**: Unauthorized - Check credentials
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **429**: Rate Limit - Automatically retried
- **500-504**: Server Errors - Automatically retried

### Automatic Retries
- **Attempts**: 3 total attempts
- **Backoff**: Exponential (1s → 2s → 4s)
- **Retryable**: Rate limits (429) and server errors (5xx)

### User-Friendly Messages
```
✅ "Request successful: GET forms"
⚠️  "Rate limit exceeded. Please try again later."
❌ "Authentication failed. Please check your consumer key and secret."
❌ "Resource not found: Form with ID '999' does not exist"
```

## Security Considerations

- ✅ OAuth 1.0a authentication with HMAC-SHA1 signatures
- ✅ Secure credential storage in Directus
- ✅ HTTPS-only connections
- ✅ Request sandboxing for security
- ✅ No sensitive data logged

**Best Practices:**
1. Never commit API credentials
2. Use environment variables for secrets
3. Rotate API keys regularly
4. Limit API user permissions
5. Monitor access logs

## Development

### Build Extension

```bash
npm run build
```

### Development Mode (Watch)

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## Changelog

### v1.0.0 (2025-01-15)

**Completed:**
- ✅ OAuth 1.0a authentication with crypto-js
- ✅ Complete Vue.js options UI with dynamic fields
- ✅ GravityFlow v2 REST API integration
- ✅ Comprehensive error handling and retry logic
- ✅ Full documentation and examples

**Features:**
- Forms, Entries, and Notifications endpoints
- GravityFlow workflows integration
- Automatic retry with exponential backoff
- User-friendly error messages
- Structured logging

## License

MIT License - See LICENSE file for details

## Support

- **Documentation**: [Setup Guide](./docs/setup-guide.md) | [API Reference](./docs/api-reference.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/gravity-forms-extension/issues)
- **Gravity Forms**: [Official Docs](https://docs.gravityforms.com/rest-api/)
- **GravityFlow**: [Official Docs](https://gravityflow.io/docs/)
- **Directus**: [Community](https://directus.io/community)

## Acknowledgments

- Built for [Directus](https://directus.io/)
- Integrates with [Gravity Forms](https://www.gravityforms.com/)
- Supports [GravityFlow](https://gravityflow.io/)

---

**Made with ❤️ for the Directus community**
