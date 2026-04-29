import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { ChatbotPage } from '../fixtures/app.fixture';

const BACKEND_URL = 'http://localhost:4000';

const chatbotRoot = (page: Page) =>
  page
    .locator('h2:has-text("AI Agent Assistant")')
    .locator(
      'xpath=ancestor::div[contains(@class,"h-full") and contains(@class,"flex") and contains(@class,"flex-col")][1]',
    );

const latestAssistantBubble = (page: Page) =>
  chatbotRoot(page).locator('.bg-background.self-start').last();

const latestSystemBubble = (page: Page) =>
  chatbotRoot(page).locator('.bg-warning.border-l-4.border-warning.self-start').last();

const latestToast = (page: Page) => page.locator('.bg-blue-800').last();

const statusIndicator = (page: Page, label: string) =>
  page
    .getByText(label, { exact: true })
    .locator('xpath=preceding-sibling::div[1]');

const activeSubscriptionsPanel = (page: Page) =>
  page
    .getByText('Active Subscriptions', { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"bg-surface")][1]');

const edgeAnalysisPanel = (page: Page) =>
  page
    .getByText('Edge Node Analysis', { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"bg-surface")][1]');

async function expectLatestAssistantMessage(page: Page, text: RegExp | string) {
  await expect(latestAssistantBubble(page)).toContainText(text, {
    timeout: 60_000,
  });
}

async function expectLatestSystemMessage(page: Page, text: RegExp | string) {
  await expect(latestSystemBubble(page)).toContainText(text, {
    timeout: 15_000,
  });
}

async function expectLatestToastMessage(page: Page, text: RegExp | string) {
  await expect(latestToast(page)).toContainText(text, {
    timeout: 15_000,
  });
}

async function publishSystemEvent(
  request: APIRequestContext,
  eventType:
    | 'connected_network_type'
    | 'device_reachability'
    | 'geofence'
    | 'incoming_webrtc'
    | 'connectivity_insight',
) {
  const response = await request.post(`${BACKEND_URL}/api/events/publish`, {
    data: { event_type: eventType },
  });

  expect(response.ok()).toBeTruthy();
  await expect
    .poll(async () => response.json(), {
      message: `event ${eventType} should be published successfully`,
    })
    .toMatchObject({
      status: 'published',
      event_type: eventType,
    });
}

test.describe('Typical operator mission flow', () => {
  test('behaves as documented from setup through mission completion', async ({
    page,
    request,
  }) => {
    test.setTimeout(600_000);

    const chatbot = new ChatbotPage(page);

    await test.step('Given the dashboard starts in normal mode', async () => {
      await chatbot.goto();

      await expect(page.locator('h1')).toContainText('Emergency Response Center');
      await chatbot.expectNormalMode();
      await expect(page.getByText('Drone Network Status')).toBeVisible();
      await expect(page.getByText('AI Agent Assistant')).toBeVisible();
      await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
      await expect(latestAssistantBubble(page)).toContainText('How can I assist you?');
    });

    await test.step('When the operator conducts a preflight integrity check', async () => {
      await chatbot.sendSlashCommand('/preflight-check');

      await expectLatestAssistantMessage(
        page,
        /numberVerified|simSwapped|deviceSwapped|integrity|preflight/i,
      );
    });

    await test.step('And checks the connected network type', async () => {
      await chatbot.sendSlashCommand('/check-network-status');

      await expectLatestAssistantMessage(
        page,
        /reachable|connectivity|connectedNetworkType|5G|DATA/i,
      );
    });

    await test.step('And subscribes to network change events', async () => {
      await chatbot.sendSlashCommand('/subscribe-network-change');

      await expectLatestAssistantMessage(page, /subscription_id|Network Type/i);
    });

    await test.step('Then simulated network events are surfaced in the UI', async () => {
      await publishSystemEvent(request, 'connected_network_type');
      await expectLatestToastMessage(page, 'Device connected network type changed');
      await expectLatestSystemMessage(
        page,
        '📶 Device connected network type changed from 5G to 4G',
      );

      await publishSystemEvent(request, 'device_reachability');
      await expectLatestToastMessage(page, 'Device reachability status changed');
      await expectLatestSystemMessage(
        page,
        '📡 Device reachability changed from true to false',
      );
    });

    await test.step('When the operator reviews available QoS profiles', async () => {
      await chatbot.sendSlashCommand('/qos');

      await expectLatestAssistantMessage(page, /QOS_H|QOS_M|QOS_L/i);
    });

    await test.step('And reports a bushfire incident', async () => {
      await chatbot.sendSlashCommand(
        '/report 1234 Mount Dandenong Tourist Rd, Kalorama VIC 3766',
      );

      await expectLatestAssistantMessage(page, /-37\.|144\.|coordinate|location|geocod/i);
      await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2, {
        timeout: 15_000,
      });
    });

    await test.step('And creates a 200m geofence around the incident', async () => {
      await chatbot.sendSlashCommand('/subscribe-geofence 200');

      await expectLatestAssistantMessage(page, /subscription_id|radius|200/i);
      await expect(page.locator('.leaflet-overlay-pane svg path').first()).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step('Then geofence alerts and location verification update the mission map', async () => {
      await publishSystemEvent(request, 'geofence');
      await expectLatestToastMessage(page, 'Geofencing boundary breach detected');
      await expectLatestSystemMessage(page, '⚠️ Geofence boundary breach detected');

      await chatbot.sendSlashCommand('/verify-location');

      await expectLatestAssistantMessage(
        page,
        /verificationResult|lastLocationTime|verified|arrived/i,
      );
      await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2, {
        timeout: 15_000,
      });
      await expect(page.locator('.leaflet-pane canvas').first()).toBeVisible({
        timeout: 35_000,
      });
    });

    await test.step('When the operator discovers the closest edge node and deploys edge analysis', async () => {
      await chatbot.sendSlashCommand('/edge-discovery');

      await expectLatestAssistantMessage(
        page,
        /edgeCloudZoneName|edgeCloudProvider|edge node|zone/i,
      );
      await expect(page.locator('.leaflet-marker-icon')).toHaveCount(3, {
        timeout: 15_000,
      });

      await chatbot.sendSlashCommand('/deploy-edge-application');

      await expectLatestAssistantMessage(
        page,
        /deployment_id|status|deployed|fire-spread-prediction/i,
      );
    });

    await test.step('And switches the dashboard into emergency mode', async () => {
      await chatbot.activateEmergencyMode();

      await expect(page.getByText('Live Video Stream')).toBeVisible();
      await expect(page.getByText('Active Subscriptions')).toBeVisible();
      await expect(page.getByText('Drone Telemetry')).toBeVisible();
      await expect(page.getByText('Network Metrics')).toBeVisible();
      await expect(page.getByText('Edge Node Analysis')).toBeVisible();
      await expect(edgeAnalysisPanel(page).getByText('Edge Node Discovered')).toBeVisible();
      await expect(edgeAnalysisPanel(page).getByText('Application Deployed')).toBeVisible();
      await expect(
        activeSubscriptionsPanel(page).getByText('WebRTC', { exact: true }),
      ).toBeVisible();
      await expect(
        activeSubscriptionsPanel(page).getByText('Geofencing', { exact: true }),
      ).toBeVisible();
      await expect(
        activeSubscriptionsPanel(page).getByText('Network Type & Reachability', {
          exact: true,
        }),
      ).toBeVisible();
      await expect(statusIndicator(page, 'Drone Active')).toHaveClass(/bg-success/);
      await expect(statusIndicator(page, 'Stream Active')).toHaveClass(/bg-gray-500/);
      await expect(page.getByText('Stream Inactive')).toBeVisible();
    });

    await test.step('Then an incoming WebRTC event can be accepted into an active stream', async () => {
      await publishSystemEvent(request, 'incoming_webrtc');
      await expectLatestToastMessage(page, 'Incoming WebRTC call from drone-001');
      await expectLatestSystemMessage(page, '📞 Incoming WebRTC call from drone-001');

      await chatbot.sendSlashCommand('/accept-webrtc-call');

      await expectLatestAssistantMessage(page, /webrtc|session|accepted|media/i);
      await expect(page.getByText('LIVE', { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await expect(statusIndicator(page, 'Stream Active')).toHaveClass(/bg-success/, {
        timeout: 15_000,
      });
      await expect(
        activeSubscriptionsPanel(page).getByText('Connectivity Insights', {
          exact: true,
        }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Flight Data')).toBeVisible({ timeout: 15_000 });
    });

    await test.step('When the operator creates a QoD session using QOS_M', async () => {
      await chatbot.sendSlashCommand('/create-qod QOS_M');

      await expectLatestAssistantMessage(page, /session_id|status|QOS_M|active/i);
      await expect(page.getByText('Active Profile:')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('QOS_M').first()).toBeVisible({ timeout: 15_000 });
    });

    await test.step('Then degraded connectivity insight events appear during the mission', async () => {
      await publishSystemEvent(request, 'connectivity_insight');
      await expectLatestToastMessage(page, 'Video streaming connectivity QoS breached');
      await expectLatestSystemMessage(page, '⚡ Video streaming connectivity QoS breached');
    });

    await test.step('When the operator upgrades QoD to QOS_H', async () => {
      await chatbot.sendSlashCommand('/create-qod QOS_H');

      await expectLatestAssistantMessage(page, /session_id|status|QOS_H|active/i);
      await expect(page.getByText('QOS_H').first()).toBeVisible({ timeout: 15_000 });
    });

    await test.step('And undeploys the edge application', async () => {
      await chatbot.sendSlashCommand('/undeploy-edge-application');

      await expectLatestAssistantMessage(page, /undeploy|removed|success/i);
      await expect(edgeAnalysisPanel(page).getByText('Edge Node Discovered')).toBeVisible({
        timeout: 15_000,
      });
      await expect(edgeAnalysisPanel(page).getByText('Application Deployed')).toHaveCount(0, {
        timeout: 15_000,
      });
      await expect(edgeAnalysisPanel(page).getByText('Fire Spread Prediction')).toHaveCount(0, {
        timeout: 15_000,
      });
    });

    await test.step('And terminates the WebRTC call', async () => {
      await chatbot.sendSlashCommand('/terminate-webrtc-call');

      await expectLatestAssistantMessage(page, /terminate|cancel|webrtc|session/i);
      await expect(page.getByText('Stream Inactive')).toBeVisible({ timeout: 15_000 });
      await expect(statusIndicator(page, 'Stream Active')).toHaveClass(/bg-gray-500/, {
        timeout: 15_000,
      });
      await expect(
        activeSubscriptionsPanel(page).getByText('Connectivity Insights', {
          exact: true,
        }),
      ).toHaveCount(0, { timeout: 15_000 });
      await expect(page.getByText('Flight Data')).toHaveCount(0, {
        timeout: 15_000,
      });
    });

    await test.step('And removes the geofence and network monitoring subscriptions', async () => {
      await chatbot.sendSlashCommand('/unsubscribe-geofence');
      await expectLatestAssistantMessage(page, /unsubscribe|removed|geofence|success/i);
      await expect(
        activeSubscriptionsPanel(page).getByText('Geofencing', { exact: true }),
      ).toHaveCount(0, { timeout: 15_000 });

      await chatbot.sendSlashCommand('/unsubscribe-network-change');
      await expectLatestAssistantMessage(page, /unsubscribe|removed|network|success/i);
      await expect(
        activeSubscriptionsPanel(page).getByText('Network Type & Reachability', {
          exact: true,
        }),
      ).toHaveCount(0, { timeout: 15_000 });
    });

    await test.step('Then mission completion resets the dashboard back to its default state', async () => {
      await chatbot.sendSlashCommand('/mission-complete');

      await chatbot.expectNormalMode();
      await expect(page.getByText('Drone Network Status').first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1, {
        timeout: 15_000,
      });
      await expect(latestAssistantBubble(page)).toContainText('How can I assist you?', {
        timeout: 15_000,
      });
      await expect(chatbotRoot(page).locator('.bg-background.self-start')).toHaveCount(1, {
        timeout: 15_000,
      });
    });
  });
});
