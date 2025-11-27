import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Share2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostDescriptionSection from "@/components/PostDescriptionSection";
import PostMediaSection from "@/components/PostMediaSection";
import NSFWWarningModal from "@/components/NSFWWarningModal";
import { Post } from "@shared/api";
import { toast } from "sonner";

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPosts] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [thumbnailError, setThumbnailError] = useState(false);
  const [showNSFWWarning, setShowNSFWWarning] = useState(false);
  const [nsfwApproved, setNsfwApproved] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const response = await fetch("/api/posts");
        const data = await response.json();
        const posts = Array.isArray(data.posts) ? data.posts : [];
        const foundPost = posts.find((p: Post) => p.id === postId);

        if (foundPost) {
          setPosts(foundPost);
          if (foundPost.nsfw) {
            setShowNSFWWarning(true);
          }
        } else {
          setError("Post not found");
        }
      } catch (err) {
        console.error("Error loading post:", err);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
        <Header />
        <main className="flex-1 w-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin">
              <div className="w-12 h-12 border-4 border-muted border-t-accent rounded-full"></div>
            </div>
            <p className="mt-4 text-muted-foreground">Loading post...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
        <Header />
        <main className="flex-1 w-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {error || "Post not found"}
            </h2>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 transition-all"
            >
              ← Back to Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (showNSFWWarning && !nsfwApproved && post.nsfw) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
        <Header />
        <main className="flex-1 w-full flex items-center justify-center p-4">
          <NSFWWarningModal
            onProceed={() => setNsfwApproved(true)}
            onGoBack={() => navigate("/")}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy URL:", err);
      if (navigator.share) {
        navigator.share({
          title: post.title,
          text: post.description.substring(0, 100),
          url: url,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
      <Header />
      <main className="flex-1 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 mb-8 text-accent hover:text-accent/80 transition-colors font-medium animate-fadeIn hover:scale-105 active:scale-95"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Home
          </button>

          {/* Main Content Container - Max Width */}
          <div className="max-w-4xl mx-auto">
            {/* NSFW Banner */}
            {post.nsfw && (
              <div className="mb-6 bg-red-900/20 border border-red-600/40 rounded-lg p-4 flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-red-400">NSFW Content</p>
                  <p className="text-sm text-red-300/80">
                    This is NSFW content. Ensure you're viewing in an
                    appropriate setting.
                  </p>
                </div>
              </div>
            )}

            {/* Thumbnail */}
            {post.thumbnail && !thumbnailError && (
              <div className="mb-8 rounded-xl overflow-hidden border border-border shadow-lg animate-fadeIn">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                  onError={() => setThumbnailError(true)}
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {thumbnailError && (
              <div className="mb-8 w-full h-96 bg-muted flex items-center justify-center rounded-xl border border-border">
                <div className="text-center">
                  <div className="text-7xl mb-4">🖼️</div>
                  <p className="text-muted-foreground text-lg">
                    Thumbnail unavailable
                  </p>
                </div>
              </div>
            )}

            {/* Title */}
            <div
              className="mb-6 animate-fadeIn"
              style={{ animationDelay: "0.1s" }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 text-foreground leading-tight">
                {post.title}
              </h1>

              {/* Post Date */}
              <p className="text-muted-foreground text-sm sm:text-base">
                Posted on{" "}
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Description Section */}
            <div
              className="mb-10 animate-fadeIn"
              style={{ animationDelay: "0.2s" }}
            >
              <PostDescriptionSection
                description={post.description}
                tags={{
                  country: post.country,
                  city: post.city,
                  server: post.server,
                }}
              />
            </div>

            {/* Media Section */}
            {post.mediaFiles && post.mediaFiles.length > 0 && (
              <div
                className="mb-10 animate-fadeIn"
                style={{ animationDelay: "0.3s" }}
              >
                <PostMediaSection
                  mediaFiles={post.mediaFiles}
                  postTitle={post.title}
                  thumbnailUrl={post.thumbnail}
                />
              </div>
            )}

            {/* Share Button */}
            <div
              className="border-t border-border pt-8 animate-fadeIn"
              style={{ animationDelay: "0.4s" }}
            >
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Share2 className="w-5 h-5" />
                Share Post
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
