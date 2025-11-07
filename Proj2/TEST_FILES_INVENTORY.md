# Test Files Inventory

This document lists all files related to the test suite for Proj2.

## Frontend Test Cases

### Test Files (9 files, 43 test cases)
- `Proj2/src/frontend/src/__tests__/App.test.jsx` - 5 tests (App component, navigation, login flow)
- `Proj2/src/frontend/src/__tests__/Home.test.jsx` - 6 tests (Home component, features, API calls)
- `Proj2/src/frontend/src/__tests__/Cart.test.jsx` - 8 tests (Cart functionality, calculations, order placement)
- `Proj2/src/frontend/src/__tests__/Dashboard.test.jsx` - 5 tests (Dashboard views, data fetching)
- `Proj2/src/frontend/src/__tests__/Navbar.test.jsx` - 3 tests (Navbar rendering, navigation)
- `Proj2/src/frontend/src/__tests__/RestaurantCard.test.jsx` - 3 tests (RestaurantCard component)
- `Proj2/src/frontend/src/__tests__/CustomerLogin.test.jsx` - 5 tests (Login/Register forms)
- `Proj2/src/frontend/src/__tests__/ImpactCard.test.jsx` - 3 tests (ImpactCard component)
- `Proj2/src/frontend/src/__tests__/LeaderboardPanel.test.jsx` - 5 tests (Leaderboard data fetching)

### Frontend Configuration Files
- `Proj2/src/frontend/package.json` - Updated with test dependencies and scripts
- `Proj2/src/frontend/src/setupTests.js` - Jest setup with jest-dom matchers

### Frontend Documentation
- `Proj2/src/frontend/RUN_FRONTEND_TESTS.md` - Instructions for running frontend tests

## Backend Test Cases

### Test Files (4 files, 51 test cases)
- `Proj2/tests/backend/test_server.js` - 10 tests (Express server, login, register)
- `Proj2/tests/backend/test_home_routes.js` - 10 tests (Home routes, restaurants, impact)
- `Proj2/tests/backend/test_cart_routes.js` - 17 tests (Cart routes, orders, restaurant points)
- `Proj2/tests/backend/test_dashboard_routes.js` - 14 tests (Dashboard routes, rescue meals, user impact)

### Backend Configuration Files
- `Proj2/src/backend/package.json` - Updated with test scripts and Jest configuration
- `Proj2/jest.config.js` - Jest configuration for Node.js tests

### Backend Documentation
- `Proj2/RUN_NODE_TESTS.md` - Instructions for running Node.js tests

## Python Test Cases

### Test Files (8 files, 104 test cases)
- `Proj2/tests/test_api_app.py` - 15 tests (Flask API endpoints)
- `Proj2/tests/test_leaderboard_api.py` - 10 tests (Leaderboard API)
- `Proj2/tests/test_data_loader.py` - 13 tests (Data loading and integration)
- `Proj2/tests/test_delivery_metrics.py` - 10 tests (Delivery metrics computation)
- `Proj2/tests/test_efficiency_scoring.py` - 10 tests (Efficiency scoring)
- `Proj2/tests/test_correlate_efficiency_waste.py` - 16 tests (Correlation analysis)
- `Proj2/tests/test_data_generator.py` - 10 tests (Data generation)
- `Proj2/tests/integration/test_api_integration.py` - 10 tests (API integration tests)
- `Proj2/tests/test_rescue_meals_integration.py` - 10 tests (Rescue meals integration)

### Python Configuration Files
- `Proj2/requirements.txt` - Python dependencies including pytest and testing libraries
- `Proj2/pytest.ini` - Pytest configuration file
- `Proj2/tests/__init__.py` - Test package initialization

## Files Edited for Test Cases

### Source Code Files Modified
- `Proj2/src/api/app.py` - Fixed import: changed `from leaderboard_api import` to `from api.leaderboard_api import`

### Package Configuration Files Modified
- `Proj2/src/frontend/package.json` - Added test dependencies (@testing-library/react, @testing-library/jest-dom, @testing-library/user-event) and test scripts
- `Proj2/src/backend/package.json` - Added test scripts and Jest configuration

## Files Needed for Both Frontend and Backend Tests

### CI/CD Configuration
- `.github/workflows/ci.yml` - GitHub Actions workflow that runs all tests (Python, Node.js frontend, Node.js backend)

### Shared Documentation
- `Proj2/RUN_TESTS.md` - General test running instructions
- `Proj2/tests/README.md` - Test suite documentation

## Summary

### Frontend Only
- 9 test files (43 tests)
- 1 setup file (setupTests.js)
- 1 package.json (frontend)
- 1 documentation file

### Backend Only
- 4 test files (51 tests)
- 1 jest.config.js
- 1 package.json (backend)
- 1 documentation file

### Python Only
- 8 test files (104 tests)
- 1 requirements.txt
- 1 pytest.ini
- 1 __init__.py

### Shared/Both
- 1 CI/CD workflow file
- 2 documentation files

### Modified Source Files
- 1 Python source file (app.py)

**Total Test Cases: 198 (43 frontend + 51 backend + 104 Python)**

