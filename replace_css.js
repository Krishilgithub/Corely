const fs = require("fs");
const path = require("path");

const cssFiles = [
  "app/dashboard/dashboard.css",
  "app/dashboard/insights/insights.css",
  "app/dashboard/memory/memory.css",
];

const tsxFiles = [
  "app/dashboard/DashboardClient.tsx",
  "app/dashboard/components/ActivityFeedPanel.tsx",
  "app/dashboard/components/HelpModal.tsx",
  "app/dashboard/components/InsightsPanel.tsx",
  "app/dashboard/components/Skeleton.tsx",
  "app/dashboard/components/StatsCards.tsx",
  "app/dashboard/components/Topbar.tsx",
  "app/dashboard/memory/components/AddMemoryModal.tsx",
  "app/dashboard/memory/components/MemoryRightSidebar.tsx",
  "app/dashboard/memory/components/MemoryStatsGrid.tsx",
  "app/dashboard/sources/components/SourcesMain.tsx",
  "app/dashboard/insights/page.tsx",
  "app/dashboard/profile/page.tsx",
  "app/dashboard/settings/components/GeneralTab.tsx",
  "app/dashboard/settings/components/MembersTab.tsx",
  "app/dashboard/settings/components/SecurityTab.tsx",
  "app/dashboard/settings/components/BillingTab.tsx",
];

const replaceMapCss = {
  "#fafafa": "var(--db-bg)",
  "#ffffff": "var(--db-panel)",
  "#fff": "var(--db-panel)",
  "#111111": "var(--db-text)",
  "#111": "var(--db-text)",
  "#71717a": "var(--db-text-muted)",
  "#f0f0f0": "var(--db-border)",
  "#e4e4e7": "var(--db-border)",
  "rgba(0,0,0,0.04)": "var(--db-border-light)",
  "rgba(0,0,0,0.05)": "var(--db-border-light)",
  "rgba(0,0,0,0.06)": "var(--db-border-light)",
  "rgba(0,0,0,0.08)": "var(--db-border-light)",
  "#f5f5f5": "var(--db-hover)",
};

// Regex replacements for TSX inline styles
// E.g. background: "#fff" -> background: "var(--db-panel)"
const replaceMapTsx = {
  '"#fafafa"': '"var(--db-bg)"',
  '"#ffffff"': '"var(--db-panel)"',
  '"#fff"': '"var(--db-panel)"',
  '"#111111"': '"var(--db-text)"',
  '"#111"': '"var(--db-text)"',
  '"#71717a"': '"var(--db-text-muted)"',
  '"#f0f0f0"': '"var(--db-border)"',
  '"#e4e4e7"': '"var(--db-border)"',
  '"rgba(0,0,0,0.04)"': '"var(--db-border-light)"',
  '"rgba(0,0,0,0.05)"': '"var(--db-border-light)"',
  '"rgba(0,0,0,0.06)"': '"var(--db-border-light)"',
  '"rgba(0,0,0,0.08)"': '"var(--db-border-light)"',
  '"#f5f5f5"': '"var(--db-hover)"',
  '"#fafafa"': '"var(--db-bg)"',
  "'#fafafa'": "'var(--db-bg)'",
  "'#ffffff'": "'var(--db-panel)'",
  "'#fff'": "'var(--db-panel)'",
  "'#111111'": "'var(--db-text)'",
  "'#111'": "'var(--db-text)'",
  "'#71717a'": "'var(--db-text-muted)'",
  "'#f0f0f0'": "'var(--db-border)'",
  "'#e4e4e7'": "'var(--db-border)'",
  "'#f5f5f5'": "'var(--db-hover)'",
};

cssFiles.forEach(file => {
  let p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, "utf-8");
    for (const [key, value] of Object.entries(replaceMapCss)) {
      // Use regex to replace all, ensuring we don't partially replace some hex colors if they are substrings
      // Actually simple string replacement is fine for exact hex matches if we ensure word boundaries or something.
      // E.g. #fff could match #ffffff. So we replace #ffffff first.
      content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "(?!\\w)", 'g'), value);
    }
    fs.writeFileSync(p, content);
    console.log(`Updated CSS: ${file}`);
  } else {
    console.warn(`Missing: ${file}`);
  }
});

tsxFiles.forEach(file => {
  let p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, "utf-8");
    for (const [key, value] of Object.entries(replaceMapTsx)) {
      content = content.split(key).join(value);
    }
    fs.writeFileSync(p, content);
    console.log(`Updated TSX: ${file}`);
  } else {
    console.warn(`Missing: ${file}`);
  }
});
