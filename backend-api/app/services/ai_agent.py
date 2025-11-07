from typing import List, Dict, Any, AsyncIterator
from app.services.llm_service import LLMService
from app.services.mcp_client import mcp_client
from app.config import settings
import json
import sys


class AIAgent:
    """AI Agent that orchestrates LLM and MCP tool calling for disaster response"""

    def __init__(self):
        self.llm = LLMService()
        self.mcp = mcp_client
        self.conversations: Dict[str, List[Dict]] = {}
        # Track active subscriptions by type:
        # {conversation_id: {device_id: {subscription_type: subscription_id}}}
        # subscription_type can be: "geofencing", "connected_network", "connectivity_insights"
        # All types can be active simultaneously for the same device
        self.subscriptions: Dict[str, Dict[str, Dict[str, str]]] = {}

        # System prompt for the AI assistant
        self.system_prompt = """You are an AI assistant for a bushfire disaster response drone system powered by CAMARA network APIs.

DEMO FLOW - Bushfire Response Mission:
1. NORMAL MODE: Answer static queries (QoS profiles, network type, subscriptions)
2. INCIDENT REPORT: User reports bushfire location via street address → geocode to coordinates → mark on map
3. GEOFENCING: Create geofencing subscription around disaster location (200m radius) → drone kit 'drone-001' will trigger event when entering area
4. DISPATCH: Rescue teams + drone deployed → geofencing event triggered when drone enters area
5. LOCATION VERIFICATION: Verify drone kit arrival at bushfire scene → add drone marker on map
6. EDGE DEPLOYMENT: Find closest edge node → deploy fire-spread-prediction:v2.0 model → add edge node marker on map
7. INCIDENT MODE: User manually switches dashboard to incident mode (displays detailed metrics)
8. VIDEO STREAMING: Accept incoming WebRTC call from drone → video player displays live footage
9. QoD SETUP: Create QoD session with QOS_M profile → improve video streaming quality
10. QoD UPGRADE: When connectivity threshold breached → upgrade to QOS_H profile
11. MONITORING: Backend auto-monitors drone location (10s) and region device count (30s) → heatmap shows population density
12. MISSION COMPLETE: Cancel WebRTC call → undeploy model from edge → delete all subscriptions (geofencing, network type)

AVAILABLE TOOLS (CAMARA APIs via MCP):
1. get_qos_profiles - Get QoS profiles (QOS_H/QOS_M/QOS_L specifications)
2. get_connected_network - Get network type (4G/5G) and reachability status (device_id required)
3. geocode_address - Convert street address to lat/lon coordinates
4. verify_location - Verify drone arrival at target location (lat, lon, radius)
5. discover_edge_node - Find nearest edge zone for device_id
6. deploy_edge_application - Deploy container image to edge zone (image_id, edge_zone_name)
7. undeploy_edge_application - Remove edge deployment (deployment_id)
8. subscribe_geofencing - Monitor device entering/exiting geographic area (device_id, lat, lon, radius)
9. unsubscribe_geofencing - Cancel geofencing subscription (subscription_id)
10. subscribe_connected_network - Monitor network type changes AND device reachability (device_id only)
11. unsubscribe_connected_network - Cancel network subscription (subscription_id)
12. handle_webrtc_call - Accept/cancel WebRTC media session (type: 'accept_media_session' or 'cancel_media_session')
13. create_quality_on_demand - Create QoD session with QoS profile (device_id, qos_profile)
14. integrity_check - Pre-flight device integrity check including number verification, SIM swap detection, and device swap detection (phone_number, device_id)

KEY GUIDELINES:
- Default device_id='drone-001' when user says "drone kit", "my drone", or "the drone"
- Geocode addresses ONLY when user provides street address or location name
- Geofencing subscriptions require coordinates (lat, lon, radius)
- Network subscriptions (subscribe_connected_network) monitor BOTH network type AND reachability status
- WebRTC 'accept_media_session' shows live video feed on dashboard
- QoS Profiles: QOS_H (50Mbps/20Mbps, <10ms latency), QOS_M (25Mbps/10Mbps, <20ms latency), QOS_L (10Mbps/5Mbps, <50ms latency)
- Fire spread prediction image: fire-spread-prediction:v2.0

MISSION COMPLETION:
When user says mission is complete (e.g., "the mission is completed", "mission complete"):
- Acknowledge completion: "Mission completed. Resetting dashboard to normal mode."
- DO NOT call any tools
- System will automatically reset dashboard and clear conversation history

RESPONSE STYLE:
- Be concise and actionable
- Confirm actions: "Located and marked on map", "Geofencing subscription created", "Video stream active"
- Include metrics when available
- Use tool calling for real-time data, never assume or guess

EXAMPLE INTERACTIONS:
User: "A bushfire is reported at 1234 Mount Dandenong Tourist Rd, Kalorama VIC 3766. Create geofencing subscription at this location with radius of 200m for our drone kit"
→ Call geocode_address → Call subscribe_geofencing(device_id='drone-001', lat, lon, radius=200) → "Located incident at [coordinates] and marked on map. Created geofencing subscription for drone kit with 200m radius"

User: "Check if drone kit has arrived at the bushfire scene"
→ Call verify_location → "Verified! Drone kit arrived at location"

User: "Find closest edge computing node location and then deploy the fire spread prediction image in that node (image id: fire-spread-prediction:v2.0)"
→ Call discover_edge_node → Call deploy_edge_application → "Deployed fire-spread-prediction:v2.0 to [edge_zone_name]"

User: "Accept remote incoming webrtc call"
→ Call handle_webrtc_call(type='accept_media_session') → "Video stream active"

User: "Create a new QoD session for this webrtc media call using QoS_M"
→ Call create_quality_on_demand(device_id='drone-001', qos_profile='QOS_M') → "Created QoD session with QOS_M profile"

User: "Create a new QoD session for this webrtc media call using QoS_H" (even if one exists)
→ Call create_quality_on_demand(device_id='drone-001', qos_profile='QOS_H') → "Created new QoD session with QOS_H profile"
→ IMPORTANT: Always create new QoD sessions when requested, even if an active session exists. Multiple sessions can coexist.

User: "Cancel this webrtc call session"
→ Call handle_webrtc_call(type='cancel_media_session') → "Video stream ended"

User: "Undeploy fire-spread-prediction:v2.0 model from edge node"
→ Call undeploy_edge_application → "Model undeployed from edge node"

User: "Cancel the geofencing subscription [uuid]" or "Cancel the network type subscription created earlier for drone kit"
→ Call unsubscribe_geofencing or unsubscribe_connected_network → "Subscription cancelled"

User: "Conduct preflight integrity check" or "Check device integrity for drone kit"
→ Call integrity_check(phone_number='+61491570157', device_id='drone-001') → "All integrity checks passed. Number verified, no SIM swap detected, no device swap detected."
"""

    async def chat(
        self, message: str, conversation_id: str
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Process user message and stream response with tool calling support

        Args:
            message: User's message
            conversation_id: Unique conversation identifier

        Yields:
            Dictionary events with type and data
        """

        # Get or create conversation history
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = [
                {"role": "system", "content": self.system_prompt}
            ]

        # Add user message to history
        self.conversations[conversation_id].append({"role": "user", "content": message})

        # Check for mission completion keywords
        mission_complete_keywords = [
            "the mission is completed",
            "mission completed",
            "mission complete",
        ]
        message_lower = message.lower()
        is_mission_complete = any(
            keyword in message_lower for keyword in mission_complete_keywords
        )

        if is_mission_complete:
            # Emit mission completion response
            response_text = "Mission completed. Resetting dashboard to normal mode and clearing all data."
            yield {"type": "content", "data": response_text}

            # Emit special mission_complete event to trigger frontend reset
            yield {
                "type": "mission_complete",
                "data": {
                    "message": "Mission completed",
                    "conversation_id": conversation_id,
                },
            }

            # Clear conversation history
            self.clear_conversation(conversation_id)

            # Clear subscriptions for this conversation
            if conversation_id in self.subscriptions:
                del self.subscriptions[conversation_id]

            # Send completion signal
            yield {"type": "complete", "data": {}}
            return

        # Get MCP tools in LLM format
        mcp_tools = self.mcp.get_tools_for_llm() if self.mcp.session else None

        # Track if we need to continue due to tool calls
        continue_processing = True
        max_iterations = 5  # Prevent infinite loops
        iteration = 0

        while continue_processing and iteration < max_iterations:
            iteration += 1
            continue_processing = False

            # Get LLM response with tools (don't await - it's an async generator)
            stream = self.llm.chat_completion_stream(
                messages=self.conversations[conversation_id], tools=mcp_tools
            )

            assistant_message = {"role": "assistant", "content": ""}
            tool_calls = []
            current_tool_call = None

            # Process streaming response
            async for chunk in stream:
                # Check if chunk has choices
                if (
                    not hasattr(chunk, "choices")
                    or chunk.choices is None
                    or len(chunk.choices) == 0
                ):
                    continue

                # Check if choice has delta
                choice = chunk.choices[0]
                if not hasattr(choice, "delta") or choice.delta is None:
                    continue

                delta = choice.delta

                # Handle text content
                if hasattr(delta, "content") and delta.content:
                    content = delta.content
                    assistant_message["content"] += content
                    print(f"📝 LLM content: {content}", flush=True)
                    yield {"type": "content", "data": content}

                # Handle tool calls
                if hasattr(delta, "tool_calls") and delta.tool_calls:
                    for tool_call_delta in delta.tool_calls:
                        # Get the index, default to 0 if None
                        tc_index = (
                            tool_call_delta.index
                            if tool_call_delta.index is not None
                            else 0
                        )

                        # Initialize or update tool call
                        if (
                            current_tool_call is None
                            or tc_index != current_tool_call.get("index")
                        ):
                            # Save previous tool call if exists
                            if current_tool_call is not None:
                                tool_calls.append(current_tool_call)

                            # Create new tool call
                            current_tool_call = {
                                "index": tc_index,
                                "id": tool_call_delta.id or "",
                                "type": "function",
                                "function": {"name": "", "arguments": ""},
                            }

                        # Update function name
                        if (
                            tool_call_delta.function
                            and tool_call_delta.function.name is not None
                        ):
                            current_tool_call["function"]["name"] = (
                                tool_call_delta.function.name
                            )

                        # Accumulate arguments
                        if (
                            tool_call_delta.function
                            and tool_call_delta.function.arguments is not None
                        ):
                            current_tool_call["function"]["arguments"] += (
                                tool_call_delta.function.arguments
                            )

            # Add final tool call if exists
            if current_tool_call:
                tool_calls.append(current_tool_call)

            # Save assistant message
            if tool_calls:
                assistant_message["tool_calls"] = tool_calls

            self.conversations[conversation_id].append(assistant_message)

            # Execute tool calls if present
            if tool_calls:
                continue_processing = True

                for tool_call in tool_calls:
                    tool_name = tool_call["function"]["name"]
                    tool_args_str = tool_call["function"]["arguments"]

                    try:
                        # Try to parse the JSON arguments
                        tool_args = json.loads(tool_args_str)
                    except json.JSONDecodeError as json_err:
                        # If there's a duplication issue (e.g., '{"a":1}{"a":1}'), extract first valid JSON
                        if "Extra data" in str(json_err):
                            try:
                                # Find where the first JSON object ends
                                decoder = json.JSONDecoder()
                                first_obj, idx = decoder.raw_decode(tool_args_str)
                                tool_args = first_obj
                                print(
                                    f"⚠️  Warning: Extracted first JSON object from duplicated arguments: {tool_args}"
                                )
                            except Exception:
                                # If extraction fails, try the old method
                                json_end = (
                                    json_err.pos
                                    if hasattr(json_err, "pos")
                                    else len(tool_args_str)
                                )
                                truncated_args = tool_args_str[:json_end].strip()
                                try:
                                    tool_args = json.loads(truncated_args)
                                except json.JSONDecodeError:
                                    raise json_err
                        else:
                            # For other JSON errors, raise immediately
                            raise json_err

                    try:
                        # Auto-inject subscription_id for unsubscribe tools
                        if tool_name in [
                            "unsubscribe_geofencing",
                            "unsubscribe_connected_network",
                        ]:
                            # Determine subscription type
                            sub_type = (
                                "geofencing"
                                if tool_name == "unsubscribe_geofencing"
                                else "connected_network"
                            )

                            # If no subscription_id provided, try to find it
                            if (
                                "subscription_id" not in tool_args
                                or not tool_args["subscription_id"]
                            ):
                                # Try to infer device_id (default to drone-001)
                                device_id = tool_args.get("device_id", "drone-001")
                                tracked_sub_id = self._get_subscription_id(
                                    conversation_id, device_id, sub_type
                                )

                                if tracked_sub_id:
                                    tool_args["subscription_id"] = tracked_sub_id

                        # Notify frontend of tool call
                        yield {
                            "type": "tool_call",
                            "data": {"tool": tool_name, "arguments": tool_args},
                        }

                        # Execute the tool through MCP client
                        result = await self.mcp.call_tool(tool_name, tool_args)

                        # Notify frontend of tool result
                        yield {
                            "type": "tool_result",
                            "data": {"tool": tool_name, "result": result},
                        }

                        # Track subscription IDs for subscribe tools
                        if tool_name in [
                            "subscribe_geofencing",
                            "subscribe_connected_network",
                        ]:
                            if (
                                isinstance(result, dict)
                                and "subscription_id" in result
                                and "device_id" in result
                            ):
                                sub_type = (
                                    "geofencing"
                                    if tool_name == "subscribe_geofencing"
                                    else "connected_network"
                                )
                                self._track_subscription(
                                    conversation_id,
                                    result["device_id"],
                                    sub_type,
                                    result["subscription_id"],
                                )

                        # Remove subscription tracking for unsubscribe tools
                        if tool_name in [
                            "unsubscribe_geofencing",
                            "unsubscribe_connected_network",
                        ]:
                            if isinstance(result, dict) and "error" not in result:
                                sub_type = (
                                    "geofencing"
                                    if tool_name == "unsubscribe_geofencing"
                                    else "connected_network"
                                )
                                device_id = tool_args.get("device_id", "drone-001")
                                self._remove_subscription(
                                    conversation_id, device_id, sub_type
                                )

                        # Validate and sanitize tool result before adding to conversation
                        try:
                            # Ensure result is JSON serializable
                            tool_result_content = json.dumps(result)

                            # Verify it can be parsed back (double-check validity)
                            json.loads(tool_result_content)

                            # Add tool result to conversation
                            self.conversations[conversation_id].append(
                                {
                                    "role": "tool",
                                    "tool_call_id": tool_call["id"],
                                    "name": tool_name,
                                    "content": tool_result_content,
                                }
                            )
                        except (TypeError, json.JSONDecodeError) as validation_err:
                            # If result is not JSON serializable or invalid, add a safe error message
                            error_content = json.dumps(
                                {
                                    "error": f"Tool result validation failed: {str(validation_err)}",
                                    "tool_name": tool_name,
                                }
                            )

                            self.conversations[conversation_id].append(
                                {
                                    "role": "tool",
                                    "tool_call_id": tool_call["id"],
                                    "name": tool_name,
                                    "content": error_content,
                                }
                            )

                    except Exception as e:
                        error_msg = f"Error executing tool {tool_name}: {str(e)}"

                        # Create a safe, validated error message
                        # Truncate error message if too long to prevent LLM API issues
                        safe_error_msg = (
                            error_msg[:500] if len(error_msg) > 500 else error_msg
                        )
                        error_content = json.dumps(
                            {
                                "error": safe_error_msg,
                                "tool_name": tool_name,
                                "status": "failed",
                            }
                        )

                        # Add error to conversation
                        self.conversations[conversation_id].append(
                            {
                                "role": "tool",
                                "tool_call_id": tool_call["id"],
                                "name": tool_name,
                                "content": error_content,
                            }
                        )

                        yield {
                            "type": "tool_error",
                            "data": {"tool": tool_name, "error": str(e)},
                        }

                        # For JSON parsing errors, stop processing to prevent cascading failures
                        if isinstance(e, json.JSONDecodeError):
                            continue_processing = False
                            break

        # Send completion signal
        yield {"type": "complete", "data": {}}

    def get_conversation(self, conversation_id: str) -> List[Dict] | None:
        """Get conversation history by ID"""
        return self.conversations.get(conversation_id)

    def clear_conversation(self, conversation_id: str) -> bool:
        """Clear conversation history"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
            return True
        return False

    def list_conversations(self) -> List[str]:
        """List all active conversation IDs"""
        return list(self.conversations.keys())

    def _track_subscription(
        self,
        conversation_id: str,
        device_id: str,
        subscription_type: str,
        subscription_id: str,
    ):
        """Track a subscription for later retrieval"""
        if conversation_id not in self.subscriptions:
            self.subscriptions[conversation_id] = {}
        if device_id not in self.subscriptions[conversation_id]:
            self.subscriptions[conversation_id][device_id] = {}
        self.subscriptions[conversation_id][device_id][subscription_type] = (
            subscription_id
        )

    def _get_subscription_id(
        self, conversation_id: str, device_id: str, subscription_type: str
    ) -> str | None:
        """Retrieve a tracked subscription ID"""
        return (
            self.subscriptions.get(conversation_id, {})
            .get(device_id, {})
            .get(subscription_type)
        )

    def _remove_subscription(
        self, conversation_id: str, device_id: str, subscription_type: str
    ):
        """Remove a tracked subscription"""
        if (
            conversation_id in self.subscriptions
            and device_id in self.subscriptions[conversation_id]
        ):
            if subscription_type in self.subscriptions[conversation_id][device_id]:
                del self.subscriptions[conversation_id][device_id][subscription_type]


# Global AI agent instance
ai_agent = AIAgent()
