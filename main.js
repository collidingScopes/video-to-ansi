/*
To do:
Charsets
- Improve existing charsets
- User custom charset
- Random selection of chars from the full list of chars (need to sort the whole list by pixel complexity first then select from bottom to top)
- Add charset for emojis?
Toggle for brightness threshold
Need to better understand color selection function / color threshold / intensity mechanic -- add user toggle for this
Export as image / video
Ability to accept user video input (or image input)
Adjust palettes
- Palette select menu should grab the names and values based on the color palette definition (only one update)
Entire UI should change color when palette is changed?
Footer / links div
Mobile testing
- Change aspect ratio for mobile camera
- increase font size
Responsive design that fits onto user device width/height size
Don't allow user slider for frame rate. Instead just render at the fastest frame rate we can, and display what that value is in the UI
Keyboard shortcut hotkeys
Add some randomness and glitches (matrix rain effect, etc.)
Move char sets to a separate file (similar to palettes)
*/

const ALL_CHARS = "☺︎☻♥︎♦︎♣︎♠︎•◘○◙♂︎♀︎♪♫☼►◄↕︎‼︎¶§▬↨↑↓→←∟↔︎▲▼!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxy{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°√■";

const CHAR_SETS = [
  {
    name: "ANSI_CHARS",
    chars: "╖╕┐╗╝╜╛│├┤┼╡╢╣║╞╔╩╠╬╫╪▄■▀▌▐█░▒▓█",
  }, //ANSI;
  {
    name: "ASCII_CHARS",
    chars: "____``..--^^~~<>??123456789%%&&@@",
  }, //ASCII;
  {
    name: "MIX_CHARS",
    chars: " .-`~/$@☺︎☻♥︎♦︎♣︎♠︎•◘░▒▓█",
  }, //MIX;
  {
    name: "EMOJI_CHARS",
    chars: "✅✨👀🙂",
  }, //EMOJIS;
];

let charSetSelect = document.getElementById('charSetSelect');
let currentCharSetIndex = 0;
let numCharSets = 4;
let SELECTED_CHARS = CHAR_SETS[currentCharSetIndex].chars;
let REVERSED_CHARS = SELECTED_CHARS.split('').reverse().join('');

let paletteSelect = document.getElementById('paletteSelect');
let currentPaletteIndex = 0;
let currentPaletteName = 'CYBERPUNK';
let paletteNames = [];
for(let i=0; i<COLOR_PALETTES.length; i++){
  paletteNames[i] = COLOR_PALETTES[i].name;
}
console.log(paletteNames);

let fontScaleSlider = document.getElementById('fontScale');
let fontScaleMin = 80;
let fontScaleMax = 300;
let fontScaleValue = 140;
fontScaleSlider.min = fontScaleMin;
fontScaleSlider.max = fontScaleMax;

let isPlaying = false;
let inputVideo = document.getElementById('video');

//choose random new palette, without repeating the current one
function chooseRandomPalette(oldPaletteIndex){
  
  let newPaletteIndex = Math.floor(Math.random()*(COLOR_PALETTES.length));
  
  if(newPaletteIndex == oldPaletteIndex){
    chooseRandomPalette(oldPaletteIndex);
  } else {
    currentPaletteIndex = newPaletteIndex;
    currentPaletteName = paletteNames[currentPaletteIndex];
    console.log("new palette name: "+currentPaletteName);
    paletteSelect.value = currentPaletteIndex;
  }
}

function chooseRandomCharSet(oldCharSetIndex){
  let newCharSetIndex = Math.floor(Math.random() * numCharSets);

  if(newCharSetIndex == oldCharSetIndex){
    chooseRandomCharSet(oldCharSetIndex);
  } else {
    currentCharSetIndex = newCharSetIndex;
    SELECTED_CHARS = CHAR_SETS[currentCharSetIndex].chars;
    console.log("New char set: "+CHAR_SETS[currentCharSetIndex].name);
    charSetSelect.value = currentCharSetIndex;
  }
  REVERSED_CHARS = SELECTED_CHARS.split('').reverse().join('');
}

function randomizeInputs(){
  chooseRandomPalette(currentPaletteIndex);
  chooseRandomCharSet(currentCharSetIndex);

  fontScaleValue = fontScaleMin + (Math.random() * (fontScaleMax-fontScaleMin));
  fontScaleSlider.value = fontScaleValue;
  document.getElementById('fontScaleValue').textContent = (fontScaleValue/100).toFixed(1);
}

function togglePlayPause(){
  isPlaying = !isPlaying;
  if (isPlaying) {
      inputVideo.play();
      app.render();
  } else {
    inputVideo.pause();
      if (app.animationId) {
          cancelAnimationFrame(app.animationId);
          app.animationId = null;
      }
  }
}

class ANSIWebcam {
  constructor() {
      // this.video = document.getElementById('video');
      this.processCanvas = document.getElementById('processCanvas');
      this.outputCanvas = document.getElementById('outputCanvas');
      this.resolutionSlider = document.getElementById('resolution');
      this.fpsSlider = document.getElementById('fps');
      this.playPauseBtn = document.getElementById('playPause');
      this.invertCheckbox = document.getElementById('invertCheckbox');

      // Populate palette select options
      const paletteSelect = document.getElementById('paletteSelect');
      COLOR_PALETTES.forEach((palette, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = palette.name;
          paletteSelect.appendChild(option);
      });

      //this.isPlaying = true;
      this.animationId = null;
      this.lastFrameTime = 0;
      this.frameInterval = 1000 / parseInt(this.fpsSlider.value);

      this.setupCanvas();
      this.setupWebGL();
      this.setupEventListeners();
  }

  setupCanvas() {
      const canvasSize = this.calculateCanvasSize();
      this.outputCanvas.width = canvasSize.width;
      this.outputCanvas.height = canvasSize.height;
      this.ctx = this.outputCanvas.getContext('2d', { 
          alpha: false,
          desynchronized: true
      });
      this.ctx.textBaseline = 'top';
      this.ctx.textAlign = 'center';

      // Set text rendering to optimize for dense character placement
      this.ctx.font = 'monospace';
      this.ctx.letterSpacing = '-1px';
      this.ctx.textRendering = 'optimizeLegibility';
  }

  calculateCanvasSize() {
      const padding = 100;
      const maxWidth = window.innerWidth - padding;
      const maxHeight = window.innerHeight - padding;
      const aspectRatio = 16 / 9;

      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
      }

      return { 
          width: Math.floor(width), 
          height: Math.floor(height) 
      };
  }

  setupWebGL() {
      this.gl = this.processCanvas.getContext('webgl', {
          preserveDrawingBuffer: true,
          antialias: false,
          depth: false,
          stencil: false
      });

      if (!this.gl) {
          throw new Error('WebGL not supported');
      }

      const vertexShader = this.createShader(
          this.gl.VERTEX_SHADER,
          document.getElementById('vertexShader').textContent
      );
      const fragmentShader = this.createShader(
          this.gl.FRAGMENT_SHADER,
          document.getElementById('fragmentShader').textContent
      );

      this.program = this.createProgram(vertexShader, fragmentShader);
      this.positionLocation = this.gl.getAttribLocation(this.program, 'position');
      this.resolutionLocation = this.gl.getUniformLocation(this.program, 'uResolution');

      // Create position buffer
      const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

      // Create and set up texture
      this.texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
  }

  createShader(type, source) {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);

      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
          throw new Error(this.gl.getShaderInfoLog(shader));
      }

      return shader;
  }

  createProgram(vertexShader, fragmentShader) {
      const program = this.gl.createProgram();
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);

      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
          throw new Error(this.gl.getProgramInfoLog(program));
      }

      return program;
  }

  setupEventListeners() {

      paletteSelect.addEventListener('change', (e) => {
        currentPaletteIndex = e.target.value;
      });

      charSetSelect.addEventListener('change', (e) => {
        SELECTED_CHARS = CHAR_SETS[charSetSelect.value].chars;
        REVERSED_CHARS = SELECTED_CHARS.split('').reverse().join('');
      });

      document.getElementById("randomizePaletteButton").addEventListener('click',() => {
        chooseRandomPalette(currentPaletteIndex);
      });

      this.playPauseBtn.addEventListener('click', () => {
        togglePlayPause();
      });

      this.resolutionSlider.addEventListener('input', () => {
          const width = parseInt(this.resolutionSlider.value);
          const height = Math.floor(width * (this.processCanvas.height / this.processCanvas.width));
          document.getElementById('resValue').textContent = `${width}x${height}`;
      });

      this.fpsSlider.addEventListener('input', () => {
          document.getElementById('fpsValue').textContent = this.fpsSlider.value;
          this.frameInterval = 1000 / parseInt(this.fpsSlider.value);
      });

      fontScaleSlider.addEventListener('input', () => {
          fontScaleValue = fontScaleSlider.value;
          document.getElementById('fontScaleValue').textContent = (fontScaleValue/100).toFixed(1);
      });

      window.addEventListener('resize', () => {
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => {
              location.reload();
          }, 250);
      });

      //shortcut hotkey presses
      document.addEventListener('keydown', function(event) {
        
        if (event.key === 's') {
            saveImage();
        } else if (event.key === 'v') {
            toggleVideoRecord();
        } else if (event.code === 'Space') {
          event.preventDefault();
          togglePlayPause();
        } else if(event.key === 'Enter'){
          safeRestartAnimation();
        } else if(event.key === 'r'){
          randomizeInputs();
        } else if(event.key === 'u'){
          imageInput.click();
        } else if(event.key === 'c'){
          chooseRandomPalette(currentPaletteIndex);
        }
        
      });
  }

  getColorForPixel(r, g, b) {
      const intensity = (r + g + b) / 3;
      const colorThreshold = 0.6;
      //const palette = COLOR_PALETTES[currentPalette];
      const palette = COLOR_PALETTES[currentPaletteIndex];

      // Color selection based on both intensity and color components
      if (intensity > 0.8) {
          return palette.highlight;
      } else if (r > colorThreshold && g < colorThreshold && b < colorThreshold) {
          return palette.accent;
      } else if (g > colorThreshold && r < colorThreshold && b < colorThreshold) {
          return palette.secondary;
      } else if (b > colorThreshold && r < colorThreshold && g < colorThreshold) {
          return palette.primary;
      } else if (intensity > 0.6) {
          return palette.mid;
      } else if (intensity > 0.4) {
          return palette.dark;
      } else if (intensity > 0.2) {
          return palette.shadow;
      }
      return palette.background;
  }

  render = (currentTime) => {
      // if (!this.isPlaying) return;
      if (!isPlaying) return;
      this.animationId = requestAnimationFrame(this.render);

      if (currentTime - this.lastFrameTime < this.frameInterval) {
          return;
      }
      this.lastFrameTime = currentTime;

      const width = parseInt(this.resolutionSlider.value);
      const height = Math.floor(width * (this.processCanvas.height / this.processCanvas.width));
      
      this.gl.viewport(0, 0, width, height);
      this.gl.useProgram(this.program);

      // Update texture with new video frame
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, inputVideo);

      this.gl.uniform2f(this.resolutionLocation, width, height);
      this.gl.enableVertexAttribArray(this.positionLocation);
      this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      // Read pixels (includes both color and brightness in alpha channel)
      const pixels = new Uint8Array(width * height * 4);
      this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

      // Clear output canvas
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
      
      // Calculate character dimensions
      const charWidth = (this.outputCanvas.width / width);
      const charHeight = this.outputCanvas.height / height;
      fontScaleValue = fontScaleSlider.value;
      if(currentCharSetIndex == 3){
        this.ctx.font = `${Math.min(charWidth, charHeight) * (fontScaleValue/100)}px Helvetica`;
      } else {
        this.ctx.font = `${Math.min(charWidth, charHeight) * (fontScaleValue/100)}px Font437 monospace`;
      }
      //this.ctx.font = `${Math.min(charWidth, charHeight) * (fontScaleValue/100)}px Font437 monospace`;
      
      // Render characters
      const currentChars = this.invertCheckbox.checked ? REVERSED_CHARS : SELECTED_CHARS;
  
      for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
              const i = (y * width + x) * 4;
              const r = pixels[i] / 255;
              const g = pixels[i + 1] / 255;
              const b = pixels[i + 2] / 255;
              const brightness = pixels[i + 3] / 255; // Use pre-calculated brightness from shader
              
              const charIndex = Math.floor(brightness * (currentChars.length - 1));
              this.ctx.fillStyle = this.getColorForPixel(r, g, b);
              this.ctx.fillText(
                  currentChars[charIndex],
                  (x+0.5) * charWidth,
                  y * charHeight
              );
          }
      }
  }

  async start() {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                  width: { ideal: 640 },
                  height: { ideal: 480 }
              } 
          });
          
          inputVideo.srcObject = stream;
          await inputVideo.play();
          
          this.processCanvas.width = inputVideo.videoWidth;
          this.processCanvas.height = inputVideo.videoHeight;
          
          isPlaying = true;
          this.render(0);
          
      } catch (error) {
          console.error('Error:', error);
          this.ctx.fillStyle = '#f00';
          this.ctx.fillText(
              'Error accessing webcam. Please make sure you have a webcam connected and have granted permission to use it.',
              this.outputCanvas.width / 2,
              this.outputCanvas.height / 2
          );
      }
  }
}

// Initialize and start the application
const app = new ANSIWebcam();
app.start();