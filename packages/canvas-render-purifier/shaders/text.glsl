#version 300 es
// Vertex Shader
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texcoord;
layout(location = 2) in vec4 a_color;

out vec2 v_texcoord;
out vec4 v_color;

uniform vec2 u_resolution;

void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texcoord = a_texcoord;
    v_color = a_color;
}

---SPLIT_SHADER_BOUNDS---
#version 300 es
// Fragment Shader
precision mediump float;

in vec2 v_texcoord;
in vec4 v_color;

uniform sampler2D u_sdf_texture;
uniform float u_sdf_edge; // SDF edge threshold (typically 0.5)
uniform float u_sdf_smoothing; // Smoothing/anti-aliasing width

out vec4 fragColor;

void main() {
    float distance = texture(u_sdf_texture, v_texcoord).r;
    float alpha = smoothstep(u_sdf_edge - u_sdf_smoothing, u_sdf_edge + u_sdf_smoothing, distance);
    fragColor = vec4(v_color.rgb, v_color.a * alpha);
}
