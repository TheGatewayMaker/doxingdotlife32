import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Post, PostsResponse } from "@shared/api";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  SearchIcon,
  FilterIcon,
  GlobeIcon,
  MapPinIcon,
  ServerIcon,
  CloseIcon,
  TrashIcon,
  EditIcon,
} from "@/components/Icons";
import AdminPostCard from "@/components/AdminPostCard";
import { toast } from "sonner";

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Czechia",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    getIdToken,
    isLoading: isAuthLoading,
  } = useAuthContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countrySearch, setCountrySearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);

  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate("/uppostpanel");
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoadingPosts(true);
        const response = await fetch("/api/posts");
        const data: PostsResponse = await response.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast.error("Failed to load posts");
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    let filtered = posts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query) ||
          post.id.includes(query),
      );
    }

    if (selectedCountry) {
      filtered = filtered.filter((post) => post.country === selectedCountry);
    }

    setFilteredPosts(filtered);
    setCurrentPage(1);
  }, [posts, searchQuery, selectedCountry]);

  useEffect(() => {
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    setDisplayedPosts(filteredPosts.slice(start, end));
  }, [filteredPosts, currentPage, postsPerPage]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const handleDeletePost = async (postId: string) => {
    setDeletingPostId(postId);
  };

  const confirmDeletePost = async () => {
    if (!deletingPostId) return;

    try {
      setIsDeletingPost(true);
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch(`/api/posts/${deletingPostId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== deletingPostId),
      );
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeletingPost(false);
      setDeletingPostId(null);
    }
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post,
      ),
    );
    toast.success("Post updated successfully");
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
        <Header />
        <main className="flex-1 w-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <div className="w-10 h-10 border-3 border-muted border-t-accent rounded-full"></div>
            </div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
        <Header />
        <main className="flex-1 w-full flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="text-6xl mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-accent"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-6">
                You need to be logged in to access the admin panel.
              </p>
              <a
                href="/uppostpanel"
                className="inline-block px-6 py-3 bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 transition-all"
              >
                Go to Login
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
      <Header />

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <div className="bg-background py-4 md:py-6 border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="animate-slideInLeftFade"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
                    Admin Panel
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Manage your posts
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div
              className="relative animate-scaleUpFadeIn mt-4"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 bg-card border border-border hover:border-muted rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-muted/50 focus:border-muted text-sm transition-all pl-9"
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Filter Section */}
            <div
              className="bg-card border border-border rounded-lg p-4 mt-3 animate-slideInUp"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Filter
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {/* Country Dropdown */}
                <div className="relative group">
                  <label className="text-xs font-bold text-foreground block mb-2 flex items-center gap-1.5">
                    <GlobeIcon className="w-3 h-3 text-muted-foreground" />
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder={
                      selectedCountry ? selectedCountry : "Search countries..."
                    }
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full px-3 py-2 bg-background/60 border border-border hover:border-muted rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-muted/50 focus:border-muted text-xs transition-all"
                  />
                  {countrySearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg z-50 max-h-40 overflow-y-auto shadow-lg">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <button
                            key={country}
                            onClick={() => {
                              setSelectedCountry(country);
                              setCountrySearch("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-muted text-foreground text-xs transition-all duration-200 flex items-center gap-2"
                          >
                            <GlobeIcon className="w-3 h-3 text-muted-foreground" />
                            {country}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-muted-foreground text-xs text-center">
                          No countries found
                        </div>
                      )}
                    </div>
                  )}
                  {selectedCountry && (
                    <button
                      onClick={() => {
                        setSelectedCountry("");
                        setCountrySearch("");
                      }}
                      className="absolute top-3 right-3 text-accent hover:text-accent/80 hover:scale-110 transition-all"
                      title="Clear selection"
                    >
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Management Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8 animate-slideInUp">
            {isLoadingPosts ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-block animate-spin">
                    <div className="w-8 h-8 border-3 border-muted border-t-blue-600 rounded-full"></div>
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Loading Posts
                    </h2>
                  </div>
                </div>
              </>
            ) : filteredPosts.length === 0 ? (
              <>
                <div className="text-center py-8">
                  <div className="mb-3 flex justify-center">
                    <div className="p-2 bg-muted rounded-lg">
                      <svg
                        className="w-8 h-8 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M20 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h2
                    className="text-lg font-bold text-foreground mb-2 animate-popIn"
                    style={{ animationDelay: "0.2s" }}
                  >
                    No Posts Found
                  </h2>
                  <p
                    className="text-xs text-muted-foreground max-w-sm mx-auto animate-slideInUp"
                    style={{ animationDelay: "0.3s" }}
                  >
                    {searchQuery || selectedCountry
                      ? "Your search didn't match any posts. Try adjusting your filters."
                      : "No posts available at the moment."}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Manage Posts ({filteredPosts.length})
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-600/10 px-3 py-2 rounded-md border border-blue-600/20">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-foreground">
                      {displayedPosts.length} of {filteredPosts.length}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {displayedPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
                {displayedPosts.map((post, idx) => (
                  <AdminPostCard
                    key={post.id}
                    post={post}
                    onDelete={handleDeletePost}
                    onUpdate={handlePostUpdated}
                    animationDelay={idx * 0.08}
                    getIdToken={getIdToken}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-2 sm:gap-3 animate-slideInUp pt-6 border-t border-border/40"
                  style={{ animationDelay: "0.4s" }}
                >
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-1.5 bg-[#0088CC] text-white font-semibold rounded-md hover:bg-[#0077BB] hover:shadow-lg hover:shadow-[#0088CC]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 text-xs sm:text-sm flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Prev
                  </button>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const pageNum =
                        currentPage > 3 ? currentPage + i - 3 : i + 1;
                      if (pageNum > totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "w-7 h-7 sm:w-8 sm:h-8 rounded-md font-semibold transition-all text-xs shadow-sm hover:shadow-md",
                            currentPage === pageNum
                              ? "bg-[#0088CC] text-white shadow-lg shadow-[#0088CC]/30"
                              : "bg-card border-2 border-border hover:border-[#0088CC]/40 text-foreground hover:shadow-lg hover:shadow-[#0088CC]/10",
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    }).filter(Boolean)}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-1.5 bg-[#0088CC] text-white font-semibold rounded-md hover:bg-[#0077BB] hover:shadow-lg hover:shadow-[#0088CC]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 text-xs sm:text-sm flex items-center gap-1"
                  >
                    Next
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 animate-fadeIn">
              <p className="text-muted-foreground text-base sm:text-lg">
                No posts match your search criteria.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deletingPostId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-card border-2 border-border/60 rounded-2xl max-w-sm w-full p-8 shadow-2xl animate-slideInScale">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-red-600/20 border border-red-600/30">
                <svg
                  className="h-7 w-7 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Delete Post
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              You are about to permanently delete this post. All associated
              media files and data will be removed. Please confirm this action.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingPostId(null)}
                disabled={isDeletingPost}
                className="flex-1 px-4 py-2.5 bg-card/80 border-2 border-border/60 text-foreground font-semibold rounded-lg hover:bg-muted/60 hover:border-border/80 disabled:opacity-40 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePost}
                disabled={isDeletingPost}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-red-600/50 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                {isDeletingPost ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
