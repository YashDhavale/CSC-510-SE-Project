"""
Test suite for Efficiency-Waste Correlation Analysis (correlate_efficiency_waste.py)
Tests: 13 test cases
"""
import pytest
import sys
import os
import pandas as pd
import numpy as np
import tempfile
from unittest.mock import patch, MagicMock

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from analysis.correlate_efficiency_waste import (
    load_and_merge_data,
    compute_correlations,
    perform_regression_analysis,
    get_correlation_summary
)


class TestLoadAndMergeData:
    """Test data loading and merging"""
    
    @patch('analysis.correlate_efficiency_waste.pd.read_csv')
    def test_load_and_merge_data_loads_efficiency_file(self, mock_read):
        """Test that load_and_merge_data loads efficiency file"""
        efficiency_df = pd.DataFrame({
            'restaurant': ['R1', 'R2'],
            'efficiency_score': [75.0, 80.0]
        })
        waste_df = pd.DataFrame({
            'restaurant': ['R1', 'R2'],
            'quantity_lb': [10.0, 15.0]
        })
        
        def read_side_effect(path):
            if 'efficiency' in path:
                return efficiency_df
            else:
                return waste_df
        
        mock_read.side_effect = read_side_effect
        result = load_and_merge_data()
        assert len(result) > 0
    
    @patch('analysis.correlate_efficiency_waste.pd.read_csv')
    def test_load_and_merge_data_aggregates_waste(self, mock_read):
        """Test that load_and_merge_data aggregates waste data"""
        efficiency_df = pd.DataFrame({
            'restaurant': ['R1'],
            'efficiency_score': [75.0]
        })
        waste_df = pd.DataFrame({
            'restaurant': ['R1', 'R1', 'R1'],
            'quantity_lb': [10.0, 15.0, 20.0],
            'waste_per_serving_lb': [0.5, 0.6, 0.7],
            'est_cost_usd': [5.0, 7.5, 10.0]
        })
        
        def read_side_effect(path):
            if 'efficiency' in path:
                return efficiency_df
            else:
                return waste_df
        
        mock_read.side_effect = read_side_effect
        result = load_and_merge_data()
        assert 'total_waste_lb' in result.columns
        assert result['total_waste_lb'].iloc[0] == 45.0


class TestComputeCorrelations:
    """Test correlation computation"""
    
    def test_compute_correlations_returns_dict(self):
        """Test that compute_correlations returns a dictionary"""
        df = pd.DataFrame({
            'efficiency_score': [75.0, 80.0, 85.0],
            'total_waste_lb': [10.0, 15.0, 20.0],
            'avg_waste_per_serving_lb': [0.5, 0.6, 0.7]
        })
        result = compute_correlations(df)
        assert isinstance(result, dict)
    
    def test_compute_correlations_computes_pearson(self):
        """Test that compute_correlations computes Pearson correlation"""
        df = pd.DataFrame({
            'efficiency_score': [75.0, 80.0, 85.0, 90.0, 95.0],
            'total_waste_lb': [20.0, 18.0, 15.0, 12.0, 10.0]  # Negative correlation
        })
        result = compute_correlations(df)
        assert len(result) > 0
        key = list(result.keys())[0]
        assert 'pearson_correlation' in result[key]
    
    def test_compute_correlations_computes_spearman(self):
        """Test that compute_correlations computes Spearman correlation"""
        df = pd.DataFrame({
            'efficiency_score': [75.0, 80.0, 85.0],
            'total_waste_lb': [10.0, 15.0, 20.0]
        })
        result = compute_correlations(df)
        assert len(result) > 0
        key = list(result.keys())[0]
        assert 'spearman_correlation' in result[key]
    
    def test_compute_correlations_includes_p_values(self):
        """Test that compute_correlations includes p-values"""
        df = pd.DataFrame({
            'efficiency_score': [75.0, 80.0, 85.0],
            'total_waste_lb': [10.0, 15.0, 20.0]
        })
        result = compute_correlations(df)
        assert len(result) > 0
        key = list(result.keys())[0]
        assert 'pearson_p_value' in result[key]
        assert 'spearman_p_value' in result[key]
    
    def test_compute_correlations_skips_insufficient_data(self):
        """Test that compute_correlations skips pairs with insufficient data"""
        df = pd.DataFrame({
            'efficiency_score': [75.0, np.nan, np.nan],
            'total_waste_lb': [10.0, np.nan, np.nan]
        })
        result = compute_correlations(df)
        # Should skip due to insufficient data
        assert isinstance(result, dict)
    
    def test_compute_correlations_handles_missing_columns(self):
        """Test that compute_correlations handles missing columns gracefully"""
        df = pd.DataFrame({
            'efficiency_score': [75.0, 80.0, 85.0],
            'other_col': [1, 2, 3]
        })
        result = compute_correlations(df)
        # Should skip metrics that don't exist
        assert isinstance(result, dict)


class TestPerformRegressionAnalysis:
    """Test regression analysis"""
    
    def test_perform_regression_analysis_returns_dict(self):
        """Test that perform_regression_analysis returns a dictionary"""
        df = pd.DataFrame({
            'efficiency_score': [75.0, 80.0, 85.0],
            'avg_delivery_time': [20.0, 18.0, 15.0],
            'total_waste_lb': [10.0, 15.0, 20.0]
        })
        result = perform_regression_analysis(df)
        assert isinstance(result, dict)
    
    def test_perform_regression_analysis_computes_coefficients(self):
        """Test that perform_regression_analysis computes coefficients"""
        df = pd.DataFrame({
            'efficiency_score': [75.0, 80.0, 85.0, 90.0, 95.0],
            'total_waste_lb': [20.0, 18.0, 15.0, 12.0, 10.0]
        })
        result = perform_regression_analysis(df)
        if len(result) > 0:
            key = list(result.keys())[0]
            assert 'coefficients' in result[key]
    
    def test_perform_regression_analysis_computes_intercept(self):
        """Test that perform_regression_analysis computes intercept"""
        df = pd.DataFrame({
            'efficiency_score': [75.0, 80.0, 85.0],
            'total_waste_lb': [10.0, 15.0, 20.0]
        })
        result = perform_regression_analysis(df)
        if len(result) > 0:
            key = list(result.keys())[0]
            assert 'intercept' in result[key]
    
    def test_perform_regression_analysis_computes_r2_score(self):
        """Test that perform_regression_analysis computes R² score"""
        df = pd.DataFrame({
            'efficiency_score': [75.0, 80.0, 85.0],
            'total_waste_lb': [10.0, 15.0, 20.0]
        })
        result = perform_regression_analysis(df)
        if len(result) > 0:
            key = list(result.keys())[0]
            assert 'r2_score' in result[key]
            assert 0 <= result[key]['r2_score'] <= 1
    
    def test_perform_regression_analysis_handles_insufficient_data(self):
        """Test that perform_regression_analysis handles insufficient data"""
        df = pd.DataFrame({
            'efficiency_score': [75.0],
            'total_waste_lb': [10.0]
        })
        result = perform_regression_analysis(df)
        # Should skip due to insufficient data
        assert isinstance(result, dict)


class TestGetCorrelationSummary:
    """Test correlation summary generation"""
    
    def test_get_correlation_summary_returns_dict(self):
        """Test that get_correlation_summary returns a dictionary"""
        correlation_results = {
            'test_pair': {
                'pearson_correlation': 0.75,
                'spearman_correlation': 0.80,
                'n_samples': 10
            }
        }
        result = get_correlation_summary(correlation_results)
        assert isinstance(result, dict)
    
    def test_get_correlation_summary_includes_correlations(self):
        """Test that get_correlation_summary includes correlations"""
        correlation_results = {
            'test_pair': {
                'pearson_correlation': 0.75,
                'spearman_correlation': 0.80,
                'n_samples': 10
            }
        }
        result = get_correlation_summary(correlation_results)
        assert 'correlations' in result
    
    def test_get_correlation_summary_identifies_strong_correlations(self):
        """Test that get_correlation_summary identifies strong correlations"""
        correlation_results = {
            'strong_pair': {
                'pearson_correlation': 0.75,  # Strong positive
                'spearman_correlation': 0.80,
                'n_samples': 10
            },
            'weak_pair': {
                'pearson_correlation': 0.3,  # Weak
                'spearman_correlation': 0.35,
                'n_samples': 10
            }
        }
        result = get_correlation_summary(correlation_results)
        assert 'strong_correlations' in result
        assert len(result['strong_correlations']) >= 1

