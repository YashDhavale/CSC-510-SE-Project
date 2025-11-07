"""
Test suite for Leaderboard API (leaderboard_api.py)
Tests: 10 test cases
"""
import pytest
import sys
import os
import json
import tempfile
from pathlib import Path
from unittest.mock import patch, mock_open

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from api.leaderboard_api import leaderboard_bp, DATA_FILE
from api.app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestGetRestaurantPoints:
    """Test get restaurant points endpoint"""
    
    def test_get_restaurant_points_returns_200(self, client):
        """Test that endpoint returns 200 status"""
        with patch('api.leaderboard_api.DATA_FILE') as mock_file:
            mock_file.read_text.return_value = '{"points": {"Restaurant1": 100, "Restaurant2": 50}}'
            response = client.get('/api/restaurant-points')
            assert response.status_code == 200
    
    def test_get_restaurant_points_with_wrapper_format(self, client):
        """Test endpoint handles wrapper format with points key"""
        with patch('api.leaderboard_api.DATA_FILE') as mock_file:
            mock_file.read_text.return_value = '{"success": 1, "points": {"Restaurant1": 100, "Restaurant2": 50}}'
            response = client.get('/api/restaurant-points')
            data = json.loads(response.data)
            assert len(data) == 2
            assert any(item['name'] == 'Restaurant1' for item in data)
    
    def test_get_restaurant_points_with_plain_map_format(self, client):
        """Test endpoint handles plain map format"""
        with patch('api.leaderboard_api.DATA_FILE') as mock_file:
            mock_file.read_text.return_value = '{"Restaurant1": 100, "Restaurant2": 50}'
            response = client.get('/api/restaurant-points')
            data = json.loads(response.data)
            assert len(data) == 2
    
    def test_get_restaurant_points_with_list_format(self, client):
        """Test endpoint handles list format"""
        with patch('api.leaderboard_api.DATA_FILE') as mock_file:
            mock_file.read_text.return_value = '[{"name": "Restaurant1", "points": 100}, {"name": "Restaurant2", "points": 50}]'
            response = client.get('/api/restaurant-points')
            data = json.loads(response.data)
            assert len(data) == 2
    
    def test_get_restaurant_points_sorts_by_points_desc(self, client):
        """Test that results are sorted by points descending"""
        with patch('api.leaderboard_api.DATA_FILE') as mock_file:
            mock_file.read_text.return_value = '{"Restaurant1": 50, "Restaurant2": 100, "Restaurant3": 75}'
            response = client.get('/api/restaurant-points')
            data = json.loads(response.data)
            assert data[0]['points'] == 100
            assert data[1]['points'] == 75
            assert data[2]['points'] == 50
    
    def test_get_restaurant_points_sorts_by_name_asc_when_points_equal(self, client):
        """Test that results are sorted by name when points are equal"""
        with patch('api.leaderboard_api.DATA_FILE') as mock_file:
            mock_file.read_text.return_value = '{"ZRestaurant": 100, "ARestaurant": 100}'
            response = client.get('/api/restaurant-points')
            data = json.loads(response.data)
            assert data[0]['name'] == 'ARestaurant'
            assert data[1]['name'] == 'ZRestaurant'
    
    def test_get_restaurant_points_handles_missing_file(self, client):
        """Test that endpoint handles missing file gracefully"""
        with patch('api.leaderboard_api.DATA_FILE') as mock_file:
            mock_file.read_text.side_effect = FileNotFoundError()
            response = client.get('/api/restaurant-points')
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data == []
    
    def test_get_restaurant_points_handles_invalid_json(self, client):
        """Test that endpoint handles invalid JSON gracefully"""
        with patch('api.leaderboard_api.DATA_FILE') as mock_file:
            mock_file.read_text.return_value = 'invalid json'
            response = client.get('/api/restaurant-points')
            assert response.status_code == 500
    
    def test_get_restaurant_points_handles_null_values(self, client):
        """Test that endpoint handles null values in data"""
        with patch('api.leaderboard_api.DATA_FILE') as mock_file:
            mock_file.read_text.return_value = '{"Restaurant1": 100, "Restaurant2": null}'
            response = client.get('/api/restaurant-points')
            data = json.loads(response.data)
            assert any(item['points'] == 0 for item in data if item['name'] == 'Restaurant2')
    
    def test_get_restaurant_points_handles_list_with_variants(self, client):
        """Test endpoint handles list format with variant field names"""
        with patch('api.leaderboard_api.DATA_FILE') as mock_file:
            mock_file.read_text.return_value = '[{"restaurant": "Restaurant1", "count": 100}, {"id": 2, "points": 50}]'
            response = client.get('/api/restaurant-points')
            data = json.loads(response.data)
            assert len(data) == 2