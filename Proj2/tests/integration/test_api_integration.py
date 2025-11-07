"""
Integration tests for API endpoints
Tests: 10 test cases
"""
import pytest
import sys
import os
import pandas as pd
import tempfile
from unittest.mock import patch, MagicMock

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from api.app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestAPIIntegration:
    """Integration tests for API"""
    
    @patch('api.app.load_and_merge_data')
    @patch('api.app.compute_correlations')
    @patch('api.app.perform_regression_analysis')
    @patch('api.app.get_correlation_summary')
    def test_full_correlation_workflow(self, mock_summary, mock_regression, 
                                       mock_correlations, mock_load, client):
        """Test full correlation analysis workflow"""
        # Setup realistic mock data
        mock_df = pd.DataFrame({
            'restaurant': ['R1', 'R2'],
            'efficiency_score': [75.0, 80.0],
            'total_waste_lb': [10.0, 15.0]
        })
        mock_load.return_value = mock_df
        
        mock_correlations.return_value = {
            'efficiency_score_vs_total_waste_lb': {
                'pearson_correlation': 0.75,
                'pearson_p_value': 0.01,
                'spearman_correlation': 0.80,
                'spearman_p_value': 0.005,
                'n_samples': 2
            }
        }
        
        mock_regression.return_value = {
            'total_waste_lb': {
                'coefficients': {'efficiency_score': 0.5},
                'intercept': 10.0,
                'r2_score': 0.85,
                'n_samples': 2
            }
        }
        
        mock_summary.return_value = {
            'correlations': {},
            'strong_correlations': []
        }
        
        response = client.get('/api/efficiency-waste-correlation')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert 'correlations' in data['data']
        assert 'regressions' in data['data']
    
    def test_health_check_integration(self, client):
        """Test health check endpoint integration"""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'healthy'
    
    def test_root_endpoint_integration(self, client):
        """Test root endpoint integration"""
        response = client.get('/')
        assert response.status_code == 200
        data = response.get_json()
        assert 'service' in data
        assert 'endpoints' in data
    
    @patch('api.leaderboard_api.DATA_FILE')
    def test_leaderboard_api_integration(self, mock_file, client):
        """Test leaderboard API integration"""
        mock_file.read_text.return_value = '{"Restaurant1": 100, "Restaurant2": 50}'
        response = client.get('/api/restaurant-points')
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2
    
    def test_cors_integration(self, client):
        """Test CORS integration"""
        response = client.get('/api/health')
        # CORS should be enabled
        assert response.status_code == 200
    
    @patch('api.app.load_and_merge_data')
    def test_error_handling_integration(self, mock_load, client):
        """Test error handling integration"""
        mock_load.side_effect = Exception("Integration test error")
        response = client.get('/api/efficiency-waste-correlation')
        assert response.status_code == 500
        data = response.get_json()
        assert data['status'] == 'error'
    
    @patch('api.app.load_and_merge_data')
    @patch('api.app.compute_correlations')
    @patch('api.app.perform_regression_analysis')
    @patch('api.app.get_correlation_summary')
    def test_data_formatting_integration(self, mock_summary, mock_regression,
                                         mock_correlations, mock_load, client):
        """Test data formatting in integration"""
        mock_df = MagicMock()
        mock_df.__len__ = MagicMock(return_value=5)
        mock_load.return_value = mock_df
        mock_correlations.return_value = {}
        mock_regression.return_value = {}
        mock_summary.return_value = {}
        
        response = client.get('/api/efficiency-waste-correlation')
        assert response.status_code == 200
        data = response.get_json()
        # Verify JSON serializable
        import json
        json.dumps(data)  # Should not raise
    
    def test_multiple_endpoints_integration(self, client):
        """Test multiple endpoints work together"""
        # Test health
        health_response = client.get('/api/health')
        assert health_response.status_code == 200
        
        # Test root
        root_response = client.get('/')
        assert root_response.status_code == 200
        
        # Both should work
        assert health_response.status_code == root_response.status_code
    
    @patch('api.leaderboard_api.DATA_FILE')
    def test_leaderboard_sorting_integration(self, mock_file, client):
        """Test leaderboard sorting integration"""
        mock_file.read_text.return_value = '{"ZRestaurant": 50, "ARestaurant": 100}'
        response = client.get('/api/restaurant-points')
        data = response.get_json()
        # Should be sorted by points desc, then name
        assert data[0]['points'] == 100
        assert data[0]['name'] == 'ARestaurant'
    
    def test_api_version_integration(self, client):
        """Test API version information"""
        response = client.get('/')
        data = response.get_json()
        assert 'version' in data
        assert data['version'] == '1.0.0'

