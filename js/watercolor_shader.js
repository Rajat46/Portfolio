(function() {
      var canvas = document.getElementById('watercolorCanvas');
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
        uniform vec2 u_res;
        uniform float u_time;
        uniform float u_density;
        uniform float u_contrast;

        float hash(vec2 p) { 
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); 
        }
        
        mat2 rot(float a) { 
            return mat2(cos(a), -sin(a), sin(a), cos(a)); 
        }

        float fbm(vec2 p) {
            float v = 0.0; 
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
                v += a * sin(p.x * 1.5 + u_time * 0.2);
                p *= rot(0.5); 
                p *= 2.0; 
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 p = (gl_FragCoord.xy - 0.5 * u_res.xy) / min(u_res.y, u_res.x);
            
            p *= u_density;
            
            vec2 q = vec2(fbm(p + u_time * 0.1), fbm(p + vec2(1.0)));
            float strength = fbm(p + 4.0 * q);

            // Using the dark mode colors from USHealthcare
            vec3 paper = vec3(0.84, 0.82, 0.79);
            vec3 blueInk = vec3(0.0, 0.2, 0.6);
            vec3 purpleHighlight = vec3(0.4, 0.0, 0.8);

            vec3 col = mix(paper, blueInk, strength * u_contrast);
            col = mix(col, purpleHighlight, pow(strength, 4.0) * u_contrast);

            gl_FragColor = vec4(col, 1.0);
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
        res: gl.getUniformLocation(program, 'u_res'),
        time: gl.getUniformLocation(program, 'u_time'),
        density: gl.getUniformLocation(program, 'u_density'),
        contrast: gl.getUniformLocation(program, 'u_contrast')
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
        gl.uniform1f(uniforms.density, 1.2);
        gl.uniform1f(uniforms.contrast, 1.1);

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
