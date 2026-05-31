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
];

const fixMapCss = {
  "color: var(--db-panel)": "color: #ffffff",
  "color: var(--db-bg)": "color: #fafafa",
  "fill: var(--db-panel)": "fill: #ffffff",
  "stroke: var(--db-panel)": "stroke: #ffffff",
};

const fixMapTsx = {
  'color: "var(--db-panel)"': 'color: "#ffffff"',
  "color: 'var(--db-panel)'": "color: '#ffffff'",
  'color: "var(--db-bg)"': 'color: "#fafafa"',
  "color: 'var(--db-bg)'": "color: '#fafafa'",
};

cssFiles.forEach(file => {
  let p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, "utf-8");
    for (const [key, value] of Object.entries(fixMapCss)) {
      content = content.split(key).join(value);
    }
    fs.writeFileSync(p, content);
    console.log(`Fixed CSS: ${file}`);
  }
});

tsxFiles.forEach(file => {
  let p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, "utf-8");
    for (const [key, value] of Object.entries(fixMapTsx)) {
      content = content.split(key).join(value);
    }
    // Specific fix for "Save Preferences" button in ProfilePage and other inverted buttons
    content = content.replace(/background: "var\(--db-text\)", color: "#ffffff"/g, 'background: "var(--db-text)", color: "var(--db-panel)"');
    // Actually the Save button is supposed to be black with white text in Light Mode.
    // In Dark Mode, it should be white with black text.
    // So background: var(--db-text) and color: var(--db-panel) IS correct for the primary button inverted style.
    
    fs.writeFileSync(p, content);
    console.log(`Fixed TSX: ${file}`);
  }
});
