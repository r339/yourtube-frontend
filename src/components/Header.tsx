import { Bell, Menu, Mic, Moon, Search, Sun, User } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Channeldialogue from "./channeldialogue";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

const Header = () => {
  const { user, logout, handlegooglesignin } = useUser() as any;
  const { isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className="flex items-center justify-between px-4 py-2 sticky top-0 z-40 border-b"
      style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}
    >
      {/* ── Logo ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Menu className="w-5 h-5" />
        </Button>
        <Link href="/" className="flex items-center gap-1.5 group select-none">
          <div className="bg-red-600 group-hover:bg-red-500 p-1 rounded-md transition-all group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(255,0,0,0.5)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            YourTube
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded self-start mt-1"
            style={{ color: "var(--muted-text)", background: "var(--chip-bg)" }}
          >
            IN
          </span>
        </Link>
      </div>

      {/* ── Search ───────────────────────────────────── */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-2xl mx-4">
        <div
          className="flex flex-1 rounded-full overflow-hidden border transition-shadow focus-within:shadow-[0_0_0_2px_var(--search-focus)]"
          style={{ borderColor: "var(--search-border)", background: "var(--search-bg)" }}
        >
          <input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 text-sm bg-transparent outline-none placeholder:opacity-60"
            style={{ color: "hsl(var(--foreground))" }}
          />
          <button
            type="submit"
            className="px-5 border-l flex items-center justify-center hover:bg-[var(--sidebar-hover)] transition-colors"
            style={{ borderColor: "var(--search-border)" }}
          >
            <Search className="w-4 h-4" style={{ color: "var(--muted-text)" }} />
          </button>
        </div>
        <button
          type="button"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--sidebar-hover)] transition-colors"
          title="Voice search"
        >
          <Mic className="w-4 h-4" style={{ color: "var(--muted-text)" }} />
        </button>
      </form>

      {/* ── Right Actions ────────────────────────────── */}
      <div className="flex items-center gap-1 min-w-[200px] justify-end">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--sidebar-hover)] transition-all hover:scale-110 hover:rotate-12"
        >
          {isDark
            ? <Sun className="w-5 h-5 text-yellow-400" />
            : <Moon className="w-5 h-5 text-indigo-500" />
          }
        </button>

        {user ? (
          <>
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--sidebar-hover)] transition-colors"
              style={{ color: "hsl(var(--foreground))" }}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-2 ring-transparent hover:ring-red-500 transition-all ml-1 focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className="bg-red-600 text-white font-semibold text-sm">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className="bg-red-600 text-white font-semibold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-none">
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs truncate max-w-[140px] text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {user?.channelname ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/channel/${user?._id}`}>Your channel</Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>Create Channel</DropdownMenuItem>
                )}
                <DropdownMenuItem asChild><Link href="/history">History</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/liked">Liked videos</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/watch-later">Watch later</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/downloads">Downloads</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500 font-medium">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <button
            onClick={handlegooglesignin}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border font-medium text-sm transition-colors text-blue-600 border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <User className="w-4 h-4" />
            Sign in
          </button>
        )}
      </div>

      <Channeldialogue
        isopen={isDialogOpen}
        onclose={() => setIsDialogOpen(false)}
        mode="create"
      />
    </header>
  );
};

export default Header;
