class HoverEffect {
    constructor() {
        //full-page container for the canvas
        this.container = document.createElement('div');
        this.container.className = 'hover-effect-container';
        document.body.appendChild(this.container);
        
        //view button
        this.viewButton = document.createElement('div');
        this.viewButton.id = 'view-button';
        this.viewButton.textContent = 'view';
        document.body.appendChild(this.viewButton);
        
        this.mouse = new THREE.Vector2();
        this.previousMousePosition = new THREE.Vector2();
        this.setupScene();
        this.createPlane();
        this.setupTextures();
        this.addEventListeners();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.container.style.zIndex = "1";

        const fov = 45;
        const planeAspectRatio = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(fov, planeAspectRatio, 0.1, 1000);
        this.camera.position.z = 10;

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }

    createPlane() {
        this.geometry = new THREE.PlaneGeometry(4, 3, 1000, 300);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: null },
                uOffset: { value: new THREE.Vector2(0.0, 0.0) },
                uAlpha: { value: 0.0 },
                uTime: { value: 0 },
                uIntensity: { value: 0.0 }
            },
            vertexShader: `
                uniform vec2 uOffset;
                uniform float uTime;
                uniform float uIntensity;
                varying vec2 vUv;
        
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    float wave = sin(uv.y * 5.0 + uTime) * uIntensity;
                    float wave2 = sin(uv.x * 5.0 - uTime * 0.5) * uIntensity;
                    
                    pos.x += sin(uv.y * 10.0) * uOffset.x * (0.5 + wave);
                    pos.y += sin(uv.x * 20.0) * uOffset.y * (0.5 + wave2);
                    pos.z += sin(uv.x * 2.0 + uv.y * 2.0) * uIntensity * 0.1;
        
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                uniform float uAlpha;
                varying vec2 vUv;
        
                void main() {
                    vec4 tex = texture2D(uTexture, vUv);
                    gl_FragColor = vec4(tex.rgb, tex.a * uAlpha);
                }
            `,
            transparent: true
        });

        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    setupTextures() {
        this.textureLoader = new THREE.TextureLoader();
        this.textures = {};
        
        // Load all project textures
        const projectItems = document.querySelectorAll('.project-item');
        projectItems.forEach(item => {
            const projectId = item.dataset.project;
            const imgElement = document.getElementById(`${projectId}-img`);
            if (imgElement) {
                this.textures[projectId] = this.textureLoader.load(imgElement.src);
            }
        });
    }

    mouseToScene(mouseX, mouseY) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((mouseX - rect.left) / rect.width) * 2 - 1;
        const y = -((mouseY - rect.top) / rect.height) * 2 + 1;

        const vector = new THREE.Vector3(x, y, 0);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

        return pos;
    }

    addEventListeners() {
        const projectItems = document.querySelectorAll('.project-item');

        projectItems.forEach(item => {
            const projectId = item.dataset.project;

            item.addEventListener('mouseenter', () => {
                if (this.textures[projectId]) {
                    this.showImage(this.textures[projectId]);
                }
            });

            item.addEventListener('mouseleave', () => {
                this.hideImage();
            });
        });

        document.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
        });
    }

    showImage(texture) {
        this.material.uniforms.uTexture.value = texture;
        gsap.to(this.material.uniforms.uAlpha, { value: 1, duration: 0.3 });
        gsap.to(this.material.uniforms.uIntensity, { value: 0.5, duration: 0.3 });
        this.viewButton.style.opacity = '1';
        this.viewButton.style.transform = `translate(${this.mouse.x - 40}px, ${this.mouse.y - 40}px) scale(1)`;
    }

    hideImage() {
        gsap.to(this.material.uniforms.uAlpha, { value: 0, duration: 0.3 });
        gsap.to(this.material.uniforms.uIntensity, { value: 0, duration: 0.3 });
        this.viewButton.style.opacity = '0';
        this.viewButton.style.transform = `translate(${this.mouse.x - 40}px, ${this.mouse.y - 40}px) scale(0)`;
    }

    updateMousePosition(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        
        const pos = this.mouseToScene(e.clientX, e.clientY);
        
        gsap.to(this.plane.position, {
            x: pos.x,
            y: pos.y,
            duration: 0.3,
            ease: 'power2.out'
        });

        this.viewButton.style.transform = `translate(${e.clientX - 40}px, ${e.clientY - 40}px) scale(${this.viewButton.style.opacity === '0' ? '0' : '1'})`;
        this.viewButton.style.left = '0';
        this.viewButton.style.top = '0';

        const velocity = {
            x: (e.clientX - this.previousMousePosition.x+0.002) * 0.04,
            y: (e.clientY - this.previousMousePosition.y+0.002) * 0.02
        };

        gsap.to(this.material.uniforms.uOffset.value, {
            x: velocity.x,
            y: velocity.y,
            duration: 0.1
        });

        this.previousMousePosition.x = e.clientX;
        this.previousMousePosition.y = e.clientY;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (this.material) {
            this.material.uniforms.uTime.value += 0.08;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize effect when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HoverEffect();
});