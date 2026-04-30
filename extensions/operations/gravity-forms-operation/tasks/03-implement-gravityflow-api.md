# Task 03: Implement GravityFlow v2 REST API Integration

## Priority: MEDIUM
## Estimated Time: 6-8 hours
## Assigned To: [Backend Engineer]

## Description
Add support for GravityFlow v2 REST API to manage workflow processes and steps. This includes creating a new client class and endpoint handlers for workflow operations.

## Requirements
1. **Create GravityFlow client**: New client class for GravityFlow API calls
2. **Implement workflows endpoint**: Handle workflow CRUD operations
3. **Add workflow steps**: Manage individual workflow steps
4. **Entry workflow integration**: Connect entries with workflow processes

## Files to Create
- `src/gravity-flow.ts` - GravityFlow client class
- `src/endpoints/workflows.ts` - Workflow endpoint handlers

## Files to Modify
- `src/api.ts` - Add workflows endpoint import and registration
- `src/endpoints/index.ts` - Export workflows
- `src/options.vue` - Add workflows to endpoint choices
- `package.json` - Update sandbox URLs for GravityFlow API

## GravityFlow v2 API Endpoints to Support

### Workflows
- `GET /workflows` - List all workflows
- `GET /workflows/{id}` - Get specific workflow
- `POST /workflows` - Create new workflow
- `PUT /workflows/{id}` - Update workflow
- `DELETE /workflows/{id}` - Delete workflow

### Workflow Steps
- `GET /workflows/{id}/steps` - List workflow steps
- `GET /workflows/{workflow_id}/steps/{step_id}` - Get specific step
- `POST /workflows/{id}/steps` - Create workflow step
- `PUT /workflows/{workflow_id}/steps/{step_id}` - Update step
- `DELETE /workflows/{workflow_id}/steps/{step_id}` - Delete step

### Entry Workflow Actions
- `GET /entries/{entry_id}/workflow` - Get entry workflow status
- `POST /entries/{entry_id}/workflow/complete` - Complete current step
- `POST /entries/{entry_id}/workflow/restart` - Restart workflow
- `POST /entries/{entry_id}/workflow/cancel` - Cancel workflow

## Implementation Details

### GravityFlow Client Class
```typescript
export class GravityFlow {
  constructor(baseUrl: string, consumerKey: string, consumerSecret: string, request: any, log: any)
  
  // Methods
  async makeRequest(method: string, endpoint: string, data?: any): Promise<any>
  async getWorkflows(params?: any): Promise<any>
  async getWorkflow(id: string | number): Promise<any>
  async createWorkflow(workflow: any): Promise<any>
  // ... etc
}
```

### Workflow Endpoint Structure
Follow the same pattern as existing endpoints (forms, entries, notifications):
- Define TypeScript interfaces for parameters
- Implement action handlers
- Export workflow object with actions

## API Authentication
GravityFlow uses the same OAuth 1.0a authentication as Gravity Forms, so reuse the authentication logic from the main client.

## Acceptance Criteria
- [ ] GravityFlow client class implemented and working
- [ ] All workflow endpoints functional
- [ ] Workflow steps management working
- [ ] Entry workflow actions implemented
- [ ] Proper TypeScript interfaces defined
- [ ] Integration with existing extension architecture
- [ ] UI updated to include workflow options

## Implementation Notes
- GravityFlow API base path: `/wp-json/gravityflow/v2/`
- Reuse OAuth authentication from main Gravity Forms client
- Follow existing code patterns for consistency
- Add proper error handling for workflow-specific errors

## Testing
1. Test workflow CRUD operations
2. Verify workflow steps management
3. Test entry workflow actions
4. Ensure proper API authentication
5. Test integration with Directus flows

## Documentation
- Update README.md with GravityFlow endpoints
- Add API endpoint documentation
- Include workflow examples in docs