# Troubleshooting Guide

Common issues and their solutions for the Gravity Forms & GravityFlow extension.

## Authentication Issues

### "Authentication failed. Please check your consumer key and secret."

**Cause**: Invalid or incorrect OAuth credentials

**Solutions**:

1. **Verify credentials are copied correctly**
   - No extra spaces before/after
   - Complete key/secret (not truncated)
   - Check for special characters that may have been escaped

2. **Regenerate API keys in WordPress**
   - Go to Forms → Settings → REST API
   - Delete old key
   - Create new key with same permissions
   - Copy new credentials immediately

3. **Check user permissions**
   - API key must be associated with an Administrator user
   - User must have: edit_forms, view_forms, edit_entries, delete_entries

4. **Test WordPress API directly**
   ```bash
   curl -v https://your-site.com/wp-json/gf/v2/forms \
     --user 'consumer_key:consumer_secret'
   ```

---

## Connection Issues

### Network timeouts or "Connection refused"

**Cause**: Directus cannot reach WordPress server

**Solutions**:

1. **Test connectivity**
   ```bash
   curl -I https://your-wordpress-site.com
   ```

2. **Check firewall rules**
   - Ensure outbound HTTPS (port 443) is allowed from Directus server
   - Check WordPress server firewall allows incoming connections

3. **Verify SSL certificate**
   - WordPress must have valid SSL certificate
   - Self-signed certificates may cause issues

4. **Check URL format**
   - Use full URL: `https://example.com` (not `example.com`)
   - No trailing slash
   - Include `https://` protocol

---

## API Errors

### "Resource not found: Form with ID 'X' does not exist"

**Cause**: Form ID doesn't exist or user lacks permission

**Solutions**:

1. **Verify form ID**
   - List all forms using "List Forms" action
   - Check form exists in WordPress Admin

2. **Check form status**
   - Ensure form is not in trash
   - Verify form is active

3. **Test with different form**
   - Try with a known-good form ID
   - Create a simple test form

### "Bad Request: Invalid parameters provided"

**Cause**: Missing required fields or incorrect data format

**Solutions**:

1. **Check required fields**
   - All required parameters must be provided
   - Verify field names match exactly (case-sensitive)

2. **Validate JSON format**
   - Use JSON validator for `input_values` and `field_values`
   - Ensure proper quotes and commas

3. **Check field IDs**
   - Use "Get Form" action to see correct field structure
   - Field IDs are strings, not numbers: `"1"` not `1`

**Example**: Correct field mapping
```json
{
  "form_id": "1",
  "input_values": {
    "1": "John Doe",
    "2": "john@example.com"
  }
}
```

---

## Rate Limiting

### "Rate limit exceeded. Please try again later."

**Cause**: Too many requests to WordPress API

**Solutions**:

1. **The extension auto-retries** - Wait for automatic retry
2. **Reduce request frequency** - Space out scheduled flows
3. **Implement caching** - Store frequently accessed data
4. **Contact hosting provider** - May need to increase limits

**Note**: The extension automatically retries with exponential backoff (1s, 2s, 4s) for rate limit errors.

---

## Data Issues

### Form submissions not appearing in WordPress

**Cause**: Entry created but not visible

**Solutions**:

1. **Check entry status**
   - May be created as spam or trash
   - Verify with "List Entries" action including trash

2. **Verify notifications**
   - Form notifications may not be sent automatically
   - Explicitly use "Send Notification" action

3. **Check form configuration**
   - Ensure form has notifications configured
   - Verify entry limits haven't been reached

### Field values not saving correctly

**Cause**: Field ID or value format mismatch

**Solutions**:

1. **Get form structure**
   ```json
   {
     "endpoint": "forms",
     "action": "get",
     "id": "1"
   }
   ```

2. **Match field types**
   - Text fields: String values
   - Number fields: Numeric values
   - Checkboxes: Arrays
   - Dates: ISO format

3. **Check field ID format**
   - Use strings: `"1.3"` for sub-fields
   - Not numbers: `1.3`

---

## Workflow Issues

### GravityFlow workflow not starting

**Cause**: Workflow configuration or status issues

**Solutions**:

1. **Verify GravityFlow is installed**
   ```bash
   curl https://your-site.com/wp-json/gravityflow/v2/workflows \
     --user 'key:secret'
   ```

2. **Check workflow status**
   - Workflow must be active
   - Workflow must be assigned to correct form

3. **Verify step conditions**
   - Entry must meet step initiation conditions
   - Check field conditions in workflow

4. **Check entry status**
   - Entry must be "active" (not spam/trash)
   - Workflow may require specific entry values

### "Complete Workflow Step" fails

**Cause**: Step cannot be completed

**Solutions**:

1. **Get workflow status first**
   ```json
   {
     "endpoint": "workflows",
     "action": "get_entry_workflow",
     "entry_id": "10"
   }
   ```

2. **Verify current step**
   - Step must be in "pending" status
   - Check step is assigned to API user

3. **Check permissions**
   - User must have permission to complete the step
   - Verify step assignee settings

---

## Build and Installation Issues

### Extension not appearing in Directus

**Cause**: Extension not built or copied correctly

**Solutions**:

1. **Rebuild extension**
   ```bash
   cd extensions/operations/gravity-forms-operation
   npm install
   npm run build
   ```

2. **Check dist directory**
   - Verify `dist/api.js` and `dist/app.js` exist
   - Files should be recent (check timestamp)

3. **Restart Directus**
   ```bash
   npx directus bootstrap
   npx directus start
   ```

4. **Check Directus logs**
   - Look for extension loading errors
   - Verify extension directory is correct

### "crypto-js" import errors

**Cause**: Missing dependency

**Solutions**:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Verify package.json**
   - `crypto-js` should be in dependencies
   - Run `npm ls crypto-js` to verify installation

3. **Clear cache and rebuild**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

---

## Performance Issues

### Slow response times

**Cause**: Network latency or large datasets

**Solutions**:

1. **Use pagination**
   ```json
   {
     "page": 1,
     "page_size": 50
   }
   ```

2. **Limit fields returned**
   - Only request necessary fields
   - Avoid fetching large form configurations repeatedly

3. **Implement caching**
   - Cache form structures
   - Store frequently accessed entries

4. **Optimize WordPress**
   - Ensure WordPress has adequate resources
   - Consider using object caching (Redis, Memcached)
   - Use a CDN for static assets

### Timeout errors

**Cause**: Request taking too long

**Solutions**:

1. **Increase Directus timeout** (if possible)
2. **Reduce page_size** for list operations
3. **Break into smaller requests**
4. **Check WordPress server performance**

---

## Debugging Tips

### Enable verbose logging

Check Directus logs for detailed information:

```bash
# View Directus logs
tail -f /path/to/directus/logs/directus.log
```

Look for log entries prefixed with:
- `[Gravity Forms API]`
- `[GravityFlow API]`

### Test with minimal data

Create a simple test:

1. Create a basic form with 2-3 fields
2. Test "List Forms" action
3. Test "Submit Form" with minimal data
4. Verify each step before adding complexity

### Use curl for direct API testing

Test WordPress API directly:

```bash
# List forms
curl https://your-site.com/wp-json/gf/v2/forms \
  --user 'key:secret'

# Get specific form
curl https://your-site.com/wp-json/gf/v2/forms/1 \
  --user 'key:secret'

# Submit entry
curl -X POST https://your-site.com/wp-json/gf/v2/entries \
  --user 'key:secret' \
  -H "Content-Type: application/json" \
  -d '{
    "form_id": "1",
    "input_values": {
      "1": "Test Name",
      "2": "test@example.com"
    }
  }'
```

### Check WordPress error logs

Review WordPress logs for API errors:

```bash
tail -f /path/to/wordpress/wp-content/debug.log
```

---

## Common Mistakes

### ❌ Using form field labels instead of IDs

**Wrong**:
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Correct**:
```json
{
  "1": "John Doe",
  "2": "john@example.com"
}
```

### ❌ Missing required fields

**Wrong**:
```json
{
  "endpoint": "entries",
  "action": "submit",
  "input_values": {...}
}
```

**Correct**:
```json
{
  "endpoint": "entries",
  "action": "submit",
  "form_id": "1",
  "input_values": {...}
}
```

### ❌ Incorrect field ID format

**Wrong**:
```json
{
  "1": "John Doe",
  2: "john@example.com"  // Missing quotes
}
```

**Correct**:
```json
{
  "1": "John Doe",
  "2": "john@example.com"
}
```

### ❌ Not handling errors

**Better**: Add condition checks and error handling operations in your flow to handle failed API calls gracefully.

---

## Getting Help

If you've tried these solutions and still have issues:

1. **Check Gravity Forms documentation**: [docs.gravityforms.com](https://docs.gravityforms.com/rest-api/)
2. **Review GravityFlow docs**: [gravityflow.io/docs](https://gravityflow.io/docs/)
3. **Check Directus forums**: [directus.io/community](https://directus.io/community)
4. **GitHub issues**: Report bugs or request features

### When reporting issues, include:

- Directus version
- Gravity Forms version
- GravityFlow version (if applicable)
- Extension version
- Error messages from logs
- Steps to reproduce
- Expected vs actual behavior

---

## Status Checks

### Quick health check list:

- [ ] WordPress site is accessible via HTTPS
- [ ] Gravity Forms REST API is enabled
- [ ] API credentials are valid and have admin permissions
- [ ] Extension is built and installed in Directus
- [ ] Directus can connect to WordPress (no firewall blocks)
- [ ] Test form exists and is accessible
- [ ] Flow is saved and active

If all items are checked and you still have issues, review the specific error message in the sections above.
