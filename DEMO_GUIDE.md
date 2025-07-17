# 🎭 OptiSchema Demo Guide

This guide will help you run a compelling demo of OptiSchema that showcases its AI-powered PostgreSQL optimization capabilities.

## 🚀 Quick Start

### 1. Start the Demo Environment
```bash
make demo
```

This command will:
- Start all services (PostgreSQL, Backend API, Frontend)
- Seed the database with realistic demo data
- Create intentional performance bottlenecks
- Make the dashboard ready for demo

### 2. Access the Dashboard
Open your browser and go to: **http://localhost:3000/dashboard**

You should see:
- Live performance metrics
- AI-generated optimization suggestions
- Real-time data updates

---

## 📊 Demo Data Overview

The demo environment includes:

### **Database Schema**
- **1,000 users** with realistic profiles and preferences
- **500 products** across 7 categories (Electronics, Clothing, Books, etc.)
- **5,000 orders** with order items and realistic pricing
- **50,000 log entries** for user activity tracking

### **Performance Bottlenecks Created**
1. **Missing Indexes** - Queries on `user_id` without proper indexes
2. **N+1 Query Problems** - Inefficient subqueries in loops
3. **Inefficient Text Search** - LIKE queries on unindexed columns
4. **Complex Aggregations** - Window functions without proper indexes
5. **JSON Query Issues** - JSON operations without GIN indexes

---

## 🎯 Demo Scenarios

### **Scenario 1: Dashboard Overview**
**Goal**: Show the main dashboard with live data

**Steps**:
1. Open http://localhost:3000/dashboard
2. Point out the "Connected to: optischema" status
3. Show the live metrics with real-time updates
4. Highlight the performance metrics showing slow queries
5. Show the AI-generated suggestions with impact levels

**Key Points**:
- "This dashboard shows real-time performance data from your PostgreSQL database"
- "The AI has identified several optimization opportunities"
- "Each suggestion includes projected performance improvements"

### **Scenario 2: Query Analysis**
**Goal**: Demonstrate detailed query analysis

**Steps**:
1. Click on the "Query Analysis" tab
2. Show the list of slowest queries
3. Click on a query to see detailed analysis
4. Point out the execution plan analysis
5. Show the AI explanation of the performance issue

**Key Points**:
- "This query is taking 2.3 seconds on average"
- "The AI has identified that it's doing a sequential scan"
- "Here's what's causing the performance issue..."

### **Scenario 3: AI Recommendations**
**Goal**: Show AI-generated optimization suggestions

**Steps**:
1. Click on the "Optimizations" tab
2. Show the list of AI-generated suggestions
3. Click on a high-impact suggestion
4. Show the detailed explanation and proposed fix
5. Demonstrate the confidence score and projected savings

**Key Points**:
- "The AI has analyzed your query patterns and identified optimization opportunities"
- "This suggestion has a 95% confidence level"
- "Projected improvement: 80% faster query execution"

### **Scenario 4: Live Query Replay**
**Goal**: Show continuous data generation

**Steps**:
1. Start query replay: `make replay-background`
2. Show how new metrics appear in real-time
3. Point out how the AI adapts to new patterns
4. Show the live indicator pulsing

**Key Points**:
- "The system continuously monitors your database"
- "New performance issues are detected automatically"
- "The AI learns from your query patterns"

---

## 🛠️ Demo Commands

### **Essential Commands**
```bash
# Start demo environment
make demo

# Start query replay (continuous data generation)
make replay-background

# Stop query replay
make stop-replay

# Check service status
make status

# View logs
make logs

# Test API endpoints
make test-api

# Clean up everything
make clean
```

### **Advanced Commands**
```bash
# Start sandbox environment (for testing patches)
make sandbox

# Seed data into existing database
make seed

# Restart specific services
make restart-api
make restart-ui
```

---

## 🎨 Demo Tips

### **Before the Demo**
1. **Test everything**: Run `make demo` and verify all services are working
2. **Check data**: Ensure the dashboard shows meaningful metrics
3. **Prepare your story**: Have a clear narrative about the problem OptiSchema solves

### **During the Demo**
1. **Start with the problem**: "Database performance issues cost companies millions"
2. **Show the solution**: "OptiSchema automatically identifies and fixes these issues"
3. **Demonstrate value**: "This suggestion will save 80% in query time"
4. **Keep it interactive**: Click around and show different features

### **Demo Flow**
1. **Problem Statement** (30 seconds)
   - "Database performance issues are hard to detect and fix"
   - "Traditional monitoring tools don't provide actionable insights"

2. **Solution Overview** (1 minute)
   - Show the dashboard with live data
   - Point out the AI-generated suggestions
   - Highlight the real-time monitoring

3. **Deep Dive** (2-3 minutes)
   - Show detailed query analysis
   - Demonstrate AI explanations
   - Show projected improvements

4. **Value Proposition** (30 seconds)
   - "Automated performance optimization"
   - "AI-powered insights"
   - "Real-time monitoring"

---

## 🔧 Troubleshooting

### **Dashboard Not Loading**
```bash
# Check if services are running
make status

# Restart services
make restart

# Check logs
make logs
```

### **No Data in Dashboard**
```bash
# Seed demo data
make seed

# Start query replay
make replay-background
```

### **API Errors**
```bash
# Test API endpoints
make test-api

# Check API logs
make logs-api
```

### **Database Issues**
```bash
# Check database logs
make logs-db

# Restart database
docker compose restart postgres
```

---

## 📈 Expected Demo Results

### **Dashboard Metrics**
- **Total Queries**: 50,000+ (from seeded data)
- **Average Response Time**: 100-500ms (varies)
- **Top Queries**: Should show slow queries with high execution times
- **Suggestions**: 3-5 AI-generated optimization recommendations

### **Performance Bottlenecks**
- Missing indexes on `user_id` columns
- N+1 query problems in order lookups
- Inefficient text searches on product descriptions
- Complex aggregations without proper indexes

### **AI Suggestions**
- Index recommendations for frequently queried columns
- Query rewrite suggestions for N+1 problems
- Configuration optimizations for PostgreSQL settings

---

## 🎯 Success Metrics

A successful demo should demonstrate:
- ✅ **Real-time data**: Dashboard shows live metrics
- ✅ **AI insights**: Meaningful optimization suggestions
- ✅ **Performance analysis**: Detailed query breakdowns
- ✅ **Actionable recommendations**: Clear next steps for optimization
- ✅ **Professional UI**: Clean, intuitive interface

---

## 🚀 Next Steps After Demo

1. **Collect feedback** on the demo experience
2. **Identify specific use cases** for the audience
3. **Discuss integration** with existing monitoring tools
4. **Plan pilot deployment** if there's interest
5. **Follow up** with technical details and pricing

---

This demo guide ensures you can confidently showcase OptiSchema's capabilities and value proposition to potential users and stakeholders. 