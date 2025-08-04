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

import ProjectsPrisms from './ProjectsPrisms.js';

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
const targetCameraPos = new Vector3(0, 0, -1);
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

// Updated scroll event listener for combined section
window.addEventListener('scroll', () => {
    const scrollMax = getMaxScroll();
    scrollProgress = Math.min(1, window.scrollY / scrollMax);

    const combinedSection = document.querySelector('.combined-section');
    const overlay = document.querySelector('.scroll-overlay');

    if (!ticking) {
        requestAnimationFrame(() => {
            updateTextFade(scrollProgress);

            // Overlay control - only show in first section
            if (scrollProgress <= 0.3) {
                const minHoleSize = 180;
                const maxHoleSize = Math.max(window.innerWidth, window.innerHeight);
                const scrollFactor = scrollProgress * 3.33; // 0-1 range for first 30%
                const currentHoleSize = minHoleSize + (scrollFactor * (maxHoleSize - minHoleSize));

                overlay.style.opacity = '1';
                overlay.style.setProperty('--hole-size', `${currentHoleSize}px`);
            } else {
                overlay.style.opacity = '0';
            }

            // Switch between home and combined section
            if (scrollProgress <= 0.3) {
                // Home section
                threeContainer.style.opacity = '1';
                contentWrapper.style.opacity = '1';

                if (combinedSection) {
                    combinedSection.classList.remove('active');
                }
            } else {
                // Combined section (About + Projects)
                threeContainer.style.opacity = '0';
                contentWrapper.style.opacity = '0';

                if (combinedSection) {
                    combinedSection.classList.add('active');

                    // Control which part is visible based on scroll
                    const aboutPart = combinedSection.querySelector('.about-part');
                    const projectsPart = combinedSection.querySelector('.projects-part');

                    // Calculate position within combined section (30% to 100% maps to 0% to 100%)
                    const combinedProgress = (scrollProgress - 0.3) / 0.7;

                    // Add immediate scroll responsiveness to about content
                    if (combinedProgress <= 0.75) {
                        // Show about part with immediate scroll response
                        const aboutScrollOffset = Math.min(combinedProgress * 30, 25); // More responsive scroll effect
                        if (aboutPart) aboutPart.style.transform = `translateY(-${aboutScrollOffset}vh)`;
                        if (projectsPart) projectsPart.style.transform = 'translateY(50vh)';
                    } else {
                        // Transition to projects part
                        const transitionProgress = (combinedProgress - 0.75) / 0.25;
                        if (aboutPart) aboutPart.style.transform = `translateY(-${25 + (transitionProgress * 75)}vh)`;
                        if (projectsPart) projectsPart.style.transform = `translateY(${50 - (transitionProgress * 50)}vh)`;
                    }
                }
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

// Slow down animation uniformly
function animate(time) {
    render((time / 1000) * 0.25);
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

// Update navigation click handlers for combined section
document.querySelector('a[href="#about"]').addEventListener('click', function (e) {
    e.preventDefault();
    const maxScroll = getMaxScroll();
    const targetScroll = maxScroll * 0.4; // Start of about section

    window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
    });
});

document.querySelector('a[href="#projects"]').addEventListener('click', function (e) {
    e.preventDefault();
    const maxScroll = getMaxScroll();
    const targetScroll = maxScroll * 0.85; // Start of projects section - later in scroll

    window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
    });
});

// Smooth scroll functionality for home section
document.querySelector('a[href="#home"]').addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
        duration: 2000
    });
});

// Initialize falling prisms when combined section becomes visible
const combinedSection = document.querySelector('.combined-section');
let fallingPrismsInstance = null;
let projectsPrismsInstance = null;

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Initialize falling prisms for about section
            if (!fallingPrismsInstance) {
                fallingPrismsInstance = new FallingPrisms('falling-prisms-container');
            }
            // Initialize projects prisms for projects section
            if (!projectsPrismsInstance) {
                projectsPrismsInstance = new ProjectsPrisms('projects-prisms-container');
            }
        }
    });
}, { threshold: 0.1 });

observer.observe(combinedSection);

// Add smooth scrolling within the combined section
let isScrolling = false;

combinedSection.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            // Add any scroll-based animations here if needed
            isScrolling = false;
        });
        isScrolling = true;
    }
});

// Add scroll hint functionality
document.addEventListener('DOMContentLoaded', () => {
    const scrollHint = document.querySelector('.about-scroll-hint');

    if (scrollHint) {
        // Hide scroll hint after user starts scrolling in combined section
        let hintHidden = false;

        const hideScrollHint = () => {
            if (!hintHidden) {
                scrollHint.style.opacity = '0';
                scrollHint.style.transform = 'translateY(20px)';
                hintHidden = true;
            }
        };

        // Hide hint when user scrolls within combined section
        combinedSection.addEventListener('scroll', hideScrollHint);

        // Also hide after a few seconds
        setTimeout(hideScrollHint, 5000);
    }
});

// Enhanced navigation with section awareness
const updateActiveNavigation = () => {
    const navLinks = document.querySelectorAll('.navbar-menu a');
    const scrollMax = getMaxScroll();
    const currentProgress = Math.min(1, window.scrollY / scrollMax);

    // Remove active class from all links
    navLinks.forEach(link => link.classList.remove('active'));

    // Add active class based on scroll progress
    if (currentProgress <= 0.3) {
        document.querySelector('a[href="#home"]')?.classList.add('active');
    } else if (currentProgress <= 0.82) {
        document.querySelector('a[href="#about"]')?.classList.add('active');
    } else {
        document.querySelector('a[href="#projects"]')?.classList.add('active');
    }
};

// Add to existing scroll listener
window.addEventListener('scroll', updateActiveNavigation);

// Add CSS for active navigation state if not already present
const style = document.createElement('style');
style.textContent = `
    .navbar-menu a.active {
        color: #ff0000 !important;
        text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
    }
    
    .about-scroll-hint {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 10;
        opacity: 0.7;
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .scroll-hint-text {
        font-family: 'Playwrite AU SA', serif;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 0.5rem;
        text-align: center;
    }
    
    .scroll-hint-arrow {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .scroll-hint-arrow span {
        display: block;
        width: 15px;
        height: 15px;
        border-bottom: 2px solid rgba(255, 255, 255, 0.6);
        border-right: 2px solid rgba(255, 255, 255, 0.6);
        transform: rotate(45deg);
        margin: -5px;
        animation: hint-bounce 2s infinite;
    }
    
    .scroll-hint-arrow span:nth-child(2) {
        animation-delay: -0.2s;
    }
    
    .scroll-hint-arrow span:nth-child(3) {
        animation-delay: -0.4s;
    }
    
    @keyframes hint-bounce {
        0% {
            opacity: 0;
            transform: rotate(45deg) translate(-10px, -10px);
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
            transform: rotate(45deg) translate(10px, 10px);
        }
    }
    
    @media (max-width: 768px) {
        .about-scroll-hint {
            top: 10px;
            right: 10px;
        }
        
        .scroll-hint-text {
            font-size: 0.8rem;
        }
        
        .scroll-hint-arrow span {
            width: 12px;
            height: 12px;
        }
    }
`;
document.head.appendChild(style);