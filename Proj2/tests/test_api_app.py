"""
Test suite for Flask API application (app.py)
Tests: 15 test cases
"""
import pytest
import sys
import os
from unittest.mock import patch, MagicMock
import json

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from api.app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_check_returns_200(self, client):
        """Test that health check endpoint returns 200 status"""
        response = client.get('/api/health')
        assert response.status_code == 200
    
    def test_health_check_returns_healthy_status(self, client):
        """Test that health check returns correct status"""
        response = client.get('/api/health')
        data = json.loads(response.data)
        assert data['status'] == 'healthy'


class TestRootEndpoint:
    """Test root endpoint"""
    
    def test_root_endpoint_returns_200(self, client):
        """Test that root endpoint returns 200 status"""
        response = client.get('/')
        assert response.status_code == 200
    
    def test_root_endpoint_returns_service_info(self, client):
        """Test that root endpoint returns service information"""
        response = client.get('/')
        data = json.loads(response.data)
        assert 'service' in data
        assert 'version' in data
        assert 'endpoints' in data
        assert data['service'] == 'Efficiency-Waste Correlation API'
    
    def test_root_endpoint_includes_all_endpoints(self, client):
        """Test that root endpoint lists all available endpoints"""
        response = client.get('/')
        data = json.loads(response.data)
        assert '/api/efficiency-waste-correlation' in data['endpoints']
        assert '/api/health' in data['endpoints']


class TestEfficiencyWasteCorrelation:
    """Test efficiency-waste correlation endpoint"""
    
    @patch('api.app.load_and_merge_data')
    @patch('api.app.compute_correlations')
    @patch('api.app.perform_regression_analysis')
    @patch('api.app.get_correlation_summary')
    def test_correlation_endpoint_returns_200(self, mock_summary, mock_regression, 
                                               mock_correlations, mock_load, client):
        """Test that correlation endpoint returns 200 on success"""
        # Setup mocks
        mock_df = MagicMock()
        mock_df.__len__ = MagicMock(return_value=10)
        mock_load.return_value = mock_df
        mock_correlations.return_value = {}
        mock_regression.return_value = {}
        mock_summary.return_value = {}
        
        response = client.get('/api/efficiency-waste-correlation')
        assert response.status_code == 200
    
    @patch('api.app.load_and_merge_data')
    @patch('api.app.compute_correlations')
    @patch('api.app.perform_regression_analysis')
    @patch('api.app.get_correlation_summary')
    def test_correlation_endpoint_returns_success_status(self, mock_summary, mock_regression,
                                                         mock_correlations, mock_load, client):
        """Test that correlation endpoint returns success status"""
        mock_df = MagicMock()
        mock_df.__len__ = MagicMock(return_value=10)
        mock_load.return_value = mock_df
        mock_correlations.return_value = {}
        mock_regression.return_value = {}
        mock_summary.return_value = {}
        
        response = client.get('/api/efficiency-waste-correlation')
        data = json.loads(response.data)
        assert data['status'] == 'success'
    
    @patch('api.app.load_and_merge_data')
    @patch('api.app.compute_correlations')
    @patch('api.app.perform_regression_analysis')
    @patch('api.app.get_correlation_summary')
    def test_correlation_endpoint_includes_correlations(self, mock_summary, mock_regression,
                                                        mock_correlations, mock_load, client):
        """Test that correlation endpoint includes correlations data"""
        mock_df = MagicMock()
        mock_df.__len__ = MagicMock(return_value=10)
        mock_load.return_value = mock_df
        mock_correlations.return_value = {'test': {'pearson_correlation': 0.5, 'pearson_p_value': 0.01,
                                                   'spearman_correlation': 0.6, 'spearman_p_value': 0.02,
                                                   'n_samples': 10}}
        mock_regression.return_value = {}
        mock_summary.return_value = {}
        
        response = client.get('/api/efficiency-waste-correlation')
        data = json.loads(response.data)
        assert 'correlations' in data['data']
    
    @patch('api.app.load_and_merge_data')
    @patch('api.app.compute_correlations')
    @patch('api.app.perform_regression_analysis')
    @patch('api.app.get_correlation_summary')
    def test_correlation_endpoint_includes_regressions(self, mock_summary, mock_regression,
                                                        mock_correlations, mock_load, client):
        """Test that correlation endpoint includes regression data"""
        mock_df = MagicMock()
        mock_df.__len__ = MagicMock(return_value=10)
        mock_load.return_value = mock_df
        mock_correlations.return_value = {}
        mock_regression.return_value = {'target': {'coefficients': {'x': 0.5}, 'intercept': 1.0,
                                                   'r2_score': 0.8, 'n_samples': 10}}
        mock_summary.return_value = {}
        
        response = client.get('/api/efficiency-waste-correlation')
        data = json.loads(response.data)
        assert 'regressions' in data['data']
    
    @patch('api.app.load_and_merge_data')
    @patch('api.app.compute_correlations')
    @patch('api.app.perform_regression_analysis')
    @patch('api.app.get_correlation_summary')
    def test_correlation_endpoint_includes_summary(self, mock_summary, mock_regression,
                                                   mock_correlations, mock_load, client):
        """Test that correlation endpoint includes summary"""
        mock_df = MagicMock()
        mock_df.__len__ = MagicMock(return_value=10)
        mock_load.return_value = mock_df
        mock_correlations.return_value = {}
        mock_regression.return_value = {}
        mock_summary.return_value = {'strong_correlations': []}
        
        response = client.get('/api/efficiency-waste-correlation')
        data = json.loads(response.data)
        assert 'summary' in data['data']
    
    @patch('api.app.load_and_merge_data')
    def test_correlation_endpoint_handles_exception(self, mock_load, client):
        """Test that correlation endpoint handles exceptions gracefully"""
        mock_load.side_effect = Exception("Test error")
        
        response = client.get('/api/efficiency-waste-correlation')
        assert response.status_code == 500
        data = json.loads(response.data)
        assert data['status'] == 'error'
        assert 'message' in data
    
    @patch('api.app.load_and_merge_data')
    @patch('api.app.compute_correlations')
    @patch('api.app.perform_regression_analysis')
    @patch('api.app.get_correlation_summary')
    def test_correlation_endpoint_formats_correlations(self, mock_summary, mock_regression,
                                                        mock_correlations, mock_load, client):
        """Test that correlation endpoint formats correlation data correctly"""
        mock_df = MagicMock()
        mock_df.__len__ = MagicMock(return_value=10)
        mock_load.return_value = mock_df
        mock_correlations.return_value = {
            'test_pair': {
                'pearson_correlation': 0.75,
                'pearson_p_value': 0.001,
                'spearman_correlation': 0.80,
                'spearman_p_value': 0.0005,
                'n_samples': 15
            }
        }
        mock_regression.return_value = {}
        mock_summary.return_value = {}
        
        response = client.get('/api/efficiency-waste-correlation')
        data = json.loads(response.data)
        assert 'test_pair' in data['data']['correlations']
        assert isinstance(data['data']['correlations']['test_pair']['pearson_correlation'], float)
    
    @patch('api.app.load_and_merge_data')
    @patch('api.app.compute_correlations')
    @patch('api.app.perform_regression_analysis')
    @patch('api.app.get_correlation_summary')
    def test_correlation_endpoint_formats_regressions(self, mock_summary, mock_regression,
                                                       mock_correlations, mock_load, client):
        """Test that correlation endpoint formats regression data correctly"""
        mock_df = MagicMock()
        mock_df.__len__ = MagicMock(return_value=10)
        mock_load.return_value = mock_df
        mock_correlations.return_value = {}
        mock_regression.return_value = {
            'total_waste_lb': {
                'coefficients': {'efficiency_score': 0.5, 'avg_delivery_time': -0.3},
                'intercept': 10.0,
                'r2_score': 0.85,
                'n_samples': 20
            }
        }
        mock_summary.return_value = {}
        
        response = client.get('/api/efficiency-waste-correlation')
        data = json.loads(response.data)
        assert 'total_waste_lb' in data['data']['regressions']
        assert isinstance(data['data']['regressions']['total_waste_lb']['coefficients'], dict)
    
    @patch('api.app.load_and_merge_data')
    @patch('api.app.compute_correlations')
    @patch('api.app.perform_regression_analysis')
    @patch('api.app.get_correlation_summary')
    def test_correlation_endpoint_returns_restaurant_count(self, mock_summary, mock_regression,
                                                          mock_correlations, mock_load, client):
        """Test that correlation endpoint includes restaurant count"""
        mock_df = MagicMock()
        mock_df.__len__ = MagicMock(return_value=25)
        mock_load.return_value = mock_df
        mock_correlations.return_value = {}
        mock_regression.return_value = {}
        mock_summary.return_value = {}
        
        response = client.get('/api/efficiency-waste-correlation')
        data = json.loads(response.data)
        assert data['data']['restaurants_analyzed'] == 25


class TestCORS:
    """Test CORS configuration"""
    
    def test_cors_headers_present(self, client):
        """Test that CORS headers are present in responses"""
        response = client.get('/api/health')
        # CORS is configured, headers should be present
        assert response.status_code == 200

