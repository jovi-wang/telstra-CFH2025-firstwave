# Typical Operator Mission Flow

## 1. Dashboard starts in normal mode

When the dashboard first opens:

- the map is centered on Melbourne CBD and shows the default base marker
- the header shows the temperature and the `Emergency Mode` toggle
- the `StatusPanel` displays static operational data
- the chatbot shows its default assistant greeting

## 2. Conduct a preflight integrity check for the drone kit

The operator starts with a device integrity check.

- prompt example: `conduct preflight integrity check`
- slash command: `/preflight-check`

Expected behaviour:

- the chatbot triggers the MCP tool `integrity_check`
- the tool returns a successful result
- the response shows:
  - `numberVerified: true`
  - `simSwapped: false`
  - `deviceSwapped: false`

## 3. Check the drone kit's connected network type

The operator checks the current network status of the drone kit.

- prompt example: `check drone kit's connected network type`
- slash command: `/check-network-status`

Expected behaviour:

- the chatbot triggers the MCP tool `get_connected_network`
- the tool returns the current connectivity status
- the response may include:
  - `reachable: true`
  - `connectivity: DATA`
  - `connectedNetworkType: 5G`

## 4. Create a network change subscription and simulate network events

The operator subscribes to network change updates.

- prompt example: `create a subscription on device network type change`
- slash command: `/subscribe-network-change`

Expected behaviour:

- the chatbot triggers the MCP tool `subscribe_connected_network`
- the tool returns a successful result with a `subscription_id`

After the subscription is created, simulate a connected network type event:

```shell
curl --location 'http://localhost:4000/api/events/publish' \
--header 'Content-Type: application/json' \
--data '{
  "event_type": "connected_network_type"
}'
```

Expected behaviour:

- the dashboard shows a toast notification
- the chatbot adds a system chat message such as:
  `📶 Device connected network type changed from 5G to 4G`

Then simulate a device reachability event:

```shell
curl --location 'http://localhost:4000/api/events/publish' \
--header 'Content-Type: application/json' \
--data '{
  "event_type": "device_reachability"
}'
```

Expected behaviour:

- the dashboard shows a toast notification
- the chatbot adds a system chat message for the reachability change

## 5. Check available QoS profiles

The operator reviews the available QoS options before the mission escalates.

- prompt example: `Check all available QoS profiles`
- slash command: `/qos`

Expected behaviour:

- the chatbot triggers the MCP tool `get_qos_profiles`
- the tool returns all available profiles
- the response includes:
  - `QOS_H`
  - `QOS_M`
  - `QOS_L`

## 6. Report an incident and create a geofence

The operator reports a bushfire incident and creates a geofence around it.

- prompt example: `a bushfire is reported at 1234 Mount Dandenong Tourist Rd, Kalorama VIC 3766`
- slash command: `/report 1234 Mount Dandenong Tourist Rd, Kalorama VIC 3766`

Expected behaviour:

- the chatbot triggers the MCP tool `geocode_address`
- the tool returns the incident coordinates
- the map recenters to the incident location
- a red incident marker appears on the map

Next, create a geofence around the incident:

- prompt example: `create a geofence subscription with 200m radius around the incident location`
- slash command: `/subscribe-geofence 200`

Expected behaviour:

- the chatbot triggers the MCP tool `subscribe_geofencing`
- the tool returns a successful result with a `subscription_id`
- a purple dashed geofence circle with a 200m radius appears on the map

## 7. Confirm the drone kit has arrived at the incident area

As responders move toward the scene, the operator can simulate a geofence event and verify the drone location.

First, simulate a geofence event:

```shell
curl --location 'http://localhost:4000/api/events/publish' \
--header 'Content-Type: application/json' \
--data '{
  "event_type": "geofence"
}'
```

Expected behaviour:

- the dashboard shows a toast notification
- the chatbot adds a system chat message such as:
  `⚠️ Geofence boundary breach detected`

Then verify the drone location:

- prompt example: `check if drone kit has arrived the bushfire scene`
- slash command: `/verify-location`

Expected behaviour:

- the chatbot triggers the MCP tool `verify_location`
- the tool returns a successful verification result
- the response may include:
  - `verificationResult: true`
  - `lastLocationTime: 30 seconds ago`
- the map shows the drone kit marker near the incident area

In parallel, the backend continues sending periodic `region_device_count` updates every 30 seconds, which update the heatmap.

## 8. Discover the closest edge node and deploy the edge application

The operator identifies the nearest edge node and deploys the fire-spread prediction application.

First, discover the edge node:

- prompt example: `find closest edge computing node location`
- slash command: `/edge-discovery`

Expected behaviour:

- the chatbot triggers the MCP tool `discover_edge_node`
- the tool returns edge node metadata such as:
  - `edgeCloudZoneName: MELBOURNE-ZONE-1`
  - `edgeCloudProvider: Telstra Cloud`
- the frontend places a green edge node marker on the map

Then deploy the edge application:

- prompt example: `deploy the fire spread prediction image in this node (image id: fire-spread-prediction:v2.0)`
- slash command: `/deploy-edge-application`

Expected behaviour:

- the chatbot triggers the MCP tool `deploy_edge_application`
- the tool returns deployment details such as:
  - `deployment_id: unique-deployment-id`
  - `status: deployed`

## 9. Switch the dashboard into emergency mode

At this point, the operator manually enables emergency mode using the top-right toggle.

Expected behaviour:

- the layout expands to show incident operations panels
- visible sections include:
  - `Live Video Stream`
  - `Active Subscriptions`
  - `Drone Telemetry`
  - `Network Metrics`
  - `Edge Node Analysis`
- the `Active Subscriptions` panel shows current active items such as:
  - `WebRTC`
  - `Geofencing`
  - `Network Type & Reachability`
- the header shows status indicators:
  - `Drone Active` is green once the drone location has been verified
  - `Stream Active` is grey until a media session is accepted
  - `Edge Processing` is grey until processing becomes active

Note:

- a static `WebRTC` subscription is shown whenever emergency mode is enabled
- this is a frontend display state and does not depend on a backend subscription call

## 10. Accept an incoming WebRTC call

The operator may simulate an incoming WebRTC notification before accepting the media session.

First, simulate the event:

```shell
curl --location 'http://localhost:4000/api/events/publish' \
--header 'Content-Type: application/json' \
--data '{
  "event_type": "incoming_webrtc"
}'
```

Expected behaviour:

- the dashboard shows a toast notification
- the chatbot adds a system chat message such as:
  `📞 Incoming WebRTC call from drone-001`

Then accept the call:

- prompt example: `accept incoming WebRTC call`
- slash command: `/accept-webrtc-call`

Expected behaviour:

- the chatbot triggers the MCP tool `handle_webrtc_call`
- the tool returns a successful result for the accepted media session
- the response includes the WebRTC session information
- the live video player becomes active
- the header updates:
  - `Stream Active` turns green immediately
  - `Edge Processing` turns green after a delay
- the `Drone Telemetry` panel reveals flight data such as altitude, speed, heading, and battery
- the `Active Subscriptions` panel shows an additional synthetic `Connectivity Insights` entry while streaming is active

## 11. Create a QoD session using `QOS_M`

The operator creates a QoD session for the active media workflow.

- prompt example: `create a new QoD session for this webrtc media call using QoS_M`
- slash command: `/create-qod QoS_M`

Expected behaviour:

- the chatbot triggers the MCP tool `create_quality_on_demand`
- the tool returns a successful result
- the response may include:
  - `session_id: unique-qod-session-id`
  - `status: active`
  - `qos_profile: QOS_M`
- the `Network Metrics` panel updates to show the active QoD session and improved network performance

## 12. Simulate a connectivity insight event

The operator can demonstrate degraded streaming conditions by publishing a connectivity insight event.

```shell
curl --location 'http://localhost:4000/api/events/publish' \
--header 'Content-Type: application/json' \
--data '{
  "event_type": "connectivity_insight"
}'
```

Expected behaviour:

- the dashboard shows a toast notification
- the chatbot adds a system chat message such as:
  `⚡ Video streaming connectivity QoS breached`

## 13. Upgrade QoD to `QOS_H`

To improve stream quality, the operator creates a new QoD session using the higher profile.

- prompt example: `create a new QoD session for this webrtc media call using QoS_H`
- slash command: `/create-qod QoS_H`

Expected behaviour:

- the chatbot triggers the MCP tool `create_quality_on_demand`
- the tool returns a successful result
- the response may include:
  - `session_id: unique-qod-session-id`
  - `status: active`
  - `qos_profile: QOS_H`
- the video stream quality improves
- the `Network Metrics` panel updates to reflect the higher QoS profile and better performance

## 14. Undeploy the edge application

Once edge-assisted analysis is no longer needed, the operator undeploys the application.

- prompt example: `undeploy fire-spread-prediction:v2.0 model from edge node`
- slash command: `/undeploy-edge-application`

Expected behaviour:

- the chatbot triggers the MCP tool `undeploy_edge_application`
- the tool returns a successful result
- the `Edge Node Analysis` panel continues to show the discovered edge node
- the deployment-specific analysis output disappears
- the header `Edge Processing` indicator turns grey

## 15. Terminate the WebRTC call

The operator ends the active media session.

- prompt example: `cancel the webrtc call session`
- slash command: `/terminate-webrtc-call`

Expected behaviour:

- the chatbot triggers the MCP tool `handle_webrtc_call`
- the tool returns a successful cancellation result
- the live video stream stops
- the header updates:
  - `Stream Active` turns grey
  - `Edge Processing` turns grey
- the telemetry panel hides flight data again
- the synthetic `Connectivity Insights` entry disappears from the `Active Subscriptions` panel

## 16. Cancel the geofence subscription

The operator removes the geofence subscription when it is no longer needed.

- prompt example: `cancel the geofence subscription`
- slash command: `/unsubscribe-geofence`

Expected behaviour:

- the chatbot triggers the MCP tool `unsubscribe_geofencing`
- the tool returns a successful result
- the geofence subscription is removed from the active subscriptions list

## 17. Cancel the network change subscription

The operator removes the network monitoring subscription.

- prompt example: `cancel the network type change subscription`
- slash command: `/unsubscribe-network-change`

Expected behaviour:

- the chatbot triggers the MCP tool `unsubscribe_connected_network`
- the tool returns a successful result
- the network subscription is removed from the active subscriptions list

## 18. Complete the mission

At the end of the mission, the operator resets the dashboard.

- prompt example: `mission completed`
- slash command: `/mission-complete`

Expected behaviour:

- the dashboard exits emergency mode
- system status indicators are reset
- subscriptions and panel state are cleared
- the map returns to its default state
- the chat resets back to the default assistant greeting
