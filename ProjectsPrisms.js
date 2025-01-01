// ProjectsPrisms.js
import {
    Scene,
    WebGLRenderer,
    PerspectiveCamera,
    BoxGeometry,
    MeshStandardMaterial,
    LineSegments,
    EdgesGeometry,
    LineBasicMaterial,
    Mesh,
    DirectionalLight,
    AmbientLight,
    Raycaster,
    Vector2,
    Vector3,
    Box3,
    Plane,
    PlaneGeometry
} from 'https://unpkg.com/three@0.121.1/build/three.module.js';

class ProjectsPrisms {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.prisms = [];
        this.mouse = new Vector2();
        this.raycaster = new Raycaster();
        this.floorY = -10;
        this.init();
        this.setupVisibilityObserver();
        // Immediately start the animation if projects section is visible
        const projectsSection = document.querySelector('.projects-section');
        if (projectsSection && projectsSection.classList.contains('active')) {
            this.resetPrisms();
        }
    }

    setupVisibilityObserver() {
        // Create an Intersection Observer to watch the projects section
        const projectsSection = document.querySelector('.projects-section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.resetPrisms();
                }
            });
        }, { threshold: 0.1 });

        if (projectsSection) {
            observer.observe(projectsSection);
        }
    }

    init() {
        // Scene setup
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 15;
        this.camera.position.y = 5;
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const directionalLight = new DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        const ambientLight = new AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // Add invisible floor plane for collision
        const floorGeometry = new PlaneGeometry(50, 50);
        const floorMaterial = new MeshStandardMaterial({ 
            visible: false,
            transparent: true,
            opacity: 0 
        });
        this.floor = new Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.position.y = this.floorY;
        this.scene.add(this.floor);

        // Create initial prisms
        this.createPrisms();

        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (event) => this.onMouseMove(event));

        // Start animation
        this.animate();
    }

    resetPrisms() {
        // Remove existing prisms
        this.prisms.forEach(prism => {
            this.scene.remove(prism);
        });
        this.prisms = [];

        // Create new prisms
        this.createPrisms();
    }

    createPrisms() {
        const geometry = new BoxGeometry(1, 2, 1);
        const material = new MeshStandardMaterial({ 
            color: 0x000000,
            metalness: 0.1,
            roughness: 0.8
        });

        const edgesGeometry = new EdgesGeometry(geometry);
        const edgesMaterial = new LineBasicMaterial({ 
            color: 0xffffff,
            linewidth: 1
        });

        for (let i = 0; i < 50; i++) {
            const prism = new Mesh(geometry, material);
            const edges = new LineSegments(edgesGeometry, edgesMaterial);
            prism.add(edges);

            // Start positions spread out above the scene
            prism.position.x = (Math.random() - 0.5) * 20;
            prism.position.y = Math.random() * 30 + 20; // Start higher up
            prism.position.z = (Math.random() - 0.5) * 20;

            prism.rotation.x = Math.random() * Math.PI;
            prism.rotation.y = Math.random() * Math.PI;

            // Physics properties
            prism.userData.velocity = new Vector3(
                0,
                -0.05 - Math.random() * 0.05,
                0
            );
            prism.userData.angularVelocity = new Vector3(
                Math.random() * 0.02 - 0.01,
                Math.random() * 0.02 - 0.01,
                Math.random() * 0.02 - 0.01
            );
            prism.userData.settled = false;

            this.prisms.push(prism);
            this.scene.add(prism);
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    checkCollisions(prism) {
        // Floor collision
        if (prism.position.y - 1 <= this.floorY && !prism.userData.settled) {
            prism.position.y = this.floorY + 1;
            prism.userData.velocity.y = 0;
            prism.userData.settled = true;
            
            // Add some random horizontal movement on impact
            prism.userData.velocity.x = (Math.random() - 0.5) * 0.1;
            prism.userData.velocity.z = (Math.random() - 0.5) * 0.1;
        }

        // Boundary collisions
        const bounds = 10;
        if (Math.abs(prism.position.x) > bounds) {
            prism.position.x = Math.sign(prism.position.x) * bounds;
            prism.userData.velocity.x *= -0.5;
        }
        if (Math.abs(prism.position.z) > bounds) {
            prism.position.z = Math.sign(prism.position.z) * bounds;
            prism.userData.velocity.z *= -0.5;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Find intersected prisms
        const intersects = this.raycaster.intersectObjects(this.prisms);

        this.prisms.forEach(prism => {
            // Apply physics
            prism.position.add(prism.userData.velocity);
            prism.rotation.x += prism.userData.angularVelocity.x;
            prism.rotation.y += prism.userData.angularVelocity.y;
            prism.rotation.z += prism.userData.angularVelocity.z;

            // Check collisions
            this.checkCollisions(prism);

            // Apply friction when settled
            if (prism.userData.settled) {
                prism.userData.velocity.x *= 0.95;
                prism.userData.velocity.z *= 0.95;
                prism.userData.angularVelocity.multiplyScalar(0.95);
            } else {
                // Apply gravity
                prism.userData.velocity.y -= 0.002;
            }

            // Mouse interaction
            const isIntersected = intersects.some(intersect => intersect.object === prism);
            if (isIntersected) {
                // Add upward and random horizontal force
                prism.userData.velocity.y = 0.2;
                prism.userData.velocity.x += (Math.random() - 0.5) * 0.2;
                prism.userData.velocity.z += (Math.random() - 0.5) * 0.2;
                prism.userData.settled = false;

                // Add rotation
                prism.userData.angularVelocity.set(
                    Math.random() * 0.1 - 0.05,
                    Math.random() * 0.1 - 0.05,
                    Math.random() * 0.1 - 0.05
                );
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}

export default ProjectsPrisms;