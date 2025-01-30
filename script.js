class HoverEffect {
    constructor() {
        this.container = document.querySelector('.hero');
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
        // Increase segments for smoother distortion
        this.geometry = new THREE.PlaneGeometry(3,2, 900, 800);
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
            
            // Enhanced distortion effect
            float wave = sin(uv.y * 5.0 + uTime) * uIntensity;
            float wave2 = sin(uv.x * 3.0 - uTime * 0.5) * uIntensity;
            
            pos.x += sin(uv.y * 10.0) * uOffset.x * (0.5 + wave);
            pos.y += sin(uv.x * 10.0) * uOffset.y * (0.5 + wave2);
            pos.z += sin(uv.x * 8.0 + uv.y * 8.0) * uIntensity * 0.1;
  
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
        const textureLoader = new THREE.TextureLoader();

        this.passionTexture = textureLoader.load(
            document.getElementById('passion-img').src
        );

        this.professionTexture = textureLoader.load(
            document.getElementById('profession-img').src
        );
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
        const passionText = document.getElementById('passion');
        const professionText = document.getElementById('profession');

        passionText.addEventListener('mouseenter', (e) => {
            this.material.uniforms.uTexture.value = this.passionTexture;
            gsap.to(this.material.uniforms.uAlpha, {
                value: 1,
                duration: 0.3
            });
            gsap.to(this.material.uniforms.uIntensity, {
                value: 0.5,
                duration: 0.3
            });
        });

        professionText.addEventListener('mouseenter', (e) => {
            this.material.uniforms.uTexture.value = this.professionTexture;
            gsap.to(this.material.uniforms.uAlpha, {
                value: 1,
                duration: 0.3
            });
            gsap.to(this.material.uniforms.uIntensity, {
                value: 0.5,
                duration: 0.3
            });
        });

        [passionText, professionText].forEach(element => {
            element.addEventListener('mouseleave', () => {
                gsap.to(this.material.uniforms.uAlpha, {
                    value: 0,
                    duration: 0.3
                });
                gsap.to(this.material.uniforms.uIntensity, {
                    value: 0,
                    duration: 0.3
                });
            });
        });

        let isMoving = false;
        let moveTimeout;

        document.addEventListener('mousemove', (e) => {
            this.previousMousePosition.x = this.mouse.x;
            this.previousMousePosition.y = this.mouse.y;

            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            // Calculate velocity with increased effect
            const velocity = {
                x: (this.mouse.x - this.previousMousePosition.x) * 0.015,
                y: (this.mouse.y - this.previousMousePosition.y) * 0.015
            };

            // Update plane position
            const pos = this.mouseToScene(e.clientX, e.clientY);
            gsap.to(this.plane.position, {
                x: pos.x,
                y: pos.y,
                duration: 0.3,
                ease: 'power2.out'
            });

            // Enhanced distortion effect based on velocity
            gsap.to(this.material.uniforms.uOffset.value, {
                x: velocity.x,
                y: velocity.y,
                duration: 0.3
            });

            // Increase intensity during movement
            if (!isMoving) {
                isMoving = true;
                gsap.to(this.material.uniforms.uIntensity, {
                    value: 0.8,
                    duration: 0.2
                });
            }

            // Reset timeout
            clearTimeout(moveTimeout);
            moveTimeout = setTimeout(() => {
                isMoving = false;
                gsap.to(this.material.uniforms.uIntensity, {
                    value: 0.5,
                    duration: 0.5
                });
            }, 100);
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Update time uniform for continuous wave animation
        if (this.material) {
            this.material.uniforms.uTime.value += 0.01;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize effect when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HoverEffect();
});