# Setup Guide

Complete installation and configuration guide for the Gravity Forms & GravityFlow extension.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [WordPress Configuration](#wordpress-configuration)
3. [Directus Installation](#directus-installation)
4. [Configuration](#configuration)
5. [Testing the Connection](#testing-the-connection)
6. [Usage Examples](#usage-examples)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **WordPress**: 5.0 or higher
- **Gravity Forms**: 2.5 or higher
- **Directus**: 10.10.0 or higher

### Optional

- **GravityFlow**: 2.0 or higher (for workflow features)

---

## WordPress Configuration

### Step 1: Install Gravity Forms

1. Purchase and download Gravity Forms from [gravityforms.com](https://www.gravityforms.com)
2. Upload and activate the plugin in WordPress
3. Verify installation: WordPress Admin → Forms

### Step 2: Enable REST API

1. Go to **Forms → Settings → REST API**
2. Click **Add Key** to create new API credentials
3. Fill in the form:
   - **Description**: "Directus Integration"
   - **User**: Select an administrator user
   - **Permissions**: Select "Read/Write"
4. Click **Generate API Keys**
5. **IMPORTANT**: Copy the **Consumer Key** and **Consumer Secret** immediately (they won't be shown again)

### Step 3: Configure Permissions

Ensure the WordPress user associated with the API key has the necessary permissions:
- View Forms
- Edit Forms
- View Entries
- Edit Entries
- Delete Entries

### Step 4: Test WordPress API (Optional)

Test your WordPress REST API is accessible:

```bash
curl https://your-wordpress-site.com/wp-json/gf/v2/forms \
  --user 'consumer_key:consumer_secret'
```

---

## Directus Installation

### Option 1: Install from Extension Marketplace (Recommended)

1. Open Directus Admin Panel
2. Go to **Settings → Extensions → Marketplace**
3. Search for "Gravity Forms"
4. Click **Install**

### Option 2: Manual Installation

1. Clone or download this repository
2. Navigate to the extension directory:
   ```bash
   cd extensions/operations/gravity-forms-operation
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the extension:
   ```bash
   npm run build
   ```
5. Copy the `dist` folder to your Directus extensions directory:
   ```bash
   cp -r dist /path/to/directus/extensions/operations/gravity-forms-operation
   ```
6. Restart Directus:
   ```bash
   npx directus bootstrap
   npx directus start
   ```

---

## Configuration

### Create a Flow in Directus

1. Go to **Settings → Flows**
2. Click **Create Flow**
3. Name your flow (e.g., "Process Contact Form")
4. Set the trigger (e.g., Webhook, Schedule, or Event Hook)

### Add Gravity Forms Operation

1. Click **+** to add an operation
2. Select **Gravity Forms Operation**
3. Configure the operation:

#### Basic Configuration

- **WordPress Site URL**: `https://your-wordpress-site.com`
- **Consumer Key**: Paste the consumer key from WordPress
- **Consumer Secret**: Paste the consumer secret from WordPress

#### Select Endpoint & Action

- **Endpoint**: Choose the API endpoint (Forms, Entries, Notifications, Workflows)
- **Action**: Choose the action to perform (List, Get, Create, Update, Delete, etc.)

#### Fill in Action Parameters

Depending on the selected action, additional fields will appear. For example:

**For "Submit Form" action:**
- **Form ID**: `1`
- **Form Data**:
  ```json
  {
    "1": "{{$trigger.body.name}}",
    "2": "{{$trigger.body.email}}",
    "3": "{{$trigger.body.message}}"
  }
  ```

---

## Testing the Connection

### Test 1: List Forms

Create a simple flow to list all forms:

1. Create a new Flow with a Manual trigger
2. Add Gravity Forms Operation:
   - Endpoint: **Forms**
   - Action: **List Forms**
3. Add a Log to Console operation
4. Run the flow manually
5. Check logs - you should see your forms listed

### Test 2: Submit a Form

Create a webhook flow to submit a form:

1. Create a Flow with Webhook trigger
2. Add Gravity Forms Operation:
   - Endpoint: **Entries**
   - Action: **Submit Form**
   - Form ID: `1`
   - Form Data:
     ```json
     {
       "1": "{{$trigger.body.name}}",
       "2": "{{$trigger.body.email}}"
     }
     ```
3. Test with curl:
   ```bash
   curl -X POST https://your-directus.com/flows/trigger/YOUR_WEBHOOK_ID \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "email": "john@example.com"
     }'
   ```

---

## Usage Examples

### Example 1: Form Submission Workflow

**Scenario**: When a contact form is submitted via webhook, create an entry in Gravity Forms and send a notification.

**Flow Setup**:
1. **Trigger**: Webhook (POST)
2. **Operation 1**: Gravity Forms - Submit Form
   ```json
   {
     "endpoint": "entries",
     "action": "submit",
     "form_id": "1",
     "input_values": {
       "1": "{{$trigger.body.name}}",
       "2": "{{$trigger.body.email}}",
       "3": "{{$trigger.body.message}}"
     }
   }
   ```
3. **Operation 2**: Gravity Forms - Send Notification
   ```json
   {
     "endpoint": "notifications",
     "action": "send",
     "form_id": "1",
     "entry_id": "{{$last.id}}",
     "notification_id": "abc123"
   }
   ```

### Example 2: Entry Processing Automation

**Scenario**: Process new form entries every hour, update their status, and trigger workflows.

**Flow Setup**:
1. **Trigger**: Schedule (Cron: `0 * * * *`)
2. **Operation 1**: Gravity Forms - List Entries
   ```json
   {
     "endpoint": "entries",
     "action": "list",
     "form_ids": "1,2,3",
     "status": "active",
     "page_size": 50
     }
   ```
3. **Operation 2**: Run Script (loop through entries)
4. **Operation 3**: Gravity Forms - Update Entry
   ```json
   {
     "endpoint": "entries",
     "action": "update",
     "id": "{{$last.entry_id}}",
     "is_read": true,
     "status": "active"
   }
   ```

### Example 3: Workflow Automation

**Scenario**: Complete a GravityFlow workflow step when a Directus item is approved.

**Flow Setup**:
1. **Trigger**: Event Hook - items.update (for approval collection)
2. **Condition**: Check if status changed to "approved"
3. **Operation**: Gravity Forms - Complete Workflow Step
   ```json
   {
     "endpoint": "workflows",
     "action": "complete_step",
     "entry_id": "{{$trigger.payload.gf_entry_id}}",
     "note": "Approved via Directus by {{$trigger.accountability.user}}"
   }
   ```

### Example 4: Notification Automation

**Scenario**: Resend a form notification when a Directus event occurs.

**Flow Setup**:
1. **Trigger**: Event Hook - items.create
2. **Operation**: Gravity Forms - Send Notification
   ```json
   {
     "endpoint": "notifications",
     "action": "send",
     "form_id": "1",
     "entry_id": "{{$trigger.payload.entry_id}}",
     "notification_id": "xyz789",
     "send_to": "{{$trigger.payload.customer_email}}",
     "subject": "Order Confirmation - {{$trigger.payload.order_number}}"
   }
   ```

### Example 5: Sync Gravity Forms to Directus

**Scenario**: Automatically sync new Gravity Forms entries to a Directus collection.

**Flow Setup**:
1. **Trigger**: Schedule (every 5 minutes)
2. **Operation 1**: Gravity Forms - List Entries
   ```json
   {
     "endpoint": "entries",
     "action": "list",
     "form_ids": "1",
     "page_size": 100
   }
   ```
3. **Operation 2**: Create Item in Directus
   ```json
   {
     "collection": "form_submissions",
     "payload": {
       "gf_entry_id": "{{$last.id}}",
       "name": "{{$last[1]}}",
       "email": "{{$last[2]}}",
       "message": "{{$last[3]}}",
       "submitted_at": "{{$last.date_created}}"
     }
   }
   ```

---

## Troubleshooting

### Authentication Errors

**Error**: "Authentication failed. Please check your consumer key and secret."

**Solutions**:
1. Verify Consumer Key and Secret are copied correctly (no extra spaces)
2. Check the WordPress user associated with the API key has admin permissions
3. Ensure Gravity Forms REST API is enabled in WordPress
4. Test WordPress API directly:
   ```bash
   curl https://your-site.com/wp-json/gf/v2/forms \
     --user 'key:secret'
   ```

### Connection Errors

**Error**: Network or timeout errors

**Solutions**:
1. Verify WordPress site is accessible from Directus server
2. Check firewall rules allow outbound HTTPS connections
3. Ensure WordPress site has valid SSL certificate
4. Test connectivity:
   ```bash
   curl https://your-wordpress-site.com/wp-json
   ```

### Form Not Found Errors

**Error**: "Resource not found: Form with ID 'X' does not exist"

**Solutions**:
1. Verify the form ID exists in Gravity Forms
2. Check the API user has permission to access that form
3. Ensure form is not in trash
4. List all forms to see available IDs:
   - Set Endpoint: Forms, Action: List

### Rate Limiting

**Error**: "Rate limit exceeded. Please try again later."

**Solutions**:
1. The extension automatically retries with backoff
2. Reduce frequency of scheduled flows
3. Implement caching for frequently accessed data
4. Contact your WordPress hosting provider about rate limits

### Field Mapping Issues

**Issue**: Form submission fails with "Invalid parameters"

**Solutions**:
1. Verify field IDs match the form configuration
2. Check required fields are included
3. Ensure data types are correct (strings, numbers, arrays)
4. Use the "Get Form" action to see field structure:
   ```json
   {
     "endpoint": "forms",
     "action": "get",
     "id": "1"
   }
   ```

### Workflow Not Starting

**Issue**: GravityFlow workflow doesn't start for entry

**Solutions**:
1. Verify GravityFlow plugin is installed and activated
2. Check workflow is active in GravityFlow settings
3. Ensure workflow is assigned to the correct form
4. Verify entry status allows workflow to start
5. Check GravityFlow step conditions

---

## Getting Help

- **Documentation**: See [API Reference](./api-reference.md)
- **Gravity Forms Docs**: [docs.gravityforms.com](https://docs.gravityforms.com/rest-api/)
- **GravityFlow Docs**: [gravityflow.io/docs](https://gravityflow.io/docs/)
- **Directus Docs**: [docs.directus.io](https://docs.directus.io/)

---

## Security Best Practices

1. **Never commit credentials** - Use Directus environment variables
2. **Use HTTPS** - Always use secure connections
3. **Rotate keys regularly** - Generate new API keys periodically
4. **Limit permissions** - Only grant necessary permissions to API user
5. **Monitor logs** - Review Directus logs for suspicious activity
6. **Validate input** - Always validate data before submission

---

## Advanced Configuration

### Using Environment Variables

Instead of hardcoding credentials, use Directus environment variables:

1. Add to `.env`:
   ```
   GF_CONSUMER_KEY=your_consumer_key
   GF_CONSUMER_SECRET=your_consumer_secret
   ```

2. Reference in flows:
   ```
   Consumer Key: {{$env.GF_CONSUMER_KEY}}
   Consumer Secret: {{$env.GF_CONSUMER_SECRET}}
   ```

### Custom Retry Configuration

The extension uses sensible defaults, but you may need to adjust for your environment. The retry logic is:

- **Attempts**: 3
- **Backoff**: Exponential (1s, 2s, 4s)
- **Retryable errors**: 429, 500, 502, 503, 504

### Performance Optimization

1. **Batch operations** - Use pagination for large datasets
2. **Cache responses** - Store frequently accessed data
3. **Limit fields** - Only request needed fields
4. **Schedule wisely** - Spread out scheduled flows

---

## Next Steps

Now that you've set up the extension, explore these guides:

- [API Reference](./api-reference.md) - Complete API documentation
- [Examples](../README.md#usage-examples) - More real-world examples
