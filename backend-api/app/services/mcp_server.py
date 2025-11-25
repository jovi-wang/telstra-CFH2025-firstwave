#!/usr/bin/env python3
"""
CAMARA MCP Server using FastMCP
Provides CAMARA network APIs as MCP tools
"""

import json
import sys
import uuid
from datetime import datetime, timedelta
from mcp.server.fastmcp import FastMCP
import httpx

# Initialize FastMCP server
mcp = FastMCP("camara-mcp-server")


# Helper function for logging to stderr
def log(message: str):
    """Log to stderr to avoid interfering with MCP protocol on stdout"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[MCP Server {timestamp}] {message}", file=sys.stderr, flush=True)


@mcp.tool()
async def get_qos_profiles() -> str:
    """
    Get all available QoS (Quality of Service) profiles with their specifications

    Returns:
        JSON string with array of QoS profiles, each containing:
        - name: Profile identifier (QOS_H, QOS_M, QOS_L)
        - maxDownstreamRate: Maximum downstream bandwidth in bps
        - maxUpstreamRate: Maximum upstream bandwidth in bps
        - jitter: Network jitter in milliseconds
        - packetErrorLossRate: Packet error loss rate as percentage
    """
    log(f"🔧 Tool called: get_qos_profiles")
    # Mock QoS profiles data (match frontend static data)
    MOCK_QOS_PROFILES = [
        {
            "name": "QOS_H",
            "maxDownstreamRate": 50000000,  # 50 Mbps in bps
            "maxUpstreamRate": 20000000,  # 20 Mbps in bps
            "jitter": 5,  # ms
            "packetErrorLossRate": 0.01,  # percentage
        },
        {
            "name": "QOS_M",
            "maxDownstreamRate": 25000000,  # 25 Mbps in bps
            "maxUpstreamRate": 10000000,  # 10 Mbps in bps
            "jitter": 10,  # ms
            "packetErrorLossRate": 0.1,  # percentage
        },
        {
            "name": "QOS_L",
            "maxDownstreamRate": 10000000,  # 10 Mbps in bps
            "maxUpstreamRate": 5000000,  # 5 Mbps in bps
            "jitter": 20,  # ms
            "packetErrorLossRate": 0.5,  # percentage
        },
    ]

    result = json.dumps(MOCK_QOS_PROFILES)
    log(f"✅ Tool completed: get_qos_profiles")
    log(f"   Returned {len(MOCK_QOS_PROFILES)} profiles")

    return result


@mcp.tool()
async def get_connected_network(device_id: str = "drone-001") -> str:
    """
    Get connected network type and device reachability status

    Args:
        device_id: Device identifier (default: 'drone-001')

    Returns:
        JSON string with:
        - reachable: Boolean indicating if device is reachable
        - connectivity: Type of connectivity (e.g., 'DATA', 'SMS')
        - connectedNetworkType: Network type (e.g., '5G', '4G')
        - lastStatusTime: ISO timestamp of last status check
    """
    log(f"🔧 Tool called: get_connected_network")
    log(f"   Parameters: device_id='{device_id}'")

    # Get base data for device
    network_data = {
        "reachable": True,
        "connectivity": "DATA",
        "connectedNetworkType": "5G",
    }

    # Add dynamic timestamp (a few seconds ago)
    last_status_time = datetime.now() - timedelta(seconds=3)
    network_data["lastStatusTime"] = last_status_time.isoformat() + "Z"
    network_data["device_id"] = device_id

    result = json.dumps(network_data)
    log(f"✅ Tool completed: get_connected_network")
    log(
        f"   Network: {network_data['connectedNetworkType']}, Reachable: {network_data['reachable']}"
    )

    return result


@mcp.tool()
async def geocode_address(address: str) -> str:
    """
    Convert a street address into geographic coordinates using OpenStreetMap Nominatim

    Args:
        address: Street address to geocode (e.g., "123 Collins St, Melbourne")

    Returns:
        JSON string with:
        - address: Original address provided
        - latitude: Latitude coordinate
        - longitude: Longitude coordinate
        - display_name: Full formatted address from geocoding service
        - error: Error message if geocoding failed
    """
    log(f"🔧 Tool called: geocode_address")
    log(f"   Parameters: address='{address}'")

    try:
        async with httpx.AsyncClient() as client:
            # Call Nominatim API
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": address, "format": "json", "limit": 1},
                headers={"User-Agent": "FirstWave-Disaster-Response/1.0"},
                timeout=10.0,
            )

            response.raise_for_status()
            results = response.json()

            if results and len(results) > 0:
                location = results[0]
                result_data = {
                    "address": address,
                    "latitude": float(location["lat"]),
                    "longitude": float(location["lon"]),
                    "display_name": location.get("display_name", address),
                }

                log(f"✅ Tool completed: geocode_address")
                log(f"   Found: {location.get('display_name', 'Unknown')}")
                log(
                    f"   Coordinates: {result_data['latitude']}, {result_data['longitude']}"
                )

                return json.dumps(result_data)
            else:
                # No results found
                error_data = {"address": address, "error": "Address not found"}
                log(f"⚠️ Tool completed: geocode_address - No results")
                return json.dumps(error_data)

    except Exception as e:
        error_msg = f"Geocoding error: {str(e)}"
        log(f"❌ Tool error: geocode_address - {error_msg}")
        error_data = {"address": address, "error": error_msg}
        return json.dumps(error_data)


@mcp.tool()
async def discover_edge_node(device_id: str = "drone-001") -> str:
    """
    Discover the closest operator edge zone for a given device

    Args:
        device_id: Device identifier (default: 'drone-001')

    Returns:
        JSON string with:
        - edgeCloudZoneName: Name of the edge zone (e.g., 'MELB-ZONE-1')
        - edgeCloudProvider: Edge cloud provider name (e.g., 'Telstra Cloud')
        - device_id: Device identifier
    """
    log(f"🔧 Tool called: discover_edge_node")
    log(f"   Parameters: device_id='{device_id}'")

    # Mock edge node data - coordinates will be calculated by frontend
    edge_data = {
        "edgeCloudZoneName": "MELBOURNE-ZONE-1",
        "edgeCloudProvider": "Telstra Cloud",
    }

    result = json.dumps(edge_data)
    log(f"✅ Tool completed: discover_edge_node")
    log(
        f"   Zone: {edge_data['edgeCloudZoneName']}, Provider: {edge_data['edgeCloudProvider']}"
    )

    return result


@mcp.tool()
async def deploy_edge_application(image_id: str, edge_zone_name: str) -> str:
    """
    Deploy an application to an edge computing zone

    Args:
        image_id: Container image identifier (e.g., 'video-analyzer:v1.2')
        edge_zone_name: Edge zone name where to deploy (e.g., 'MELBOURNE-ZONE-1')

    Returns:
        JSON string with:
        - deployment_id: Unique deployment identifier (UUID)
        - status: Deployment status (e.g., 'deployed')
        - image_id: Container image identifier
        - edge_zone_name: Edge zone where deployed
    """
    log(f"🔧 Tool called: deploy_edge_application")
    log(f"   Parameters: image_id='{image_id}', edge_zone_name='{edge_zone_name}'")

    # Generate unique deployment ID
    deployment_id = str(uuid.uuid4())

    # Mock deployment data
    deployment_data = {
        "deployment_id": deployment_id,
        "status": "deployed",
        "image_id": image_id,
        "edge_zone_name": edge_zone_name,
    }

    result = json.dumps(deployment_data)
    log(f"✅ Tool completed: deploy_edge_application")
    log(f"   Deployment ID: {deployment_id}")
    log(f"   Status: {deployment_data['status']}")

    return result


@mcp.tool()
async def undeploy_edge_application(deployment_id: str) -> str:
    """
    Undeploy an edge application and remove it from the edge computing zone

    Args:
        deployment_id: Unique deployment identifier to remove

    Returns:
        JSON string with empty object {} indicating successful removal
    """
    log(f"🔧 Tool called: undeploy_edge_application")
    log(f"   Parameters: deployment_id='{deployment_id}'")

    # Mock implementation - simply return success
    result_data = {}

    result = json.dumps(result_data)
    log(f"✅ Tool completed: undeploy_edge_application")
    log(f"   Successfully undeployed application: {deployment_id}")

    return result


@mcp.tool()
async def verify_location(
    latitude: float, longitude: float, radius: int = 2000, device_id: str = "drone-001"
) -> str:
    """
    Verify if a location is within a specified radius of the target coordinates

    Args:
        latitude: Target latitude to verify
        longitude: Target longitude to verify
        radius: Verification radius in meters (default: 2000)

    Returns:
        JSON string with:
        - verificationResult: "TRUE" if within radius, "FALSE" otherwise
        - lastLocationTime: Time of last location check (e.g., "30 seconds ago")
    """
    log(f"🔧 Tool called: verify_location")
    log(
        f"   Parameters: latitude={latitude}, longitude={longitude}, radius={radius}m, device_id={device_id}"
    )

    # Calculate time 30 seconds ago from now
    last_location_time = datetime.now() - timedelta(seconds=30)
    time_ago_str = "30 seconds ago"

    # Mock implementation - always returns TRUE for demo
    result_data = {"verificationResult": "TRUE", "lastLocationTime": time_ago_str}

    log(f"✅ Tool completed: verify_location")
    log(f"   Result: Verified within {radius}m radius for device '{device_id}'")
    log(f"   Last location time: {last_location_time.strftime('%Y-%m-%d %H:%M:%S')}")

    return json.dumps(result_data)


@mcp.tool()
async def subscribe_geofencing(
    device_id: str = "drone-001",
    latitude: float = 0.0,
    longitude: float = 0.0,
    radius: int = 5000,
) -> str:
    """
    Create a geofencing subscription to monitor if a device enters or exits a defined area

    Args:
        device_id: Device identifier (default: 'drone-001')
        latitude: Center latitude of the geofence area
        longitude: Center longitude of the geofence area
        radius: Radius in meters defining the geofence boundary (default: 5000)

    Returns:
        JSON string with:
        - subscription_id: Unique subscription identifier (UUID)
        - device_id: Device identifier
        - latitude: Center latitude
        - longitude: Center longitude
        - radius: Radius in meters
    """
    log(f"🔧 Tool called: subscribe_geofencing")
    log(
        f"   Parameters: device_id='{device_id}', latitude={latitude}, longitude={longitude}, radius={radius}m"
    )

    # Generate unique subscription ID
    subscription_id = str(uuid.uuid4())

    # Mock subscription data
    subscription_data = {
        "subscription_id": subscription_id,
        "device_id": device_id,
        "latitude": latitude,
        "longitude": longitude,
        "radius": radius,
    }

    result = json.dumps(subscription_data)
    log(f"✅ Tool completed: subscribe_geofencing")
    log(f"   Subscription ID: {subscription_id}")
    log(f"   Geofence center: ({latitude}, {longitude}), radius: {radius}m")

    return result


@mcp.tool()
async def unsubscribe_geofencing(subscription_id: str) -> str:
    """
    Remove a geofencing subscription

    Args:
        subscription_id: Unique subscription identifier to remove

    Returns:
        JSON string with empty object {} indicating successful removal
    """
    log(f"🔧 Tool called: unsubscribe_geofencing")
    log(f"   Parameters: subscription_id='{subscription_id}'")

    # Mock implementation - simply return success
    result_data = {}

    result = json.dumps(result_data)
    log(f"✅ Tool completed: unsubscribe_geofencing")
    log(f"   Successfully removed subscription: {subscription_id}")

    return result


@mcp.tool()
async def subscribe_connected_network(device_id: str = "drone-001") -> str:
    """
    Create a subscription to monitor connected network type and device reachability changes for a device

    Args:
        device_id: Device identifier (default: 'drone-001')

    Returns:
        JSON string with:
        - subscription_id: Unique subscription identifier (UUID)
        - device_id: Device identifier
    """
    log(f"🔧 Tool called: subscribe_connected_network")
    log(f"   Parameters: device_id='{device_id}'")

    # Generate unique subscription ID
    subscription_id = str(uuid.uuid4())

    # Mock subscription data
    subscription_data = {
        "subscription_id": subscription_id,
        "device_id": device_id,
    }

    result = json.dumps(subscription_data)
    log(f"✅ Tool completed: subscribe_connected_network")
    log(f"   Subscription ID: {subscription_id}")

    return result


@mcp.tool()
async def unsubscribe_connected_network(subscription_id: str) -> str:
    """
    Remove a connected network type and device reachability subscription

    Args:
        subscription_id: Unique subscription identifier to remove

    Returns:
        JSON string with empty object {} indicating successful removal
    """
    log(f"🔧 Tool called: unsubscribe_connected_network")
    log(f"   Parameters: subscription_id='{subscription_id}'")

    # Mock implementation - simply return success
    result_data = {}

    result = json.dumps(result_data)
    log(f"✅ Tool completed: unsubscribe_connected_network")
    log(f"   Successfully removed subscription: {subscription_id}")

    return result


@mcp.tool()
async def handle_webrtc_call(type: str) -> str:
    """
    Handle WebRTC media session - accept or cancel

    Args:
        type: Action type - either "accept_media_session" or "cancel_media_session"

    Returns:
        JSON string with:
        - If accept_media_session: session_id, sdp offer, and status
        - If cancel_media_session: empty object {}
    """
    log(f"🔧 Tool called: handle_webrtc_call")
    log(f"   Parameters: type='{type}'")

    if type == "accept_media_session":
        # Generate unique session ID
        session_id = f"webrtc-session-{str(uuid.uuid4())}"

        # Mock SDP offer
        fake_sdp = (
            "v=0\n"
            "o=- 1234567890 1234567890 IN IP4 127.0.0.1\n"
            "s=WebRTC Media Session\n"
            "t=0 0\n"
            "m=video 9 UDP/TLS/RTP/SAVPF 96\n"
            "a=rtpmap:96 VP8/90000\n"
            "a=sendrecv"
        )

        result_data = {
            "session_id": session_id,
            "sdp": fake_sdp,
            "status": "connected",
        }

        log(f"✅ Tool completed: handle_webrtc_call")
        log(f"   Session ID: {session_id}")
        log(f"   Action: Media session accepted")

        return json.dumps(result_data)
    elif type == "cancel_media_session":
        # Return empty object for cancellation
        result_data = {}

        log(f"✅ Tool completed: handle_webrtc_call")
        log(f"   Action: Media session cancelled")

        return json.dumps(result_data)
    else:
        # Invalid type parameter
        error_data = {
            "error": f"Invalid type parameter: {type}. Must be 'accept_media_session' or 'cancel_media_session'"
        }
        log(f"❌ Tool error: handle_webrtc_call - Invalid type: {type}")
        return json.dumps(error_data)


@mcp.tool()
async def create_quality_on_demand(
    device_id: str = "drone-001", qos_profile: str = "QOS_L"
) -> str:
    """
    Create a Quality on Demand (QoD) session with specified QoS profile

    Args:
        device_id: Device identifier (default: 'drone-001')
        qos_profile: QoS profile name - one of "QOS_H", "QOS_M", "QOS_L" (default: 'QOS_L')

    Returns:
        JSON string with:
        - session_id: Unique QoD session identifier (UUID)
        - device_id: Device identifier
        - qos_profile: Requested QoS profile name
        - status: Session status (always 'active')
    """
    log(f"🔧 Tool called: create_quality_on_demand")
    log(f"   Parameters: device_id='{device_id}', qos_profile='{qos_profile}'")

    # Validate QoS profile
    valid_profiles = ["QOS_H", "QOS_M", "QOS_L"]
    if qos_profile not in valid_profiles:
        error_data = {
            "error": f"Invalid QoS profile: {qos_profile}. Must be one of {', '.join(valid_profiles)}"
        }
        log(f"❌ Tool error: create_quality_on_demand - Invalid profile: {qos_profile}")
        return json.dumps(error_data)

    # Generate unique QoD session ID
    session_id = f"qod-session-{str(uuid.uuid4())}"

    # Mock QoD session data
    result_data = {
        "session_id": session_id,
        "device_id": device_id,
        "qos_profile": qos_profile,
        "status": "active",
        "created_at": datetime.now().isoformat() + "Z",
        "expires_at": (datetime.now() + timedelta(hours=1)).isoformat() + "Z",
    }

    log(f"✅ Tool completed: create_quality_on_demand")
    log(f"   Session ID: {session_id}")
    log(f"   QoS Profile: {qos_profile}")
    log(f"   Device: {device_id}")

    return json.dumps(result_data)


@mcp.tool()
async def integrity_check(phone_number: str, device_id: str = "drone-001") -> str:
    """
    Perform pre-flight device integrity check including number verification, SIM swap detection, and device swap detection

    Args:
        phone_number: Phone number associated with the device (e.g., '+61491570157')
        device_id: Device identifier (default: 'drone-001')

    Returns:
        JSON string with:
        - numberVerified: Boolean indicating if phone number is verified on device
        - simSwapped: Boolean indicating if SIM swap was detected
        - deviceSwapped: Boolean indicating if device swap was detected
        - device_id: Device identifier
        - phone_number: Phone number checked
        - timestamp: ISO timestamp of integrity check
    """
    log("🔧 Tool called: integrity_check")
    log(f"   Parameters: phone_number='{phone_number}', device_id='{device_id}'")

    # Mock integrity check data - all checks pass for demo
    integrity_data = {
        "numberVerified": True,
        "simSwapped": False,
        "deviceSwapped": False,
        "device_id": device_id,
        "phone_number": phone_number,
        "timestamp": datetime.now().isoformat() + "Z",
    }

    result = json.dumps(integrity_data)
    log("✅ Tool completed: integrity_check")
    log(f"   Number Verified: {integrity_data['numberVerified']}")
    log(f"   SIM Swapped: {integrity_data['simSwapped']}")
    log(f"   Device Swapped: {integrity_data['deviceSwapped']}")

    return result


if __name__ == "__main__":
    log("🚀 CAMARA MCP Server starting...")
    log(
        "   Available tools: get_qos_profiles, get_connected_network, geocode_address, verify_location, discover_edge_node, deploy_edge_application, undeploy_edge_application, subscribe_geofencing, unsubscribe_geofencing, subscribe_connected_network, unsubscribe_connected_network, handle_webrtc_call, create_quality_on_demand, integrity_check"
    )
    mcp.run()
