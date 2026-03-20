import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, ThumbsUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

export default function LikedVideosContent() {
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) loadLikedVideos();
    else setLoading(false);
  }, [user]);

  const loadLikedVideos = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get(`/like/${user._id}`);
      setLikedVideos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (videoId: string, likeId: string) => {
    try {
      await axiosInstance.post(`/like/${videoId}`, { userId: user?._id });
      setLikedVideos((prev) => prev.filter((item) => item._id !== likeId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <ThumbsUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to see liked videos</h2>
      </div>
    );
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="flex gap-4"><div className="w-40 aspect-video bg-gray-200 rounded" /><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /></div></div>)}
    </div>;
  }

  if (likedVideos.length === 0) {
    return (
      <div className="text-center py-20">
        <ThumbsUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No liked videos yet</h2>
        <p className="text-gray-500">Videos you like will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{likedVideos.length} videos</p>
        <Button className="gap-2" size="sm">
          <Play className="w-4 h-4" />
          Play all
        </Button>
      </div>

      {likedVideos.map((item) => (
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
              {item.videoid?.views?.toLocaleString()} views •{" "}
              {item.videoid?.createdAt ? formatDistanceToNow(new Date(item.videoid.createdAt)) + " ago" : ""}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleUnlike(item.videoid?._id, item._id)}>
                Remove from liked videos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}

  useEffect(() => {
    if (user) loadLikedVideos();
    else setLoading(false);
  }, [user]);

  const loadLikedVideos = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get(`/like/${user._id}`);
      setLikedVideos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (videoId: string, likeId: string) => {
    try {
      await axiosInstance.post(`/like/${videoId}`, { userId: user?._id });
      setLikedVideos((prev) => prev.filter((item) => item._id !== likeId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <ThumbsUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to see liked videos</h2>
      </div>
    );
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="flex gap-4"><div className="w-40 aspect-video bg-gray-200 rounded" /><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /></div></div>)}
    </div>;
  }

  if (likedVideos.length === 0) {
    return (
      <div className="text-center py-20">
        <ThumbsUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No liked videos yet</h2>
        <p className="text-gray-500">Videos you like will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{likedVideos.length} videos</p>
        <Button className="gap-2" size="sm">
          <Play className="w-4 h-4" />
          Play all
        </Button>
      </div>

      {likedVideos.map((item) => (
        <div key={item._id} className="flex gap-4 group">
          <Link href={`/watch/${item.videoid?._id}`} className="flex-shrink-0">
            <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden">
              <video
                src={`${backendUrl}/${item.videoid?.filepath}`}
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
              {item.videoid?.views?.toLocaleString()} views •{" "}
              {item.videoid?.createdAt ? formatDistanceToNow(new Date(item.videoid.createdAt)) + " ago" : ""}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleUnlike(item.videoid?._id, item._id)}>
                Remove from liked videos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
