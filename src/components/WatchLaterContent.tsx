import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

export default function WatchLaterContent() {
  const [watchLater, setWatchLater] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser() as any;

  useEffect(() => {
    if (user) loadWatchLater();
    else setLoading(false);
  }, [user]);

  const loadWatchLater = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get(`/watch/${user._id}`);
      setWatchLater(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (videoId: string, watchLaterId: string) => {
    try {
      await axiosInstance.post(`/watch/${videoId}`, { userId: user?._id });
      setWatchLater((prev) => prev.filter((item) => item._id !== watchLaterId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to see Watch Later</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-40 aspect-video bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (watchLater.length === 0) {
    return (
      <div className="text-center py-20">
        <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No saved videos yet</h2>
        <p className="text-gray-500">Videos you save for later will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{watchLater.length} videos</p>
        <Button className="gap-2" size="sm">
          <Play className="w-4 h-4" />
          Play all
        </Button>
      </div>

      {watchLater.map((item) => (
        <div key={item._id} className="flex gap-4 group">
          <Link href={`/watch/${item.videoid?._id}`} className="flex-shrink-0">
            <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden">
              <video
                src={item.videoid?.filepath}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                preload="metadata"
              />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/watch/${item.videoid?._id}`}>
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 mb-1">
                {item.videoid?.videotitle}
              </h3>
            </Link>
            <p className="text-sm text-gray-500">{item.videoid?.videochanel}</p>
            <p className="text-sm text-gray-500">
              {item.videoid?.views?.toLocaleString()} views
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Saved{" "}
              {item.createdAt
                ? formatDistanceToNow(new Date(item.createdAt)) + " ago"
                : ""}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleRemove(item.videoid?._id, item._id)}>
                Remove from Watch Later
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
