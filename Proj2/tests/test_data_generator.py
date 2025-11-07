"""
Test suite for Data Generator (data_generator.py)
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

from data_generator import (
    generate_waste_data,
    generate_restaurant_metadata,
    generate_customer_feedback,
    generate_menu_portions,
    generate_delivery_logs
)


class TestGenerateWasteData:
    """Test waste data generation"""
    
    def test_generate_waste_data_creates_dataframe(self):
        """Test that generate_waste_data creates a DataFrame"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('data_generator.DATA_DIR', temp_dir):
                generate_waste_data(n=10)
                output_file = os.path.join(temp_dir, 'Raleigh_Food_Waste__1-week_sample_.csv')
                assert os.path.exists(output_file)
                df = pd.read_csv(output_file)
                assert len(df) == 10
    
    def test_generate_waste_data_includes_required_columns(self):
        """Test that generated waste data includes required columns"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('data_generator.DATA_DIR', temp_dir):
                generate_waste_data(n=5)
                output_file = os.path.join(temp_dir, 'Raleigh_Food_Waste__1-week_sample_.csv')
                df = pd.read_csv(output_file)
                assert 'restaurant' in df.columns
                assert 'quantity_lb' in df.columns
                assert 'date' in df.columns


class TestGenerateRestaurantMetadata:
    """Test restaurant metadata generation"""
    
    def test_generate_restaurant_metadata_creates_file(self):
        """Test that generate_restaurant_metadata creates a file"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('data_generator.DATA_DIR', temp_dir):
                generate_restaurant_metadata()
                output_file = os.path.join(temp_dir, 'Restaurant_Metadata.csv')
                assert os.path.exists(output_file)
    
    def test_generate_restaurant_metadata_includes_required_columns(self):
        """Test that generated metadata includes required columns"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('data_generator.DATA_DIR', temp_dir):
                generate_restaurant_metadata()
                output_file = os.path.join(temp_dir, 'Restaurant_Metadata.csv')
                df = pd.read_csv(output_file)
                assert 'restaurant' in df.columns
                assert 'cuisine' in df.columns


class TestGenerateCustomerFeedback:
    """Test customer feedback generation"""
    
    def test_generate_customer_feedback_creates_file(self):
        """Test that generate_customer_feedback creates a file"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('data_generator.DATA_DIR', temp_dir):
                generate_customer_feedback(n=10)
                output_file = os.path.join(temp_dir, 'Customer_Feedback.csv')
                assert os.path.exists(output_file)
                df = pd.read_csv(output_file)
                assert len(df) == 10
    
    def test_generate_customer_feedback_includes_ratings(self):
        """Test that generated feedback includes ratings"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('data_generator.DATA_DIR', temp_dir):
                generate_customer_feedback(n=5)
                output_file = os.path.join(temp_dir, 'Customer_Feedback.csv')
                df = pd.read_csv(output_file)
                assert 'delivery_rating' in df.columns
                assert 'food_quality_rating' in df.columns


class TestGenerateMenuPortions:
    """Test menu portions generation"""
    
    def test_generate_menu_portions_creates_file(self):
        """Test that generate_menu_portions creates a file"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('data_generator.DATA_DIR', temp_dir):
                generate_menu_portions()
                output_file = os.path.join(temp_dir, 'Menu_Portions.csv')
                assert os.path.exists(output_file)
    
    def test_generate_menu_portions_includes_required_columns(self):
        """Test that generated menu portions include required columns"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('data_generator.DATA_DIR', temp_dir):
                generate_menu_portions()
                output_file = os.path.join(temp_dir, 'Menu_Portions.csv')
                df = pd.read_csv(output_file)
                assert 'entree' in df.columns
                assert 'standard_portion_oz' in df.columns


class TestGenerateDeliveryLogs:
    """Test delivery logs generation"""
    
    def test_generate_delivery_logs_creates_file(self):
        """Test that generate_delivery_logs creates a file"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('data_generator.DATA_DIR', temp_dir):
                generate_delivery_logs(n=10)
                output_file = os.path.join(temp_dir, 'Delivery_Logs.csv')
                assert os.path.exists(output_file)
                df = pd.read_csv(output_file)
                assert len(df) == 10
    
    def test_generate_delivery_logs_includes_required_columns(self):
        """Test that generated delivery logs include required columns"""
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch('data_generator.DATA_DIR', temp_dir):
                generate_delivery_logs(n=5)
                output_file = os.path.join(temp_dir, 'Delivery_Logs.csv')
                df = pd.read_csv(output_file)
                assert 'order_id' in df.columns
                assert 'restaurant' in df.columns
                assert 'delivery_time_min' in df.columns
                assert 'delayed' in df.columns

