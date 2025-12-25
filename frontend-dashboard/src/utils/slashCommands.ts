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
    description: 'Report a power outage at a specific address',
    handler: (param: string) => {
      return `A power outage is reported at ${param}`;
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
      return `Check if drone kit has arrived at the outage location`;
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
      return `deploy the damage assessment image in this edge computing node (image id: damage-assessment:v2.0)`;
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
      return `undeploy the damage assessment image`;
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

  if (!cmd) {
    throw new Error(`Unknown command: ${command}`);
  }

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
  if (!input.trim().startsWith('/')) return false;

  // Parse the command to check if it exists in our command list
  const parsed = parseSlashCommand(input);
  const { command } = parsed;

  // Check if the command exists in our commands object
  return command.toLowerCase() in slashCommands;
};

/**
 * Check if input looks like a slash command attempt (starts with /)
 * but is not a valid command
 */
export const isInvalidSlashCommand = (input: string): boolean => {
  if (!input.trim().startsWith('/')) return false;

  const parsed = parseSlashCommand(input);
  const { command } = parsed;

  // It's invalid if it starts with / but the command doesn't exist
  return !(command.toLowerCase() in slashCommands);
};

/**
 * Get the list of valid command names for error messages
 */
export const getValidCommandNames = (): string[] => {
  return Object.keys(slashCommands).map((name) => `/${name}`);
};
