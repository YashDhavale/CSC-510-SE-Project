"""
Flask API Application for Efficiency-Waste Correlation

Provides REST API endpoints for accessing correlation and regression analysis
results between delivery efficiency and waste data.

Author: CSC-510-SE-Project
Issue: #15
"""

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from analysis.correlate_efficiency_waste import (
    load_and_merge_data,
    compute_correlations,
    perform_regression_analysis,
    get_correlation_summary
)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access


@app.route('/api/efficiency-waste-correlation', methods=['GET'])
def efficiency_waste_correlation():
    """
    API endpoint to get correlation and regression analysis results.
    
    Returns:
        JSON response with:
        - correlations: Dictionary of correlation coefficients
        - regressions: Dictionary of regression models
        - summary: Summary of strong correlations
    """
    try:
        # Load and merge data
        merged_df = load_and_merge_data()
        
        # Compute correlations (this prints, but also returns results)
        correlation_results = compute_correlations(merged_df)
        
        # Perform regression analysis (this prints, but also returns results)
        regression_results = perform_regression_analysis(merged_df)
        
        # Get summary
        summary = get_correlation_summary(correlation_results)
        
        # Format regression results for JSON serialization
        formatted_regressions = {}
        for target, results in regression_results.items():
            formatted_regressions[target] = {
                'coefficients': {k: float(v) for k, v in results['coefficients'].items()},
                'intercept': float(results['intercept']),
                'r2_score': float(results['r2_score']),
                'n_samples': int(results['n_samples'])
            }
        
        # Format correlations for JSON serialization
        formatted_correlations = {}
        for key, values in correlation_results.items():
            formatted_correlations[key] = {
                'pearson_correlation': float(values['pearson_correlation']),
                'pearson_p_value': float(values['pearson_p_value']),
                'spearman_correlation': float(values['spearman_correlation']),
                'spearman_p_value': float(values['spearman_p_value']),
                'n_samples': int(values['n_samples'])
            }
        
        # Build response
        response = {
            'status': 'success',
            'data': {
                'correlations': formatted_correlations,
                'regressions': formatted_regressions,
                'summary': summary,
                'restaurants_analyzed': len(merged_df)
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'}), 200


@app.route('/', methods=['GET'])
def index():
    """Root endpoint with API information."""
    return jsonify({
        'service': 'Efficiency-Waste Correlation API',
        'version': '1.0.0',
        'endpoints': {
            '/api/efficiency-waste-correlation': 'GET - Correlation and regression analysis results',
            '/api/health': 'GET - Health check'
        }
    }), 200


if __name__ == '__main__':
    # Run Flask app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

