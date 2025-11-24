/**
 * Slash Commands Utility
 * Defines and handles slash commands for the AI assistant chat
 */

export interface SlashCommand {
  name: string;
  description: string;
  handler: (param: string) => string;
}

// Define available slash commands
const slashCommands: Record<string, SlashCommand> = {
  'check-network-status': {
    name: 'check-network-status',
    description: 'Connected Network Type and Device Reachability Status',
    handler: () => {
      return "Check drone kit's connected network type";
    },
  },
  'subscribe-network-change': {
    name: 'subscribe-network-change',
    description:
      'Connected Network Type and Device Reachability Status Subscriptions',
    handler: () => {
      return 'Create a subscription on device network type change';
    },
  },
  'preflight-check': {
    name: 'preflight-check',
    description: 'SIM Swap, Device Swap and Number Verification',
    handler: () => {
      return 'Conduct preflight device integrity check';
    },
  },
  qos: {
    name: 'qos',
    description: 'QoS profiles',
    handler: () => {
      return 'Get all available QoS profiles';
    },
  },
  report: {
    name: 'report',
    description: 'Report a bushfire at a specific address',
    handler: (param: string) => {
      return `A bushfire is reported at ${param}`;
    },
  },
  'subscribe-geofence': {
    name: 'subscribe-geofence',
    description: 'Geofencing Subscriptions',
    handler: (param: string) => {
      return `Create geofencing subscription at this location with radius of ${param}m for the drone kit`;
    },
  },
  'verify-location': {
    name: 'verify-location',
    description: 'Location Verification',
    handler: () => {
      return `Check if drone kit has arrived the bushfire scene`;
    },
  },
  'edge-discovery': {
    name: 'edge-discovery',
    description: 'Simple Edge Discovery',
    handler: () => {
      return `Find closest edge computing node location from the drone kit`;
    },
  },
  'deploy-edge-application': {
    name: 'deploy-edge-application',
    description: 'Edge Application Management',
    handler: () => {
      return `deploy the fire spread prediction image in this edge computing node (image id: fire-spread-prediction:v2.0)`;
    },
  },
  'accept-webrtc-call': {
    name: 'accept-webrtc-call',
    description: 'WebRTC Call Handling',
    handler: () => {
      return `Accept drone's incoming WebRTC call`;
    },
  },
  'create-qod': {
    name: 'create-qod',
    description: 'Create QoD session',
    handler: (param: string) => {
      return `create a new QoD session for this webrtc media call using ${param}`;
    },
  },
  'terminate-webrtc-call': {
    name: 'terminate-webrtc-call',
    description: 'WebRTC Call Handling',
    handler: () => {
      return `Terminate drone's ongoing WebRTC call`;
    },
  },
  'undeploy-edge-application': {
    name: 'undeploy-edge-application',
    description: 'Edge Application Management',
    handler: () => {
      return `undeploy the fire spread prediction image`;
    },
  },
  'unsubscribe-geofence': {
    name: 'unsubscribe-geofence',
    description: 'Geofencing Subscriptions',
    handler: () => {
      return `Remove geofencing subscription created earlier for drone kit`;
    },
  },
  'unsubscribe-network-change': {
    name: 'unsubscribe-network-change',
    description:
      'Connected Network Type and Device Reachability Status Subscriptions',
    handler: () => {
      return 'Cancel the network type subscription created earlier for drone kit';
    },
  },
  'mission-complete': {
    name: 'mission-complete',
    description: 'Complete the current mission',
    handler: () => {
      return 'mission completed';
    },
  },
};

const parseSlashCommand = (
  input: string
): { command: string; param: string } => {
  // Split the input by spaces to separate command from parameters
  const command = input.trim().split(' ')[0].substring(1); // Remove the '/' prefix
  const param = input
    .trim()
    .substring(command.length + 2)
    .trim(); // Get the rest as parameter

  return { command, param };
};

export const executeSlashCommand = (input: string): string => {
  const parsed = parseSlashCommand(input);

  const { command, param } = parsed;
  const cmd = slashCommands[command.toLowerCase()];

  return cmd.handler(param);
};

export const getAvailableSlashCommands = (
  filter: string = ''
): SlashCommand[] => {
  const commands = Object.values(slashCommands);

  if (!filter) {
    return commands;
  }

  return commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(filter.toLowerCase())
  );
};

export const isSlashCommand = (input: string): boolean => {
  return input.trim().startsWith('/') && parseSlashCommand(input) !== null;
};
