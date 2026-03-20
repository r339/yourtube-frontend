import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <div className="min-h-screen bg-white text-black flex flex-col">
        <title>YourTube</title>
        <Header />
        <Toaster position="bottom-right" />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Component {...pageProps} />
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
