import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SearchResult({ video }: { video: any }) {
  return (
    <Link href={`/watch/${video._id}`} className="flex gap-4 group">
      <div className="relative w-64 aspect-video bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        <video
          src={video.filepath}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          preload="metadata"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base line-clamp-2 group-hover:text-blue-600 mb-2">
          {video.videotitle}
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          {video.views?.toLocaleString()} views •{" "}
          {video.createdAt ? formatDistanceToNow(new Date(video.createdAt)) + " ago" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs">{video.videochanel?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-gray-600">{video.videochanel}</p>
        </div>
      </div>
    </Link>
  );
}
