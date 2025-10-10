/**
 * Test component for keyboard shortcut functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { useCommandPalette } from '../core/hooks/store/use-command-palette';

export function KeyboardShortcutTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { isCreateIssueModalOpen, toggleCreateIssueModal } = useCommandPalette();

  useEffect(() => {
    const addTestResult = (message: string) => {
      setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    // Listen for keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'i' && (event.metaKey || event.ctrlKey)) {
        addTestResult(`🎹 Keyboard shortcut detected: ${event.metaKey ? 'Cmd' : 'Ctrl'}+I`);
      }
    };

    // Listen for our custom event
    const handleCustomEvent = () => {
      addTestResult('🎯 Custom event received by test component');
    };

    // Listen for modal state changes
    const checkModalState = () => {
      addTestResult(`📱 Modal state: ${isCreateIssueModalOpen ? 'OPEN' : 'CLOSED'}`);
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('plane:open-new-issue', handleCustomEvent);
    
    // Check modal state periodically
    const interval = setInterval(checkModalState, 5000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('plane:open-new-issue', handleCustomEvent);
      clearInterval(interval);
    };
  }, [isCreateIssueModalOpen]);

  const clearResults = () => setTestResults([]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      borderRadius: '5px',
      maxWidth: '300px',
      maxHeight: '400px',
      overflow: 'auto',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h3>🎹 Keyboard Shortcut Test</h3>
      <p>Try pressing <strong>Cmd+I</strong> (Mac) or <strong>Ctrl+I</strong> (Windows/Linux)</p>
      <p>Modal State: <strong>{isCreateIssueModalOpen ? 'OPEN' : 'CLOSED'}</strong></p>
      <button onClick={clearResults} style={{ marginBottom: '10px' }}>Clear Results</button>
      <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
        <strong>Test Results:</strong>
        {testResults.length === 0 ? (
          <p>No events detected yet...</p>
        ) : (
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            {testResults.slice(-10).map((result, index) => (
              <li key={index}>{result}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
