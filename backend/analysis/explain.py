"""
Execution plan analysis module for OptiSchema backend.
Handles EXPLAIN plan execution, parsing, and performance bottleneck detection.
"""

import logging
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from db import get_pool
from models import ExecutionPlan

logger = logging.getLogger(__name__)


async def execute_explain_plan(query_text: str) -> Optional[Dict[str, Any]]:
    """
    Execute EXPLAIN (FORMAT JSON) on a query and return the plan.
    
    Args:
        query_text: The SQL query to explain
        
    Returns:
        Execution plan as JSON dict or None if execution fails
    """
    try:
        # Wrap query in EXPLAIN
        explain_query = f"EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) {query_text}"
        
        pool = await get_pool()
        async with pool.acquire() as conn:
            # Execute the explain query
            result = await conn.fetchval(explain_query)
            
            if result:
                # Parse the JSON result
                if isinstance(result, str):
                    plan_data = json.loads(result)
                else:
                    plan_data = result
                
                logger.info(f"Successfully generated execution plan for query")
                return plan_data
            else:
                logger.warning("EXPLAIN query returned no results")
                return None
                
    except Exception as e:
        logger.error(f"Failed to execute EXPLAIN plan: {e}")
        return None


def extract_plan_metrics(plan_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract key performance metrics from an execution plan.
    
    Args:
        plan_json: Raw execution plan JSON
        
    Returns:
        Extracted metrics and analysis
    """
    if not plan_json:
        return {}
    
    # Handle different plan structures
    if isinstance(plan_json, list):
        if len(plan_json) == 0:
            return {}
        plan = plan_json[0]
    elif isinstance(plan_json, dict):
        plan = plan_json
    else:
        return {}
    
    metrics = {
        'total_cost': 0.0,
        'total_time': 0.0,
        'planning_time': 0.0,
        'execution_time': 0.0,
        'total_rows': 0,
        'shared_hit_blocks': 0,
        'shared_read_blocks': 0,
        'shared_written_blocks': 0,
        'temp_read_blocks': 0,
        'temp_written_blocks': 0,
        'nodes': [],
        'bottlenecks': []
    }
    
    # Extract timing information
    if 'Planning Time' in plan:
        metrics['planning_time'] = float(plan['Planning Time'])
    if 'Execution Time' in plan:
        metrics['execution_time'] = float(plan['Execution Time'])
    
    metrics['total_time'] = metrics['planning_time'] + metrics['execution_time']
    
    # Extract buffer information
    if 'Shared Hit Blocks' in plan:
        metrics['shared_hit_blocks'] = int(plan['Shared Hit Blocks'])
    if 'Shared Read Blocks' in plan:
        metrics['shared_read_blocks'] = int(plan['Shared Read Blocks'])
    if 'Shared Written Blocks' in plan:
        metrics['shared_written_blocks'] = int(plan['Shared Written Blocks'])
    if 'Temp Read Blocks' in plan:
        metrics['temp_read_blocks'] = int(plan['Temp Read Blocks'])
    if 'Temp Written Blocks' in plan:
        metrics['temp_written_blocks'] = int(plan['Temp Written Blocks'])
    
    # Analyze plan nodes
    def analyze_node(node: Dict[str, Any], depth: int = 0) -> Dict[str, Any]:
        """Recursively analyze plan nodes."""
        node_info = {
            'node_type': node.get('Node Type', 'Unknown'),
            'cost': float(node.get('Total Cost', 0)),
            'rows': int(node.get('Plan Rows', 0)),
            'width': int(node.get('Plan Width', 0)),
            'actual_time': float(node.get('Actual Time', 0)),
            'actual_rows': int(node.get('Actual Rows', 0)),
            'loops': int(node.get('Loops', 1)),
            'depth': depth,
            'relation_name': node.get('Relation Name', ''),
            'index_name': node.get('Index Name', ''),
            'scan_direction': node.get('Scan Direction', ''),
            'filter': node.get('Filter', ''),
            'join_type': node.get('Join Type', ''),
            'hash_condition': node.get('Hash Cond', ''),
            'merge_condition': node.get('Merge Cond', ''),
            'sort_key': node.get('Sort Key', []),
            'group_key': node.get('Group Key', []),
            'children': []
        }
        
        # Update total metrics
        metrics['total_cost'] += node_info['cost']
        metrics['total_rows'] += node_info['actual_rows']
        
        # Analyze children
        if 'Plans' in node:
            for child in node['Plans']:
                child_info = analyze_node(child, depth + 1)
                node_info['children'].append(child_info)
        
        return node_info
    
    # Start analysis from the root plan
    if 'Plan' in plan:
        root_node = analyze_node(plan['Plan'])
        metrics['nodes'].append(root_node)
    
    # Detect bottlenecks
    bottlenecks = detect_plan_bottlenecks(metrics['nodes'])
    metrics['bottlenecks'] = bottlenecks
    
    return metrics


def detect_plan_bottlenecks(nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect performance bottlenecks in execution plan nodes.
    
    Args:
        nodes: List of analyzed plan nodes
        
    Returns:
        List of detected bottlenecks
    """
    bottlenecks = []
    
    def check_node_bottlenecks(node: Dict[str, Any]):
        """Check individual node for bottlenecks."""
        node_type = node['node_type']
        actual_time = node['actual_time']
        actual_rows = node['actual_rows']
        loops = node['loops']
        
        # Sequential Scan on large tables
        if node_type == 'Seq Scan' and actual_rows > 1000:
            bottlenecks.append({
                'type': 'sequential_scan',
                'severity': 'high' if actual_rows > 10000 else 'medium',
                'node_type': node_type,
                'description': f'Sequential scan on {node.get("relation_name", "table")} returning {actual_rows} rows',
                'recommendation': 'Consider adding an index on the WHERE clause columns',
                'impact': 'High - scans entire table'
            })
        
        # Sort operations on large datasets
        if node_type == 'Sort' and actual_rows > 1000:
            bottlenecks.append({
                'type': 'large_sort',
                'severity': 'medium',
                'node_type': node_type,
                'description': f'Sort operation on {actual_rows} rows',
                'recommendation': 'Consider adding an index with the same sort order',
                'impact': 'Medium - requires temporary storage'
            })
        
        # Hash operations
        if node_type == 'Hash' and actual_rows > 5000:
            bottlenecks.append({
                'type': 'large_hash',
                'severity': 'medium',
                'node_type': node_type,
                'description': f'Hash operation on {actual_rows} rows',
                'recommendation': 'Consider using nested loop joins for smaller datasets',
                'impact': 'Medium - requires building hash table in memory'
            })
        
        # Nested Loop with large outer relation
        if node_type == 'Nested Loop' and actual_rows > 10000:
            bottlenecks.append({
                'type': 'large_nested_loop',
                'severity': 'high',
                'node_type': node_type,
                'description': f'Nested loop join with {actual_rows} rows',
                'recommendation': 'Consider using hash or merge joins for large datasets',
                'impact': 'High - quadratic complexity'
            })
        
        # Check for missing indexes (Index Scan vs Seq Scan)
        if node_type == 'Seq Scan' and node.get('filter'):
            bottlenecks.append({
                'type': 'missing_index',
                'severity': 'high',
                'node_type': node_type,
                'description': f'Sequential scan with filter: {node.get("filter", "")}',
                'recommendation': 'Add index on filtered columns',
                'impact': 'High - scans entire table instead of using index'
            })
        
        # Recursively check children
        for child in node.get('children', []):
            check_node_bottlenecks(child)
    
    # Check all nodes
    for node in nodes:
        check_node_bottlenecks(node)
    
    return bottlenecks


async def analyze_execution_plan(query_text: str) -> Optional[ExecutionPlan]:
    """
    Analyze a query's execution plan and return detailed analysis.
    
    Args:
        query_text: The SQL query to analyze
        
    Returns:
        ExecutionPlan object with analysis results
    """
    try:
        # Execute EXPLAIN plan
        plan_json = await execute_explain_plan(query_text)
        if not plan_json:
            logger.warning("Failed to generate execution plan")
            return None
        
        # Extract metrics from plan
        metrics = extract_plan_metrics(plan_json)
        
        # Create ExecutionPlan object
        execution_plan = ExecutionPlan(
            plan_json=plan_json,
            total_cost=metrics.get('total_cost'),
            total_time=metrics.get('total_time'),
            planning_time=metrics.get('planning_time'),
            execution_time=metrics.get('execution_time'),
            nodes=metrics.get('nodes', [])
        )
        
        logger.info(f"Execution plan analysis complete: {len(metrics.get('bottlenecks', []))} bottlenecks detected")
        
        return execution_plan
        
    except Exception as e:
        logger.error(f"Failed to analyze execution plan: {e}")
        return None


def get_plan_summary(execution_plan: ExecutionPlan) -> Dict[str, Any]:
    """
    Generate a human-readable summary of execution plan analysis.
    
    Args:
        execution_plan: The analyzed execution plan
        
    Returns:
        Summary with key insights and recommendations
    """
    if not execution_plan:
        return {}
    
    summary = {
        'total_cost': execution_plan.total_cost,
        'total_time': execution_plan.total_time,
        'planning_time': execution_plan.planning_time,
        'execution_time': execution_plan.execution_time,
        'node_count': len(execution_plan.nodes),
        'performance_rating': 'good',
        'key_insights': [],
        'recommendations': []
    }
    
    # Analyze performance rating
    if execution_plan.total_time and execution_plan.total_time > 1000:  # > 1 second
        summary['performance_rating'] = 'poor'
    elif execution_plan.total_time and execution_plan.total_time > 100:  # > 100ms
        summary['performance_rating'] = 'fair'
    
    # Extract insights from nodes
    for node in execution_plan.nodes:
        node_type = node.get('node_type', '')
        actual_time = node.get('actual_time', 0)
        actual_rows = node.get('actual_rows', 0)
        
        if node_type == 'Seq Scan' and actual_rows > 1000:
            summary['key_insights'].append(f"Large sequential scan: {actual_rows} rows")
            summary['recommendations'].append("Consider adding indexes on WHERE clause columns")
        
        if node_type == 'Sort' and actual_rows > 1000:
            summary['key_insights'].append(f"Large sort operation: {actual_rows} rows")
            summary['recommendations'].append("Consider adding indexes with appropriate sort order")
        
        if actual_time > 100:  # > 100ms
            summary['key_insights'].append(f"Slow {node_type} operation: {actual_time:.2f}ms")
    
    return summary 