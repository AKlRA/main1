export type PlanId = 'landing' | 'custom' | 'software';
export type Tier = 'basic' | 'premium' | 'enterprise' | 'none';

export interface ComparisonRow {
  feature: string;
  description: string;
  landing: { text: string; status: Tier };
  custom: { text: string; status: Tier };
  software: { text: string; status: Tier };
}

export const comparisonData: ComparisonRow[] = [
  {
    feature: "Vibe Check (Design)",
    description: "Are we talking basic cookie-cutter templates, or full-on Awwwards-grade custom flexing that makes competitors cry?",
    landing: { text: "Clean Grid Layout", status: "basic" },
    custom: { text: "Awwwards-Level Custom Layouts", status: "premium" },
    software: { text: "Next-Gen 3D Interactive HUD", status: "enterprise" }
  },
  {
    feature: "Performance Speed",
    description: "Attention spans are short. Slow sites are an instant bounce. We optimize down to the millisecond.",
    landing: { text: "1.2s Load (Decent)", status: "basic" },
    custom: { text: "0.4s Page-Load (Fast AF)", status: "premium" },
    software: { text: "0.1s Instant (Supercomputer)", status: "enterprise" }
  },
  {
    feature: "Custom Pages Cooked",
    description: "How many subroutes and pages are we building from scratch? Tell your story without constraints.",
    landing: { text: "1 Premium Landing Page", status: "basic" },
    custom: { text: "Up to 12 Custom Pages", status: "premium" },
    software: { text: "Unlimited Page Routes", status: "enterprise" }
  },
  {
    feature: "Database & Backend",
    description: "Do you need actual databases, data storage, automated user systems, or just a clean contact form?",
    landing: { text: "None (Form Intake only)", status: "none" },
    custom: { text: "Headless CMS Syncing", status: "premium" },
    software: { text: "Custom CRM/HRM Portal & DB", status: "enterprise" }
  },
  {
    feature: "AI Integration Bots",
    description: "Let AI handle your boring workflows (invoice reading, lead scoring, database syncs) while you sleep.",
    landing: { text: "Not Included", status: "none" },
    custom: { text: "Zapier / Webhook Automations", status: "basic" },
    software: { text: "Autonomous Custom AI Agents", status: "enterprise" }
  },
  {
    feature: "Search Engine Conquest",
    description: "SEO settings designed to hijack search results and rank you high on Google without ad spend.",
    landing: { text: "Basic Meta Config", status: "basic" },
    custom: { text: "Advanced Rank-Boosting Plan", status: "premium" },
    software: { text: "Dominant Search Conquest", status: "enterprise" }
  },
  {
    feature: "Support & Red-Line SLA",
    description: "We monitor the servers, rotate logs, and upgrade packages. Free premium maintenance covers everything.",
    landing: { text: "3 Years Standard SLA", status: "basic" },
    custom: { text: "3 Years Priority Support SLA", status: "premium" },
    software: { text: "24/7 Dedicated Support SLA", status: "enterprise" }
  },
  {
    feature: "Internal Management",
    description: "Internal software panels built specifically to automate staff, track pipelines, and manage documents.",
    landing: { text: "Not Included", status: "none" },
    custom: { text: "Not Included", status: "none" },
    software: { text: "Full Custom HRM/CRM Portal", status: "enterprise" }
  },
  {
    feature: "Delivery Window",
    description: "How fast we code, debug, polish, and launch your high-performance platform to production.",
    landing: { text: "5 - 7 Days", status: "basic" },
    custom: { text: "14 - 21 Days", status: "premium" },
    software: { text: "Iterative Agile Sprints", status: "enterprise" }
  }
];

export const faqData = [
  { q: "What does the 3 years free maintenance include?", a: "It covers regular dependency upgrades, security updates, minor bug fixes, hosting adjustments, and performance checkups. We make sure your site stays fast and secure without any monthly fees." },
  { q: "Can we upgrade our plan later?", a: "Absolutely. Our codebases are designed to be modular. You can start with a custom website and add a dashboard, CRM database, or AI automation layer later without rewriting anything." },
  { q: "What tech stack do you use?", a: "We primarily build frontend solutions with React, Next.js, and TypeScript styled with custom CSS. For backend architectures, we use Node.js, Python, PostgreSQL, and deploy on AWS, Vercel, and Docker." },
  { q: "Are there any recurring hosting costs?", a: "We help you deploy directly to platforms like Vercel, Netlify, or AWS under your own account. Many basic plans are free or low-cost ($10-20/month), meaning you only pay the direct hosting charges. We charge no markup." },
  { q: "How do your AI integrations save business time?", a: "We engineer autonomous agents that handle document parsing, automated invoice checking, customer intake processing, and database syncing, reducing repetitive tasks from hours to seconds." },
];

export const planAnalytics = {
  landing: {
    loadSpeed: "1.2s",
    speedPct: 75,
    trafficBoost: "+35%",
    roiFactor: "2.0x",
    automationLevel: "15%",
    automationDesc: "Basic Intake Webhook",
    latency: "120ms",
    performanceRating: "A-"
  },
  custom: {
    loadSpeed: "0.4s",
    speedPct: 92,
    trafficBoost: "+150%",
    roiFactor: "5.5x",
    automationLevel: "65%",
    automationDesc: "CMS Workflow Syncing",
    latency: "25ms",
    performanceRating: "A+"
  },
  software: {
    loadSpeed: "0.1s",
    speedPct: 99,
    trafficBoost: "+300%",
    roiFactor: "12.0x",
    automationLevel: "95%",
    automationDesc: "AI Agents & Cron Triggers",
    latency: "8ms",
    performanceRating: "S-Tier"
  }
};
