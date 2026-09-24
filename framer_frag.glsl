#version 300 es
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
}
