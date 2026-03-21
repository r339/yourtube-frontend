import React, { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { ThumbsUp, ThumbsDown, Globe } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  city: string;
  commentedon: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
}

const SPECIAL_CHAR_REGEX = /[<>{}\[\]\\|^`~]/;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
];

const Comments = ({ videoId }: { videoId: string | string[] | undefined }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState("Unknown");
  const [translating, setTranslating] = useState<string | null>(null);
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [showLangMenu, setShowLangMenu] = useState<string | null>(null);
  const [specialCharError, setSpecialCharError] = useState("");
  const { user } = useUser() as any;
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoId) loadComments();
    // Get user's city via IP
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => setUserCity(d.city || "Unknown"))
      .catch(() => setUserCity("Unknown"));
  }, [videoId]);

  // Close lang menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (val: string) => {
    setNewComment(val);
    if (SPECIAL_CHAR_REGEX.test(val)) {
      setSpecialCharError("Special characters like <, >, {, }, [, ], \\, |, ^ are not allowed.");
    } else {
      setSpecialCharError("");
    }
  };

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;
    if (SPECIAL_CHAR_REGEX.test(newComment)) {
      setSpecialCharError("Remove special characters before posting.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment.trim(),
        usercommented: user.name,
        city: userCity,
      });
      if (res.data.comment) {
        const added: Comment = {
          _id: res.data.data?._id || Date.now().toString(),
          videoid: String(videoId),
          userid: user._id,
          commentbody: newComment.trim(),
          usercommented: user.name || "Anonymous",
          city: userCity,
          commentedon: new Date().toISOString(),
          likes: 0,
          dislikes: 0,
          likedBy: [],
          dislikedBy: [],
        };
        setComments([added, ...comments]);
        setNewComment("");
      }
    } catch (err: any) {
      if (err.response?.data?.blocked) {
        setSpecialCharError(err.response.data.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editText.trim() || !editingId) return;
    if (SPECIAL_CHAR_REGEX.test(editText)) {
      alert("Remove special characters before saving.");
      return;
    }
    try {
      await axiosInstance.post(`/comment/editcomment/${editingId}`, {
        commentbody: editText.trim(),
      });
      setComments((prev) =>
        prev.map((c) => (c._id === editingId ? { ...c, commentbody: editText.trim() } : c))
      );
      setEditingId(null);
      setEditText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/like/${commentId}`, {
        userid: user._id,
      });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.data : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async (commentId: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/dislike/${commentId}`, {
        userid: user._id,
      });
      if (res.data.autoDeleted) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      } else {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? res.data : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const translateComment = async (commentId: string, text: string, targetLang: string) => {
    setTranslating(commentId);
    setShowLangMenu(null);
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`
      );
      const data = await response.json();
      const translated = data.responseData?.translatedText || text;
      setTranslatedTexts((prev) => ({ ...prev, [commentId]: translated }));
    } catch {
      setTranslatedTexts((prev) => ({ ...prev, [commentId]: text }));
    } finally {
      setTranslating(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {user ? (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment... (No special characters like < > { } [ ] | ^ \ ` ~)"
              value={newComment}
              onChange={(e) => handleCommentChange(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            {specialCharError && (
              <p className="text-xs text-red-500">{specialCharError}</p>
            )}
            <p className="text-xs text-gray-400">Posting from: {userCity}</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => { setNewComment(""); setSpecialCharError(""); }}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting || !!specialCharError}
              >
                {isSubmitting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">Sign in to leave a comment.</p>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback>{comment.usercommented?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm">{comment.usercommented}</span>
                  {comment.city && comment.city !== "Unknown" && (
                    <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                      📍 {comment.city}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                </div>

                {editingId === comment._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdate} disabled={!editText.trim()}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditingId(null); setEditText(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">
                      {translating === comment._id
                        ? "Translating..."
                        : translatedTexts[comment._id] || comment.commentbody}
                    </p>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {/* Like */}
                      <button
                        className={`flex items-center gap-1 text-xs ${
                          comment.likedBy?.includes(user?._id)
                            ? "text-blue-600"
                            : "text-gray-500 hover:text-blue-600"
                        }`}
                        onClick={() => handleLike(comment._id)}
                        disabled={!user}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {comment.likes || 0}
                      </button>

                      {/* Dislike */}
                      <button
                        className={`flex items-center gap-1 text-xs ${
                          comment.dislikedBy?.includes(user?._id)
                            ? "text-red-600"
                            : "text-gray-500 hover:text-red-600"
                        }`}
                        onClick={() => handleDislike(comment._id)}
                        disabled={!user}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        {comment.dislikes || 0}
                      </button>

                      {/* Translate */}
                      <div className="relative" ref={showLangMenu === comment._id ? langMenuRef : null}>
                        <button
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600"
                          onClick={() =>
                            setShowLangMenu(showLangMenu === comment._id ? null : comment._id)
                          }
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Translate
                        </button>
                        {showLangMenu === comment._id && (
                          <div className="absolute z-50 bottom-6 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-44 grid grid-cols-2 gap-1">
                            {LANGUAGES.map((lang) => (
                              <button
                                key={lang.code}
                                className="text-xs text-left px-2 py-1 rounded hover:bg-gray-100"
                                onClick={() =>
                                  translateComment(comment._id, comment.commentbody, lang.code)
                                }
                              >
                                {lang.label}
                              </button>
                            ))}
                            {translatedTexts[comment._id] && (
                              <button
                                className="col-span-2 text-xs text-left px-2 py-1 rounded hover:bg-gray-100 text-blue-500"
                                onClick={() =>
                                  setTranslatedTexts((prev) => {
                                    const n = { ...prev };
                                    delete n[comment._id];
                                    return n;
                                  })
                                }
                              >
                                Show original
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Edit/Delete (own comments) */}
                      {user?._id === comment.userid && (
                        <>
                          <button
                            className="text-xs text-gray-500 hover:text-blue-600"
                            onClick={() => {
                              setEditingId(comment._id);
                              setEditText(comment.commentbody);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-xs text-gray-500 hover:text-red-600"
                            onClick={() => handleDelete(comment._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
