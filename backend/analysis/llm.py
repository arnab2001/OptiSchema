"""
Multi-model LLM integration for OptiSchema backend.
Supports Gemini (Google) and DeepSeek for query analysis and recommendations.
"""

import os
import logging
import json
import aiohttp
from typing import Dict, Any, Optional
from config import settings
from analysis.core import fingerprint_query
from cache import make_cache_key, get_cache, set_cache

logger = logging.getLogger(__name__)

# Model configuration
GEMINI_API_KEY = settings.gemini_api_key
DEEPSEEK_API_KEY = settings.deepseek_api_key
ACTIVE_MODEL = settings.llm_provider

# Prompt templates
EXPLAIN_PLAN_PROMPT = """
You are a PostgreSQL performance expert. Given the following execution plan (in JSON), explain the main performance bottlenecks and suggest optimizations in clear, actionable language for a database engineer. Be concise and specific.

Execution Plan JSON:
{plan_json}
"""

REWRITE_QUERY_PROMPT = """
You are an expert SQL query optimizer. Given the following SQL query, rewrite it for better performance on PostgreSQL. Only output the optimized SQL, no explanations.

Original Query:
{sql}
"""

RECOMMENDATION_PROMPT = """
You are a PostgreSQL tuning assistant. Given the following query metrics and analysis, generate a specific, actionable recommendation to improve performance. Include a short title, a detailed description, and (if applicable) an SQL fix.

Query Data:
{query_data}
"""

async def call_gemini_api(prompt: str, max_tokens: int = 512) -> str:
    """Call Gemini API."""
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY
    }
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.2
        }
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as response:
            if response.status == 200:
                result = await response.json()
                return result["candidates"][0]["content"]["parts"][0]["text"].strip()
            else:
                error_text = await response.text()
                raise Exception(f"Gemini API error: {response.status} - {error_text}")

async def call_deepseek_api(prompt: str, max_tokens: int = 512) -> str:
    """Call DeepSeek API."""
    url = "https://api.deepseek.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.2
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as response:
            if response.status == 200:
                result = await response.json()
                return result["choices"][0]["message"]["content"].strip()
            else:
                error_text = await response.text()
                raise Exception(f"DeepSeek API error: {response.status} - {error_text}")

async def call_llm_api(prompt: str, max_tokens: int = 512) -> str:
    """Call the active LLM API."""
    if ACTIVE_MODEL == "gemini":
        return await call_gemini_api(prompt, max_tokens)
    elif ACTIVE_MODEL == "deepseek":
        return await call_deepseek_api(prompt, max_tokens)
    else:
        raise ValueError(f"Unknown model: {ACTIVE_MODEL}")

# Core AI functions
async def explain_plan(plan_json: Dict[str, Any], query_text: Optional[str] = None) -> str:
    """
    Use LLM to explain a PostgreSQL execution plan.
    Returns a human-readable explanation and suggestions.
    Caches by query fingerprint + 'explain_plan'.
    """
    fingerprint = fingerprint_query(query_text) if query_text else None
    cache_key = make_cache_key(fingerprint, 'explain_plan') if fingerprint else None
    if cache_key:
        cached = get_cache(cache_key)
        if cached:
            logger.info("Cache hit for plan explanation.")
            return cached
    prompt = EXPLAIN_PLAN_PROMPT.format(plan_json=plan_json)
    try:
        explanation = await call_llm_api(prompt, max_tokens=512)
        if cache_key:
            set_cache(cache_key, explanation)
        logger.info(f"{ACTIVE_MODEL.title()} plan explanation generated.")
        return explanation
    except Exception as e:
        logger.error(f"{ACTIVE_MODEL.title()} plan explanation failed: {e}")
        return f"[{ACTIVE_MODEL.title()} explanation unavailable]"

async def rewrite_query(sql: str) -> str:
    """
    Use LLM to rewrite a SQL query for better performance.
    Returns the optimized SQL. Caches by query fingerprint + 'rewrite_query'.
    """
    fingerprint = fingerprint_query(sql)
    cache_key = make_cache_key(fingerprint, 'rewrite_query')
    cached = get_cache(cache_key)
    if cached:
        logger.info("Cache hit for query rewrite.")
        return cached
    prompt = REWRITE_QUERY_PROMPT.format(sql=sql)
    try:
        optimized_sql = await call_llm_api(prompt, max_tokens=256)
        set_cache(cache_key, optimized_sql)
        logger.info(f"{ACTIVE_MODEL.title()} query rewrite generated.")
        return optimized_sql
    except Exception as e:
        logger.error(f"{ACTIVE_MODEL.title()} query rewrite failed: {e}")
        return sql

async def generate_recommendation(query_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use LLM to generate a recommendation for a query.
    Returns a dict with title, description, and optional SQL fix.
    Caches by query fingerprint + 'recommendation'.
    """
    # Use query_text if present for fingerprinting
    query_text = query_data.get('query_text') or json.dumps(query_data)
    fingerprint = fingerprint_query(query_text)
    cache_key = make_cache_key(fingerprint, 'recommendation')
    cached = get_cache(cache_key)
    if cached:
        logger.info("Cache hit for recommendation.")
        try:
            return json.loads(cached)
        except Exception:
            pass
    prompt = RECOMMENDATION_PROMPT.format(query_data=query_data)
    try:
        content = await call_llm_api(prompt, max_tokens=512)
        # Simple parsing: expect title, description, and SQL fix if present
        lines = content.split('\n')
        title = lines[0].strip() if lines else "Recommendation"
        description = "\n".join(lines[1:]).strip() if len(lines) > 1 else ""
        sql_fix = None
        for line in lines:
            if line.strip().upper().startswith("SQL:"):
                sql_fix = line.split(":", 1)[-1].strip()
        result = {
            "title": title,
            "description": description,
            "sql_fix": sql_fix
        }
        set_cache(cache_key, json.dumps(result))
        logger.info(f"{ACTIVE_MODEL.title()} recommendation generated.")
        return result
    except Exception as e:
        logger.error(f"{ACTIVE_MODEL.title()} recommendation failed: {e}")
        return {
            "title": f"[{ACTIVE_MODEL.title()} recommendation unavailable]",
            "description": str(e),
            "sql_fix": None
        } 