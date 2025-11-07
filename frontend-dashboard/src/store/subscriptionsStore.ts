import { create } from 'zustand';

/**
 * Subscription interface
 */
export interface Subscription {
  id: string;
  type: string;
  deviceId: string;
  createdAt: string;
  parameters?: Record<string, unknown>;
}

/**
 * Subscriptions Store
 * Manages active subscriptions state
 */
interface SubscriptionsStore {
  // State
  activeSubscriptions: Subscription[];

  // Actions
  addSubscription: (subscription: Subscription) => void;
  removeSubscription: (subscriptionId: string) => void;
  clearAllSubscriptions: () => void;

  // Derived state
  getSubscriptionById: (subscriptionId: string) => Subscription | undefined;
  hasGeofencingSubscription: () => boolean;
}

export const useSubscriptionsStore = create<SubscriptionsStore>((set, get) => ({
  // Initial state
  activeSubscriptions: [],

  // Actions
  addSubscription: (subscription) =>
    set((state) => ({
      activeSubscriptions: [...state.activeSubscriptions, subscription],
    })),

  removeSubscription: (subscriptionId) =>
    set((state) => ({
      activeSubscriptions: state.activeSubscriptions.filter(
        (sub) => sub.id !== subscriptionId
      ),
    })),

  clearAllSubscriptions: () => set({ activeSubscriptions: [] }),

  // Derived state
  getSubscriptionById: (subscriptionId) =>
    get().activeSubscriptions.find((sub) => sub.id === subscriptionId),

  hasGeofencingSubscription: () =>
    get().activeSubscriptions.some((sub) => sub.type === 'Geofencing'),
}));
