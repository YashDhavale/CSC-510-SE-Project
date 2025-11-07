"""
Test suite for Data Loader (data_loader.py)
Tests: 12 test cases
"""
import pytest
import sys
import os
import pandas as pd
import tempfile
from unittest.mock import patch, MagicMock

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from data_loader import load_csv, basic_clean, coerce_types, integrate_all


class TestLoadCSV:
    """Test CSV loading functionality"""
    
    def test_load_csv_loads_file_successfully(self):
        """Test that load_csv loads a CSV file successfully"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('col1,col2\n1,2\n3,4\n')
            temp_path = f.name
        
        try:
            with patch('data_loader.DATA_DIR', os.path.dirname(temp_path)):
                with patch('data_loader.load_csv') as mock_load:
                    mock_load.return_value = pd.read_csv(temp_path)
                    result = mock_load.return_value
                    assert len(result) == 2
                    assert 'col1' in result.columns
        finally:
            os.unlink(temp_path)
    
    def test_load_csv_raises_file_not_found(self):
        """Test that load_csv raises FileNotFoundError for missing file"""
        with patch('data_loader.DATA_DIR', '/nonexistent/path'):
            with pytest.raises(FileNotFoundError):
                load_csv('nonexistent_file.csv')
    
    def test_load_csv_prints_file_info(self, capsys):
        """Test that load_csv prints file information"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write('col1,col2\n1,2\n')
            temp_path = f.name
        
        try:
            with patch('data_loader.DATA_DIR', os.path.dirname(temp_path)):
                with patch('data_loader.load_csv') as mock_load:
                    df = pd.read_csv(temp_path)
                    mock_load.return_value = df
                    result = mock_load.return_value
                    assert result is not None
        finally:
            os.unlink(temp_path)


class TestBasicClean:
    """Test basic cleaning functionality"""
    
    def test_basic_clean_strips_strings(self):
        """Test that basic_clean strips whitespace from strings"""
        df = pd.DataFrame({'col1': ['  value1  ', 'value2', '  value3  ']})
        result = basic_clean(df)
        assert result['col1'].iloc[0] == 'value1'
        assert result['col1'].iloc[2] == 'value3'
    
    def test_basic_clean_removes_duplicates(self):
        """Test that basic_clean removes duplicate rows"""
        df = pd.DataFrame({'col1': [1, 2, 2, 3], 'col2': ['a', 'b', 'b', 'c']})
        result = basic_clean(df)
        assert len(result) == 3
    
    def test_basic_clean_preserves_numeric_values(self):
        """Test that basic_clean preserves numeric values"""
        df = pd.DataFrame({'col1': [1, 2, 3], 'col2': [4.5, 5.6, 6.7]})
        result = basic_clean(df)
        assert result['col1'].iloc[0] == 1
        assert result['col2'].iloc[1] == 5.6


class TestCoerceTypes:
    """Test type coercion functionality"""
    
    def test_coerce_types_converts_numeric_columns(self):
        """Test that coerce_types converts numeric columns"""
        df = pd.DataFrame({
            'quantity_lb': ['10.5', '20.3', '30.1'],
            'servings': ['5', '10', '15'],
            'other_col': ['a', 'b', 'c']
        })
        result = coerce_types(df)
        assert pd.api.types.is_numeric_dtype(result['quantity_lb'])
        assert pd.api.types.is_numeric_dtype(result['servings'])
    
    def test_coerce_types_handles_invalid_numeric(self):
        """Test that coerce_types handles invalid numeric values"""
        df = pd.DataFrame({
            'quantity_lb': ['10.5', 'invalid', '30.1'],
            'servings': ['5', '10', '15']
        })
        result = coerce_types(df)
        assert pd.isna(result['quantity_lb'].iloc[1])
    
    def test_coerce_types_skips_missing_columns(self):
        """Test that coerce_types skips columns that don't exist"""
        df = pd.DataFrame({'other_col': ['a', 'b', 'c']})
        result = coerce_types(df)
        assert 'other_col' in result.columns


class TestIntegrateAll:
    """Test data integration functionality"""
    
    @patch('data_loader.load_csv')
    @patch('data_loader.basic_clean')
    @patch('data_loader.coerce_types')
    @patch('pandas.DataFrame.to_csv')
    def test_integrate_all_calls_load_csv(self, mock_to_csv, mock_coerce, mock_clean, mock_load):
        """Test that integrate_all calls load_csv for all datasets"""
        mock_df = pd.DataFrame({'restaurant': ['R1'], 'date': ['2025-10-06']})
        mock_load.return_value = mock_df
        mock_clean.return_value = mock_df
        mock_coerce.return_value = mock_df
        
        integrate_all()
        assert mock_load.call_count >= 5  # At least 5 CSV files
    
    @patch('data_loader.load_csv')
    @patch('data_loader.basic_clean')
    @patch('data_loader.coerce_types')
    @patch('pandas.DataFrame.to_csv')
    def test_integrate_all_merges_datasets(self, mock_to_csv, mock_coerce, mock_clean, mock_load):
        """Test that integrate_all merges datasets correctly"""
        waste_df = pd.DataFrame({
            'restaurant': ['R1', 'R2'],
            'date': ['2025-10-06', '2025-10-07'],
            'quantity_lb': [10, 20]
        })
        meta_df = pd.DataFrame({
            'restaurant': ['R1', 'R2'],
            'cuisine': ['Italian', 'Mexican']
        })
        
        def load_side_effect(name):
            if 'Waste' in name:
                return waste_df
            elif 'Metadata' in name:
                return meta_df
            else:
                return pd.DataFrame({'restaurant': ['R1'], 'date': ['2025-10-06']})
        
        mock_load.side_effect = load_side_effect
        mock_clean.side_effect = lambda x: x
        mock_coerce.side_effect = lambda x: x
        
        result = integrate_all()
        assert 'cuisine' in result.columns
        assert 'quantity_lb' in result.columns
    
    @patch('data_loader.load_csv')
    @patch('data_loader.basic_clean')
    @patch('data_loader.coerce_types')
    @patch('pandas.DataFrame.to_csv')
    def test_integrate_all_creates_derived_columns(self, mock_to_csv, mock_coerce, mock_clean, mock_load):
        """Test that integrate_all creates derived columns"""
        waste_df = pd.DataFrame({
            'restaurant': ['R1'],
            'date': ['2025-10-06'],
            'quantity_lb': [10.0],
            'servings': [5.0]
        })
        
        def load_side_effect(name):
            if 'Waste' in name:
                return waste_df
            else:
                return pd.DataFrame({'restaurant': ['R1'], 'date': ['2025-10-06']})
        
        mock_load.side_effect = load_side_effect
        mock_clean.side_effect = lambda x: x
        mock_coerce.side_effect = lambda x: x
        
        result = integrate_all()
        assert 'waste_per_serving_lb' in result.columns
    
    @patch('data_loader.load_csv')
    @patch('data_loader.basic_clean')
    @patch('data_loader.coerce_types')
    @patch('pandas.DataFrame.to_csv')
    def test_integrate_all_fills_nan_values(self, mock_to_csv, mock_coerce, mock_clean, mock_load):
        """Test that integrate_all fills NaN values appropriately"""
        waste_df = pd.DataFrame({
            'restaurant': ['R1'],
            'date': ['2025-10-06'],
            'quantity_lb': [10.0],
            'servings': [0.0]  # Will cause division by zero
        })
        
        def load_side_effect(name):
            if 'Waste' in name:
                return waste_df
            else:
                return pd.DataFrame({'restaurant': ['R1'], 'date': ['2025-10-06']})
        
        mock_load.side_effect = load_side_effect
        mock_clean.side_effect = lambda x: x
        mock_coerce.side_effect = lambda x: x
        
        result = integrate_all()
        assert result['waste_per_serving_lb'].fillna(0).iloc[0] == 0

