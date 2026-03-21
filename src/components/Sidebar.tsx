import { Home, History, ThumbsUp, Clock, User, Download, Crown } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";

const Sidebar = () => {
  const { user } = useUser() as any;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const navItem = (href: string, icon: React.ReactNode, label: string, badge?: string) => (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`w-full justify-start ${router.pathname === href ? "bg-gray-100 dark:bg-gray-800 font-semibold" : ""}`}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        {badge && (
          <span className="text-xs bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        )}
      </Button>
    </Link>
  );

  const plan = user?.plan || "free";
  const planBadge = plan !== "free" ? plan.toUpperCase() : undefined;

  return (
    <aside className="w-64 border-r min-h-screen p-2 flex-shrink-0 bg-inherit">
      <nav className="space-y-1">
        {navItem("/", <Home className="w-5 h-5 mr-3" />, "Home")}
        {navItem("/plans", <Crown className="w-5 h-5 mr-3 text-yellow-500" />, "Upgrade Plan", planBadge)}

        {user && (
          <>
            <div className="border-t pt-2 mt-2">
              <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                You
              </p>
              {navItem("/history", <History className="w-5 h-5 mr-3" />, "History")}
              {navItem("/liked", <ThumbsUp className="w-5 h-5 mr-3" />, "Liked videos")}
              {navItem("/watch-later", <Clock className="w-5 h-5 mr-3" />, "Watch later")}
              {navItem("/downloads", <Download className="w-5 h-5 mr-3" />, "Downloads")}
              {user?.channelname ? (
                navItem(`/channel/${user._id}`, <User className="w-5 h-5 mr-3" />, "Your channel")
              ) : (
                <div className="px-2 py-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    Create Channel
                  </Button>
                </div>
              )}
            </div>
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
