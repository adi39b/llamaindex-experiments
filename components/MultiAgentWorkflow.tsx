import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal, FileText, Search, Check, Loader, Globe, Code, Edit, Download,
  Moon, Sun, ChevronRight, ChevronDown, Menu, FileIcon, ExternalLink, X,
  Home, Settings, Users, HelpCircle, BarChart2, Book
} from 'lucide-react';

export const MultiAgentWorkflow = () => {
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

  // New state for evidences section
  const [evidences, setEvidences] = useState([]);
  const [evidencesCollapsed, setEvidencesCollapsed] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // New state for navbar
  const [navbarCollapsed, setNavbarCollapsed] = useState(true);

  // WebSocket reference
  const wsRef = useRef(null);

  // Mock data for demonstration - in real implementation, would connect to backend
  const mockAgents = [
    { id: 'research', name: 'Research Agent', icon: <Search size={24} />, color: 'bg-blue-600', darkColor: 'bg-blue-500', tools: ['web_search', 'web_scraper'] },
    { id: 'writer', name: 'Writer Agent', icon: <Edit size={24} />, color: 'bg-emerald-600', darkColor: 'bg-emerald-500', tools: ['text_generator', 'summarizer'] },
    { id: 'reviewer', name: 'Review Agent', icon: <Check size={24} />, color: 'bg-purple-600', darkColor: 'bg-purple-500', tools: ['fact_checker', 'grammar_checker'] }
  ];

  // Mock evidences data for demonstration
  const mockEvidences = [
    { id: 1, type: 'document', title: 'Research Report on AI Ethics', source: 'Stanford University', content: '# AI Ethics Report\n\nThis document contains key findings regarding ethical considerations in AI development...\n\n## Key Principles\n\n- Transparency\n- Fairness\n- Privacy\n- Security\n\nAI systems should be designed with these principles in mind to ensure responsible deployment and usage.' },
    { id: 2, type: 'link', title: 'Latest Advances in LLMs', url: 'https://example.com/llm-advances', description: 'This academic paper discusses the most recent developments in Large Language Models and their implications for various domains.' },
    { id: 3, type: 'document', title: 'Multi-Agent Systems Overview', source: 'MIT Research', content: '# Multi-Agent Systems\n\nThis document provides an overview of multi-agent systems and their applications in solving complex problems.\n\n## Applications\n\n- Distributed problem solving\n- Resource allocation\n- Autonomous systems\n- Collaborative intelligence\n\nThe coordination mechanisms between agents form the foundation of effective multi-agent systems.' }
  ];

  const toolIcons = {
    web_search: <Globe size={16} />,
    web_scraper: <Code size={16} />,
    text_generator: <FileText size={16} />,
    summarizer: <FileText size={16} />,
    fact_checker: <Check size={16} />,
    grammar_checker: <Edit size={16} />
  };

  // Navigation items
  const navItems = [
    { id: 'home', name: 'Home', icon: <Home size={20} /> },
    { id: 'workflows', name: 'Workflows', icon: <BarChart2 size={20} /> },
    { id: 'agents', name: 'Agents', icon: <Users size={20} /> },
    { id: 'knowledge', name: 'Knowledge Base', icon: <Book size={20} /> },
    { id: 'settings', name: 'Settings', icon: <Settings size={20} /> },
    { id: 'help', name: 'Help', icon: <HelpCircle size={20} /> }
  ];

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

  // Load mock evidences on mount
  useEffect(() => {
    // In a real application, this would come from the backend
    setEvidences(mockEvidences);
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

        case 'evidence_found':
          // In a real implementation, would add evidence to the list
          // For demo, we just log it
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

  // Toggle evidences section
  const toggleEvidences = () => {
    setEvidencesCollapsed(!evidencesCollapsed);
  };

  // Toggle navbar
  const toggleNavbar = () => {
    setNavbarCollapsed(!navbarCollapsed);
  };

  // Select an evidence to display
  const showEvidence = (evidence) => {
    setSelectedEvidence(evidence);
  };

  // Close selected evidence
  const closeEvidence = () => {
    setSelectedEvidence(null);
  };

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      {/* Top Navbar */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-200`}>
        <div className="flex items-center">
          <button
            onClick={toggleNavbar}
            className={`p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-bold p-4">
            <Terminal className="inline mr-2" />
            AgentFlow Pro
          </h1>
          <div className="ml-auto flex items-center">
            <span className={`px-2 py-1 mx-2 text-xs rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <button
              onClick={toggleTheme}
              className={`p-2 mx-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Connection error message */}
      {connectionError && (
        <div className="px-4 py-2 bg-red-500 text-white">
          {connectionError}
        </div>
      )}

      {/* Main content with navbar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible navbar */}
        <div
          className={`transition-all duration-300 ${navbarCollapsed ? 'w-0 overflow-hidden' : 'w-64'} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}
        >
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className="font-bold">Main Navigation</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {navItems.map(item => (
              <div
                key={item.id}
                className={`flex items-center p-4 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} ${item.id === 'workflows' ? (darkMode ? 'bg-gray-700' : 'bg-gray-200') : ''
                  }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
                {item.id === 'workflows' && <ChevronRight className="ml-auto" size={16} />}
              </div>
            ))}
          </div>
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <div className="text-sm">AgentFlow Pro v1.2.0</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
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
                  className={`mb-2 p-3 rounded-lg transition-all ${activeAgents.includes(agent.id)
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
                          className={`flex items-center p-1 rounded ${currentStep?.agent === agent.id && currentStep?.tool === tool
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

          {/* Main area - Title Bar, Input, Activity and Results */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Title Bar */}
            <div className={`p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-200`}>
              <h2 className="text-lg font-semibold">Multi-Agent Workflow</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Orchestrate multiple AI agents to research, write, and review content automatically
              </p>
            </div>

            {/* Input area */}
            <div className={`p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-200`}>
              <div className="flex">
                <input
                  type="text"
                  className={`flex-1 px-4 py-2 rounded-l-lg focus:outline-none focus:ring-2 ${darkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                      : 'border border-gray-300 focus:ring-blue-500'
                    }`}
                  placeholder="Enter your research topic or question..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  disabled={isProcessing}
                />
                <button
                  className={`px-4 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isProcessing
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
              <div className={`w-1/3 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-r flex flex-col transition-colors duration-200`}>
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
                        <div className={`ml-2 rounded-lg p-2 text-sm flex-1 shadow-sm ${darkMode
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
              <div className="w-1/3 flex flex-col">
                <div className={`p-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex justify-between items-center`}>
                  <h2 className="font-semibold">Results</h2>
                  {workflowComplete && (
                    <button
                      onClick={exportPDF}
                      className={`flex items-center text-sm px-3 py-1 rounded ${darkMode
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

              {/* Evidences section */}
              <div className={`transition-all duration-300 ${evidencesCollapsed ? 'w-12' : 'w-1/3'} ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-l flex flex-col`}>
                <div className={`p-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex justify-between items-center`}>
                  {!evidencesCollapsed && <h2 className="font-semibold">Evidences</h2>}
                  <button
                    onClick={toggleEvidences}
                    className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                  >
                    {evidencesCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
                <div className={`flex-1 overflow-y-auto p-2 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  {!evidencesCollapsed ? (
                    <>
                      {evidences.length > 0 ? (
                        <div className="space-y-2">
                          {evidences.map(evidence => (
                            <div
                              key={evidence.id}
                              onClick={() => showEvidence(evidence)}
                              className={`p-3 rounded-lg cursor-pointer transition-all ${darkMode
                                  ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                                  : 'bg-white hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                              <div className="flex items-center">
                                {evidence.type === 'document' ? (
                                  <FileText className={darkMode ? 'text-blue-400' : 'text-blue-500'} size={18} />
                                ) : (
                                  <ExternalLink className={darkMode ? 'text-green-400' : 'text-green-500'} size={18} />
                                )}
                                <div className="ml-2 flex-1">
                                  <div className="font-medium">{evidence.title}</div>
                                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {evidence.type === 'document' ? evidence.source : 'External Link'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-6`}>
                          No evidences found for this workflow
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-center">
                      <FileIcon size={20} />
                    </div>
                  )}
                </div>

                {/* Evidence viewer modal */}
                {selectedEvidence && (
                  <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50`}>
                    <div className={`relative max-w-2xl w-full max-h-screen overflow-hidden rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className="font-bold">{selectedEvidence.title}</h3>
                        <button
                          onClick={closeEvidence}
                          className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className={`p-4 overflow-y-auto max-h-96`}>
                        {selectedEvidence.type === 'document' ? (
                          <div className={`prose ${darkMode ? 'prose-invert' : ''}`}>
                            {selectedEvidence.content.split('\n').map((line, i) => {
                              if (line.startsWith('# ')) {
                                return <h1 key={i} className="text-2xl font-bold">{line.substring(2)}</h1>;
                              } else if (line.startsWith('## ')) {
                                return <h2 key={i} className="text-xl font-bold">{line.substring(3)}</h2>;
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
                          <div>
                            <p className="mb-4">{selectedEvidence.description}</p>
                            <a
                              href={selectedEvidence.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center px-4 py-2 rounded ${darkMode
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                              <ExternalLink size={16} className="mr-2" />
                              Visit Link
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
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

