class HoverEffect {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'hover-effect-container';
        document.body.appendChild(this.container);
        
        this.viewButton = document.createElement('div');
        this.viewButton.id = 'view-button';
        
        const eyeIcon = document.createElement('img');
        eyeIcon.src = './assets/images/eye.png';
        eyeIcon.alt = 'View';
        eyeIcon.style.width = '100%';
        eyeIcon.style.height = '100%';
        eyeIcon.style.objectFit = 'contain';
        
        this.viewButton.appendChild(eyeIcon);
        this.viewButton.style.display = 'flex';
        this.viewButton.style.alignItems = 'center';
        this.viewButton.style.justifyContent = 'center';
        this.viewButton.style.position = 'fixed';
        
        document.body.appendChild(this.viewButton);
        
        this.mouse = new THREE.Vector2();
        this.previousMousePosition = new THREE.Vector2();
        this.currentTexture = null;
        this.nextTexture = null;
        this.transitionProgress = 0;
        
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
        this.geometry = new THREE.PlaneGeometry(3.5, 2, 1000, 300);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uCurrentTexture: { value: null },
                uNextTexture: { value: null },
                uProgress: { value: 0.0 },
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
                    
                    pos.x += sin(uv.y * 2.0) * uOffset.x * (0.5 + wave);
                    pos.y += sin(uv.x * 4.0) * uOffset.y * (0.5 + wave2);
                    pos.z += sin(uv.x * 2.0 + uv.y * 2.0) * uIntensity * 0.1;
        
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uCurrentTexture;
                uniform sampler2D uNextTexture;
                uniform float uProgress;
                uniform float uTime;
                uniform float uAlpha;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;
                    
                    vec4 currentTex = texture2D(uCurrentTexture, uv);
                    vec4 nextTex = texture2D(uNextTexture, uv);
                    
                    // Simple linear interpolation between textures
                    vec4 finalColor = mix(currentTex, nextTex, uProgress);
                    
                    gl_FragColor = vec4(finalColor.rgb, finalColor.a * uAlpha);
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
        
        const experienceItems = document.querySelectorAll('.experience-item');
        experienceItems.forEach(item => {
            const experienceId = item.dataset.experience;
            const imgElement = document.getElementById(`${experienceId}-img`);
            if (imgElement) {
                this.textures[experienceId] = this.textureLoader.load(imgElement.src);
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
        const experienceItems = document.querySelectorAll('.experience-item');

        experienceItems.forEach(item => {
            const experienceId = item.dataset.experience;

            item.addEventListener('mouseenter', () => {
                if (this.textures[experienceId]) {
                    this.showImage(this.textures[experienceId]);
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
        if (this.material.uniforms.uCurrentTexture.value === null) {
            // First image
            this.material.uniforms.uCurrentTexture.value = texture;
            this.material.uniforms.uNextTexture.value = texture;
        } else {
            // Transition to new image
            this.material.uniforms.uCurrentTexture.value = this.material.uniforms.uNextTexture.value;
            this.material.uniforms.uNextTexture.value = texture;
            
            // Reset and start transition
            gsap.to(this.material.uniforms.uProgress, {
                value: 1,
                duration: 0.5,  // Daha hızlı geçiş
                ease: "power2.inOut",
                onComplete: () => {
                    this.material.uniforms.uProgress.value = 0;
                    this.material.uniforms.uCurrentTexture.value = texture;
                }
            });
        }
        
        gsap.to(this.material.uniforms.uAlpha, { value: 1, duration: 0.3 });
        gsap.to(this.material.uniforms.uIntensity, { value: 0.5, duration: 0.3 });
        this.viewButton.style.opacity = '1';
        this.viewButton.style.transform = `translate(${this.mouse.x - 20}px, ${this.mouse.y - 20}px) scale(1)`;
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
            x: (e.clientX - this.previousMousePosition.x + 0.02) * 0.04,
            y: (e.clientY - this.previousMousePosition.y + 0.02) * 0.02
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