#version 300 es
// Vertex Shader
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_shadowcoord;

out vec2 v_shadowcoord;
uniform vec2 u_resolution;

void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_shadowcoord = a_shadowcoord;
}

---SPLIT_SHADER_BOUNDS---
#version 300 es
// Fragment Shader
precision mediump float;

in vec2 v_shadowcoord;
out vec4 fragColor;

uniform vec4 u_shadow_color;
uniform float u_blur_radius;

// Approximation of Gaussian blur kernel for smooth shadows
void main() {
    float distance = length(v_shadowcoord - vec2(0.5));
    float shadowIntensity = smoothstep(0.5, 0.5 - (u_blur_radius / 100.0), distance);
    fragColor = vec4(u_shadow_color.rgb, u_shadow_color.a * shadowIntensity);
}
