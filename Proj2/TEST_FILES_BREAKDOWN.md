# Test Files Breakdown

## 📋 Files Needed for Frontend Test Cases

### Test Files (9 files, 43 tests)
- `Proj2/src/frontend/src/__tests__/App.test.jsx` - 5 tests
- `Proj2/src/frontend/src/__tests__/Home.test.jsx` - 6 tests
- `Proj2/src/frontend/src/__tests__/Cart.test.jsx` - 8 tests
- `Proj2/src/frontend/src/__tests__/Dashboard.test.jsx` - 5 tests
- `Proj2/src/frontend/src/__tests__/Navbar.test.jsx` - 3 tests
- `Proj2/src/frontend/src/__tests__/RestaurantCard.test.jsx` - 3 tests
- `Proj2/src/frontend/src/__tests__/CustomerLogin.test.jsx` - 5 tests
- `Proj2/src/frontend/src/__tests__/ImpactCard.test.jsx` - 3 tests
- `Proj2/src/frontend/src/__tests__/LeaderboardPanel.test.jsx` - 5 tests

### Frontend Configuration Files
- `Proj2/src/frontend/package.json` - Test dependencies and scripts
- `Proj2/src/frontend/src/setupTests.js` - Jest setup with jest-dom

### Frontend Documentation
- `Proj2/src/frontend/RUN_FRONTEND_TESTS.md` - Frontend test instructions

---

## 📋 Files Needed for Backend Test Cases

### Test Files (4 files, 51 tests)
- `Proj2/tests/backend/test_server.js` - 10 tests
- `Proj2/tests/backend/test_home_routes.js` - 10 tests
- `Proj2/tests/backend/test_cart_routes.js` - 17 tests
- `Proj2/tests/backend/test_dashboard_routes.js` - 14 tests

### Backend Configuration Files
- `Proj2/src/backend/package.json` - Test scripts and Jest config
- `Proj2/jest.config.js` - Jest configuration for Node.js tests

### Backend Documentation
- `Proj2/RUN_NODE_TESTS.md` - Backend test instructions

---

## 📋 Files Needed for Python Test Cases

### Test Files (9 files, 104 tests)
- `Proj2/tests/test_api_app.py` - 15 tests
- `Proj2/tests/test_leaderboard_api.py` - 10 tests
- `Proj2/tests/test_data_loader.py` - 13 tests
- `Proj2/tests/test_delivery_metrics.py` - 10 tests
- `Proj2/tests/test_efficiency_scoring.py` - 10 tests
- `Proj2/tests/test_correlate_efficiency_waste.py` - 16 tests
- `Proj2/tests/test_data_generator.py` - 10 tests
- `Proj2/tests/integration/test_api_integration.py` - 10 tests
- `Proj2/tests/test_rescue_meals_integration.py` - 10 tests

### Python Configuration Files
- `Proj2/requirements.txt` - Python dependencies (pytest, etc.)
- `Proj2/pytest.ini` - Pytest configuration
- `Proj2/tests/__init__.py` - Test package initialization

---

## 📝 Files Edited for Test Cases

### Source Code Files Modified
- `Proj2/src/api/app.py` - Fixed import: `from leaderboard_api import` → `from api.leaderboard_api import`

### Package Configuration Files Modified
- `Proj2/src/frontend/package.json` - Added test dependencies:
  - @testing-library/react
  - @testing-library/jest-dom
  - @testing-library/user-event
  - Updated test scripts
- `Proj2/src/backend/package.json` - Added test scripts and Jest configuration

---

## 🔄 Files Needed for Both Frontend and Backend Tests

### CI/CD Configuration
- `.github/workflows/ci.yml` - GitHub Actions workflow that runs:
  - Python tests (pytest)
  - Node.js backend tests (Jest)
  - Node.js frontend tests (Jest/React Testing Library)
  - Integration tests
  - Linting

### Shared Documentation
- `Proj2/RUN_TESTS.md` - General test running instructions (covers all test types)
- `Proj2/tests/README.md` - Test suite documentation

---

## 📊 Summary

### By Test Type
- **Frontend Tests**: 9 test files, 43 test cases
- **Backend Tests**: 4 test files, 51 test cases
- **Python Tests**: 9 test files, 104 test cases
- **Total**: 22 test files, 198 test cases

### By File Category
- **Test Files**: 22 files
- **Configuration Files**: 6 files (package.json x2, jest.config.js, pytest.ini, requirements.txt, setupTests.js)
- **Documentation Files**: 4 files
- **CI/CD Files**: 1 file
- **Modified Source Files**: 1 file

### Total Files Created/Modified: 34 files

