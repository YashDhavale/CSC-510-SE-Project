"""
Correlate Delivery Efficiency with Waste Data

This module performs correlation and regression analysis between delivery efficiency
metrics and food waste data to understand how efficiency factors impact waste generation.

Author: Aditya D
Issue: #15
"""

import os
import pandas as pd
import numpy as np
from scipy.stats import pearsonr, spearmanr
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

# Path configuration
BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "..")
DATA_DIR = os.path.join(BASE_DIR, "data")
EFFICIENCY_FILE = os.path.join(DATA_DIR, "vendor_efficiency_scores.csv")
WASTE_FILE = os.path.join(DATA_DIR, "cleaned_master_dataset.csv")


def load_and_merge_data():
    """
    Load efficiency and waste datasets and merge them on restaurant name.
    
    Returns:
        pd.DataFrame: Merged dataset with efficiency and waste metrics
    """
    print("Loading efficiency data...")
    efficiency_df = pd.read_csv(EFFICIENCY_FILE)
    print(f"  Loaded {len(efficiency_df)} restaurants from efficiency file")
    
    print("Loading waste data...")
    waste_df = pd.read_csv(WASTE_FILE)
    print(f"  Loaded {len(waste_df)} waste records")
    
    # Aggregate waste data by restaurant
    # Calculate key waste metrics per restaurant
    waste_agg = waste_df.groupby('restaurant').agg({
        'quantity_lb': ['sum', 'mean', 'count'],
        'waste_per_serving_lb': 'mean',
        'est_cost_usd': 'sum',
        'delayed': lambda x: (x == True).sum() if 'delayed' in waste_df.columns else 0
    }).reset_index()
    
    # Flatten column names
    waste_agg.columns = [
        'restaurant', 
        'total_waste_lb', 
        'avg_waste_per_record_lb', 
        'waste_record_count',
        'avg_waste_per_serving_lb',
        'total_waste_cost_usd',
        'delayed_deliveries_count'
    ]
    
    # Merge efficiency and waste data
    merged_df = pd.merge(efficiency_df, waste_agg, on='restaurant', how='inner')
    print(f"\nMerged dataset contains {len(merged_df)} restaurants")
    
    return merged_df


def compute_correlations(df):
    """
    Compute Pearson and Spearman correlation coefficients between efficiency 
    metrics and waste metrics.
    
    Args:
        df (pd.DataFrame): Merged dataset with efficiency and waste metrics
        
    Returns:
        dict: Dictionary containing correlation results
    """
    print("\n" + "="*60)
    print("CORRELATION ANALYSIS")
    print("="*60)
    
    # Define efficiency metrics
    efficiency_metrics = [
        'efficiency_score',
        'avg_delivery_time',
        'on_time_rate',
        'avg_distance',
        'deliveries_per_day'
    ]
    
    # Define waste metrics
    waste_metrics = [
        'total_waste_lb',
        'avg_waste_per_record_lb',
        'avg_waste_per_serving_lb',
        'total_waste_cost_usd'
    ]
    
    results = {}
    
    for eff_metric in efficiency_metrics:
        if eff_metric not in df.columns:
            continue
            
        for waste_metric in waste_metrics:
            if waste_metric not in df.columns:
                continue
            
            # Extract non-null pairs
            data = df[[eff_metric, waste_metric]].dropna()
            if len(data) < 3:
                continue
            
            x = data[eff_metric].values
            y = data[waste_metric].values
            
            # Pearson correlation (linear relationship)
            pearson_corr, pearson_p = pearsonr(x, y)
            
            # Spearman correlation (monotonic relationship)
            spearman_corr, spearman_p = spearmanr(x, y)
            
            key = f"{eff_metric}_vs_{waste_metric}"
            results[key] = {
                'pearson_correlation': pearson_corr,
                'pearson_p_value': pearson_p,
                'spearman_correlation': spearman_corr,
                'spearman_p_value': spearman_p,
                'n_samples': len(data)
            }
            
            print(f"\n{eff_metric} vs {waste_metric}:")
            print(f"  Pearson correlation:  {pearson_corr:.4f} (p={pearson_p:.4f})")
            print(f"  Spearman correlation: {spearman_corr:.4f} (p={spearman_p:.4f})")
            print(f"  Sample size: {len(data)}")
    
    return results


def perform_regression_analysis(df):
    """
    Perform linear regression to model how efficiency metrics predict waste generation.
    
    Args:
        df (pd.DataFrame): Merged dataset with efficiency and waste metrics
        
    Returns:
        dict: Dictionary containing regression results
    """
    print("\n" + "="*60)
    print("REGRESSION ANALYSIS")
    print("="*60)
    
    regression_results = {}
    
    # Define target variables (waste metrics)
    target_vars = [
        'total_waste_lb',
        'avg_waste_per_record_lb',
        'avg_waste_per_serving_lb',
        'total_waste_cost_usd'
    ]
    
    # Define predictor variables (efficiency metrics)
    predictor_vars = [
        'efficiency_score',
        'avg_delivery_time',
        'on_time_rate',
        'avg_distance',
        'deliveries_per_day'
    ]
    
    for target in target_vars:
        if target not in df.columns:
            continue
        
        # Prepare data
        predictors = [p for p in predictor_vars if p in df.columns]
        data = df[predictors + [target]].dropna()
        
        if len(data) < len(predictors) + 2:
            continue
        
        X = data[predictors].values
        y = data[target].values
        
        # Fit linear regression
        model = LinearRegression()
        model.fit(X, y)
        
        # Predictions
        y_pred = model.predict(X)
        r2 = r2_score(y, y_pred)
        
        # Store results
        regression_results[target] = {
            'coefficients': dict(zip(predictors, model.coef_)),
            'intercept': model.intercept_,
            'r2_score': r2,
            'n_samples': len(data)
        }
        
        print(f"\nPredicting {target} from efficiency metrics:")
        print(f"  Intercept: {model.intercept_:.4f}")
        for pred, coef in zip(predictors, model.coef_):
            print(f"  {pred}: {coef:.4f}")
        print(f"  R² Score: {r2:.4f}")
        print(f"  Sample size: {len(data)}")
    
    return regression_results


def get_correlation_summary(correlation_results):
    """
    Get a summary of correlation results as a dictionary suitable for API responses.
    
    Args:
        correlation_results (dict): Results from compute_correlations()
        
    Returns:
        dict: Summary dictionary
    """
    summary = {
        'correlations': {},
        'strong_correlations': []
    }
    
    for key, values in correlation_results.items():
        summary['correlations'][key] = {
            'pearson': round(values['pearson_correlation'], 4),
            'spearman': round(values['spearman_correlation'], 4),
            'n_samples': values['n_samples']
        }
        
        # Identify strong correlations (|r| > 0.5)
        if abs(values['pearson_correlation']) > 0.5:
            summary['strong_correlations'].append({
                'pair': key,
                'pearson': round(values['pearson_correlation'], 4),
                'interpretation': 'strong positive' if values['pearson_correlation'] > 0 else 'strong negative'
            })
    
    return summary


def main():
    """
    Main function to run correlation and regression analysis.
    """
    print("="*60)
    print("CORRELATING DELIVERY EFFICIENCY WITH WASTE DATA")
    print("="*60)
    
    # Load and merge data
    merged_df = load_and_merge_data()
    
    # Compute correlations
    correlation_results = compute_correlations(merged_df)
    
    # Perform regression analysis
    regression_results = perform_regression_analysis(merged_df)
    
    # Get summary
    summary = get_correlation_summary(correlation_results)
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"\nTotal correlation pairs analyzed: {len(correlation_results)}")
    print(f"Strong correlations (|r| > 0.5): {len(summary['strong_correlations'])}")
    
    if summary['strong_correlations']:
        print("\nStrong correlations found:")
        for corr in summary['strong_correlations']:
            print(f"  {corr['pair']}: {corr['pearson']} ({corr['interpretation']})")
    
    return {
        'merged_data': merged_df,
        'correlations': correlation_results,
        'regressions': regression_results,
        'summary': summary
    }


if __name__ == "__main__":
    results = main()

