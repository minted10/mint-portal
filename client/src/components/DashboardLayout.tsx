import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { Home, LogOut, ChevronDown, LayoutGrid } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663506091484/YnEeEYz8JCEZbD4t8BzqPW/mint-logo_67a65280.webp";

const agentMenuItems = [
  { icon: LayoutGrid, label: "Home", path: "/" },
  { icon: Home, label: "Listings", path: "/listings" },
];

const clientMenuItems = [
  { icon: Home, label: "My Listings", path: "/" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#F0F2F5" }}>
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full">
          <div className="flex flex-col items-center gap-3">
            <img
              src={LOGO_URL}
              alt="Mint Real Estate"
              className="h-14 w-auto"
            />
          </div>
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-xl font-medium tracking-tight text-center" style={{ color: "#1E1E1E" }}>
              Welcome to MintOS
            </h1>
            <p className="text-sm text-center max-w-sm leading-relaxed" style={{ color: "#6B7280" }}>
              Sign in to access your listings, track progress, and manage your real estate transactions.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-[#6db08a] hover:bg-[#5a9a75] text-white font-medium shadow-sm transition-all"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const isClient = (user as any)?.portalRole === "client";
  const menuItems = isClient ? clientMenuItems : agentMenuItems;

  return (
    <div className="min-h-screen" style={{ background: "#F0F2F5" }}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-8">
            <button onClick={() => setLocation("/")} className="flex items-center shrink-0">
              <img
                src={LOGO_URL}
                alt="Mint Real Estate"
                className="h-9 w-auto"
              />
            </button>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => {
                const isActive =
                  location === item.path ||
                  (item.path !== "/" && location.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-[#6db08a]/10 text-[#6db08a]"
                        : "text-[#6B7280] hover:text-[#1E1E1E] hover:bg-[#F0F2F5]"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 hover:bg-[#F0F2F5] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6db08a]">
                <Avatar className="h-8 w-8 border border-[#6db08a]/20 shrink-0">
                  <AvatarFallback className="text-xs font-semibold bg-[#6db08a]/10 text-[#6db08a]">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-none" style={{ color: "#1E1E1E" }}>
                    {user?.name || "User"}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
                    {isClient ? "Client" : "Agent"}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#6B7280] hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-[#F0F2F5] px-4 py-2 flex gap-1 overflow-x-auto">
          {menuItems.map((item) => {
            const isActive =
              location === item.path ||
              (item.path !== "/" && location.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                  ${isActive
                    ? "bg-[#6db08a]/10 text-[#6db08a]"
                    : "text-[#6B7280] hover:text-[#1E1E1E]"
                  }
                `}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
