#version 300 es
// Vertex Shader
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texcoord;

out vec2 v_texcoord;
uniform vec2 u_resolution;

void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texcoord = a_texcoord;
}

---SPLIT_SHADER_BOUNDS---
#version 300 es
// Fragment Shader
precision mediump float;

in vec2 v_texcoord;
out vec4 fragColor;

uniform vec4 u_start_color;
uniform vec4 u_end_color;
uniform int u_gradient_type; // 0 for Linear, 1 for Radial

void main() {
    float factor = 0.0;
    if (u_gradient_type == 0) {
        // Linear along horizontal axis
        factor = v_texcoord.x;
    } else {
        // Radial from center
        factor = distance(v_texcoord, vec2(0.5)) * 2.0;
        factor = clamp(factor, 0.0, 1.0);
    }
    fragColor = mix(u_start_color, u_end_color, factor);
}
