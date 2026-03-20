import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
}

const Comments = ({ videoId }: { videoId: string | string[] | undefined }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (videoId) loadComments();
  }, [videoId]);

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

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment.trim(),
        usercommented: user.name,
      });
      if (res.data.comment) {
        const added: Comment = {
          _id: res.data.data?._id || Date.now().toString(),
          videoid: String(videoId),
          userid: user._id,
          commentbody: newComment.trim(),
          usercommented: user.name || "Anonymous",
          commentedon: new Date().toISOString(),
        };
        setComments([added, ...comments]);
        setNewComment("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editText.trim() || !editingId) return;
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

  if (loading) {
    return <div className="animate-pulse space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded" />)}
    </div>;
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
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setNewComment("")} disabled={!newComment.trim()}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!newComment.trim() || isSubmitting}>
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.usercommented}</span>
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
                      <Button size="sm" onClick={handleUpdate} disabled={!editText.trim()}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditText(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">{comment.commentbody}</p>
                    {user?._id === comment.userid && (
                      <div className="flex gap-3 mt-1">
                        <button
                          className="text-xs text-gray-500 hover:text-blue-600"
                          onClick={() => { setEditingId(comment._id); setEditText(comment.commentbody); }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(comment._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
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
