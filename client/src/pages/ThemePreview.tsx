import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, Eye, Heart, Users, FileText, TrendingUp, Clock, Bed, Bath, Ruler, MapPin, Calendar, Home, Plus, LayoutDashboard, UserPlus, PanelLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ThemeOption = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    sidebarBg: string;
    sidebarText: string;
    sidebarActive: string;
    sidebarActiveText: string;
    pageBg: string;
    cardBg: string;
    cardBorder: string;
    headerText: string;
    bodyText: string;
    mutedText: string;
    kpiBg1: string;
    kpiBg2: string;
    kpiBg3: string;
    kpiBg4: string;
    kpiBg5: string;
    kpiBg6: string;
    kpiText1: string;
    kpiText2: string;
    kpiText3: string;
    kpiText4: string;
    kpiText5: string;
    kpiText6: string;
    progressBg: string;
    progressFill: string;
    badgeBg: string;
    badgeText: string;
    accentGradient?: string;
  };
  style: "light" | "dark" | "mixed";
};

const themes: ThemeOption[] = [
  {
    id: "classic-mint",
    name: "Classic Mint",
    subtitle: "Current Theme",
    description: "Clean white canvas with mint green accents. Light, airy, and professional — the Apple-inspired default.",
    style: "light",
    colors: {
      primary: "#6DB48E",
      primaryLight: "#E8F5EE",
      primaryDark: "#4A9A6E",
      sidebarBg: "#FAFBFA",
      sidebarText: "#64748B",
      sidebarActive: "#E8F5EE",
      sidebarActiveText: "#6DB48E",
      pageBg: "#FAFAFA",
      cardBg: "#FFFFFF",
      cardBorder: "#E8ECE9",
      headerText: "#1A1A2E",
      bodyText: "#334155",
      mutedText: "#94A3B8",
      kpiBg1: "#EFF6FF", kpiText1: "#2563EB",
      kpiBg2: "#FFF1F2", kpiText2: "#F43F5E",
      kpiBg3: "#F5F3FF", kpiText3: "#7C3AED",
      kpiBg4: "#FFFBEB", kpiText4: "#D97706",
      kpiBg5: "#ECFDF5", kpiText5: "#059669",
      kpiBg6: "#F8FAFC", kpiText6: "#64748B",
      progressBg: "#E8F5EE",
      progressFill: "#6DB48E",
      badgeBg: "#ECFDF5",
      badgeText: "#059669",
    },
  },
  {
    id: "midnight-mint",
    name: "Midnight Mint",
    subtitle: "Dark Mode",
    description: "Sophisticated dark interface with glowing mint highlights. Reduces eye strain and feels premium and modern.",
    style: "dark",
    colors: {
      primary: "#6DB48E",
      primaryLight: "#1A3A2A",
      primaryDark: "#8CCFAA",
      sidebarBg: "#0F1419",
      sidebarText: "#8899A6",
      sidebarActive: "#1A3A2A",
      sidebarActiveText: "#8CCFAA",
      pageBg: "#15202B",
      cardBg: "#192734",
      cardBorder: "#253341",
      headerText: "#E7E9EA",
      bodyText: "#C4CDD5",
      mutedText: "#6B7F8E",
      kpiBg1: "#1A2744", kpiText1: "#60A5FA",
      kpiBg2: "#2D1B2E", kpiText2: "#FB7185",
      kpiBg3: "#231B3A", kpiText3: "#A78BFA",
      kpiBg4: "#2D2517", kpiText4: "#FBBF24",
      kpiBg5: "#1A3A2A", kpiText5: "#6DB48E",
      kpiBg6: "#1E2A35", kpiText6: "#8899A6",
      progressBg: "#253341",
      progressFill: "#6DB48E",
      badgeBg: "#1A3A2A",
      badgeText: "#8CCFAA",
    },
  },
  {
    id: "warm-sand",
    name: "Warm Sand",
    subtitle: "Luxury Neutral",
    description: "Warm, earthy tones with gold accents. Evokes luxury real estate magazines and high-end property brochures.",
    style: "light",
    colors: {
      primary: "#B8956A",
      primaryLight: "#FAF5EF",
      primaryDark: "#9A7B55",
      sidebarBg: "#FAF8F5",
      sidebarText: "#8C7B6B",
      sidebarActive: "#F5EDE3",
      sidebarActiveText: "#8B6F4E",
      pageBg: "#FDFCFA",
      cardBg: "#FFFFFF",
      cardBorder: "#EDE8E1",
      headerText: "#2C2418",
      bodyText: "#5C4F42",
      mutedText: "#A89B8C",
      kpiBg1: "#F0F4FA", kpiText1: "#4A6FA5",
      kpiBg2: "#FAF0F0", kpiText2: "#C2636A",
      kpiBg3: "#F4F0FA", kpiText3: "#7E6BA5",
      kpiBg4: "#FAF5EF", kpiText4: "#B8956A",
      kpiBg5: "#EFF5F0", kpiText5: "#5E9A6E",
      kpiBg6: "#F5F3F0", kpiText6: "#8C7B6B",
      progressBg: "#F0E8DD",
      progressFill: "#B8956A",
      badgeBg: "#EFF5F0",
      badgeText: "#5E9A6E",
    },
  },
  {
    id: "ocean-slate",
    name: "Ocean Slate",
    subtitle: "Coastal Professional",
    description: "Cool blue-gray palette inspired by coastal California. Trustworthy, calming, and distinctly professional.",
    style: "light",
    colors: {
      primary: "#3B82C4",
      primaryLight: "#EBF3FB",
      primaryDark: "#2563A0",
      sidebarBg: "#F1F5F9",
      sidebarText: "#64748B",
      sidebarActive: "#E0ECFA",
      sidebarActiveText: "#2563A0",
      pageBg: "#F8FAFC",
      cardBg: "#FFFFFF",
      cardBorder: "#E2E8F0",
      headerText: "#0F172A",
      bodyText: "#334155",
      mutedText: "#94A3B8",
      kpiBg1: "#EBF3FB", kpiText1: "#3B82C4",
      kpiBg2: "#FFF1F2", kpiText2: "#E11D48",
      kpiBg3: "#F0EBFA", kpiText3: "#7C3AED",
      kpiBg4: "#FEF9E7", kpiText4: "#CA8A04",
      kpiBg5: "#ECFDF5", kpiText5: "#059669",
      kpiBg6: "#F1F5F9", kpiText6: "#64748B",
      progressBg: "#E0ECFA",
      progressFill: "#3B82C4",
      badgeBg: "#ECFDF5",
      badgeText: "#059669",
    },
  },
  {
    id: "noir-elegance",
    name: "Noir Elegance",
    subtitle: "Ultra Premium",
    description: "Near-black backgrounds with crisp white text and mint accents. The most dramatic, high-contrast option for a luxury feel.",
    style: "dark",
    colors: {
      primary: "#6DB48E",
      primaryLight: "#162B20",
      primaryDark: "#8CCFAA",
      sidebarBg: "#09090B",
      sidebarText: "#71717A",
      sidebarActive: "#162B20",
      sidebarActiveText: "#8CCFAA",
      pageBg: "#0C0C0E",
      cardBg: "#18181B",
      cardBorder: "#27272A",
      headerText: "#FAFAFA",
      bodyText: "#D4D4D8",
      mutedText: "#71717A",
      kpiBg1: "#172033", kpiText1: "#60A5FA",
      kpiBg2: "#2B1520", kpiText2: "#FB7185",
      kpiBg3: "#1F1533", kpiText3: "#A78BFA",
      kpiBg4: "#2B2210", kpiText4: "#FBBF24",
      kpiBg5: "#162B20", kpiText5: "#6DB48E",
      kpiBg6: "#1C1C1F", kpiText6: "#A1A1AA",
      progressBg: "#27272A",
      progressFill: "#6DB48E",
      badgeBg: "#162B20",
      badgeText: "#8CCFAA",
    },
  },
];

export default function ThemePreview() {
  const [, setLocation] = useLocation();
  const [selectedTheme, setSelectedTheme] = useState<string>("classic-mint");
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="h-10 w-10 rounded-full bg-white shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              Choose Your Dashboard Theme
            </h1>
            <p className="text-base text-[#86868B] mt-1">
              Select a visual style for your Mint Real Estate portal. Click any theme to preview it below.
            </p>
          </div>
        </div>

        {/* Theme Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              onMouseEnter={() => setHoveredTheme(theme.id)}
              onMouseLeave={() => setHoveredTheme(null)}
              className={`relative text-left rounded-2xl p-4 transition-all duration-300 border-2 ${
                selectedTheme === theme.id
                  ? "border-[#6DB48E] shadow-lg shadow-[#6DB48E]/10 scale-[1.02]"
                  : hoveredTheme === theme.id
                    ? "border-gray-300 shadow-md"
                    : "border-transparent shadow-sm"
              } bg-white`}
            >
              {selectedTheme === theme.id && (
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#6DB48E] flex items-center justify-center shadow-md">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              {/* Color preview strip */}
              <div className="flex gap-1 mb-3">
                <div className="h-8 flex-1 rounded-l-lg" style={{ backgroundColor: theme.colors.sidebarBg, border: `1px solid ${theme.colors.cardBorder}` }} />
                <div className="h-8 flex-[2]" style={{ backgroundColor: theme.colors.pageBg, border: `1px solid ${theme.colors.cardBorder}` }} />
                <div className="h-8 flex-1 rounded-r-lg" style={{ backgroundColor: theme.colors.primary }} />
              </div>
              <h3 className="font-semibold text-sm text-[#1D1D1F]">{theme.name}</h3>
              <p className="text-xs text-[#6DB48E] font-medium mt-0.5">{theme.subtitle}</p>
              <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed line-clamp-2">{theme.description}</p>
            </button>
          ))}
        </div>

        {/* Full Dashboard Preview */}
        {themes.filter(t => t.id === selectedTheme).map(theme => (
          <div key={theme.id} className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50">
            {/* Theme name banner */}
            <div className="px-6 py-3 flex items-center justify-between" style={{ backgroundColor: theme.colors.primary }}>
              <span className="text-white font-semibold text-sm tracking-wide">{theme.name} — Full Dashboard Preview</span>
              <span className="text-white/70 text-xs">{theme.subtitle}</span>
            </div>

            <div className="flex" style={{ backgroundColor: theme.colors.pageBg, minHeight: 700 }}>
              {/* Sidebar */}
              <div className="w-[220px] shrink-0 flex flex-col border-r" style={{ backgroundColor: theme.colors.sidebarBg, borderColor: theme.colors.cardBorder }}>
                {/* Logo */}
                <div className="h-16 flex items-center gap-2 px-5 border-b" style={{ borderColor: theme.colors.cardBorder }}>
                  <PanelLeft className="h-4 w-4" style={{ color: theme.colors.mutedText }} />
                  <span className="text-lg font-semibold tracking-tight" style={{ color: theme.colors.headerText }}>
                    M<span style={{ color: theme.colors.primary }}>INT</span>
                  </span>
                  <span className="text-[10px] tracking-[0.15em] uppercase mt-0.5" style={{ color: theme.colors.mutedText }}>Portal</span>
                </div>

                {/* Nav items */}
                <div className="flex-1 px-3 py-3 space-y-1">
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: Home, label: "Listings", active: false },
                    { icon: UserPlus, label: "Clients", active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all"
                      style={{
                        backgroundColor: item.active ? theme.colors.sidebarActive : "transparent",
                        color: item.active ? theme.colors.sidebarActiveText : theme.colors.sidebarText,
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* User */}
                <div className="px-3 py-4 border-t" style={{ borderColor: theme.colors.cardBorder }}>
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                      style={{ backgroundColor: theme.colors.primaryLight, color: theme.colors.primary }}>
                      B
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: theme.colors.headerText }}>Bryan Hill</p>
                      <p className="text-xs truncate" style={{ color: theme.colors.mutedText }}>Agent</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 p-6 overflow-hidden">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight" style={{ color: theme.colors.headerText }}>Dashboard</h2>
                    <p className="text-sm mt-1" style={{ color: theme.colors.mutedText }}>1 active listing</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: theme.colors.primary }}>
                    <Plus className="h-4 w-4" />
                    New Listing
                  </div>
                </div>

                {/* Listing Card */}
                <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
                  <div className="p-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: theme.colors.badgeBg, color: theme.colors.badgeText }}>Active</span>
                      <span className="text-xs flex items-center gap-1" style={{ color: theme.colors.mutedText }}>
                        <Calendar className="h-3 w-3" /> 26d
                      </span>
                    </div>
                    <h3 className="font-semibold text-base leading-tight mb-1" style={{ color: theme.colors.headerText }}>26582 Paseo Callado</h3>
                    <p className="text-sm flex items-center gap-1" style={{ color: theme.colors.mutedText }}>
                      <MapPin className="h-3 w-3" /> San Juan Capistrano, CA, 92675
                    </p>
                    <div className="text-xl font-semibold mt-3" style={{ color: theme.colors.headerText }}>$1,895,000</div>
                    <div className="flex items-center gap-4 mt-3 text-sm" style={{ color: theme.colors.mutedText }}>
                      <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> 4</span>
                      <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> 3.5</span>
                      <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" /> 3,200 sqft</span>
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${theme.colors.cardBorder}` }} />
                  <div className="px-5 py-3" style={{ backgroundColor: theme.style === "dark" ? `${theme.colors.cardBorder}33` : "#f8faf9" }}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span style={{ color: theme.colors.mutedText }}>Checklist Progress</span>
                      <span className="font-medium" style={{ color: theme.colors.primary }}>53%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.progressBg }}>
                      <div className="h-full rounded-full" style={{ backgroundColor: theme.colors.progressFill, width: "53%" }} />
                    </div>
                    <div className="flex items-center gap-4 text-xs pt-2" style={{ color: theme.colors.mutedText }}>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> 4,078 views</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> 245 saves</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 7 showings</span>
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> 2 offers</span>
                    </div>
                  </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-6 gap-3 mb-6">
                  {[
                    { icon: Eye, label: "Total Views", value: "4,078", bg: theme.colors.kpiBg1, color: theme.colors.kpiText1 },
                    { icon: Heart, label: "Saves", value: "245", bg: theme.colors.kpiBg2, color: theme.colors.kpiText2 },
                    { icon: Users, label: "Showings", value: "7", bg: theme.colors.kpiBg3, color: theme.colors.kpiText3 },
                    { icon: FileText, label: "Offers", value: "2", bg: theme.colors.kpiBg4, color: theme.colors.kpiText4 },
                    { icon: TrendingUp, label: "High Interest", value: "4", bg: theme.colors.kpiBg5, color: theme.colors.kpiText5 },
                    { icon: Clock, label: "Days on Market", value: "26", bg: theme.colors.kpiBg6, color: theme.colors.kpiText6 },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl p-4" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: kpi.bg }}>
                        <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                      </div>
                      <p className="text-xl font-semibold" style={{ color: theme.colors.headerText }}>{kpi.value}</p>
                      <p className="text-xs mt-0.5" style={{ color: theme.colors.mutedText }}>{kpi.label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar card */}
                <div className="rounded-xl p-5" style={{ backgroundColor: theme.colors.cardBg, border: `1px solid ${theme.colors.cardBorder}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium" style={{ color: theme.colors.headerText }}>Overall Checklist Progress</span>
                    <span className="text-sm font-semibold" style={{ color: theme.colors.primary }}>56/105 (53%)</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.progressBg }}>
                    <div className="h-full rounded-full transition-all" style={{ backgroundColor: theme.colors.progressFill, width: "53%" }} />
                  </div>
                  {/* Stage pills */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {[
                      { name: "Pre-Listing", pct: 100 },
                      { name: "Post-Listing", pct: 100 },
                      { name: "Signed Agreement", pct: 79 },
                      { name: "Marketing Prep", pct: 57 },
                      { name: "Active on Market", pct: 44 },
                      { name: "Review & Responses", pct: 0 },
                      { name: "In Escrow", pct: 0 },
                      { name: "Post Close", pct: 0 },
                    ].map((stage) => (
                      <div
                        key={stage.name}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: stage.pct === 100
                            ? theme.colors.primaryLight
                            : stage.pct > 0
                              ? `${theme.colors.primary}15`
                              : theme.style === "dark" ? "#27272A" : "#F1F5F9",
                          color: stage.pct === 100
                            ? theme.colors.primary
                            : stage.pct > 0
                              ? theme.colors.primary
                              : theme.colors.mutedText,
                        }}
                      >
                        {stage.pct === 100 && <Check className="h-3 w-3" />}
                        {stage.name}
                        <span className="opacity-60">{stage.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Description of selected theme */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#86868B]">
            {themes.find(t => t.id === selectedTheme)?.description}
          </p>
          <p className="text-xs text-[#86868B] mt-3">
            Tell me which theme you'd like, and I'll apply it across the entire portal.
          </p>
        </div>
      </div>
    </div>
  );
}
