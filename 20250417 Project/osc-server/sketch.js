// file:// で開くとCORSエラーになるので，必ず http サーバー経由でアクセスすること
let vid;
let effects = [
    'gray', 'invert', 'threshold', 'posterize', 'none',
    'blur', 'pixelate', 'glitch', 'rgb', 'wave', 'hue', 'edge', 'mosaic', 'emboss', 'solarize'
];
let currentEffect = 'none';
let ws;
let vidW = 1280, vidH = 720; // デフォ値、動画ロード後に上書き
let canvas;
let videoReady = false;

function preload() {
    vid = createVideo('movie.mp4', loadedMeta);
}

function loadedMeta() {
    vidW = vid.width;
    vidH = vid.height;
    resizeToVideoAspect();
    videoReady = true;
}

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    vid.hide();
    vid.volume(0);
    resizeToVideoAspect();

    ws = new WebSocket('ws://localhost:8081');
    ws.onmessage = () => {
        currentEffect = random(effects);
    };

    // ユーザー操作で再生
    canvas.mousePressed(() => {
        if (videoReady) {
            vid.loop();
            vid.play();
        }
    });
    textFont('sans-serif');
    textAlign(CENTER, CENTER);
}

function draw() {
    background(0);
    if (videoReady) {
        image(vid, 0, 0, width, height);
        applyEffect(currentEffect);
    } else {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(32);
        text('クリックで動画再生（サーバー経由で開いてください）', width / 2, height / 2);
    }
    // 画面中央に「20250417」
    push();
    textFont('Hiragino Mincho ProN', 'serif'); // Mac用明朝体
    textAlign(CENTER, CENTER);
    textSize(min(width, height) * 0.18);
    fill(255);
    stroke(0, 120);
    strokeWeight(8);
    text('20250417', width / 2, height / 2);
    pop();
}

function applyEffect(effect) {
    switch (effect) {
        case 'gray': filter(GRAY); break;
        case 'invert': filter(INVERT); break;
        case 'threshold': filter(THRESHOLD); break;
        case 'posterize': filter(POSTERIZE, 3); break;
        case 'blur': filter(BLUR, 6); break;
        case 'solarize': filter(POSTERIZE, 2); filter(INVERT); break;
        case 'pixelate': pixelate(12); break;
        case 'glitch': glitch(); break;
        case 'rgb': rgbSplit(); break;
        case 'wave': waveDistort(); break;
        case 'hue': hueShift(); break;
        case 'edge': edgeDetect(); break;
        case 'mosaic': pixelate(32); break;
        case 'emboss': emboss(); break;
        // 'none'は何もしない
    }
}

// --- エフェクト実装 ---
function pixelate(size) {
    loadPixels();
    for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
            let i = 4 * (int(x) + int(y) * width);
            let r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
            for (let dy = 0; dy < size; dy++) {
                for (let dx = 0; dx < size; dx++) {
                    let nx = x + dx, ny = y + dy;
                    if (nx < width && ny < height) {
                        let ni = 4 * (int(nx) + int(ny) * width);
                        pixels[ni] = r; pixels[ni + 1] = g; pixels[ni + 2] = b; pixels[ni + 3] = a;
                    }
                }
            }
        }
    }
    updatePixels();
}

function glitch() {
    loadPixels();
    for (let y = 0; y < height; y += 8) {
        let offset = int(random(-20, 20));
        for (let x = 0; x < width; x++) {
            let i = 4 * (x + y * width);
            let ni = 4 * ((x + offset + width) % width + y * width);
            for (let c = 0; c < 3; c++) pixels[ni + c] = pixels[i + c];
        }
    }
    updatePixels();
}

function rgbSplit() {
    loadPixels();
    let d = 8;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let i = 4 * (x + y * width);
            let r = pixels[i + 0];
            let g = pixels[4 * ((x + d) % width + y * width) + 1];
            let b = pixels[4 * ((x - d + width) % width + y * width) + 2];
            pixels[i + 0] = r;
            pixels[i + 1] = g;
            pixels[i + 2] = b;
        }
    }
    updatePixels();
}

function waveDistort() {
    loadPixels();
    let temp = new Uint8ClampedArray(pixels);
    for (let y = 0; y < height; y++) {
        let dx = int(20 * sin(TWO_PI * y / 80 + frameCount * 0.1));
        for (let x = 0; x < width; x++) {
            let sx = (x + dx + width) % width;
            let i = 4 * (x + y * width);
            let si = 4 * (sx + y * width);
            for (let c = 0; c < 4; c++) pixels[i + c] = temp[si + c];
        }
    }
    updatePixels();
}

function hueShift() {
    loadPixels();
    for (let i = 0; i < pixels.length; i += 4) {
        let c = color(pixels[i], pixels[i + 1], pixels[i + 2]);
        let h = (hue(c) + frameCount % 360) % 360;
        let s = saturation(c);
        let b = brightness(c);
        let nc = color(h, s, b);
        pixels[i] = red(nc);
        pixels[i + 1] = green(nc);
        pixels[i + 2] = blue(nc);
    }
    updatePixels();
}

function edgeDetect() {
    loadPixels();
    let temp = new Uint8ClampedArray(pixels);
    let w = width, h = height;
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let i = 4 * (x + y * w);
            let gx = 0, gy = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    let ni = 4 * ((x + kx) + (y + ky) * w);
                    let v = temp[ni];
                    gx += v * (kx == -1 ? -1 : kx == 1 ? 1 : 0);
                    gy += v * (ky == -1 ? -1 : ky == 1 ? 1 : 0);
                }
            }
            let mag = constrain(abs(gx) + abs(gy), 0, 255);
            pixels[i] = pixels[i + 1] = pixels[i + 2] = mag;
        }
    }
    updatePixels();
}

function emboss() {
    loadPixels();
    let temp = new Uint8ClampedArray(pixels);
    let w = width, h = height;
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let i = 4 * (x + y * w);
            let ni = 4 * ((x - 1) + (y - 1) * w);
            let v = temp[ni] - temp[i] + 128;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
        }
    }
    updatePixels();
}

function windowResized() {
    resizeToVideoAspect();
}

function resizeToVideoAspect() {
    let ar = vidW / vidH;
    let w = windowWidth;
    let h = windowHeight;
    if (w / h > ar) w = h * ar; else h = w / ar;
    resizeCanvas(w, h);
} 