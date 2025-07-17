#!/usr/bin/env python3
"""
Test script for OptiSchema analysis engine.
Tests query fingerprinting, hot query identification, and basic heuristics.
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analysis.core import fingerprint_query, identify_hot_queries, detect_basic_issues, analyze_queries
from analysis.explain import analyze_execution_plan
from models import QueryMetrics
from datetime import datetime


def test_query_fingerprinting():
    """Test query fingerprinting functionality."""
    print("🧪 Testing Query Fingerprinting...")
    
    test_queries = [
        "SELECT * FROM users WHERE id = 123",
        "SELECT * FROM users WHERE id = 456",
        "SELECT name, email FROM users WHERE id = 123",
        "SELECT name, email FROM users WHERE id = 456",
        "SELECT * FROM orders WHERE user_id = 123 AND status = 'pending'",
        "SELECT * FROM orders WHERE user_id = 456 AND status = 'completed'"
    ]
    
    fingerprints = []
    for query in test_queries:
        fingerprint = fingerprint_query(query)
        fingerprints.append(fingerprint)
        print(f"  Query: {query[:50]}...")
        print(f"  Fingerprint: {fingerprint}")
        print()
    
    # Check that similar queries have same fingerprint
    assert fingerprints[0] == fingerprints[1], "Queries with different literals should have same fingerprint"
    assert fingerprints[2] == fingerprints[3], "Queries with different literals should have same fingerprint"
    assert fingerprints[4] == fingerprints[5], "Queries with different literals should have same fingerprint"
    
    # Check that different query structures have different fingerprints
    assert fingerprints[0] != fingerprints[2], "Different query structures should have different fingerprints"
    assert fingerprints[2] != fingerprints[4], "Different query structures should have different fingerprints"
    
    print("✅ Query fingerprinting tests passed!")


def test_basic_issues_detection():
    """Test basic SQL issue detection."""
    print("\n🧪 Testing Basic Issues Detection...")
    
    test_queries = [
        "SELECT * FROM users",  # SELECT *
        "DELETE FROM users",    # Missing WHERE
        "UPDATE users SET name = 'John'",  # Missing WHERE
        "SELECT id FROM users ORDER BY name",  # ORDER BY without LIMIT
        "SELECT * FROM users WHERE name LIKE '%john%'",  # Leading wildcard
        "SELECT id FROM users WHERE id = 123; SELECT name FROM users WHERE id = 456"  # Multiple SELECTs
    ]
    
    expected_issues = [
        ['select_star'],
        ['missing_where'],
        ['missing_where'],
        ['order_by_no_limit'],
        ['leading_wildcard'],
        ['multiple_selects']
    ]
    
    for i, query in enumerate(test_queries):
        issues = detect_basic_issues(query)
        issue_types = [issue['type'] for issue in issues]
        print(f"  Query: {query}")
        print(f"  Detected issues: {issue_types}")
        print(f"  Expected issues: {expected_issues[i]}")
        
        # Check that expected issues are detected
        for expected_issue in expected_issues[i]:
            assert expected_issue in issue_types, f"Expected issue {expected_issue} not detected"
        
        print()
    
    print("✅ Basic issues detection tests passed!")


def test_hot_query_identification():
    """Test hot query identification."""
    print("\n🧪 Testing Hot Query Identification...")
    
    # Create sample metrics
    metrics = [
        QueryMetrics(
            query_hash="hash1",
            query_text="SELECT * FROM users WHERE id = 123",
            total_time=1000,
            calls=10,
            mean_time=100.0
        ),
        QueryMetrics(
            query_hash="hash2", 
            query_text="SELECT * FROM users WHERE id = 456",
            total_time=500,
            calls=5,
            mean_time=100.0
        ),
        QueryMetrics(
            query_hash="hash3",
            query_text="SELECT name, email FROM users WHERE id = 123",
            total_time=200,
            calls=20,
            mean_time=10.0
        )
    ]
    
    hot_queries = identify_hot_queries(metrics, limit=2)
    
    print(f"  Found {len(hot_queries)} hot queries")
    for i, hot_query in enumerate(hot_queries):
        print(f"  {i+1}. {hot_query.query_text[:50]}... (Time: {hot_query.total_time}ms, Calls: {hot_query.calls})")
    
    # Check that queries are sorted by total time
    assert len(hot_queries) == 2, "Should return 2 hot queries"
    assert hot_queries[0].total_time >= hot_queries[1].total_time, "Hot queries should be sorted by total time"
    
    print("✅ Hot query identification tests passed!")


async def test_analysis_pipeline():
    """Test the complete analysis pipeline."""
    print("\n🧪 Testing Analysis Pipeline...")
    
    # Create sample metrics
    metrics = [
        QueryMetrics(
            query_hash="hash1",
            query_text="SELECT * FROM users WHERE id = 123",
            total_time=1000,
            calls=10,
            mean_time=100.0
        ),
        QueryMetrics(
            query_hash="hash2",
            query_text="SELECT name, email FROM users WHERE id = 456", 
            total_time=500,
            calls=5,
            mean_time=100.0
        )
    ]
    
    # Run analysis
    analysis_result = analyze_queries(metrics)
    
    print(f"  Analysis completed:")
    print(f"  - Total queries analyzed: {analysis_result['total_queries_analyzed']}")
    print(f"  - Queries with issues: {analysis_result['queries_with_issues']}")
    print(f"  - Hot queries found: {len(analysis_result['hot_queries'])}")
    
    # Check that analysis contains expected data
    assert 'performance_summary' in analysis_result, "Analysis should contain performance summary"
    assert 'hot_queries' in analysis_result, "Analysis should contain hot queries"
    assert 'query_issues' in analysis_result, "Analysis should contain query issues"
    
    print("✅ Analysis pipeline tests passed!")


async def main():
    """Run all tests."""
    print("🚀 Starting OptiSchema Analysis Engine Tests...\n")
    
    try:
        # Run synchronous tests
        test_query_fingerprinting()
        test_basic_issues_detection()
        test_hot_query_identification()
        
        # Run asynchronous tests
        await test_analysis_pipeline()
        
        print("\n🎉 All tests passed! Analysis engine is working correctly.")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 