
    document.addEventListener("DOMContentLoaded", () => {

      // 2. 3D Tilt Effect on Philosophy Bento Cards
      const tiltCards = document.querySelectorAll("[data-tilt]");
      tiltCards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          const rotateX = -(y / (rect.height / 2)) * 6;
          const rotateY = (x / (rect.width / 2)) * 6;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        });

        card.addEventListener("mouseleave", () => {
          card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
        });
      });

      // 4. Scroll Motion Engine (RequestAnimationFrame Throttled)
      const heroStage = document.getElementById("hero");
      const heroFrontCard = document.getElementById("heroFrontCard");
      const heroBackCard = document.getElementById("heroBackCard");
      const scrollGuidePill = document.getElementById("scrollGuidePill");
      const header = document.getElementById("mainHeader");

      let isTicking = false;

      function onScrollTick() {
        const vh = window.innerHeight;

        // A. Hero Cards Splitting Animation
        const heroRect = heroStage.getBoundingClientRect();
        const heroProgress = Math.max(0, Math.min(1, -heroRect.top / (heroStage.offsetHeight - vh)));

        
        if (heroProgress <= 0.02) {
          heroFrontCard.style.transform = "rotate(-4deg)";
          heroFrontCard.style.opacity = "1";
          heroBackCard.style.transform = "rotate(4deg) scale(0.85)";
          heroBackCard.style.opacity = "0.85";
          scrollGuidePill.style.opacity = "1";
        } else if (heroProgress > 0.02 && heroProgress <= 0.85) {
          const splitFactor = (heroProgress - 0.02) / 0.83;
          const xOffset = splitFactor * 650;
          const fadeOut = Math.max(0, 1 - splitFactor * 1.5);
          
          heroFrontCard.style.transform = `translateX(-${xOffset}px) rotate(-${4 + splitFactor * 8}deg)`;
          heroFrontCard.style.opacity = `${fadeOut}`;
          
          heroBackCard.style.transform = `translateX(${xOffset}px) rotate(${4 + splitFactor * 8}deg) scale(${0.85 + splitFactor * 0.15})`;
          heroBackCard.style.opacity = `${fadeOut}`;
          
          scrollGuidePill.style.opacity = `${Math.max(0, 1 - splitFactor * 2)}`;
        } else {
          heroFrontCard.style.transform = `translateX(-650px) rotate(-12deg)`;
          heroFrontCard.style.opacity = "0";
          heroBackCard.style.transform = `translateX(650px) rotate(12deg) scale(1)`;
          heroBackCard.style.opacity = "0";
          scrollGuidePill.style.opacity = "0";
        }

        // B. Dynamic Header Dark/Light Navigation Sync
        const philoSection = document.getElementById("philosophy");
        const philoRect = philoSection ? philoSection.getBoundingClientRect() : null;
        const footerSection = document.getElementById("footer") || document.querySelector(".mondragon-footer");
        const footerRect = footerSection ? footerSection.getBoundingClientRect() : null;

        const isDarkSection = (heroRect.bottom > 60) || 
                              (philoRect && philoRect.top <= 60 && philoRect.bottom > 60) ||
                              (footerRect && footerRect.top <= 60);

        if (isDarkSection) {
          header.classList.add("nav-dark-mode");
        } else {
          header.classList.remove("nav-dark-mode");
        }

        isTicking = false;
      }

      window.addEventListener("scroll", () => {
        if (!isTicking) {
          window.requestAnimationFrame(onScrollTick);
          isTicking = true;
        }
      }, { passive: true });

      // 5. Arc Pro 3D Curved Interactive Carousel Engine (120fps RAF Motion)
      const arcViewport = document.getElementById("arcCarouselViewport");
      const arcCards = Array.from(document.querySelectorAll(".arc-card-item"));
      const arcPrevBtn = document.getElementById("arcPrevBtn");
      const arcNextBtn = document.getElementById("arcNextBtn");
      const arcCounter = document.getElementById("arcCurrentIdx");
      const arcDots = Array.from(document.querySelectorAll(".arc-dot"));

      if (arcViewport && arcCards.length > 0) {
        const totalCards = arcCards.length;
        let currentPos = 0;
        let targetPos = 0;
        let isDragging = false;
        let isHovered = false;
        let isInteracting = false;
        let isVisible = true;
        let interactionTimeout = null;
        let wheelDebounce = null;

        let startX = 0;
        let startPos = 0;
        let lastPointerX = 0;
        let lastPointerTime = 0;
        let velocity = 0;
        let dragDistance = 0;

        // Auto-scroll speed (continuous silky glide: ~5.5s per card transition)
        const autoScrollSpeed = 0.0030;
        let lastFrameTime = performance.now();

        const getSpacing = () => (window.innerWidth <= 809 ? 330 : 450);
        const getAngle = () => (window.innerWidth <= 809 ? 14 : 17);
        const getDepth = () => (window.innerWidth <= 809 ? 65 : 100);
        const getYOffset = () => (window.innerWidth <= 809 ? 6 : 10);

        function updateCarousel(instant = false) {
          const spacing = getSpacing();
          const angle = getAngle();
          const depth = getDepth();
          const yOff = getYOffset();

          if (instant) {
            currentPos = targetPos;
          }

          arcCards.forEach((card, i) => {
            // Infinite circular wrapping offset relative to currentPos
            let diff = i - currentPos;
            diff = ((diff + totalCards / 2) % totalCards + totalCards) % totalCards - totalCards / 2;

            const absDiff = Math.abs(diff);

            // 3D curved transformation coordinates matching Arc Pro specs
            const translateX = diff * spacing;
            const translateY = Math.pow(diff, 2) * yOff;
            const translateZ = -absDiff * depth;
            const rotateY = -diff * angle;
            const scale = Math.max(0.72, 1 - absDiff * 0.11);
            const opacity = Math.max(0, 1 - Math.pow(absDiff / 2.2, 1.8) * 0.85);
            const zIndex = Math.round(100 - absDiff * 10);

            card.style.transform = `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
            card.style.opacity = opacity.toFixed(3);
            card.style.zIndex = zIndex;
            card.style.pointerEvents = absDiff > 1.8 ? "none" : "auto";
            card.style.visibility = absDiff > 2.6 ? "hidden" : "visible";
          });

          // Update active step indicator & counter
          const activeIndex = ((Math.round(currentPos) % totalCards) + totalCards) % totalCards;
          if (arcCounter) {
            arcCounter.textContent = String(activeIndex + 1).padStart(2, "0");
          }
          arcDots.forEach((dot, idx) => {
            dot.classList.toggle("active", idx === activeIndex);
          });
        }

        // Animation Loop with continuous auto-scroll and 120fps spring physics
        function animate(now) {
          const dt = Math.min((now - lastFrameTime) / 16.67, 2.0); // Normalized delta time
          lastFrameTime = now;

          // Continuous auto-scroll progression when in view and user is not interacting
          if (isVisible && !isDragging && !isHovered && !isInteracting) {
            targetPos += autoScrollSpeed * dt;
          }

          if (!isDragging) {
            const diff = targetPos - currentPos;
            if (Math.abs(diff) > 0.0001) {
              currentPos += diff * 0.10;
            } else {
              currentPos = targetPos;
            }
          }

          updateCarousel();
          requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);

        // Helper to pause auto-scroll temporarily after manual click/nav
        function pauseAutoScrollTemporarily(ms = 3200) {
          isInteracting = true;
          clearTimeout(interactionTimeout);
          interactionTimeout = setTimeout(() => {
            isInteracting = false;
          }, ms);
        }

        // Pause auto-scroll on hover (user wants to read recommendation)
        arcViewport.addEventListener("mouseenter", () => {
          isHovered = true;
        });
        arcViewport.addEventListener("mouseleave", () => {
          isHovered = false;
        });

        // Tab visibility sync to prevent time jumps
        document.addEventListener("visibilitychange", () => {
          lastFrameTime = performance.now();
        });

        // Intersection Observer: Only auto-scroll when section is in viewport
        if ("IntersectionObserver" in window) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              isVisible = entry.isIntersecting;
              if (isVisible) {
                lastFrameTime = performance.now();
              }
            });
          }, { threshold: 0.15 });
          observer.observe(arcViewport);
        }

        // Drag / Swipe Pointer Events
        arcViewport.addEventListener("pointerdown", (e) => {
          isDragging = true;
          arcViewport.classList.add("is-dragging");
          pauseAutoScrollTemporarily(5000);
          startX = e.clientX;
          startPos = targetPos;
          lastPointerX = e.clientX;
          lastPointerTime = performance.now();
          velocity = 0;
          dragDistance = 0;
          arcViewport.setPointerCapture(e.pointerId);
        });

        arcViewport.addEventListener("pointermove", (e) => {
          if (!isDragging) return;
          const spacing = getSpacing();
          const currentX = e.clientX;
          const deltaX = currentX - startX;
          dragDistance = Math.abs(deltaX);

          const now = performance.now();
          const dt = now - lastPointerTime;
          if (dt > 10) {
            velocity = (currentX - lastPointerX) / dt;
            lastPointerX = currentX;
            lastPointerTime = now;
          }

          targetPos = startPos - deltaX / spacing;
          currentPos = targetPos; // Direct 1:1 tracking during drag
        });

        const handlePointerUp = (e) => {
          if (!isDragging) return;
          isDragging = false;
          arcViewport.classList.remove("is-dragging");
          try {
            arcViewport.releasePointerCapture(e.pointerId);
          } catch (err) {}

          const spacing = getSpacing();
          // Momentum with inertia dampening
          const inertia = -velocity * 160 / spacing;
          targetPos = Math.round(targetPos + inertia);
          pauseAutoScrollTemporarily(3500);
        };

        arcViewport.addEventListener("pointerup", handlePointerUp);
        arcViewport.addEventListener("pointercancel", handlePointerUp);

        // Card Click to Snap to Center
        arcCards.forEach((card, i) => {
          card.addEventListener("click", () => {
            if (dragDistance > 8) return; // Ignore clicks after swipe
            let diff = i - currentPos;
            diff = ((diff + totalCards / 2) % totalCards + totalCards) % totalCards - totalCards / 2;
            targetPos = Math.round(targetPos + diff);
            pauseAutoScrollTemporarily(3500);
          });
        });

        // Navigation Buttons
        if (arcPrevBtn) {
          arcPrevBtn.addEventListener("click", () => {
            targetPos = Math.round(targetPos) - 1;
            pauseAutoScrollTemporarily(3500);
          });
        }

        if (arcNextBtn) {
          arcNextBtn.addEventListener("click", () => {
            targetPos = Math.round(targetPos) + 1;
            pauseAutoScrollTemporarily(3500);
          });
        }

        // Pagination Dots Click
        arcDots.forEach((dot) => {
          dot.addEventListener("click", () => {
            const targetIdx = parseInt(dot.getAttribute("data-index"), 10);
            const activeIdx = ((Math.round(targetPos) % totalCards) + totalCards) % totalCards;
            let step = targetIdx - activeIdx;
            if (step > totalCards / 2) step -= totalCards;
            if (step < -totalCards / 2) step += totalCards;
            targetPos += step;
            pauseAutoScrollTemporarily(3500);
          });
        });

        // Wheel / Trackpad horizontal scrub
        arcViewport.addEventListener("wheel", (e) => {
          const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
          if (Math.abs(delta) > 4) {
            e.preventDefault();
            pauseAutoScrollTemporarily(4000);
            targetPos += delta * 0.0022;
            currentPos = targetPos;
            clearTimeout(wheelDebounce);
            wheelDebounce = setTimeout(() => {
              targetPos = Math.round(targetPos);
            }, 180);
          }
        }, { passive: false });

        // Responsive resize recalibration
        window.addEventListener("resize", () => {
          updateCarousel(true);
        }, { passive: true });

        // Initial setup
        updateCarousel(true);
      }

      // ==========================================================================
      // 6. THREE.JS 3D CHROMATIC LIQUID WAVE ENGINE (Mondragon 4 & Persistent Empathy)
      // ==========================================================================
      const shaderCanvas = document.getElementById("mondragonShaderCanvas");
      const footerElement = document.getElementById("footer");

      if (shaderCanvas && footerElement) {
        let shaderRunning = true;
        const canvas = document.getElementById("mondragonShaderCanvas");
        const gl = canvas.getContext("webgl2");
        if (!gl) {
          console.warn("WebGL2 not supported, falling back to dark background");
          canvas.style.background = "#050505";
          return;
        }

        const vertexShaderSource = `#version 300 es
        in vec2 aCorner;
        void main() {
            gl_Position = vec4(aCorner, 0.0, 1.0);
        }`;

        const fragmentShaderSource = `#version 300 es
        precision highp float;
        uniform vec2 uView;
        uniform float uTravel;
        uniform float uStride;
        uniform float uSwing;
        uniform float uGlow;
        uniform float uFieldScale;
        uniform float uLift;
        uniform float uRelief;
        uniform float uSink;
        uniform float uSeed;
        uniform float uEye;
        uniform float uTilt;
        uniform vec3 uHues[4];
        out vec4 outColor;
        const mat2 FOLD = mat2(-0.163296, 8.20684, 2.54316, 5.356704);
        vec3 wheel(float t) {
            float band = fract(t) * 4.0;
            float lo = floor(band);
            float blend = smoothstep(0.0, 1.0, band - lo);
            int from = int(lo);
            int to = int(mod(lo + 1.0, 4.0));
            return mix(uHues[from], uHues[to], blend);
        }
        float scatter(vec2 p) {
            p = fract(p * vec2(125.86, 458.36));
            p += dot(p, p + 44.21);
            return fract(p.x * p.y);
        }
        float interleave(vec2 p) {
            return fract(52.9829189 * fract(dot(p, vec2(0.02711056, 0.00583715))));
        }
        float lattice(vec2 x) {
            vec2 cell = floor(x);
            vec2 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            float n00 = scatter(cell);
            float n10 = scatter(cell + vec2(1.0, 0.0));
            float n01 = scatter(cell + vec2(0.0, 1.0));
            float n11 = scatter(cell + vec2(1.0, 1.0));
            return mix(mix(n00, n10, f.x), mix(n01, n11, f.x), f.y);
        }
        float ridge(vec3 p, float depth) {
            if (p.y > 6.0) return p.y;
            vec2 q = p.xz * uFieldScale + uSeed;
            float height = uLift;
            float amp = uRelief;
            int layers = (depth > 21.6 && depth <= 33.1) ? 3 : 2;
            for (int k = 0; k < 3; k++) {
                if (k >= layers) break;
                height += lattice(q) * amp;
                q = FOLD * q;
                q += vec2(-4.8, 11.5);
                amp *= 0.3;
            }
            return p.y + height - uSink;
        }
        void main() {
            vec2 px = gl_FragCoord.xy;
            vec2 uv = (px * 2.0 - uView) / uView.y;
            vec3 origin = vec3(0.0, uEye, uTravel);
            vec3 dir = normalize(vec3(uv, 1.0));
            float cs = cos(uTilt);
            float sn = sin(uTilt);
            dir.yz = vec2(cs * dir.y + sn * dir.z, -sn * dir.y + cs * dir.z);
            vec3 glowSum = vec3(3.0);
            float travelled = scatter(px) * 0.03;
            for (float i = 1.0; i <= 100.0; i += 1.0) {
                if (travelled > 60.0) break;
                vec3 p = origin + dir * travelled;
                float ground = ridge(p, travelled);
                float field = ground;
                if (ground <= 4.0) {
                    vec3 w = p * 2.5 + uSeed;
                    float lace = dot(sin(w), cos(w.yzx)) * 0.5;
                    field = max(lace, ground);
                }
                float stepLen = uStride + uSwing * abs(field - i * 0.02);
                travelled += stepLen;
                vec3 tone = wheel(i * 0.04) * 1.4;
                float fog = -travelled * travelled * 0.42;
                glowSum += max(tone / stepLen, fog);
            }
            vec3 mapped = tanh(glowSum * glowSum * 0.00000125 * uGlow);
            mapped += (interleave(px) - 0.5) * 0.004;
            outColor = vec4(mapped, 1.0);
        }`;

        function compileShader(gl, type, source) {
          const shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
          }
          return shader;
        }

        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          -1, -1,
           1, -1,
          -1,  1,
          -1,  1,
           1, -1,
           1,  1
        ]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "aCorner");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        function hexToRgb(hex) {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return [r, g, b];
        }

        const hues = [
          ...hexToRgb('#0A9FBD'),
          ...hexToRgb('#00D2FF'),
          ...hexToRgb('#001ADB'),
          ...hexToRgb('#FF0055')
        ];
        gl.uniform3fv(gl.getUniformLocation(program, "uHues"), new Float32Array(hues));

        gl.uniform1f(gl.getUniformLocation(program, "uStride"), 0.0205);
        gl.uniform1f(gl.getUniformLocation(program, "uSwing"), 0.0669);
        gl.uniform1f(gl.getUniformLocation(program, "uGlow"), 1.0);
        gl.uniform1f(gl.getUniformLocation(program, "uFieldScale"), 0.64);
        gl.uniform1f(gl.getUniformLocation(program, "uLift"), 0.8);
        gl.uniform1f(gl.getUniformLocation(program, "uRelief"), 0.9);
        gl.uniform1f(gl.getUniformLocation(program, "uSink"), 2.3);
        gl.uniform1f(gl.getUniformLocation(program, "uSeed"), 318.0);
        gl.uniform1f(gl.getUniformLocation(program, "uEye"), 2.7);
        gl.uniform1f(gl.getUniformLocation(program, "uTilt"), 0.17);

        const locView = gl.getUniformLocation(program, "uView");
        const locTravel = gl.getUniformLocation(program, "uTravel");

        let travel = 0;
        const speed = 2.0;
        let lastTime = performance.now();

        function resize() {
          const rect = footerElement.getBoundingClientRect();
          const dpr = To_resolution || Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          canvas.style.width = rect.width + 'px';
          canvas.style.height = rect.height + 'px';
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.uniform2f(locView, canvas.width, canvas.height);
        }
        
        const To_resolution = 0.5; // Framer site used 0.5 for performance

        window.addEventListener("resize", resize);
        resize();

        function render(time) {
          if (shaderRunning) {
            const dt = (time - lastTime) / 1000;
            travel += dt * speed;
            lastTime = time;
            gl.uniform1f(locTravel, travel);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
          } else {
            lastTime = time;
          }
          requestAnimationFrame(render);
        }
        requestAnimationFrame(render);


        // Pause loop when footer is out of viewport to conserve battery
        if ("IntersectionObserver" in window) {
          const shaderObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              shaderRunning = entry.isIntersecting;
            });
          }, { threshold: 0.05 });
          shaderObserver.observe(footerElement);
        }
      }

      // ==========================================================================
      const stageEl = document.getElementById("mondragonStage");
      const ctaWrapEl = document.getElementById("mondragonCta");
      const cardEl = document.getElementById("mondragonCard");
      const mailPillEl = document.getElementById("mondragonMailPill");
      const letterEls = Array.from(document.querySelectorAll(".mondragon-kinetic-letter"));

      if (stageEl && ctaWrapEl) {
        // Layout normalized positions with generous breathing space:
        const letterSpecs = [
          // Left side arc: L E T ' S
          { char: "L", nx: 0.16, ny: 0.48, mass: 1.0 },
          { char: "E", nx: 0.20, ny: 0.44, mass: 1.0 },
          { char: "T", nx: 0.24, ny: 0.41, mass: 1.1 },
          { char: "'", nx: 0.28, ny: 0.39, mass: 0.8 },
          { char: "S", nx: 0.32, ny: 0.38, mass: 1.0 },
          // Center cluster: W O R K
          { char: "W", nx: 0.38, ny: 0.36, mass: 1.1 },
          { char: "O", nx: 0.43, ny: 0.52, mass: 1.0 },
          { char: "R", nx: 0.48, ny: 0.56, mass: 1.1 },
          { char: "K", nx: 0.53, ny: 0.54, mass: 1.0 },
          // Right side arc: T O G E T H E R !
          { char: "T", nx: 0.58, ny: 0.48, mass: 1.0 },
          { char: "O", nx: 0.62, ny: 0.44, mass: 1.0 },
          { char: "G", nx: 0.66, ny: 0.42, mass: 1.0 },
          { char: "E", nx: 0.70, ny: 0.41, mass: 1.0 },
          { char: "T", nx: 0.74, ny: 0.44, mass: 1.1 },
          { char: "H", nx: 0.78, ny: 0.48, mass: 1.1 },
          { char: "E", nx: 0.82, ny: 0.50, mass: 1.0 },
          { char: "R", nx: 0.86, ny: 0.52, mass: 1.0 },
          { char: "!", nx: 0.90, ny: 0.52, mass: 0.9 }
        ];

        let stageWidth = stageEl.offsetWidth;
        let stageHeight = stageEl.offsetHeight;

        const physicsItems = [];

        // Add Card item
        if (cardEl) {
          physicsItems.push({
            el: cardEl,
            isCard: true,
            nx: 0.50,
            ny: 0.14,
            x: 0, y: 0,
            baseX: 0, baseY: 0,
            vx: 0, vy: 0,
            rot: 0, vRot: 0,
            phase: 0.4,
            mass: 3.2,
            radius: 80
          });
        }

        // Add Mail Me Pill item (matches 00:03 in reference video)
        if (mailPillEl) {
          physicsItems.push({
            el: mailPillEl,
            isCard: false,
            isPill: true,
            nx: 0.08,
            ny: 0.32,
            x: 0, y: 0,
            baseX: 0, baseY: 0,
            vx: 0, vy: 0,
            rot: 0, vRot: 0,
            phase: 1.2,
            mass: 1.8,
            radius: 50
          });
        }

        // Add Letter items
        letterEls.forEach((el, idx) => {
          const spec = letterSpecs[idx] || { nx: 0.2 + (idx * 0.03), ny: 0.4, mass: 1.0 };
          physicsItems.push({
            el: el,
            isCard: false,
            nx: spec.nx,
            ny: spec.ny,
            x: 0, y: 0,
            baseX: 0, baseY: 0,
            vx: 0, vy: 0,
            rot: 0, vRot: 0,
            phase: idx * 0.45,
            mass: spec.mass,
            radius: 28
          });
        });

        function recalibrateStage() {
          stageWidth = stageEl.offsetWidth;
          stageHeight = stageEl.offsetHeight;
          const isMobile = stageWidth <= 600;

          physicsItems.forEach((item) => {
            const cardW = isMobile ? 140 : 180;
            if (item.isCard) {
              item.baseX = stageWidth * item.nx - cardW / 2;
              item.baseY = stageHeight * item.ny;
            } else {
              item.baseX = stageWidth * item.nx;
              item.baseY = stageHeight * item.ny;
            }
            if (item.x === 0 && item.y === 0) {
              item.x = item.baseX;
              item.y = item.baseY;
            }
          });
        }

        window.addEventListener("resize", recalibrateStage, { passive: true });
        recalibrateStage();

        // Mouse interaction state
        let mouseInStage = false;
        let cursorX = -1000, cursorY = -1000;
        let draggedItem = null;
        let dragOffsetX = 0, dragOffsetY = 0;

        ctaWrapEl.addEventListener("mouseenter", () => { mouseInStage = true; });
        ctaWrapEl.addEventListener("mouseleave", () => {
          mouseInStage = false;
          cursorX = -1000;
          cursorY = -1000;
          draggedItem = null;
        });

        ctaWrapEl.addEventListener("mousemove", (e) => {
          const rect = stageEl.getBoundingClientRect();
          cursorX = e.clientX - rect.left;
          cursorY = e.clientY - rect.top;

          if (draggedItem) {
            draggedItem.vx = (cursorX - dragOffsetX - draggedItem.x) * 0.4;
            draggedItem.vy = (cursorY - dragOffsetY - draggedItem.y) * 0.4;
            draggedItem.x = cursorX - dragOffsetX;
            draggedItem.y = cursorY - dragOffsetY;
          }
        });

        // Drag & Toss mechanics
        physicsItems.forEach((item) => {
          item.el.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            draggedItem = item;
            const rect = stageEl.getBoundingClientRect();
            dragOffsetX = (e.clientX - rect.left) - item.x;
            dragOffsetY = (e.clientY - rect.top) - item.y;
            item.el.setPointerCapture(e.pointerId);
          });

          item.el.addEventListener("pointerup", (e) => {
            if (draggedItem === item) {
              try { item.el.releasePointerCapture(e.pointerId); } catch(err) {}
              draggedItem = null;
            }
          });
        });

        let physicsRunning = true;
        let physicsTime = 0;

        
        
        function updatePhysics() {
          if (!physicsRunning) {
            requestAnimationFrame(updatePhysics);
            return;
          }

          physicsTime += 0.016;

          let floatOffset = 0;
          if (window.scrollY > 10) {
            floatOffset = -window.scrollY * 0.6;
          }

          let baseFrontZ = 10;
          let baseBackZ = 1;

          physicsItems.forEach((item) => {
            const targetX = item.baseX;
            const targetY = item.baseY + floatOffset;

            // 2. Cursor Repulsion Force
            if (mouseInStage) {
              const dx = item.x - cursorX;
              const dy = item.y - cursorY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const repulsionRadius = item.isCard ? 170 : 130;

              if (dist < repulsionRadius && dist > 1) {
                const force = Math.pow(1 - dist / repulsionRadius, 1.6) * (18 / item.mass);
                item.vx += (dx / dist) * force;
                item.vy += (dy / dist) * force;
                item.vRot += (dx > 0 ? 1 : -1) * force * 0.9;
              }
            }

            // 3. Spring Return Force to Home
            const k = 0.045 / item.mass;
            item.vx += (targetX - item.x) * k;
            item.vy += (targetY - item.y) * k;
            item.vRot += (-item.rot) * 0.05;

            // 4. Damping Friction
            item.vx *= 0.88;
            item.vy *= 0.88;
            item.vRot *= 0.84;

            // 5. Integrate Position
            item.x += item.vx;
            item.y += item.vy;
            item.rot += item.vRot;

            // 6. Apply GPU Render Transform
            item.el.style.transform = `translate3d(${item.x.toFixed(2)}px, ${item.y.toFixed(2)}px, 0) rotate(${item.rot.toFixed(2)}deg)`;
          });

          requestAnimationFrame(updatePhysics);
        }
requestAnimationFrame(updatePhysics);

        // Pause physics when footer is offscreen
        if ("IntersectionObserver" in window) {
          const physObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              physicsRunning = entry.isIntersecting;
            });
          }, { threshold: 0.05 });
          physObserver.observe(footerElement);
        }
      }

      // ==========================================================================
      // 8. TO TOP BUTTON LISTENER
      // ==========================================================================
      const footerToTopBtn = document.getElementById("footerToTopBtn");
      if (footerToTopBtn) {
        footerToTopBtn.addEventListener("click", (e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "auto" }); /* Instant jump to top */
        });
      }

      // Run initial tick
      onScrollTick();
    });

      // ==========================================================================

      // ==========================================================================

      // ==========================================================================

      // ==========================================================================
      // ==========================================================================

      
      // ==========================================================================
      // 9. 3D CONTENT BEND EFFECT (Fixed rendering glitch)
      // ==========================================================================
      function initStableBendEffect() {
        const containers = document.querySelectorAll('section .container');
        
        function renderBend() {
          const viewportCenter = window.innerHeight / 2;
          
          containers.forEach(el => {
            const rect = el.getBoundingClientRect();
            const distTop = rect.top - viewportCenter;
            const distBottom = rect.bottom - viewportCenter;
            
            let activeDelta = 0;
            if (distTop > 0) {
              activeDelta = Math.min(distTop / (window.innerHeight * 0.4), 1.0);
            } else if (distBottom < 0) {
              activeDelta = Math.max(distBottom / (window.innerHeight * 0.4), -1.0);
            }
            
            // Just apply a simple translate/scale instead of glitchy preserve-3d
            const targetY = Math.abs(activeDelta) * -40;
            const targetScale = 1 - Math.abs(activeDelta) * 0.05;
            const targetOpac = 1 - Math.abs(activeDelta) * 0.3;
            
            el.style.transform = `translateY(${targetY}px) scale(${targetScale})`;
            el.style.opacity = targetOpac;
          });
          
          requestAnimationFrame(renderBend);
        }
        renderBend();
      }
      initStableBendEffect();

      
      // ==========================================================================
      // 11. Warp Gallery Engine (Auto Scroll)
      // ==========================================================================
      function initWarpGallery() {
        const tracks = document.querySelectorAll('.warp-col-track');
        const items = document.querySelectorAll('.warp-item');
        if (!items.length || !tracks.length) return;

        const speeds = [0.8, 0.5, 0.9]; 
        const offsets = [0, -150, -50]; 

        // Intersection observer to only run animation when section is visible
        let sectionVisible = false;
        const warpSection = document.getElementById('philosophy');
        if (warpSection && "IntersectionObserver" in window) {
          const obs = new IntersectionObserver((entries) => {
            sectionVisible = entries[0].isIntersecting;
          }, { threshold: 0 });
          obs.observe(warpSection);
        } else {
          sectionVisible = true;
        }

        function renderWarp() {
          if (!sectionVisible) {
             requestAnimationFrame(renderWarp);
             return;
          }

          const vh = window.innerHeight;
          const vw = window.innerWidth;
          const viewportCenterY = vh / 2;
          const viewportCenterX = vw / 2;

          // 1. Move tracks
          tracks.forEach((track, index) => {
            offsets[index] -= speeds[index];
            
            // Loop condition (half of track height because it contains 2 duplicated sets)
            const trackHeight = track.offsetHeight / 2;
            if (Math.abs(offsets[index]) >= trackHeight && trackHeight > 0) {
               offsets[index] += trackHeight;
            }
            
            track.style.transform = `translateY(${offsets[index]}px)`;
          });

          // 2. Measure items and apply 3D transform to inner
          items.forEach(item => {
            const inner = item.querySelector('.warp-item-inner');
            if (!inner) return;

            const rect = item.getBoundingClientRect();
            const itemCenterY = rect.top + rect.height / 2;
            const itemCenterX = rect.left + rect.width / 2;
            
            // Optimization: hide offscreen
            if (rect.bottom < -100 || rect.top > vh + 100) {
               inner.style.opacity = '0';
               return;
            }
            inner.style.opacity = ''; // let CSS handle it

            const distY = itemCenterY - viewportCenterY;
            const normY = distY / viewportCenterY; 
            
            const distX = itemCenterX - viewportCenterX;
            const normX = distX / viewportCenterX;

            const rotateX = normY * -40; 
            const rotateY = normX * 15; 
            const translateZ = (Math.abs(normY) * 1.5 + Math.abs(normX) * 0.5) * -200;
            
            inner.style.transform = `translate3d(0, 0, ${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
          });
          
          requestAnimationFrame(renderWarp);
        }
        renderWarp();
      }
      initWarpGallery();

      /* ==========================================================================
         3D EXHIBITION GALLERY ENGINE (Work Section Component)
         4 Cards Bounded Walk & Brand Logos Directly on CanvasMesh
         ========================================================================== */
      (function initWorkExhibition() {
        const container = document.getElementById('workGalleryCanvas');
        if (!container || typeof THREE === 'undefined') return;

        // Base64 Embedded Client Logos (Zero CORS / Zero Network Latency)
        const LOGO_DATA = {
  dell: "data:image/png;base64,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",
  mirra: "data:image/jpeg;base64,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",
  ust: "data:image/jpeg;base64,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"
};

        const WORK_PROJECTS = [
          {
            title: 'Dell Sales Application - PO Assistant',
            timeline: 'Enterprise SaaS · 2022 - 2024',
            badge: 'Dell Technologies',
            logoKey: 'dell',
            logo: LOGO_DATA.dell,
            desc: "PO Assistant and Order Details redesign across Dell's supply chain, automating 3-way reconciliation and reducing turnaround time by 63%.",
            url: 'POA.html',
            image: 'assets/work/case1-dsa.png'
          },
          {
            title: 'DSA Dark Mode',
            timeline: 'Design System · 2024',
            badge: 'Color System Governance',
            logoKey: 'dell',
            logo: LOGO_DATA.dell,
            desc: 'From a failing 30% Slate palette to an evidence-backed neutral grey architecture. Built cross-functional consensus with brand leadership, resulting in 71% user preference.',
            url: 'darkmode.html',
            image: 'assets/work/case2-darkmode.png'
          },
          {
            title: 'US Healthcare Ecosystem',
            timeline: 'HealthTech · 2019–22',
            badge: 'Mirra Healthcare',
            logoKey: 'mirra',
            logo: LOGO_DATA.mirra,
            desc: '0-to-1 transformation of manual healthcare operations into automated enterprise portals, driving a 90% census efficiency improvement and architecting a HIPAA-compliant design system.',
            url: 'USHealthcare.html',
            image: 'assets/work/case3-healthcare.png'
          },
          {
            title: 'Aakar Capability Framework',
            timeline: 'Design Ops · 2024',
            badge: 'UST Global',
            logoKey: 'ust',
            logo: LOGO_DATA.ust,
            desc: '14-month design competency framework designed for 23 designers, standardizing hiring rubrics, leveling, and promotion calibration, which was awarded the prestigious UST Shining Star Award.',
            url: 'aakar.html',
            image: 'assets/work/case4-aakar.png'
          }
        ];

        // Preload logo images for immediate synchronous canvas painting
        const logoImages = {};
        for (const [k, uri] of Object.entries(LOGO_DATA)) {
          const img = new Image();
          img.src = uri;
          logoImages[k] = img;
        }

        // Preload final case study UI screens for focused canvas rendering
        const screenImages = {};
        WORK_PROJECTS.forEach((proj, idx) => {
          if (proj.image) {
            const sImg = new Image();
            sImg.src = proj.image;
            screenImages[idx] = sImg;
          }
        });

        const C = {
          wall: '#f1f2f2',
          floor: '#eaebeb',
          ceiling: '#dcdee0',
          ambient: '#ffffff',
          ambientIntensity: 0.55,   // Raised: logos always clearly readable without spotlight
          fog: '#333433',
          frame: '#1b1c1e',
          canvas: '#ffffff',
          spotlight: '#fff1dd',
          corridorWidth: 5.0,
          ceilingHeight: 3.6,
          frameSpacing: 5.0,
          canvasWidth: 1.7,
          canvasHeight: 2.2,
          cameraHeight: 1.6,
          frameHeight: 1.6,
          fixtureOffset: 1.9,
          spotIntensity: 18.0,      // Lowered: mood atmosphere, not a blinding wash
          zoomDuration: 0.85,
          zoomFovMultiplier: 1.04
        };


        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const numPosters = WORK_PROJECTS.length; // Exactly 4 cards
        const totalFrames = 4;
        
        // Bounded Walk Range: Station 0 (startCamZ) to Station 3 (startCamZ - 15.0m)
        const startCamZ = 2.2; // Perfectly positions first canvas completely in view
        const totalWalkDistance = (numPosters - 1) * C.frameSpacing; // 15.0m
        const maxCamZ = startCamZ;                     // 2.2m: Station 0 (First Card 100% visible)
        const minCamZ = startCamZ - totalWalkDistance; // -12.8m: Station 3 (Final Card)
        const corridorLength = 60.0;

        // Card side: Index 0 & 2 on LEFT (-1), Index 1 & 3 on RIGHT (+1)
        const getSide = (index) => (index % 2 === 0 ? -1 : 1);
        const getCardZ = (index) => -2.2 - index * C.frameSpacing;

        // UI Overlay elements
        const detailsCard = document.getElementById('exhibitionDetailsCard');
        const badgeEl = document.getElementById('exCardBadge');
        const timeEl = document.getElementById('exCardTimeline');
        const titleEl = document.getElementById('exCardTitle');
        const descEl = document.getElementById('exCardDesc');
        const ctaEl = document.getElementById('exCardCta');
        const pills = document.querySelectorAll('.ex-nav-pill');

        // Dynamic Text Position: Opposite to the illuminated side
        function updateActiveProject(idx) {
          const p = WORK_PROJECTS[idx];
          if (!p) return;

          // Content update with soft crossfade
          if (detailsCard) {
            detailsCard.style.opacity = '0.7';
          }
          
          setTimeout(() => {
            badgeEl.textContent = p.badge;
            timeEl.textContent = p.timeline;
            titleEl.textContent = p.title;
            descEl.textContent = p.desc;
            ctaEl.href = p.url;

            pills.forEach((btn) => {
              const bIdx = parseInt(btn.dataset.index, 10);
              btn.classList.toggle('active', bIdx === idx);
            });

            // Requirement: "When exhibition lights left side then text should come on the right side. and vice versa"
            const side = getSide(idx); // -1 = LEFT wall, +1 = RIGHT wall
            if (side === -1) {
              detailsCard.classList.remove('pos-left');
              detailsCard.classList.add('pos-right');
            } else {
              detailsCard.classList.remove('pos-right');
              detailsCard.classList.add('pos-left');
            }

            if (detailsCard) {
              if (mode !== 'walk') {
                detailsCard.classList.add('is-hidden');
              } else {
                detailsCard.classList.remove('is-hidden');
                detailsCard.style.opacity = '1';
              }
            }
          }, 80);
        }

        // Three.js Scene, Camera, Renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(C.fog);
        scene.fog = new THREE.Fog(C.fog, 6, 28);

        const w = Math.max(container.clientWidth, 1);
        const h = Math.max(container.clientHeight, 1);

        const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
        camera.position.set(0, C.cameraHeight, startCamZ);
        camera.rotation.order = 'YXZ';

        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.toneMapping = THREE.ACESFilmicToneMapping || 4;
        renderer.toneMappingExposure = 0.85;

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.inset = '0';
        renderer.domElement.style.pointerEvents = 'auto';
        container.appendChild(renderer.domElement);

        // Vignette Overlay
        const vignette = document.createElement('div');
        vignette.style.position = 'absolute';
        vignette.style.inset = '0';
        vignette.style.pointerEvents = 'none';
        vignette.style.background = 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.35) 100%)';
        container.appendChild(vignette);

        // Procedural Floor Texture
        const floorCanvas = document.createElement('canvas');
        floorCanvas.width = floorCanvas.height = 512;
        const fCtx = floorCanvas.getContext('2d');
        fCtx.fillStyle = C.floor;
        fCtx.fillRect(0, 0, 512, 512);

        for (let t = 0; t < 14; t++) {
          let px = Math.random() * 512, py = Math.random() * 512;
          fCtx.strokeStyle = 'rgba(140, 138, 134, ' + (0.04 + Math.random() * 0.05) + ')';
          fCtx.lineWidth = 0.6 + Math.random() * 1.8;
          fCtx.beginPath();
          fCtx.moveTo(px, py);
          for (let r = 0; r < 8; r++) {
            let nx = px + (Math.random() - 0.5) * 160;
            let ny = py + (Math.random() - 0.3) * 120;
            fCtx.quadraticCurveTo(px + (Math.random() - 0.5) * 60, py + (Math.random() - 0.5) * 60, nx, ny);
            px = nx; py = ny;
          }
          fCtx.stroke();
        }

        for (let t = 0; t < 10; t++) {
          let px = Math.random() * 512, py = Math.random() * 512;
          let rad = 40 + Math.random() * 120;
          let grad = fCtx.createRadialGradient(px, py, 0, px, py, rad);
          let col = Math.random() > 0.5 ? '255,255,255' : '120,118,114';
          grad.addColorStop(0, 'rgba(' + col + ',0.03)');
          grad.addColorStop(1, 'rgba(' + col + ',0)');
          fCtx.fillStyle = grad;
          fCtx.fillRect(0, 0, 512, 512);
        }

        const floorTex = new THREE.CanvasTexture(floorCanvas);
        if (THREE.SRGBColorSpace) floorTex.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding) floorTex.encoding = THREE.sRGBEncoding;
        floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
        floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        floorTex.repeat.set(C.corridorWidth / 4, corridorLength / 4);

        const floorMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(C.corridorWidth, corridorLength),
          new THREE.MeshStandardMaterial({ map: floorTex, transparent: true, opacity: 0.9 })
        );
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.z = -totalWalkDistance / 2;
        floorMesh.renderOrder = 1;
        scene.add(floorMesh);

        // Ceiling & Walls
        const ceilMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(C.corridorWidth, corridorLength),
          new THREE.MeshStandardMaterial({ color: C.ceiling })
        );
        ceilMesh.rotation.x = Math.PI / 2;
        ceilMesh.position.set(0, C.ceilingHeight, -totalWalkDistance / 2);
        scene.add(ceilMesh);

        const wallGeo = new THREE.PlaneGeometry(corridorLength, C.ceilingHeight);
        const wallMat = new THREE.MeshStandardMaterial({ color: C.wall });
        [-1, 1].forEach((side) => {
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.set((side * C.corridorWidth) / 2, C.ceilingHeight / 2, -totalWalkDistance / 2);
          wall.rotation.y = (-side * Math.PI) / 2;
          scene.add(wall);
        });

        const ambientLight = new THREE.AmbientLight(C.ambient, C.ambientIntensity);
        scene.add(ambientLight);

        // Ceiling Fixtures & Spotlights Materials
        const fixCanvas = document.createElement('canvas');
        fixCanvas.width = fixCanvas.height = 128;
        const fixCtx = fixCanvas.getContext('2d');
        const fixGrad = fixCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        fixGrad.addColorStop(0, 'rgba(255,246,230,1)');
        fixGrad.addColorStop(0.4, 'rgba(255,246,230,1)');
        fixGrad.addColorStop(0.5, 'rgba(40,40,40,0.3)');
        fixGrad.addColorStop(0.75, 'rgba(40,40,40,0.1)');
        fixGrad.addColorStop(1, 'rgba(40,40,40,0)');
        fixCtx.fillStyle = fixGrad;
        fixCtx.fillRect(0, 0, 128, 128);

        const fixTex = new THREE.CanvasTexture(fixCanvas);
        if (THREE.SRGBColorSpace) fixTex.colorSpace = THREE.SRGBColorSpace;
        const fixGeo = new THREE.PlaneGeometry(0.26, 0.26);
        const baseFixMat = new THREE.MeshBasicMaterial({ map: fixTex, transparent: true, depthWrite: false });

        // Drop Shadows & Frame Geometry
        const shCanvas = document.createElement('canvas');
        shCanvas.width = shCanvas.height = 256;
        const shCtx = shCanvas.getContext('2d');
        const shGrad = shCtx.createRadialGradient(128, 128, 40, 128, 128, 128);
        shGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
        shGrad.addColorStop(1, 'rgba(0,0,0,0)');
        shCtx.fillStyle = shGrad;
        shCtx.fillRect(0, 0, 256, 256);

        const shadowTex = new THREE.CanvasTexture(shCanvas);
        if (THREE.SRGBColorSpace) shadowTex.colorSpace = THREE.SRGBColorSpace;
        const shadowGeo = new THREE.PlaneGeometry(2.25, 2.75);
        const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });

        const frameGeo = new THREE.BoxGeometry(1.84, 2.34, 0.07);
        const frameMat = new THREE.MeshStandardMaterial({ color: C.frame, side: THREE.DoubleSide });

        // Helper: Wrap text cleanly in Canvas 2D
        function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
          const words = text.split(' ');
          let line = '';
          let linesDrawn = 0;
          let curY = y;

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              linesDrawn++;
              if (linesDrawn >= maxLines && n < words.length - 1) {
                ctx.fillText(line.trim() + '...', x, curY);
                return curY;
              }
              ctx.fillText(line.trim(), x, curY);
              line = words[n] + ' ';
              curY += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line.trim(), x, curY);
          return curY;
        }

        // Texture Generator: Dynamic Artwork Texture (Ultra-Sharp 2048x2650 canvas, pixel-exact reference match)
        function createCardTexture(project, cardIndex = 0) {
          const c = document.createElement('canvas');
          c.width = 2048;
          c.height = 2650;
          const ctx = c.getContext('2d');

          let currentFocus = 0.0; // 0.0 = walk logo, 1.0 = focused info card

          // Word-wrap helper
          const wrapText = (text, x, y, maxW, lineH, maxLines) => {
            const words = text.split(' ');
            let line = '';
            let linesDrawn = 0;
            let curY = y;
            for (let i = 0; i < words.length; i++) {
              const test = line ? line + ' ' + words[i] : words[i];
              if (ctx.measureText(test).width > maxW && line) {
                if (linesDrawn >= maxLines) break;
                ctx.fillText(line, x, curY);
                line = words[i];
                curY += lineH;
                linesDrawn++;
              } else {
                line = test;
              }
            }
            if (line && linesDrawn < maxLines) ctx.fillText(line, x, curY);
            return curY + lineH;
          };

          const draw = () => {
            ctx.clearRect(0, 0, 2048, 2650);

            // ── WALK STATE: pure white canvas with centred client logo ──
            const walkAlpha = Math.max(0, 1.0 - currentFocus * 1.4);
            if (walkAlpha > 0.005) {
              ctx.save();
              ctx.globalAlpha = walkAlpha;
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, 2048, 2650);

              // Hairline border
              ctx.strokeStyle = 'rgba(0,0,0,0.05)';
              ctx.lineWidth = 4;
              ctx.strokeRect(40, 40, 1968, 2570);

              const lImg = logoImages[project.logoKey];
              if (lImg && lImg.complete && lImg.naturalWidth) {
                const maxW = 1400, maxH = 1100;
                const s = Math.min(maxW / lImg.naturalWidth, maxH / lImg.naturalHeight);
                const dw = lImg.naturalWidth * s, dh = lImg.naturalHeight * s;
                ctx.drawImage(lImg, (2048 - dw) / 2, (2650 - dh) / 2, dw, dh);
              }
              ctx.restore();
            }

            // ── FOCUSED STATE: dark card, exact reference match ──
            const focusAlpha = Math.min(1.0, currentFocus * 1.4);
            if (focusAlpha > 0.005) {
              ctx.save();
              ctx.globalAlpha = focusAlpha;

              // ── Background ──
              ctx.fillStyle = '#161616';
              ctx.fillRect(0, 0, 2048, 2650);

              const padX = 160;
              const maxW = 2048 - padX * 2;

              // ── Vertical centre anchor — card content block sits in the middle ──
              const blockTop = 560;

              // ── ROW 1: Badge pill (left) + Timeline (right) ──
              const badgeH = 96;
              const badgeR = 48;

              ctx.font = '500 52px "Inter Tight", -apple-system, sans-serif';
              const badgeText = project.badge;
              const badgeTextW = ctx.measureText(badgeText).width;
              const badgeW = badgeTextW + 80;

              // Dark pill — slightly lighter than background, white text (matches reference)
              ctx.fillStyle = '#2c2c2c';
              ctx.beginPath();
              if (ctx.roundRect) ctx.roundRect(padX, blockTop, badgeW, badgeH, badgeR);
              else ctx.rect(padX, blockTop, badgeW, badgeH);
              ctx.fill();
              // Subtle border
              ctx.strokeStyle = 'rgba(255,255,255,0.12)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              if (ctx.roundRect) ctx.roundRect(padX, blockTop, badgeW, badgeH, badgeR);
              else ctx.rect(padX, blockTop, badgeW, badgeH);
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.font = '500 52px "Inter Tight", -apple-system, sans-serif';
              ctx.textBaseline = 'middle';
              ctx.fillText(badgeText, padX + 40, blockTop + badgeH / 2);

              // Timeline — right aligned, Fragment Mono, muted gray
              ctx.font = '400 46px "Fragment Mono", monospace';
              ctx.fillStyle = '#888888';
              ctx.textBaseline = 'middle';
              const timeText = project.timeline;
              const timeW = ctx.measureText(timeText).width;
              ctx.fillText(timeText, 2048 - padX - timeW, blockTop + badgeH / 2);

              // ── TITLE ──
              const titleY = blockTop + badgeH + 130;
              ctx.textBaseline = 'alphabetic';
              ctx.font = '700 118px "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
              ctx.fillStyle = '#ffffff';
              const afterTitleY = wrapText(project.title, padX, titleY, maxW, 148, 3);

              // ── DESCRIPTION ──
              const descY = afterTitleY + 70;
              ctx.font = '400 58px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
              ctx.fillStyle = '#999999';
              const afterDescY = wrapText(project.desc, padX, descY, maxW, 84, 4);

              // ── CTA PILL ──
              const ctaGap = 180;
              const ctaY = afterDescY + ctaGap;
              const ctaH = 136;
              const ctaW = 780;

              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              if (ctx.roundRect) ctx.roundRect(padX, ctaY, ctaW, ctaH, 68);
              else ctx.rect(padX, ctaY, ctaW, ctaH);
              ctx.fill();

              ctx.font = '600 52px "Inter Tight", -apple-system, sans-serif';
              ctx.fillStyle = '#161616';
              ctx.textBaseline = 'middle';
              ctx.fillText('Explore Case Study  →', padX + 70, ctaY + ctaH / 2);

              ctx.restore();
            }

          };

          draw();

          const tex = new THREE.CanvasTexture(c);
          if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
          else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;

          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;

          tex.setFocusProgress = (progress) => {
            currentFocus = Math.max(0, Math.min(1.0, progress));
            draw();
            tex.needsUpdate = true;
          };

          const lImg = logoImages[project.logoKey];
          if (lImg) {
            if (lImg.complete) {
              draw();
              tex.needsUpdate = true;
            } else {
              lImg.addEventListener('load', () => {
                draw();
                tex.needsUpdate = true;
              });
            }
          }

          const sImg = screenImages[cardIndex];
          if (sImg) {
            if (sImg.complete) {
              draw();
              tex.needsUpdate = true;
            } else {
              sImg.addEventListener('load', () => {
                draw();
                tex.needsUpdate = true;
              });
            }
          }

          return tex;
        }

        // Create Exactly 4 Artworks, Spotlights, and Fixtures (NO slateMesh)
        const artworks = [];
        const fixtures = [];
        const spotlights = [];

        for (let e = 0; e < totalFrames; e++) {
          const zPos = getCardZ(e);
          const side = getSide(e);
          const xPos = (side * C.corridorWidth) / 2;
          const rotY = (-side * Math.PI) / 2;
          const project = WORK_PROJECTS[e];

          // Wall drop shadow
          const shadow = new THREE.Mesh(shadowGeo, shadowMat);
          shadow.position.set(xPos - side * 0.02, C.frameHeight - 0.07, zPos);
          shadow.rotation.y = rotY;
          shadow.renderOrder = 2;
          scene.add(shadow);

          // Ceiling fixture disc
          const fixtureMatInstance = baseFixMat.clone();
          const fixMesh = new THREE.Mesh(fixGeo, fixtureMatInstance);
          fixMesh.rotation.x = Math.PI / 2;
          fixMesh.position.set(side * C.fixtureOffset, C.ceilingHeight - 0.01, zPos);
          scene.add(fixMesh);
          fixtures.push({ mat: fixtureMatInstance, z: zPos });

          // Dedicated spotlight for this card (exact match to reference)
          const spot = new THREE.SpotLight(C.spotlight, C.spotIntensity, 10, 0.45, 0.8, 1.4);
          spot.position.set(side * C.fixtureOffset, C.ceilingHeight - 0.2, zPos);
          spot.target.position.set((C.corridorWidth / 2) * side, 1.8, zPos);
          scene.add(spot);
          scene.add(spot.target);
          spotlights.push(spot);

          // Outer picture frame
          const frameMesh = new THREE.Mesh(frameGeo, frameMat);
          frameMesh.position.set(xPos - side * 0.05, C.frameHeight, zPos);
          frameMesh.rotation.y = rotY;
          scene.add(frameMesh);

          // Canvas mesh with logo-branded editorial card texture (matching reference)
          const canvasGeo = new THREE.PlaneGeometry(C.canvasWidth, C.canvasHeight, 10, 14);
          const cardTex = createCardTexture(project, e);
          const canvasMat = new THREE.MeshStandardMaterial({ 
            map: cardTex, 
            color: '#ffffff',
            roughness: 0.95,
            metalness: 0.0,
            emissive: '#ffffff',
            emissiveMap: cardTex,
            emissiveIntensity: 0.35,   // Self-illuminated: logo always legible
            side: THREE.DoubleSide 
          });


          const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
          canvasMesh.position.set(xPos - side * 0.09, C.frameHeight, zPos);
          canvasMesh.rotation.y = rotY;
          scene.add(canvasMesh);

          // Floor reflection clone (Only frameMesh and canvasMesh, NO slateMesh)
          for (const item of [frameMesh, canvasMesh]) {
            const clone = item.clone();
            clone.position.y = -item.position.y;
            clone.scale.y = -1;
            scene.add(clone);
          }

          artworks.push({
            mesh: canvasMesh,
            cardTex: cardTex,
            base: canvasGeo.attributes.position.array.slice(),
            hover: 0,
            leanX: 0,
            leanCur: 0,
            phase: e * 1.7,
            projectIndex: e,
            project: project,
            slotIndex: e
          });
        }

        // Default state: camera starts at card 0, so pre-warm its spotlight to full ON.
        // All others start at 0 — the tick loop will smoothly ramp them as user scrolls.
        spotlights.forEach((spot, idx) => {
          spot.intensity = idx === 0 ? C.spotIntensity : 0;
        });
        fixtures.forEach((f, idx) => {
          f.mat.opacity = idx === 0 ? 0.95 : 0.04;
        });
        // All canvases start at 0.35 emissive (always-readable baseline); tick loop adjusts per-frame
        artworks.forEach((art) => {
          if (art.mesh && art.mesh.material) {
            art.mesh.material.emissiveIntensity = 0.35;
          }
        });



        // Pointer / Raycaster interaction
        const mouse = new THREE.Vector2(-2, -2);
        const raycaster = new THREE.Raycaster();
        let hoveredArt = null;
        let mode = 'walk'; // 'walk' | 'to' | 'in' | 'back'
        let zoomProgress = 0;
        let targetZ = startCamZ;
        let zoomZ = startCamZ;

        const startPos = new THREE.Vector3();
        const startQuat = new THREE.Quaternion();
        const targetPos = new THREE.Vector3();
        const targetQuat = new THREE.Quaternion();
        let activeFocusedArt = null;
        let currentHit = null;

        const zoomTo = (art) => {
          activeFocusedArt = art;
          mode = 'to';
          if (detailsCard) {
            detailsCard.classList.add('is-hidden');
          }
          const normal = new THREE.Vector3(0, 0, 1).applyEuler(art.mesh.rotation);
          const dist = (C.canvasHeight / 2) / Math.tan((camera.fov / 2) * Math.PI / 180) * C.zoomFovMultiplier;
          targetPos.copy(art.mesh.position).addScaledVector(normal, dist);
          targetQuat.setFromRotationMatrix(new THREE.Matrix4().lookAt(targetPos, art.mesh.position, new THREE.Vector3(0, 1, 0)));
          startPos.copy(camera.position);
          startQuat.copy(camera.quaternion);
          zoomZ = targetZ;
          zoomProgress = 0;
          updateActiveProject(art.projectIndex);
        };

        const zoomBack = () => {
          startPos.copy(camera.position);
          startQuat.copy(camera.quaternion);
          targetPos.set(0, C.cameraHeight, targetZ);
          targetQuat.set(0, 0, 0, 1);
          zoomProgress = 0;
          mode = 'back';
          if (detailsCard) {
            detailsCard.classList.remove('is-hidden');
            detailsCard.style.opacity = '1';
          }
        };

        // Stage reference for isolated cursor scroll control
        const stage = document.getElementById('workExhibitionStage') || container;

        let targetProgress = 0.0; // 0.0 (Card 0) to 1.0 (Card 3)
        let currentProgress = 0.0;
        const scrollSens = 0.00062; // Precision-tuned kinetic scroll ratio

        // When user's cursor is on the section, strictly operate ONLY the exhibition section
        stage.addEventListener('wheel', (e) => {
          // Strictly isolate scroll: website will NOT scroll while cursor is on this section
          e.preventDefault();
          e.stopPropagation();

          // Auto-exit zoomed state if user scrolls
          if (mode === 'in' || mode === 'to') {
            zoomBack();
          }

          let delta = e.deltaY;
          if (e.deltaMode === 1) delta *= 30; // Firefox line mode
          else if (e.deltaMode === 2) delta *= 300; // Page mode

          // Support horizontal trackpad scrub as well
          if (Math.abs(e.deltaX) > Math.abs(delta) && Math.abs(e.deltaX) > 6) {
            delta = e.deltaX;
          }

          // Smoothly increment targetProgress bounded strictly between [0, 1]
          targetProgress = Math.max(0, Math.min(1.0, targetProgress + delta * scrollSens));
        }, { passive: false });

        // Touch swipe support on exhibition stage
        let touchStartY = 0, touchStartX = 0;
        stage.addEventListener('touchstart', (e) => {
          if (e.touches.length === 1) {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
          }
        }, { passive: true });

        stage.addEventListener('touchmove', (e) => {
          if (e.touches.length === 1) {
            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            const dy = touchStartY - touchY;
            const dx = touchStartX - touchX;
            touchStartY = touchY;
            touchStartX = touchX;

            e.preventDefault();
            if (mode === 'in' || mode === 'to') {
              zoomBack();
            }

            const touchDelta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
            targetProgress = Math.max(0, Math.min(1.0, targetProgress + touchDelta * 0.0016));
          }
        }, { passive: false });

        const updateMouse = (evt) => {
          const rect = container.getBoundingClientRect();
          mouse.set(
            ((evt.clientX - rect.left) / rect.width) * 2 - 1,
            -((evt.clientY - rect.top) / rect.height) * 2 + 1
          );
        };

        let pointerDownX = 0, pointerDownY = 0, pointerDownTime = 0;
        let isDrag = false, dragStartProgress = 0;

        // Find nearest canvas to camera Z (used as fallback if raycast misses)
        const getNearestArt = () => {
          let best = null, bestDist = Infinity;
          artworks.forEach((art) => {
            const dz = Math.abs(art.mesh.position.z - camera.position.z);
            const dx = Math.abs(art.mesh.position.x - camera.position.x);
            const d = Math.hypot(dx, dz);
            if (d < bestDist) { bestDist = d; best = art; }
          });
          return best;
        };

        stage.addEventListener('pointerdown', (e) => {
          if (e.target.closest('.exhibition-details-card a, .exhibition-hud-nav button')) return;
          updateMouse(e);
          pointerDownX = e.clientX;
          pointerDownY = e.clientY;
          pointerDownTime = performance.now();
          dragStartProgress = targetProgress;
          isDrag = false;
        });

        stage.addEventListener('pointermove', (e) => {
          updateMouse(e);
          if (e.buttons) {
            const moved = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
            if (moved > 20) {
              isDrag = true;
              if (mode === 'in' || mode === 'to') zoomBack();
              const distX = pointerDownX - e.clientX;
              const distY = pointerDownY - e.clientY;
              const dist = Math.abs(distX) > Math.abs(distY) ? distX : distY;
              targetProgress = Math.max(0, Math.min(1.0, dragStartProgress + dist * 0.0012));
            }
          }
        });

        stage.addEventListener('pointerup', (e) => {
          if (e.target.closest('.exhibition-details-card a, .exhibition-hud-nav button')) return;

          const moved = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
          const elapsed = performance.now() - pointerDownTime;
          const isClick = !isDrag && moved < 20 && elapsed < 500;

          isDrag = false;

          if (!isClick) return;

          if (mode === 'in') {
            zoomBack();
            return;
          }

          if (mode !== 'walk') return;

          // Fresh raycast at exact click position
          updateMouse(e);
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObjects(artworks.map((a) => a.mesh), false);

          if (hits.length > 0) {
            // Direct hit on a canvas mesh
            const clickedArt = artworks.find((a) => a.mesh === hits[0].object);
            if (clickedArt) { zoomTo(clickedArt); return; }
          }

          // Fallback: zoom to nearest canvas (catches clicks slightly outside mesh)
          const nearest = getNearestArt();
          if (nearest) zoomTo(nearest);
        });

        stage.addEventListener('pointerleave', () => {
          mouse.set(-2, -2);
          isDrag = false;
        });

        // Direct Navigation Pills
        pills.forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetIndex = parseInt(btn.dataset.index, 10);
            if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= numPosters) return;

            targetProgress = targetIndex / (numPosters - 1);
            const targetArt = artworks[targetIndex];
            if (targetArt) {
              zoomTo(targetArt);
            }
          });
        });

        // 120fps Animation Loop
        const clock = new THREE.Clock();
        let animId = 0;
        let isRunning = false;
        let lastReportedIndex = -1;

        const tick = () => {
          animId = requestAnimationFrame(tick);

          const delta = Math.min(clock.getDelta(), 0.05);
          const elapsed = clock.elapsedTime;

          // Smooth exponential progress lerping (silky 120fps glide)
          const ease = prefersReducedMotion ? 1 : 1 - Math.exp(-delta * 8.5);
          currentProgress += (targetProgress - currentProgress) * ease;

          // Convert progress to camera targetZ (starting at startCamZ)
          targetZ = startCamZ - currentProgress * totalWalkDistance;
          targetZ = Math.max(minCamZ, Math.min(maxCamZ, targetZ));

          // Camera smoothing in walk mode
          if (mode === 'walk') {
            camera.position.z += (targetZ - camera.position.z) * ease;
          }

          // Zoom In / Out Cubic Ease Interpolation
          if (mode === 'to' || mode === 'back') {
            zoomProgress = Math.min(1, zoomProgress + delta / C.zoomDuration);
            const cubicEase = 1 - Math.pow(1 - zoomProgress, 3);
            camera.position.lerpVectors(startPos, targetPos, cubicEase);
            camera.quaternion.slerpQuaternions(startQuat, targetQuat, cubicEase);

            // Animate focus crossfade on the active artwork
            if (activeFocusedArt && activeFocusedArt.cardTex && activeFocusedArt.cardTex.setFocusProgress) {
              const p = mode === 'to' ? cubicEase : (1 - cubicEase);
              activeFocusedArt.cardTex.setFocusProgress(p);
            }

            if (zoomProgress === 1) {
              if (mode === 'back') {
                camera.rotation.set(0, 0, 0);
                mode = 'walk';
                if (detailsCard) {
                  detailsCard.classList.remove('is-hidden');
                  detailsCard.style.opacity = '1';
                }
                if (activeFocusedArt && activeFocusedArt.cardTex && activeFocusedArt.cardTex.setFocusProgress) {
                  activeFocusedArt.cardTex.setFocusProgress(0);
                }
                activeFocusedArt = null;
              } else {
                mode = 'in';
                if (detailsCard) {
                  detailsCard.classList.add('is-hidden');
                }
                if (activeFocusedArt && activeFocusedArt.cardTex && activeFocusedArt.cardTex.setFocusProgress) {
                  activeFocusedArt.cardTex.setFocusProgress(1);
                }
              }
            }
          }

          // Active station detection (0, 1, 2, 3)
          if (mode === 'walk') {
            const activeIdx = Math.max(0, Math.min(numPosters - 1, Math.round(currentProgress * (numPosters - 1))));
            if (activeIdx !== lastReportedIndex) {
              lastReportedIndex = activeIdx;
              updateActiveProject(activeIdx);
            }
          }

          // Dynamic Spotlights & Illumination: Turn ON only for the active canvas as user moves
          if (mode === 'in' || mode === 'to') {
            const easeP = mode === 'in' ? 1.0 : (1 - Math.pow(1 - zoomProgress, 3));
            ambientLight.intensity = C.ambientIntensity + (0.75 - C.ambientIntensity) * easeP;

            spotlights.forEach((spot, idx) => {
              const isTarget = activeFocusedArt && activeFocusedArt.projectIndex === idx;
              // Soften spotlight from 60 down to 14 in focus mode to completely eliminate hot spot glare
              spot.intensity = isTarget ? (C.spotIntensity - (C.spotIntensity - 14.0) * easeP) : 0;
            });
            fixtures.forEach((f, idx) => {
              const isTarget = activeFocusedArt && activeFocusedArt.projectIndex === idx;
              f.mat.opacity = isTarget ? 0.95 : 0.04;
            });
            artworks.forEach((art, idx) => {
              const isTarget = activeFocusedArt && activeFocusedArt.projectIndex === idx;
              if (art.mesh && art.mesh.material) {
                // In focus mode, canvas emissive provides crisp, glare-free self-illumination for text readability
                art.mesh.material.emissiveIntensity = isTarget ? (0.12 + 0.18 * easeP) : 0.0;
              }
            });
          } else if (mode === 'back') {
            const easeP = Math.pow(1 - zoomProgress, 3);
            ambientLight.intensity = C.ambientIntensity + (0.75 - C.ambientIntensity) * easeP;

            spotlights.forEach((spot, idx) => {
              const isTarget = activeFocusedArt && activeFocusedArt.projectIndex === idx;
              spot.intensity = isTarget ? (C.spotIntensity - (C.spotIntensity - 14.0) * easeP) : 0;
            });
            fixtures.forEach((f, idx) => {
              const isTarget = activeFocusedArt && activeFocusedArt.projectIndex === idx;
              f.mat.opacity = isTarget ? Math.max(0.04, 0.95 * easeP) : 0.04;
            });
            artworks.forEach((art, idx) => {
              const isTarget = activeFocusedArt && activeFocusedArt.projectIndex === idx;
              if (art.mesh && art.mesh.material) {
                // Floor at 0.35 always-on, rises to 0.55 when in focus
                art.mesh.material.emissiveIntensity = isTarget ? (0.35 + 0.20 * easeP) : 0.35;
              }
            });
          } else {
            ambientLight.intensity = C.ambientIntensity;

            // Walk Mode: The camera travels 4.4m ahead of each side-wall canvas (geometry offset).
            // Subtracting 4.4 brings the focus point exactly onto each canvas as you scroll.
            const focusZ = camera.position.z - 4.4;
            spotlights.forEach((spot, idx) => {
              const cardZ = getCardZ(idx);
              const dist = Math.abs(cardZ - focusZ);
              // Radius 4.0m — generous zone so lights feel snappy, not late
              const t = Math.max(0, Math.min(1, 1 - dist / 4.0));
              const smooth = t * t * (3 - 2 * t); // Smooth cubic ease
              spot.intensity = C.spotIntensity * smooth;

              if (fixtures[idx]) {
                fixtures[idx].mat.opacity = Math.max(0.04, smooth * 0.95);
              }

              // Canvas stays at 0.35 baseline; bonus glow on active canvas
              if (artworks[idx] && artworks[idx].mesh && artworks[idx].mesh.material) {
                artworks[idx].mesh.material.emissiveIntensity = 0.35 + 0.10 * smooth;
              }
            });
          }



          // Raycast detection
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(artworks.map((item) => item.mesh), false);
          const hit = intersects[0];
          currentHit = hit;
          hoveredArt = hit && hit.distance < 14 ? artworks.find((item) => item.mesh === hit.object) || null : null;

          if (hoveredArt && hit?.uv) {
            hoveredArt.leanX = (hit.uv.x - 0.5) * 0.9;
          }

          stage.style.cursor = mode === 'in' 
            ? (currentHit && currentHit.uv && currentHit.uv.y < 0.28 ? 'pointer' : 'zoom-out') 
            : (hoveredArt ? 'pointer' : (isDrag ? 'grabbing' : 'grab'));

          // Vertex wave and lean physics
          for (const art of artworks) {
            if (Math.abs(art.mesh.position.z - camera.position.z) > 18) continue;

            const isTarget = hoveredArt === art;
            if (!isTarget) art.leanX = 0;

            art.hover += ((isTarget ? 1 : 0) - art.hover) * Math.min(1, delta * 6);
            art.leanCur += (art.leanX - art.leanCur) * Math.min(1, delta * 5);

            const pos = art.mesh.geometry.attributes.position;
            const flutterAmp = prefersReducedMotion ? 0 : 0.012 + art.hover * 0.055;

            if (!(flutterAmp === 0 && Math.abs(art.leanCur) < 0.001)) {
              for (let t = 0; t < pos.count; t++) {
                const ox = art.base[t * 3];
                const oy = art.base[t * 3 + 1];
                const s = (C.canvasHeight / 2 - oy) / C.canvasHeight;
                const c = s * s;
                const wave =
                  (Math.sin(ox * 4.5 + elapsed * 2.1 + art.phase) + 1) * 0.35 +
                  (Math.sin(oy * 6.0 + elapsed * 1.6 + art.phase * 2) + 1) * 0.15;

                pos.setX(t, ox + art.leanCur * 0.35 * c);
                pos.setZ(t, c * (flutterAmp * wave + Math.abs(art.leanCur) * 0.15));
              }
              pos.needsUpdate = true;
              art.mesh.geometry.computeVertexNormals();
            }
          }

          renderer.render(scene, camera);
        };

        const start = () => {
          if (!isRunning) {
            isRunning = true;
            clock.getDelta();
            tick();
          }
        };

        const stop = () => {
          isRunning = false;
          cancelAnimationFrame(animId);
        };

        const obs = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.01 });
        obs.observe(container);

        const rObs = new ResizeObserver(() => {
          const cw = container.clientWidth;
          const ch = container.clientHeight;
          if (!cw || !ch) return;
          renderer.setSize(cw, ch);
          camera.aspect = cw / ch;
          camera.updateProjectionMatrix();
        });
        rObs.observe(container);

        // Initialize initial project display on load
        updateActiveProject(0);
      })();



      


      

      

      

      

  