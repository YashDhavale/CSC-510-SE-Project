# How to Run Frontend Tests

## Quick Start

### 1. Navigate to frontend directory
```bash
cd Proj2/src/frontend
```

### 2. Install dependencies (first time only)
```bash
npm install
```

### 3. Run all tests
```bash
npm test
```

This will run all 43 frontend test cases with coverage reporting.

## Test Commands

### Run all tests once (no watch mode)
```bash
npm test
```
This uses the `--watchAll=false` flag to run tests once and exit.

### Run tests in watch mode (auto-rerun on changes)
```bash
npm run test:watch
```

### Run specific test file
```bash
npm test -- App.test.jsx
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="renders"
```

## Test Coverage

The tests automatically generate coverage reports. After running tests, you'll see:
- Terminal output with coverage percentages
- HTML coverage report (if configured)

## What Gets Tested

- **App.jsx** - 5 tests (navigation, login flow)
- **Home.jsx** - 6 tests (rendering, API calls, features)
- **Cart.jsx** - 8 tests (cart functionality, calculations)
- **Dashboard.jsx** - 5 tests (views, data fetching)
- **Navbar.jsx** - 3 tests (rendering, navigation)
- **RestaurantCard.jsx** - 3 tests (component display)
- **CustomerLogin.jsx** - 5 tests (form, login/register)
- **ImpactCard.jsx** - 3 tests (component display)
- **LeaderboardPanel.jsx** - 5 tests (data fetching, formats)

**Total: 43 test cases**

## Troubleshooting

### Tests not found
- Make sure you're in `Proj2/src/frontend` directory
- Verify `node_modules` exists: `ls node_modules`
- Reinstall: `rm -rf node_modules && npm install`

### Module not found errors
- Install missing dependencies: `npm install @testing-library/react @testing-library/jest-dom @testing-library/user-event`

### Port conflicts
- Tests use mocked fetch, so no server needed
- If you see port errors, they're likely from other processes

## Expected Output

When tests pass, you'll see:
```
PASS  src/__tests__/App.test.jsx
PASS  src/__tests__/Home.test.jsx
PASS  src/__tests__/Cart.test.jsx
...

Test Suites: 9 passed, 9 total
Tests:       43 passed, 43 total
```

