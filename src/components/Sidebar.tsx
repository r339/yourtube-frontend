import { Home, History, ThumbsUp, Clock, User, Download, Crown } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";

const Sidebar = () => {
  const { user } = useUser() as any;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const navItem = (
    href: string,
    icon: React.ReactNode,
    label: string,
    badge?: string
  ) => {
    const isActive = router.pathname === href;
    return (
      <Link href={href}>
        <div
          className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium w-full cursor-pointer transition-all duration-150 group
            ${isActive
              ? "font-semibold"
              : "hover:translate-x-0.5"
            }`}
          style={{
            background: isActive ? "var(--sidebar-active)" : "transparent",
            color: "hsl(var(--foreground))",
          }}
          onMouseEnter={(e) => {
            if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)";
          }}
          onMouseLeave={(e) => {
            if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <span className={`transition-transform duration-150 ${isActive ? "text-red-500" : "group-hover:scale-110"}`}>
            {icon}
          </span>
          <span className="flex-1">{label}</span>
          {badge && (
            <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-bold uppercase">
              {badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  const plan = user?.plan || "free";
  const planBadge = plan !== "free" ? plan : undefined;

  return (
    <aside
      className="w-60 min-h-screen flex-shrink-0 p-2 pt-3 border-r"
      style={{ background: "var(--sidebar-bg)", borderColor: "var(--header-border)" }}
    >
      <nav className="space-y-0.5">
        {navItem("/", <Home className="w-5 h-5" />, "Home")}
        {navItem(
          "/plans",
          <Crown className="w-5 h-5 text-yellow-500" />,
          "Upgrade Plan",
          planBadge
        )}

        {user && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted-text)" }}>
                You
              </p>
            </div>
            <div className="border-b mb-1" style={{ borderColor: "var(--header-border)" }} />

            {navItem("/history",    <History   className="w-5 h-5" />, "History")}
            {navItem("/liked",      <ThumbsUp  className="w-5 h-5" />, "Liked videos")}
            {navItem("/watch-later",<Clock     className="w-5 h-5" />, "Watch later")}
            {navItem("/downloads",  <Download  className="w-5 h-5" />, "Downloads")}

            {user?.channelname ? (
              navItem(`/channel/${user._id}`, <User className="w-5 h-5" />, "Your channel")
            ) : (
              <div className="px-2 py-2">
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="w-full text-sm font-medium py-2 px-3 rounded-xl border transition-colors hover:bg-[var(--sidebar-hover)]"
                  style={{ borderColor: "var(--header-border)", color: "hsl(var(--foreground))" }}
                >
                  + Create Channel
                </button>
              </div>
            )}
          </>
        )}
      </nav>

      <Channeldialogue
        isopen={isDialogOpen}
        onclose={() => setIsDialogOpen(false)}
        mode="create"
      />
    </aside>
  );
};

export default Sidebar;
