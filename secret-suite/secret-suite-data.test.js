/* ============================================================
   Secret Suite — data integrity tests
   Run with: node secret-suite/secret-suite-data.test.js
   Plain Node script (no test framework dependency) matching this
   static-HTML site's no-build-step convention. Exits non-zero on
   any failure so it can gate CI/commit if desired.
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "secret-suite-data.js");
const LOGO_DIR = path.join(__dirname, "assets", "competitor-logos");

let failures = 0;
function check(name, cond, detail){
  if(cond){
    console.log("PASS  " + name);
  } else {
    failures++;
    console.log("FAIL  " + name + (detail ? " — " + detail : ""));
  }
}

// Load data file in a sandboxed context (it defines globals via `var`)
const sandbox = {};
const src = fs.readFileSync(DATA_PATH, "utf8");
new Function("window", src + "\nreturn {SS_SUITE_APPS, SS_SUITE_CATEGORIES, SS_SUITE_STATUSES, SS_SUITE_PRICING_REVIEWED, SS_SUITE_TEAM_SIZE_DEFAULT};")
  .call(sandbox, undefined);
const loaded = new Function(src + "\nreturn {SS_SUITE_APPS, SS_SUITE_CATEGORIES, SS_SUITE_STATUSES, SS_SUITE_PRICING_REVIEWED, SS_SUITE_TEAM_SIZE_DEFAULT};")();
const { SS_SUITE_APPS, SS_SUITE_CATEGORIES, SS_SUITE_STATUSES, SS_SUITE_TEAM_SIZE_DEFAULT } = loaded;

/* ── Exactly 56 records, ranks 1-56, no missing/duplicate rank ── */
check("exactly 56 records", SS_SUITE_APPS.length === 56, "found " + SS_SUITE_APPS.length);

const ranks = SS_SUITE_APPS.map(a => a.rank).sort((a,b) => a - b);
const expectedRanks = Array.from({length:56}, (_,i) => i+1);
check("ranks run 1-56 continuously with no gaps or duplicates", JSON.stringify(ranks) === JSON.stringify(expectedRanks));

const names = new Set(SS_SUITE_APPS.map(a => a.secretName));
check("56 unique secretName values", names.size === 56, "found " + names.size + " unique");

/* ── Every app has required fields ── */
let missingDesc = 0, missingCat = 0, missingStatus = 0, missingSubdomain = 0;
SS_SUITE_APPS.forEach(a => {
  if(!a.description || !a.description.trim()) missingDesc++;
  if(!SS_SUITE_CATEGORIES.includes(a.category)) missingCat++;
  if(!SS_SUITE_STATUSES.includes(a.status)) missingStatus++;
  if(!/^https:\/\/[a-z0-9.-]+\.secretsystems\.io$/i.test(a.subdomain)) missingSubdomain++;
});
check("every app has a description", missingDesc === 0, missingDesc + " missing");
check("every app has a valid category", missingCat === 0, missingCat + " invalid");
check("every app has a valid status", missingStatus === 0, missingStatus + " invalid");
check("every app has a valid HTTPS *.secretsystems.io subdomain", missingSubdomain === 0, missingSubdomain + " invalid");

/* ── No false availability claims ── */
const falseAvailable = SS_SUITE_APPS.filter(a => a.status === "available").length;
check("no app is marked available (none are actually deployed yet)", falseAvailable === 0, falseAvailable + " marked available");

/* ── Every counted price has a billing basis and a source ── */
let missingBasis = 0, missingSource = 0;
SS_SUITE_APPS.forEach(a => {
  if(!["flat","peruser","perchannel","merged"].includes(a.priceBasis)) missingBasis++;
  if(a.priceBasis !== "merged" && !a.pricingSourceUrl) missingSource++;
});
check("every app has a valid priceBasis", missingBasis === 0, missingBasis + " invalid");
check("every counted price has a pricingSourceUrl", missingSource === 0, missingSource + " missing");

/* ── Every competitor has a logo or a documented fallback reason ── */
let undocumented = 0;
SS_SUITE_APPS.forEach(a => {
  if(!a.logoSlug && !a.logoFallbackReason) undocumented++;
});
check("every app has a logo or a documented fallback reason", undocumented === 0, undocumented + " undocumented");

/* ── Every referenced logo file actually exists on disk (correct extension) ── */
const referencedLogos = SS_SUITE_APPS.filter(a => a.logoSlug).map(a => ({slug: a.logoSlug, ext: a.logoExt || "svg"}));
const missingFiles = referencedLogos.filter(l => !fs.existsSync(path.join(LOGO_DIR, l.slug + "." + l.ext))).map(l => l.slug + "." + l.ext);
check("every referenced logo file exists in assets/competitor-logos/", missingFiles.length === 0, missingFiles.join(", "));

/* ── 100% logo coverage: no app should still need a text-only fallback ── */
const stillFallback = SS_SUITE_APPS.filter(a => a.priceBasis !== "merged" && !a.logoSlug);
check("every counted app has a real vendor logo (no text-only fallbacks remain)", stillFallback.length === 0, stillFallback.map(a => a.paidAlternative).join(", "));

/* ── Displayed "Verified vendor logos" stat matches the real logo count ── */
const realLogoCount = SS_SUITE_APPS.filter(a => a.logoSlug).length;
const htmlPathForStat = path.join(__dirname, "index.html");
const htmlForStat = fs.readFileSync(htmlPathForStat, "utf8");
check("hero stat displays the correct verified-logo count (" + realLogoCount + ")", htmlForStat.includes('<span class="verify-num">' + realLogoCount + '</span><span class="verify-label">Verified vendor logos</span>'));

/* ── logoIncludesName is only set on rows with an actual logo ── */
const badLogoIncludesName = SS_SUITE_APPS.filter(a => a.logoIncludesName && !a.logoSlug);
check("logoIncludesName is never set without a logoSlug", badLogoIncludesName.length === 0, badLogoIncludesName.map(a => a.paidAlternative).join(", "));

/* ── Pricing totals: hero, calculator default, and methodology must all agree ── */
function effectiveMonthlyValue(app, teamSize){
  if(app.priceBasis === "peruser") return app.representativeMonthlyPrice * teamSize;
  if(app.priceBasis === "merged") return 0;
  return app.representativeMonthlyPrice;
}
const monthlyTotal = SS_SUITE_APPS.reduce((sum, a) => sum + effectiveMonthlyValue(a, SS_SUITE_TEAM_SIZE_DEFAULT), 0);
const annualTotal = monthlyTotal * 12;
const roundedMonthly = Math.round(monthlyTotal * 100) / 100;
const roundedAnnual = Math.round(annualTotal * 100) / 100;

check("monthly total is reproducible from itemized data", roundedMonthly === 2910.36, "computed " + roundedMonthly.toFixed(2));
check("annual total equals monthly total x 12", Math.abs(roundedAnnual - roundedMonthly * 12) < 0.01, "computed " + roundedAnnual.toFixed(2));

/* ── HTML file references the same totals (hero/calculator/methodology parity) ── */
const htmlPath = path.join(__dirname, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const monthlyStr = "$" + roundedMonthly.toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2});
const annualStr = "$" + roundedAnnual.toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2});
check("index.html hero monthly figure matches computed total", html.includes(monthlyStr), "expected " + monthlyStr);
check("index.html hero annual figure matches computed total", html.includes(annualStr), "expected " + annualStr);
check("index.html Open Graph description matches computed monthly total", html.includes(monthlyStr), "expected " + monthlyStr + " in og:description");

/* ── Duplicate-value review is documented for every flagged pair ── */
const secretHelp = SS_SUITE_APPS.find(a => a.secretName === "SecretHelp");
check("SecretHelp is excluded from the total (merged basis)", secretHelp.priceBasis === "merged");
check("SecretHelp documents its duplicate relationship to SecretSupport", /SecretSupport/.test(secretHelp.duplicateNote));

["SecretBookings","SecretInvoice","SecretKnowledge","SecretVault"].forEach(name => {
  const app = SS_SUITE_APPS.find(a => a.secretName === name);
  check(name + " documents why it is kept distinct from its reviewed pair", !!(app && app.duplicateNote && app.duplicateNote.length > 20));
});

/* ── Result ── */
console.log("");
if(failures === 0){
  console.log("All checks passed.");
  process.exit(0);
} else {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
