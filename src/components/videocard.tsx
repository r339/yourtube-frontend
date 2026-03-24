import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Play } from "lucide-react";

export default function VideoCard({ video }: any) {
  return (
    <Link href={`/watch/${video?._id}`} className="group block animate-fade-in">
      <div className="space-y-2">
        {/* Thumbnail */}
        <div
          className="relative aspect-video rounded-xl overflow-hidden"
          style={{ background: "var(--skeleton-base)" }}
        >
          <video
            src={video?.filepath}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            preload="metadata"
          />

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            Video
          </div>

          {/* Play button overlay */}
          <div className="play-overlay absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
            <div className="bg-black/70 rounded-full p-3 shadow-lg">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex gap-3 px-1">
          <Avatar className="w-9 h-9 flex-shrink-0 mt-0.5">
            <AvatarFallback
              className="text-sm font-semibold text-white"
              style={{ background: stringToColor(video?.videochanel || "V") }}
            >
              {video?.videochanel?.[0]?.toUpperCase() || "V"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3
              className="font-medium text-sm line-clamp-2 leading-snug mb-1 group-hover:text-red-500 transition-colors"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {video?.videotitle}
            </h3>
            <p className="text-xs" style={{ color: "var(--muted-text)" }}>
              {video?.videochanel}
            </p>
            <p className="text-xs" style={{ color: "var(--muted-text)" }}>
              {video?.views?.toLocaleString()} views
              {video?.createdAt && (
                <> · {formatDistanceToNow(new Date(video.createdAt))} ago</>
              )}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Generate a consistent color from a string (for avatar backgrounds) */
function stringToColor(str: string): string {
  const colors = [
    "#e53935","#d81b60","#8e24aa","#5e35b1",
    "#1e88e5","#00897b","#43a047","#f4511e",
    "#039be5","#3949ab","#00acc1","#c0ca33",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
