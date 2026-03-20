import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, User } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";

const Sidebar = () => {
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const navItem = (href: string, icon: React.ReactNode, label: string) => (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`w-full justify-start ${router.pathname === href ? "bg-gray-100 font-semibold" : ""}`}
      >
        {icon}
        {label}
      </Button>
    </Link>
  );

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-2 flex-shrink-0">
      <nav className="space-y-1">
        {navItem("/", <Home className="w-5 h-5 mr-3" />, "Home")}

        {user && (
          <>
            <div className="border-t pt-2 mt-2">
              <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                You
              </p>
              {navItem("/history", <History className="w-5 h-5 mr-3" />, "History")}
              {navItem("/liked", <ThumbsUp className="w-5 h-5 mr-3" />, "Liked videos")}
              {navItem("/watch-later", <Clock className="w-5 h-5 mr-3" />, "Watch later")}
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
