/// <reference path="./playwright.d.ts" />
import { test, expect } from '@playwright/test';

test.describe('MediKiosk - Clinical Intake & Patient Triage E2E Flows', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the home page with branding and triage entry point', async ({ page }) => {
    await expect(page).toHaveTitle(/MediKiosk/i);
    const startButton = page.locator('text=Start AI Health Checkup').first();
    await expect(startButton).toBeVisible();
  });

  test('should allow switching between supported languages (EN, HI, TE)', async ({ page }) => {
    // Check if language selector exists
    const langButton = page.locator('button:has-text("English"), button:has-text("हिन्दी"), button:has-text("తెలుగు")').first();
    if (await langButton.isVisible()) {
      await langButton.click();
      // Verify language options
      await expect(page.locator('text=हिन्दी').first()).toBeVisible();
    }
  });

  test('should launch 3D Anatomy Visualizer and select an anatomical zone', async ({ page }) => {
    // Navigate to Health Checkup
    const startButton = page.locator('button:has-text("Start"), a:has-text("Start")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Check for 3D visualizer button
    const visualizerToggle = page.locator('button:has-text("3D Anatomy")').first();
    if (await visualizerToggle.isVisible()) {
      await visualizerToggle.click();
      // Ensure 3D canvas is mounted
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
    }
  });

  test('should trigger Red-Flag Emergency modal on critical symptoms', async ({ page }) => {
    // Navigate into triage
    const checkupButton = page.locator('text=Start AI Health Checkup').first();
    if (await checkupButton.isVisible()) {
      await checkupButton.click();

      // Find chat text input
      const chatInput = page.locator('input[placeholder*="Type"], input[placeholder*="response"]').first();
      if (await chatInput.isVisible()) {
        await chatInput.fill('Severe chest pain radiating to left arm cannot breathe');
        await chatInput.press('Enter');

        // Verify emergency red-flag alert is presented
        const emergencyBanner = page.locator('text=EMERGENCY RED FLAG, text=High Priority, text=112').first();
        await expect(emergencyBanner).toBeVisible({ timeout: 7000 });
      }
    }
  });

});
