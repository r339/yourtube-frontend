import Videocard from "./videocard";

const ChannelVideos = ({ videos }: { videos: any[] }) => {
  if (!videos || videos.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-8 text-center">
        No videos uploaded yet.
      </p>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Videos ({videos.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((video: any) => (
          <Videocard key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default ChannelVideos;
