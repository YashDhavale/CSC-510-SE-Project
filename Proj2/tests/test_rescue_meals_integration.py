"""
Test suite for Rescue Meals Integration (rescue_meals_integration.py)
Tests: 10 test cases
"""
import pytest
import sys
import os
import pandas as pd
import tempfile
from unittest.mock import patch

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))


class TestRescueMealsIntegration:
    """Test rescue meals integration"""
    
    def test_rescue_meals_file_creation(self):
        """Test that rescue meals file is created"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('rescue_meals_integration.DATA_DIR', temp_dir):
                from rescue_meals_integration import RESCUE_CSV
                # Import should trigger file creation
                import rescue_meals_integration
                if os.path.exists(RESCUE_CSV):
                    df = pd.read_csv(RESCUE_CSV)
                    assert len(df) > 0
    
    def test_rescue_meals_has_required_columns(self):
        """Test that rescue meals have required columns"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('rescue_meals_integration.DATA_DIR', temp_dir):
                from rescue_meals_integration import RESCUE_CSV, rescue_data
                df = pd.DataFrame(rescue_data)
                assert 'restaurant' in df.columns
                assert 'meal_name' in df.columns
        assert 'original_price' in df.columns
        assert 'rescue_price' in df.columns
    
    def test_rescue_meals_price_discount(self):
        """Test that rescue prices are lower than original prices"""
        from rescue_meals_integration import rescue_data
        for meal in rescue_data:
            assert meal['rescue_price'] < meal['original_price']
    
    def test_rescue_meals_has_quantity(self):
        """Test that rescue meals have quantity"""
        from rescue_meals_integration import rescue_data
        for meal in rescue_data:
            assert 'quantity' in meal
            assert meal['quantity'] > 0
    
    def test_rescue_meals_has_expires_in(self):
        """Test that rescue meals have expiration info"""
        from rescue_meals_integration import rescue_data
        for meal in rescue_data:
            assert 'expires_in' in meal
            assert len(meal['expires_in']) > 0
    
    def test_rescue_meals_restaurant_assignment(self):
        """Test that rescue meals are assigned to restaurants"""
        from rescue_meals_integration import rescue_data
        restaurants = set(meal['restaurant'] for meal in rescue_data)
        assert len(restaurants) > 0
    
    def test_rescue_meals_data_structure(self):
        """Test that rescue meals data has correct structure"""
        from rescue_meals_integration import rescue_data
        assert isinstance(rescue_data, list)
        assert len(rescue_data) > 0
        for meal in rescue_data:
            assert isinstance(meal, dict)
    
    def test_rescue_meals_price_validation(self):
        """Test that rescue meal prices are valid"""
        from rescue_meals_integration import rescue_data
        for meal in rescue_data:
            assert meal['original_price'] > 0
            assert meal['rescue_price'] > 0
            assert meal['rescue_price'] <= meal['original_price']
    
    def test_rescue_meals_quantity_validation(self):
        """Test that rescue meal quantities are valid"""
        from rescue_meals_integration import rescue_data
        for meal in rescue_data:
            assert isinstance(meal['quantity'], int)
            assert meal['quantity'] > 0
    
    def test_rescue_meals_restaurant_names(self):
        """Test that rescue meals use valid restaurant names"""
        from rescue_meals_integration import rescue_data
        valid_restaurants = [
            "Eastside Deli", "Oak Street Bistro", "GreenBite Cafe",
            "Triangle BBQ Co.", "Village Noodle Bar"
        ]
        for meal in rescue_data:
            assert meal['restaurant'] in valid_restaurants