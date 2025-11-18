# Gravity Forms & GravityFlow REST API Extension for Directus# Resend Email Operation



This extension provides REST API integration with Gravity Forms and GravityFlow v2 for Directus Flows.![Resend Email Operation](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/resend-operation/docs/resend-operation.png)



## OverviewThe Resend Email Operation allows you to seamlessly integrate Resend's powerful email API into your Directus flows. This operation provides a comprehensive interface for sending emails, managing domains, API keys, audiences, and contacts, all within your Directus environment.



The extension supports four main endpoints:## Features

- **Forms**: Manage Gravity Forms (list, create, update, delete)

- **Entries**: Handle form submissions and entry data- Send individual and batch emails

- **Notifications**: Send form notifications- Manage domains, API keys, audiences, and contacts

- **Workflows** (GravityFlow): Manage workflow processes and steps- Support for HTML and plain text email content

- Email scheduling capabilities

## Project Structure- Attachment support

- Custom headers and tags

```- Retrieve, update, and cancel emails

src/

├── app.ts                 # Frontend app configuration## Use Cases

├── api.ts                 # Backend API handler

├── gravity-forms.ts       # Main client class- **Transactional Emails**: Send order confirmations, password resets, and account notifications.

├── gravity-flow.ts        # GravityFlow client class (TODO)- **Marketing Campaigns**: Create and manage email lists for newsletters and promotional content.

├── options.vue            # Configuration UI- **User Onboarding**: Automate welcome emails and onboarding sequences for new users.

└── endpoints/- **Event Management**: Send event invitations, reminders, and follow-ups.

    ├── index.ts           # Endpoint exports- **Customer Support**: Automate support ticket notifications and responses.

    ├── forms.ts           # Forms endpoint handlers- **Email Infrastructure Management**: Easily set up and manage email domains and API keys for your organization.

    ├── entries.ts         # Entries endpoint handlers

    ├── notifications.ts   # Notifications endpoint handlers## Endpoints and Fields

    └── workflows.ts       # GravityFlow workflows (TODO)

```For more detailed information about the Resend API and its capabilities, please refer to the [official Resend API reference](https://resend.com/docs/api-reference/introduction?ref=directus_marketplace).



## Current Status### Emails



✅ **Completed**:- **Send Email**

- Basic project structure  - From

- Gravity Forms API client foundation  - To

- Forms endpoint implementation  - Subject

- Entries endpoint implementation    - HTML Content

- Notifications endpoint implementation  - Plain Text Content

- Vue.js configuration UI setup  - CC

  - BCC

⚠️ **In Progress**:  - Reply To

- OAuth 1.0a signature generation (needs crypto fix)  - Scheduled At

- Vue.js UI field definitions  - Headers

  - Attachments

❌ **TODO** (See task files):  - Tags

- GravityFlow v2 API integration

- Error handling improvements- **Send Batch Email**

- Authentication testing  - Batch Emails (JSON array of email objects)

- UI field validation

- Documentation- **Retrieve Email**

  - Email ID

## Configuration

- **Update Email**

The extension requires:  - Email ID

- **WordPress Site URL**: Base URL of the WordPress installation  - Scheduled At

- **Consumer Key**: OAuth consumer key for API access

- **Consumer Secret**: OAuth consumer secret for API access- **Cancel Email**

  - Email ID

## Development Setup

### Domains

1. Install dependencies:

   ```bash- **Create Domain**

   npm install  - Name

   ```

- **Retrieve Domain**

2. Build the extension:  - Domain ID

   ```bash

   npm run build- **Verify Domain**

   ```  - Domain ID



3. Development with watch mode:- **Update Domain**

   ```bash  - Domain ID

   npm run dev  - Click Tracking

   ```  - Open Tracking

  - TLS

## API Endpoints Supported

- **List Domains**

### Gravity Forms  - (No additional fields)

- `GET /forms` - List all forms

- `GET /forms/{id}` - Get specific form- **Delete Domain**

- `POST /forms` - Create new form  - Domain ID

- `PUT /forms/{id}` - Update form

- `DELETE /forms/{id}` - Delete form### API Keys



### Entries- **Create API Key**

- `GET /entries` - List entries (with filtering)  - Name

- `GET /entries/{id}` - Get specific entry  - Permission

- `POST /entries` - Create/submit new entry  - Domain ID

- `PUT /entries/{id}` - Update entry

- `DELETE /entries/{id}` - Delete entry- **List API Keys**

  - (No additional fields)

### Notifications

- `GET /forms/{id}/notifications` - List form notifications- **Delete API Key**

- `POST /forms/{id}/entries/{entry_id}/notifications/{notification_id}` - Send notification  - API Key ID



### GravityFlow (Planned)### Audiences

- `GET /workflows` - List workflows

- `GET /workflows/{id}/steps` - Get workflow steps- **Create Audience**

- `POST /workflows/{id}/entries/{entry_id}/complete` - Complete workflow step  - Name



## Task Files- **Retrieve Audience**

  - Audience ID

See the `tasks/` directory for individual implementation tasks assigned to engineers.
- **Delete Audience**
  - Audience ID

- **List Audiences**
  - (No additional fields)

### Contacts

- **Create Contact**
  - Email
  - Audience ID
  - First Name
  - Last Name
  - Unsubscribed

- **Retrieve Contact**
  - Audience ID
  - Contact ID

- **Update Contact**
  - Audience ID
  - Contact ID
  - First Name
  - Last Name
  - Unsubscribed

- **Delete Contact**
  - Audience ID
  - Contact ID or Email

- **List Contacts**
  - Audience ID

## Configuration

1. Select the desired endpoint (Emails, Domains, API Keys, Audiences, or Contacts).
2. Choose the specific action to perform on the chosen endpoint.
3. Enter your Resend API key (required for all operations).
4. Fill in the required fields based on the chosen endpoint and action.
5. Configure any optional fields as needed.

<div>
    <a href="https://www.loom.com/share/3122b050ee834a88b1773bf947bf5a36">
      <p>Directus / Resend Operation - Tutorial Video</p>
    </a>
    <a href="https://www.loom.com/share/3122b050ee834a88b1773bf947bf5a36">
      <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/3122b050ee834a88b1773bf947bf5a36-06a5325c9f467651-full-play.gif">
    </a>
</div>


## Security Considerations

- Keep your Resend API key secure and never expose it in client-side code.
- Use Directus roles and permissions to control access to the Resend operation.
- Be cautious when using user-provided data in email content to avoid potential security risks.
- Regularly rotate your API keys to maintain security.

## Error Handling

The operation will throw an error if the Resend API returns an error response. Make sure to handle these errors appropriately in your flows.

---
