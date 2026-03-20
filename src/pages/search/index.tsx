import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import SearchResult from "@/components/SearchResult";
import { Search } from "lucide-react";

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!q || typeof q !== "string") return;
    const doSearch = async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await axiosInstance.get(`/video/search?q=${encodeURIComponent(q)}`);
        setResults(res.data);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [q]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {q && (
        <h1 className="text-xl font-semibold mb-6 text-gray-700">
          Search results for: <span className="text-black">&ldquo;{q}&rdquo;</span>
        </h1>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-64 aspect-video bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-2">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No results found</h2>
          <p className="text-gray-500">
            Try different keywords or check for spelling mistakes.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {results.map((video) => (
            <SearchResult key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
