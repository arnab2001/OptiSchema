#!/usr/bin/env python3
"""
Test script for OptiSchema AI integration.
Tests OpenAI API integration, caching, and recommendation generation.
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analysis.llm import explain_plan, rewrite_query, generate_recommendation
from cache import set_cache, get_cache, make_cache_key
from analysis.core import fingerprint_query


async def test_llm_connection():
    """Test basic LLM API connection."""
    print("🧪 Testing LLM API Connection...")
    
    try:
        from analysis.llm import call_llm_api
        
        response = await call_llm_api("Say 'Hello from OptiSchema!'", max_tokens=10)
        print(f"  ✅ LLM API working: {response}")
        return True
    except Exception as e:
        print(f"  ❌ LLM API failed: {e}")
        return False


async def test_query_rewrite():
    """Test AI query rewrite functionality."""
    print("\n🧪 Testing Query Rewrite...")
    
    test_query = "SELECT * FROM users WHERE name LIKE '%john%' ORDER BY created_at"
    
    try:
        optimized = await rewrite_query(test_query)
        print(f"  Original: {test_query}")
        print(f"  Optimized: {optimized}")
        
        if optimized != test_query:
            print("  ✅ Query rewrite working - AI generated optimization")
        else:
            print("  ⚠️  Query unchanged - may be already optimal or AI error")
        
        return True
    except Exception as e:
        print(f"  ❌ Query rewrite failed: {e}")
        return False


async def test_recommendation_generation():
    """Test AI recommendation generation."""
    print("\n🧪 Testing Recommendation Generation...")
    
    test_data = {
        "query_text": "SELECT * FROM orders WHERE user_id = 123 AND status = 'pending'",
        "bottleneck_type": "sequential_scan",
        "performance_score": 30,
        "summary": "Query performs sequential scan on large table"
    }
    
    try:
        recommendation = await generate_recommendation(test_data)
        print(f"  Title: {recommendation.get('title', 'N/A')}")
        print(f"  Description: {recommendation.get('description', 'N/A')[:100]}...")
        print(f"  SQL Fix: {recommendation.get('sql_fix', 'N/A')}")
        
        if recommendation.get('title') and recommendation.get('description'):
            print("  ✅ Recommendation generation working")
        else:
            print("  ⚠️  Recommendation incomplete")
        
        return True
    except Exception as e:
        print(f"  ❌ Recommendation generation failed: {e}")
        return False


async def test_caching():
    """Test caching functionality."""
    print("\n🧪 Testing Caching...")
    
    test_key = "test_cache_key"
    test_value = "test_cache_value"
    
    try:
        # Test cache set
        set_cache(test_key, test_value)
        print("  ✅ Cache set working")
        
        # Test cache get
        cached_value = get_cache(test_key)
        if cached_value == test_value:
            print("  ✅ Cache get working")
        else:
            print(f"  ❌ Cache get failed: expected '{test_value}', got '{cached_value}'")
            return False
        
        # Test cache key generation
        fingerprint = fingerprint_query("SELECT * FROM users")
        cache_key = make_cache_key(fingerprint, "test")
        print(f"  ✅ Cache key generation working: {cache_key[:50]}...")
        
        return True
    except Exception as e:
        print(f"  ❌ Caching failed: {e}")
        return False


async def test_integrated_analysis():
    """Test the complete AI integration with analysis pipeline."""
    print("\n🧪 Testing Integrated Analysis...")
    
    try:
        from analysis.pipeline import run_analysis_pipeline
        
        # Run analysis pipeline (this should trigger AI recommendations)
        results = await run_analysis_pipeline()
        
        print(f"  Analysis completed:")
        print(f"  - Queries analyzed: {results.get('total_queries_analyzed', 0)}")
        print(f"  - Hot queries: {len(results.get('hot_queries', []))}")
        print(f"  - Recommendations: {len(results.get('recommendations', []))}")
        
        if results.get('recommendations'):
            print("  ✅ AI recommendations generated successfully")
            # Show first recommendation
            first_rec = results['recommendations'][0]
            print(f"  - First recommendation: {first_rec.get('title', 'N/A')}")
        else:
            print("  ⚠️  No recommendations generated (may be due to no hot queries)")
        
        return True
    except Exception as e:
        print(f"  ❌ Integrated analysis failed: {e}")
        return False


async def main():
    """Run all AI integration tests."""
    print("🚀 Starting OptiSchema AI Integration Tests...\n")
    
    tests = [
        ("LLM Connection", test_llm_connection),
        ("Query Rewrite", test_query_rewrite),
        ("Recommendation Generation", test_recommendation_generation),
        ("Caching", test_caching),
        ("Integrated Analysis", test_integrated_analysis)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = await test_func()
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results[test_name] = False
    
    # Summary
    print("\n📊 Test Results Summary:")
    passed = sum(results.values())
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"  {test_name}: {status}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All AI integration tests passed! AI integration is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 