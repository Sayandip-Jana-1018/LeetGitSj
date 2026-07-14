/**
 * LeetCode Auto-Login via Playwright
 *
 * Runs in the background worker process. Uses Playwright Core (Chromium).
 * Explicitly aborts on CAPTCHAs and never stores the password.
 */

import { chromium } from "playwright-core";
import { verifyCredentials } from "./leetcode";

export interface AutoLoginResult {
  session: string;
  csrfToken: string;
  username: string;
}

export async function autoLoginLeetCode(
  usernameInput: string,
  passwordInput: string
): Promise<AutoLoginResult> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // 1. Navigate to login
    await page.goto("https://leetcode.com/accounts/login/", {
      waitUntil: "networkidle",
      timeout: 15000,
    });

    // 2. Fill credentials
    await page.fill('input[name="login"]', usernameInput);
    await page.fill('input[name="password"]', passwordInput);

    // 3. Submit and wait for response
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]);

    // 4. Check for CAPTCHA or failure
    const url = page.url();
    if (url.includes("/login")) {
      // Still on login page — either bad password or invisible captcha
      const errorText = await page.locator(".error-message, .form-error").textContent().catch(() => null);
      if (errorText && errorText.toLowerCase().includes("password")) {
        throw new Error("Invalid username or password.");
      }
      throw new Error(
        "Login failed. LeetCode may have requested a CAPTCHA or additional verification. Please use the Manual Connect method."
      );
    }

    // 5. Extract Cookies
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === "LEETCODE_SESSION");
    const csrfCookie = cookies.find((c) => c.name === "csrftoken");

    if (!sessionCookie || !csrfCookie) {
      throw new Error("Failed to extract LEETCODE_SESSION and csrftoken cookies after login.");
    }

    // 6. Verify they work
    const profile = await verifyCredentials(sessionCookie.value, csrfCookie.value);

    return {
      session: sessionCookie.value,
      csrfToken: csrfCookie.value,
      username: profile.username,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error("Login timed out. LeetCode may have presented a CAPTCHA. Please use Manual Connect.");
    }
    throw err;
  } finally {
    await browser.close();
  }
}
