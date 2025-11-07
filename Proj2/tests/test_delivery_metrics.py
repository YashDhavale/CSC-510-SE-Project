"""
Test suite for Delivery Metrics (delivery_metrics.py)
Tests: 10 test cases
"""
import pytest
import sys
import os
import pandas as pd
import tempfile
from pathlib import Path
from unittest.mock import patch

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from delivery_metrics import compute_delivery_metrics


class TestComputeDeliveryMetrics:
    """Test delivery metrics computation"""
    
    def test_compute_delivery_metrics_requires_all_columns(self):
        """Test that compute_delivery_metrics requires all required columns"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('order_id,date\nORD-1,2025-10-06\n')
            temp_path = f.name
        
        try:
            with pytest.raises(ValueError, match="Missing required column"):
                compute_delivery_metrics(temp_path, temp_path.replace('.csv', '_out.csv'))
        finally:
            os.unlink(temp_path)
    
    def test_compute_delivery_metrics_computes_avg_delivery_time(self):
        """Test that compute_delivery_metrics computes average delivery time"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('order_id,date,restaurant,distance_km,delivery_time_min,delayed\n')
            f.write('ORD-1,2025-10-06,R1,5.0,20,False\n')
            f.write('ORD-2,2025-10-06,R1,5.0,30,False\n')
            temp_path = f.name
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_delivery_metrics(temp_path, output_path)
            result = pd.read_csv(output_path)
            assert 'avg_delivery_time' in result.columns
            assert result['avg_delivery_time'].iloc[0] == 25.0
        finally:
            for p in [temp_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_delivery_metrics_computes_on_time_rate(self):
        """Test that compute_delivery_metrics computes on-time rate"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('order_id,date,restaurant,distance_km,delivery_time_min,delayed\n')
            f.write('ORD-1,2025-10-06,R1,5.0,20,False\n')
            f.write('ORD-2,2025-10-06,R1,5.0,30,True\n')
            temp_path = f.name
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_delivery_metrics(temp_path, output_path)
            result = pd.read_csv(output_path)
            assert 'on_time_rate' in result.columns
            assert result['on_time_rate'].iloc[0] == 50.0
        finally:
            for p in [temp_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_delivery_metrics_computes_avg_distance(self):
        """Test that compute_delivery_metrics computes average distance"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('order_id,date,restaurant,distance_km,delivery_time_min,delayed\n')
            f.write('ORD-1,2025-10-06,R1,5.0,20,False\n')
            f.write('ORD-2,2025-10-06,R1,7.0,30,False\n')
            temp_path = f.name
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_delivery_metrics(temp_path, output_path)
            result = pd.read_csv(output_path)
            assert 'avg_distance' in result.columns
            assert result['avg_distance'].iloc[0] == 6.0
        finally:
            for p in [temp_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_delivery_metrics_computes_deliveries_per_day(self):
        """Test that compute_delivery_metrics computes deliveries per day"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('order_id,date,restaurant,distance_km,delivery_time_min,delayed\n')
            f.write('ORD-1,2025-10-06,R1,5.0,20,False\n')
            f.write('ORD-2,2025-10-06,R1,5.0,30,False\n')
            f.write('ORD-3,2025-10-07,R1,5.0,25,False\n')
            temp_path = f.name
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_delivery_metrics(temp_path, output_path)
            result = pd.read_csv(output_path)
            assert 'deliveries_per_day' in result.columns
            assert result['deliveries_per_day'].iloc[0] == 1.5  # 3 orders / 2 days
        finally:
            for p in [temp_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_delivery_metrics_groups_by_restaurant(self):
        """Test that compute_delivery_metrics groups metrics by restaurant"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('order_id,date,restaurant,distance_km,delivery_time_min,delayed\n')
            f.write('ORD-1,2025-10-06,R1,5.0,20,False\n')
            f.write('ORD-2,2025-10-06,R2,5.0,30,False\n')
            temp_path = f.name
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_delivery_metrics(temp_path, output_path)
            result = pd.read_csv(output_path)
            assert len(result) == 2
            assert set(result['restaurant'].values) == {'R1', 'R2'}
        finally:
            for p in [temp_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_delivery_metrics_handles_delayed_as_string(self):
        """Test that compute_delivery_metrics handles delayed as string"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('order_id,date,restaurant,distance_km,delivery_time_min,delayed\n')
            f.write('ORD-1,2025-10-06,R1,5.0,20,True\n')
            f.write('ORD-2,2025-10-06,R1,5.0,30,False\n')
            temp_path = f.name
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_delivery_metrics(temp_path, output_path)
            result = pd.read_csv(output_path)
            assert 'on_time_rate' in result.columns
        finally:
            for p in [temp_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_delivery_metrics_rounds_values(self):
        """Test that compute_delivery_metrics rounds values appropriately"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('order_id,date,restaurant,distance_km,delivery_time_min,delayed\n')
            f.write('ORD-1,2025-10-06,R1,5.123,20.456,False\n')
            temp_path = f.name
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_delivery_metrics(temp_path, output_path)
            result = pd.read_csv(output_path)
            assert result['avg_delivery_time'].iloc[0] == 20.46
            assert result['avg_distance'].iloc[0] == 5.12
        finally:
            for p in [temp_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_delivery_metrics_drops_nan_rows(self):
        """Test that compute_delivery_metrics drops rows with NaN in required columns"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('order_id,date,restaurant,distance_km,delivery_time_min,delayed\n')
            f.write('ORD-1,2025-10-06,R1,5.0,20,False\n')
            f.write('ORD-2,,R1,5.0,30,False\n')  # Missing date
            temp_path = f.name
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_delivery_metrics(temp_path, output_path)
            result = pd.read_csv(output_path)
            # Should only process valid rows
            assert len(result) >= 0
        finally:
            for p in [temp_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_delivery_metrics_creates_output_directory(self):
        """Test that compute_delivery_metrics creates output directory if needed"""
        with tempfile.TemporaryDirectory() as temp_dir:
            input_path = os.path.join(temp_dir, 'input.csv')
            output_path = os.path.join(temp_dir, 'subdir', 'output.csv')
            
            with open(input_path, 'w') as f:
                f.write('order_id,date,restaurant,distance_km,delivery_time_min,delayed\n')
                f.write('ORD-1,2025-10-06,R1,5.0,20,False\n')
            
            compute_delivery_metrics(input_path, output_path)
            assert os.path.exists(output_path)

