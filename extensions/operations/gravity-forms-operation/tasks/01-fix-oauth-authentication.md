# Task 01: Fix OAuth 1.0a Authentication Implementation

## Priority: HIGH
## Estimated Time: 4-6 hours
## Assigned To: [Backend Engineer]

## Description
Fix the OAuth 1.0a signature generation for Gravity Forms REST API authentication. The current implementation has crypto module import issues and signature generation needs to be corrected.

## Current Issues
1. `import { createHash } from 'node:crypto'` fails in Directus environment
2. OAuth signature generation algorithm needs verification
3. Missing proper parameter encoding for OAuth

## Requirements
1. **Fix crypto imports**: Use compatible crypto library for Directus sandbox
2. **Implement proper OAuth 1.0a signature**: 
   - Correct parameter sorting and encoding
   - Proper base string construction
   - HMAC-SHA1 signature generation
3. **Test authentication**: Verify with actual Gravity Forms API

## Files to Modify
- `src/gravity-forms.ts` (lines 1, 37-45, 58-65)

## Acceptance Criteria
- [ ] Extension builds without crypto import errors
- [ ] OAuth signature generates correctly
- [ ] Successful API authentication with Gravity Forms
- [ ] All TypeScript errors resolved

## Implementation Notes
- Use `crypto-js` or similar library compatible with Directus
- Reference OAuth 1.0a specification: https://tools.ietf.org/html/rfc5849
- Test with Gravity Forms REST API documentation examples

## Testing
1. Build extension successfully
2. Configure with valid Gravity Forms credentials
3. Make test API call to `/forms` endpoint
4. Verify authentication headers are correct