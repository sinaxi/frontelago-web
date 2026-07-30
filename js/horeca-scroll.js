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

    if (!scroller || scroller === window) {
      return;
    }

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

      anchor.addEventListener("click", (event) => {
        event.preventDefault();

        const scrollerRect = scroller.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const targetOffset = targetRect.top - scrollerRect.top + scroller.scrollTop;

        if (typeof scroller.scrollTo === "function") {
          scroller.scrollTo({
            top: targetOffset,
            behavior: "smooth",
          });
        } else {
          scroller.scrollTop = targetOffset;
        }

        if (history.pushState) {
          history.pushState(null, "", href);
        } else {
          window.location.hash = href;
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
  /* ALL OTHER ANIMATIONS - WAIT FOR FONTS */
  /////////////////////////////////
  

  // Function to initialize all font-dependent animations
  function initializeFontDependentAnimations() {
    // console.log("Initializing font-dependent animations");

  /////////////////////////////////
  /* Pre loader animation - RUNS IMMEDIATELY */
  /////////////////////////////////


  const createPreloaderTimeline = () => {
    return gsap.timeline({
      onStart: () => {
        // Fallback: also set body overflow hidden
        document.body.classList.add("u-live-noscroll");

        // Disable Lenis scrolling at the start of preloader
        if (lenis) {
          lenis.stop();
        }
      },
      onComplete: () => {
        // Remove body overflow restriction
        document.body.classList.remove("u-live-noscroll");

        // Re-enable Lenis scrolling when preloader completes
        if (lenis) {
          lenis.start();
        }
        refreshScrollTriggers();
      },
    });
  };

  // Split text elements and set initial states - IMMEDIATE
  const onLoadHeading = document.querySelector(
    '[data-animate-heading="on-load"]'
  );
  const onLoadText = document.querySelector('[data-animate-text="on-load"]');
  const preloaderTitle = document.querySelector(".preloader_title");

  let headingSplit, textSplit, titleSplit;

  if (onLoadHeading) {
    headingSplit = new SplitText(onLoadHeading, { type: "words" });
    gsap.set(headingSplit.words, { opacity: 0, yPercent: 100 });
  }

  if (onLoadText) {
    textSplit = new SplitText(onLoadText, { type: "lines" });
    gsap.set(textSplit.lines, { opacity: 0, y: 40 });
  }

  // Set initial state for navigation component
  gsap.set(".nav_component", {
    y: -100,
    opacity: 0,
  });

  // Set initial states for on-load elements
  gsap.set(".loader_video", {
    scale: 1.25,
  });

  // PRELOADER ANIMATION - RUNS IMMEDIATELY
  if (isMobile()) {
    // MOBILE TIMELINE
    // console.log("Initializing mobile preloader timeline");

    // Mobile-specific initial states
    gsap.set(".preloader_image_wrap img", {
      scale: 1,
      opacity: 1,
    });

    const mobileTimeline = createPreloaderTimeline();

    mobileTimeline
      // 1. Animate the image from scale 1 to 1.1
      .to(".preloader_image_wrap img", {
        scale: 1.1,
        duration: 1.5,
        ease: "power4.out",
      })
      // 3. Hold for a moment
      .to({}, { duration: 1 })

      // 5. Animate preloader out (starts while title is exiting)
      .to(
        ".preloader_wrap",
        {
          height: "0svh",
          duration: 1.5,
          ease: "power4.out",
          onComplete: function () {
            gsap.set(".preloader_wrap", { display: "none" });
          },
        },
        "-=0.1"
      ) // Start before title chars finish exiting

      // 6. Animate on-load elements (starts 0.5s before preloader finishes)
      .to(
        headingSplit ? headingSplit.words : [],
        {
          opacity: 1,
          yPercent: 0,
          duration: 1,
          ease: "power4.out",
          stagger: 0.05,
        },
        "-=0.65"
      )

      .to(
        textSplit ? textSplit.lines : [],
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power4.out",
          stagger: 0.1,
        },
        "-=0.85"
      )

      .to(
        ".loader_video",
        {
          scale: 1,
          duration: 2,
          ease: "power4.out",
        },
        "-=2.25"
      )

      // 7. Animate navigation component at the very end
      .to(
        ".nav_component",
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=1"
      ); // Start slightly before video animation completes
  } else {
    // DESKTOP TIMELINE
    // console.log("Initializing desktop preloader timeline");

    // Split preloader title into characters for desktop
    if (preloaderTitle) {
      gsap.set(preloaderTitle, { opacity: 1 });
      // console.log("Desktop: Preloader Title is set to show");

      titleSplit = new SplitText(preloaderTitle, { type: "chars" });
      // console.log("Desktop titleSplit:", titleSplit);
      gsap.set(titleSplit.chars, { yPercent: 100, opacity: 0 });
    }

    const desktopTimeline = createPreloaderTimeline();

    desktopTimeline

      .to(titleSplit ? titleSplit.chars : [], {
        yPercent: 0,
        opacity: 1,
        duration: 0.75, // 1 second total duration for the stagger effect
        ease: "power2.out",
        stagger: 0.05, // Character by character stagger
      })
      // 2. Hold for a moment
      .to({}, { duration: 0.3 })

      // 3. Animate title characters out (to -100%) before preloader closes
      .to(titleSplit ? titleSplit.chars : [], {
        yPercent: -100,
        opacity: 0,
        duration: 0.7,
        ease: "power2.in",
        stagger: 0.03, // Faster stagger for exit
      })
      // 4. Animate preloader out
      .to(
        ".preloader_wrap",
        {
          height: "0svh",
          duration: 1.1,
          ease: "power4.out",
          onComplete: function () {
            gsap.set(".preloader_wrap", { display: "none" });
          },
        },
        "<+" + (titleSplit ? (titleSplit.chars.length - 1) * 0.03 + 0.5 : 0.7)
      )

      // 5. Animate on-load elements (starts 0.5s before preloader finishes)
      .to(
        headingSplit ? headingSplit.words : [],
        {
          opacity: 1,
          yPercent: 0,
          duration: 1,
          ease: "power4.out",
          stagger: 0.05,
        },
        "-=0.65"
      )

      .to(
        textSplit ? textSplit.lines : [],
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power4.out",
          stagger: 0.1,
        },
        "-=0.85"
      )

      .to(
        ".loader_video",
        {
          scale: 1,
          duration: 2,
          ease: "power4.out",
        },
        "-=2.25"
      )

      // 6. Animate navigation component at the very end
      .to(
        ".nav_component",
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=1"
      ); // Start slightly before video animation completes
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
      const navMenuLinks = document.querySelectorAll(".nav_1_links_link");

      if (!navButtonsMenu || !navMenuTrigger) return;

      // Get text elements for splitting and icon
      const triggerText = navMenuTrigger.querySelector(".nav_desktop_text");
      const triggerIcon = navMenuTrigger.querySelector(".nav_desktop_icon");
      const linkTexts = [];

      // Collect all link text elements
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

    // Image scaling animation for all cards (including the last one)
    const allCardsWrappers = gsap.utils.toArray(".slide-wrapper");

    allCardsWrappers.forEach((wrapper, i) => {
      const imageElement = wrapper.querySelector("[data-gsap-image]");

      if (imageElement) {
        // Set initial scale
        gsap.set(imageElement, {
          scale: 0.3,
        });

        // Create the scaling animation
        gsap.to(imageElement, {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: "top 80%", // When card top hits 90% from top
            end: "top 30%", // When card reaches center (50% from top)
            scrub: 1,
          },
        });
      }
    });

    /////////////////////////////////
    /* PARTNERS LIST ANIMATION */
    /////////////////////////////////

    // Get all partner items
    const partnerItems = gsap.utils.toArray(".partners_cms_item");
    gsap.set(".partners_cms_item", {
      scale: 0.75,
      opacity: 0,
      transformOrigin: "top left",
    });

    ScrollTrigger.batch(".partners_cms_item", {
      // When items enter the viewport - ANIMATE ONCE
      onEnter: (elements) => {
        gsap.to(elements, {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          // ease: "power2.out",
          stagger: 0.15, // Stagger effect between items in the same batch
          // overwrite: true,
        });
      },

      // Trigger settings
      start: "top 85%", // When item hits 85% from top of viewport
      once: true, // THIS IS KEY! Animation only happens once
      // markers: false, // Uncomment to see trigger points during development
    });

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

        // Use SplitText to split the h2 into individual characters
        const splitText = new SplitText(title, {
          type: "chars, lines",
          charsClass: "letter",
          linesClass: "gravity-line",
          reduceWhiteSpace: false,
        });

        // Calculate the distance for scattering
        const dist = container.clientHeight - title.clientHeight;

        // Check if container should be pinned
        const shouldPin =
          container.getAttribute("data-animate-container") === "pinned";

        if (!isMobile()) {
          if (shouldPin) {
            // Pin the title during scroll (only for containers with "pinned" value)
            ScrollTrigger.create({
              trigger: container,
              pin: title,
              start: "top 15%",
              end: "+=" + dist,
              // markers: true,
              onComplete: () => {
                // Optional: Revert SplitText when animation completes
                // splitText.revert();
              },
            });
          } else {
            // Specific case for horizontal scroll with pinning

            // Check if gridSection height is less than 70% of viewport height
            const horizontalWrapper = document.querySelector(
              '[data-gsap-wrapper="horizontal-scroll"]'
            );
            const gridSectionHeight = horizontalWrapper
              ? horizontalWrapper.getBoundingClientRect().height
              : 0;
            const viewportHeight = window.innerHeight;
            const seventyPercentVH = viewportHeight * 0.7;

            const shouldUseGridSectionAsEndTrigger =
              gridSectionHeight < seventyPercentVH;
            // console.log(gridSectionHeight, seventyPercentVH);
            const scrollTriggerConfig = {
              trigger: container,
              pin: title,
              start: "top 15%",
              // markers: true,
              onComplete: () => {
                // Optional: Revert SplitText when animation completes
                // splitText.revert();
              },
            };

            // Conditionally set endTrigger and end based on grid section height
            if (shouldUseGridSectionAsEndTrigger && gridSection) {
              scrollTriggerConfig.endTrigger = gridSection;
              scrollTriggerConfig.end = "bottom bottom";
            } else {
              // Default behavior when grid section is tall enough
              scrollTriggerConfig.end = "+=" + dist;
            }

            ScrollTrigger.create(scrollTriggerConfig);
          }
        } else {
          ScrollTrigger.create({
            trigger: container,
            pin: title,
            start: "top 15%",
            end: "+=" + dist,
            // markers: true,
            onComplete: () => {
              // Optional: Revert SplitText when animation completes
              // splitText.revert();
            },
          });
        }

        // Animate each character with random scattering (applies to all containers)
        const letters = splitText.chars;
        letters.forEach((letter) => {
          const randomDistance = Math.random() * dist;

          gsap.from(letter, {
            y: randomDistance,
            ease: "none",
            scrollTrigger: {
              trigger: shouldPin ? title : container, // Use title if pinned, container if not
              start: "top 15%",
              end: "+=" + randomDistance,
              // markers: true,
              scrub: !isMobile() ? true : 1,
            },
          });
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
      const headerHeightPx = !isMobile()
        ? `${wrapperHeight / totalItemsCount}px`
        : headerHeight;
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
        if (!isMobile()) {
          setTimeout(() => {
            header.style.position = "absolute";
          }, 1000);
        }
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
          // console.log(`Long scroll section ${index + 1} progress:`, progress);
          // Calculate progress values
          const progress1 = Math.min(progress / 0.6, 1);
          const progress2 = !isMobile()
            ? progress >= 0.3
              ? (progress - 0.3) / 0.55
              : 0 // Desktop: start at 30%, finish at 85%
            : progress >= 0.45
            ? (progress - 0.45) / 0.2
            : 0; // Mobile: start at 45%, finish at 75%

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

    squeezeElements.forEach((element, i) => {
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
        transformOrigin: "0 0", // Origin at top-left (0,0)
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

  // Initialize font-dependent animations
  // Try document.fonts.ready first, with fallback
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready
      .then(() => {
        // console.log(
        //   "Fonts loaded via document.fonts.ready - initializing animations"
        // );
        initializeFontDependentAnimations();
      })
      .catch((error) => {
        // console.log("document.fonts.ready failed, using fallback:", error);
        // Fallback: wait a bit then initialize
        setTimeout(() => {
          // console.log("Fallback initialization after timeout");
          initializeFontDependentAnimations();
        }, 1000);
      });
  } else {
    // Fallback for browsers that don't support document.fonts.ready
    // console.log("document.fonts.ready not supported, using timeout fallback");
    setTimeout(() => {
      // console.log("Timeout fallback initialization");
      initializeFontDependentAnimations();
    }, 1000);
  }

  /////////////////////////////////
  /////////////////////////////////
  /* Animate background - FONT INDEPENDENT */
  /////////////////////////////////
  /////////////////////////////////

  function animateBackground() {
    const backgroundElement = document.querySelector("[data-animate-bg]");
    document.addEventListener("colorThemesReady", () => {
      $("[data-animate-theme-to]").each(function () {
        let theme = $(this).attr("data-animate-theme-to");

        ScrollTrigger.create({
          trigger: $(this),
          start: "top center",
          markers: false,
          end: "bottom center",
          onToggle: ({ self, isActive }) => {
            if (isActive) gsap.to("body", { ...colorThemes.getTheme(theme) });
          },
        });
      });
    });
  }

  animateBackground();
});
