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
