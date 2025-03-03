import React, { useState, useEffect, useRef } from 'react';
import { Terminal, FileText, Search, Check, Loader, Globe, Code, Edit, Download, Moon, Sun, ChevronRight, ChevronDown } from 'lucide-react';

const MultiAgentWorkflow = () => {
  // State to track workflow progress
  const [activeAgents, setActiveAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [workflowComplete, setWorkflowComplete] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [finalOutput, setFinalOutput] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // WebSocket reference
  const wsRef = useRef(null);
  
  // Mock data for demonstration - in real implementation, would connect to backend
  const mockAgents = [
    { id: 'research', name: 'Research Agent', icon: <Search size={24} />, color: 'bg-blue-600', darkColor: 'bg-blue-500', tools: ['web_search', 'web_scraper'] },
    { id: 'writer', name: 'Writer Agent', icon: <Edit size={24} />, color: 'bg-emerald-600', darkColor: 'bg-emerald-500', tools: ['text_generator', 'summarizer'] },
    { id: 'reviewer', name: 'Review Agent', icon: <Check size={24} />, color: 'bg-purple-600', darkColor: 'bg-purple-500', tools: ['fact_checker', 'grammar_checker'] }
  ];
  
  const toolIcons = {
    web_search: <Globe size={16} />,
    web_scraper: <Code size={16} />,
    text_generator: <FileText size={16} />,
    summarizer: <FileText size={16} />,
    fact_checker: <Check size={16} />,
    grammar_checker: <Edit size={16} />
  };
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    connectWebSocket();
    
    // Clean up WebSocket connection on unmount
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);
  
  // Function to connect to WebSocket
  const connectWebSocket = () => {
    // Reset connection error
    setConnectionError(null);
    
    // Create WebSocket connection
    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;
    
    // Set up event handlers
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      
      // Try to reconnect after a delay
      setTimeout(connectWebSocket, 2000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionError('Failed to connect to server. Please check if the backend is running.');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      
      // Handle different event types
      switch (data.action) {
        case 'agent_start':
          setActiveAgents(prev => [...prev, data.agent]);
          setCurrentStep({ agent: data.agent, tool: null });
          addLogEntry(data);
          break;
        
        case 'agent_complete':
          setActiveAgents(prev => prev.filter(a => a !== data.agent));
          addLogEntry(data);
          break;
        
        case 'tool_start':
          setCurrentStep({ agent: data.agent, tool: data.tool });
          addLogEntry(data);
          break;
        
        case 'tool_complete':
          setCurrentStep({ agent: data.agent, tool: null });
          addLogEntry(data);
          break;
        
        case 'workflow_complete':
          setWorkflowComplete(true);
          setCurrentStep(null);
          setIsProcessing(false);
          setFinalOutput(data.final_output || '');
          addLogEntry(data);
          break;
        
        case 'error':
          setIsProcessing(false);
          addLogEntry(data);
          break;
        
        default:
          addLogEntry(data);
      }
    };
  };
  
  // Helper function to add logs
  const addLogEntry = (data) => {
    setLogs(prev => [...prev, data]);
  };
  
  // Function to start the workflow
  const startWorkflow = () => {
    if (!userPrompt.trim() || !isConnected) {
      return;
    }
    
    // Reset state
    setLogs([]);
    setActiveAgents([]);
    setWorkflowComplete(false);
    setFinalOutput('');
    setIsProcessing(true);
    
    // Send start command to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "start",
        prompt: userPrompt
      }));
    }
  };
  
  // Export PDF function
  const exportPDF = () => {
    // In a real implementation, this would connect to a PDF generation service
    alert("PDF export functionality would be implemented here. In a real implementation, this would generate and download a PDF of the report.");
  };
  
  // Get agent by ID
  const getAgent = (id) => mockAgents.find(agent => agent.id === id);
  
  // Toggle theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 transition-colors duration-200`}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center">
            <Terminal className="mr-2" />
            Multi-Agent AI Workflow
            {isConnected ? (
              <span className="ml-3 text-xs px-2 py-1 rounded bg-green-500 text-white">Connected</span>
            ) : (
              <span className="ml-3 text-xs px-2 py-1 rounded bg-red-500 text-white">Disconnected</span>
            )}
          </h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>
      
      {/* Connection error message */}
      {connectionError && (
        <div className="px-4 py-2 bg-red-500 text-white">
          {connectionError}
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Agents */}
        <div 
          className={`transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-64'} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}
        >
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
            {!sidebarCollapsed && <h2 className="font-semibold">Agents</h2>}
            <button 
              onClick={toggleSidebar} 
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {mockAgents.map(agent => (
              <div 
                key={agent.id} 
                className={`mb-2 p-3 rounded-lg transition-all ${
                  activeAgents.includes(agent.id) 
                    ? (darkMode ? agent.darkColor : agent.color) + ' text-white' 
                    : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                } ${sidebarCollapsed ? 'flex justify-center' : ''}`}
              >
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
                  {agent.icon}
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-2 font-medium">{agent.name}</span>
                      {activeAgents.includes(agent.id) && (
                        <Loader className="ml-auto animate-spin" size={16} />
                      )}
                    </>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div className="mt-2 text-xs space-y-1">
                    {agent.tools.map(tool => (
                      <div 
                        key={tool} 
                        className={`flex items-center p-1 rounded ${
                          currentStep?.agent === agent.id && currentStep?.tool === tool 
                            ? darkMode ? 'bg-gray-600' : 'bg-opacity-20 bg-white' 
                            : ''
                        }`}
                      >
                        {toolIcons[tool]}
                        <span className="ml-1 capitalize">{tool.replace('_', ' ')}</span>
                        {currentStep?.agent === agent.id && currentStep?.tool === tool && (
                          <Loader className="ml-auto animate-spin" size={12} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Main area - Activity and Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Input area */}
          <div className={`p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-200`}>
            <div className="flex">
              <input
                type="text"
                className={`flex-1 px-4 py-2 rounded-l-lg focus:outline-none focus:ring-2 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                    : 'border border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter your research topic or question..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                disabled={isProcessing}
              />
              <button 
                className={`px-4 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isProcessing 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                onClick={startWorkflow}
                disabled={!isConnected || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Start Workflow'}
              </button>
            </div>
          </div>
          
          {/* Activity feed and Results */}
          <div className="flex-1 flex overflow-hidden">
            {/* Activity feed */}
            <div className={`w-1/2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-r flex flex-col transition-colors duration-200`}>
              <div className={`p-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex justify-between items-center`}>
                <h2 className="font-semibold">Activity</h2>
                <div className="text-xs opacity-70">
                  {logs.length > 0 && `${logs.length} events`}
                </div>
              </div>
              <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                {logs.map((log, index) => {
                  const agent = log.agent ? getAgent(log.agent) : null;
                  return (
                    <div key={index} className="flex items-start">
                      {agent && (
                        <div className={`${darkMode ? agent.darkColor : agent.color} w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                          {agent.icon}
                        </div>
                      )}
                      {!agent && log.action === 'workflow_complete' && (
                        <div className="bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                          <Terminal size={16} />
                        </div>
                      )}
                      {!agent && log.action === 'error' && (
                        <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                          <Terminal size={16} />
                        </div>
                      )}
                      <div className={`ml-2 rounded-lg p-2 text-sm flex-1 shadow-sm ${
                        darkMode 
                          ? 'bg-gray-800 border border-gray-700' 
                          : 'bg-white border border-gray-200'
                      }`}>
                        <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {agent ? agent.name : log.action === 'error' ? 'Error' : 'System'}
                          {log.tool && <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-2`}>using {log.tool.replace('_', ' ')}</span>}
                        </div>
                        <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{log.message}</div>
                      </div>
                    </div>
                  );
                })}
                {logs.length === 0 && (
                  <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-6`}>
                    Enter a prompt and start the workflow to see agent activity
                  </div>
                )}
              </div>
            </div>
            
            {/* Results area */}
            <div className="w-1/2 flex flex-col">
              <div className={`p-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex justify-between items-center`}>
                <h2 className="font-semibold">Results</h2>
                {workflowComplete && (
                  <button 
                    onClick={exportPDF} 
                    className={`flex items-center text-sm px-3 py-1 rounded ${
                      darkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Download size={14} className="mr-1" />
                    Export PDF
                  </button>
                )}
              </div>
              <div className={`flex-1 overflow-y-auto p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                {workflowComplete ? (
                  <div className={`prose ${darkMode ? 'prose-invert max-w-none' : 'max-w-none'}`}>
                    {finalOutput.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={i} className="text-2xl font-bold mt-2 mb-4">{line.substring(2)}</h1>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>;
                      } else if (line.startsWith('- ')) {
                        return <li key={i} className="ml-4">{line.substring(2)}</li>;
                      } else if (line.trim() === '') {
                        return <br key={i} />;
                      } else {
                        return <p key={i}>{line}</p>;
                      }
                    })}
                  </div>
                ) : (
                  <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-6`}>
                    {isProcessing ? 
                      <div className="flex flex-col items-center">
                        <Loader className={`animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-500'} mb-2`} size={24} />
                        <p>Workflow in progress...</p>
                      </div> :
                      <p>Results will appear here after workflow completion</p>
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiAgentWorkflow;
