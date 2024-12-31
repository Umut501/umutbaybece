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
const rowCount = 36;
const columnCount = 30;
const layerCount = 3;

const dummy = new Object3D();

const camera = new PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
camera.position.set(6, 7, 0);
camera.lookAt(0.3, 0, 0);

const initialCameraPos = new Vector3(6, 7, 0);
const initialLookAt = new Vector3(0.3, 0, 0);
const targetCameraPos = new Vector3(0, 0, -5); // Changed from (-20) to center
const targetLookAt = new Vector3(0, -5, 0); 

var scene = new Scene();

var geom = new BoxBufferGeometry();
geom.computeVertexNormals();

const canvas = document.createElement('canvas');
const size = canvas.height = canvas.width = 128;
let ctx = canvas.getContext('2d');
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, size, size);
ctx.clearRect(1, 1, size-2, size-2);
const map = new CanvasTexture(canvas);
map.anisotropy = 4;
var material = new MeshBasicMaterial({map});

const mesh = new InstancedMesh(geom, material, rowCount*columnCount*layerCount);
mesh.instanceMatrix.setUsage(DynamicDrawUsage); 
scene.add(mesh);

var renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
document.getElementById('three-container').appendChild(renderer.domElement);

// Grid Portal Setup
const portal = document.querySelector('.portal');
const svg = document.getElementById('grid');
const threeContainer = document.getElementById('three-container');
const contentWrapper = document.querySelector('.content-wrapper');
const gridContainer = document.querySelector('.grid-container');
const portalContainer = document.querySelector('.portal-container');
let currentScale = 1;
let isSecondPhase = false;

function createDistortedGrid() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const spacing = 80;
    const centerX = width / 2;
    const centerY = height / 2;
    const portalRadius = 150 * currentScale;
    const distortionRadius = portalRadius * 1.5;
    
    svg.innerHTML = '';

    // Create vertical lines
    for (let x = 0; x <= width; x += spacing) {
        let pathD = `M ${x} 0`;
        for (let y = 0; y <= height; y += 10) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < distortionRadius) {
                const angle = Math.atan2(dy, dx);
                const distortion = Math.max(0, (1 - distance / distortionRadius) * 30);
                const newX = x + Math.cos(angle) * distortion;
                pathD += ` L ${newX} ${y}`;
            } else {
                pathD += ` L ${x} ${y}`;
            }
        }
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('class', 'grid-line');
        svg.appendChild(path);
    }

    // Create horizontal lines
    for (let y = 0; y <= height; y += spacing) {
        let pathD = `M 0 ${y}`;
        for (let x = 0; x <= width; x += 10) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < distortionRadius) {
                const angle = Math.atan2(dy, dx);
                const distortion = Math.max(0, (1 - distance / distortionRadius) * 30);
                const newY = y + Math.sin(angle) * distortion;
                pathD += ` L ${x} ${newY}`;
            } else {
                pathD += ` L ${x} ${y}`;
            }
        }
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('class', 'grid-line');
        svg.appendChild(path);
    }
}

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

let scrollProgress = 0;
window.addEventListener('scroll', () => {
    const scrollMax = document.querySelector('.scroll-container').offsetHeight - window.innerHeight;
    scrollProgress = Math.min(1, window.scrollY / scrollMax);

    if (scrollProgress > 0.5 && !isSecondPhase) {
        isSecondPhase = true;
        threeContainer.style.opacity = '0';
        contentWrapper.style.opacity = '0';
        gridContainer.classList.add('grid-active');
        portalContainer.classList.add('portal-active');
        currentScale = 1;
    } else if (scrollProgress <= 0.5 && isSecondPhase) {
        isSecondPhase = false;
        threeContainer.style.opacity = '1';
        contentWrapper.style.opacity = '1';
        gridContainer.classList.remove('grid-active');
        portalContainer.classList.remove('portal-active');
    }

    if (isSecondPhase) {
        const secondPhaseProgress = (scrollProgress - 0.5) * 2;
        currentScale = 1 + (secondPhaseProgress * 15);
        portal.style.transform = `scale(${currentScale})`;
        createDistortedGrid();
    }
});

addEventListener('resize', () => {
    onWindowResize();
    createDistortedGrid();
});

function onWindowResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}

function animate(time) {
    render(time/1000);
    requestAnimationFrame(animate);
}

function render(time) {
    if (!isSecondPhase) {
        const firstPhaseProgress = Math.min(1, scrollProgress * 2);
        const cameraPos = lerpVector(initialCameraPos, targetCameraPos, firstPhaseProgress);
        const lookAtPos = lerpVector(initialLookAt, targetLookAt, firstPhaseProgress);
        
        camera.position.copy(cameraPos);
        camera.lookAt(lookAtPos);

        var i = 0;
        for (var x = 0; x < rowCount; x++) {
            const a = x/rowCount*Math.PI*2;
            const X = Math.cos(a)/2;
            const Z = Math.sin(a)/2;
            const t = (time)%1;

            for (var y = 0; y < layerCount; y++) {
                const shift = y*Math.abs(Math.sin(x/1.3))+
                       Math.sin(x/1.3) +
                       Math.cos(x/1.7) - layerCount;
                
                for (var z = 0; z < columnCount; z++) {
                    const t1 = Math.max(0, (3-z)+time%1-shift);
                    const Y = y-Math.pow(t1, 5);
                    
                    dummy.position.set(X*(z+4-t), Y, Z*(z+4-t));
                    dummy.rotation.y = -a;
                    dummy.scale.set(0.5, 1, 0.5)
                    dummy.updateMatrix();
                    
                    mesh.setMatrixAt(i++, dummy.matrix);
                }
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
        scene.rotation.y = time/10;
        renderer.render(scene, camera);
    }
}

// Initialize
animate(0);
createDistortedGrid();

// Text animation
document.addEventListener('DOMContentLoaded', function() {
    const firstname = document.getElementById('firstname');
    const lastname = document.getElementById('lastname');

    firstname.style.animation = 'fadeIn 1s ease-out forwards';
    setTimeout(() => {
        lastname.style.animation = 'fadeIn 1s ease-out forwards';
    }, 200);
});


