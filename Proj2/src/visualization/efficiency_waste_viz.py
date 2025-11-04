"""
Visualization Module for Efficiency-Waste Correlation Analysis

Creates scatter plots and correlation heatmaps to visually communicate
how efficiency factors impact waste generation.

Author: CSC-510-SE-Project
Issue: #15
"""

import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from analysis.correlate_efficiency_waste import load_and_merge_data, compute_correlations

# Configure matplotlib for better plots
try:
    plt.style.use('seaborn-v0_8-darkgrid')
except OSError:
    plt.style.use('seaborn-darkgrid')  # Fallback for older matplotlib versions
sns.set_palette("husl")

# Path configuration
BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "..")
OUTPUT_DIR = os.path.join(BASE_DIR, "data", "visualizations")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def create_scatter_plots(df, output_dir=OUTPUT_DIR):
    """
    Create scatter plots showing relationships between efficiency metrics and waste metrics.
    
    Args:
        df (pd.DataFrame): Merged dataset with efficiency and waste metrics
        output_dir (str): Directory to save plots
    """
    print("\nGenerating scatter plots...")
    
    # Define pairs to plot (efficiency metric, waste metric)
    pairs_to_plot = [
        ('efficiency_score', 'total_waste_lb', 'Efficiency Score vs Total Waste'),
        ('efficiency_score', 'avg_waste_per_serving_lb', 'Efficiency Score vs Avg Waste per Serving'),
        ('avg_delivery_time', 'total_waste_lb', 'Avg Delivery Time vs Total Waste'),
        ('on_time_rate', 'total_waste_lb', 'On-Time Rate vs Total Waste'),
        ('deliveries_per_day', 'total_waste_lb', 'Deliveries per Day vs Total Waste'),
        ('avg_distance', 'total_waste_lb', 'Avg Distance vs Total Waste'),
    ]
    
    for eff_metric, waste_metric, title in pairs_to_plot:
        if eff_metric not in df.columns or waste_metric not in df.columns:
            continue
        
        # Prepare data
        data = df[[eff_metric, waste_metric, 'restaurant']].dropna()
        if len(data) < 3:
            continue
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Scatter plot
        scatter = ax.scatter(
            data[eff_metric], 
            data[waste_metric],
            alpha=0.6,
            s=100,
            edgecolors='black',
            linewidth=0.5
        )
        
        # Add trend line
        z = np.polyfit(data[eff_metric], data[waste_metric], 1)
        p = np.poly1d(z)
        ax.plot(data[eff_metric], p(data[eff_metric]), "r--", alpha=0.8, linewidth=2, label='Trend Line')
        
        # Labels and title
        ax.set_xlabel(eff_metric.replace('_', ' ').title(), fontsize=12, fontweight='bold')
        ax.set_ylabel(waste_metric.replace('_', ' ').title(), fontsize=12, fontweight='bold')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        
        # Add correlation coefficient
        corr = data[eff_metric].corr(data[waste_metric])
        ax.text(0.05, 0.95, f'r = {corr:.3f}', 
                transform=ax.transAxes, 
                fontsize=11,
                verticalalignment='top',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        # Save plot
        filename = f"{eff_metric}_vs_{waste_metric}_scatter.png"
        filepath = os.path.join(output_dir, filename)
        plt.tight_layout()
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  Saved: {filename}")


def create_correlation_heatmap(df, output_dir=OUTPUT_DIR):
    """
    Create a correlation heatmap showing relationships between all efficiency and waste metrics.
    
    Args:
        df (pd.DataFrame): Merged dataset with efficiency and waste metrics
        output_dir (str): Directory to save plots
    """
    print("\nGenerating correlation heatmap...")
    
    # Select numeric columns for correlation
    efficiency_cols = [
        'efficiency_score',
        'avg_delivery_time',
        'on_time_rate',
        'avg_distance',
        'deliveries_per_day'
    ]
    
    waste_cols = [
        'total_waste_lb',
        'avg_waste_per_record_lb',
        'avg_waste_per_serving_lb',
        'total_waste_cost_usd'
    ]
    
    # Filter to available columns
    all_cols = [c for c in efficiency_cols + waste_cols if c in df.columns]
    corr_data = df[all_cols].dropna()
    
    if len(corr_data) < 2:
        print("  Insufficient data for heatmap")
        return
    
    # Compute correlation matrix
    corr_matrix = corr_data.corr()
    
    # Create figure
    fig, ax = plt.subplots(figsize=(12, 10))
    
    # Create heatmap
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool), k=1)  # Mask upper triangle
    sns.heatmap(
        corr_matrix,
        annot=True,
        fmt='.3f',
        cmap='RdYlBu_r',
        center=0,
        square=True,
        linewidths=0.5,
        cbar_kws={"shrink": 0.8},
        mask=mask,
        ax=ax,
        vmin=-1,
        vmax=1
    )
    
    # Customize labels
    ax.set_xticklabels([col.replace('_', ' ').title() for col in corr_matrix.columns], 
                       rotation=45, ha='right')
    ax.set_yticklabels([col.replace('_', ' ').title() for col in corr_matrix.columns], 
                       rotation=0)
    ax.set_title('Correlation Heatmap: Efficiency Metrics vs Waste Metrics', 
                 fontsize=14, fontweight='bold', pad=20)
    
    # Save plot
    filepath = os.path.join(output_dir, "efficiency_waste_correlation_heatmap.png")
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"  Saved: efficiency_waste_correlation_heatmap.png")


def create_efficiency_waste_comparison(df, output_dir=OUTPUT_DIR):
    """
    Create a comparison plot showing efficiency scores vs waste quantities per restaurant.
    
    Args:
        df (pd.DataFrame): Merged dataset with efficiency and waste metrics
        output_dir (str): Directory to save plots
    """
    print("\nGenerating efficiency-waste comparison plot...")
    
    if 'efficiency_score' not in df.columns or 'total_waste_lb' not in df.columns:
        print("  Required columns not found")
        return
    
    # Prepare data
    plot_df = df[['restaurant', 'efficiency_score', 'total_waste_lb']].dropna()
    plot_df = plot_df.sort_values('efficiency_score', ascending=False)
    
    if len(plot_df) == 0:
        print("  No data to plot")
        return
    
    # Create figure with two y-axes
    fig, ax1 = plt.subplots(figsize=(14, 8))
    
    x_pos = np.arange(len(plot_df))
    width = 0.35
    
    # Plot efficiency scores
    bars1 = ax1.bar(x_pos - width/2, plot_df['efficiency_score'], 
                    width, label='Efficiency Score', color='steelblue', alpha=0.8)
    ax1.set_xlabel('Restaurant', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Efficiency Score', fontsize=12, fontweight='bold', color='steelblue')
    ax1.tick_params(axis='y', labelcolor='steelblue')
    ax1.set_xticks(x_pos)
    ax1.set_xticklabels(plot_df['restaurant'], rotation=45, ha='right')
    
    # Create second y-axis for waste
    ax2 = ax1.twinx()
    bars2 = ax2.bar(x_pos + width/2, plot_df['total_waste_lb'], 
                    width, label='Total Waste (lb)', color='coral', alpha=0.8)
    ax2.set_ylabel('Total Waste (lb)', fontsize=12, fontweight='bold', color='coral')
    ax2.tick_params(axis='y', labelcolor='coral')
    
    # Title
    plt.title('Restaurant Comparison: Efficiency Scores vs Total Waste', 
              fontsize=14, fontweight='bold', pad=20)
    
    # Legend
    fig.legend(loc='upper left', bbox_to_anchor=(0.1, 0.95))
    
    # Grid
    ax1.grid(True, alpha=0.3, axis='y')
    
    # Save plot
    filepath = os.path.join(output_dir, "restaurant_efficiency_waste_comparison.png")
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"  Saved: restaurant_efficiency_waste_comparison.png")


def generate_all_visualizations():
    """
    Generate all visualizations for efficiency-waste correlation analysis.
    """
    print("="*60)
    print("GENERATING VISUALIZATIONS")
    print("="*60)
    
    # Load merged data
    df = load_and_merge_data()
    
    # Create visualizations
    create_scatter_plots(df)
    create_correlation_heatmap(df)
    create_efficiency_waste_comparison(df)
    
    print(f"\nAll visualizations saved to: {OUTPUT_DIR}")
    return df


if __name__ == "__main__":
    df = generate_all_visualizations()

