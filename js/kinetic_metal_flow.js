(function() {

    (function () {
      // Toggle floating capsule header when scrolling past hero
      var fixedHeader = document.getElementById('fixedCapsuleHeader');
      function onScroll() {
        if (window.scrollY > 300) {
          fixedHeader.classList.add('scrolled');
        } else {
          fixedHeader.classList.remove('scrolled');
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      // Lightbox functionality
      var box = document.getElementById('lightbox');
      var big = document.getElementById('lightbox-img');
      var closeBtn = document.getElementById('lightbox-close');

      function open(img) {
        big.src = img.src;
        big.alt = img.alt;
        box.classList.add('open');
        box.setAttribute('aria-hidden', 'false');
        box.scrollTop = 0;
      }

      function close() {
        box.classList.remove('open');
        box.setAttribute('aria-hidden', 'true');
      }

      document.querySelectorAll('.showcase-stream img').forEach(function (img) {
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.addEventListener('click', function () { open(img); });
        img.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open(img);
          }
        });
      });

      if (closeBtn) closeBtn.addEventListener('click', close);
      box.addEventListener('click', function (e) {
        if (e.target !== big) close();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
      });
    })();

    // ==========================================================================
    // KINETIC METAL FLOW — WebGL Molten Chrome Shader Engine
    // (Exact Framer Marketplace Shader: https://www.framer.com/marketplace/components/kinetic-metal-flow/)
    // ==========================================================================
    (function initKineticMetalFlow() {
      var canvas = document.getElementById('kineticMetalCanvas');
      if (!canvas) return;

      var gl = canvas.getContext('webgl', { alpha: true, antialias: false, preserveDrawingBuffer: false }) ||
               canvas.getContext('experimental-webgl', { alpha: true, antialias: false, preserveDrawingBuffer: false });
      if (!gl) {
        console.warn('WebGL not supported for Kinetic Metal Flow background.');
        return;
      }

      function createShader(type, source) {
        var shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader compile error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      }

      var vsSource = [
        'attribute vec2 position;',
        'void main() {',
        '    gl_Position = vec4(position, 0.0, 1.0);',
        '}'
      ].join('\n');

      var fsSource = [
        'precision highp float;',
        'uniform vec2 u_res;',
        'uniform float u_time;',
        'uniform float u_colorScale;',
        'uniform float u_frequency;',
        'uniform vec3 u_baseColor;',
        '',
        'vec2 distort(vec2 p, float offset) {',
        '    p += offset;',
        '    for (float i = 1.0; i < 4.0; i++) {',
        '        p.x += 0.3 / i * sin(i * 3.0 * p.y + u_time);',
        '        p.y += 0.3 / i * cos(i * 3.0 * p.x + u_time);',
        '    }',
        '    return p;',
        '}',
        '',
        'void main() {',
        '    vec2 uv = gl_FragCoord.xy / u_res.xy;',
        '',
        '    float r = sin(distort(uv, 0.0).x * u_frequency) * 0.5 + 0.5;',
        '    float g = sin(distort(uv, 0.02).x * u_frequency) * 0.5 + 0.5;',
        '    float b = sin(distort(uv, 0.04).x * u_frequency) * 0.5 + 0.5;',
        '',
        '    vec3 color = pow(vec3(r, g, b), vec3(u_colorScale));',
        '    vec3 finalColor = mix(u_baseColor, color, 0.82);',
        '',
        '    gl_FragColor = vec4(finalColor, 1.0);',
        '}'
      ].join('\n');

      var vs = createShader(gl.VERTEX_SHADER, vsSource);
      var fs = createShader(gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return;

      var program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);

      // Fullscreen quad (2 triangles)
      var vertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
      ]);

      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      var posAttrib = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

      var uniforms = {
        res: gl.getUniformLocation(program, 'u_res'),
        time: gl.getUniformLocation(program, 'u_time'),
        colorScale: gl.getUniformLocation(program, 'u_colorScale'),
        frequency: gl.getUniformLocation(program, 'u_frequency'),
        baseColor: gl.getUniformLocation(program, 'u_baseColor')
      };

      // Configuration matching Kinetic Metal Flow defaults
      var config = {
        speed: 0.5,           // Flow speed (0.01 - 2.0)
        frequency: 4.8,       // Wave density (1.0 - 20.0)
        colorScale: 7.5,      // Contrast power (highlights balance)
        baseColor: [0.0196, 0.0196, 0.022] // Deep obsidian liquid metal
      };

      var timeValue = 0;
      var animFrameId = null;
      var isVisible = true;

      function resize() {
        if (!canvas || !gl || !uniforms.res) return;
        var rect = canvas.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var width = Math.floor(rect.width * dpr);
        var height = Math.floor(rect.height * dpr);

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
          gl.uniform2f(uniforms.res, width, height);
        }
      }

      function frame() {
        if (!gl || !program || !isVisible) return;
        timeValue += config.speed * 0.015;

        gl.uniform1f(uniforms.time, timeValue);
        gl.uniform1f(uniforms.colorScale, config.colorScale);
        gl.uniform1f(uniforms.frequency, config.frequency);
        gl.uniform3f(uniforms.baseColor, config.baseColor[0], config.baseColor[1], config.baseColor[2]);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animFrameId = requestAnimationFrame(frame);
      }

      window.addEventListener('resize', resize, { passive: true });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          isVisible = false;
          if (animFrameId) cancelAnimationFrame(animFrameId);
        } else {
          isVisible = true;
          animFrameId = requestAnimationFrame(frame);
        }
      });

      // Interactive gentle acceleration on pointer move
      var hero = document.querySelector('.hero-stage');
      if (hero) {
        hero.addEventListener('mousemove', function (e) {
          var rect = hero.getBoundingClientRect();
          var normX = (e.clientX - rect.left) / rect.width - 0.5;
          timeValue += Math.abs(normX) * 0.004;
        }, { passive: true });
      }

      resize();
      frame();
    })();
  
})();