import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Share2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MediaViewer from "@/components/MediaViewer";
import { Post } from "@shared/api";
import { GlobeIcon, MapPinIcon, ServerIcon } from "@/components/Icons";

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPosts] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [thumbnailError, setThumbnailError] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const response = await fetch("/api/posts");
        const data = await response.json();
        const posts = Array.isArray(data.posts) ? data.posts : [];
        const foundPost = posts.find((p: Post) => p.id === postId);

        if (foundPost) {
          setPosts(foundPost);
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
      <Header />
      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 mb-8 text-accent hover:text-accent/80 transition-colors font-medium animate-fadeIn"
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

          {/* Post Content */}
          <div
            className="bg-card border border-border rounded-xl overflow-hidden shadow-lg animate-fadeIn"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Thumbnail */}
            {post.thumbnail && !thumbnailError && (
              <div className="w-full h-96 bg-muted overflow-hidden">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  onError={() => setThumbnailError(true)}
                  crossOrigin="anonymous"
                />
              </div>
            )}
            {thumbnailError && (
              <div className="w-full h-96 bg-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl mb-4">🖼️</div>
                  <p className="text-muted-foreground text-lg">
                    Thumbnail unavailable
                  </p>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 sm:p-8 md:p-10">
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-5 text-foreground leading-tight">
                {post.title}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mb-6">
                {post.country && (
                  <span className="inline-flex items-center gap-2 bg-accent/20 text-accent px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
                    <GlobeIcon className="w-4 h-4" />
                    {post.country}
                  </span>
                )}
                {post.city && (
                  <span className="inline-flex items-center gap-2 bg-accent/20 text-accent px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
                    <MapPinIcon className="w-4 h-4" />
                    {post.city}
                  </span>
                )}
                {post.server && (
                  <span className="inline-flex items-center gap-2 bg-accent/20 text-accent px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
                    <ServerIcon className="w-4 h-4" />
                    {post.server}
                  </span>
                )}
              </div>

              {/* Created Date */}
              <p className="text-muted-foreground mb-6 text-sm">
                Posted on{" "}
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {/* Description */}
              <div className="prose prose-invert max-w-none mb-10 sm:mb-12">
                <div className="text-base sm:text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                  {post.description}
                </div>
              </div>

              {/* Media */}
              {post.mediaFiles && post.mediaFiles.length > 0 && (
                <MediaViewer
                  mediaFiles={post.mediaFiles}
                  postTitle={post.title}
                />
              )}

              {/* Share Button */}
              <div className="border-t border-border pt-6 sm:pt-8 mt-10 sm:mt-12">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: post.title,
                        text: post.description.substring(0, 100),
                        url: window.location.href,
                      });
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <Share2 className="w-5 h-5" />
                  Share Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
