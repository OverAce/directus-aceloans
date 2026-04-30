# API Reference

Complete API reference for the Gravity Forms & GravityFlow extension for Directus.

## Table of Contents

- [Configuration](#configuration)
- [Forms Endpoint](#forms-endpoint)
- [Entries Endpoint](#entries-endpoint)
- [Notifications Endpoint](#notifications-endpoint)
- [Workflows Endpoint](#workflows-endpoint)
- [Error Handling](#error-handling)

## Configuration

### Required Fields

- **WordPress Site URL**: Base URL of your WordPress installation
  - Example: `https://example.com`
  - Must be accessible from Directus

- **Consumer Key**: OAuth 1.0a consumer key
  - Generated in WordPress: Settings → Gravity Forms → REST API

- **Consumer Secret**: OAuth 1.0a consumer secret
  - Generated alongside the consumer key

### Authentication

This extension uses OAuth 1.0a authentication as required by Gravity Forms REST API. The signature is automatically generated using HMAC-SHA1.

---

## Forms Endpoint

Manage Gravity Forms.

### List Forms

**Action**: `list`

**Parameters**:
- `active` (boolean, optional): Filter for active forms only
- `trash` (boolean, optional): Include trashed forms

**Example Response**:
```json
[
  {
    "id": "1",
    "title": "Contact Form",
    "description": "Main contact form",
    "is_active": true,
    "date_created": "2025-01-15 10:30:00"
  }
]
```

### Get Form

**Action**: `get`

**Parameters**:
- `id` (string, required): Form ID

**Example Response**:
```json
{
  "id": "1",
  "title": "Contact Form",
  "fields": [...],
  "confirmations": [...],
  "notifications": [...]
}
```

### Create Form

**Action**: `create`

**Parameters**:
- `title` (string, required): Form title
- `description` (string, optional): Form description
- `fields` (JSON, optional): Form fields configuration

**Example Request**:
```json
{
  "title": "New Survey",
  "description": "Customer satisfaction survey",
  "fields": [
    {
      "type": "text",
      "label": "Name",
      "isRequired": true
    }
  ]
}
```

### Update Form

**Action**: `update`

**Parameters**:
- `id` (string, required): Form ID
- `title` (string, optional): Updated title
- `description` (string, optional): Updated description
- `is_active` (boolean, optional): Active status
- `is_trash` (boolean, optional): Trash status

### Delete Form

**Action**: `delete`

**Parameters**:
- `id` (string, required): Form ID
- `force` (boolean, optional): Permanently delete (bypass trash)

---

## Entries Endpoint

Manage form entries (submissions).

### List Entries

**Action**: `list`

**Parameters**:
- `form_ids` (string, optional): Comma-separated form IDs
- `status` (string, optional): Filter by status (`active`, `spam`, `trash`)
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Entries per page (max: 100)

**Example Response**:
```json
{
  "total_count": 150,
  "entries": [
    {
      "id": "10",
      "form_id": "1",
      "date_created": "2025-01-15 14:30:00",
      "1": "John Doe",
      "2": "john@example.com"
    }
  ]
}
```

### Get Entry

**Action**: `get`

**Parameters**:
- `id` (string, required): Entry ID

### Create Entry / Submit Form

**Actions**: `create` or `submit`

**Parameters**:
- `form_id` (string, required): Target form ID
- `input_values` (JSON, required): Field values keyed by field ID
- `source_url` (string, optional): Submission source URL

**Example Request**:
```json
{
  "form_id": "1",
  "input_values": {
    "1": "John Doe",
    "2": "john@example.com",
    "3": "This is my message"
  },
  "source_url": "https://example.com/contact"
}
```

### Update Entry

**Action**: `update`

**Parameters**:
- `id` (string, required): Entry ID
- `status` (string, optional): Entry status
- `is_starred` (boolean, optional): Star status
- `is_read` (boolean, optional): Read status
- `field_values` (JSON, optional): Updated field values

### Delete Entry

**Action**: `delete`

**Parameters**:
- `id` (string, required): Entry ID
- `force` (boolean, optional): Permanently delete

---

## Notifications Endpoint

Manage and send form notifications.

### List Notifications

**Action**: `list`

**Parameters**:
- `form_id` (string, required): Form ID

**Example Response**:
```json
[
  {
    "id": "abc123",
    "name": "Admin Notification",
    "to": "admin@example.com",
    "subject": "New form submission"
  }
]
```

### Get Notification

**Action**: `get`

**Parameters**:
- `form_id` (string, required): Form ID
- `notification_id` (string, required): Notification ID

### Send Notification

**Actions**: `send` or `resend`

**Parameters**:
- `form_id` (string, required): Form ID
- `entry_id` (string, required): Entry ID
- `notification_id` (string, required): Notification ID
- `send_to` (string, optional): Override recipient
- `from_name` (string, optional): Override sender name
- `from_email` (string, optional): Override sender email
- `reply_to` (string, optional): Override reply-to address
- `subject` (string, optional): Override subject
- `message` (string, optional): Override message body

**Example Request**:
```json
{
  "form_id": "1",
  "entry_id": "10",
  "notification_id": "abc123",
  "send_to": "customer@example.com"
}
```

---

## Workflows Endpoint

Manage GravityFlow workflows (requires GravityFlow plugin).

### List Workflows

**Action**: `list`

**Parameters**:
- `status` (string, optional): Filter by status (`active`, `inactive`, `complete`)
- `page` (integer, optional): Page number

### Get Workflow

**Action**: `get`

**Parameters**:
- `id` (string, required): Workflow ID

### Create Workflow

**Action**: `create`

**Parameters**:
- `name` (string, required): Workflow name
- `form_id` (string, required): Associated form ID
- `description` (string, optional): Workflow description

### Update Workflow

**Action**: `update`

**Parameters**:
- `id` (string, required): Workflow ID
- `name` (string, optional): Updated name
- `description` (string, optional): Updated description

### Delete Workflow

**Action**: `delete`

**Parameters**:
- `id` (string, required): Workflow ID
- `force` (boolean, optional): Permanently delete

### Get Workflow Steps

**Action**: `get_steps`

**Parameters**:
- `workflow_id` (string, required): Workflow ID

### Get Entry Workflow Status

**Action**: `get_entry_workflow`

**Parameters**:
- `entry_id` (string, required): Entry ID

**Example Response**:
```json
{
  "entry_id": "10",
  "workflow_id": "5",
  "current_step": "approval",
  "status": "pending"
}
```

### Complete Workflow Step

**Action**: `complete_step`

**Parameters**:
- `entry_id` (string, required): Entry ID
- `note` (string, optional): Completion note
- `assignee` (string, optional): Next assignee (user ID or email)

### Restart Workflow

**Action**: `restart_workflow`

**Parameters**:
- `entry_id` (string, required): Entry ID

### Cancel Workflow

**Action**: `cancel_workflow`

**Parameters**:
- `entry_id` (string, required): Entry ID

---

## Error Handling

The extension includes comprehensive error handling with automatic retries.

### HTTP Status Codes

- **400 Bad Request**: Invalid parameters
- **401 Unauthorized**: Authentication failed (check credentials)
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **429 Too Many Requests**: Rate limit (automatically retried)
- **500-504 Server Errors**: Server issues (automatically retried)

### Retry Logic

- **Retry Attempts**: 3 attempts total
- **Backoff**: Exponential (1s, 2s, 4s)
- **Auto-Retry On**: 429 (rate limit), 500, 502, 503, 504 (server errors)

### Error Response Format

```json
{
  "code": "HTTP_404",
  "message": "Resource not found: Form with ID '999' does not exist",
  "details": {...},
  "endpoint": "forms/999",
  "method": "GET",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

### Common Error Messages

- **"Authentication failed. Please check your consumer key and secret."** - OAuth credentials invalid
- **"Rate limit exceeded. Please try again later."** - Too many requests (wait and retry)
- **"Resource not found: ..."** - ID doesn't exist or no permission
- **"Bad Request: Invalid parameters provided"** - Check required fields

---

## Logging

All API requests are logged with structured information:

```
[Gravity Forms API] GET forms
[Gravity Forms API] Request successful: GET forms

[GravityFlow API] POST entries/10/workflow/complete
[GravityFlow API] Request failed: Authentication failed...
```

Log levels:
- **INFO**: Successful requests, retry attempts
- **WARN**: Failed requests, retrying
- **ERROR**: Final failures after all retries
