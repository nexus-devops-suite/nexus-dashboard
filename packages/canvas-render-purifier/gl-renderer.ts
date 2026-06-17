import { SceneNode } from './scene-graph';

export class GLRenderer {
  private gl: WebGL2RenderingContext;
  private programs: { [key: string]: WebGLProgram } = {};
  private buffers: { [key: string]: WebGLBuffer } = {};
  private fontTexture: WebGLTexture | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('webgl2', { alpha: false, antialias: true });
    if (!context) {
      throw new Error('WebGL2 not supported in this environment');
    }
    this.gl = context;
    this.initShaders();
    this.initBuffers();
    this.initFontTexture();
  }

  private initShaders(): void {
    const rectVs = `#version 300 es
      layout(location = 0) in vec2 a_position;
      uniform vec2 u_resolution;
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        gl_Position = vec4(zeroToOne * 2.0 - 1.0, 0, 1);
      }
    `;

    const rectFs = `#version 300 es
      precision mediump float;
      out vec4 fragColor;
      uniform vec4 u_color;
      void main() {
        fragColor = u_color;
      }
    `;

    this.programs['rect'] = this.createProgram(rectVs, rectFs);

    const textVs = `#version 300 es
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
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        v_texcoord = a_texcoord;
        v_color = a_color;
      }
    `;

    const textFs = `#version 300 es
      precision mediump float;
      in vec2 v_texcoord;
      in vec4 v_color;
      uniform sampler2D u_sdf_texture;
      uniform float u_sdf_edge;
      uniform float u_sdf_smoothing;
      out vec4 fragColor;
      void main() {
        float distance = texture(u_sdf_texture, v_texcoord).r;
        float alpha = smoothstep(u_sdf_edge - u_sdf_smoothing, u_sdf_edge + u_sdf_smoothing, distance);
        fragColor = vec4(v_color.rgb, v_color.a * alpha);
      }
    `;

    this.programs['text'] = this.createProgram(textVs, textFs);
  }

  private initBuffers(): void {
    const gl = this.gl;
    const positionBuffer = gl.createBuffer();
    if (positionBuffer) {
      this.buffers['position'] = positionBuffer;
    }

    const textPositionBuffer = gl.createBuffer();
    if (textPositionBuffer) {
      this.buffers['text_position'] = textPositionBuffer;
    }

    const textTexcoordBuffer = gl.createBuffer();
    if (textTexcoordBuffer) {
      this.buffers['text_texcoord'] = textTexcoordBuffer;
    }

    const textColorBuffer = gl.createBuffer();
    if (textColorBuffer) {
      this.buffers['text_color'] = textColorBuffer;
    }
  }

  private initFontTexture(): void {
    const gl = this.gl;
    this.fontTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.fontTexture);
    
    // Generate a procedural circular SDF texture grid (128x128 pixels)
    const size = 128;
    const data = new Uint8Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cellX = x % 16;
        const cellY = y % 16;
        const dx = cellX - 8;
        const dy = cellY - 8;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const val = Math.max(0, Math.min(255, Math.floor((8 - dist) * 32)));
        data[y * size + x] = val;
      }
    }

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      size,
      size,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('VS Error:', gl.getShaderInfoLog(vs));
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('FS Error:', gl.getShaderInfoLog(fs));
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    return prog;
  }

  public render(rootNode: SceneNode): void {
    const gl = this.gl;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.05, 0.05, 0.07, 1.0); // Modern deep dark background color
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Recursively draw all nodes
    this.drawNode(rootNode);
  }

  private drawNode(node: SceneNode): void {
    if (node.type === 'rect') {
      this.drawRect(node);
    } else if (node.type === 'text') {
      this.drawText(node);
    }

    for (const child of node.children) {
      this.drawNode(child);
    }
  }

  private drawRect(node: SceneNode): void {
    const gl = this.gl;
    const prog = this.programs['rect'];
    gl.useProgram(prog);

    const pos = node.getAbsolutePosition();
    const x1 = pos.x;
    const x2 = pos.x + node.width;
    const y1 = pos.y;
    const y2 = pos.y + node.height;

    // Convert screen coordinates of rect to canvas projection
    const vertices = new Float32Array([
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2,
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers['position']);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Set resolution uniform
    const resLoc = gl.getUniformLocation(prog, 'u_resolution');
    gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);

    // Set color uniform
    const colorLoc = gl.getUniformLocation(prog, 'u_color');
    const color = this.parseColor(node.props.color || '#ffffff');
    gl.uniform4fv(colorLoc, color);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private drawText(node: SceneNode): void {
    const text = node.props.text;
    if (!text) return;

    const gl = this.gl;
    const prog = this.programs['text'];
    gl.useProgram(prog);

    const pos = node.getAbsolutePosition();
    let currentX = pos.x;
    let currentY = pos.y;
    
    const fontSize = node.props.fontSize || 14;
    const fontColor = this.parseColor(node.props.color || '#ffffff');

    const vertices: number[] = [];
    const texcoords: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      
      const charWidth = fontSize * 0.6;
      const charHeight = fontSize;

      const x1 = currentX;
      const x2 = currentX + charWidth;
      const y1 = currentY;
      const y2 = currentY + charHeight;

      // Triangle 1
      vertices.push(x1, y1);
      vertices.push(x2, y1);
      vertices.push(x1, y2);
      // Triangle 2
      vertices.push(x1, y2);
      vertices.push(x2, y1);
      vertices.push(x2, y2);

      const uCol = charCode % 16;
      const uRow = Math.floor(charCode / 16) % 16;
      const u1 = uCol / 16.0;
      const u2 = (uCol + 1) / 16.0;
      const v1 = uRow / 16.0;
      const v2 = (uRow + 1) / 16.0;

      // Triangle 1 UVs
      texcoords.push(u1, v1);
      texcoords.push(u2, v1);
      texcoords.push(u1, v2);
      // Triangle 2 UVs
      texcoords.push(u1, v2);
      texcoords.push(u2, v1);
      texcoords.push(u2, v2);

      for (let j = 0; j < 6; j++) {
        colors.push(fontColor[0], fontColor[1], fontColor[2], fontColor[3]);
      }

      currentX += charWidth * 1.1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers['text_position']);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers['text_texcoord']);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers['text_color']);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

    const resLoc = gl.getUniformLocation(prog, 'u_resolution');
    gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fontTexture);
    const texLoc = gl.getUniformLocation(prog, 'u_sdf_texture');
    gl.uniform1i(texLoc, 0);

    const edgeLoc = gl.getUniformLocation(prog, 'u_sdf_edge');
    gl.uniform1f(edgeLoc, 0.5);

    const smoothingLoc = gl.getUniformLocation(prog, 'u_sdf_smoothing');
    gl.uniform1f(smoothingLoc, 0.1);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
  }

  private parseColor(hex: string): Float32Array {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    const a = cleanHex.length === 8 ? parseInt(cleanHex.substring(6, 8), 16) / 255 : 1.0;
    return new Float32Array([r, g, b, a]);
  }
}
