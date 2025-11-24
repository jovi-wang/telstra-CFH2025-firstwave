import {
  Send,
  Bot,
  User,
  Wrench,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendMessage } from '../services/backendAPI';
import type { StreamEvent } from '../services/backendAPI';
import eventStreamService from '../services/eventStreamService';
import type { SystemEvent } from '../services/eventStreamService';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage } from '../store/chatStore';
import { useSystemStatusStore } from '../store/systemStatusStore';
import type { Subscription } from '../store/subscriptionsStore';
import {
  isSlashCommand,
  executeSlashCommand,
  getAvailableSlashCommands,
} from '../utils/slashCommands';

interface AIAssistantChatbotProps {
  onMoveMap?: (address: string, lat: number, lon: number) => void;
  onAddDroneKitMarker?: (lat: number, lon: number) => void;
  onAddEdgeNodeMarker?: (lat: number, lon: number, name: string) => void;
  onUpdateEdgeDeployment?: (
    deploymentId: string,
    imageId: string,
    zoneName: string,
    status: string
  ) => void;
  onClearEdgeDeployment?: () => void;
  onAddGeofencingCircle?: (lat: number, lon: number, radius: number) => void;
  onAddSubscription?: (subscription: Subscription) => void;
  onRemoveSubscription?: (subscriptionId: string) => void;
  onResetDashboard?: () => void;
  droneKitLocation?: { lat: number; lon: number } | null;
  incidentLocation?: { lat: number; lon: number; address: string } | null;
  baseLocation?: { lat: number; lon: number; name: string } | null;
}

const AIAssistantChatbot = ({
  onMoveMap,
  onAddDroneKitMarker,
  onAddEdgeNodeMarker,
  onUpdateEdgeDeployment,
  onClearEdgeDeployment,
  onAddGeofencingCircle,
  onAddSubscription,
  onRemoveSubscription,
  onResetDashboard,
  droneKitLocation,
  incidentLocation,
  baseLocation,
}: AIAssistantChatbotProps) => {
  // Use Zustand store for chat state
  const messages = useChatStore((state) => state.messages);
  const conversationId = useChatStore((state) => state.conversationId);
  const isTyping = useChatStore((state) => state.isTyping);
  const collapsedTools = useChatStore((state) => state.collapsedTools);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateOrAddAssistantMessage = useChatStore(
    (state) => state.updateOrAddAssistantMessage
  );
  const setConversationId = useChatStore((state) => state.setConversationId);
  const setIsTyping = useChatStore((state) => state.setIsTyping);
  const toggleToolCollapse = useChatStore((state) => state.toggleToolCollapse);
  const clearChat = useChatStore((state) => state.clearChat);

  // Get system status update actions
  const setDroneActive = useSystemStatusStore((state) => state.setDroneActive);
  const setStreamActive = useSystemStatusStore(
    (state) => state.setStreamActive
  );
  const setEdgeProcessing = useSystemStatusStore(
    (state) => state.setEdgeProcessing
  );
  const setSessionId = useSystemStatusStore((state) => state.setSessionId);
  const setCurrentQoSProfile = useSystemStatusStore(
    (state) => state.setCurrentQoSProfile
  );
  const setQodSessionId = useSystemStatusStore(
    (state) => state.setQodSessionId
  );
  const resetAllStatuses = useSystemStatusStore(
    (state) => state.resetAllStatuses
  );

  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [inputValue]);

  // Handle input change with suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Show suggestions only if the input starts with '/' and we haven't finished typing the command
    // Don't show suggestions if there are parameters after the command (indicated by a space)
    let showSuggestions = false;
    if (value.startsWith('/')) {
      // Check if the value contains a space after the command part
      // If there's no space after the '/', show suggestions (still typing command)
      // If there's a space after the '/', don't show suggestions (parameters entered)
      const firstSpaceIndex = value.indexOf(' ');
      showSuggestions = firstSpaceIndex === -1; // No space found, still typing command
    }

    setShowSuggestions(showSuggestions);
  };

  // Helper to generate unique key for tool call
  const getToolKey = (messageIndex: number, toolIndex: number) =>
    `${messageIndex}-${toolIndex}`;

  // Common event handling logic for both regular messages and slash commands
  const handleStreamEvent = (
    event: StreamEvent,
    assistantMessage: ChatMessage,
    currentToolCall: {
      tool: string;
      arguments: Record<string, unknown>;
      result?: unknown;
    } | null
  ) => {
    try {
      if (event.type === 'message_start') {
        // Set conversation ID from backend
        setConversationId(event.data.conversation_id);
      } else if (event.type === 'content_delta') {
        // Stream text content
        assistantMessage.content += event.data.content;

        // Update message in real-time
        updateOrAddAssistantMessage({ ...assistantMessage });
      } else if (event.type === 'tool_call') {
        // Tool being called
        currentToolCall = {
          tool: event.data.tool || 'unknown',
          arguments: event.data.arguments || {},
        };

        if (!assistantMessage.toolCalls) {
          assistantMessage.toolCalls = [];
        }
        assistantMessage.toolCalls.push(currentToolCall);

        // Update UI to show tool call
        updateOrAddAssistantMessage({ ...assistantMessage });
      } else if (event.type === 'tool_result') {
        // Tool execution result
        if (currentToolCall && currentToolCall.tool === event.data.tool) {
          currentToolCall.result = event.data.result;
        }

        // Update tool call with result
        const toolCall = assistantMessage.toolCalls?.find(
          (tc) => tc.tool === event.data.tool
        );
        if (toolCall) {
          toolCall.result = event.data.result;
        }

        // Check if this is geocode_address tool and move map
        if (
          event.data.tool === 'geocode_address' &&
          onMoveMap &&
          event.data.result
        ) {
          const result = event.data.result as any;
          if (result.latitude && result.longitude && !result.error) {
            onMoveMap(
              result.address || result.display_name,
              result.latitude,
              result.longitude
            );
          }
        }

        // Check if this is verify_location tool and add drone kit marker
        if (event.data.tool === 'verify_location' && event.data.result) {
          const result = event.data.result as any;
          if (result.verificationResult === 'TRUE') {
            // Set drone active status
            setDroneActive(true);

            // Get coordinates from the current tool call arguments
            const toolCall = assistantMessage.toolCalls?.find(
              (tc) => tc.tool === 'verify_location'
            );
            if (toolCall && toolCall.arguments) {
              const { latitude, longitude } = toolCall.arguments;
              if (latitude && longitude) {
                // Add drone kit marker (also sets location for heatmap)
                if (onAddDroneKitMarker) {
                  onAddDroneKitMarker(latitude as number, longitude as number);
                }
              }
            }
          }
        }

        // Check if this is discover_edge_node tool and add edge node marker
        if (
          event.data.tool === 'discover_edge_node' &&
          onAddEdgeNodeMarker &&
          event.data.result
        ) {
          const result = event.data.result as any;
          if (result.edgeCloudZoneName && !result.error) {
            // Determine reference location: droneKitLocation > incidentLocation > baseLocation
            let refLocation = null;

            if (droneKitLocation) {
              refLocation = droneKitLocation;
            } else if (incidentLocation) {
              refLocation = incidentLocation;
            } else if (baseLocation) {
              refLocation = baseLocation;
            }

            if (refLocation) {
              const edgeLat = refLocation.lat + 0.01; // North
              const edgeLon = refLocation.lon - 0.01; // West
              onAddEdgeNodeMarker(edgeLat, edgeLon, result.edgeCloudZoneName);
            }
          }
        }

        // Check if this is deploy_edge_application tool and update deployment info
        if (
          event.data.tool === 'deploy_edge_application' &&
          onUpdateEdgeDeployment &&
          event.data.result
        ) {
          const result = event.data.result as any;
          if (result.deployment_id && result.status && !result.error) {
            onUpdateEdgeDeployment(
              result.deployment_id,
              result.image_id,
              result.edge_zone_name,
              result.status
            );
          }
        }

        // Check if this is undeploy_edge_application tool and clear deployment
        if (
          event.data.tool === 'undeploy_edge_application' &&
          event.data.result !== undefined
        ) {
          // Get deployment_id from the matching tool call in assistantMessage
          const toolCall = assistantMessage.toolCalls?.find(
            (tc) => tc.tool === 'undeploy_edge_application'
          );
          if (toolCall && toolCall.arguments) {
            const deploymentId = (toolCall.arguments as any).deployment_id;
            if (deploymentId && onClearEdgeDeployment) {
              onClearEdgeDeployment();
            }
          }
        }

        // Check if this is subscribe_geofencing tool and add geofencing circle
        if (event.data.tool === 'subscribe_geofencing' && event.data.result) {
          const result = event.data.result as any;
          if (
            result.subscription_id &&
            result.latitude &&
            result.longitude &&
            result.radius &&
            !result.error
          ) {
            // Add geofencing circle to map
            if (onAddGeofencingCircle) {
              onAddGeofencingCircle(
                result.latitude,
                result.longitude,
                result.radius
              );
            }

            // Add subscription to active subscriptions list
            if (onAddSubscription) {
              const subscription: Subscription = {
                id: result.subscription_id,
                type: 'Geofencing',
                deviceId: result.device_id || 'unknown',
                createdAt: new Date().toISOString(),
                parameters: {
                  latitude: result.latitude,
                  longitude: result.longitude,
                  radius: result.radius,
                },
              };
              onAddSubscription(subscription);
            }
          }
        }

        // Check if this is unsubscribe_geofencing tool and remove subscription
        if (
          event.data.tool === 'unsubscribe_geofencing' &&
          event.data.result !== undefined
        ) {
          // Get subscription_id from the matching tool call in assistantMessage
          const toolCall = assistantMessage.toolCalls?.find(
            (tc) => tc.tool === 'unsubscribe_geofencing'
          );
          if (toolCall && toolCall.arguments) {
            const subscriptionId = (toolCall.arguments as any).subscription_id;
            if (subscriptionId && onRemoveSubscription) {
              onRemoveSubscription(subscriptionId as string);
            }
          }
        }

        // Check if this is subscribe_connected_network tool and add subscription
        if (
          event.data.tool === 'subscribe_connected_network' &&
          event.data.result
        ) {
          const result = event.data.result as any;
          if (result.subscription_id && result.device_id && !result.error) {
            // Add subscription to active subscriptions list
            if (onAddSubscription) {
              const subscription: Subscription = {
                id: result.subscription_id,
                type: 'Network Type & Reachability',
                deviceId: result.device_id,
                createdAt: new Date().toISOString(),
              };
              onAddSubscription(subscription);
            }
          }
        }

        // Check if this is unsubscribe_connected_network tool and remove subscription
        if (
          event.data.tool === 'unsubscribe_connected_network' &&
          event.data.result !== undefined
        ) {
          // Get subscription_id from the matching tool call in assistantMessage
          const toolCall = assistantMessage.toolCalls?.find(
            (tc) => tc.tool === 'unsubscribe_connected_network'
          );
          if (toolCall && toolCall.arguments) {
            const subscriptionId = (toolCall.arguments as any).subscription_id;
            if (subscriptionId && onRemoveSubscription) {
              onRemoveSubscription(subscriptionId as string);
            }
          }
        }

        // Check if this is handle_webrtc_call tool and update stream/edge status
        if (
          event.data.tool === 'handle_webrtc_call' &&
          event.data.result !== undefined
        ) {
          // Get type parameter from tool arguments
          const toolCall = assistantMessage.toolCalls?.find(
            (tc) => tc.tool === 'handle_webrtc_call'
          );
          if (toolCall && toolCall.arguments) {
            const { type } = toolCall.arguments as any;
            const result = event.data.result as any;

            if (
              type === 'accept_media_session' &&
              result &&
              result.sdp &&
              !result.error
            ) {
              // Activate stream and edge processing
              setStreamActive(true);
              setTimeout(() => {
                setEdgeProcessing(true);
              }, 30 * 1000);
              // Store session ID
              if (result.session_id) {
                setSessionId(result.session_id);
              }
            } else if (type === 'cancel_media_session') {
              // Deactivate stream and edge processing
              setStreamActive(false);
              setEdgeProcessing(false);
              // Clear session ID
              setSessionId(null);
            }
          }
        }

        // Check if this is create_quality_on_demand tool and update QoS profile
        if (
          event.data.tool === 'create_quality_on_demand' &&
          event.data.result !== undefined
        ) {
          const result = event.data.result as any;
          if (
            result &&
            result.qos_profile &&
            result.status === 'active' &&
            !result.error
          ) {
            // Update QoS profile in store
            setCurrentQoSProfile(result.qos_profile);
            // Store QoD session ID
            if (result.session_id) {
              setQodSessionId(result.session_id);
            }
            console.log(`QoS profile updated to: ${result.qos_profile}`);
            console.log(`QoD session ID: ${result.session_id}`);
          }
        }

        // Update UI
        updateOrAddAssistantMessage({ ...assistantMessage });
      } else if (event.type === 'tool_error') {
        // Tool execution error
        if (currentToolCall) {
          currentToolCall.result = {
            error: event.data.error || 'Tool execution failed',
          };
        }
      } else if (event.type === 'mission_complete') {
        // Mission completion - reset all dashboard state after 2 second delay
        console.log(
          '🎯 Mission complete event received - resetting dashboard in 2 seconds'
        );

        // Keep typing indicator active for 2 seconds
        setIsTyping(true);

        // Wait 2 seconds before resetting
        setTimeout(() => {
          // Reset all system statuses
          resetAllStatuses();

          // Clear chat history
          clearChat();

          // Reset dashboard via parent callback
          if (onResetDashboard) {
            onResetDashboard();
          }

          setIsTyping(false);
        }, 2000);
      } else if (event.type === 'message_complete') {
        // Message streaming complete
        setIsTyping(false);
      } else if (event.type === 'error') {
        // Error occurred
        setIsTyping(false);

        // Show error message
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Sorry, an error occurred: ${event.data.error}`,
          timestamp: new Date().toISOString(),
        };
        addMessage(errorMessage);
      }
    } catch (eventError) {
      console.error('Error processing event:', eventError);
      setIsTyping(false);
    }
  };

  // Common function to process messages (for both slash commands and regular messages)
  const processMessage = async (message: string, userMessage: ChatMessage) => {
    // Add user message
    addMessage(userMessage);

    // Reset input and set typing indicator
    setInputValue('');
    setIsTyping(true);

    // Prepare assistant message for streaming
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      toolCalls: [],
    };

    // Track current tool being called
    const currentToolCall: {
      tool: string;
      arguments: Record<string, unknown>;
      result?: unknown;
    } | null = null;

    try {
      await sendMessage(message, conversationId, (event: StreamEvent) => {
        handleStreamEvent(event, assistantMessage, currentToolCall);
      });
    } catch (error) {
      console.error('Failed to send message to backend:', error);
      setIsTyping(false);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content:
          'Sorry, I encountered an error. Please make sure the backend server is running on port 4000.',
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMessage);
    }
  };

  // Subscribe to system events
  useEffect(() => {
    const handleSystemEvent = (event: SystemEvent) => {
      // Format event message
      let eventMessage = '';
      let eventIcon = '';

      switch (event.event_type) {
        case 'geofence':
          eventIcon = '⚠️';
          eventMessage = 'Geofence boundary breach detected';
          break;
        case 'connected_network_type':
          eventIcon = '📶';
          eventMessage = 'Device connected network type changed from 5G to 4G';
          break;
        case 'device_reachability':
          eventIcon = '📡';
          eventMessage = 'Device reachability changed from true to false';
          break;
        case 'connectivity_insight':
          eventIcon = '⚡';
          eventMessage = 'Video streaming connectivity QoS breached';
          break;
        case 'incoming_webrtc':
          eventIcon = '📞';
          eventMessage = 'Incoming WebRTC call from drone-001';
          break;
        case 'region_device_count':
          // Skip region device count events - they're shown on the map
          return;
        default:
          eventIcon = 'ℹ️';
          eventMessage = 'System notification';
      }

      // Add system message to chat
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `${eventIcon} ${eventMessage}`,
        timestamp: event.timestamp,
        systemEvent: event,
      };

      addMessage(systemMessage);
    };

    // Subscribe to all events
    eventStreamService.on('all', handleSystemEvent);

    return () => {
      eventStreamService.off('all', handleSystemEvent);
    };
  }, [addMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    // Check if this is a slash command
    if (isSlashCommand(inputValue)) {
      const message = executeSlashCommand(inputValue);
      // Create user message showing the command
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      await processMessage(message, userMessage);
    } else {
      const userMessage: ChatMessage = {
        role: 'user',
        content: inputValue,
        timestamp: new Date().toISOString(),
      };
      // Regular message handling use user inputs
      await processMessage(inputValue, userMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Extract the filter text from the input (text after the '/')
    const filterText = inputValue.startsWith('/')
      ? inputValue.substring(1)
      : '';
    const commands = showSuggestions
      ? getAvailableSlashCommands(filterText)
      : [];

    if (e.key === 'Enter' && !e.shiftKey) {
      if (showSuggestions && suggestionIndex >= 0 && commands.length > 0) {
        // Use the currently highlighted suggestion instead of sending
        e.preventDefault();
        const selected = commands[suggestionIndex];
        if (selected) {
          setInputValue(`/${selected.name} `);
          setShowSuggestions(false);
          setSuggestionIndex(-1);
        }
      } else {
        e.preventDefault();
        handleSend();
      }
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setSuggestionIndex((prev) => (prev < commands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setSuggestionIndex((prev) => (prev > 0 ? prev - 1 : commands.length - 1));
    } else if (e.key === 'Escape' && showSuggestions) {
      e.preventDefault();
      setShowSuggestions(false);
      setSuggestionIndex(-1);
    }
  };

  return (
    <div className='h-full flex flex-col' style={{ maxHeight: '100%' }}>
      <div className='p-4 pb-2 flex-shrink-0'>
        <h2 className='text-xl font-semibold flex items-center space-x-2'>
          <Bot className='w-5 h-5 text-primary' />
          <span>AI Agent Assistant</span>
        </h2>
      </div>

      {/* Chat History - Fixed height with scroll */}
      <div
        className='flex-1 overflow-y-auto px-4 py-2 space-y-3'
        style={{
          scrollbarGutter: 'stable',
          minHeight: 0,
          maxHeight: '100%',
          overflowY: 'scroll',
        }}
      >
        {messages && messages.length > 0 ? (
          messages.map((message, index) => {
            // Safety check for each message
            if (!message) {
              return null;
            }

            return (
              <div
                key={index}
                className={`flex items-start space-x-3 ${
                  message.role === 'user'
                    ? 'flex-row-reverse space-x-reverse'
                    : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-primary'
                      : message.role === 'system'
                      ? 'bg-warning'
                      : 'bg-geofence'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className='w-4 h-4' />
                  ) : message.role === 'system' ? (
                    <AlertCircle className='w-4 h-4' />
                  ) : (
                    <Bot className='w-4 h-4' />
                  )}
                </div>

                {/* Message Content - Dynamic width based on content */}
                <div className='flex flex-col max-w-[80%]'>
                  <div
                    className={`p-3 rounded-lg w-fit ${
                      message.role === 'user'
                        ? 'bg-primary bg-opacity-20 self-end'
                        : message.role === 'system'
                        ? 'bg-warning bg-opacity-20 border-l-4 border-warning self-start'
                        : 'bg-background self-start'
                    }`}
                  >
                    <div className='text-base break-words prose prose-invert prose-sm max-w-none'>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className='mb-2 last:mb-0'>{children}</p>
                          ),
                          strong: ({ children }) => (
                            <strong className='font-bold text-primary'>
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className='italic text-gray-300'>{children}</em>
                          ),
                          code: ({ children }) => (
                            <code className='bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono'>
                              {children}
                            </code>
                          ),
                          ul: ({ children }) => (
                            <ul className='list-disc list-inside mb-2'>
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className='list-decimal list-inside mb-2'>
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className='mb-1'>{children}</li>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Tool Calls - Enhanced UI */}
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className='mt-3 pt-3 border-t border-gray-700 space-y-3'>
                        {message.toolCalls.map((tool, toolIndex) => {
                          // Safety check
                          if (!tool || !tool.tool) {
                            return null;
                          }

                          const hasResult = !!tool.result;
                          const hasError =
                            hasResult &&
                            tool.result &&
                            (tool.result as any).error;
                          const toolKey = getToolKey(index, toolIndex);
                          const isCollapsed = collapsedTools.has(toolKey);

                          return (
                            <div
                              key={toolIndex}
                              className='bg-gradient-to-br from-surface to-background p-3 rounded-lg border border-gray-700 shadow-sm'
                            >
                              {/* Tool header with status */}
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center space-x-2'>
                                  <div className='p-1.5 bg-purple-900 bg-opacity-50 rounded'>
                                    <Wrench className='w-3.5 h-3.5 text-purple-400' />
                                  </div>
                                  <div>
                                    <div className='text-gray-200 font-semibold text-sm'>
                                      {tool.tool}
                                    </div>
                                    <div className='text-gray-500 text-xs'>
                                      CAMARA API MCP Tool
                                    </div>
                                  </div>
                                </div>

                                <div className='flex items-center space-x-2'>
                                  {/* Status badge */}
                                  {hasResult ? (
                                    hasError ? (
                                      <span className='px-2 py-0.5 bg-gray-800 border border-red-500 text-red-400 rounded-full text-xs font-semibold flex items-center space-x-1'>
                                        <span>●</span>
                                        <span>FAILED</span>
                                      </span>
                                    ) : (
                                      <span className='px-2 py-0.5 bg-gray-700 text-success rounded-full text-xs font-semibold flex items-center space-x-1'>
                                        <CheckCircle2 className='w-3 h-3' />
                                        <span>SUCCESS</span>
                                      </span>
                                    )
                                  ) : (
                                    <span className='px-2 py-0.5 bg-gray-700 text-warning rounded-full text-xs font-semibold flex items-center space-x-1'>
                                      <Loader2 className='w-3 h-3 animate-spin' />
                                      <span>CALLING</span>
                                    </span>
                                  )}

                                  {/* Collapse/Expand button */}
                                  <button
                                    onClick={() =>
                                      toggleToolCollapse(index, toolIndex)
                                    }
                                    className='p-1 hover:bg-gray-700 rounded transition-colors'
                                    aria-label={
                                      isCollapsed ? 'Expand' : 'Collapse'
                                    }
                                  >
                                    {isCollapsed ? (
                                      <ChevronDown className='w-4 h-4 text-gray-400' />
                                    ) : (
                                      <ChevronUp className='w-4 h-4 text-gray-400' />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Collapsible content */}
                              {!isCollapsed && (
                                <div className='mt-3'>
                                  {/* Tool arguments - Key-value display */}
                                  {tool.arguments &&
                                    Object.keys(tool.arguments).length > 0 && (
                                      <div className='mb-3'>
                                        <div className='text-sm text-gray-400 font-semibold mb-2 flex items-center space-x-1'>
                                          <span>Parameters</span>
                                        </div>
                                        <div className='bg-background rounded p-2 space-y-1'>
                                          {Object.entries(tool.arguments).map(
                                            ([key, value]) => (
                                              <div
                                                key={key}
                                                className='flex items-start space-x-2 text-sm'
                                              >
                                                <span className='text-gray-300 font-mono'>
                                                  {key}:
                                                </span>
                                                <span className='text-gray-400 font-mono flex-1'>
                                                  {typeof value === 'object'
                                                    ? JSON.stringify(value)
                                                    : String(value)}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Tool result - Formatted display */}
                                  {hasResult && !hasError && (
                                    <div>
                                      <div className='text-sm text-gray-400 font-semibold mb-2 flex items-center space-x-1'>
                                        <CheckCircle2 className='w-3 h-3 text-gray-400' />
                                        <span>Response</span>
                                      </div>
                                      <div className='bg-background rounded p-2 max-h-48 overflow-y-auto'>
                                        {/* Format result as key-value pairs if it's an object */}
                                        {typeof tool.result === 'object' &&
                                        tool.result !== null &&
                                        !Array.isArray(tool.result) ? (
                                          <div className='space-y-1.5'>
                                            {Object.entries(
                                              tool.result as Record<
                                                string,
                                                unknown
                                              >
                                            ).map(([key, value]) => (
                                              <div
                                                key={key}
                                                className='flex items-start space-x-2 text-sm'
                                              >
                                                <span className='text-gray-300 font-mono min-w-[100px]'>
                                                  {key}:
                                                </span>
                                                <span className='text-gray-400 font-mono flex-1'>
                                                  {typeof value === 'object'
                                                    ? JSON.stringify(
                                                        value,
                                                        null,
                                                        2
                                                      )
                                                    : String(value)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <pre className='text-sm text-gray-300 font-mono whitespace-pre-wrap'>
                                            {JSON.stringify(
                                              tool.result,
                                              null,
                                              2
                                            )}
                                          </pre>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Error display */}
                                  {hasError && (
                                    <div>
                                      <div className='text-sm text-red-400 font-semibold mb-2 flex items-center space-x-1'>
                                        <span>●</span>
                                        <span>Error</span>
                                      </div>
                                      <div className='bg-gray-900 border-l-4 border-red-500 rounded p-3'>
                                        <p className='text-sm text-red-300 font-mono break-words'>
                                          {(tool.result as any).error}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div
                    className={`text-sm text-gray-500 mt-1 px-1 ${
                      message.role === 'user' ? 'self-end' : 'self-start'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className='text-gray-400 text-center p-4'>No messages yet</div>
        )}

        {/* Typing Indicator - Only show if no assistant message is being streamed */}
        {isTyping &&
          messages.length > 0 &&
          messages[messages.length - 1]?.role !== 'assistant' && (
            <div className='flex items-start space-x-3'>
              <div className='flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-geofence'>
                <Bot className='w-4 h-4' />
              </div>
              <div className='bg-background p-3 rounded-lg'>
                <div className='flex space-x-1'>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                  <div
                    className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}

        {/* Scroll anchor */}
        <div ref={chatEndRef} />
      </div>

      {/* Bottom Section - Fixed at bottom */}
      <div className='flex-shrink-0 px-4 pb-4'>
        {/* Input Field - Changed to textarea to support scrolling for long placeholder text */}
        <div className='flex items-center space-x-2'>
          <div className='relative flex-1'>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isTyping
                  ? 'AI assistant is responding...'
                  : 'Ask about network status, drone location, devices count...'
              }
              className='w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-base focus:outline-none focus:border-primary transition-colors resize-none'
              rows={1}
              style={{ minHeight: '44px', maxHeight: '150px' }}
              disabled={isTyping}
            />

            {/* Slash command suggestions */}
            {showSuggestions && (
              <div className='absolute bottom-full mb-2 left-0 right-0 bg-background border border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto'>
                {(() => {
                  // Extract the filter text from the input (text after the '/')
                  const filterText = inputValue.startsWith('/')
                    ? inputValue.substring(1)
                    : '';
                  const commands = getAvailableSlashCommands(filterText);

                  return commands.map((cmd, index) => (
                    <div
                      key={cmd.name}
                      className={`p-3 cursor-pointer hover:bg-gray-700 ${
                        index === suggestionIndex ? 'bg-gray-700' : ''
                      }`}
                      onClick={() => {
                        setInputValue(`/${cmd.name} `);
                        setShowSuggestions(false);
                        setSuggestionIndex(-1);
                        textareaRef.current?.focus();
                      }}
                    >
                      <div className='font-semibold text-primary'>
                        /{cmd.name}
                      </div>
                      <div className='text-xs text-gray-300 leading-snug'>
                        {cmd.description}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className='bg-primary hover:bg-blue-600 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Send className='w-5 h-5' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantChatbot;
