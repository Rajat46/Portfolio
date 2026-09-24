/**
 * InfiniteExhibition.js
 * Exact 100% replica of the Framer "Infinite Exhibition" 3D Art Gallery corridor.
 * Built with Three.js (zero external framework dependencies).
 * 
 * Features:
 * - 4000vh seamless virtual scroll with modulo wraparound
 * - Exponential decay camera smoothing: (1 - Math.exp(-delta * 7))
 * - Interactive vertex-displacement cloth wave & mouse lean simulation
 * - Raycaster detection with smooth cubic ease-out zoom inspection & slerp orientation
 * - Spotlights tracking camera position with distance attenuation
 * - Procedural canvas terrazzo floor with real-time cloned inverted reflections
 * - Vignette overlay & atmospheric fog
 */

(function (global) {
  'use strict';

  const DEFAULT_CONFIG = {
    wall: '#f1f2f2',
    floor: '#eaebeb',
    ceiling: '#dcdee0',
    ambient: '#ffffff',
    ambientIntensity: 0.2,
    fog: '#333433',
    frame: '#1b1c1e',
    canvas: '#ffffff',
    spotlight: '#fff1dd',
    corridorWidth: 5.0,
    ceilingHeight: 3.6,
    frameSpacing: 4.5,
    canvasWidth: 1.7,
    canvasHeight: 2.2,
    cameraHeight: 1.6,
    frameHeight: 1.6,
    fixtureOffset: 1.9,
    spotIntensity: 60.0,
    virtualScrollVh: 4000,
    zoomDuration: 0.9,
    zoomFovMultiplier: 1.3
  };

  class InfiniteExhibition {
    constructor(container, options = {}) {
      if (!container) throw new Error('InfiniteExhibition requires a valid container element.');
      this.container = container;
      this.options = Object.assign({}, DEFAULT_CONFIG, options);
      this.images = options.images || [];
      this.onActiveChange = options.onActiveChange || null;

      this.init();
    }

    init() {
      const C = this.options;
      const container = this.container;

      // 1. Container setup
      container.style.position = 'relative';
      container.style.overflow = 'hidden';
      container.style.background = '#000000';
      container.style.width = '100%';
      container.style.height = '100%';

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 2. Geometry calculations
      const numPosters = this.images.length;
      let slots = numPosters === 0 ? 6 : numPosters * (numPosters % 2 !== 0 ? 2 : 1);
      if (slots < 6) slots *= Math.ceil(6 / slots);
      this.slots = slots;
      this.totalLoopDistance = slots * C.frameSpacing;
      const a = this.totalLoopDistance;
      const g = 3 * a;

      const getZ = (index) => g / 2 - C.frameSpacing / 2 - index * C.frameSpacing;
      const getSide = (index) => (index % 2 === 0 ? -1 : 1);

      // 3. Three.js Scene, Camera, Renderer
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(C.fog);
      scene.fog = new THREE.Fog(C.fog, 6, Math.min(a, 28));

      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);

      const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
      camera.position.set(0, C.cameraHeight, 0);
      camera.rotation.order = 'YXZ';

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.toneMapping = 4; // ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.02;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h);
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.inset = '0';
      renderer.domElement.style.pointerEvents = 'none';

      // 4. Virtual Scroll DOM Layer
      const scrollContainer = document.createElement('div');
      scrollContainer.className = 'infinite-exhibition-scroll';
      scrollContainer.style.position = 'absolute';
      scrollContainer.style.top = '0';
      scrollContainer.style.bottom = '0';
      scrollContainer.style.left = '0';
      scrollContainer.style.width = 'calc(100% + 24px)';
      scrollContainer.style.overflowY = 'scroll';
      scrollContainer.style.scrollbarWidth = 'none';
      scrollContainer.style.touchAction = 'pan-y';

      const scrollSpacer = document.createElement('div');
      scrollSpacer.style.width = '1px';
      scrollSpacer.style.height = `${C.virtualScrollVh}vh`;
      scrollContainer.appendChild(scrollSpacer);

      container.appendChild(renderer.domElement);
      container.appendChild(scrollContainer);

      // Vignette Overlay
      const vignette = document.createElement('div');
      vignette.style.position = 'absolute';
      vignette.style.inset = '0';
      vignette.style.pointerEvents = 'none';
      vignette.style.background = 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.35) 100%)';
      container.appendChild(vignette);

      // 5. Procedural Floor Texture
      const floorCanvas = document.createElement('canvas');
      floorCanvas.width = floorCanvas.height = 512;
      const fCtx = floorCanvas.getContext('2d');
      fCtx.fillStyle = C.floor;
      fCtx.fillRect(0, 0, 512, 512);

      for (let t = 0; t < 14; t++) {
        let px = Math.random() * 512, py = Math.random() * 512;
        fCtx.strokeStyle = `rgba(140, 138, 134, ${0.04 + Math.random() * 0.05})`;
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
        grad.addColorStop(0, `rgba(${col},0.03)`);
        grad.addColorStop(1, `rgba(${col},0)`);
        fCtx.fillStyle = grad;
        fCtx.fillRect(0, 0, 512, 512);
      }

      const floorTex = new THREE.CanvasTexture(floorCanvas);
      floorTex.colorSpace = THREE.SRGBColorSpace;
      floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      floorTex.repeat.set(C.corridorWidth / 4, g / 4);

      const floorMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(C.corridorWidth, g),
        new THREE.MeshStandardMaterial({ map: floorTex, transparent: true, opacity: 0.9 })
      );
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.renderOrder = 1;
      scene.add(floorMesh);

      // 6. Ceiling & Walls
      const ceilMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(C.corridorWidth, g),
        new THREE.MeshStandardMaterial({ color: C.ceiling })
      );
      ceilMesh.rotation.x = Math.PI / 2;
      ceilMesh.position.y = C.ceilingHeight;
      scene.add(ceilMesh);

      const wallGeo = new THREE.PlaneGeometry(g, C.ceilingHeight);
      const wallMat = new THREE.MeshStandardMaterial({ color: C.wall });
      [-1, 1].forEach((side) => {
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set((side * C.corridorWidth) / 2, C.ceilingHeight / 2, 0);
        wall.rotation.y = (-side * Math.PI) / 2;
        scene.add(wall);
      });

      scene.add(new THREE.AmbientLight(C.ambient, C.ambientIntensity));

      // 7. Ceiling Fixtures & Spotlights
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
      const fixGeo = new THREE.PlaneGeometry(0.26, 0.26);
      const baseFixMat = new THREE.MeshBasicMaterial({ map: fixTex, transparent: true, depthWrite: false });

      const fixtures = [];
      const spotlights = [];
      for (let i = 0; i < 5; i++) {
        const spot = new THREE.SpotLight(C.spotlight, C.spotIntensity, 10, 0.45, 0.8, 1.4);
        scene.add(spot);
        scene.add(spot.target);
        spotlights.push(spot);
      }

      // 8. Soft Artwork Drop Shadow & Frame Geometry
      const shCanvas = document.createElement('canvas');
      shCanvas.width = shCanvas.height = 256;
      const shCtx = shCanvas.getContext('2d');
      const shGrad = shCtx.createRadialGradient(128, 128, 40, 128, 128, 128);
      shGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
      shGrad.addColorStop(1, 'rgba(0,0,0,0)');
      shCtx.fillStyle = shGrad;
      shCtx.fillRect(0, 0, 256, 256);

      const shadowTex = new THREE.CanvasTexture(shCanvas);
      const shadowGeo = new THREE.PlaneGeometry(2.25, 2.75);
      const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });

      const frameGeo = new THREE.BoxGeometry(1.84, 2.34, 0.07);
      const frameMat = new THREE.MeshStandardMaterial({ color: C.frame, side: THREE.DoubleSide });

      // Texture loader with fallback & caching
      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin('anonymous');
      const textureCache = new Map();

      const CDN_FALLBACKS = {
        'assets/exhibition/art1.png': 'https://framerusercontent.com/images/3JPb9aJtSFCFJGnK7oIBbMUb40Q.png?width=1086&height=1448',
        'assets/exhibition/art2.png': 'https://framerusercontent.com/images/DHxdb557zOALgjNI38Voub8EtgU.png?width=1086&height=1448',
        'assets/exhibition/art3.png': 'https://framerusercontent.com/images/c1BCPceq5zRbAxxwvPN4ZGFNF8.png?width=1086&height=1448',
        'assets/exhibition/art4.png': 'https://framerusercontent.com/images/g4bxgxKrAqOopMYbTGLopt7g.png?width=1086&height=1448',
        'assets/exhibition/art5.png': 'https://framerusercontent.com/images/gBd3kYJOHQMmRP2J6yaocs911lw.png?width=1086&height=1448'
      };

      const loadTexture = (url) => {
        let tex = textureCache.get(url);
        if (!tex) {
          tex = textureLoader.load(
            url,
            undefined,
            undefined,
            () => {
              const fallback = CDN_FALLBACKS[url];
              if (fallback) {
                console.warn('InfiniteExhibition: Local image load failed, trying CDN fallback:', fallback);
                const fbTex = textureLoader.load(fallback);
                fbTex.colorSpace = THREE.SRGBColorSpace;
                tex.image = fbTex.image;
                tex.needsUpdate = true;
              }
            }
          );
          tex.colorSpace = THREE.SRGBColorSpace;
          textureCache.set(url, tex);
        }
        return tex;
      };

      const artworks = [];
      const totalFrames = 3 * slots;

      for (let e = 0; e < totalFrames; e++) {
        const zPos = getZ(e);
        const side = getSide(e);
        const xPos = (side * C.corridorWidth) / 2;
        const rotY = (-side * Math.PI) / 2;

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

        // Outer picture frame
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.set(xPos - side * 0.05, C.frameHeight, zPos);
        frameMesh.rotation.y = rotY;
        scene.add(frameMesh);

        // Canvas mesh with vertex subdivisions for cloth wave physics
        const canvasGeo = new THREE.PlaneGeometry(C.canvasWidth, C.canvasHeight, 10, 14);
        const canvasMat = new THREE.MeshStandardMaterial({ color: C.canvas, side: THREE.DoubleSide });
        if (numPosters > 0) {
          const imgUrl = this.images[e % numPosters];
          const tex = loadTexture(imgUrl);
          canvasMat.map = tex;
          canvasMat.color.set('#ffffff');
          canvasMat.emissive.set('#ffffff');
          canvasMat.emissiveIntensity = 0.12;
          canvasMat.emissiveMap = tex;
        }

        const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
        canvasMesh.position.set(xPos - side * 0.09, C.frameHeight, zPos);
        canvasMesh.rotation.y = rotY;
        scene.add(canvasMesh);

        // Floor reflection clone (scale.y = -1, position.y = -position.y)
        for (const item of [frameMesh, canvasMesh]) {
          const clone = item.clone();
          clone.position.y = -item.position.y;
          clone.scale.y = -1;
          scene.add(clone);
        }

        artworks.push({
          mesh: canvasMesh,
          base: canvasGeo.attributes.position.array.slice(),
          hover: 0,
          leanX: 0,
          leanCur: 0,
          phase: e * 1.7,
          originalIndex: e % numPosters
        });
      }

      // 9. Virtual Scroll Mechanics
      let initialCenter = (scrollContainer.scrollHeight - scrollContainer.clientHeight) / 2;
      scrollContainer.scrollTop = initialCenter;
      let lastScrollTop = initialCenter;

      const recenterScroll = () => {
        initialCenter = (scrollContainer.scrollHeight - scrollContainer.clientHeight) / 2;
        scrollContainer.scrollTop = initialCenter;
        lastScrollTop = initialCenter;
      };

      let lastScrollActivity = 0;
      const onScroll = () => {
        lastScrollActivity = performance.now();
      };
      scrollContainer.addEventListener('scroll', onScroll, { passive: true });

      // 10. Pointer / Mouse Interaction & Click to Zoom
      const mouse = new THREE.Vector2(-2, -2);
      const raycaster = new THREE.Raycaster();
      let hoveredArt = null;
      let mode = 'walk'; // 'walk' | 'to' | 'in' | 'back'
      let zoomProgress = 0;
      let targetZ = 0;
      let zoomZ = 0;

      const startPos = new THREE.Vector3();
      const startQuat = new THREE.Quaternion();
      const targetPos = new THREE.Vector3();
      const targetQuat = new THREE.Quaternion();

      const zoomTo = (art) => {
        const normal = new THREE.Vector3(0, 0, 1).applyEuler(art.mesh.rotation);
        const dist = (C.canvasHeight / 2) / Math.tan((camera.fov / 2) * Math.PI / 180) * C.zoomFovMultiplier;
        targetPos.copy(art.mesh.position).addScaledVector(normal, dist);
        targetQuat.setFromRotationMatrix(new THREE.Matrix4().lookAt(targetPos, art.mesh.position, new THREE.Vector3(0, 1, 0)));
        startPos.copy(camera.position);
        startQuat.copy(camera.quaternion);
        zoomZ = targetZ;
        zoomProgress = 0;
        mode = 'to';
      };

      const zoomBack = () => {
        startPos.copy(camera.position);
        startQuat.copy(camera.quaternion);
        targetPos.set(0, C.cameraHeight, targetZ);
        targetQuat.set(0, 0, 0, 1);
        zoomProgress = 0;
        mode = 'back';
      };

      const updateMouse = (evt) => {
        const rect = container.getBoundingClientRect();
        mouse.set(
          ((evt.clientX - rect.left) / rect.width) * 2 - 1,
          -((evt.clientY - rect.top) / rect.height) * 2 + 1
        );
      };

      let pointerDownX = 0, pointerDownY = 0, isDrag = false;
      const onPointerDown = (evt) => {
        pointerDownX = evt.clientX;
        pointerDownY = evt.clientY;
        isDrag = false;
      };

      const onPointerMove = (evt) => {
        updateMouse(evt);
        if (evt.buttons && Math.hypot(evt.clientX - pointerDownX, evt.clientY - pointerDownY) > 5) {
          isDrag = true;
        }
      };

      const onPointerUp = () => {
        if (isDrag) return;
        if (mode === 'in') {
          zoomBack();
        } else if (mode === 'walk' && hoveredArt) {
          zoomTo(hoveredArt);
        }
      };

      const onPointerLeave = () => {
        mouse.set(-2, -2);
      };

      scrollContainer.addEventListener('pointerdown', onPointerDown);
      scrollContainer.addEventListener('pointermove', onPointerMove);
      scrollContainer.addEventListener('pointerup', onPointerUp);
      scrollContainer.addEventListener('pointerleave', onPointerLeave);

      // 11. Physics & Animation Engine (120fps RAF loop)
      const clock = new THREE.Clock();
      let animId = 0;
      let isRunning = false;

      const tick = () => {
        animId = requestAnimationFrame(tick);

        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.elapsedTime;
        const now = performance.now();

        const currentScroll = scrollContainer.scrollTop;
        const scrollFactor = 0.7 * Math.max(container.clientHeight, 1);

        targetZ -= ((currentScroll - lastScrollTop) * C.frameSpacing) / Math.max(scrollFactor, 1);
        lastScrollTop = currentScroll;

        // Auto-exit zoomed state if user scrolls past threshold
        if ((mode === 'in' || mode === 'to') && Math.abs(targetZ - zoomZ) > 0.6) {
          zoomBack();
        }

        // Infinite loop wraparound modulus
        const wrap = targetZ > a / 2 ? -a : targetZ < -a / 2 ? a : 0;
        if (wrap) {
          targetZ += wrap;
          zoomZ += wrap;
          camera.position.z += wrap;
          startPos.z += wrap;
          targetPos.z += wrap;
        }

        // Recenter scroll buffer silently when idle
        if (now - lastScrollActivity > 250 && Math.abs(currentScroll - initialCenter) > scrollContainer.clientHeight * 4) {
          recenterScroll();
        }

        // Camera Walk Smoothing (Exponential smoothing filter)
        if (mode === 'walk') {
          const ease = prefersReducedMotion ? 1 : 1 - Math.exp(-delta * 7);
          camera.position.z += (targetZ - camera.position.z) * ease;
        }

        // Zoom In / Out Cubic Ease Interpolation
        if (mode === 'to' || mode === 'back') {
          zoomProgress = Math.min(1, zoomProgress + delta / C.zoomDuration);
          const ease = 1 - Math.pow(1 - zoomProgress, 3);
          camera.position.lerpVectors(startPos, targetPos, ease);
          camera.quaternion.slerpQuaternions(startQuat, targetQuat, ease);

          if (zoomProgress === 1) {
            if (mode === 'back') {
              camera.rotation.set(0, 0, 0);
              mode = 'walk';
            } else {
              mode = 'in';
            }
          }
        }

        // Spotlights tracking viewer position
        const centerIdx = Math.round((g / 2 - C.frameSpacing / 2 - camera.position.z) / C.frameSpacing);
        spotlights.forEach((spot, idx) => {
          const n = centerIdx + idx - 2;
          const r = getZ(n);
          const side = getSide(n);
          spot.position.set(side * C.fixtureOffset, C.ceilingHeight - 0.2, r);
          spot.target.position.set((C.corridorWidth / 2) * side, 1.8, r);
          const dist = Math.abs(r - camera.position.z);
          spot.intensity = C.spotIntensity * Math.max(0, Math.min(1, (C.frameSpacing - dist) / 2));
        });

        // Ceiling fixtures distance fade
        for (const f of fixtures) {
          f.mat.opacity = Math.max(0, Math.min(1, (22 - Math.abs(f.z - camera.position.z)) / 6));
        }

        // Raycasting for hover & canvas interaction
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(artworks.map((item) => item.mesh), false);
        const hit = intersects[0];
        hoveredArt = hit && hit.distance < 14 ? artworks.find((item) => item.mesh === hit.object) || null : null;

        if (hoveredArt && hit?.uv) {
          hoveredArt.leanX = (hit.uv.x - 0.5) * 0.9;
        }

        // Cursor state management
        scrollContainer.style.cursor = mode === 'in' ? 'zoom-out' : hoveredArt ? 'pointer' : 'default';

        // Vertex Wave Simulation & Lean Physics on nearby canvases
        for (const art of artworks) {
          if (Math.abs(art.mesh.position.z - camera.position.z) > 20) continue;

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

        // Notify active artwork callback if provided
        if (this.onActiveChange && numPosters > 0) {
          const nearestZ = (g / 2 - C.frameSpacing / 2 - camera.position.z) / C.frameSpacing;
          const activeIndex = (Math.round(nearestZ) % numPosters + numPosters) % numPosters;
          this.onActiveChange(activeIndex);
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

      // Visibility & Resize Observers
      const intersectionObs = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { threshold: 0.01 }
      );
      intersectionObs.observe(container);

      const resizeObs = new ResizeObserver(() => {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (!cw || !ch) return;
        renderer.setSize(cw, ch);
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
      });
      resizeObs.observe(container);

      // Teardown handle
      this.destroy = () => {
        stop();
        intersectionObs.disconnect();
        resizeObs.disconnect();
        scrollContainer.removeEventListener('scroll', onScroll);
        scrollContainer.removeEventListener('pointerdown', onPointerDown);
        scrollContainer.removeEventListener('pointermove', onPointerMove);
        scrollContainer.removeEventListener('pointerup', onPointerUp);
        scrollContainer.removeEventListener('pointerleave', onPointerLeave);

        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of mats) {
              if (m.map) m.map.dispose();
              m.dispose();
            }
          }
        });

        renderer.dispose();
        renderer.domElement.remove();
        scrollContainer.remove();
        vignette.remove();
      };
    }
  }

  global.InfiniteExhibition = InfiniteExhibition;
})(typeof window !== 'undefined' ? window : this);
