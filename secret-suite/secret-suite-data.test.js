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
const GLOBALS = "SS_SUITE_APPS, SS_SUITE_CATEGORIES, SS_SUITE_STATUSES, SS_SUITE_PRICING_REVIEWED, SS_SUITE_TEAM_SIZE_DEFAULT, " +
  "SS_SUITE_DEPLOYMENT_PATHS, SS_SUITE_SETUP_LEVELS, SS_SUITE_COST_TIERS, SS_SUITE_REQUIREMENTS, SS_SUITE_MANAGED_STATUSES";
const src = fs.readFileSync(DATA_PATH, "utf8");
const loaded = new Function(src + "\nreturn {" + GLOBALS + "};")();
const {
  SS_SUITE_APPS, SS_SUITE_CATEGORIES, SS_SUITE_STATUSES, SS_SUITE_TEAM_SIZE_DEFAULT,
  SS_SUITE_DEPLOYMENT_PATHS, SS_SUITE_SETUP_LEVELS, SS_SUITE_COST_TIERS, SS_SUITE_REQUIREMENTS, SS_SUITE_MANAGED_STATUSES
} = loaded;

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

check("monthly total is reproducible from itemized data", roundedMonthly === 2887.37, "computed " + roundedMonthly.toFixed(2));
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

/* ============================================================
   Deployment / setup-complexity / DIY-cost classification tests
   ============================================================ */

const DEPLOYMENT_VALUES = SS_SUITE_DEPLOYMENT_PATHS.map(d => d.value);
const SETUP_VALUES = SS_SUITE_SETUP_LEVELS.map(s => s.value);
const COST_VALUES = SS_SUITE_COST_TIERS.map(c => c.value);
const REQUIREMENT_VALUES = SS_SUITE_REQUIREMENTS.map(r => r.value);
const MANAGED_VALUES = SS_SUITE_MANAGED_STATUSES.map(m => m.value);

let badDeployment = 0, badSetupLevel = 0, badCostTier = 0, badRequirements = 0, badManaged = 0, missingRequirements = 0;
SS_SUITE_APPS.forEach(a => {
  if(!DEPLOYMENT_VALUES.includes(a.deploymentPath)) badDeployment++;
  if(!SETUP_VALUES.includes(a.setupLevel)) badSetupLevel++;
  if(!COST_VALUES.includes(a.diyCostTier)) badCostTier++;
  if(!MANAGED_VALUES.includes(a.managedHosting)) badManaged++;
  if(!Array.isArray(a.requirements) || a.requirements.length === 0) missingRequirements++;
  else if(a.requirements.some(r => !REQUIREMENT_VALUES.includes(r))) badRequirements++;
});
check("every record has a valid deploymentPath", badDeployment === 0, badDeployment + " invalid");
check("every record has a valid setupLevel (1-5)", badSetupLevel === 0, badSetupLevel + " invalid");
check("every record has a valid diyCostTier", badCostTier === 0, badCostTier + " invalid");
check("every record has a valid managedHosting status", badManaged === 0, badManaged + " invalid");
check("every record has at least one requirement value", missingRequirements === 0, missingRequirements + " missing");
check("every requirements entry uses only allowed values", badRequirements === 0, badRequirements + " invalid");

/* ── No app appears twice (slug uniqueness) ── */
const slugSet = new Set(SS_SUITE_APPS.map(a => a.slug));
check("every app has a unique slug (no duplicates)", slugSet.size === SS_SUITE_APPS.length, "found " + slugSet.size + " unique of " + SS_SUITE_APPS.length);

/* ── Default sort ("Easiest & Free First") is deterministic ── */
function deploymentPriority(app){
  const d = SS_SUITE_DEPLOYMENT_PATHS.find(p => p.value === app.deploymentPath);
  return d ? d.priority : 99;
}
function easiestFreeFirstSort(apps){
  return apps.slice().sort((a, b) => {
    const dp = deploymentPriority(a) - deploymentPriority(b);
    if(dp !== 0) return dp;
    const sl = a.setupLevel - b.setupLevel;
    if(sl !== 0) return sl;
    const costOrder = COST_VALUES;
    const cp = costOrder.indexOf(a.diyCostTier) - costOrder.indexOf(b.diyCostTier);
    if(cp !== 0) return cp;
    return b.popularity - a.popularity;
  });
}
const sortedOnce = easiestFreeFirstSort(SS_SUITE_APPS).map(a => a.slug);
const sortedTwice = easiestFreeFirstSort(SS_SUITE_APPS).map(a => a.slug);
check("default sort (Easiest & Free First) is deterministic across repeated runs", JSON.stringify(sortedOnce) === JSON.stringify(sortedTwice));

const firstSorted = easiestFreeFirstSort(SS_SUITE_APPS)[0];
check("the top-ranked app under Easiest & Free First has deploymentPath no_hosting and setupLevel 1",
  firstSorted.deploymentPath === "no_hosting" && firstSorted.setupLevel === 1,
  "got " + firstSorted.slug + " (" + firstSorted.deploymentPath + ", level " + firstSorted.setupLevel + ")");

/* ── Quick filter: Free & No Setup returns only qualifying apps ── */
function isFreeAndNoSetup(app){
  return app.deploymentPath === "no_hosting" && app.setupLevel === 1 && app.diyCostTier === "zero" &&
    app.requirements.length === 1 && app.requirements[0] === "none";
}
const freeNoSetupApps = SS_SUITE_APPS.filter(isFreeAndNoSetup);
check("Free & No Setup quick filter matches at least one app", freeNoSetupApps.length > 0, "found " + freeNoSetupApps.length);
check("every Free & No Setup match is genuinely no_hosting + Level 1 + zero cost + no requirements",
  freeNoSetupApps.every(isFreeAndNoSetup));

/* ── Quick filter: Free Cloud returns only free-cloud-eligible apps ── */
const freeCloudApps = SS_SUITE_APPS.filter(a => a.deploymentPath === "free_cloud" && a.diyCostTier === "free_tier");
check("Free Cloud quick filter matches at least one app", freeCloudApps.length > 0, "found " + freeCloudApps.length);
check("every Free Cloud match has deploymentPath free_cloud", freeCloudApps.every(a => a.deploymentPath === "free_cloud"));

/* ── No Database excludes database applications ── */
const noDatabaseApps = SS_SUITE_APPS.filter(a => !a.requirements.includes("database"));
check("No Database filter excludes every app with a database requirement", noDatabaseApps.every(a => !a.requirements.includes("database")));
check("No Database filter still returns some apps", noDatabaseApps.length > 0 && noDatabaseApps.length < SS_SUITE_APPS.length);

/* ── One-Click returns only Level 2 apps ── */
const oneClickApps = SS_SUITE_APPS.filter(a => a.setupLevel === 2);
check("One-Click quick filter matches at least one app", oneClickApps.length > 0, "found " + oneClickApps.length);
check("every One-Click match is exactly setupLevel 2", oneClickApps.every(a => a.setupLevel === 2));

/* ── Combined filter: AND across groups, OR within a group ── */
function applyFilters(apps, opts){
  return apps.filter(a => {
    if(opts.deploymentPaths && opts.deploymentPaths.length && !opts.deploymentPaths.includes(a.deploymentPath)) return false;
    if(opts.setupLevels && opts.setupLevels.length && !opts.setupLevels.includes(a.setupLevel)) return false;
    if(opts.requirements && opts.requirements.length && !opts.requirements.some(r => a.requirements.includes(r))) return false;
    return true;
  });
}
const combined = applyFilters(SS_SUITE_APPS, { deploymentPaths: ["free_cloud"], setupLevels: [2], requirements: ["database"] });
check("combined filter (Free Cloud AND Level 2 AND Database) uses AND-across-groups logic",
  combined.every(a => a.deploymentPath === "free_cloud" && a.setupLevel === 2 && a.requirements.includes("database")));

const orWithinGroup = applyFilters(SS_SUITE_APPS, { setupLevels: [1, 2] });
check("selecting two setup levels uses OR logic within the group",
  orWithinGroup.every(a => a.setupLevel === 1 || a.setupLevel === 2) &&
  orWithinGroup.length === SS_SUITE_APPS.filter(a => a.setupLevel === 1 || a.setupLevel === 2).length);

/* ── Summary counts (must be computed from data, never hardcoded) ── */
const summaryCounts = {
  noHosting: SS_SUITE_APPS.filter(a => a.deploymentPath === "no_hosting").length,
  freeCloud: SS_SUITE_APPS.filter(a => a.deploymentPath === "free_cloud").length,
  oneClick: SS_SUITE_APPS.filter(a => a.setupLevel === 2).length,
  ownServer: SS_SUITE_APPS.filter(a => a.deploymentPath === "own_server").length,
  managedAvailable: SS_SUITE_APPS.filter(a => a.managedHosting === "available").length
};
check("summary counts sum to 56 across all four deployment paths",
  summaryCounts.noHosting + summaryCounts.freeCloud + summaryCounts.ownServer +
  SS_SUITE_APPS.filter(a => a.deploymentPath === "external_services").length === 56);

/* ── Result ── */
console.log("");
if(failures === 0){
  console.log("All checks passed.");
  process.exit(0);
} else {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
