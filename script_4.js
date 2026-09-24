
    document.addEventListener("DOMContentLoaded", () => {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
      gsap.registerPlugin(ScrollTrigger);

      const UNSPLASH_IMAGES = [
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

      // Distribute evenly across 5 columns
      const cols = [[], [], [], [], []];
      UNSPLASH_IMAGES.forEach((src, i) => { cols[i % 5].push(src); });

      // Repeat enough times that columns never run out
      const repeat = (arr) => [...arr, ...arr, ...arr, ...arr, ...arr, ...arr];

      const renderCol = (arr, selector) => {
        const container = document.querySelector(selector);
        if (!container) return;
        container.innerHTML = arr.map(src =>
          `<div class="tc-img-card"><img src="${src}" alt="Team photo" decoding="async"></div>`
        ).join('');
      };

      renderCol(repeat(cols[0]), '.tc-col-1');
      renderCol(repeat(cols[1]), '.tc-col-2');
      renderCol(repeat(cols[2]), '.tc-col-3');
      renderCol(repeat(cols[3]), '.tc-col-4');
      renderCol(repeat(cols[4]), '.tc-col-5');

      // ─── Initial state: columns staggered vertically, no z-axis ───
      // Negative y = column is shifted UP, so images fill the top of viewport
      // Columns start at different offsets to look staggered
      // ─── Initial 3D state: dramatic tilt + depth ──────────────────
      // Matrix is 200vw wide, so at scale 0.8 (from z:-350 + perspective:1400)
      // apparent width = 200vw × 0.8 = 160vw — covers the screen fully
      gsap.set('.tc-matrix', {
        rotationX: 22,
        rotationY: -30,
        rotationZ: 12,
        z: -350,
        transformOrigin: "center center",
        force3D: true
      });

      // Columns staggered vertically — all start negative (shifted up), no top gaps
      gsap.set('.tc-col-1', { y: "-8%",  force3D: true });
      gsap.set('.tc-col-2', { y: "-28%", force3D: true });
      gsap.set('.tc-col-3', { y: "-12%", force3D: true });
      gsap.set('.tc-col-4', { y: "-32%", force3D: true });
      gsap.set('.tc-col-5', { y: "-18%", force3D: true });

      // ─── ScrollTrigger Timeline ────────────────────────────────────
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".team-culture-3d-sec",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
          invalidateOnRefresh: true,
          refreshPriority: 1,
          fastScrollEnd: 3000,
          preventOverlaps: true
        }
      });

      // Phase 1 (first 50% of scroll): unfurl the 3D tilt — matrix rotates flat
      tl.to('.tc-matrix', {
        rotationX: 4,
        rotationY: -6,
        rotationZ: 2,
        z: 0,
        ease: "power2.out",
        force3D: true,
        duration: 0.5
      }, 0);

      // Phase 2 (full scroll): columns drift at different speeds — pure parallax
      tl.to('.tc-col-1', { y: "-52%", ease: "none", force3D: true, duration: 1 }, 0);
      tl.to('.tc-col-2', { y: "-68%", ease: "none", force3D: true, duration: 1 }, 0);
      tl.to('.tc-col-3', { y: "-48%", ease: "none", force3D: true, duration: 1 }, 0);
      tl.to('.tc-col-4', { y: "-72%", ease: "none", force3D: true, duration: 1 }, 0);
      tl.to('.tc-col-5', { y: "-58%", ease: "none", force3D: true, duration: 1 }, 0);

    });
  