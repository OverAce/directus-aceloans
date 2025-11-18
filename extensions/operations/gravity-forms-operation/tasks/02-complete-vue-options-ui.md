# Task 02: Complete Vue.js Options UI Implementation

## Priority: MEDIUM
## Estimated Time: 3-4 hours
## Assigned To: [Frontend Engineer]

## Description
Complete the Vue.js configuration interface for the Gravity Forms extension. The UI needs proper field definitions, dynamic field generation, and action choices based on selected endpoints.

## Current Issues
1. Incomplete Vue.js template implementation
2. Missing dynamic field generation for endpoint-specific parameters
3. Action choices not properly mapped to endpoints
4. Form validation not implemented

## Requirements
1. **Complete static fields**: Finish the configuration form fields
2. **Implement dynamic fields**: Generate fields based on selected endpoint and action
3. **Add form validation**: Validate required fields and formats
4. **Improve UX**: Add helpful descriptions and placeholder text

## Files to Modify
- `src/options.vue` (lines 110-157)

## Dynamic Fields Needed

### Forms Endpoint
- **List action**: `active`, `trash`, `is_active`, `is_trash` (boolean fields)
- **Get action**: `id` (required, number/string input)
- **Create action**: `title` (required), `description`, `labelPlacement`, etc.
- **Update action**: `id` (required), plus optional form fields
- **Delete action**: `id` (required), `force` (boolean)

### Entries Endpoint  
- **List action**: `form_ids`, `status`, `created_by`, `date_created_start`, `date_created_end`, `page`, `page_size`
- **Get action**: `id` (required)
- **Create/Submit action**: `form_id` (required), `input_values` (object), `field_values`
- **Update action**: `id` (required), `form_id`, `status`, `field_values`
- **Delete action**: `id` (required), `force` (boolean)

### Notifications Endpoint
- **List action**: `form_id` (required)
- **Get action**: `form_id` (required), `notification_id` (required)
- **Send action**: `form_id` (required), `entry_id` (required), `notification_id` (required), plus email fields

## Acceptance Criteria
- [ ] All endpoint actions have appropriate dynamic fields
- [ ] Form validation works correctly
- [ ] UI is intuitive and well-documented
- [ ] No Vue.js console errors
- [ ] Responsive design works properly

## Implementation Notes
- Use Directus v-form component properly
- Follow Directus design system patterns
- Add proper TypeScript typing for all form fields
- Include helpful tooltips and field descriptions

## Testing
1. Test all endpoint/action combinations
2. Verify field validation works
3. Check form submission and data binding
4. Test responsive layout on different screen sizes