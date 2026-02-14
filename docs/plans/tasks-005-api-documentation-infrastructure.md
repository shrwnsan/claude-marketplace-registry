# Task 005: API Documentation Infrastructure

## Overview
Implement comprehensive API documentation infrastructure for the Claude Marketplace Aggregator to serve OpenAPI specifications and interactive documentation.

## Current State
- ✅ OpenAPI 3.0 specification exists: `docs/openapi.yaml`
- ❌ No `/api/openapi.json` endpoint to serve the specification
- ❌ No interactive API documentation (Swagger UI/ReDoc)
- ❌ Broken documentation references in `docs/DEVELOPER_API.md`

## Issues to Address
1. **Missing Endpoint**: `/api/openapi.json` is referenced but doesn't exist
2. **Missing Interactive Docs**: `/api/docs` (Swagger UI) and `/api/redoc` are documented but not implemented
3. **Documentation Debt**: `DEVELOPER_API.md` contains broken promises about API documentation features

## Implementation Tasks

### Phase 1: Basic OpenAPI Serving
- [ ] Create `/pages/api/openapi.ts` endpoint that serves the OpenAPI specification
- [ ] Convert `docs/openapi.yaml` to JSON format or serve YAML directly
- [ ] Add proper CORS headers for external API clients
- [ ] Test the endpoint returns valid OpenAPI 3.0 specification

### Phase 2: Interactive Documentation
- [ ] Choose documentation tool (Swagger UI vs ReDoc vs both)
- [ ] Install required dependencies:
  - Swagger UI: `swagger-ui-react` and `swagger-ui-dist`
  - ReDoc: `redoc-cli` or serve via CDN
- [ ] Create `/pages/api/docs.ts` for Swagger UI integration
- [ ] Create `/pages/api/redoc.ts` for ReDoc integration (optional)
- [ ] Style documentation to match project theme

### Phase 3: Enhanced Features
- [ ] Add API authentication examples (if implemented)
- [ ] Include request/response examples in documentation
- [ ] Add API testing capabilities
- [ ] Implement schema validation using the OpenAPI spec
- [ ] Add API versioning support

### Phase 4: Documentation Cleanup
- [ ] Update `docs/DEVELOPER_API.md` with working endpoints
- [ ] Remove broken documentation references
- [ ] Add API usage examples and guides
- [ ] Document the new infrastructure in project README

## Technical Considerations

### Dependencies to Add
```json
{
  "swagger-ui-react": "^5.0.0",
  "swagger-ui-dist": "^5.0.0",
  "redoc-cli": "^0.13.0" // optional
}
```

### File Structure After Implementation
```
pages/api/
├── openapi.ts          # Serve OpenAPI spec as JSON
├── docs.ts             # Swagger UI interface
├── redoc.ts            # ReDoc interface (optional)
└── health.ts           # Existing

docs/
├── openapi.yaml        # Existing spec
└── api-examples.md     # New usage examples
```

## Acceptance Criteria
1. ✅ `/api/openapi.json` returns valid OpenAPI 3.0 specification
2. ✅ `/api/docs` provides interactive API documentation
3. ✅ Documentation is styled consistently with the project
4. ✅ All references in `DEVELOPER_API.md` are functional
5. ✅ External developers can use the documentation to integrate with the API

## Priority
**Medium** - This enhances developer experience but doesn't block core functionality.

## Dependencies
- None (can be implemented independently)

## Notes
- The existing `docs/openapi.yaml` file is well-formed and comprehensive
- Consider using CDN for documentation UI to minimize bundle size
- Ensure proper caching headers for API specification
- This task can be implemented incrementally (Phase 1 provides immediate value)

---

**Created**: 2025-10-23
**Status**: Deferred — API routes are incompatible with the GitHub Pages static site architecture (see bugs-001). Would require a backend service or serverless functions.
**Assignee**: TBD