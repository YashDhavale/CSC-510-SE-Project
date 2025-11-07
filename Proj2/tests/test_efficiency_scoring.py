"""
Test suite for Efficiency Scoring (efficiency_scoring.py)
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

from efficiency_scoring import compute_efficiency_scores


class TestComputeEfficiencyScores:
    """Test efficiency score computation"""
    
    def test_compute_efficiency_scores_requires_delivery_columns(self):
        """Test that compute_efficiency_scores requires delivery metric columns"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('restaurant,on_time_rate\nR1,85.0\n')
            temp_path = f.name
        
        meta_path = temp_path.replace('.csv', '_meta.csv')
        with open(meta_path, 'w') as f:
            f.write('restaurant\nR1\n')
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            with pytest.raises(KeyError):
                compute_efficiency_scores(temp_path, meta_path, output_path)
        finally:
            for p in [temp_path, meta_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_efficiency_scores_requires_restaurant_column(self):
        """Test that compute_efficiency_scores requires restaurant column"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('on_time_rate,avg_delivery_time,avg_distance,deliveries_per_day\n85.0,20.0,5.0,10.0\n')
            temp_path = f.name
        
        meta_path = temp_path.replace('.csv', '_meta.csv')
        with open(meta_path, 'w') as f:
            f.write('name\nR1\n')
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            with pytest.raises(KeyError):
                compute_efficiency_scores(temp_path, meta_path, output_path)
        finally:
            for p in [temp_path, meta_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_efficiency_scores_computes_normalized_values(self):
        """Test that compute_efficiency_scores computes normalized values"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('restaurant,on_time_rate,avg_delivery_time,avg_distance,deliveries_per_day\n')
            f.write('R1,85.0,20.0,5.0,10.0\n')
            f.write('R2,90.0,15.0,3.0,15.0\n')
            temp_path = f.name
        
        meta_path = temp_path.replace('.csv', '_meta.csv')
        with open(meta_path, 'w') as f:
            f.write('restaurant\nR1\nR2\n')
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_efficiency_scores(temp_path, meta_path, output_path)
            result = pd.read_csv(output_path)
            assert 'norm_avg_delivery_time' in result.columns
            assert 'norm_avg_distance' in result.columns
            assert 'norm_deliveries_per_day' in result.columns
        finally:
            for p in [temp_path, meta_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_efficiency_scores_computes_weighted_score(self):
        """Test that compute_efficiency_scores computes weighted efficiency score"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('restaurant,on_time_rate,avg_delivery_time,avg_distance,deliveries_per_day\n')
            f.write('R1,100.0,10.0,2.0,20.0\n')
            temp_path = f.name
        
        meta_path = temp_path.replace('.csv', '_meta.csv')
        with open(meta_path, 'w') as f:
            f.write('restaurant\nR1\n')
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_efficiency_scores(temp_path, meta_path, output_path)
            result = pd.read_csv(output_path)
            assert 'efficiency_score' in result.columns
            assert 0 <= result['efficiency_score'].iloc[0] <= 100
        finally:
            for p in [temp_path, meta_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_efficiency_scores_scales_to_0_100(self):
        """Test that efficiency scores are scaled to 0-100 range"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('restaurant,on_time_rate,avg_delivery_time,avg_distance,deliveries_per_day\n')
            f.write('R1,50.0,30.0,10.0,5.0\n')
            f.write('R2,100.0,10.0,2.0,20.0\n')
            temp_path = f.name
        
        meta_path = temp_path.replace('.csv', '_meta.csv')
        with open(meta_path, 'w') as f:
            f.write('restaurant\nR1\nR2\n')
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_efficiency_scores(temp_path, meta_path, output_path)
            result = pd.read_csv(output_path)
            assert result['efficiency_score'].min() >= 0
            assert result['efficiency_score'].max() <= 100
        finally:
            for p in [temp_path, meta_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_efficiency_scores_handles_single_restaurant(self):
        """Test that compute_efficiency_scores handles single restaurant"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('restaurant,on_time_rate,avg_delivery_time,avg_distance,deliveries_per_day\n')
            f.write('R1,85.0,20.0,5.0,10.0\n')
            temp_path = f.name
        
        meta_path = temp_path.replace('.csv', '_meta.csv')
        with open(meta_path, 'w') as f:
            f.write('restaurant\nR1\n')
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_efficiency_scores(temp_path, meta_path, output_path)
            result = pd.read_csv(output_path)
            assert len(result) == 1
            assert result['efficiency_score'].iloc[0] == 50.0  # When min==max, normalized to 0.5, scaled to 50
        finally:
            for p in [temp_path, meta_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_efficiency_scores_merges_with_metadata(self):
        """Test that compute_efficiency_scores merges with restaurant metadata"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('restaurant,on_time_rate,avg_delivery_time,avg_distance,deliveries_per_day\n')
            f.write('R1,85.0,20.0,5.0,10.0\n')
            temp_path = f.name
        
        meta_path = temp_path.replace('.csv', '_meta.csv')
        with open(meta_path, 'w') as f:
            f.write('restaurant,cuisine\nR1,Italian\n')
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_efficiency_scores(temp_path, meta_path, output_path)
            result = pd.read_csv(output_path)
            assert 'cuisine' in result.columns
            assert result['cuisine'].iloc[0] == 'Italian'
        finally:
            for p in [temp_path, meta_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_efficiency_scores_handles_missing_metadata(self):
        """Test that compute_efficiency_scores handles missing metadata gracefully"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('restaurant,on_time_rate,avg_delivery_time,avg_distance,deliveries_per_day\n')
            f.write('R1,85.0,20.0,5.0,10.0\n')
            f.write('R2,90.0,15.0,3.0,15.0\n')
            temp_path = f.name
        
        meta_path = temp_path.replace('.csv', '_meta.csv')
        with open(meta_path, 'w') as f:
            f.write('restaurant\nR1\n')  # R2 missing
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_efficiency_scores(temp_path, meta_path, output_path)
            result = pd.read_csv(output_path)
            # Should still process R1
            assert len(result) >= 1
        finally:
            for p in [temp_path, meta_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_efficiency_scores_handles_zero_division(self):
        """Test that compute_efficiency_scores handles zero division in normalization"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('restaurant,on_time_rate,avg_delivery_time,avg_distance,deliveries_per_day\n')
            f.write('R1,85.0,20.0,5.0,10.0\n')
            temp_path = f.name
        
        meta_path = temp_path.replace('.csv', '_meta.csv')
        with open(meta_path, 'w') as f:
            f.write('restaurant\nR1\n')
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_efficiency_scores(temp_path, meta_path, output_path)
            result = pd.read_csv(output_path)
            # When min==max, should default to 0.5
            assert 'norm_avg_delivery_time' in result.columns
        finally:
            for p in [temp_path, meta_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)
    
    def test_compute_efficiency_scores_saves_output(self):
        """Test that compute_efficiency_scores saves output file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('restaurant,on_time_rate,avg_delivery_time,avg_distance,deliveries_per_day\n')
            f.write('R1,85.0,20.0,5.0,10.0\n')
            temp_path = f.name
        
        meta_path = temp_path.replace('.csv', '_meta.csv')
        with open(meta_path, 'w') as f:
            f.write('restaurant\nR1\n')
        
        output_path = temp_path.replace('.csv', '_out.csv')
        try:
            compute_efficiency_scores(temp_path, meta_path, output_path)
            assert os.path.exists(output_path)
            result = pd.read_csv(output_path)
            assert len(result) > 0
        finally:
            for p in [temp_path, meta_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)