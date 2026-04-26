import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the disaster response dashboard.
 * Wraps common interactions with the AI chatbot and dashboard UI.
 */
export class ChatbotPage {
  readonly page: Page;
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly chatMessages: Locator;
  readonly emergencyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatInput = page.locator('textarea').last();
    this.sendButton = page.locator('button[type="submit"], button').filter({ hasText: '' }).last();
    this.chatMessages = page.locator('[class*="message"], [class*="chat"]');
    this.emergencyButton = page.locator('button').filter({ hasText: /Emergency Mode|Exit Emergency/i });
  }

  async goto() {
    await this.page.goto('/');
    // Wait for the chatbot textarea to be ready
    await this.chatInput.waitFor({ state: 'visible' });
  }

  /**
   * Send a message via the chatbot input and wait for the AI response to complete.
   * "Complete" means the typing indicator disappears and a new assistant message appears.
   */
  async sendMessage(text: string) {
    await this.chatInput.fill(text);
    // Dismiss any slash command suggestion dropdown before submitting
    await this.chatInput.press('Escape');
    await this.chatInput.press('Enter');
    // Wait for typing indicator to appear then disappear (AI is responding)
    await this.page.waitForSelector('[class*="typing"], [class*="loader"], .animate-spin', {
      state: 'visible',
      timeout: 10_000,
    }).catch(() => {/* typing indicator may flash too fast */});
    await this.page.waitForSelector('[class*="typing"], [class*="loader"], .animate-spin', {
      state: 'hidden',
      timeout: 60_000,
    });
  }

  /**
   * Send a slash command (e.g. '/preflight-check') and wait for response.
   */
  async sendSlashCommand(command: string) {
    await this.sendMessage(command);
  }

  /**
   * Assert that the last assistant message contains the given text (case-insensitive).
   */
  async expectLastResponseToContain(text: string) {
    // Assistant messages are the last non-user message bubbles
    const lastMessage = this.page.locator('[class*="assistant"], [class*="bot"]').last();
    await expect(lastMessage).toContainText(text, { ignoreCase: true, timeout: 30_000 });
  }

  /**
   * Manually activate emergency mode by clicking the header button.
   * Call this after reporting an incident (the dashboard does NOT auto-switch).
   */
  async activateEmergencyMode() {
    await this.emergencyButton.click();
    await this.expectEmergencyMode();
  }

  /**
   * Assert the dashboard is in normal (non-emergency) mode.
   */
  async expectNormalMode() {
    await expect(this.emergencyButton).toContainText('Emergency Mode', { timeout: 10_000 });
  }

  /**
   * Assert the dashboard is in emergency mode.
   */
  async expectEmergencyMode() {
    await expect(this.emergencyButton).toContainText('Exit Emergency', { timeout: 30_000 });
  }

  /**
   * Wait for a map marker/element matching the given test-id or text to appear.
   */
  async expectMapElementVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible({ timeout: 30_000 });
  }
}
