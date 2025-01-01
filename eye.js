import * as THREE from 'https://cdn.skypack.dev/three@0.133.1/build/three.module';
import { TextGeometry } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/loaders/FontLoader.js';

class EyeAnimation {
    constructor() {
        // Create container for the eye
        this.container = document.createElement('div');
        this.container.className = 'eye-container';
        
        // Find the 'o' in discover and add eye anchor
        const discoverText = document.querySelector('.eye-text');
        const eyeAnchor = document.createElement('div');
        eyeAnchor.className = 'eye-anchor';
        discoverText.appendChild(eyeAnchor);
        eyeAnchor.appendChild(this.container);

        // Setup Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(450, 450);
        this.container.appendChild(this.renderer.domElement);

        // Create eye geometry
        this.createEye();
        
        // Load font and create text
        this.loadText();
        
        // Setup camera
        this.camera.position.z = 5;
        
        // Initialize mouse tracking
        this.mouse = { x: 0, y: 0 };
        this.setupEventListeners();
        
        // Start animation loop
        this.animate();
    }

    loadText() {
        const loader = new FontLoader();
        loader.load('https://cdn.skypack.dev/three@0.133.1/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const textGeometry = new TextGeometry('by umut baybece', {
                font: font,
                size: 0.2,
                height: 0.05,
                curveSegments: 12,
                bevelEnabled: false
            });

            const textMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xffffff    
             });

            this.text = new THREE.Mesh(textGeometry, textMaterial);
            
            // Center the text
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            this.text.position.set(-textWidth/2, -1.2, 1);
            
            // Add text to eyeball so it moves with it
            this.eyeball.add(this.text);
        });
                // update text transparency based on scroll position 
        document.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            const textOpacity = 0.3 - Math.min(scrollPosition / 100, 1);
            this.text.material.opacity = textOpacity;
        }
        );
                


    }

    createEye() {
        // Create eye geometry
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0x333333,
            shininess: 30,
            flatShading: false
        });
        this.eyeball = new THREE.Mesh(geometry, material);
        
        // Create iris
        const irisGeometry = new THREE.CircleGeometry(0.5, 32);
        const irisMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            specular: 0x333333,
            shininess: 0
        });
        this.iris = new THREE.Mesh(irisGeometry, irisMaterial);
        this.iris.position.z = 0.9;
        
        // Create pupil
        const pupilGeometry = new THREE.CircleGeometry(0.24, 32);
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.pupil.position.z = 1;

        // Add lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 2);
        this.scene.add(light);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add meshes to scene
        this.eyeball.add(this.iris);
        this.eyeball.add(this.pupil);
        this.scene.add(this.eyeball);
    }

    setupEventListeners() {
        document.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            this.mouse.x = (e.clientX - centerX) / window.innerWidth;
            this.mouse.y = -(e.clientY - centerY) / window.innerHeight;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // eye gets blurry when scrolling
        const scrollPosition = window.scrollY;
        // and transparent when scrolling
        const transparency = 1 - Math.min(scrollPosition / 100, 1);
        this.eyeball.material.opacity = transparency;
        this.iris.material.opacity = transparency;
        this.pupil.material.opacity = transparency;
        // on top of that, the eye gets smaller when scrolling
        const eyeScale = 1 - Math.min(scrollPosition / 400, 1);
        this.eyeball.scale.set(eyeScale, eyeScale, eyeScale);


        


        // Update eye pupil scale based on scroll position
        const pupilScale = 1 + Math.min(scrollPosition / 100, 1);
        this.pupil.scale.set(pupilScale, pupilScale, 1);

        // Update eye iris scale based on scroll position
        const irisScale = 1.2 + Math.min(scrollPosition / 100, 1);
        this.iris.scale.set(irisScale, irisScale, 1);



        // Update pupil position based on mouse position
        const targetX = this.mouse.x * 0.3;
        const targetY = this.mouse.y * 0.3;
        this.pupil.position.x = targetX;
        this.pupil.position.y = targetY;

        
        // Update eye rotation based on mouse position
        const targetRotationX = this.mouse.y * Math.PI / -4;
        const targetRotationY = this.mouse.x * Math.PI / 4;
        
        this.eyeball.rotation.x += (targetRotationX - this.eyeball.rotation.x) * 0.1;
        this.eyeball.rotation.y += (targetRotationY - this.eyeball.rotation.y) * 0.1;
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the eye animation when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EyeAnimation();
});