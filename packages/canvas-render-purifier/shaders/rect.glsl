#version 300 es
// Vertex Shader
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec4 a_color;
layout(location = 2) in vec4 a_bounds; // [x, y, width, height]

out vec4 v_color;

void main() {
    // Convert canvas coordinates to WebGL clip space [-1, 1]
    vec2 zeroToOne = a_position / a_bounds.zw;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    // Invert Y axis for screen space coords
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_color = a_color;
}

---SPLIT_SHADER_BOUNDS---
#version 300 es
// Fragment Shader
precision mediump float;

in vec4 v_color;
out vec4 fragColor;

void main() {
    fragColor = v_color;
}
