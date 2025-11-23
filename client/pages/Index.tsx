import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Post, PostsResponse } from "@shared/api";
import {
  SearchIcon,
  FilterIcon,
  GlobeIcon,
  MapPinIcon,
  ServerIcon,
  FireIcon,
  CloseIcon,
} from "@/components/Icons";

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
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
].sort();

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "United States": [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
  ],
  "United Kingdom": [
    "London",
    "Manchester",
    "Birmingham",
    "Leeds",
    "Glasgow",
    "Liverpool",
    "Newcastle",
    "Sheffield",
    "Bristol",
    "Edinburgh",
  ],
  Canada: [
    "Toronto",
    "Vancouver",
    "Montreal",
    "Calgary",
    "Ottawa",
    "Edmonton",
    "Mississauga",
    "Winnipeg",
    "Quebec City",
    "Hamilton",
  ],
  Australia: [
    "Sydney",
    "Melbourne",
    "Brisbane",
    "Perth",
    "Adelaide",
    "Gold Coast",
    "Canberra",
    "Newcastle",
    "Logan City",
    "Parramatta",
  ],
  Germany: [
    "Berlin",
    "Munich",
    "Frankfurt",
    "Cologne",
    "Hamburg",
    "Dusseldorf",
    "Dortmund",
    "Essen",
    "Leipzig",
    "Dresden",
  ],
  France: [
    "Paris",
    "Marseille",
    "Lyon",
    "Toulouse",
    "Nice",
    "Nantes",
    "Strasbourg",
    "Montpellier",
    "Bordeaux",
    "Lille",
  ],
  India: [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
  ],
  Japan: [
    "Tokyo",
    "Yokohama",
    "Osaka",
    "Kobe",
    "Kyoto",
    "Kawasaki",
    "Saitama",
    "Hiroshima",
    "Fukuoka",
    "Nagoya",
  ],
  Brazil: [
    "Sao Paulo",
    "Rio de Janeiro",
    "Brasilia",
    "Salvador",
    "Fortaleza",
    "Belo Horizonte",
    "Manaus",
    "Curitiba",
    "Recife",
    "Porto Alegre",
  ],
};

export default function Index() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedServer, setSelectedServer] = useState("");
  const [servers, setServers] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [postsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [serverSearch, setServerSearch] = useState("");
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [hasSearchFilters, setHasSearchFilters] = useState(false);

  const availableCities = selectedCountry
    ? (CITIES_BY_COUNTRY[selectedCountry] || []).filter((city) =>
        city.toLowerCase().includes(citySearch.toLowerCase()),
      )
    : [];

  const filteredCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const filteredServers = servers.filter((server) =>
    server.toLowerCase().includes(serverSearch.toLowerCase()),
  );

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const response = await fetch("/api/posts");
        const data: PostsResponse = await response.json();
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch (error) {
        console.error("Error loading posts:", error);
        setPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    const loadServers = async () => {
      try {
        const response = await fetch("/api/servers");
        const data = await response.json();
        setServers(Array.isArray(data.servers) ? data.servers : []);
      } catch (error) {
        console.error("Error loading servers:", error);
        setServers([]);
      }
    };

    loadPosts();
    loadServers();
  }, []);

  useEffect(() => {
    let filtered = posts;
    const hasFilters =
      !!searchQuery || !!selectedCountry || !!selectedCity || !!selectedServer;
    setHasSearchFilters(hasFilters);

    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCountry) {
      filtered = filtered.filter((post) => post.country === selectedCountry);
    }

    if (selectedCity) {
      filtered = filtered.filter((post) => post.city === selectedCity);
    }

    if (selectedServer) {
      filtered = filtered.filter((post) => post.server === selectedServer);
    }

    setFilteredPosts(filtered);
    setCurrentPage(1);
  }, [posts, searchQuery, selectedCountry, selectedCity, selectedServer]);

  useEffect(() => {
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    setDisplayedPosts(filteredPosts.slice(start, end));
  }, [filteredPosts, currentPage, postsPerPage]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col animate-fadeIn">
      <Header />

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900 pt-8 pb-8 md:pt-16 md:pb-12 border-b border-slate-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-fadeIn" style={{ animationDelay: "0.1s" }}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 text-white tracking-tighter leading-tight">
                🔍 Doxing Dot Life
              </h1>
              <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-400 mb-6 max-w-2xl">
                Find if you or someone you know have been Doxed
              </p>
            </div>

            {/* Search Bar */}
            <div
              className="relative mb-4 animate-fadeIn"
              style={{ animationDelay: "0.2s" }}
            >
              <input
                type="text"
                placeholder="Search Doxed Individuals"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-800 border-2 border-slate-700 hover:border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all shadow-md hover:shadow-lg"
              />
              <SearchIcon className="absolute right-4 sm:right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Categories Section */}
            <div
              className="mb-0 animate-fadeIn"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Country Dropdown */}
                <div className="relative group">
                  <label className="text-sm font-bold text-white block mb-3 flex items-center gap-2">
                    <GlobeIcon className="w-4 h-4 text-blue-400" />
                    By Country
                  </label>
                  <input
                    type="text"
                    placeholder={
                      selectedCountry ? selectedCountry : "Select country..."
                    }
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-sm hover:shadow-md"
                  />
                  {countrySearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg z-50 max-h-48 overflow-y-auto shadow-lg">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <button
                            key={country}
                            onClick={() => {
                              setSelectedCountry(country);
                              setCountrySearch("");
                              setSelectedCity("");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-white text-sm transition-colors"
                          >
                            {country}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          No countries found
                        </div>
                      )}
                    </div>
                  )}
                  {selectedCountry && (
                    <button
                      onClick={() => {
                        setSelectedCountry("");
                        setSelectedCity("");
                        setCountrySearch("");
                      }}
                      className="absolute top-3 right-3 text-accent hover:text-accent/80 transition-colors"
                      title="Clear selection"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* City Dropdown */}
                <div className="relative group">
                  <label className="text-sm font-bold text-white block mb-3 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-blue-400" />
                    By City
                  </label>
                  <input
                    type="text"
                    placeholder={selectedCity ? selectedCity : "Select city..."}
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-sm hover:shadow-md"
                  />
                  {citySearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg z-50 max-h-48 overflow-y-auto shadow-lg">
                      {availableCities.length > 0 ? (
                        availableCities.map((city) => (
                          <button
                            key={city}
                            onClick={() => {
                              setSelectedCity(city);
                              setCitySearch("");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-white text-sm transition-colors"
                          >
                            {city}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          No cities found
                        </div>
                      )}
                    </div>
                  )}
                  {selectedCity && (
                    <button
                      onClick={() => {
                        setSelectedCity("");
                        setCitySearch("");
                      }}
                      className="absolute top-3 right-3 text-accent hover:text-accent/80 transition-colors"
                      title="Clear selection"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Server Dropdown */}
                <div className="relative group">
                  <label className="text-sm font-bold text-white block mb-3 flex items-center gap-2">
                    <ServerIcon className="w-4 h-4 text-blue-400" />
                    By Server
                  </label>
                  <input
                    type="text"
                    placeholder={
                      selectedServer ? selectedServer : "Select server..."
                    }
                    value={serverSearch}
                    onChange={(e) => setServerSearch(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all shadow-sm hover:shadow-md"
                  />
                  {serverSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg z-50 max-h-48 overflow-y-auto shadow-lg">
                      {filteredServers.length > 0 ? (
                        filteredServers.map((server) => (
                          <button
                            key={server}
                            onClick={() => {
                              setSelectedServer(server);
                              setServerSearch("");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-white text-sm transition-colors"
                          >
                            {server}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          No servers found
                        </div>
                      )}
                    </div>
                  )}
                  {selectedServer && (
                    <button
                      onClick={() => {
                        setSelectedServer("");
                        setServerSearch("");
                      }}
                      className="absolute top-3 right-3 text-accent hover:text-accent/80 transition-colors"
                      title="Clear selection"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hot & Recent Posts */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-10 sm:mb-12 animate-fadeIn">
            {isLoadingPosts ? (
              <>
                <h2 className="text-5xl md:text-6xl font-black mb-3 flex items-center gap-3 text-white">
                  <span className="inline-block animate-spin">
                    <div className="w-10 h-10 border-3 border-slate-700 border-t-blue-500 rounded-full"></div>
                  </span>
                  Loading Posts
                </h2>
                <p className="text-gray-400">
                  Fetching the latest posts for you...
                </p>
              </>
            ) : filteredPosts.length === 0 ? (
              <>
                <h2 className="text-5xl md:text-6xl font-black mb-3 text-white">
                  No Posts Found
                </h2>
                <p className="text-gray-400">
                  {hasSearchFilters
                    ? "Try adjusting your search filters"
                    : "No posts available at the moment"}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <FireIcon className="w-8 h-8 text-yellow-500" />
                  <h2 className="text-5xl md:text-6xl font-black text-white">
                    Hot & Recent Posts
                  </h2>
                </div>
                <p className="text-gray-400 mt-3">
                  Showing {displayedPosts.length} of {filteredPosts.length}{" "}
                  posts
                </p>
              </>
            )}
          </div>

          {displayedPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 mb-10 sm:mb-12">
                {displayedPosts.map((post, idx) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/post/${post.id}`)}
                    className="group bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer hover:-translate-y-1 animate-fadeIn"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {post.thumbnail && (
                      <div className="w-full h-40 bg-muted overflow-hidden flex items-center justify-center">
                        <img
                          src={post.thumbnail}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                            const parent = img.parentElement;
                            if (
                              parent &&
                              !parent.querySelector("[data-error-shown]")
                            ) {
                              const errorDiv = document.createElement("div");
                              errorDiv.setAttribute("data-error-shown", "true");
                              errorDiv.className =
                                "text-center text-muted-foreground flex flex-col items-center justify-center gap-2";
                              errorDiv.innerHTML =
                                '<div class="text-3xl">🖼️</div><div class="text-xs">Image unavailable</div>';
                              parent.appendChild(errorDiv);
                            }
                          }}
                          crossOrigin="anonymous"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-bold text-white text-base line-clamp-2 mb-3 group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                        {post.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {post.country && (
                          <span className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                            <GlobeIcon className="w-3 h-3" />
                            {post.country}
                          </span>
                        )}
                        {post.city && (
                          <span className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                            <MapPinIcon className="w-3 h-3" />
                            {post.city}
                          </span>
                        )}
                        {post.server && (
                          <span className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                            <ServerIcon className="w-3 h-3" />
                            {post.server}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 animate-fadeIn">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base"
                  >
                    ← Prev
                  </button>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-medium transition-all text-xs sm:text-sm shadow-sm hover:shadow-md",
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 border border-slate-700 hover:border-slate-600 text-white",
                          )}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 animate-fadeIn">
              <p className="text-gray-400 text-base sm:text-lg">
                No posts match your search criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
