
    (function initSitePreloader() {
      // Configuration for Visit Detection & Timing
      const PRELOADER_CONFIG = {
        // 'session': Runs on first visit per browser tab/session (recommended)
        // 'always': Runs every time the page is loaded/reloaded
        // 'once': Runs strictly once ever in browser localStorage
        mode: 'session',
        minDisplayTimeMs: 1400, // Smooth minimum time (1.4s) for high-end feel
        safetyTimeoutMs: 7000   // Failsafe timeout to prevent blocking on slow networks
      };

      const urlParams = new URLSearchParams(window.location.search);
      const forceLoader = urlParams.get('loader') === '1' || urlParams.get('loader') === 'true';

      let hasVisited = false;
      try {
        if (PRELOADER_CONFIG.mode === 'session') {
          hasVisited = sessionStorage.getItem('portfolio_visited') === 'true';
        } else if (PRELOADER_CONFIG.mode === 'once') {
          hasVisited = localStorage.getItem('portfolio_visited') === 'true';
        }
      } catch (e) {
        hasVisited = false;
      }

      const preloaderEl = document.getElementById('sitePreloader');
      if (!preloaderEl) return;

      if (hasVisited && !forceLoader) {
        preloaderEl.style.display = 'none';
        return;
      }

      // Mark body as active during preloading
      document.body.classList.add('preloader-active');

      const counterEl = document.getElementById('preloaderCounter');
      const barFillEl = document.getElementById('preloaderBarFill');
      const logTextEl = document.getElementById('preloaderLogText');
      const assetCountEl = document.getElementById('preloaderAssetCount');
      const statusBadgeEl = document.getElementById('preloaderStatusBadge');

      const STATIC_ASSETS = [
        "images/image (1).png",
        "assets/awards/top-talent-executive.png",
        "assets/awards/ustar-shiningstar-poa-global.png",
        "assets/awards/ustar-shiningstar-hyd-portal.png",
        "assets/awards/ustar-superstar-darkmode.png",
        "assets/awards/ustar-shiningstar-dsa-dds.png",
        "assets/awards/obbserv-logo.png",
        "assets/work/case1-dsa.png",
        "assets/work/case4-aakar.png",
        "https://framerusercontent.com/images/1vBuykJeAiLWRMSdY1dQptRSo.png?width=1200&height=1200",
        "https://framerusercontent.com/images/B2uQRUgJA8Vgenhb0zG136W4ca0.png",
        "Team_Pic/web/3690fd3f-6207-49c8-bd54-1236c1a69d04.JPG",
        "Team_Pic/web/50e29246-6245-4975-bc17-cb38a87ca242.JPG",
        "Team_Pic/web/77c0c802-994c-4942-9b6d-34b8c704a80f.JPG",
        "Team_Pic/web/90512e90-48b6-4625-ba18-f91dfd32c36c.JPG",
        "Team_Pic/web/IMG_2743.JPG",
        "Team_Pic/web/IMG_3417.JPG",
        "Team_Pic/web/IMG_4576.jpg",
        "Team_Pic/web/IMG_6222.jpg",
        "Team_Pic/web/IMG_6232.jpg",
        "Team_Pic/web/IMG_6582.JPG",
        "Team_Pic/web/IMG_6600.jpg",
        "Team_Pic/web/IMG_8658.jpg",
        "Team_Pic/web/IMG_9071.jpg",
        "Team_Pic/web/b77daa1c-19bb-4db6-8d31-cc5427784930.JPG",
        "Team_Pic/web/ddea1a8d-15a5-4ffb-b963-f633418754e3.JPG",
        "Team_Pic/web/ee4f38ee-de5c-4da7-86fd-b18766459775.JPG"
      ];

      // Discover any additional images in the document
      const domImgs = Array.from(document.querySelectorAll('img')).map(img => img.src).filter(Boolean);
      const allAssets = Array.from(new Set([...STATIC_ASSETS, ...domImgs]));

      let loadedAssets = 0;
      const totalAssets = allAssets.length;
      let targetProgress = 5;
      let currentDisplayProgress = 0;
      const startTime = Date.now();
      let isComplete = false;

      function updateLog(status, label) {
        if (logTextEl) logTextEl.textContent = status;
        if (label && statusBadgeEl) statusBadgeEl.textContent = label;
      }

      // Preload single image promise
      function preloadImage(url) {
        return new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            loadedAssets++;
            targetProgress = Math.min(85, Math.round(5 + (loadedAssets / totalAssets) * 80));
            if (assetCountEl) assetCountEl.textContent = `${loadedAssets} / ${totalAssets}`;
            const cleanName = url.split('/').pop().split('?')[0].substring(0, 24);
            updateLog(`Preloading ${cleanName}`, 'PRELOADING ASSETS');
            resolve();
          };
          img.onerror = () => {
            loadedAssets++;
            targetProgress = Math.min(85, Math.round(5 + (loadedAssets / totalAssets) * 80));
            if (assetCountEl) assetCountEl.textContent = `${loadedAssets} / ${totalAssets}`;
            resolve();
          };
          img.src = url;
        });
      }

      const assetsPromise = Promise.all(allAssets.map(preloadImage));

      // Font loading
      const fontsPromise = (document.fonts && document.fonts.ready) 
        ? document.fonts.ready.then(() => {
            targetProgress = Math.max(targetProgress, 90);
            updateLog('Web fonts synchronized', 'TYPOGRAPHY READY');
          })
        : Promise.resolve();

      // 3D Shader & Animation compilation warm-up
      const animationsPromise = new Promise(resolve => {
        const warmShaders = () => {
          updateLog('Compiling 3D shaders & WebGL pipelines', 'WARMING 3D SCENE');
          targetProgress = Math.max(targetProgress, 95);
          setTimeout(resolve, 350);
        };
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          warmShaders();
        } else {
          document.addEventListener('DOMContentLoaded', warmShaders);
        }
      });

      // Smooth progress lerp loop (60fps)
      function stepProgress() {
        if (isComplete) return;

        if (currentDisplayProgress < targetProgress) {
          const delta = targetProgress - currentDisplayProgress;
          currentDisplayProgress += Math.max(0.6, delta * 0.12);
        }

        const rounded = Math.min(100, Math.floor(currentDisplayProgress));
        if (counterEl) counterEl.textContent = rounded < 10 ? `0${rounded}` : `${rounded}`;
        if (barFillEl) barFillEl.style.width = `${rounded}%`;

        requestAnimationFrame(stepProgress);
      }
      requestAnimationFrame(stepProgress);

      // Trigger completion once everything is ready
      Promise.all([assetsPromise, fontsPromise, animationsPromise]).then(() => {
        targetProgress = 100;
        updateLog('All systems & visual engines ready', 'EXPERIENCE READY');

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, PRELOADER_CONFIG.minDisplayTimeMs - elapsed);

        setTimeout(() => {
          finishAndReveal();
        }, remaining);
      });

      // Failsafe timer
      const safetyTimer = setTimeout(() => {
        if (!isComplete) {
          targetProgress = 100;
          finishAndReveal();
        }
      }, PRELOADER_CONFIG.safetyTimeoutMs);

      function finishAndReveal() {
        if (isComplete) return;
        isComplete = true;
        clearTimeout(safetyTimer);

        if (counterEl) counterEl.textContent = '100';
        if (barFillEl) barFillEl.style.width = '100%';
        if (statusBadgeEl) statusBadgeEl.textContent = 'PORTFOLIO READY';
        if (logTextEl) logTextEl.textContent = 'Launching portfolio...';

        // Remember visit in session
        try {
          if (PRELOADER_CONFIG.mode === 'session') {
            sessionStorage.setItem('portfolio_visited', 'true');
          } else if (PRELOADER_CONFIG.mode === 'once') {
            localStorage.setItem('portfolio_visited', 'true');
          }
        } catch (e) {}

        setTimeout(() => {
          // Animate curtain lift
          preloaderEl.classList.add('is-exiting');
          document.body.classList.remove('preloader-active');

          // Smooth entrance for Hero Cards and Header if GSAP is available
          if (typeof gsap !== 'undefined') {
            gsap.fromTo('#heroFrontCard', 
              { y: 35, opacity: 0, scale: 0.96 }, 
              { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out' }
            );
            gsap.fromTo('#heroBackCard', 
              { y: 35, opacity: 0, scale: 0.8 }, 
              { y: 0, opacity: 0.85, scale: 0.85, duration: 1.2, delay: 0.1, ease: 'power3.out' }
            );
            gsap.fromTo('#mainHeader', 
              { y: -30, opacity: 0 }, 
              { y: 0, opacity: 1, duration: 0.9, delay: 0.15, ease: 'power3.out' }
            );
          }

          // Remove element after transition completes
          setTimeout(() => {
            preloaderEl.style.display = 'none';
          }, 1000);
        }, 300);
      }
    })();
  