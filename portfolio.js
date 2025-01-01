import {
    Scene,
    WebGLRenderer,
    PerspectiveCamera,
    Object3D,
    BoxBufferGeometry,
    MeshBasicMaterial,
    InstancedMesh,
    DynamicDrawUsage,
    CanvasTexture,
    Vector3
} from 'https://unpkg.com/three@0.121.1/build/three.module.js';

// Three.js setup
const rowCount = 46;
const columnCount = 40;
const layerCount = 2;

const dummy = new Object3D();

const camera = new PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
camera.position.set(6, 7, 0);
camera.lookAt(0.3, 0, 0);

const initialCameraPos = new Vector3(6, 7, 0);
const initialLookAt = new Vector3(0.3, 0, 0);
const targetCameraPos = new Vector3(0, 0, -5);
const targetLookAt = new Vector3(0, -5, 0);

var scene = new Scene();

var geom = new BoxBufferGeometry();
geom.computeVertexNormals();

const canvas = document.createElement('canvas');
const size = canvas.height = canvas.width = 128;
let ctx = canvas.getContext('2d');
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, size, size);
ctx.clearRect(1, 1, size - 2, size - 2);
const map = new CanvasTexture(canvas);
map.anisotropy = 4;
var material = new MeshBasicMaterial({ map });

const mesh = new InstancedMesh(geom, material, rowCount * columnCount * layerCount);
mesh.instanceMatrix.setUsage(DynamicDrawUsage);
scene.add(mesh);

var renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
document.getElementById('three-container').appendChild(renderer.domElement);

const threeContainer = document.getElementById('three-container');
const contentWrapper = document.querySelector('.content-wrapper');
const eyeText = document.querySelector('.eye-text');
let currentScale = 1;
let ticking = false;

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

function lerpVector(v1, v2, t) {
    return new Vector3(
        lerp(v1.x, v2.x, t),
        lerp(v1.y, v2.y, t),
        lerp(v1.z, v2.z, t)
    );
}

// Calculate total scrollable height
const getMaxScroll = () => {
    return document.querySelector('.scroll-container').offsetHeight - window.innerHeight;
};

// Update text opacity based on scroll
const updateTextFade = (scrollProgress) => {
    // Calculate opacity based on first half of scroll
    let opacity = 0.4 - (scrollProgress * 2);
    opacity = Math.max(0, Math.min(1, opacity));

    // when user scrolls back up and reaches the top of the page, the opacity of the text should be 1
    if (scrollProgress === 0) {
        opacity = 1;
    }


    // Update text nodes opacity while preserving eye
    const eyeAnchor = document.querySelector('.eye-anchor');
    if (eyeAnchor) {
        eyeAnchor.style.opacity = '1';
    }

    const textNodes = Array.from(eyeText.childNodes).filter(node =>
        node.nodeType === Node.TEXT_NODE ||
        (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('eye-anchor'))
    );

    textNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            if (!node.parentElement || node.parentElement === eyeText) {
                const span = document.createElement('span');
                node.after(span);
                span.appendChild(node);
            }
            node.parentElement.style.opacity = opacity;
        } else {
            node.style.opacity = opacity;
        }
    });
};

let scrollProgress = 0;
window.addEventListener('scroll', () => {
    const scrollMax = getMaxScroll();
    scrollProgress = Math.min(1, window.scrollY * 1.2 / scrollMax * 6);

    if (!ticking) {
        requestAnimationFrame(() => {
            updateTextFade(scrollProgress);

            if (scrollProgress > 0.44) {
                threeContainer.style.opacity = '0';
                contentWrapper.style.opacity = '0';
                currentScale = 1;
            } else {
                threeContainer.style.opacity = '1';
                contentWrapper.style.opacity = '1';
            }

            ticking = false;
        });
        ticking = true;
    }
});

addEventListener('resize', () => {
    onWindowResize();
});

function onWindowResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}

function animate(time) {
    render(time / 1000);
    requestAnimationFrame(animate);
}

function render(time) {
    const firstPhaseProgress = Math.min(1, scrollProgress * 2);
    const cameraPos = lerpVector(initialCameraPos, targetCameraPos, firstPhaseProgress * 2);
    const lookAtPos = lerpVector(initialLookAt, targetLookAt, firstPhaseProgress);

    camera.position.copy(cameraPos);
    camera.lookAt(lookAtPos);

    var i = 0;
    for (var x = 0; x < rowCount; x++) {
        const a = x / rowCount * Math.PI * 2;
        const X = Math.cos(a) / 2;
        const Z = Math.sin(a) / 2;
        const t = (time) % 1;

        for (var y = 0; y < layerCount; y++) {
            const shift = y * Math.abs(Math.sin(x / 1.3)) +
                Math.sin(x / 1.3) +
                Math.cos(x / 1.7) - layerCount;

            for (var z = 0; z < columnCount; z++) {
                const t1 = Math.max(0, (3 - z) + time % 1 - shift);
                const Y = y - Math.pow(t1, 5);

                dummy.position.set(X * (z + 4 - t), Y, Z * (z + 4 - t));
                dummy.rotation.y = -a;
                dummy.scale.set(0.5, 1, 0.5)
                dummy.updateMatrix();

                mesh.setMatrixAt(i++, dummy.matrix);
            }
        }
    }
    mesh.instanceMatrix.needsUpdate = true;
    scene.rotation.y = time / 10;
    renderer.render(scene, camera);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    animate(0);
});