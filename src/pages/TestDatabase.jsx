// Database Test Page Component
// File: src/pages/TestDatabase.jsx
// Add route: /test-database

import React, { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import './TestDatabase.scss';

const TestDatabase = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const addResult = (test, status, message, details = null) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date() }]);
  };

  const runTests = async () => {
    setResults([]);
    setSummary(null);
    setLoading(true);

    let passed = 0;
    let failed = 0;

    try {
      // Test 1: Database Connection
      addResult('Connection', 'running', 'Testing database connection...');
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('count')
          .limit(1);
        
        if (error) throw error;
        addResult('Connection', 'success', 'Database connected successfully');
        passed++;
      } catch (error) {
        addResult('Connection', 'error', `Connection failed: ${error.message}`);
        failed++;
      }

      // Test 2: Collections Table Structure
      addResult('Collections Table', 'running', 'Checking collections table structure...');
      try {
        const { data: collections, error } = await supabase
          .from('collections')
          .select('*')
          .limit(1);
        
        if (error) throw error;

        const columns = collections.length > 0 ? Object.keys(collections[0]) : [];
        const requiredColumns = ['collection_id', 'banner_image', 'name', 'symbol', 'creator_address'];
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        if (missingColumns.length > 0 && columns.length > 0) {
          addResult('Collections Table', 'warning', 
            `Missing columns: ${missingColumns.join(', ')}`, 
            { columns, requiredColumns, missingColumns });
          failed++;
        } else if (columns.length > 0) {
          addResult('Collections Table', 'success', 
            `All required columns present (${columns.length} total)`, 
            { columns });
          passed++;
        } else {
          addResult('Collections Table', 'info', 
            'No collections yet - cannot verify schema', 
            { columns });
          passed++;
        }
      } catch (error) {
        addResult('Collections Table', 'error', `Table query failed: ${error.message}`);
        failed++;
      }

      // Test 3: Verified Badges Table
      addResult('Verified Badges', 'running', 'Checking verified badges table...');
      try {
        const { data, error } = await supabase
          .from('verified_badges')
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === '42P01') {
            addResult('Verified Badges', 'warning', 'Table does not exist');
            failed++;
          } else {
            throw error;
          }
        } else {
          const columns = data.length > 0 ? Object.keys(data[0]) : [];
          addResult('Verified Badges', 'success', 'Table accessible', { columns });
          passed++;
        }
      } catch (error) {
        addResult('Verified Badges', 'error', `Query failed: ${error.message}`);
        failed++;
      }

      // Test 4: Free Spin Campaigns
      addResult('Free Spin Campaigns', 'running', 'Checking free spin campaigns table...');
      try {
        const { data, error } = await supabase
          .from('free_spin_campaigns')
          .select('*')
          .limit(1);
        
        if (error) throw error;
        addResult('Free Spin Campaigns', 'success', 'Table accessible');
        passed++;
      } catch (error) {
        addResult('Free Spin Campaigns', 'error', `Query failed: ${error.message}`);
        failed++;
      }

      // Test 5: Join Query (Real-world scenario)
      addResult('Join Query', 'running', 'Testing collections join query...');
      try {
        const { data, error } = await supabase
          .from('free_spin_campaigns')
          .select(`
            *,
            collections:collection_id (
              id,
              name,
              symbol,
              banner_image,
              creator_address
            )
          `)
          .eq('active', true)
          .limit(1);
        
        if (error) throw error;
        addResult('Join Query', 'success', 'Join query works correctly');
        passed++;
      } catch (error) {
        if (error.message.includes('banner_image')) {
          addResult('Join Query', 'warning', 'Missing banner_image column in collections table');
        } else {
          addResult('Join Query', 'error', `Join query failed: ${error.message}`);
        }
        failed++;
      }

      // Test 6: Insert Permission Test (without actually inserting)
      addResult('Permissions', 'running', 'Checking table permissions...');
      try {
        // Try to read collections - should work with anon key
        const { error } = await supabase
          .from('collections')
          .select('id')
          .limit(1);
        
        if (error) throw error;
        addResult('Permissions', 'success', 'Read permissions working');
        passed++;
      } catch (error) {
        addResult('Permissions', 'error', `Permission check failed: ${error.message}`);
        failed++;
      }

      setSummary({ passed, failed, total: passed + failed });

    } catch (error) {
      addResult('Overall', 'error', `Unexpected error: ${error.message}`);
      failed++;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run tests on mount
    runTests();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'running': return '⏳';
      default: return '•';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'success': return 'status-success';
      case 'error': return 'status-error';
      case 'warning': return 'status-warning';
      case 'info': return 'status-info';
      case 'running': return 'status-running';
      default: return '';
    }
  };

  return (
    <div className="test-database-page">
      <div className="test-container">
        <h1>🧪 Database Tests</h1>
        <p className="subtitle">Testing Supabase connection and schema</p>

        <div className="test-actions">
          <button onClick={runTests} disabled={loading} className="btn-primary">
            {loading ? '⏳ Running Tests...' : '🔄 Run Tests Again'}
          </button>
        </div>

        {summary && (
          <div className={`summary ${summary.failed === 0 ? 'summary-success' : 'summary-warning'}`}>
            <h3>📊 Summary</h3>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Total:</span>
                <span className="stat-value">{summary.total}</span>
              </div>
              <div className="stat stat-success">
                <span className="stat-label">Passed:</span>
                <span className="stat-value">{summary.passed}</span>
              </div>
              <div className="stat stat-error">
                <span className="stat-label">Failed:</span>
                <span className="stat-value">{summary.failed}</span>
              </div>
            </div>
            {summary.failed > 0 && (
              <div className="fix-needed">
                <p><strong>⚠️ Action Required:</strong></p>
                <ol>
                  <li>Run <code>supabase/FIX_SCHEMA_ISSUES.sql</code> in Supabase SQL Editor</li>
                  <li>Go to Settings → API → Refresh Schema Cache</li>
                  <li>Wait 15 seconds and run tests again</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <div className="test-results">
          {results.map((result, index) => (
            <div key={index} className={`test-result ${getStatusClass(result.status)}`}>
              <div className="result-header">
                <span className="result-icon">{getStatusIcon(result.status)}</span>
                <span className="result-test">{result.test}</span>
              </div>
              <div className="result-message">{result.message}</div>
              {result.details && (
                <details className="result-details">
                  <summary>Show Details</summary>
                  <pre>{JSON.stringify(result.details, null, 2)}</pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && !loading && (
          <div className="empty-state">
            <p>Click "Run Tests" to start testing</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDatabase;

