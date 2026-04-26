import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../fixtures/app.fixture';

test('full disaster response flow', async ({ page }) => {
  test.setTimeout(300_000); // 5 min for the entire flow

  const chatbot = new ChatbotPage(page);
  await chatbot.goto();

  // --- 01: Normal mode ---
  await expect(page.locator('h1')).toContainText('Emergency Response Center');
  await chatbot.expectNormalMode();
  await expect(page.getByText('Drone Network Status')).toBeVisible();
  await expect(page.getByText('AI Agent Assistant')).toBeVisible();

  // --- 02: Preflight integrity check ---
  await chatbot.sendSlashCommand('/preflight-check');
  await expect(page.locator('.bg-background.self-start, .bg-background.p-3').last())
    .toContainText(/number verif|sim swap|device swap|integrity|preflight/i, { timeout: 60_000 });

  // --- 03: Report incident ---
  await chatbot.sendSlashCommand('/report 1234 Mount Dandenong Tourist Rd, Kalorama VIC 3766');
  await expect(page.locator('.bg-background.self-start, .bg-background.p-3').last())
    .toContainText(/\-37\.|144\.|coordinate|location|geocod/i, { timeout: 60_000 });
  await chatbot.activateEmergencyMode();
  await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible({ timeout: 15_000 });

  // --- 04: Edge discovery + deploy ---
  await chatbot.sendSlashCommand('/verify-location');
  await expect(page.locator('.bg-background.self-start, .bg-background.p-3').last())
    .toContainText(/verif|location|arrived|drone/i, { timeout: 60_000 });

  await chatbot.sendSlashCommand('/edge-discovery');
  await expect(page.locator('.bg-background.self-start, .bg-background.p-3').last())
    .toContainText(/edge|zone|node/i, { timeout: 60_000 });

  await chatbot.sendSlashCommand('/deploy-edge-application');
  await expect(page.locator('.bg-background.self-start, .bg-background.p-3').last())
    .toContainText(/deploy|fire.spread|prediction|model/i, { timeout: 60_000 });
  await expect(page.getByText(/deployment|edge.*analysis|fire.*spread/i).first()).toBeVisible({ timeout: 15_000 });

  // --- 05: WebRTC + QoD ---
  await chatbot.sendSlashCommand('/accept-webrtc-call');
  await expect(page.locator('.bg-background.self-start, .bg-background.p-3').last())
    .toContainText(/webrtc|session|call|accept/i, { timeout: 60_000 });
  await expect(page.getByText('Stream Active')).toBeVisible({ timeout: 15_000 });

  await chatbot.sendSlashCommand('/create-qod QOS_M');
  await expect(page.locator('.bg-background.self-start, .bg-background.p-3').last())
    .toContainText(/QOS_M|quality|demand|session/i, { timeout: 60_000 });
  await expect(page.getByText('QOS_M').first()).toBeVisible({ timeout: 15_000 });

  // --- 06: SSE monitoring (location + device count heatmap) ---
  await expect(page.getByText(/\-37\.\d|144\.\d/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.leaflet-heatmap-layer, canvas').first()).toBeVisible({ timeout: 35_000 });

  // --- 07: Mission complete cleanup ---
  await chatbot.sendSlashCommand('/subscribe-geofence 200');
  await page.locator('.bg-background.self-start, .bg-background.p-3').last()
    .waitFor({ state: 'visible', timeout: 60_000 });

  await chatbot.sendSlashCommand('/subscribe-network-change');
  await page.locator('.bg-background.self-start, .bg-background.p-3').last()
    .waitFor({ state: 'visible', timeout: 60_000 });

  await chatbot.sendSlashCommand('/terminate-webrtc-call');
  await page.locator('.bg-background.self-start, .bg-background.p-3').last()
    .waitFor({ state: 'visible', timeout: 60_000 });

  await chatbot.sendSlashCommand('/undeploy-edge-application');
  await page.locator('.bg-background.self-start, .bg-background.p-3').last()
    .waitFor({ state: 'visible', timeout: 60_000 });

  await chatbot.sendSlashCommand('/unsubscribe-geofence');
  await page.locator('.bg-background.self-start, .bg-background.p-3').last()
    .waitFor({ state: 'visible', timeout: 60_000 });

  await chatbot.sendSlashCommand('/unsubscribe-network-change');
  await page.locator('.bg-background.self-start, .bg-background.p-3').last()
    .waitFor({ state: 'visible', timeout: 60_000 });

  await chatbot.sendSlashCommand('/mission-complete');
  await chatbot.expectNormalMode();
  await expect(page.getByText('Drone Network Status').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1, { timeout: 10_000 });
});
