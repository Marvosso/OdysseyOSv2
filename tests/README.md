# Test Suite - OdysseyOS

## Overview

Minimal but sufficient test suite focused on data integrity.

## Quick Start

### Install Dependencies

```bash
npm install --save-dev \
  jest \
  @types/jest \
  ts-jest \
  jest-environment-jsdom \
  @testing-library/react \
  @testing-library/react-hooks \
  jest-localstorage-mock
```

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Unit tests only
npm test -- tests/unit

# Integration tests only
npm test -- tests/integration
```

## Test Structure

```
tests/
├── unit/              # Unit tests (< 5s)
│   ├── autosave/
│   ├── backup/
│   ├── import/
│   ├── encoding/
│   └── validation/
├── integration/       # Integration tests (< 30s)
├── helpers/          # Test utilities
│   ├── testFactories.ts
│   └── testUtils.ts
├── setup.ts          # Test setup
└── jest.config.js    # Jest configuration
```

## Test Priorities

### Critical (Must Have)
1. Autosave race conditions
2. Backup recovery
3. Import edge cases
4. Encoding safety
5. Scene/chapter consistency

### High Priority
6. Date serialization
7. Validation and repair
8. File size limits

## Mock Strategy

- **Mock:** localStorage, File/Blob, timers
- **Real:** Core logic, storage adapters (InMemory), data structures

## Coverage Targets

- Global: 80%
- Storage: 90%
- Import: 85%
- Validation: 90%

## Writing Tests

### Example Unit Test

```typescript
describe('Feature', () => {
  it('should do something', () => {
    const result = functionUnderTest();
    expect(result).toBe(expected);
  });
});
```

### Example Integration Test

```typescript
describe('Feature Integration', () => {
  it('should work end-to-end', async () => {
    const result = await fullWorkflow();
    expect(result).toBeDefined();
  });
});
```

## Test Helpers

### Factories

```typescript
import { createMockStory, createMockChapter } from './helpers/testFactories';

const story = createMockStory();
const chapter = createMockChapter('chapter-1', 1);
```

### Utilities

```typescript
import { waitFor, setupLocalStorageMock } from './helpers/testUtils';

await waitFor(() => condition(), 5000);
setupLocalStorageMock();
```

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Use factories** - Don't create test data manually
3. **Mock external** - Mock localStorage, File, etc.
4. **Test real logic** - Use real implementations for core logic
5. **Fast tests** - Unit tests should be < 100ms each

---

**For complete test specification, see `TEST_SUITE_SPECIFICATION.md`**
