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
    Vector3
} from 'https://unpkg.com/three@0.121.1/build/three.module.js';

class FallingPrisms {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.prisms = [];
        this.mouse = new Vector2();
        this.raycaster = new Raycaster();
        this.init();
        
        // Start animation immediately
        this.prisms.forEach(prism => {
            prism.position.y = (Math.random() - 0.5) * 20;
            prism.userData.velocity.y = -0.05 - Math.random() * 0.05;
        });
    }

    init() {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 15;
        this.camera.position.y = 5;
        this.camera.lookAt(0, 0, 0);

        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        const directionalLight = new DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        const ambientLight = new AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        this.createPrisms();

        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (event) => this.onMouseMove(event));

        this.animate();
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
            
            // Distribute prisms across viewport initially
            prism.position.x = (Math.random() - 0.5) * 20;
            prism.position.y = (Math.random() - 0.5) * 20;
            prism.position.z = (Math.random() - 0.5) * 20;
            
            prism.rotation.x = Math.random() * Math.PI;
            prism.rotation.y = Math.random() * Math.PI;
            
            prism.userData.velocity = new Vector3(0, -0.05 - Math.random() * 0.05, 0);
            prism.userData.originalY = prism.position.y;
            
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

    animate() {
        requestAnimationFrame(() => this.animate());

        this.raycaster.setFromCamera(this.mouse, this.camera);

        this.prisms.forEach(prism => {
            prism.position.add(prism.userData.velocity);

            if (prism.position.y < -20) {
                prism.position.y = 20;
                prism.userData.velocity.y = -0.05 - Math.random() * 0.05;
            }

            const intersects = this.raycaster.intersectObject(prism);
            if (intersects.length > 0) {
                prism.userData.velocity.y = 0.5;
                prism.rotation.x += 0.1;
                prism.rotation.y += 0.1;
            }

            prism.rotation.x += 0.001;
            prism.rotation.y += 0.001;
        });

        this.renderer.render(this.scene, this.camera);
    }
}

export default FallingPrisms;