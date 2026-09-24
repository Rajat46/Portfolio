(function() {
      var canvas = document.getElementById('fiberCanvas');
      if (!canvas) return;

      var gl = canvas.getContext('webgl', { alpha: true, antialias: false, preserveDrawingBuffer: false }) ||
               canvas.getContext('experimental-webgl', { alpha: true, antialias: false, preserveDrawingBuffer: false });
      if (!gl) {
        console.warn('WebGL not supported');
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

      var fsSource = `
        precision highp float;

        uniform vec2  u_resolution;
        uniform float u_time;

        uniform vec3  u_colorBg;
        uniform vec3  u_colorGlow;
        uniform vec3  u_colorCore;

        uniform float u_speed;
        uniform float u_intensity;
        uniform float u_thickness;
        uniform float u_thickSpeed;
        uniform float u_count;
        uniform float u_dir;        

        float hash11(float p) {
            p = fract(p * 0.1031);
            p *= p + 33.33;
            p *= p + p;
            return fract(p);
        }

        float noise11(float p) {
            float i = floor(p);
            float f = fract(p);
            float u = f * f * (3.0 - 2.0 * f);
            return mix(hash11(i), hash11(i + 1.0), u);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            vec2 p  = uv * 2.0 - 1.0;

            float time      = u_time * u_speed;
            float glowAcc   = 0.0;   
            float coreAcc   = 0.0;   
            float n         = u_count;

            for (float i = 0.0; i < 60.0; i++) {
                if (i >= n) break;

                float h1 = hash11(i * 12.34);
                float h2 = hash11(i * 56.78);
                float h3 = hash11(i * 90.12);

                float posX = (h1 * 2.0 - 1.0) * 0.9;
                posX = sign(posX) * pow(abs(posX), 1.3);
                float d = abs(p.x - posX);

                float spd    = mix(0.8, 3.5, h3);
                float yOff   = u_dir * time * spd + h1 * 100.0;
                float lenFac = mix(1.0, 2.5, h2);
                float vFade  = noise11(uv.y * lenFac - yOff);
                vFade        = smoothstep(0.3, 0.9, vFade);

                float pulse  = sin(u_time * u_thickSpeed + h2 * 6.2831) * 0.5 + 0.5;
                float minW   = 0.001;
                float maxW   = u_thickness * mix(0.5, 1.5, h3);
                float curW   = mix(minW, maxW, pulse);

                float core   = exp(-d * 250.0 / (curW * 80.0));
                float glow   = exp(-d *  25.0 / (curW * 50.0)) * 0.8;

                float alpha  = vFade * u_intensity;
                float weight = mix(0.4, 1.5, h1);

                coreAcc += core * alpha * weight;
                glowAcc += glow * alpha * weight;
            }

            float maskX = smoothstep(1.0, 0.15, abs(p.x));
            float maskY = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
            float mask  = maskX * maskY;
            coreAcc *= mask;
            glowAcc *= mask;

            vec3 color = u_colorBg;

            float glowAlpha = clamp(glowAcc, 0.0, 1.0);
            color = mix(color, u_colorGlow, glowAlpha * 0.85);

            float coreAlpha = clamp(coreAcc, 0.0, 1.0);
            color = mix(color, u_colorCore, coreAlpha * 0.90);

            float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453) * 0.012;
            color += grain - 0.006;

            gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
        }
      `;

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

      var vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      var posAttrib = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

      var uniforms = {
        res: gl.getUniformLocation(program, 'u_resolution'),
        time: gl.getUniformLocation(program, 'u_time'),
        colorBg: gl.getUniformLocation(program, 'u_colorBg'),
        colorGlow: gl.getUniformLocation(program, 'u_colorGlow'),
        colorCore: gl.getUniformLocation(program, 'u_colorCore'),
        speed: gl.getUniformLocation(program, 'u_speed'),
        intensity: gl.getUniformLocation(program, 'u_intensity'),
        thickness: gl.getUniformLocation(program, 'u_thickness'),
        thickSpeed: gl.getUniformLocation(program, 'u_thickSpeed'),
        count: gl.getUniformLocation(program, 'u_count'),
        dir: gl.getUniformLocation(program, 'u_dir')
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
        timeValue += 0.01;

        gl.uniform1f(uniforms.time, timeValue);
        
        // Colors
        gl.uniform3f(uniforms.colorBg, 0.0, 0.0, 0.0);
        gl.uniform3f(uniforms.colorGlow, 0.0, 153.0/255.0, 1.0); // #0099ff
        gl.uniform3f(uniforms.colorCore, 1.0, 1.0, 1.0);
        
        // Params
        gl.uniform1f(uniforms.speed, 0.6);
        gl.uniform1f(uniforms.intensity, 0.7);
        gl.uniform1f(uniforms.thickness, 0.03);
        gl.uniform1f(uniforms.thickSpeed, 0.5);
        gl.uniform1f(uniforms.count, 12.0);
        gl.uniform1f(uniforms.dir, 1.0);

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

      var hero = document.querySelector('.hero-stage');
      if (hero) {
        hero.addEventListener('mousemove', function (e) {
          var rect = hero.getBoundingClientRect();
          var normX = (e.clientX - rect.left) / rect.width - 0.5;
          timeValue += Math.abs(normX) * 0.005;
        }, { passive: true });
      }

      resize();
      frame();
})();
