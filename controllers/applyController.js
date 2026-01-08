const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");
const fs = require("fs");
const { saveToDb } = require("../controllers/saveToDbController");

puppeteer.use(StealthPlugin());

// ✅ Load config
const configPath = path.join(__dirname, "../config.json");
if (!fs.existsSync(configPath)) throw new Error("config.json not found!");

const {
  email, password, location, Period, ChromePath,
  resolution, numberOfPagination, numberOfOffersPerPage,
} = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Override keywords
const targetKeywords = ["software developer", "MERN stack developer", "backend dev", "frontend dev"];

let browser, page;
const MAX_APPLICATIONS = numberOfPagination * numberOfOffersPerPage;
let totalApplied = 0;

const selectors = {
  jobCard: ".scaffold-layout__list-item, .job-card-container--clickable",
  easyApplyBtn: "div.jobs-apply-button--top-card button.jobs-apply-button.artdeco-button.artdeco-button--3.artdeco-button--primary.ember-view",
  nextBtn: "button[aria-label*='next'], button[aria-label*='Review'], button[aria-label*='Continue']",
  submitBtn: "button[aria-label*='Submit application'], button[data-control-name='submit_unify'], button[aria-label*='Send application']",
  dismissBtn: "button[aria-label*='Dismiss'], .artdeco-modal__dismiss",
  textInput: "input.artdeco-text-input--input, .artdeco-text-input--input, input[type='text']",
  radioLabel: "label[for*='radio'], .fb-radio-button__label",
  select: "select" // Added for dropdowns
};

async function launchBrowser() {
  browser = await puppeteer.launch({
    headless: false,
    executablePath: ChromePath,
    args: [
      `--window-size=${resolution.split('x')[0] || 1920},${resolution.split('x')[1] || 1080}`,
      "--disable-blink-features=AutomationControlled", 
      "--no-sandbox"
    ],
    defaultViewport: null,
  });
  
  page = (await browser.pages())[0];
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  page.setDefaultNavigationTimeout(60000);
  console.log("[INFO] Browser launched with Stealth mode");
}

async function loginLinkedIn() {
  console.log("[INFO] Logging in...");
  await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });
  await page.type('#username', email, { delay: 100 });
  await page.type('#password', password, { delay: 100 });
  
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {})
  ]);

  if (page.url().includes("checkpoint")) {
    console.log("[ACTION] Manual verification required.");
    await page.waitForNavigation({ timeout: 0 }); 
  }
}

async function searchJobs(keyword) {
  const timeFilter = Period === "Past 24 hours" ? "r86400" : "r604800";
  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&f_TPR=${timeFilter}&f_AL=true&f_E=1&sortBy=DD`;
  
  console.log(`[INFO] Searching URL: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

  try {
    await page.waitForSelector(selectors.jobCard, { timeout: 20000 });
    await page.evaluate(() => {
        const list = document.querySelector('.jobs-search-results-list');
        if (list) list.scrollTo(0, 5000);
    });
  } catch (e) {
    console.log("[WARN] No jobs found.");
  }
}

async function handleApplicationForm() {
  let steps = 0;
  while (steps < 15) {
    steps++;
    await new Promise(r => setTimeout(r, 2000));

    // 1. Handle Text Inputs
    const inputs = await page.$$(selectors.textInput);
    for (const input of inputs) {
      const isFilled = await page.evaluate(el => el.value.length > 0, input);
      if (!isFilled) {
        const label = await page.evaluate(el => {
            const container = el.closest('div.jobs-easy-apply-form-section__grouping') || el.closest('div');
            return container ? container.innerText.toLowerCase() : "";
        }, input);

        let val = "1";
        if (label.includes("experience") || label.includes("years") || label.includes("programming")) {
            val = "2";
        } else if (label.includes("salary") || label.includes("expectation") || label.includes("ctc")) {
            val = "500000";
        }
        await input.type(val, { delay: 50 });
      }
    }

    // 2. Handle Dropdowns (Select Yes)
    const selects = await page.$$(selectors.select);
    for (const select of selects) {
      await page.evaluate(el => {
        const options = Array.from(el.options);
        const yesOption = options.find(opt => opt.text.toLowerCase().includes('yes'));
        if (yesOption) {
          el.value = yesOption.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, select);
    }

    // 3. Handle Radio Buttons
    const radios = await page.$$(selectors.radioLabel);
    for (let i = 0; i < radios.length; i += 2) {
      const isChecked = await page.evaluate(el => {
        const input = document.getElementById(el.getAttribute('for'));
        return input ? input.checked : false;
      }, radios[i]);
      if (!isChecked) await radios[i].click();
    }

    // 4. Navigation
    const submitBtn = await page.$(selectors.submitBtn);
    if (submitBtn) {
      await submitBtn.click();
      await new Promise(r => setTimeout(r, 3000));
      return true;
    }

    const nextBtn = await page.$(selectors.nextBtn);
    if (nextBtn) {
      await nextBtn.click();
    } else {
      break; 
    }
  }
  return false;
}

async function applyToJobs() {
  let jobs = await page.$$(selectors.jobCard);
  
  for (let i = 0; i < Math.min(jobs.length, numberOfOffersPerPage); i++) {
    if (totalApplied >= MAX_APPLICATIONS) break;

    try {
      jobs = await page.$$(selectors.jobCard);
      if (!jobs[i]) continue;
      await jobs[i].scrollIntoView();
      await jobs[i].click();
      await new Promise(r => setTimeout(r, 2500)); 

      const easyApplyBtn = await page.$(selectors.easyApplyBtn);
      if (easyApplyBtn) {
        await page.evaluate(btn => {
            btn.scrollIntoView();
            btn.click();
        }, easyApplyBtn);

        const jobTitle = await page.$eval("h2", el => el.innerText.trim()).catch(() => "Unknown Job");
        console.log(`[INFO] Applying: ${jobTitle}`);
        
        const success = await handleApplicationForm();
        if (success) {
          totalApplied++;
          await saveToDb({ jobTitle, status: "applied", portal: "LinkedIn" });
          console.log(`[SUCCESS] Applied (${totalApplied}/${MAX_APPLICATIONS})`);
        }

        const dismiss = await page.$(selectors.dismissBtn);
        if (dismiss) {
          await dismiss.click();
          await new Promise(r => setTimeout(r, 1000));
          const discard = await page.$("button[data-control-name='discard_application_confirm_btn']");
          if (discard) await discard.click();
        }
      }
    } catch (err) {
      console.error(`[ERROR] Job index ${i} failed:`, err.message);
    }
  }
}

module.exports.applyJobs = async (req, res) => {
  try {
    await launchBrowser();
    await loginLinkedIn();

    for (const keyword of targetKeywords) {
      if (totalApplied >= MAX_APPLICATIONS) break;
      await searchJobs(keyword);
      await applyToJobs();
    }

    res.status(200).json({ status: "Success", appliedCount: totalApplied });
  } catch (err) {
    console.error("[FATAL]", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
};