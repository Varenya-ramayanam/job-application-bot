// ✅ LinkedIn Easy Apply Bot — Dynamic config.json
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const { saveToDb } = require("../controllers/saveToDbController");

// ✅ Load config
const configPath = path.join(__dirname, "../config.json");
if (!fs.existsSync(configPath)) throw new Error("config.json not found!");

const {
  baseURL,
  email,
  password,
  location,
  Period,
  ChromePath,
  resolution,
  phoneNumber,
  keywords,
  AvgExperience,
  numberOfPagination,
  numberOfOffersPerPage,
} = JSON.parse(fs.readFileSync(configPath, "utf8"));

let browser, page;

const MAX_APPLICATIONS = numberOfPagination * numberOfOffersPerPage;
let totalApplied = 0;

// 🔹 Stable job card selector
const jobCardSelector = "div.job-card-container--clickable";

// Add waitForTimeout if missing
if (!puppeteer.Page.prototype.waitForTimeout) {
  puppeteer.Page.prototype.waitForTimeout = function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
}

async function launchBrowser() {
  browser = await puppeteer.launch({
    headless: false,
    executablePath: ChromePath,
    args: [resolution],
    defaultViewport: null,
  });
  page = (await browser.pages())[0];
  page.setDefaultNavigationTimeout(60000);
  console.log("[INFO] Browser launched");
  await page.goto(baseURL, { waitUntil: "networkidle2" });
}

async function loginLinkedIn() {
  console.log("[INFO] Logging in...");
  await page.waitForSelector(
    'input[id="username"], input[name="session_key"]',
    { timeout: 20000 }
  );
  await page.type('input[id="username"], input[name="session_key"]', email, {
    delay: 50,
  });
  await page.type(
    'input[id="password"], input[name="session_password"]',
    password,
    { delay: 50 }
  );

  await Promise.all([
    page.keyboard.press("Enter"),
    Promise.race([
      page
        .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
        .catch(() => {}),
      page
        .waitForSelector(
          '[aria-label="Search by title, skill, or company"], .global-nav__me-photo',
          { timeout: 30000 }
        )
        .catch(() => {}),
    ]),
  ]);

  if (page.url().includes("checkpoint"))
    throw new Error("Login blocked (captcha/verification)");

  const loginError = await page.$(".form__label--error, .alert.error");
  if (loginError) throw new Error("Login failed — check credentials");

  console.log("[SUCCESS] Logged in");
}

async function searchJobs(keyword) {
  console.log(`[INFO] Searching jobs for: ${keyword}`);
  await page.goto("https://www.linkedin.com/jobs/search", {
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector(
    'input[aria-label="Search by title, skill, or company"]',
    { timeout: 15000 }
  );
  await page.click('input[aria-label="Search by title, skill, or company"]', {
    clickCount: 3,
  });
  await page.type(
    'input[aria-label="Search by title, skill, or company"]',
    keyword,
    { delay: 50 }
  );

  await page.waitForSelector('input[aria-label="City, state, or zip code"]', {
    timeout: 15000,
  });
  await page.click('input[aria-label="City, state, or zip code"]', {
    clickCount: 3,
  });
  await page.type('input[aria-label="City, state, or zip code"]', location, {
    delay: 50,
  });

  await page.keyboard.press("Enter");
  await page.waitForSelector(jobCardSelector, { timeout: 30000 });
  await autoScroll();
}

async function autoScroll() {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

// Filters
async function applyFilters() {
  console.log("[INFO] Applying filters...");
  try {
    await page.waitForTimeout(1500);

    const dateFilter = await page.$('button[aria-label^="Date posted filter"]');
    if (dateFilter) {
      await dateFilter.click();
      await page.waitForTimeout(500);
      const timeOption =
        Period === "Past 24 hours"
          ? 'label[for="timePostedRange-r86400"]'
          : 'label[for="timePostedRange-r604800"]';
      if (await page.$(timeOption)) await page.click(timeOption);
      await dateFilter.click();
    }

    console.log("[INFO] Filters applied & results loaded");
  } catch (err) {
    console.warn("[WARN] Filter application failed:", err.message);
  }
}

async function applyToJobs() {
  let pageApplied = 0;

  const jobs = await page.$$(jobCardSelector);
  for (const [index, job] of jobs.entries()) {
    try {
      await job.click();
      await page.waitForTimeout(2500);

      const jobTitle = await page.evaluate(() => {
        const el = document.querySelector("h1");
        return el ? el.innerText.trim() : "Unknown Title";
      });

      const company = await page.evaluate(() => {
        const el = document.querySelector(
          ".job-details-jobs-unified-top-card__company-name a"
        );
        return el ? el.innerText.trim() : "Unknown Company";
      });

      const jobLink = await page.evaluate(() => window.location.href);
      const portal = "LinkedIn";

      const easyApplyBtn = await page.$(
        'button.jobs-apply-button, button[aria-label="Easy Apply"], button[data-control-name="jobdetails_topcard_inapply"]'
      );

      if (easyApplyBtn) {
        console.log(`[INFO] Easy Apply job found at index ${index + 1}`);
        await easyApplyBtn.click();
        await page.waitForTimeout(2000);

        const applied = await handleApplicationForm();
        if (applied) {
          totalApplied++;
          pageApplied++;

          try {
            await saveToDb({
              jobTitle,
              company,
              jobLink,
              portal,
              status: "applied",
            });
            console.log(`[DB] Saved application → ${jobTitle} at ${company}`);
          } catch (err) {
            console.error("Error saving application to DB:", err);
          }
        }

        const dismiss = await page.$(
          'button[aria-label="Dismiss"], button[aria-label="Close"]'
        );
        if (dismiss) {
          await dismiss.click();
          await page.waitForTimeout(1000);
        }
      } else {
        console.log(`[SKIP] No Easy Apply for job ${index + 1}`);
      }
    } catch (err) {
      console.error(`[ERROR] Job index ${index + 1} failed:`, err.message);
    }

    if (totalApplied >= MAX_APPLICATIONS) break;
  }

  console.log(`[INFO] Applied to ${pageApplied} jobs this search`);
}

async function handleApplicationForm() {
  try {
    const MAX_FORM_TIME = 20000;
    const startTime = Date.now();

    while (true) {
      await page.waitForTimeout(1200);

      if (Date.now() - startTime > MAX_FORM_TIME) {
        console.log("[SKIP] Form took too long — skipping job");
        const closeBtn = await page.$("button.artdeco-modal__dismiss");
        if (closeBtn) await closeBtn.click();
        return false;
      }

      const inputs = await page.$$("input.artdeco-text-input--input");
      for (const input of inputs) {
        try {
          const { label, val } = await page.evaluate((el) => {
            const labelEl =
              el.closest("label") || el.parentElement?.querySelector("label");
            return {
              label: labelEl ? labelEl.innerText.toLowerCase() : "",
              val: el.value.trim(),
            };
          }, input);

          if (!val) {
            await input.click({ clickCount: 3 });
            if (label.includes("salary")) {
              await input.type("1000000", { delay: 50 });
            } else if (label.includes("experience")) {
              await input.type(`${AvgExperience}`, { delay: 50 });
            } else {
              await input.type("1", { delay: 50 });
            }
          }
        } catch {}
      }

      const nextBtn = await page.$(
        'button[aria-label="Continue to next step"], button[aria-label="Next"], button[aria-label="Review your application"]'
      );
      if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
        continue;
      }

      break;
    }

    const submitBtn = await page.$(
      'button[aria-label="Submit application"], button[data-control-name="submit_unify"]'
    );
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      const success = await page.$(".artdeco-toast-item, .application-outlet");
      if (success) return true;
    }

    return false;
  } catch (err) {
    console.error("[ERROR] Application form failed:", err.message);
    return false;
  }
}

module.exports.applyJobs = async (req, res) => {
  try {
    await launchBrowser();
    await loginLinkedIn();

    for (const keyword of keywords) {
      if (totalApplied >= MAX_APPLICATIONS) break;
      await searchJobs(keyword);
      await applyFilters();
      await applyToJobs();
    }

    res.status(200).json({ message: `Applied to ${totalApplied} jobs` });
  } catch (err) {
    console.error("[FATAL] Bot crashed:", err.message);
    res
      .status(500)
      .json({ error: "Job application failed", details: err.message });
  } finally {
    if (browser) await browser.close();
  }
};
