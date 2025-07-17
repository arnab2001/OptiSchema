-- OptiSchema PostgreSQL Initialization Script
-- This script sets up the database with required extensions and basic structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema for OptiSchema
CREATE SCHEMA IF NOT EXISTS optischema;

-- Create tables for storing analysis results and recommendations
CREATE TABLE IF NOT EXISTS optischema.query_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash TEXT NOT NULL,
    query_text TEXT NOT NULL,
    total_time BIGINT NOT NULL,
    calls BIGINT NOT NULL,
    mean_time DOUBLE PRECISION NOT NULL,
    stddev_time DOUBLE PRECISION,
    min_time BIGINT,
    max_time BIGINT,
    rows BIGINT,
    shared_blks_hit BIGINT,
    shared_blks_read BIGINT,
    shared_blks_written BIGINT,
    shared_blks_dirtied BIGINT,
    temp_blks_read BIGINT,
    temp_blks_written BIGINT,
    blk_read_time DOUBLE PRECISION,
    blk_write_time DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS optischema.analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash TEXT NOT NULL,
    query_text TEXT NOT NULL,
    execution_plan JSONB,
    analysis_summary TEXT,
    performance_score INTEGER,
    bottleneck_type TEXT,
    bottleneck_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS optischema.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash TEXT NOT NULL,
    recommendation_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sql_fix TEXT,
    estimated_improvement_percent INTEGER,
    confidence_score INTEGER,
    risk_level TEXT,
    applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS optischema.sandbox_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID REFERENCES optischema.recommendations(id),
    original_performance JSONB,
    optimized_performance JSONB,
    improvement_percent INTEGER,
    test_status TEXT,
    test_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_query_metrics_hash ON optischema.query_metrics(query_hash);
CREATE INDEX IF NOT EXISTS idx_query_metrics_created_at ON optischema.query_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_results_hash ON optischema.analysis_results(query_hash);
CREATE INDEX IF NOT EXISTS idx_recommendations_hash ON optischema.recommendations(query_hash);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON optischema.recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_applied ON optischema.recommendations(applied);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION optischema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_query_metrics_updated_at 
    BEFORE UPDATE ON optischema.query_metrics 
    FOR EACH ROW EXECUTE FUNCTION optischema.update_updated_at_column();

-- Create views for easier querying
CREATE OR REPLACE VIEW optischema.hot_queries AS
SELECT 
    query_hash,
    query_text,
    total_time,
    calls,
    mean_time,
    ROUND((total_time / NULLIF(SUM(total_time) OVER (), 0)) * 100, 2) as percentage_of_total_time
FROM optischema.query_metrics
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY total_time DESC;

CREATE OR REPLACE VIEW optischema.recent_recommendations AS
SELECT 
    r.*,
    qm.query_text,
    qm.mean_time as current_mean_time
FROM optischema.recommendations r
JOIN optischema.query_metrics qm ON r.query_hash = qm.query_hash
WHERE r.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY r.created_at DESC;

-- Grant permissions
GRANT USAGE ON SCHEMA optischema TO optischema;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA optischema TO optischema;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA optischema TO optischema;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA optischema TO optischema;

-- Insert some sample data for testing (optional)
INSERT INTO optischema.query_metrics (
    query_hash, 
    query_text, 
    total_time, 
    calls, 
    mean_time
) VALUES 
(
    'sample_query_1',
    'SELECT * FROM information_schema.tables WHERE table_schema = $1',
    1000000,
    100,
    10000
),
(
    'sample_query_2', 
    'SELECT COUNT(*) FROM pg_stat_statements',
    500000,
    50,
    10000
) ON CONFLICT DO NOTHING;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'OptiSchema database initialized successfully!';
    RAISE NOTICE 'Extensions enabled: pg_stat_statements, uuid-ossp';
    RAISE NOTICE 'Schema created: optischema';
    RAISE NOTICE 'Tables created: query_metrics, analysis_results, recommendations, sandbox_tests';
    RAISE NOTICE 'Views created: hot_queries, recent_recommendations';
END $$; 