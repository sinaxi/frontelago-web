document.addEventListener("DOMContentLoaded", function () {
  // Register ScrollTrigger plugin (works with or without Lenis)
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const MOBILE_SCROLLER = ".page_wrap";

  window.isMobile = function () {
    let userAgentCheck = false;

    if (
      navigator.userAgentData &&
      navigator.userAgentData.mobile !== undefined
    ) {
      userAgentCheck = navigator.userAgentData.mobile;
    } else {
      userAgentCheck =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
    }

    return userAgentCheck;
  };

  function getScrollContainer() {
    if (isMobile()) {
      return (
        document.querySelector(MOBILE_SCROLLER) ||
        document.querySelector("main") ||
        window
      );
    }
    return window;
  }

  let currentScroller = getScrollContainer();
  ScrollTrigger.defaults({ scroller: currentScroller });

  function updateViewportHeight() {
    if (isMobile()) {
      document.documentElement.style.setProperty(
        "--dvh",
        `${window.innerHeight / 100}px`
      );
      document.documentElement.style.setProperty(
        "--dvw",
        `${window.innerWidth / 100}px`
      );
    } else {
      document.documentElement.style.removeProperty("--dvh");
      document.documentElement.style.removeProperty("--dvw");
    }
  }

  function configureScrollEnvironment() {
    updateViewportHeight();

    const newScroller = getScrollContainer();
    if (newScroller !== currentScroller) {
      currentScroller = newScroller;
      ScrollTrigger.defaults({ scroller: currentScroller });
    }

    if (isMobile()) {
      document.body.classList.add("disable-cursor", "viewport-mobile");

      if (document.body.classList.contains("enable-lenis")) {
        document.body.classList.replace("enable-lenis", "fixed-viewport");
      } else {
        document.body.classList.add("fixed-viewport");
      }
    } else {
      document.body.classList.remove(
        "disable-cursor",
        "viewport-mobile",
        "fixed-viewport"
      );
      document.body.classList.add("enable-lenis");
    }
  }

  configureScrollEnvironment();

  function bindInPageLinks() {
    const scroller = currentScroller;
    const anchors = document.querySelectorAll('a[href^="#"]');

    anchors.forEach((anchor) => {
      if (anchor.dataset.anchorBound === "true") return;

      const href = anchor.getAttribute("href");

      if (!href || href.length <= 1) {
        return;
      }

      let target = null;
      try {
        target = document.querySelector(href);
      } catch (error) {
        target = null;
      }

      if (!target) {
        return;
      }

      anchor.dataset.anchorBound = "true";

      // Nota: non aggiorniamo mai l'URL con l'hash. Un fragment persistente
      // (es. #top, che punta alla sezione video) fa sì che iOS Safari
      // ri-ancori la pagina a quell'elemento a ogni cambio di layout
      // durante il caricamento, bloccando lo scroll dell'utente.
      anchor.addEventListener("click", (event) => {
        event.preventDefault();

        if (scroller && scroller !== window) {
          const scrollerRect = scroller.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const targetOffset =
            targetRect.top - scrollerRect.top + scroller.scrollTop;

          if (typeof scroller.scrollTo === "function") {
            scroller.scrollTo({
              top: targetOffset,
              behavior: "smooth",
            });
          } else {
            scroller.scrollTop = targetOffset;
          }
        } else if (lenis && typeof lenis.scrollTo === "function") {
          lenis.scrollTo(target);
        } else {
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  bindInPageLinks();

  let lenis = null;

  // Initialize Lenis for ALL devices - keep your original working config!
  function shouldInitializeLenis() {
    return !isMobile();
  }

  if (shouldInitializeLenis()) {
    lenis = new Lenis({
      wheelMultiplier: 1,
      smooth: true,
      prevent: (node) => node.id === "modal_content",
      lerp: 0.1,
      duration: 1.2,
      overscroll: false,
      autoResize: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } 

  // Function to refresh ScrollTrigger instances
  function refreshScrollTriggers() {
    ScrollTrigger.refresh();
    if (lenis) {
      lenis.resize();
    }
  }

  // Modal Opening and closing code

  // Disable Lenis for buttons with data-lenis-stop
  document.querySelectorAll("[data-lenis-stop]").forEach((button) => {
    button.addEventListener("click", () => {
      // console.log("Popup button clicked");
      if (lenis) {
        lenis.stop();
      } else {
        document.body.classList.add("u-live-noscroll");
      }
    });
  });

  // Enable Lenis for buttons with data-lenis-start
  document.querySelectorAll("[data-lenis-start]").forEach((button) => {
    button.addEventListener("click", () => {
      if (lenis) {
        lenis.start();
      } else {
        document.body.classList.remove("u-live-noscroll");
      }
    });
  });

  // Simple toggle function using native isStopped
  // Attach to buttons with class checking
  document.querySelectorAll("[data-lenis-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      // console.log("Menu Opening");
      // Check if the button has w--open class
      if (button.classList.contains("w--open")) {
        // Menu is Closing - Enable scrolling
        document.body.classList.remove("u-live-noscroll");
        // console.log("Modal opened - scrolling disabled");
      } else {
        // Menu is Closing - Disable scrolling
        document.body.classList.add("u-live-noscroll");
        // console.log("Modal closed - scrolling enabled");
      }
    });
  });

  // Remove u-live-noscroll class when nav links are clicked
  document.querySelectorAll(".nav_1_links_link").forEach((link) => {
    link.addEventListener("click", () => {
      document.body.classList.remove("u-live-noscroll");

      // Also restart Lenis if it exists (based on your existing code pattern)
      if (typeof lenis !== "undefined" && lenis) {
        lenis.start();
      }
    });
  });

  // On resize, do a full reload to keep pinned animations sane
  let resizeRefreshTimeout;
  let initialWidth = window.innerWidth;

  window.addEventListener("resize", () => {
    configureScrollEnvironment();
    bindInPageLinks();
    clearTimeout(resizeRefreshTimeout);
    resizeRefreshTimeout = setTimeout(() => {
      const currentWidth = window.innerWidth;
      const widthChanged = Math.abs(currentWidth - initialWidth) > 10;
      if (widthChanged) {
        window.location.reload();
      }
      initialWidth = currentWidth;

    }, 300);
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      configureScrollEnvironment();
      bindInPageLinks();
    }, 100);
  });

  /////////////////////////////////
  /* PRELOADER — welcome words cover hero image + video preload */
  /////////////////////////////////

  const WELCOME_WORDS = [
    "Benvenuto",
    "Welcome",
    "Griaßdi",
    "Ciao",
    "Grüezi",
    "Servus",
    "Hello",
    "Buongiorno",
    "Willkommen",
    "Welkom",
    "Velkommen",
  ];

  const HERO_PRELOAD_IMAGES = [
    "images/slider-1-attico-frontelago-lago-iseo-lake-valle-camonica.jpg",
    "images/slider-2-attico-frontelago-lago-iseo-lake-valle-camonica.jpg",
    "images/slider-3-attico-frontelago-lago-iseo-lake-valle-camonica.jpg",
    "images/slider-4-attico-frontelago-lago-iseo-lake-valle-camonica.jpg",
    "assets/hero-video-poster.jpg",
  ];

  const isCoarsePointer =
    window.matchMedia("(hover: none), (pointer: coarse)").matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");

  // Fast welcome — soft video warm runs in parallel, never blocks dismiss
  const PRELOADER_MIN_MS = isCoarsePointer ? 650 : 950;
  const PRELOADER_MAX_MS = isCoarsePointer ? 1400 : 1800;

  const preloaderWelcome = document.querySelector("[data-preloader-welcome]");
  const preloaderWelcomeText = document.querySelector(
    ".preloader_welcome_text"
  );
  const preloaderWrap = document.querySelector(".preloader_wrap");

  let preloaderClosed = false;
  let preloaderUnlocked = false;
  let welcomeMinDone = false;
  let heroMediaReady = false;

  function getHeroVideoSrc() {
    if (window.__frontelagoHeroVideoSrc) {
      return window.__frontelagoHeroVideoSrc;
    }
    return window.matchMedia("(min-width: 768px)").matches
      ? "assets/attico-frontelago-pisogne-iseo-lake-brescia.mp4"
      : "assets/attico-frontelago-pisogne-iseo-lake-brescia-mobile.mp4";
  }

  function unlockAfterPreloader() {
    if (preloaderUnlocked) return;
    preloaderUnlocked = true;
    document.body.classList.remove("u-live-noscroll");
    const heroSection = document.querySelector(".section_loader");
    if (heroSection) {
      heroSection.classList.add("is-hero-ready", "is-hero-living");
    }
    if (lenis) lenis.start();
    try {
      refreshScrollTriggers();
    } catch (_) {
      /* ignore */
    }
    // Now start muted hero download + play (deferred from welcome)
    if (window.__frontelagoVideo && typeof window.__frontelagoVideo.startHero === "function") {
      window.__frontelagoVideo.startHero();
    } else {
      const heroVideo = document.getElementById("hero_video");
      if (heroVideo) forceHeroVideoPlay(heroVideo);
    }
    window.dispatchEvent(new CustomEvent("frontelago:preloader-done"));
    // If the hero sequence registered after welcome already closed, kick it now
    if (typeof window.__frontelagoStartHeroSequence === "function") {
      window.__frontelagoStartHeroSequence();
    }
  }

  function hidePreloaderWrap() {
    if (!preloaderWrap) return;
    preloaderWrap.classList.add("is-done");
    preloaderWrap.classList.remove("is-leaving");
    preloaderWrap.style.setProperty("display", "none", "important");
    preloaderWrap.style.setProperty("pointer-events", "none", "important");
    preloaderWrap.style.setProperty("visibility", "hidden", "important");
    preloaderWrap.setAttribute("aria-hidden", "true");
  }

  function revealPageChrome() {
    try {
      gsap.set(".nav_component", { y: 0, opacity: 1, clearProps: "transform" });
      // Do not touch loader image scale here — CSS ken-burns owns it (avoids snap)
    } catch (_) {
      document.querySelectorAll(".nav_component").forEach((el) => {
        el.style.transform = "none";
        el.style.opacity = "1";
      });
    }
  }

  function dismissPreloader() {
    if (preloaderClosed) return;
    preloaderClosed = true;

    if (preloaderWelcome) {
      preloaderWelcome.style.opacity = "0";
    }

    if (preloaderWrap) {
      preloaderWrap.classList.add("is-leaving");
    }

    // Start full hero download as soon as leave begins (cache already warm)
    if (
      window.__frontelagoVideo &&
      typeof window.__frontelagoVideo.startHero === "function"
    ) {
      window.__frontelagoVideo.startHero();
    }

    // Fast close — do not depend on GSAP ticker
    window.setTimeout(() => {
      hidePreloaderWrap();
      revealPageChrome();
      unlockAfterPreloader();
    }, 420);

    // Nuclear failsafe
    window.setTimeout(() => {
      hidePreloaderWrap();
      revealPageChrome();
      unlockAfterPreloader();
    }, 1100);
  }

  function maybeDismissPreloader() {
    if (welcomeMinDone && heroMediaReady) {
      dismissPreloader();
    }
  }

  function preloadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve(true);
      };
      img.onload = done;
      img.onerror = done;
      img.decoding = "async";
      img.src = src;
      if (img.complete) done();
    });
  }

  function videoHasPlayableBuffer(video) {
    if (!video) return false;
    if (video.readyState >= 3) return true;
    try {
      if (video.buffered && video.buffered.length) {
        return video.buffered.end(video.buffered.length - 1) >= 1.5;
      }
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  // iOS: the <video> tags own their <source> children — JS must never touch
  // src or call load(), or Safari drops the native autoplay grant.
  function configureHeroVideoElement(video) {
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.controls = false;
    video.removeAttribute("controls");
    video.setAttribute("muted", "muted");
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
  }

  function forceHeroVideoPlay(video) {
    if (!video) return Promise.resolve(false);
    configureHeroVideoElement(video);

    const attemptPlay = () => {
      // Re-assert muted right before play — required for iOS/Safari autoplay
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      let play;
      try {
        play = video.play();
      } catch (_) {
        return Promise.resolve(false);
      }
      if (play && typeof play.then === "function") {
        return play
          .then(() => !video.paused)
          .catch(() => false);
      }
      return Promise.resolve(!video.paused);
    };

    if (video.readyState >= 2) {
      return attemptPlay();
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        resolve(!!ok);
      };
      const onReady = () => {
        attemptPlay().then(finish);
      };
      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("canplay", onReady, { once: true });
      attemptPlay().then((ok) => {
        if (ok) finish(true);
      });
      window.setTimeout(() => {
        attemptPlay().then(finish);
      }, 400);
    });
  }

  function preloadHeroVideo() {
    // Bind + buffer on the real <video> element (no competing Range fetch)
    if (
      window.__frontelagoVideo &&
      typeof window.__frontelagoVideo.startHero === "function"
    ) {
      return window.__frontelagoVideo
        .startHero()
        .then(() => true)
        .catch(() => true);
    }
    const heroVideo = document.getElementById("hero_video");
    if (heroVideo) return forceHeroVideoPlay(heroVideo).then(() => true);
    return Promise.resolve(true);
  }

  function preloadHeroMedia() {
    // Start real media download immediately while first still loads
    preloadHeroVideo().catch(() => {});

    const firstStill = preloadImage(HERO_PRELOAD_IMAGES[0]);
    // On mobile, don't prefetch remaining stills — they steal bandwidth from the reel
    const rest = isCoarsePointer
      ? []
      : HERO_PRELOAD_IMAGES.slice(1).map(preloadImage);
    return Promise.race([
      firstStill,
      new Promise((resolve) =>
        window.setTimeout(() => resolve(true), isCoarsePointer ? 700 : 1100)
      ),
    ]).then(() => {
      Promise.all(rest).catch(() => {});
      return true;
    });
  }

  function runWelcomeCycle(onMinDone) {
    let minNotified = false;
    const notifyMin = () => {
      if (minNotified) return;
      minNotified = true;
      onMinDone();
    };

    if (!preloaderWelcome || !preloaderWelcomeText) {
      notifyMin();
      return;
    }

    preloaderWelcome.style.opacity = "0";
    preloaderWelcomeText.textContent = WELCOME_WORDS[0];
    window.requestAnimationFrame(() => {
      preloaderWelcome.style.transition = "opacity 0.45s ease-out";
      preloaderWelcome.style.opacity = "0.75";
    });

    let index = 0;
    const advance = () => {
      if (preloaderClosed) return;
      index = (index + 1) % WELCOME_WORDS.length;
      preloaderWelcomeText.textContent = WELCOME_WORDS[index];
      window.setTimeout(advance, 150);
    };

    window.setTimeout(advance, 1000);
    window.setTimeout(notifyMin, PRELOADER_MIN_MS);
  }

  document.body.classList.add("u-live-noscroll");
  if (lenis) lenis.stop();

  if (preloaderWrap) {
    preloaderWrap.style.backgroundColor = "#c9971c";
    preloaderWrap.style.height = "100svh";
  }

  // Welcome words keep looping while hero stills + video buffer
  runWelcomeCycle(() => {
    welcomeMinDone = true;
    maybeDismissPreloader();
  });

  preloadHeroMedia().then(() => {
    heroMediaReady = true;
    maybeDismissPreloader();
  });

  // Never hang on slow networks — hard dismiss
  window.setTimeout(() => {
    welcomeMinDone = true;
    heroMediaReady = true;
    dismissPreloader();
  }, PRELOADER_MAX_MS);

  // Extra hard failsafe — hide via DOM even if dismiss state got stuck
  window.setTimeout(() => {
    try {
      hidePreloaderWrap();
      document.body.classList.remove("u-live-noscroll");
      unlockAfterPreloader();
    } catch (_) {
      /* ignore */
    }
  }, PRELOADER_MAX_MS + 800);

  /////////////////////////////////
  /* ALL OTHER ANIMATIONS - WAIT FOR FONTS */
  /////////////////////////////////

  let fontAnimationsStarted = false;

  // Function to initialize all font-dependent animations
  function initializeFontDependentAnimations() {
    if (fontAnimationsStarted) return;
    fontAnimationsStarted = true;

    const onLoadHeading = document.querySelector(
      '[data-animate-heading="on-load"]'
    );
    const onLoadText = document.querySelector('[data-animate-text="on-load"]');

    let headingSplit, textSplit;

    try {
      if (onLoadHeading) {
        headingSplit = new SplitText(onLoadHeading, { type: "words" });
        gsap.set(headingSplit.words, { opacity: 0, yPercent: 100 });
      }
      if (onLoadText) {
        textSplit = new SplitText(onLoadText, { type: "lines" });
        gsap.set(textSplit.lines, { opacity: 0, y: 40 });
      }
    } catch (_) {
      headingSplit = null;
      textSplit = null;
    }

    // Avoid re-hiding chrome if welcome already dismissed while waiting on fonts
    if (!preloaderClosed) {
      gsap.set(".nav_component", {
        y: -100,
        opacity: 0,
      });
    } else {
      revealPageChrome();
    }

    /////////////////////////////////
    /* Hero Navbar */
    /////////////////////////////////

    function initializeNavbarAnimation() {
      // Get navbar elements
      const navButtonsMenu = document.querySelector(".nav_buttons_menu");
      const navMenuWrap = document.querySelector(".nav_desktop_wrap");
      const navMenuMask = document.querySelector(".nav_desktop_mask");
      const navMenuTrigger = document.querySelector(".nav_desktop_trigger");
      // Only desktop links — mobile nav shares .nav_1_links_link and must stay visible
      const navMenuLinks = navMenuWrap
        ? navMenuWrap.querySelectorAll(".nav_1_links_link")
        : [];

      if (!navButtonsMenu || !navMenuTrigger) return;

      // Get text elements for splitting and icon
      const triggerText = navMenuTrigger.querySelector(".nav_desktop_text");
      const triggerIcon = navMenuTrigger.querySelector(".nav_desktop_icon");
      const linkTexts = [];

      // Collect desktop link text elements only
      navMenuLinks.forEach((link) => {
        const textElement = link.querySelector(".nav_1_links_text");
        if (textElement) {
          linkTexts.push(textElement);
        }
      });

      // Split text into words
      let triggerSplit = null;
      let linkSplits = [];

      // Split trigger text
      if (triggerText) {
        triggerSplit = new SplitText(triggerText, {
          type: "chars",
          wordsClass: "chars",
        });
      }

      // Split link texts
      linkTexts.forEach((textElement) => {
        const split = new SplitText(textElement, {
          type: "words",
          wordsClass: "word",
        });
        linkSplits.push({
          element: textElement,
          split: split,
        });
      });

      const triggerWidth = navMenuTrigger.offsetWidth;

      // Reset to initial hidden state
      gsap.set(navMenuMask, {
        display: "none",
        position: "absolute",
        width: triggerWidth,
        opacity: 0,
        pointerEvents: "none",
      });

      gsap.set(navMenuWrap, {
        position: "relative",
      });

      gsap.set(navMenuTrigger, {
        position: "relative",
        display: "flex",
      });

      // Set initial positions for split text and icon
      if (triggerSplit) {
        gsap.set(triggerSplit.chars, {
          yPercent: 0,
          opacity: 1,
        });
      }

      if (triggerIcon) {
        gsap.set(triggerIcon, {
          x: 0,
          opacity: 1,
        });
      }

      // Initially hide all link words
      linkSplits.forEach((splitData) => {
        gsap.set(splitData.split.words, {
          yPercent: 100,
          opacity: 0,
        });
      });

      // Animation state management - SIMPLIFIED APPROACH
      let hoverInTl = null;
      let hoverOutTl = null;
      let isOpen = false;

      function openMenu() {
        if (isOpen) return;

        // console.log("Opening menu...");
        isOpen = true;

        // Kill any existing animations
        if (hoverInTl) hoverInTl.kill();
        if (hoverOutTl) hoverOutTl.kill();

        hoverInTl = gsap.timeline({
          onComplete: () => {
            hoverInTl = null;
            // console.log("Open animation completed");
          },
        });

        // PHASE 1: Trigger exit animations
        hoverInTl
          .to(
            triggerSplit ? triggerSplit.chars : [],
            {
              yPercent: 100,
              opacity: 0,
              duration: 0.35,
              ease: "Quart.easeIn",
              stagger: 0.05,
            },
            0
          )

          .to(
            triggerIcon || [],
            {
              x: 100,
              opacity: 0,
              duration: 0.35,
              ease: "Quart.easeIn",
            },
            0
          );

        // PHASE 2: Position changes
        hoverInTl
          .set(navMenuTrigger, { position: "absolute" }, 0)
          .set(navMenuMask, { position: "relative", display: "flex" }, 0);

        // PHASE 3: Mask expansion
        hoverInTl.to(
          navMenuMask,
          {
            width: "auto",
            opacity: 1,
            pointerEvents: "auto",
            duration: 0.5,
            ease: "Quart.easeInOut",
          },
          0.15
        );

        // PHASE 4: Link animations
        linkSplits.forEach((splitData, index) => {
          hoverInTl.to(
            splitData.split.words,
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.35,
              ease: "Back.easeOut",
              stagger: -0.03,
            },
            0.25 + index * 0.05
          );
        });

        hoverInTl.to(navMenuTrigger, { display: "none" }, 0);
      }

      function closeMenu() {
        if (!isOpen) return;

        // console.log("Closing menu...");
        isOpen = false;

        // Kill any existing animations
        if (hoverInTl) hoverInTl.kill();
        if (hoverOutTl) hoverOutTl.kill();

        hoverOutTl = gsap.timeline({
          onComplete: () => {
            hoverOutTl = null;

            // Reset to initial state
            gsap.set(navMenuTrigger, { position: "relative" });
            gsap.set(navMenuMask, {
              position: "absolute",
              display: "none",
              width: triggerWidth + "px",
              opacity: 0,
              pointerEvents: "none",
            });

            // console.log("Close animation completed, menu reset");
          },
        });

        gsap.set(navMenuTrigger, { display: "flex" });

        // PHASE 1: Link words exit
        linkSplits
          .slice()
          .reverse()
          .forEach((splitData, index) => {
            hoverOutTl.to(
              splitData.split.words,
              {
                yPercent: -100,
                opacity: 0,
                duration: 0.3,
                ease: "Quart.easeIn",
                stagger: 0.02,
              },
              index * 0.04
            );
          });

        // PHASE 2: Mask collapse
        hoverOutTl.to(
          navMenuMask,
          {
            width: triggerWidth + "px",
            opacity: 0,
            duration: 0.5,
            ease: "Quart.easeInOut",
          },
          0.15
        );

        // PHASE 3: Hide interactions
        hoverOutTl.set(
          navMenuMask,
          {
            pointerEvents: "none",
          },
          0.5
        );

        // PHASE 4: Trigger elements return
        hoverOutTl
          .to(
            triggerSplit ? triggerSplit.chars : [],
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.35,
              ease: "Quart.easeOut",
              stagger: -0.05,
            },
            0.3
          )

          .to(
            triggerIcon || [],
            {
              x: 0,
              opacity: 1,
              duration: 0.35,
              ease: "Quart.easeOut",
            },
            0.3
          );
      }

      // Event listeners - SIMPLIFIED
      if (navButtonsMenu) {
        navButtonsMenu.addEventListener("mouseenter", () => {
          // console.log("Mouse enter - opening menu");
          openMenu();
        });

        navButtonsMenu.addEventListener("mouseleave", () => {
          // console.log("Mouse leave - closing menu");
          closeMenu();
        });
      }

      // Cleanup function
      window.addEventListener("beforeunload", () => {
        if (hoverInTl) hoverInTl.kill();
        if (hoverOutTl) hoverOutTl.kill();

        if (triggerSplit && triggerSplit.revert) {
          triggerSplit.revert();
        }
        linkSplits.forEach((splitData) => {
          if (splitData.split && splitData.split.revert) {
            splitData.split.revert();
          }
        });
      });

      // Handle window resize
      let resizeTimeout;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          // Refresh split text
          if (triggerSplit && triggerSplit.split) {
            triggerSplit.split();
          }
          linkSplits.forEach((splitData) => {
            if (splitData.split && splitData.split.split) {
              splitData.split.split();
            }
          });
        }, 250);
      });
    }

    // 💡 RECOMMENDED FIX - Replace your current function with this
    function initializeNavbarScrollBehaviorWithScrollTrigger() {
      if (isMobile()) return;

      const navComponent = document.querySelector(".nav_component");
      if (!navComponent) return;

      let lastDirection = 0;
      let scrollBuffer = 0;
      const SCROLL_THRESHOLD = 80; // Pixels to scroll before changing state

      ScrollTrigger.create({
        start: "top -100",
        end: 99999,
        onUpdate: (self) => {
          const direction = self.direction;

          // Accumulate scroll in the current direction
          if (direction === lastDirection) {
            scrollBuffer += Math.abs(self.getVelocity() / 60); // Normalize velocity
          } else {
            scrollBuffer = 0; // Reset if direction changed
          }

          // Only trigger animation if we've scrolled enough
          if (scrollBuffer > SCROLL_THRESHOLD) {
            if (direction === 1) {
              // Scrolling down - hide navbar
              gsap.to(navComponent, {
                yPercent: -175,
                duration: 0.6,
                ease: "power2.out",
              });
            } else {
              // Scrolling up - show navbar
              gsap.to(navComponent, {
                yPercent: 0,
                duration: 0.6,
                ease: "power2.out",
              });
            }
            scrollBuffer = 0; // Reset buffer after triggering
          }

          lastDirection = direction;
        },
      });

      // Always show navbar when at top
      ScrollTrigger.create({
        start: "top top",
        end: "top -100",
        onEnter: () => {
          gsap.to(navComponent, {
            yPercent: 0,
            duration: 0.5,
            ease: "power2.out",
          });
          scrollBuffer = 0;
        },
        onLeaveBack: () => {
          gsap.to(navComponent, {
            yPercent: 0,
            duration: 0.5,
            ease: "power2.out",
          });
          scrollBuffer = 0;
        },
      });
    }

    !isMobile() ? initializeNavbarAnimation() : "";
    !isMobile()
      ? initializeNavbarScrollBehaviorWithScrollTrigger()
      : "";

    /////////////////////////////////
    /* H2 LINE FADE-IN ANIMATION */
    /////////////////////////////////

    // Find all wrappers with the data attribute
    const lineFadeWrappers = document.querySelectorAll(
      "[data-animate-heading='line-fade-in']"
    );

    lineFadeWrappers.forEach((wrapper) => {
      // Find h2 inside the wrapper
      const h2Element = wrapper.querySelector("h2");

      if (!h2Element) return; // Skip if no h2 found

      // Split the h2 text into lines
      const splitText = new SplitText(h2Element, {
        type: "lines, words",
        linesClass: "fade-line",
        autoSplit: true,
        onSplit: (self) => {
          return gsap.fromTo(
            self.lines,
            {
              opacity: 0,
              yPercent: 100,
            },
            {
              opacity: 1,
              yPercent: 0,
              duration: 0.8,
              stagger: 0.2,
              ease: "power2.out",
              scrollTrigger: {
                trigger: wrapper,
                start: "top 70%",
                // markers: true, // Uncomment for debugging
                once: true,
              },
              onComplete: () => splitText.revert(),
            }
          );
        },
      });
    });

    /////////////////////////////////
    /* 2ND Hero Slider */
    /////////////////////////////////

    const heroSlides = document.querySelectorAll(".hero_slide");
    if (heroSlides.length) {
      // ====== ANIMATION TIMING VARIABLES ======
      const ANIMATION_CONFIG = {
        // Heading animations
        heading: {
          stagger: 0.15,
          duration: 0.75,
        },
        // Text animations
        text: {
          stagger: 0.05,
          duration: 0.6,
          slideInDelay: 0.2, // Simple delay in seconds for text slide-in
        },
        // Container animations
        container: {
          headingDuration: 1,
          textDuration: 0.8,
          slideOutDelay: 0.1,
        },
      };

      let currentIndex = 0;
      let splitInstances = [];
      let isFirstAnimation = true;

      // Initialize - move all heading and text out of screen
      heroSlides.forEach((slide) => {
        const heading = slide.querySelector('[data-animate-heading="h1"]');
        const text = slide.querySelector('[data-animate-text="hero-sub"]');
        const textElement = text ? text.querySelector("p") : null;

        // Split text and store instances
        if (heading) {
          const headingSplit = new SplitText(heading, { type: "chars" });
          splitInstances.push({
            element: heading,
            split: headingSplit,
            type: "heading",
          });

          // Move heading and its chars out of screen initially
          gsap.set(heading, { yPercent: 100, y: "50vh" });
          gsap.set(headingSplit.chars, { yPercent: 100, y: "50vh" });
        }

        if (textElement) {
          const textSplit = new SplitText(textElement, { type: "words" });
          splitInstances.push({
            element: textElement,
            split: textSplit,
            type: "text",
          });

          // Move text and its words out of screen initially
          gsap.set(textElement, { yPercent: 100, y: "50vh" });
          gsap.set(textSplit.words, { yPercent: 100, y: "50vh", opacity: 0 });
        }
      });

      // Get split instance for an element
      function getSplitInstance(element) {
        return splitInstances.find((instance) => instance.element === element);
      }

      // Reset slide to bottom position
      function resetSlideToBottom(slideIndex) {
        const slide = heroSlides[slideIndex];
        const heading = slide.querySelector('[data-animate-heading="h1"]');
        const text = slide.querySelector('[data-animate-text="hero-sub"]');
        const textElement = text ? text.querySelector("p") : null;

        if (heading) {
          const headingInstance = getSplitInstance(heading);
          gsap.set(heading, { yPercent: 100, y: "50vh" });
          if (headingInstance && headingInstance.split.chars) {
            gsap.set(headingInstance.split.chars, { yPercent: 100, y: "50vh" });
          }
        }

        if (textElement) {
          const textInstance = getSplitInstance(textElement);
          gsap.set(textElement, { yPercent: 100, y: "50vh" });
          if (textInstance && textInstance.split.words) {
            gsap.set(textInstance.split.words, {
              yPercent: 100,
              y: "50vh",
              opacity: 0,
            });
          }
        }
      }

      // Single timeline for slide transitions
      function changeSlide() {
        const nextIndex = (currentIndex + 1) % heroSlides.length;

        // Get current and next slide elements
        const currentSlide = heroSlides[currentIndex];
        const nextSlide = heroSlides[nextIndex];

        const currentHeading = currentSlide?.querySelector(
          '[data-animate-heading="h1"]'
        );
        const currentText = currentSlide?.querySelector(
          '[data-animate-text="hero-sub"]'
        );
        const currentTextElement = currentText
          ? currentText.querySelector("p")
          : null;

        const nextHeading = nextSlide.querySelector(
          '[data-animate-heading="h1"]'
        );
        const nextText = nextSlide.querySelector(
          '[data-animate-text="hero-sub"]'
        );
        const nextTextElement = nextText ? nextText.querySelector("p") : null;

        // Create single timeline
        const tl = gsap.timeline({
          onComplete: () => {
            // Reset outgoing slide to bottom (if not first animation)
            if (!isFirstAnimation) {
              resetSlideToBottom(currentIndex);
            }
            currentIndex = nextIndex;
            isFirstAnimation = false;
            // console.log(`Current slide is now: ${currentIndex}`);
          },
        });

        // SLIDE IN ANIMATIONS (always happen)
        // Calculate slide-in delay for heading based on slide-out progress
        let headingSlideInDelay = 0;

        if (!isFirstAnimation && currentHeading) {
          const currentHeadingInstance = getSplitInstance(currentHeading);
          if (currentHeadingInstance && currentHeadingInstance.split.chars) {
            const charCount = currentHeadingInstance.split.chars.length;
            // 2/3 of chars out = (charCount * 2/3 - 1) * stagger + slideOutDelay
            headingSlideInDelay =
              ANIMATION_CONFIG.container.slideOutDelay +
              ((charCount * 2) / 3 - 1) * ANIMATION_CONFIG.heading.stagger;
          }
        }

        // Simple text delay: heading starts + text delay
        const textSlideInDelay =
          headingSlideInDelay + ANIMATION_CONFIG.text.slideInDelay;

        // Animate next heading from bottom to center
        if (nextHeading) {
          const nextHeadingInstance = getSplitInstance(nextHeading);

          tl.fromTo(
            nextHeading,
            {
              yPercent: 100,
              y: "50vh",
            },
            {
              yPercent: 0,
              y: "0vh",
              ease: "power2.out",
              duration: ANIMATION_CONFIG.container.headingDuration,
            },
            headingSlideInDelay
          );

          // Animate next heading chars with stagger (positive for slide in)
          if (nextHeadingInstance && nextHeadingInstance.split.chars) {
            tl.fromTo(
              nextHeadingInstance.split.chars,
              {
                yPercent: 100,
                y: "50vh",
              },
              {
                yPercent: 0,
                y: "0vh",
                ease: "power2.out",
                stagger: ANIMATION_CONFIG.heading.stagger,
                duration: ANIMATION_CONFIG.heading.duration,
              },
              headingSlideInDelay
            );
          }
        }

        // Animate next text from bottom to center (simple delay after heading starts)
        if (nextTextElement) {
          const nextTextInstance = getSplitInstance(nextTextElement);

          tl.fromTo(
            nextTextElement,
            {
              yPercent: 100,
              y: "50vh",
            },
            {
              yPercent: 0,
              y: "0vh",
              ease: "power2.out",
              duration: ANIMATION_CONFIG.container.textDuration,
            },
            textSlideInDelay
          );

          // Animate next text words with stagger (positive for slide in)
          if (nextTextInstance && nextTextInstance.split.words) {
            tl.fromTo(
              nextTextInstance.split.words,
              {
                yPercent: 100,
                opacity: 0,
                y: "50vh",
              },
              {
                yPercent: 0,
                y: "0vh",
                opacity: 1,
                ease: "power2.out",
                stagger: ANIMATION_CONFIG.text.stagger,
                duration: ANIMATION_CONFIG.text.duration,
              },
              textSlideInDelay
            );
          }
        }

        // SLIDE OUT ANIMATIONS (only if NOT first animation)
        if (!isFirstAnimation) {
          // Move current heading to top (starts at slideOutDelay)
          if (currentHeading) {
            const currentHeadingInstance = getSplitInstance(currentHeading);

            tl.to(
              currentHeading,
              {
                yPercent: -100,
                y: "-50vh",
                ease: "power2.in",
                duration: ANIMATION_CONFIG.container.headingDuration,
              },
              ANIMATION_CONFIG.container.slideOutDelay
            );

            // Move current heading chars to top with stagger (negative for slide out)
            if (currentHeadingInstance && currentHeadingInstance.split.chars) {
              tl.to(
                currentHeadingInstance.split.chars,
                {
                  yPercent: -100,
                  y: "-50vh",
                  ease: "power2.in",
                  stagger: -ANIMATION_CONFIG.heading.stagger,
                  duration: ANIMATION_CONFIG.heading.duration,
                },
                ANIMATION_CONFIG.container.slideOutDelay
              );
            }
          }

          // Move current text to top
          if (currentTextElement) {
            const currentTextInstance = getSplitInstance(currentTextElement);

            tl.to(
              currentTextElement,
              {
                yPercent: -100,
                y: "-50vh",
                ease: "power2.in",
                duration: ANIMATION_CONFIG.container.textDuration,
              },
              ANIMATION_CONFIG.container.slideOutDelay
            );

            // Move current text words to top with stagger (negative for slide out)
            if (currentTextInstance && currentTextInstance.split.words) {
              tl.to(
                currentTextInstance.split.words,
                {
                  yPercent: -100,
                  y: "-50vh",
                  opacity: 0,
                  ease: "power2.in",
                  stagger: -ANIMATION_CONFIG.text.stagger,
                  duration: ANIMATION_CONFIG.text.duration,
                },
                ANIMATION_CONFIG.container.slideOutDelay
              );
            }
          }
        }

        return tl;
      }

      // Start when hero section hits 20% from top
      ScrollTrigger.create({
        trigger: ".section_hero",
        start: () => (isMobile() ? "top 80%" : "top 50%"),
        once: true,
        onEnter: () => {
          // console.log("Hero section triggered, starting slideshow");
          // Start first animation
          changeSlide();

          // Start changing slides every 4s
          setInterval(changeSlide, 4000);
        },
      });

      // Cleanup
      window.addEventListener("beforeunload", () => {
        splitInstances.forEach((instance) => {
          if (instance.split && instance.split.revert) {
            instance.split.revert();
          }
        });
      });
    }

    /////////////////////////////////
    /* Slides Pinned at Top and Video Scaling */
    /////////////////////////////////

    const cardsWrappers = gsap.utils.toArray(".slide-wrapper").slice(0, -1);
    const cards = gsap.utils.toArray(".card_stack_component");

    cardsWrappers.forEach((wrapper, i) => {
      const card = cards[i];
      gsap.to(card, {
        rotationZ: (Math.random() - 0.5) * 10, // RotationZ between -5 and 5 degrees
        scale: 0.7, // Slight reduction of the content
        rotationX: 40,
        ease: "none",
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom center",
          endTrigger: ".g_component_layout",
          scrub: !isMobile() ? true : 1,
          // pin: wrapper, // Removed - using position: sticky in CSS instead
          // pinSpacing: false,
        },
      });

      gsap.to(card, {
        autoAlpha: 0, // Ends at opacity: 0 and visibility: hidden
        ease: "power1.in", // Starts gradually
        scrollTrigger: {
          trigger: card, // Listens to the position of content
          start: "top -80%", // Starts when the top exceeds 80% of the viewport
          end: "+=" + 0.2 * window.innerHeight, // Ends 20% later
          scrub: !isMobile() ? true : 1, // Progresses with the scroll
        },
      });
    });

    // Service card images: pure fade-in every time they enter view (no zoom / slide)
    const allCardsWrappers = gsap.utils.toArray(".slide-wrapper");

    const whenMediaReady = (el) => {
      if (!el) return Promise.resolve();
      if (el.tagName === "IMG") {
        if (el.complete && el.naturalWidth > 0) {
          return el.decode
            ? el.decode().catch(() => {})
            : Promise.resolve();
        }
        return new Promise((resolve) => {
          const done = () => resolve();
          el.addEventListener("load", done, { once: true });
          el.addEventListener("error", done, { once: true });
        }).then(() =>
          el.decode ? el.decode().catch(() => {}) : undefined
        );
      }
      if (el.tagName === "VIDEO") {
        if (el.readyState >= 2) return Promise.resolve();
        return new Promise((resolve) => {
          const done = () => resolve();
          el.addEventListener("loadeddata", done, { once: true });
          el.addEventListener("error", done, { once: true });
          window.setTimeout(done, 1200);
        });
      }
      return Promise.resolve();
    };

    // Warm local service visuals early so the first card never paints empty
    allCardsWrappers.forEach((wrapper, index) => {
      const img = wrapper.querySelector("[data-gsap-image] img");
      if (!img || !img.getAttribute("src")) return;
      if (index === 0) {
        img.loading = "eager";
        img.setAttribute("fetchpriority", "high");
        try {
          const warm = new Image();
          warm.decoding = "async";
          warm.src = img.currentSrc || img.src;
        } catch (_) {
          /* ignore */
        }
      } else {
        img.loading = "lazy";
        img.setAttribute("fetchpriority", "low");
      }
    });

    allCardsWrappers.forEach((wrapper) => {
      const imageWrap = wrapper.querySelector("[data-gsap-image]");
      if (!imageWrap) return;

      const mediaEl =
        imageWrap.querySelector("img") || imageWrap.querySelector("video");
      const fadeTargets = gsap.utils.toArray(
        [
          imageWrap,
          imageWrap.querySelector(".g_visual_wrap"),
          mediaEl,
        ].filter(Boolean)
      );

      gsap.set(imageWrap, {
        transformOrigin: "50% 50%",
        scale: 1,
        x: 0,
        y: 0,
        xPercent: 0,
        yPercent: 0,
        rotate: 0,
        clearProps: "perspective",
      });
      gsap.set(fadeTargets, {
        opacity: 0,
        scale: 1,
        x: 0,
        y: 0,
        xPercent: 0,
        yPercent: 0,
      });

      const fadeIn = () => {
        whenMediaReady(mediaEl).then(() => {
          imageWrap.classList.add("is-ready");
          gsap.to(fadeTargets, {
            opacity: 1,
            duration: 0.7,
            ease: "power2.out",
            overwrite: true,
          });
        });
      };

      // Decode first card ASAP (don't wait for scroll to start the network)
      if (mediaEl && mediaEl.tagName === "IMG" && mediaEl.loading === "eager") {
        whenMediaReady(mediaEl).then(() => {
          imageWrap.classList.add("is-ready");
        });
      }

      ScrollTrigger.create({
        trigger: imageWrap,
        start: "top 92%",
        end: "bottom 8%",
        onEnter: fadeIn,
        onEnterBack: fadeIn,
        onLeave: () => {
          gsap.set(fadeTargets, { opacity: 0 });
        },
        onLeaveBack: () => {
          gsap.set(fadeTargets, { opacity: 0 });
        },
      });
    });

    /////////////////////////////////
    /* PARTNERS LIST ANIMATION */
    /////////////////////////////////

    // Get all partner items — fade in only (no scale / slide)
    gsap.set(".partners_cms_item", {
      opacity: 0,
    });

    ScrollTrigger.batch(".partners_cms_item", {
      onEnter: (elements) => {
        gsap.to(elements, {
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.1,
        });
      },
      start: "top 85%",
      once: true,
    });

    /////////////////////////////////
    /* ROOMS SHOWCASE (Hotel Royal style) */
    /////////////////////////////////

    function initializeRoomsShowcase() {
      const section = document.querySelector("[data-rooms-showcase]");
      if (!section) return;

      const tabs = gsap.utils.toArray(section.querySelectorAll("[data-rooms-tab]"));
      const panes = gsap.utils.toArray(section.querySelectorAll("[data-pane]"));
      const track = section.querySelector("[data-rooms-track]");
      const slides = gsap.utils.toArray(section.querySelectorAll(".rooms-showcase_slide"));
      const prevBtn = section.querySelector("[data-rooms-prev]");
      const nextBtn = section.querySelector("[data-rooms-next]");
      const mobileTrigger = section.querySelector("[data-rooms-mobile-trigger]");
      const mobileMenu = section.querySelector("[data-rooms-mobile-menu]");
      const mobileLabel = section.querySelector("[data-rooms-mobile-label]");

      let index = 0;
      let activeTab = "rooms";

      const headings = {
        rooms: "Rooms",
        amenities: "Amenities",
        sustainability: "Sustainability",
      };

      function setTab(name) {
        activeTab = name;
        tabs.forEach((tab) => {
          const on = tab.getAttribute("data-rooms-tab") === name;
          tab.classList.toggle("is-active", on);
          if (tab.getAttribute("role") === "tab") {
            tab.setAttribute("aria-selected", on ? "true" : "false");
          }
        });
        panes.forEach((pane) => {
          const on = pane.getAttribute("data-pane") === name;
          pane.classList.toggle("is-active", on);
          if (on) pane.removeAttribute("hidden");
          else pane.setAttribute("hidden", "");
        });
        if (mobileLabel) {
          const source = tabs.find(
            (t) =>
              t.getAttribute("data-rooms-tab") === name &&
              t.closest(".rooms-showcase_tabs")
          );
          if (source) {
            mobileLabel.innerHTML = source.querySelector("span")?.innerHTML || headings[name];
          }
        }
        if (mobileMenu) mobileMenu.classList.remove("is-open");
        if (mobileTrigger) mobileTrigger.setAttribute("aria-expanded", "false");
        if (name === "rooms") {
          index = 0;
          updateSlider(false);
        }
      }

      function maxIndex() {
        const w = window.innerWidth;
        if (w >= 992) return Math.max(0, slides.length - 2);
        if (w >= 768) return Math.max(0, slides.length - 1);
        return Math.max(0, slides.length - 1);
      }

      function slideStep() {
        if (!slides.length) return 0;
        const slide = slides[0];
        const width = slide.offsetWidth || slide.getBoundingClientRect().width;
        if (width > 1) return width;
        const viewport = section.querySelector("[data-rooms-viewport]");
        if (!viewport) return 0;
        const basis = window.getComputedStyle(slide).flexBasis;
        if (basis.endsWith("%")) {
          return viewport.clientWidth * (parseFloat(basis) / 100);
        }
        return viewport.clientWidth;
      }

      function updateSlider(animate = true) {
        if (!track || !slides.length) return;
        index = gsap.utils.clamp(0, maxIndex(), index);
        const width = slideStep();
        const x = width > 1 ? -index * width : 0;
        if (animate) {
          gsap.to(track, { x, duration: 0.45, ease: "power2.out", overwrite: true });
        } else {
          gsap.set(track, { x });
        }
        if (prevBtn) prevBtn.disabled = index <= 0;
        if (nextBtn) nextBtn.disabled = index >= maxIndex();
      }

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          setTab(tab.getAttribute("data-rooms-tab"));
        });
      });

      if (mobileTrigger && mobileMenu) {
        mobileTrigger.addEventListener("click", () => {
          const open = mobileMenu.classList.toggle("is-open");
          mobileTrigger.setAttribute("aria-expanded", open ? "true" : "false");
        });
        document.addEventListener("click", (event) => {
          if (!section.contains(event.target)) {
            mobileMenu.classList.remove("is-open");
            mobileTrigger.setAttribute("aria-expanded", "false");
          }
        });
      }

      // Auto-advance every 5s while the section is visible; manual
      // interactions restart the countdown so they don't feel overridden.
      let autoTimer = null;
      let sectionVisible = !("IntersectionObserver" in window);
      function restartAutoplay() {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = setInterval(() => {
          if (!sectionVisible || activeTab !== "rooms" || dragging) return;
          index = index >= maxIndex() ? 0 : index + 1;
          updateSlider();
        }, 5000);
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          index -= 1;
          updateSlider();
          restartAutoplay();
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          index += 1;
          updateSlider();
          restartAutoplay();
        });
      }

      let startX = 0;
      let startY = 0;
      let dragging = false;
      let startOffset = 0;

      if (track) {
        track.addEventListener(
          "pointerdown",
          (event) => {
            if (activeTab !== "rooms") return;
            dragging = true;
            startX = event.clientX;
            startY = event.clientY;
            startOffset = gsap.getProperty(track, "x") || 0;
            track.setPointerCapture?.(event.pointerId);
          },
          { passive: true }
        );
        track.addEventListener("pointermove", (event) => {
          if (!dragging) return;
          const dx = event.clientX - startX;
          const dy = event.clientY - startY;
          if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
            dragging = false;
            return;
          }
          gsap.set(track, { x: startOffset + dx });
        });
        const endDrag = (event) => {
          if (!dragging) return;
          dragging = false;
          const dx = event.clientX - startX;
          const slideW = slideStep();
          if (slideW > 1) {
            if (dx < -40) index += 1;
            else if (dx > 40) index -= 1;
          }
          updateSlider();
          restartAutoplay();
        };
        track.addEventListener("pointerup", endDrag);
        track.addEventListener("pointercancel", endDrag);
      }

      window.addEventListener("resize", () => updateSlider(false));

      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            sectionVisible = entries.some((e) => e.isIntersecting);
            if (sectionVisible) updateSlider(false);
          },
          { threshold: 0.15 }
        );
        io.observe(section);
      }

      setTab("rooms");
      updateSlider(false);
      restartAutoplay();
    }

    initializeRoomsShowcase();

    /////////////////////////////////
    /* FEATURE VIDEO (16:9 block before Rooms) */
    /////////////////////////////////

    function initializeFeatureVideo() {
      const section = document.querySelector("[data-feature-video]");
      const frame = section?.querySelector(".feature-video_frame");
      const video = section?.querySelector("[data-feature-video-el]");
      if (!section || !video) return;

      const api = window.__frontelagoVideo;
      const mobile =
        (api && api.mobile) ||
        isCoarsePointer ||
        !window.matchMedia("(min-width: 768px)").matches;
      const src =
        (api && api.src) ||
        window.__frontelagoHeroVideoSrc ||
        (window.matchMedia("(min-width: 768px)").matches
          ? "assets/attico-frontelago-pisogne-iseo-lake-brescia.mp4"
          : "assets/attico-frontelago-pisogne-iseo-lake-brescia-mobile.mp4");

      const bindFeature = () => {
        // Native <source> children own the src — JS never rebinds it (iOS)
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.playsInline = true;
        video.controls = false;
        video.removeAttribute("controls");
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
      };

      // Desktop can bind early; mobile waits until near viewport (hero needs the pipe)
      if (!mobile) bindFeature();

      const isNearViewport = () => {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        return rect.bottom > -vh * 0.35 && rect.top < vh * 1.35;
      };

      const markPlaying = () => {
        if (frame) frame.classList.add("is-playing");
      };

      const tryPlay = (force = false) => {
        if (!force && !isNearViewport()) return;
        bindFeature();
        // Sync mute+play for iOS gesture / Intersection path
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.playsInline = true;
        video.setAttribute("muted", "true");
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        let played = null;
        try {
          played = video.play();
        } catch (_) {
          played = null;
        }
        const playPromise =
          api && typeof api.play === "function"
            ? api.play(video)
            : Promise.resolve(played).then(() => !video.paused).catch(() => false);
        Promise.resolve(playPromise).then((ok) => {
          if (ok || !video.paused) markPlaying();
        });
      };

      // Sync unlock on gesture (Low Power Mode)
      const unlockFeature = () => {
        if (!isNearViewport()) return;
        bindFeature();
        video.muted = true;
        video.volume = 0;
        video.playsInline = true;
        try {
          video.play();
        } catch (_) {
          /* ignore */
        }
        if (!video.paused) markPlaying();
      };
      ["touchstart", "pointerdown", "click"].forEach((evt) => {
        window.addEventListener(evt, unlockFeature, {
          capture: true,
          passive: true,
        });
      });

      video.addEventListener("playing", markPlaying);
      video.addEventListener("loadeddata", () => tryPlay());
      video.addEventListener("canplay", () => tryPlay());

      // Start buffering / autoplay before the section enters the viewport
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                tryPlay(true);
              } else if (!mobile && !video.paused) {
                // Never pause on mobile — iOS would block later autoplay
                video.pause();
                if (frame) frame.classList.remove("is-playing");
              }
            });
          },
          { threshold: 0.08, rootMargin: "55% 0px 55% 0px" }
        );
        io.observe(section);
      } else {
        tryPlay(true);
      }

      // Retry autoplay on user gestures / resume (gated to near-viewport)
      ["touchstart", "pointerdown", "pageshow"].forEach((evt) => {
        window.addEventListener(evt, () => tryPlay(), { passive: true });
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") tryPlay();
      });
      window.setInterval(() => {
        if (isNearViewport() && video.paused) tryPlay(true);
      }, 1800);
    }

    initializeFeatureVideo();

    /////////////////////////////////
    /* STICKY FEATURES (Bend Club style) */
    /////////////////////////////////

    function initializeStickyFeatures() {
      const section = document.querySelector("[data-sticky-features]");
      if (!section) return;

      const pin = section.querySelector(".sticky-features_pin");
      const visuals = gsap.utils.toArray(
        section.querySelectorAll("[data-sticky-feature-visual]")
      );
      const texts = gsap.utils.toArray(
        section.querySelectorAll("[data-sticky-feature-item]")
      );
      const progressBar = section.querySelector(
        "[data-sticky-feature-progress]"
      );
      const count = Math.min(visuals.length, texts.length);
      if (!pin || count < 2) return;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Crossfade between slides + soft Ken Burns drift
      const clipOpen = "inset(0 0 0 0 round 0.75em)";

      visuals.forEach((el, i) => {
        const img = el.querySelector(".sticky-features_img");
        gsap.set(el, {
          clipPath: clipOpen,
          autoAlpha: i === 0 ? 1 : 0,
          zIndex: i + 1,
        });
        if (img) {
          gsap.set(img, {
            scale: i === 0 ? 1 : 1.12,
            xPercent: i === 0 ? 0 : -4,
          });
        }
      });

      texts.forEach((el, i) => {
        gsap.set(el, {
          autoAlpha: i === 0 ? 1 : 0,
          y: i === 0 ? 0 : 30,
        });
      });

      if (progressBar) gsap.set(progressBar, { scaleX: 0 });

      if (reducedMotion) {
        // Instant crossfades only
        visuals.forEach((el, i) => {
          gsap.set(el, {
            clipPath: clipOpen,
            autoAlpha: i === 0 ? 1 : 0,
          });
          const img = el.querySelector(".sticky-features_img");
          if (img) gsap.set(img, { scale: 1, xPercent: 0 });
        });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      if (progressBar) {
        tl.to(progressBar, { scaleX: 1, ease: "none" }, 0);
      }

      for (let i = 0; i < count - 1; i++) {
        const next = i + 1;
        const at = i;
        const nextImg = visuals[next].querySelector(".sticky-features_img");
        const prevImg = visuals[i].querySelector(".sticky-features_img");

        if (reducedMotion) {
          tl.to(visuals[i], { autoAlpha: 0, ease: "none", duration: 0.5 }, at);
          tl.to(
            visuals[next],
            { autoAlpha: 1, ease: "none", duration: 0.5 },
            at
          );
        } else {
          // Incoming: fade in over the previous slide while settling from a mild drift
          tl.fromTo(
            visuals[next],
            { autoAlpha: 0 },
            { autoAlpha: 1, ease: "none", duration: 1 },
            at
          );

          if (nextImg) {
            tl.fromTo(
              nextImg,
              { scale: 1.12, xPercent: -4 },
              { scale: 1, xPercent: 0, ease: "none", duration: 1 },
              at
            );
          }

          // Outgoing: slow drift under the wipe — stay fully opaque so no
          // section color (mustard) flashes between images
          if (prevImg) {
            tl.to(
              prevImg,
              { scale: 1.06, xPercent: 3, ease: "none", duration: 1 },
              at
            );
          }
        }

        tl.to(
          texts[i],
          { autoAlpha: 0, y: -30, ease: "none", duration: 0.5 },
          at
        );

        tl.fromTo(
          texts[next],
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, ease: "none", duration: 0.5 },
          at + 0.35
        );
      }
    }

    initializeStickyFeatures();

    /////////////////////////////////
    /* STICKY IMAGE WAVE OVERLAY (NILS-style) */
    /////////////////////////////////

    function createWaveLinesAnimator(canvas, options = {}) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const scale = options.scale || 1;
      const lineWidth = options.lineWidth || 2.25;
      const strokeAlpha = options.strokeAlpha || 0.72;
      const strokeColor = options.strokeColor || "white";
      const timeStep = options.timeStep || 0.012;
      const observeEl =
        options.observe ||
        canvas.closest(
          "section, [data-sticky-features], .card_stack_img_wrap, .feature-video_frame"
        ) ||
        canvas.parentElement;

      // Same 4 sine strokes as the hero first scene
      const waves = [
        {
          baseAmplitude: 18 * scale,
          amplitude: 18 * scale,
          wavelength: 140,
          speed: 2,
          phase: 0,
          verticalOffset: -45 * scale,
        },
        {
          baseAmplitude: 28 * scale,
          amplitude: 28 * scale,
          wavelength: 280,
          speed: 1,
          phase: Math.PI / 2,
          verticalOffset: 0,
        },
        {
          baseAmplitude: 14 * scale,
          amplitude: 14 * scale,
          wavelength: 190,
          speed: 1.5,
          phase: Math.PI,
          verticalOffset: 48 * scale,
        },
        {
          baseAmplitude: 22 * scale,
          amplitude: 22 * scale,
          wavelength: 240,
          speed: 1.2,
          phase: Math.PI / 4,
          verticalOffset: 95 * scale,
        },
      ];

      let time = 0;
      let rafId = 0;
      let running = false;

      function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || 280;
        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function drawWave(wave, cssWidth, cssHeight) {
        ctx.beginPath();
        ctx.moveTo(0, cssHeight / 2 + wave.verticalOffset);
        for (let x = 0; x < cssWidth; x++) {
          const y =
            Math.sin(x / wave.wavelength + time * wave.speed + wave.phase) *
            wave.amplitude;
          ctx.lineTo(x, cssHeight / 2 + wave.verticalOffset + y);
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = strokeAlpha;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      function animate() {
        if (!running) return;
        const cssWidth = canvas.clientWidth || window.innerWidth;
        const cssHeight = canvas.clientHeight || 280;
        ctx.clearRect(0, 0, cssWidth, cssHeight);
        waves.forEach((wave, index) => {
          wave.amplitude =
            wave.baseAmplitude +
            4 * scale * Math.sin(time * (0.5 + 0.2 * index));
          drawWave(wave, cssWidth, cssHeight);
        });
        time += timeStep;
        rafId = requestAnimationFrame(animate);
      }

      function start() {
        if (running) return;
        running = true;
        resizeCanvas();
        animate();
      }

      function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      }

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      if ("IntersectionObserver" in window && observeEl) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) start();
              else stop();
            });
          },
          { rootMargin: "12% 0px", threshold: 0.01 }
        );
        observer.observe(observeEl);
      } else {
        start();
      }

      return { start, stop, resizeCanvas };
    }

    function initializeSiteWaveLines() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      document.querySelectorAll("[data-wave-lines]").forEach((canvas) => {
        const isPink = !!canvas.closest('[data-long-scroll="pink"]');
        const isCard = !!canvas.closest(".card_stack_img_wrap");
        const isFeature = !!canvas.closest(".section_feature-video");
        const strokeAttr = canvas.getAttribute("data-wave-stroke");
        createWaveLinesAnimator(canvas, {
          scale: isFeature ? 0.42 : isCard ? 0.55 : isPink ? 0.85 : 0.7,
          lineWidth: isFeature ? 2 : isCard ? 1.75 : 2.25,
          strokeAlpha: isFeature ? 0.78 : isPink ? 0.5 : 0.72,
          strokeColor: strokeAttr || "white",
          observe:
            canvas.closest(
              ".sticky-features_img-item, .card_stack_img_wrap, .section_long-scroll, [data-sticky-features], .section_feature-video, .feature-video_frame"
            ) || canvas.parentElement,
        });
      });
    }

    initializeSiteWaveLines();
    initializeHeroWaves();
    initializeWaveMenu();
    initializeFloatChrome();

    /////////////////////////////////
    /* FLOATING DOCK + SCROLL LOGO (NILS style) */
    /////////////////////////////////

    function initializeFloatChrome() {
      const logo = document.querySelector("[data-float-logo]");
      const heroLogo = document.querySelector("[data-hero-brand-logo]");
      const menuBtn = document.querySelector("[data-float-menu]");
      const burger = document.querySelector(
        ".nav_1_wrap.is-mobile .w-nav-button"
      );
      const navRoot = document.querySelector(".nav_component");
      if (!logo && !menuBtn && !heroLogo) return;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const SHOW_AT = 48;

      const syncLogo = () => {
        const y =
          window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          0;
        const menuOpen =
          navRoot &&
          ["opening", "open", "closing"].includes(
            navRoot.getAttribute("data-wave-menu") || ""
          );
        const scrolled = y > SHOW_AT;
        // No fixed logo while scrolling — only the hero mark at the top
        if (logo) {
          logo.classList.remove("is-visible");
        }
        if (heroLogo) {
          heroLogo.classList.toggle("is-hidden", scrolled || menuOpen);
        }
      };

      syncLogo();
      window.addEventListener("scroll", syncLogo, { passive: true });
      if (window.lenis && typeof window.lenis.on === "function") {
        window.lenis.on("scroll", syncLogo);
      }

      const syncMenuBtn = () => {
        if (!menuBtn) return;
        const open =
          (burger && burger.classList.contains("w--open")) ||
          (navRoot &&
            ["opening", "open"].includes(
              navRoot.getAttribute("data-wave-menu") || ""
            ));
        menuBtn.classList.toggle("is-open", !!open);
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        menuBtn.setAttribute(
          "aria-label",
          open ? "Chiudi menu" : "Apri menu"
        );
        syncLogo();
      };

      if (menuBtn && burger) {
        menuBtn.addEventListener("click", (e) => {
          e.preventDefault();
          burger.click();
          // Webflow toggles async — resync shortly after
          window.setTimeout(syncMenuBtn, 30);
          window.setTimeout(syncMenuBtn, 400);
          window.setTimeout(syncMenuBtn, 900);
        });
      }

      const contactBtn = document.querySelector("[data-float-contact]");
      // Contattaci scrolls to #contact form — no modal hook

      if (burger || navRoot) {
        if (burger) {
          burger.setAttribute("aria-hidden", "true");
          burger.setAttribute("tabindex", "-1");
        }
        const mo = new MutationObserver(syncMenuBtn);
        if (burger) {
          mo.observe(burger, {
            attributes: true,
            attributeFilter: ["class"],
          });
        }
        if (navRoot) {
          mo.observe(navRoot, {
            attributes: true,
            attributeFilter: ["data-wave-menu"],
          });
        }
      }

      if (reducedMotion && logo) {
        logo.style.transition = "none";
      }
    }

    /////////////////////////////////
    /* HERO / LOADER WAVES (NILS style) */
    /////////////////////////////////

    function initializeHeroWaves() {
      const canvas = document.querySelector("[data-hero-waves]");
      const mediaRoot = document.querySelector("[data-hero-media]");
      if (!canvas && !mediaRoot) return;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Text first → attic images 1→2→3→4 (2s each) → video
      if (mediaRoot) {
        const imageItems = Array.from(
          mediaRoot.querySelectorAll('[data-hero-media-item="image"]')
        );
        const videoItem = mediaRoot.querySelector(
          '[data-hero-media-item="video"]'
        );
        const video = videoItem?.querySelector("video");
        const section =
          mediaRoot.closest(".section_loader") || mediaRoot.parentElement;

        const SLIDE_HOLD_MS = isCoarsePointer ? 2400 : 2500;
        const TEXT_HOLD_MS = isCoarsePointer ? 1100 : 1400;

        let switched = false;
        let copyRevealed = false;

        const activateImage = (index) => {
          // Prefetch next still before swap
          const upcoming = imageItems[index + 1];
          if (upcoming) {
            const nextImg = upcoming.querySelector("img[data-src]");
            if (nextImg) {
              const lazy = nextImg.getAttribute("data-src");
              if (lazy && !nextImg.getAttribute("src")) {
                nextImg.setAttribute("src", lazy);
                nextImg.removeAttribute("data-src");
              }
            }
          }
          imageItems.forEach((el, i) => {
            const on = i === index;
            el.classList.toggle("is-active", on);
            if (on) {
              const img = el.querySelector("img[data-src]");
              if (img) {
                const lazy = img.getAttribute("data-src");
                if (lazy) {
                  img.setAttribute("src", lazy);
                  img.removeAttribute("data-src");
                }
              }
            }
          });
        };

        const revealHeroCopy = () => {
          if (copyRevealed) return;
          copyRevealed = true;
          if (section) section.setAttribute("data-hero-scene", "copy");

          if (reducedMotion) {
            if (headingSplit) gsap.set(headingSplit.words, { opacity: 1, yPercent: 0 });
            if (textSplit) gsap.set(textSplit.lines, { opacity: 1, y: 0 });
            return;
          }

          const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
          if (headingSplit) {
            tl.to(headingSplit.words, {
              opacity: 1,
              yPercent: 0,
              duration: 1,
              stagger: 0.05,
            });
          }
          if (textSplit) {
            tl.to(
              textSplit.lines,
              {
                opacity: 1,
                y: 0,
                duration: 1,
                stagger: 0.1,
              },
              headingSplit ? "-=0.75" : 0
            );
          }
        };

        const ensureHeroVideoReady = () => {
          if (!video) return;
          configureHeroVideoElement(video);
          if (videoItem) videoItem.classList.add("is-video-bed");
        };

        const markVideoPlaying = () => {
          if (videoItem) {
            videoItem.classList.add("is-playing", "is-active", "is-video-bed");
          }
          if (section) section.setAttribute("data-hero-video", "playing");
        };

        const revealPlayingVideo = () => {
          if (!switched) return false;
          if (!video || video.paused) return false;
          markVideoPlaying();
          imageItems.forEach((el) => el.classList.remove("is-active"));
          try {
            video.removeAttribute("poster");
          } catch (_) {
            /* ignore */
          }
          return true;
        };

        const tryPlayHeroVideo = () => {
          if (!video) return Promise.resolve(false);
          video.muted = true;
          video.defaultMuted = true;
          video.volume = 0;
          video.playsInline = true;
          return forceHeroVideoPlay(video).then((ok) => {
            if ((ok || !video.paused) && switched) revealPlayingVideo();
            return ok || !video.paused;
          });
        };

        const unlockFromUserGesture = () => {
          if (!video) return;
          ensureHeroVideoReady();
          let p;
          try {
            p = video.play();
          } catch (_) {
            p = null;
          }
          if (switched && !video.paused) revealPlayingVideo();
          if (p && typeof p.then === "function") {
            p.then(() => {
              if (switched && !video.paused) revealPlayingVideo();
            }).catch(() => {});
          }
        };

        ["touchstart", "pointerdown", "click"].forEach((evt) => {
          window.addEventListener(evt, unlockFromUserGesture, {
            capture: true,
            passive: true,
          });
        });
        if (mediaRoot) {
          mediaRoot.addEventListener("touchstart", unlockFromUserGesture, {
            capture: true,
            passive: true,
          });
        }

        const keepTryingAutoplay = () => {
          if (!video || video.dataset.autoplayWatch === "1") return;
          video.dataset.autoplayWatch = "1";
          let tries = 0;
          const tick = () => {
            if (!video.paused) {
              revealPlayingVideo();
              return;
            }
            tries += 1;
            tryPlayHeroVideo().then((ok) => {
              if (ok || !video.paused) {
                revealPlayingVideo();
                return;
              }
              if (tries < 200) window.setTimeout(tick, 140);
            });
          };
          tick();
          video.addEventListener("playing", () => revealPlayingVideo());
          video.addEventListener("timeupdate", () => {
            if (!video.paused && video.currentTime > 0.02) revealPlayingVideo();
          });
          video.addEventListener("canplay", () => tryPlayHeroVideo());
          video.addEventListener("loadeddata", () => tryPlayHeroVideo());
        };

        const showVideo = () => {
          if (switched || !videoItem || !imageItems.length) return;
          switched = true;
          if (section) {
            section.setAttribute("data-hero-scene", "video");
            section.removeAttribute("data-hero-video");
          }

          // Keep last still opaque — video stays CSS-hidden until playing
          const lastStill = imageItems[imageItems.length - 1];
          imageItems.forEach((el) => el.classList.remove("is-active"));
          if (lastStill) {
            const img = lastStill.querySelector("img[data-src]");
            if (img) {
              const lazy = img.getAttribute("data-src");
              if (lazy) {
                img.setAttribute("src", lazy);
                img.removeAttribute("data-src");
              }
            }
            lastStill.classList.add("is-active");
          }

          videoItem.classList.add("is-video-bed");
          videoItem.classList.remove("is-playing", "is-active");
          if (video) delete video.dataset.autoplayWatch;

          ensureHeroVideoReady();
          try {
            video.muted = true;
            video.play();
          } catch (_) {
            /* ignore */
          }
          if (window.__frontelagoVideo && window.__frontelagoVideo.startHero) {
            window.__frontelagoVideo.startHero().then((ok) => {
              if (ok) revealPlayingVideo();
            });
          }
          if (video && !video.paused) revealPlayingVideo();
          keepTryingAutoplay();
          tryPlayHeroVideo();
        };

        const warmHeroVideoDuringStills = () => {
          if (!video) return;
          // Buffer under CSS-hidden layer — never visible while paused
          ensureHeroVideoReady();
          if (window.__frontelagoVideo && window.__frontelagoVideo.prepare) {
            window.__frontelagoVideo.prepare(video, { preload: "auto" });
          }
          video.muted = true;
          video.playsInline = true;
          const p = video.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        };

        const runImageSequence = () => {
          if (!imageItems.length) {
            showVideo();
            return;
          }
          if (section) section.setAttribute("data-hero-scene", "slideshow");
          warmHeroVideoDuringStills();

          let i = 0;
          const tick = () => {
            i += 1;
            if (i >= imageItems.length) {
              showVideo();
              return;
            }
            activateImage(i);
            warmHeroVideoDuringStills();
            window.setTimeout(tick, SLIDE_HOLD_MS);
          };

          window.setTimeout(tick, SLIDE_HOLD_MS);
        };

        let sequenceStarted = false;
        const startHeroSequence = () => {
          if (sequenceStarted) return;
          sequenceStarted = true;
          activateImage(0);
          revealHeroCopy();
          warmHeroVideoDuringStills();
          if (reducedMotion) {
            showVideo();
            return;
          }
          window.setTimeout(runImageSequence, TEXT_HOLD_MS);
        };
        window.__frontelagoStartHeroSequence = startHeroSequence;

        if (section) section.setAttribute("data-hero-scene", "image");
        activateImage(0);

        const preloader = document.querySelector(".preloader_wrap");
        const preloaderVisible =
          preloader &&
          !preloader.classList.contains("is-done") &&
          getComputedStyle(preloader).display !== "none";
        if (preloaderUnlocked || !preloaderVisible) {
          startHeroSequence();
        } else {
          window.addEventListener("frontelago:preloader-done", startHeroSequence, {
            once: true,
          });
          // Failsafe — never wait 14s
          window.setTimeout(startHeroSequence, 4500);
        }
      }

      if (!canvas || reducedMotion) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const waves = [
        {
          baseAmplitude: 18,
          amplitude: 18,
          wavelength: 140,
          speed: 2,
          phase: 0,
          verticalOffset: -45,
        },
        {
          baseAmplitude: 28,
          amplitude: 28,
          wavelength: 280,
          speed: 1,
          phase: Math.PI / 2,
          verticalOffset: 0,
        },
        {
          baseAmplitude: 14,
          amplitude: 14,
          wavelength: 190,
          speed: 1.5,
          phase: Math.PI,
          verticalOffset: 48,
        },
        {
          baseAmplitude: 22,
          amplitude: 22,
          wavelength: 240,
          speed: 1.2,
          phase: Math.PI / 4,
          verticalOffset: 95,
        },
        {
          baseAmplitude: 12,
          amplitude: 12,
          wavelength: 160,
          speed: 1.8,
          phase: Math.PI / 6,
          verticalOffset: -90,
        },
      ];

      let time = 0;
      let rafId = 0;
      let running = false;

      function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || 280;
        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function drawWave(wave, cssWidth, cssHeight) {
        ctx.beginPath();
        ctx.moveTo(0, cssHeight / 2 + wave.verticalOffset);
        for (let x = 0; x < cssWidth; x++) {
          const y =
            Math.sin(x / wave.wavelength + time * wave.speed + wave.phase) *
            wave.amplitude;
          ctx.lineTo(x, cssHeight / 2 + wave.verticalOffset + y);
        }
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2.25;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = 0.72;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      function animate() {
        if (!running) return;
        const cssWidth = canvas.clientWidth || window.innerWidth;
        const cssHeight = canvas.clientHeight || 280;
        ctx.clearRect(0, 0, cssWidth, cssHeight);
        waves.forEach((wave, index) => {
          wave.amplitude =
            wave.baseAmplitude + 4 * Math.sin(time * (0.5 + 0.2 * index));
          drawWave(wave, cssWidth, cssHeight);
        });
        time += 0.012;
        rafId = requestAnimationFrame(animate);
      }

      function start() {
        if (running) return;
        running = true;
        resizeCanvas();
        animate();
      }

      function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      }

      resizeCanvas();
      start();
      window.addEventListener("resize", resizeCanvas);

      if ("IntersectionObserver" in window) {
        const section =
          canvas.closest(".section_loader") || canvas.parentElement;
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) start();
              else stop();
            });
          },
          { threshold: 0.05 }
        );
        if (section) io.observe(section);
      }
    }

    /////////////////////////////////
    /* MOBILE MENU WAVE WIPE (NILS-style) */
    /////////////////////////////////

    function initializeWaveMenu() {
      const navRoot = document.querySelector(".nav_component");
      const burger = document.querySelector(
        ".nav_1_wrap.is-mobile .w-nav-button"
      );
      const waveSvg = document.querySelector("[data-nav-wave]");
      const menuCanvas = document.querySelector("[data-menu-waves]");
      if (!navRoot || !burger || !waveSvg) return;

      // Escape nav_component transform containing block so fixed = true viewport
      if (waveSvg.parentElement !== document.body) {
        document.body.appendChild(waveSvg);
      }

      const paths = Array.from(
        waveSvg.querySelectorAll(".nav_wave_anim__path")
      );
      if (!paths.length) return;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const cfg = {
        numPoints: 2,
        duration: 650,
        delayPointsMax: 0,
        delayPerPath: 150,
      };

      let isOpened = false;
      let isAnimating = false;
      let pointsDelay = [];
      let allRange = 0;
      let timeStart = 0;
      let rafMorph = 0;
      let lockedScrollY = 0;

      function lockPageScroll() {
        lockedScrollY =
          window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          0;
        document.documentElement.classList.add("menu-scroll-lock");
        document.body.style.top = `-${lockedScrollY}px`;
        if (lenis && typeof lenis.stop === "function") {
          lenis.stop();
        }
      }

      function unlockPageScroll() {
        document.documentElement.classList.remove("menu-scroll-lock");
        document.body.style.top = "";
        window.scrollTo(0, lockedScrollY);
        if (lenis && typeof lenis.start === "function") {
          lenis.start();
        }
      }

      // Block page touch-scroll while menu is open (iOS); allow menu list only
      const preventPageTouchScroll = (event) => {
        if (!isOpened && !isAnimating) return;
        const scrollRoot = event.target.closest?.(".nav_1_menu_scroll");
        if (scrollRoot) return;
        if (event.target.closest?.("[data-float-dock]")) return;
        event.preventDefault();
      };
      document.addEventListener("touchmove", preventPageTouchScroll, {
        passive: false,
      });

      function cubicInOut(t) {
        return t < 0.5
          ? 4 * t * t * t
          : 0.5 * Math.pow(2 * t - 2, 3) + 1;
      }

      function cubicOut(t) {
        const u = t - 1;
        return u * u * u + 1;
      }

      // NILS / bn-internal Wave: each control point gets a different ease so the
      // leading edge stays oblique (cubicInOut vs cubicOut), not a flat wipe.
      function easePoint(t, pointIndex) {
        if (isOpened) {
          return pointIndex === 1 ? cubicOut(t) : cubicInOut(t);
        }
        return pointIndex === 1 ? cubicInOut(t) : cubicOut(t);
      }

      // Morph always runs points 0→100; path construction differs for open vs close
      function updatePath(elapsed) {
        const n = [];
        for (let o = 0; o < cfg.numPoints; o++) {
          n[o] =
            easePoint(
              Math.min(
                Math.max(elapsed - pointsDelay[o], 0) / cfg.duration,
                1
              ),
              o
            ) * 100;
        }

        let d = isOpened ? `M 0 0 V ${n[0]} ` : `M 0 ${n[0]} `;
        for (let o = 0; o < cfg.numPoints - 1; o++) {
          const p = ((o + 1) / (cfg.numPoints - 1)) * 100;
          const c = p - ((1 / (cfg.numPoints - 1)) * 100) / 2;
          d += `C ${c} ${n[o]} ${c} ${n[o + 1]} ${p} ${n[o + 1]} `;
        }
        d += isOpened ? "V 0 H 0" : "V 100 H 0";
        return d;
      }

      function render() {
        if (isAnimating) {
          const elapsed = Date.now() - timeStart;
          paths.forEach((path, index) => {
            // Open: stagger 0→n. Close: reverse stagger (NILS) so layers peel off.
            const pathDelay = isOpened
              ? cfg.delayPerPath * index
              : cfg.delayPerPath * (paths.length - index - 1);
            path.setAttribute("d", updatePath(elapsed - pathDelay));
          });
          if (elapsed < cfg.duration + cfg.delayPerPath * (paths.length - 1) + allRange) {
            rafMorph = requestAnimationFrame(render);
          } else {
            isAnimating = false;
            if (!isOpened) {
              waveSvg.classList.remove("is-active", "is-open");
              navRoot.setAttribute("data-wave-menu", "closed");
              stopMenuWaves();
              unlockPageScroll();
            } else {
              // Snap wipe to full cover, show solid pink menu UNDER it, then
              // drop the SVG — avoids a frame where neither layer is opaque.
              const fullCover =
                "M 0 0 V 100 C 50 100 50 100 100 100 V 0 H 0";
              paths.forEach((path) => path.setAttribute("d", fullCover));
              waveSvg.classList.add("is-active", "is-open");
              navRoot.setAttribute("data-wave-menu", "open");
              startMenuWaves();
              revealMobileNavLinks();
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (!isOpened) return;
                  waveSvg.classList.remove("is-active");
                  waveSvg.classList.add("is-open");
                });
              });
            }
          }
        } else {
          const d = updatePath(
            cfg.duration +
              cfg.delayPerPath * (paths.length - 1) +
              allRange +
              1
          );
          paths.forEach((path) => path.setAttribute("d", d));
        }
      }

      function toggleMenu(open) {
        if (isAnimating) return;
        isAnimating = true;
        isOpened = open;
        timeStart = Date.now();

        pointsDelay = [];
        for (let i = 0; i < cfg.numPoints; i++) {
          pointsDelay[i] = Math.random() * cfg.delayPointsMax;
        }
        allRange = Math.max(...pointsDelay);

        if (open) {
          // Start wipe from empty; pink panel stays hidden until handoff
          paths.forEach((path) =>
            path.setAttribute("d", "M 0 0 V 0 C 50 0 50 0 100 0 V 0 H 0")
          );
          waveSvg.classList.add("is-active");
          waveSvg.classList.remove("is-open");
          navRoot.setAttribute("data-wave-menu", "opening");
          lockPageScroll();
        } else {
          // NILS close: SVG must be the only pink cover, then peel away to
          // reveal the page. Menu goes transparent first; no solid backdrop.
          const fullCover = "M 0 0 V 100 C 50 100 50 100 100 100 V 0 H 0";
          paths.forEach((path) => path.setAttribute("d", fullCover));
          waveSvg.classList.add("is-active");
          waveSvg.classList.remove("is-open");
          stopMenuWaves();
          // Hide menu panel so only the SVG wave layers remain visible
          navRoot.setAttribute("data-wave-menu", "closing");
          // Force a paint of the full cover before the peel starts
          void waveSvg.getBoundingClientRect();
        }

        render();
      }

      // --- canvas waves inside menu ---
      let wavesRaf = 0;
      let wavesRunning = false;
      let wavesTime = 0;
      let wavesCtx = null;

      const menuWaves = [
        {
          baseAmplitude: 18,
          amplitude: 18,
          wavelength: 140,
          speed: 2,
          phase: 0,
          verticalOffset: -40,
        },
        {
          baseAmplitude: 26,
          amplitude: 26,
          wavelength: 260,
          speed: 1,
          phase: Math.PI / 2,
          verticalOffset: 0,
        },
        {
          baseAmplitude: 14,
          amplitude: 14,
          wavelength: 190,
          speed: 1.5,
          phase: Math.PI,
          verticalOffset: 45,
        },
        {
          baseAmplitude: 22,
          amplitude: 22,
          wavelength: 230,
          speed: 1.2,
          phase: Math.PI / 4,
          verticalOffset: 90,
        },
      ];

      function resizeMenuCanvas() {
        if (!menuCanvas || !wavesCtx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = menuCanvas.clientWidth || window.innerWidth;
        const height = menuCanvas.clientHeight || 280;
        menuCanvas.width = Math.max(1, Math.floor(width * dpr));
        menuCanvas.height = Math.max(1, Math.floor(height * dpr));
        wavesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function drawMenuWave(wave, cssWidth, cssHeight) {
        wavesCtx.beginPath();
        wavesCtx.moveTo(0, cssHeight / 2 + wave.verticalOffset);
        for (let x = 0; x < cssWidth; x++) {
          const y =
            Math.sin(
              x / wave.wavelength + wavesTime * wave.speed + wave.phase
            ) * wave.amplitude;
          wavesCtx.lineTo(x, cssHeight / 2 + wave.verticalOffset + y);
        }
        wavesCtx.strokeStyle = "white";
        wavesCtx.lineWidth = 2.25;
        wavesCtx.lineCap = "round";
        wavesCtx.lineJoin = "round";
        wavesCtx.globalAlpha = 0.7;
        wavesCtx.stroke();
        wavesCtx.globalAlpha = 1;
      }

      function animateMenuWaves() {
        if (!wavesRunning || !wavesCtx) return;
        const cssWidth = menuCanvas.clientWidth || window.innerWidth;
        const cssHeight = menuCanvas.clientHeight || 280;
        wavesCtx.clearRect(0, 0, cssWidth, cssHeight);
        menuWaves.forEach((wave, index) => {
          wave.amplitude =
            wave.baseAmplitude + 4 * Math.sin(wavesTime * (0.5 + 0.2 * index));
          drawMenuWave(wave, cssWidth, cssHeight);
        });
        wavesTime += 0.012;
        wavesRaf = requestAnimationFrame(animateMenuWaves);
      }

      function startMenuWaves() {
        if (!menuCanvas || reducedMotion) return;
        if (!wavesCtx) wavesCtx = menuCanvas.getContext("2d");
        if (!wavesCtx) return;
        if (wavesRunning) return;
        wavesRunning = true;
        resizeMenuCanvas();
        animateMenuWaves();
      }

      function stopMenuWaves() {
        wavesRunning = false;
        if (wavesRaf) cancelAnimationFrame(wavesRaf);
      }

      function revealMobileNavLinks() {
        const mobileMenu = document.querySelector(
          ".nav_1_wrap.is-mobile .w-nav-menu"
        );
        if (!mobileMenu || typeof gsap === "undefined") return;
        const words = mobileMenu.querySelectorAll(".word");
        const links = mobileMenu.querySelectorAll(".nav_1_links_link");
        if (words.length) {
          gsap.to(words, {
            opacity: 1,
            yPercent: 0,
            y: 0,
            duration: 0.45,
            stagger: 0.04,
            ease: "power2.out",
            overwrite: true,
          });
        } else if (links.length) {
          gsap.fromTo(
            links,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.45,
              stagger: 0.06,
              ease: "power2.out",
              overwrite: true,
            }
          );
        }
      }

      window.addEventListener("resize", () => {
        if (wavesRunning) resizeMenuCanvas();
      });

      // Sync with Webflow hamburger class
      const syncFromBurger = () => {
        const open = burger.classList.contains("w--open");
        if (open && !isOpened && !isAnimating) {
          if (reducedMotion) {
            isOpened = true;
            waveSvg.classList.remove("is-active");
            waveSvg.classList.add("is-open");
            navRoot.setAttribute("data-wave-menu", "open");
            paths.forEach((path) =>
              path.setAttribute(
                "d",
                "M 0 0 V 100 C 50 100 50 100 100 100 V 0 H 0"
              )
            );
            lockPageScroll();
            startMenuWaves();
            revealMobileNavLinks();
            return;
          }
          toggleMenu(true);
        } else if (!open && isOpened && !isAnimating) {
          if (reducedMotion) {
            isOpened = false;
            waveSvg.classList.remove("is-active", "is-open");
            navRoot.setAttribute("data-wave-menu", "closed");
            paths.forEach((path) =>
              path.setAttribute(
                "d",
                "M 0 0 V 0 C 50 0 50 0 100 0 V 0 H 0"
              )
            );
            stopMenuWaves();
            unlockPageScroll();
            return;
          }
          toggleMenu(false);
        }
      };

      const observer = new MutationObserver(syncFromBurger);
      observer.observe(burger, {
        attributes: true,
        attributeFilter: ["class"],
      });

      // Block hamburger mid-wipe so Webflow class and wave state stay in sync
      burger.addEventListener(
        "click",
        (event) => {
          if (!isAnimating) return;
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        true
      );

      // Initial closed state
      navRoot.setAttribute("data-wave-menu", "closed");
      paths.forEach((path) =>
        path.setAttribute("d", "M 0 0 V 0 C 50 0 50 0 100 0 V 0 H 0")
      );
    }

    /////////////////////////////////
    /* H2 PINNED WITHOUT GRAVITY */
    /////////////////////////////////
    // Find all containers with the data attribute

    function gravityAnimation() {
      const containers = document.querySelectorAll("[data-animate-container]");
      const gridSection = document.querySelector(
        '[data-gsap-section="grid-lines"]'
      );
      containers.forEach((container) => {
        // Find the h2 inside the container with data-animate-heading
        const headingWrapper = container.querySelector(
          '[data-animate-heading="h2"]'
        );
        const title = headingWrapper
          ? headingWrapper.querySelector("h2")
          : null;

        if (!title) return; // Skip if no h2 found

        const dist = container.clientHeight - title.clientHeight;
        const shouldPin =
          container.getAttribute("data-animate-container") === "pinned";

        // Desktop: pin the solid headline — no scattered letters
        if (!isMobile()) {
          if (shouldPin) {
            ScrollTrigger.create({
              trigger: container,
              pin: title,
              start: "top 15%",
              end: "+=" + dist,
            });
          } else {
            const horizontalWrapper = document.querySelector(
              '[data-gsap-wrapper="horizontal-scroll"]'
            );
            const gridSectionHeight = horizontalWrapper
              ? horizontalWrapper.getBoundingClientRect().height
              : 0;
            const seventyPercentVH = window.innerHeight * 0.7;
            const shouldUseGridSectionAsEndTrigger =
              gridSectionHeight < seventyPercentVH;

            const scrollTriggerConfig = {
              trigger: container,
              pin: title,
              start: "top 15%",
            };

            if (shouldUseGridSectionAsEndTrigger && gridSection) {
              scrollTriggerConfig.endTrigger = gridSection;
              scrollTriggerConfig.end = "bottom bottom";
            } else {
              scrollTriggerConfig.end = "+=" + dist;
            }

            ScrollTrigger.create(scrollTriggerConfig);
          }
          return;
        }

        // Mobile: pin the solid headline — no scattered letters
        ScrollTrigger.create({
          trigger: container,
          pin: title,
          start: "top 15%",
          end: "+=" + dist,
        });
      });
    }

    gravityAnimation();

    /////////////////////////////////
    /* GRID LINES ANIMATION */
    /////////////////////////////////
    function gridLinesAnmation() {
      const gridSection = document.querySelector(
        '[data-gsap-section="grid-lines"]'
      );
      if (!isMobile() && gridSection) {
        const pinnedContent = gridSection.querySelector(
          '[data-gsap-state="pinned"]'
        );
        const horizontalWrapper = gridSection.querySelector(
          '[data-gsap-wrapper="horizontal-scroll"]'
        );
        const scrollItems = gridSection.querySelectorAll(
          '[data-gsap-item="scroll-item"]'
        );
        const horizontalLines = gridSection.querySelectorAll(
          '[data-gsap-lines="horizontal"]'
        );
        const verticalLines = gridSection.querySelectorAll(
          '[data-gsap-lines="vertical"]'
        );

        const itemCount =
          parseInt(gridSection.getAttribute("data-gsap-items")) ||
          scrollItems.length;

        if (pinnedContent && horizontalWrapper && scrollItems.length > 0) {
          // Store split text instances for cleanup
          let cardSplitInstances = [];

          // Initialize card animations - set initial states
          scrollItems.forEach((item) => {
            const heading = item.querySelector(
              '[data-animate-heading="card-heading"]'
            );
            const textElement = item.querySelector(
              '[data-animate-text="card-para"]'
            );
            const footer = item.querySelector(
              '[data-gsap-animate="card-footer"]'
            );

            // Set initial state for heading
            if (heading) {
              gsap.set(heading, {
                opacity: 0,
                y: 10,
              });
            }

            // Set initial state and split paragraph
            if (textElement) {
              const paragraph = textElement.querySelector("p");
              if (paragraph) {
                // Split paragraph into lines
                const splitText = new SplitText(paragraph, {
                  type: "lines",
                  linesClass: "card-line",
                });

                // Store split instance for cleanup
                cardSplitInstances.push({
                  element: paragraph,
                  split: splitText,
                });

                // Set initial state for lines
                gsap.set(splitText.lines, {
                  opacity: 0,
                  y: 20,
                });
              }
            }

            // Set initial state for footer
            if (footer) {
              gsap.set(footer, {
                opacity: 0,
                y: 15,
              });
            }
          });

          // Set initial line state
          gsap.set(horizontalLines, {
            height: "1px",
            width: "0%",
          });

          gsap.set(verticalLines, {
            height: "0%",
            width: "1px",
          });

          // Line animations timeline
          const linesTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: horizontalWrapper,
              start: "top 50%",
              toggleActions: "play none none none",
            },
          });

          linesTimeline
            .to(horizontalLines, {
              width: "100%",
              duration: 1,
              ease: "power4.out",
            })
            .to(
              verticalLines,
              {
                height: "100%",
                duration: 1,
                ease: "power4.out",
                stagger: 0.2,
              },
              0.3 // Start vertical lines slightly after horizontal
            );

          // Card animations - start after lines animation completes
          const cardAnimationsTimeline = gsap.timeline({
            delay: 0.5, // Small delay after lines complete
          });

          scrollItems.forEach((item, index) => {
            const heading = item.querySelector(
              '[data-animate-heading="card-heading"]'
            );
            const textElement = item.querySelector(
              '[data-animate-text="card-para"]'
            );
            const footer = item.querySelector(
              '[data-gsap-animate="card-footer"]'
            );

            // Calculate stagger delay for this card
            const cardDelay = index * 0.3; // 0.3s stagger between cards

            // Animate heading
            if (heading) {
              cardAnimationsTimeline.to(
                heading,
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.6,
                  ease: "power2.out",
                },
                cardDelay
              );
            }

            // Animate paragraph lines
            if (textElement) {
              const paragraph = textElement.querySelector("p");
              if (paragraph) {
                // Find the split instance for this paragraph
                const splitInstance = cardSplitInstances.find(
                  (instance) => instance.element === paragraph
                );

                if (splitInstance && splitInstance.split.lines) {
                  cardAnimationsTimeline.to(
                    splitInstance.split.lines,
                    {
                      opacity: 1,
                      y: 0,
                      duration: 0.5,
                      ease: "power2.out",
                      stagger: 0.08, // Stagger between lines within the paragraph
                    },
                    cardDelay + 0.2 // Start 0.2s after heading
                  );
                }
              }
            }

            // Animate footer
            if (footer) {
              cardAnimationsTimeline.to(
                footer,
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.6,
                  ease: "power2.out",
                },
                cardDelay + 0.5 // Start 0.5s after heading (after paragraph animation starts)
              );
            }
          });

          // Add card animations to the lines timeline
          linesTimeline.add(cardAnimationsTimeline, -0.25); // Start 0.25s before lines timeline ends

          // 🧠 Dynamically calculate the total scroll distance in px
          const wrapperWidth = horizontalWrapper.scrollWidth;
          const visibleWidth = horizontalWrapper.offsetWidth;
          const totalScrollDistance = wrapperWidth - visibleWidth;

          // Set height of the pinned section based on scroll distance
          const requiredHeight = totalScrollDistance + window.innerHeight;

          gsap.set(gridSection, {
            minHeight: `${requiredHeight}px`, // or height if you're sure it won't change
          });

          let gridScrollTrigger = gsap.timeline({
            scrollTrigger: {
              trigger: horizontalWrapper,
              start: "bottom 99.8%", // When section top hits 30% from top
              endTrigger: gridSection,
              end: "bottom bottom",
              scrub: 1,
              pin: pinnedContent,
              pinSpacing: true,
              invalidateOnRefresh: true,
              markers: false,
            },
          });

          if (scrollItems.length > 1) {
            gridScrollTrigger
              .to({}, { duration: 0.1 }) // 10% delay (no movement)
              .to(
                horizontalWrapper,
                {
                  x: -totalScrollDistance,
                  ease: "none",
                  duration: 0.9, // Remaining 90% of the timeline
                },
                0.1 // Start at 10% progress
              );
          }

          // Cleanup function for split text instances
          window.addEventListener("beforeunload", () => {
            cardSplitInstances.forEach((instance) => {
              if (instance.split && instance.split.revert) {
                instance.split.revert();
              }
            });
          });
        }
      }
    }

    gridLinesAnmation();

    /////////////////////////////////
    /* ACCORDION */
    /////////////////////////////////

    const accordionContainer = document.querySelector('[data-gsap="inview"]');
    const accordionHeaders = document.querySelectorAll(".accordion_header");
    const accordionWrapper = document.querySelector(
      '[data-gsap="accordion-wrapper"]'
    );

    let headerHeight = "8rem"; // rem

    if (accordionContainer && accordionHeaders.length > 0 && accordionWrapper) {
      const totalItemsCount = accordionHeaders.length;
      const sectionHeight = accordionContainer.getBoundingClientRect().height;
      const wrapperHeight = accordionWrapper.offsetHeight;
      // Desktop e mobile condividono lo stesso comportamento: titolo sticky
      // in alto (top: 0), quindi l'altezza dell'header è fissa ovunque.
      const headerHeightPx = headerHeight;
      const sectionHeightPx = `${sectionHeight}px`;

      // Set global CSS variables on :root
      document.documentElement.style.setProperty(
        "--total-items",
        totalItemsCount
      );
      document.documentElement.style.setProperty(
        "--section-height",
        sectionHeightPx
      );
      document.documentElement.style.setProperty(
        "--header-height",
        headerHeightPx
      );

      accordionHeaders.forEach((header, index) => {
        const itemPosition = index + 1;

        header.style.setProperty("--item-position", itemPosition);
      });

      const accordionContainers = document.querySelectorAll("[data-accordion]");

      ScrollTrigger.create({
        trigger: accordionWrapper,
        start: `top bottom-=${wrapperHeight}`,
        // start: `top bottom-=${headerHeight}`,
        onEnter: () => {
          accordionContainers.forEach((container) => {
            container.classList.add("inview");
          });
          if (!isMobile()) {
            refreshScrollTriggers();
          }
        },
        onLeaveBack: () => {
          accordionContainers.forEach((container) => {
            container.classList.remove("inview");
          });
        },
      });
    }

    /////////////////////////////////
    /* TEXT SCALE TO FILL THE PAGE */
    /////////////////////////////////

    // Function to initialize long scroll animation for a single instance
    function initializeLongScrollAnimation(longScrollSection, index) {
      if (!longScrollSection) return;

      // Get elements within this specific section
      const stickyContent = longScrollSection.querySelector(
        "[data-gsap-state='pinned']"
      );
      const textTop = longScrollSection.querySelector("[data-gsap-text='top']");
      const textMiddle = longScrollSection.querySelector(
        "[data-gsap-text='middle']"
      );
      const textBottom = longScrollSection.querySelector(
        "[data-gsap-text='bottom']"
      );
      const textWrapper = longScrollSection.querySelector(
        "[data-gsap-wrapper='text-wrapper']"
      );
      const pivotElement = textMiddle?.querySelector(
        "[data-gsap-pivot='pivot']"
      );
      const beforePivot = textMiddle?.querySelector(
        "[data-gsap-pivot='before']"
      );
      const afterPivot = textMiddle?.querySelector("[data-gsap-pivot='after']");

      // Guard clause: Skip if essential elements are missing
      if (!stickyContent) {
        console.warn(
          `Long scroll section ${index + 1}: Missing sticky content element`
        );
        return;
      }

      // Set initial CSS variables
      gsap.set(longScrollSection, {
        "--progress1": 0,
        "--progress2": 0,
      });

      // Simple setup - just measure where the pivot is relative to textMiddle at the start
      let pivotOffsetX = 0;

      if (textMiddle && pivotElement) {
        // Measure initial positions
        const textMiddleRect = textMiddle.getBoundingClientRect();
        const pivotRect = pivotElement.getBoundingClientRect();

        // How far is the pivot from textMiddle's center? (including the 13px offset)
        const textMiddleCenterX =
          textMiddleRect.left + textMiddleRect.width / 2;
        const pivotCenterX =
          pivotRect.left + pivotRect.width / 2 + pivotRect.width * 0.1;

        pivotOffsetX = pivotCenterX - textMiddleCenterX;

        // console.log("Simple setup:", {
        //   pivotOffsetX: pivotOffsetX,
        //   textMiddleCenterX: textMiddleCenterX,
        //   pivotCenterX: pivotCenterX,
        // });

        // Set initial state for animation
        gsap.set(textMiddle, {
          scale: 0,
          transformOrigin: "50% 50%", // Scale from center
        });
      }

      // Sticky content pinning removed - using CSS position: sticky instead

      // Create the long scroll animation
      ScrollTrigger.create({
        trigger: longScrollSection,
        start: "top top",
        end: "bottom bottom",
        // markers: false,
        scrub: !isMobile() ? true : 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const isWhiteScroll =
            longScrollSection.getAttribute("data-long-scroll") === "white";
          // console.log(`Long scroll section ${index + 1} progress:`, progress);
          // Calculate progress values — white section finishes wipe at end (less dead white)
          const progress1 = Math.min(
            progress / (isWhiteScroll ? 0.5 : 0.6),
            1
          );
          const progress2 = !isMobile()
            ? progress >= (isWhiteScroll ? 0.25 : 0.3)
              ? (progress - (isWhiteScroll ? 0.25 : 0.3)) /
                (isWhiteScroll ? 0.75 : 0.55)
              : 0 // Desktop: white finishes at 100%, pink at 85%
            : progress >= (isWhiteScroll ? 0.35 : 0.45)
            ? (progress - (isWhiteScroll ? 0.35 : 0.45)) /
              (isWhiteScroll ? 0.65 : 0.2)
            : 0; // Mobile: white finishes at 100%, pink at 75%

          const progress3 =
            progress >= 0.4 && progress <= 0.55
              ? (progress - 0.4) / 0.15
              : progress > 0.55
              ? 1
              : 0;

          // Update CSS variables
          gsap.set(longScrollSection, {
            "--progress1": progress1,
            "--progress2": progress2,
          });

          // Apply transforms
          if (textTop) {
            gsap.set(textTop, {
              y: `${progress1 * -100}%`,
            });
          }

          if (textBottom) {
            gsap.set(textBottom, {
              y: `${progress1 * 100}%`,
            });
          }

          // Simple middle text animation
          if (textMiddle && pivotElement) {
            const currentScale = !isMobile()
              ? Math.max(0, progress1 * 2.25)
              : Math.max(0, progress1 * 2.95); // Scale based on progress1, larger on desktop
            // Clamp to minimum 0

            // Always apply transforms (don't use conditional)
            const viewportCenterX = window.innerWidth / 2;

            // Calculate how much we need to shift to get pivot to center
            const scaledPivotOffset = pivotOffsetX * currentScale;
            const targetTranslateX = -scaledPivotOffset;

            // Calculate opacity: 0 at progress1=0, 1 at progress1>=0.33
            const middleOpacity = Math.min(
              Math.max((progress1 - 0) / 0.33, 0),
              1
            );

            gsap.set(textMiddle, {
              scale: currentScale,
              x: targetTranslateX,
              transformOrigin: "50% 50%",
              opacity: middleOpacity,
            });

            // Apply pivot animations if elements exist
            if (beforePivot) {
              gsap.set(beforePivot, {
                xPercent: progress3 * -5,
              });
            }

            if (afterPivot) {
              gsap.set(afterPivot, {
                xPercent: progress3 * 20,
              });
            }
          }

          // Text wrapper animation
          if (textWrapper) {
            gsap.set(textWrapper, {
              scale: 1 + progress1 * 8,
            });
          }

          // Progress2 effects
          if (progress2 > 0 && stickyContent) {
            // Get the color mode from the attribute
            const colorMode =
              longScrollSection.getAttribute("data-long-scroll");
            let colorValue = "#fff"; // default

            if (colorMode === "pink") {
              colorValue = "var(--swatch--pink)";
            } else if (colorMode === "white") {
              colorValue = "#fff";
            }

            gsap.set(stickyContent, {
              color: colorValue,
            });
          }
        },
      });
    }

    // Initialize all long scroll sections
    const longScrollSections = document.querySelectorAll(
      "[data-gsap-section='long-scroll']"
    );
    setTimeout(() => {
      if (longScrollSections.length > 0) {
        longScrollSections.forEach((section, index) => {
          initializeLongScrollAnimation(section, index);
        });
      } else {
        console.warn("No long scroll sections found");
      }
    }, 500);

    /////////////////////////////////
    /* Footer social Cards*/
    /////////////////////////////////

    // class FeedItemsAnimation {
    //   constructor(container) {
    //     // Element selections based on your HTML structure
    //     this.container = container;
    //     this.feedItems = [...container.querySelectorAll(".feed_cms_item")];
    //     this.feedSection = container.querySelector(".section_feed");
    //     this.feedWrapper = container.querySelector(".feed_cms_wrapper");
    //     this.feedContainer = container.querySelector(".feed_container");
    //     this.feedWrapper = container.querySelector(".feed_cms_wrap");
    //     this.feedList = container.querySelector(".feed_cms_list"); // The actual grid container

    //     // Background elements
    //     this.bgItems = [...container.querySelectorAll(".feed_bg-content-item")];
    //     this.bgContainer = container.querySelector(".feed_bg-content");

    //     // Mobile detection (using the same function from your code)
    //     this.isMobile = isMobile();

    //     // Animation properties - adjust for mobile
    //     this.targetZValue = 1;
    //     this.closestItem = null;
    //     this.closestZDifference = Infinity;
    //     this.currIndex = 0;
    //     this.newIndex = 0;
    //     this.numItems = this.feedItems.length;
    //     this.progress = 0;

    //     // Z-depth configuration based on device
    //     this.zDepthConfig = {
    //       desktop: {
    //         initialSpacing: -1800, // Original spacing for desktop
    //         totalRange: 3000, // Total range for normalization
    //         maxOffset: 1800 * this.numItems,
    //       },
    //       mobile: {
    //         initialSpacing: -900, // Half the spacing = items start closer
    //         totalRange: 1500, // Adjusted range for normalization
    //         maxOffset: 900 * this.numItems,
    //       },
    //     };

    //     this.currentConfig = this.isMobile
    //       ? this.zDepthConfig.mobile
    //       : this.zDepthConfig.desktop;

    //     this.init();
    //   }

    //   init() {
    //     // Initial setup for feed items with mobile-specific positioning
    //     gsap.set(this.feedItems, {
    //       z: (index) => (index + 1) * this.currentConfig.initialSpacing,
    //       zIndex: (index) => index * -1,
    //       opacity: 0,
    //     });

    //     // Initial setup for background items
    //     if (this.bgContainer && this.bgItems.length > 0) {
    //       // Set background container to opacity 0 initially
    //       gsap.set(this.bgContainer, {
    //         opacity: 0,
    //       });

    //       // Set all background items to opacity 0 initially
    //       gsap.set(this.bgItems, {
    //         opacity: 0,
    //       });
    //     }

    //     this.feedSection.style.height = `${
    //       (this.numItems + 1) * window.innerHeight
    //     }px`;

    //     this.createScrollTriggers();
    //     this.getProgress();
    //   }

    //   // Main progress calculation and item positioning
    //   getProgress = () => {
    //     this.resetClosestItem();

    //     this.feedItems.forEach((item) => {
    //       // Use mobile-specific range for normalization
    //       let normalizedZ = gsap.utils.normalize(
    //         -this.currentConfig.totalRange,
    //         0,
    //         gsap.getProperty(item, "z")
    //       );
    //       item.setAttribute("data-z", normalizedZ);

    //       // Animate opacity based on z position
    //       gsap.to(item, { opacity: normalizedZ + 0.2 });

    //       // Scale images based on z position with mobile-specific scaling
    //       const itemImage = item.querySelector(".feed_img");
    //       if (itemImage) {
    //         // Slightly different scaling for mobile to account for closer starting position
    //         const scaleMultiplier = this.isMobile ? 0.6 : 0.5;
    //         const baseScale = this.isMobile ? 0.8 : 0.75;

    //         gsap.to(itemImage, {
    //           scale: normalizedZ * scaleMultiplier + baseScale,
    //           ease: "expo.out",
    //           duration: 0.5,
    //         });
    //       }

    //       // Find closest item to target z value
    //       let zDifference = Math.abs(normalizedZ - this.targetZValue);
    //       if (zDifference < this.closestZDifference) {
    //         this.closestZDifference = zDifference;
    //         this.closestItem = item;
    //       }
    //     });

    //     // Update current index and handle background transitions
    //     const newIndex = this.feedItems.indexOf(this.closestItem);

    //     if (newIndex !== this.currIndex) {
    //       this.handleBackgroundTransition(newIndex);
    //       this.currIndex = newIndex;
    //     }
    //   };

    //   handleBackgroundTransition = (newIndex) => {
    //     if (!this.bgItems.length) return;

    //     // Fade out current background item if it exists
    //     if (this.currIndex >= 0 && this.bgItems[this.currIndex]) {
    //       gsap.to(this.bgItems[this.currIndex], {
    //         opacity: 0,
    //         duration: 0.3,
    //         ease: "power2.out",
    //       });
    //     }

    //     // Fade in new background item
    //     if (this.bgItems[newIndex]) {
    //       gsap.to(this.bgItems[newIndex], {
    //         opacity: 1,
    //         duration: 0.3,
    //         ease: "power2.out",
    //       });
    //     }

    //     this.newIndex = newIndex;
    //   };

    //   resetClosestItem = () => {
    //     this.closestItem = null;
    //     this.closestZDifference = Infinity;
    //   };

    //   createScrollTriggers() {
    //     // Main scroll animation for feed items z-positioning
    //     ScrollTrigger.create({
    //       trigger: this.feedContainer,
    //       start: "top top",
    //       end: () => `+=${this.numItems * window.innerHeight}`,
    //       pin: this.feedContainer,
    //       pinSpacing: true,
    //       scrub: !isMobile() ? 0.1 : 0.75,
    //       invalidateOnRefresh: true,
    //       markers: false, // Remove this in production
    //       immediateRender: false,
    //       onUpdate: (self) => {
    //         this.progress = self.progress;
    //         this.progress = gsap.utils.clamp(0, 1, this.progress);

    //         // Calculate z-offset using mobile-specific values
    //         let zOffset = this.progress * this.currentConfig.maxOffset;
    //         gsap.set(this.feedItems, {
    //           z: (index) =>
    //             (index + 1) * this.currentConfig.initialSpacing + zOffset,
    //         });

    //         this.getProgress();
    //       },
    //       onEnter: () => {
    //         // Show background container when entering the trigger area
    //         if (this.bgContainer) {
    //           gsap.to(this.bgContainer, {
    //             opacity: 1,
    //             duration: 0.3,
    //             ease: "power2.out",
    //           });
    //         }

    //         // Show first background item
    //         if (this.bgItems[0]) {
    //           gsap.to(this.bgItems[0], {
    //             opacity: 1,
    //             duration: 0.3,
    //             ease: "power2.out",
    //           });
    //         }
    //       },
    //       onStart: () => {
    //         // Ensure the pinned element starts at the top
    //         gsap.set(this.feedList, {
    //           position: "fixed",
    //           top: 0,
    //           left: "50%",
    //           xPercent: -50,
    //         });
    //         // Keep feed height fixed for this pageview (no dynamic resize here)
    //       },
    //       onLeave: () => {
    //         // Optional: fade out background when leaving the section
    //         if (this.bgContainer) {
    //           gsap.to(this.bgContainer, {
    //             opacity: 0,
    //             duration: 0.3,
    //             ease: "power2.out",
    //           });
    //         }
    //       },
    //       onLeaveBack: () => {
    //         // Hide background when scrolling back up and leaving the trigger area
    //         if (this.bgContainer) {
    //           gsap.to(this.bgContainer, {
    //             opacity: 0,
    //             duration: 0.3,
    //             ease: "power2.out",
    //           });
    //         }
    //       },
    //       onEnterBack: () => {
    //         // Show background again when entering back
    //         if (this.bgContainer) {
    //           gsap.to(this.bgContainer, {
    //             opacity: 1,
    //             duration: 0.3,
    //             ease: "power2.out",
    //           });
    //         }
    //       },
    //     });
    //   }
    // }
    class FeedItemsAnimation {
  constructor(container) {
    this.container = container;
    this.feedItems = [...container.querySelectorAll(".feed_cms_item")];

    // Guard clause
    if (this.feedItems.length === 0) {
      console.warn('No feed items found - skipping feed animation');
      return;
    }

    this.feedSection = container.querySelector(".section_feed");
    this.feedWrapper = container.querySelector(".feed_cms_wrap");
    this.feedScrollWrapper = container.querySelector(".feed_scroll_wrapper");
    this.feedContainer = container.querySelector(".feed_container");
    this.feedList = container.querySelector(".feed_cms_list");

    // Cache feed images once instead of querying every frame
    this.feedImages = this.feedItems.map((item) =>
      item.querySelector(".feed_img")
    );

    // Background elements
    this.bgItems = [...container.querySelectorAll(".feed_bg-content-item")];
    this.bgContainer = container.querySelector(".feed_bg-content");

    this.isMobile = isMobile();

    // Get scroller height (use scroller container height on mobile, window height on desktop)
    this.scrollerHeight = this.isMobile
      ? (currentScroller && currentScroller !== window
          ? currentScroller.clientHeight
          : window.innerHeight)
      : window.innerHeight;

    this.targetZValue = 1;
    this.closestItem = null;
    this.closestZDifference = Infinity;
    this.currIndex = 0;
    this.newIndex = 0;
    this.numItems = this.feedItems.length;
    this.progress = 0;

    this.zDepthConfig = {
      desktop: {
        initialSpacing: -1800,
        totalRange: 3000,
        maxOffset: 1800 * this.numItems,
      },
      mobile: {
        initialSpacing: -900,
        totalRange: 1500,
        maxOffset: 900 * this.numItems,
      },
    };

    this.currentConfig = this.isMobile
      ? this.zDepthConfig.mobile
      : this.zDepthConfig.desktop;

    this.init();
  }

  init() {
    gsap.set(this.feedItems, {
      z: (index) => (index + 1) * this.currentConfig.initialSpacing,
      zIndex: (index) => index * -1,
      opacity: 0,
    });

    if (this.bgContainer && this.bgItems.length > 0) {
      gsap.set(this.bgContainer, { opacity: 0 });
      gsap.set(this.bgItems, { opacity: 0 });
    }

    // Set height on the scroll wrapper for sticky positioning
    if (this.feedScrollWrapper) {
      this.feedScrollWrapper.style.height = `${
        (this.numItems + 1) * this.scrollerHeight
      }px`;
    }

    this.createScrollTriggers();
    this.getProgress();
  }

  getProgress = () => {
    this.resetClosestItem();

    this.feedItems.forEach((item, index) => {
      const z = gsap.getProperty(item, "z");
      const normalizedZ = gsap.utils.normalize(
        -this.currentConfig.totalRange,
        0,
        z
      );

      item.dataset.z = normalizedZ;

      // ✅ use set instead of to (no tween creation per frame)
      gsap.set(item, { opacity: normalizedZ + 0.2 });

      const itemImage = this.feedImages[index];
      if (itemImage) {
        const scaleMultiplier = this.isMobile ? 0.6 : 0.5;
        const baseScale = this.isMobile ? 0.8 : 0.75;

        gsap.set(itemImage, {
          scale: normalizedZ * scaleMultiplier + baseScale,
        });
      }

      const zDifference = Math.abs(normalizedZ - this.targetZValue);
      if (zDifference < this.closestZDifference) {
        this.closestZDifference = zDifference;
        this.closestItem = item;
      }
    });

    const newIndex = this.feedItems.indexOf(this.closestItem);
    if (newIndex !== this.currIndex) {
      this.handleBackgroundTransition(newIndex);
      this.currIndex = newIndex;
    }
  };

  handleBackgroundTransition = (newIndex) => {
    if (!this.bgItems.length) return;

    if (this.currIndex >= 0 && this.bgItems[this.currIndex]) {
      gsap.to(this.bgItems[this.currIndex], {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    if (this.bgItems[newIndex]) {
      gsap.to(this.bgItems[newIndex], {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    this.newIndex = newIndex;
  };

  resetClosestItem = () => {
    this.closestItem = null;
    this.closestZDifference = Infinity;
  };

  createScrollTriggers() {
    // Feed container pinning removed - using CSS position: sticky instead
    ScrollTrigger.create({
      trigger: this.feedScrollWrapper || this.feedContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.3, // ✅ smoother scrub (less CPU than 0.1)
      invalidateOnRefresh: true,
      markers: false,
      immediateRender: false,

      onUpdate: (self) => {
        this.progress = gsap.utils.clamp(0, 1, self.progress);
        const zOffset = this.progress * this.currentConfig.maxOffset;

        // ✅ batch update all items in one gsap.set
        gsap.set(this.feedItems, {
          z: (index) =>
            (index + 1) * this.currentConfig.initialSpacing + zOffset,
        });

        this.getProgress();
      },

      onEnter: () => {
        if (this.bgContainer) {
          gsap.to(this.bgContainer, { opacity: 1, duration: 0.3 });
        }
        if (this.bgItems[0]) {
          gsap.to(this.bgItems[0], { opacity: 1, duration: 0.3 });
        }
      },

      onStart: () => {
        gsap.set(this.feedList, {
          position: "fixed",
          top: 0,
          left: "50%",
          xPercent: -50,
        });
      },

      onLeave: () => {
        if (this.bgContainer) {
          gsap.to(this.bgContainer, { opacity: 0, duration: 0.3 });
        }
      },

      onLeaveBack: () => {
        if (this.bgContainer) {
          gsap.to(this.bgContainer, { opacity: 0, duration: 0.3 });
        }
      },

      onEnterBack: () => {
        if (this.bgContainer) {
          gsap.to(this.bgContainer, { opacity: 1, duration: 0.3 });
        }
      },
    });
  }
}

    const feedAnimation = new FeedItemsAnimation(document);

    /////////////////////////////////
    /* Squeezed H2 ANIMATION */
    /////////////////////////////////

    // Basic Line-by-Line Squeeze using GSAP SplitText plugin
    const squeezeElements = gsap.utils.toArray("[data-gsap-squeeze]");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    squeezeElements.forEach((element, i) => {
      // LET’S WORK TOGETHER — word-by-word rise + squeeze on enter
      if (element.classList.contains("footer_title")) {
        const splitWords = new SplitText(element, {
          type: "words",
          wordsClass: "footer-title-word",
        });

        if (reducedMotion) {
          gsap.set(splitWords.words, { clearProps: "all" });
          return;
        }

        gsap.set(splitWords.words, {
          opacity: 0,
          yPercent: 55,
          scaleY: 0.15,
          transformOrigin: "50% 100%",
        });

        gsap.to(splitWords.words, {
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          duration: 0.95,
          stagger: 0.11,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });
        return;
      }

      // Split the text into lines using SplitText plugin
      // console.log(`Animating line of element ${element}}`);
      const splitText = new SplitText(element, {
        type: "lines",
        linesClass: "squeeze-line",
      });

      // Get the line elements
      const lines = splitText.lines;

      // Set initial transform origin and scale for each line
      gsap.set(lines, {
        transformOrigin: "0 0",
        scaleX: 1,
        scaleY: 0, // Start from scale 1,0
      });

      // Create the squeeze animation for each line
      lines.forEach((line, lineIndex) => {
        // Get the line height
        const lineHeight = line.offsetHeight;

        gsap.to(line, {
          scaleY: 1, // Animate to scale 1,1 (scaleX stays 1)
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: line, // Use the line itself as trigger
            start: "top bottom", // When line top hits viewport bottom
            end: `top bottom-=${lineHeight}px`, // End when line travels exactly its height
            scrub: !isMobile() ? true : 1,
            // markers: true, // Remove in production
          },
        });
      });
    });

    /////////////////////////////////
    /* Body Text Animations*/
    /////////////////////////////////

    // Body Text Animation
    const bodyTextElements = document.querySelectorAll(
      '[data-animate-text="body"]'
    );

    // Store split text instances for cleanup
    let bodyTextSplitInstances = [];

    bodyTextElements.forEach((textElement, index) => {
      const paragraph = textElement.querySelector("p");

      if (!paragraph) {
        console.warn(`Body text element ${index + 1}: No paragraph found`);
        return;
      }

      // Split paragraph into lines
      const splitText = new SplitText(paragraph, {
        type: "lines",
        linesClass: "body-text-line",
      });

      // Store split instance for cleanup
      bodyTextSplitInstances.push({
        element: paragraph,
        split: splitText,
      });

      // Set initial state for lines - hidden and offset from bottom
      gsap.set(splitText.lines, {
        opacity: 0,
        y: 20,
      });

      // Create ScrollTrigger for this specific element
      ScrollTrigger.create({
        trigger: textElement,
        start: "top 90%", // When element top hits 70% from viewport top
        // markers: false, // Remove in production
        toggleActions: "play none none none", // Only play once when entering
        onEnter: () => {
          // Animate lines with stagger
          gsap.to(splitText.lines, {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power2.out",
            stagger: 0.2, // 0.2s delay between each line
          });
        },
      });
    });

    /////////////////////////////////
    /* Modal CTA Button Animation */
    /////////////////////////////////

    const modalCtaButtons = document.querySelectorAll(
      '[data-animate-button="modal-cta"]'
    );

    modalCtaButtons.forEach((button) => {
      gsap.set(button, {
        opacity: 0,
        y: 24,
        scale: 0.96,
      });

      ScrollTrigger.create({
        trigger: button,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.to(button, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.75,
            ease: "power2.out",
          });
        },
      });
    });    
    
    // IMPORTANT: Refresh ScrollTrigger after all animations are set up
    // console.log(
    //   "Font-dependent animations initialized - refreshing ScrollTrigger"
    // );
    // setTimeout(() => {
    //   refreshScrollTriggers();
    // }, 100);
  }

  // Initialize font-dependent animations (never hang forever on fonts.ready)
  const startFontAnimations = () => {
    try {
      initializeFontDependentAnimations();
    } catch (error) {
      console.warn("Font-dependent init failed:", error);
      dismissPreloader();
    }
  };

  const fontsReady =
    document.fonts && document.fonts.ready
      ? document.fonts.ready.catch(() => {})
      : Promise.resolve();

  Promise.race([
    fontsReady,
    new Promise((resolve) => window.setTimeout(resolve, 2000)),
  ]).then(startFontAnimations);

  /////////////////////////////////
  /////////////////////////////////
  /* Animate background - FONT INDEPENDENT */
  /////////////////////////////////
  /////////////////////////////////

  function animateBackground() {
    const backgroundElement = document.querySelector("[data-animate-bg]");
    const setPageTheme = (theme) => {
      if (!theme) return;
      document.documentElement.setAttribute("data-page-theme", theme);
    };

    document.addEventListener("colorThemesReady", () => {
      // Default: first theme section on the page (usually light/hero)
      const firstTheme = document
        .querySelector("[data-animate-theme-to]")
        ?.getAttribute("data-animate-theme-to");
      setPageTheme(firstTheme || "light");

      $("[data-animate-theme-to]").each(function () {
        let theme = $(this).attr("data-animate-theme-to");

        ScrollTrigger.create({
          trigger: $(this),
          start: "top center",
          markers: false,
          end: "bottom center",
          onToggle: ({ self, isActive }) => {
            if (isActive) {
              gsap.to("body", { ...colorThemes.getTheme(theme) });
              setPageTheme(theme);
            }
          },
        });
      });
    });
  }

  animateBackground();
});
