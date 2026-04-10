import TechCorpLogo from "../../Images/TechCorp.png";
import SecureNetLogo from "../../Images/SecureNet.png";
import DataFlowLogo from "../../Images/DataFlow.png";
import heroSlide2 from "../../Images/hero-slide-2.png";
import heroSlide3 from "../../Images/hero-slide-3.png";
import heroSlide4 from "../../Images/hero-slide-4.png";

/**
 * Fixed hero background. OpenAI CDN is proxied via /openai-img-proxy/ (see vite + vercel config).
 */
export const HERO_BACKGROUND_IMAGE =
  "/openai-img-proxy/static-rsc-4/u_nVaZZAEdcrA1GTMUf15veIPI0Iufbzo5FM4N_cyBUQLwyE5n5s84X6Mi5FfRwi5kgwFJ57jWLd6IxmdC3QugxAHB5Ef_DCJQ8bE6jKav-31Yzi6coqLS40KMh9OTslewXJV_YH4R22b8Vs7fhWWMd2tuh5ejpOIBs0DxG1uEnA9-jhHpANIIDm-rQORMWK?purpose=fullsize";

/** Second hero slide (facial recognition / biometrics). */
export const HERO_BACKGROUND_CIRCUIT = heroSlide2;

/** Third hero slide (human vs robot / AI theme). */
export const HERO_BACKGROUND_SLIDE_3 = heroSlide3;

/** Fourth hero slide (diverse portraits grid). */
export const HERO_BACKGROUND_SLIDE_4 = heroSlide4;

/** Hero slideshow (5s interval per slide): guest vs logged-in first slide. */
/** Homepage hero when logged out: 5s slideshow. Logged-in hero has no photo layer (uses page gradient). */
export const HERO_SLIDESHOW_GUEST = [
  HERO_BACKGROUND_IMAGE,
  HERO_BACKGROUND_CIRCUIT,
  HERO_BACKGROUND_SLIDE_3,
  HERO_BACKGROUND_SLIDE_4,
];

export const features = [
  {
    title: "Real-Time Detection",
    desc: "You're not waiting on a queue forever—most clips come back in a few seconds. Longer files just take a bit more time.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&q=80",
    imageAlt: "Dashboard with charts suggesting fast data processing",
    accent: "from-amber-500/90 to-orange-600/90",
  },
  {
    title: "High Accuracy",
    desc: "Around 85% on the stuff we see most often. No model is perfect—if something looks borderline, we show you the scores so you can decide.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop&q=80",
    imageAlt: "Team reviewing data on a screen",
    accent: "from-cyan-500/90 to-teal-600/90",
  },
  {
    title: "Multi-Format Support",
    desc: "MP4, WebM, MOV, JPG, PNG—the usual formats people actually send us. If it's broken or exotic, the uploader will say so.",
    image:
      "https://images.unsplash.com/photo-1492691527719-9b1b903e99af?w=800&h=500&fit=crop&q=80",
    imageAlt: "Camera and creative workspace",
    accent: "from-sky-500/90 to-blue-600/90",
  },
  {
    title: "Privacy First",
    desc: "We process your file for the check, then get rid of it—nothing sitting around for months. (If you need stricter enterprise terms, talk to us.)",
    image:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=500&fit=crop&q=80",
    imageAlt: "Hands holding phone with security concept",
    accent: "from-fuchsia-500/90 to-purple-600/90",
  },
  {
    title: "Batch Processing",
    desc: "Got a pile of clips? Upload and run them in one go instead of babysitting each file by hand.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop&q=80",
    imageAlt: "Laptop and documents on a desk",
    accent: "from-rose-500/90 to-red-600/90",
  },
  {
    title: "Detailed Reports",
    desc: "You get the verdict, confidence numbers, and enough detail to explain it to someone else on your team—not just a green or red light.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop&q=80",
    imageAlt: "Analytics charts on a laptop",
    accent: "from-indigo-500/90 to-violet-600/90",
  },
];

export const steps = [
  { num: "01", title: "Upload", desc: "Drop a file in or pick one from your device. That's it—no weird plugins." },
  { num: "02", title: "We scan it", desc: "The model looks for the usual deepfake fingerprints. You can grab a coffee; short clips finish fast." },
  { num: "03", title: "Read the result", desc: "You'll see real vs fake (or a probability), plus scores so you're not guessing." },
];

export const stats = [
  { value: "2.5M+", label: "Videos Analyzed", icon: "🎬" },
  { value: "85%", label: "Accuracy Rate", icon: "🎯" },
  { value: "150+", label: "Countries", icon: "🌍" },
  { value: "10K+", label: "Daily Users", icon: "👥" },
  { value: "0.3s", label: "Speed", icon: "⚡" },
];

export const testimonials = [
  { name: "Sarah J.", role: "YouTube editor", quote: "I still double-check weird clips myself, but this saves me maybe an hour on busy days. Good enough to flag stuff before I publish.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face", color: "from-pink-500 to-rose-500" },
  { name: "Mike Chen", role: "Reporter", quote: "Not magic—it misses sometimes—but it's faster than sending everything to a lab. I use it as a first pass, then dig in if it looks off.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", color: "from-blue-500 to-cyan-500" },
  { name: "Emily R.", role: "Comms lead", quote: "Our team just needed something simple the intern could run. This fits that. Support actually answered when we had a billing question.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face", color: "from-cyan-500 to-teal-500" },
];

export const faqs = [
  {
    q: "I've been burned by 'AI' tools before—can I trust what I see here?",
    a: "Fair question. On typical face-swap style fakes we're around 85% in our benchmarks—not magic, not 100%. Bad lighting or heavy compression can trip it up. That's why we show you scores, not just a thumbs up or down.",
  },
  {
    q: "How long am I going to sit here staring at a progress bar?",
    a: "Short clips: often seconds. A chunky 4K file might take a minute or two. If it feels stuck forever, it's usually the upload or your connection—not the model sulking.",
  },
  {
    q: "What happens to my file after? (Yes, I'm a little paranoid.)",
    a: "We run the check, then delete our copy of the upload. You should delete yours too if you don't need it—especially for anything sensitive. We don't need a souvenir.",
  },
  {
    q: "My export settings are weird—will you still take my file?",
    a: "Usually, yes: MP4, WebM, MOV, AVI for video; JPG, PNG, WebP for images. If it fails, try re-exporting or trimming—half the time the file's just corrupted, not 'unsupported.'",
  },
];

export const showcaseTabs = [
  { key: "features", label: "What you get", short: "The boring-but-useful list" },
  { key: "workflow", label: "How it works", short: "Three steps, no jargon" },
  { key: "reviews", label: "What people say", short: "Honest takes (not perfect 5-star fluff)" },
];

export const infoHubTabs = [
  { key: "faq", label: "FAQ", short: "The questions we'd ask too" },
  { key: "people", label: "Team & partners", short: "Who we are + who we work with" },
  { key: "updates", label: "Reading list", short: "Articles we've been bookmarking" },
];

export const actionTabs = [
  { key: "pricing", label: "Pricing", short: "Pick what fits; you can change later" },
  { key: "contact", label: "Contact", short: "Real humans on the other end (during business hours)" },
];

export const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    desc: "Try it without a card",
    features: ["5 checks / month", "Same core detection as paid", "Email support (we reply when we can)", "Usually under ~5 min on short clips"],
    popular: false,
    color: "from-slate-500 to-slate-600",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    desc: "If you're checking stuff every week",
    features: ["Unlimited checks", "Faster queue + sharper reports", "Priority email (same day most of the time)", "API if you want to wire it into your tools", "Export / PDF-style summaries"],
    popular: true,
    color: "from-[#0891b2] to-[#06b6d4]",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Legal, newsroom, or IT with requirements",
    features: ["Everything in Pro", "Dedicated environment if you need it", "Custom integrations (within reason)", "Phone + Slack-style support options", "SLA we actually put in writing", "Onboarding for your team"],
    popular: false,
    color: "from-purple-500 to-indigo-600",
  },
];

export const teamMembers = [
  { name: "Hoang Dinh Khai", role: "CEO", bio: "Background in ML research; now spends more time talking to users than reading arXiv.", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face", linkedin: "#" },
  { name: "Nguyen Hoang Tuan Anh", role: "CTO", bio: "Mostly backend and vision pipelines. Will debug at 11pm if production is on fire.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face", linkedin: "#" },
  { name: "Le Thi Hue", role: "Research lead", bio: "Cares about benchmarks but cares more about stuff not breaking in the real world.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face", linkedin: "#" },
  { name: "Do Tien Dat", role: "Engineering", bio: "Keeps the service from falling over when traffic spikes. Coffee drinker.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face", linkedin: "#" },
  { name: "Dam Huu Hoang Long", role: "Product & UX", bio: "Fights for clearer copy and fewer confusing buttons. Loses some debates to engineering, wins the ones users actually notice.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face", linkedin: "#" },
];

export const partners = [
  { name: "TechCorp", logo: TechCorpLogo },
  { name: "SecureNet", logo: SecureNetLogo },
  { name: "DataFlow", logo: DataFlowLogo },
  { name: "Ai-Labs", logo: "https://tse4.mm.bing.net/th/id/OIP.GSC64n5vdqIZwJF2QIL7jAHaCV?pid=Api&P=0&h=180" },
  { name: "CloudTech", logo: "https://biz.prlog.org/cloudtech/logo.jpg" },
  { name: "CyberShield", logo: "https://tse1.mm.bing.net/th/id/OIP.oKzvab5-4SC75d_BO94HjQHaCC?pid=Api&P=0&h=180" },
];

export const blogPosts = [
  {
    title: "Machines Spot Deepfake Pictures Better Than Humans",
    date: "Feb 28, 2026",
    category: "Research",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop",
    readTime: "4 min read",
    link: "https://news.ufl.edu/2026/02/deepfake-detection/",
  },
  {
    title: "UK Government Partners with Microsoft on Deepfake Detection",
    date: "Feb 15, 2026",
    category: "News",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop",
    readTime: "3 min read",
    link: "https://www.computing.co.uk/news/2026/government/uk-picks-microsoft-to-help-develop-deepfake-detection-system",
  },
  {
    title: "DeepQShield: Quantum-Resistant Deepfake Detection Framework",
    date: "Feb 10, 2026",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
    readTime: "6 min read",
    link: "https://www.nature.com/articles/s41598-026-38924-7",
  },
];
