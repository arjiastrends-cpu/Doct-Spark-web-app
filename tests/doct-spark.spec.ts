import { test, expect } from '@playwright/test';

test.describe('DOCT SPARK - Core Workflows and UI Safety', () => {

  test('Login and role-based dashboard redirection', async ({ page }) => {
    await page.goto('/');
    
    // Check if Landing Page works
    await expect(page).toHaveTitle(/DOCT SPARK/i);

    // Navigate to Login
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login.*/);

    // Log in as Super Admin Test account
    await page.fill('input[type="email"]', 'maidulsrkr@gmail.com');
    await page.fill('input[type="password"]', '123456789');
    await page.click('button[type="submit"]');

    // Confirm redirected to Super Admin Console
    await expect(page.locator('text=Super Admin Panel')).toBeVisible();
  });

  test('Protected routes and unauthorized access protection', async ({ page }) => {
    // Attempting direct entry to admin features without authentication should bounce/shield
    await page.goto('/#superadmin-dashboard');
    const hasWarning = await page.locator('text=Access Denied|Login|Sign In').isVisible();
    expect(hasWarning).toBeTruthy();
  });

  test('Patient Appointment booking flow with Wallet Payment', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    
    // Log in as test patient
    await page.fill('input[type="email"]', 'test-patient-batch-1@doctspark.test');
    await page.fill('input[type="password"]', '123456789');
    await page.click('button[type="submit"]');
    
    // Verify dashboard displays patient's specific panels
    await expect(page.locator('text=Patient Dashboard')).toBeVisible();

    // Click Book Appointment
    await page.click('text=Book Appointment');
    
    // Complete booking flow steps
    await page.click('text=General Physician');
    await page.click('.doctor-card-select-btn >> nth=0');
    await page.click('text=In-Clinic Consultation');
    await page.click('.slot-btn >> nth=0');
    await page.fill('textarea[name="reason"]', 'Synthetic automated testing consult');
    await page.click('text=Pay via Wallet');
    await page.click('text=Confirm Appointment');

    // Confirm Booking Completed Successfully
    await expect(page.locator('text=Appointment Confirmed|Success')).toBeVisible();
  });

  test('Responsive Viewports & UI Overlap Checks', async ({ page }, testInfo) => {
    await page.goto('/');
    
    // Detect viewport problems dynamically
    const overflowX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflowX).toBeFalsy();

    // Detect duplicate headers
    const headerCount = await page.evaluate(() => {
      return document.querySelectorAll('header, #dashboard-header').length;
    });
    expect(headerCount).toBeLessThanOrEqual(1);

    // Detect overlapping elements or duplicate menus
    const multipleMobileMenus = await page.evaluate(() => {
      return document.querySelectorAll('.mobile-drawer, [aria-label="Mobile menu"]').length > 1;
    });
    expect(multipleMobileMenus).toBeFalsy();
  });
});
