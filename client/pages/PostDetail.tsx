import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Post } from "@shared/api";

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPosts] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 mb-8 text-accent hover:text-accent/80 transition-colors font-medium animate-fadeIn"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>

          {/* Post Content */}
          <div
            className="bg-card border border-border rounded-xl overflow-hidden shadow-lg animate-fadeIn"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Thumbnail */}
            {post.thumbnail && (
              <div className="w-full h-96 bg-muted overflow-hidden">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-8 md:p-12">
              {/* Title */}
              <h1 className="text-5xl md:text-6xl font-black mb-6 text-foreground">
                {post.title}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 mb-8">
                {post.country && (
                  <span className="inline-block bg-accent/20 text-accent px-4 py-2 rounded-full text-sm font-semibold">
                    🌍 {post.country}
                  </span>
                )}
                {post.city && (
                  <span className="inline-block bg-accent/20 text-accent px-4 py-2 rounded-full text-sm font-semibold">
                    🏙️ {post.city}
                  </span>
                )}
                {post.server && (
                  <span className="inline-block bg-accent/20 text-accent px-4 py-2 rounded-full text-sm font-semibold">
                    🖥️ {post.server}
                  </span>
                )}
              </div>

              {/* Created Date */}
              <p className="text-muted-foreground mb-8">
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
              <div className="prose prose-invert max-w-none mb-12">
                <div className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                  {post.description}
                </div>
              </div>

              {/* Media */}
              {post.mediaFiles && post.mediaFiles.length > 0 && (
                <div className="border-t border-border pt-12">
                  <h2 className="text-2xl font-bold mb-6">📎 Attached Media</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {post.mediaFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="bg-muted rounded-lg overflow-hidden border border-border hover:border-accent transition-colors"
                      >
                        {file.type.startsWith("image/") ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
                          />
                        ) : file.type.startsWith("video/") ? (
                          <video
                            controls
                            preload="metadata"
                            crossOrigin="anonymous"
                            className="w-full h-64 bg-muted"
                          >
                            <source src={file.url} type={file.type} />
                            Your browser does not support the video tag.
                          </video>
                        ) : file.type.startsWith("audio/") ? (
                          <div className="w-full h-64 bg-muted flex items-center justify-center">
                            <audio
                              controls
                              preload="metadata"
                              crossOrigin="anonymous"
                              className="w-full"
                            >
                              <source src={file.url} type={file.type} />
                              Your browser does not support the audio tag.
                            </audio>
                          </div>
                        ) : (
                          <div className="w-full h-64 bg-muted flex items-center justify-center">
                            <p className="text-muted-foreground">
                              File: {file.name}
                            </p>
                          </div>
                        )}
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground truncate">
                            {file.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Button */}
              <div className="border-t border-border pt-8 mt-12">
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
