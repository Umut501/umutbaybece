// First, replace the video-background div with a canvas
document.querySelector('.video-background').innerHTML = '<canvas id="distortion-canvas"></canvas>';
class LiquidDistortionEffect {
    constructor() {
        this.container = document.querySelector('.video-background');
        this.homeSection = document.querySelector('.home-section');
        this.canvas = document.getElementById('distortion-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2(0.5, 0.5);
        this.mouseTarget = new THREE.Vector2(0.5, 0.5);
        this.lastMousePos = new THREE.Vector2(0.5, 0.5);
        this.mouseVelocity = new THREE.Vector2(0, 0);
        this.lastTime = 0;
        this.trailPoints = [];
        this.maxTrailPoints = 10;
        this.cursor = null;
        
        this.init();
        this.setupCursor();
    }

    setupCursor() {
        // Create custom cursor style
        const style = document.createElement('style');
        style.textContent = `
            .home-section {
                cursor: none !important;
            }
            .custom-cursor {
                position: fixed;
                width: 50px;
                height: 50px;
                pointer-events: none;
                z-index: 9999;
                font-size: 30px;
                transform: translate(-50%, -50%);
                transition: transform 0.1s ease, opacity 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 1;
            }
        `;
        document.head.appendChild(style);

        // Create cursor element
        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        this.cursor.innerHTML = '<img style="max-height:200px;" src="assets/images/flamingo.png" alt="Pool Float Giant Flamingo">';
        document.body.appendChild(this.cursor);

        // Update cursor position
        window.addEventListener('mousemove', (e) => {
            if (this.cursor) {
                this.cursor.style.left = e.clientX + 'px';
                this.cursor.style.top = e.clientY + 'px';
            }
        });

        // Handle scroll
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            const homeHeight = this.homeSection.offsetHeight;
            
            if (scrollPosition > homeHeight -700) { // Adding a small threshold
                if (this.cursor) {
                    this.cursor.style.opacity = '0';
                }
            } else {
                if (this.cursor) {
                    this.cursor.style.opacity = '1';
                }
            }
        });

        // Initial check
        const initialScroll = window.scrollY;
        const homeHeight = this.homeSection.offsetHeight;
        if (initialScroll > homeHeight - 100) {
            this.cursor.style.opacity = '0';
        }
    }
    isMouseInHomeSection() {
        const rect = this.homeSection.getBoundingClientRect();
        const mouseX = this.mouse.x;
        const mouseY = this.mouse.y;
        
        return (
            mouseX >= rect.left &&
            mouseX <= rect.right &&
            mouseY >= rect.top &&
            mouseY <= rect.bottom
        );
    }
    updateCursor(e) {
        if (this.cursor) {
            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';
            
            // Update cursor visibility based on position
            if (this.isMouseInHomeSection()) {
                this.cursor.style.opacity = '1';
            } else {
                this.cursor.style.opacity = '0';
            }
        }
    }
    init() {
        this.camera.position.z = 1;
        
        // Create video texture
        const video = document.createElement('video');
        video.src = 'assets/images/banner.mp4';
        video.loop = true;
        video.muted = true;
        video.playbackRate = 0.5;
        video.play();
        
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        // Create shader material
        const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: videoTexture },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                uMouseVelocity: { value: new THREE.Vector2(0, 0) },
                uTrailPoints: { value: new Float32Array(20) }, // 10 points × 2 coordinates
                uTrailCount: { value: 0 },
                uRadius: { value: 0.15 },
                uStrength: { value: 0.4 }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                uniform float uTime;
                uniform vec2 uMouse;
                uniform vec2 uMouseVelocity;
                uniform float uTrailPoints[20];
                uniform int uTrailCount;
                uniform float uRadius;
                uniform float uStrength;
                
                varying vec2 vUv;

                vec2 rotate2D(vec2 v, float a) {
                    float s = sin(a);
                    float c = cos(a);
                    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
                }

                float circle(vec2 uv, vec2 center, float radius, float softness) {
                    float d = length(uv - center);
                    return smoothstep(radius, radius * (1.0 - softness), d);
                }
                
                void main() {
                    vec2 uv = vUv;
                    float velocity = length(uMouseVelocity);
                    
                    // Initialize distortion
                    vec2 totalDistortion = vec2(0.0);
                    float totalInfluence = 2.0;
                    
                    // Main cursor distortion
                    float mainMask = circle(uv, uMouse, uRadius * (8.0 + velocity * 4.0), 0.5);
                    vec2 toCenter = uv - uMouse;
                    float angle = atan(toCenter.y, toCenter.x);
                    float wobble = sin(angle * 6.0 + uTime * 4.0) * 0.02 * (1.0 + velocity);
                    
                    vec2 mainDistortion = vec2(
                        cos(angle) * wobble,
                        sin(angle) * wobble
                    ) * uStrength * mainMask * (1.0 + velocity * 2.0);
                    
                    totalDistortion += mainDistortion;
                    totalInfluence += mainMask;
                    
                    // Trail distortions
                    for(int i = 0; i < 20; i += 2) {
                        if(i/2 >= uTrailCount) break;
                        
                        vec2 trailPos = vec2(uTrailPoints[i], uTrailPoints[i+1]);
                        float trailMask = circle(uv, trailPos, uRadius * 0.7, 0.5) * 0.5;
                        
                        vec2 toTrail = uv - trailPos;
                        float trailAngle = atan(toTrail.y, toTrail.x);
                        float trailWobble = sin(trailAngle * 4.0 + uTime * 3.0) * 0.015;
                        
                        vec2 trailDistortion = vec2(
                            cos(trailAngle) * trailWobble,
                            sin(trailAngle) * trailWobble
                        ) * uStrength * trailMask;
                        
                        totalDistortion += trailDistortion;
                        totalInfluence += trailMask;
                    }
                    
                    // Apply final distortion
                    vec2 finalUV = uv - totalDistortion;
                    gl_FragColor = texture2D(uTexture, finalUV);
                }
            `
        });

        // Create mesh
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, shaderMaterial);
        this.scene.add(mesh);
        
        // Add event listeners
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));
        this.onResize();
        
        // Start animation
        this.animate();
    }

    updateTrailPoints() {
        // Add new point
        this.trailPoints.unshift({
            x: this.mouse.x,
            y: this.mouse.y,
            life: 1.0
        });

        // Remove excess points
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.pop();
        }

        // Update life and remove dead points
        this.trailPoints = this.trailPoints.filter(point => {
            point.life *= 0.95;
            return point.life > 0.01;
        });

        // Update shader uniform
        const trailArray = new Float32Array(20); // 10 points × 2 coordinates
        this.trailPoints.forEach((point, i) => {
            if (i < 10) {
                trailArray[i * 2] = point.x;
                trailArray[i * 2 + 1] = point.y;
            }
        });

        const material = this.scene.children[0].material;
        material.uniforms.uTrailPoints.value = trailArray;
        material.uniforms.uTrailCount.value = Math.min(this.trailPoints.length, 10);
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.lastMousePos.copy(this.mouseTarget);
        
        this.mouseTarget.x = (event.clientX - rect.left) / rect.width;
        this.mouseTarget.y = 1.0 - (event.clientY - rect.top) / rect.height;
        
        if (deltaTime > 0) {
            this.mouseVelocity.x = (this.mouseTarget.x - this.lastMousePos.x) / deltaTime;
            this.mouseVelocity.y = (this.mouseTarget.y - this.lastMousePos.y) / deltaTime;
        }

        gsap.to(this.mouse, {
            x: this.mouseTarget.x,
            y: this.mouseTarget.y,
            duration: 0.3,
            ease: "power2.out",
            onUpdate: () => {
                const material = this.scene.children[0].material;
                material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
                material.uniforms.uMouseVelocity.value.set(
                    this.mouseVelocity.x * 0.1,
                    this.mouseVelocity.y * 0.1
                );
            }
        });
    }

    onResize() {
        const { width, height } = this.container.getBoundingClientRect();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const elapsedTime = this.clock.getElapsedTime();
        this.scene.children[0].material.uniforms.uTime.value = elapsedTime;
        
        this.mouseVelocity.multiplyScalar(0.95);
        this.updateTrailPoints();
        
        this.renderer.render(this.scene, this.camera);
    }
    cleanup() {
        // Remove event listeners
        window.removeEventListener('scroll', this.handleScroll);
        
        // Disconnect intersection observer
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Remove any remaining effects
        this.hideImage();
        
        // Clean up Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.geometry) {
            this.geometry.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
        
        // Remove DOM elements
        if (this.container) {
            this.container.remove();
        }
        if (this.viewButton) {
            this.viewButton.remove();
        }
    }
}
class HoverEffect {
    constructor() {
        // Create container for the effect
        this.container = document.createElement('div');
        this.container.className = 'hover-effect-container';
        document.body.appendChild(this.container);
        
        // Create view button
        this.viewButton = document.createElement('div');
        this.viewButton.id = 'view-button';
        this.viewButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            width: 80px;
            height: 80px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            z-index: 9999;
        `;
        
        // Add eye icon to view button
        const eyeIcon = document.createElement('img');
        eyeIcon.src = './assets/images/eye.png';
        eyeIcon.alt = 'View';
        eyeIcon.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
        this.viewButton.appendChild(eyeIcon);
        document.body.appendChild(this.viewButton);
        
        // Initialize properties
        this.mouse = new THREE.Vector2();
        this.previousMousePosition = new THREE.Vector2();
        this.activeTexture = null;
        this.targetOpacity = 0;
        this.currentOpacity = 0;
        this.opacityLerpFactor = 0.15;
        this.minOpacity = 0.8;
        
        // Mouse tracking properties
        this.mouseVelocity = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.lastMouseTime = performance.now();
        this.velocityThreshold = 1.5;
        
        // Active item tracking
        this.activeItem = null;
        this.isHovering = false;
        
        // Setup scene and start animation
        this.setupScene();
        this.createPlane();
        this.setupTextures();
        this.addEventListeners();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;';

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

        // Handle window resize
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
        this.geometry = new THREE.PlaneGeometry(3.5, 2, 32, 32);
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
                    pos.y += sin(uv.x * 2.0) * uOffset.y * (0.5 + wave2);
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
            if (imgElement && imgElement.src) {
                this.textures[experienceId] = this.textureLoader.load(imgElement.src);
            }
        });
    }

    addEventListeners() {
        const experienceItems = document.querySelectorAll('.experience-item');
        
        experienceItems.forEach(item => {
            const experienceId = item.dataset.experience;
            
            item.addEventListener('mouseenter', (e) => {
                if (this.textures[experienceId]) {
                    this.isHovering = true;
                    this.showImage(this.textures[experienceId]);
                    this.activeItem = item;
                }
            });

            item.addEventListener('mouseleave', (e) => {
                // Check for rapid movement
                if (Math.abs(this.mouseVelocity.x) > this.velocityThreshold || 
                    Math.abs(this.mouseVelocity.y) > this.velocityThreshold) {
                    this.forceHideImage();
                } else {
                    this.isHovering = false;
                    this.hideImage();
                }
                this.activeItem = null;
            });
        });

        // Enhanced mouse movement tracking
        document.addEventListener('mousemove', (e) => {
            const currentTime = performance.now();
            const deltaTime = (currentTime - this.lastMouseTime) / 1000;
            
            // Calculate velocity
            if (deltaTime > 0) {
                this.mouseVelocity.x = (e.clientX - this.lastMousePos.x) / deltaTime;
                this.mouseVelocity.y = (e.clientY - this.lastMousePos.y) / deltaTime;
            }
            
            // Update last position and time
            this.lastMousePos.x = e.clientX;
            this.lastMousePos.y = e.clientY;
            this.lastMouseTime = currentTime;

            // Check if mouse is still over active item
            if (this.activeItem && !this.isMouseOverActiveItem(e)) {
                this.forceHideImage();
                this.isHovering = false;
                this.activeItem = null;
            }
            
            if (this.isHovering) {
                this.updateMousePosition(e);
            }
        });
    }

    isMouseOverActiveItem(e) {
        if (!this.activeItem) return false;
        const rect = this.activeItem.getBoundingClientRect();
        return (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
        );
    }

    showImage(texture) {
        if (this.activeTexture === texture) return;
        
        if (!this.activeTexture) {
            this.material.uniforms.uCurrentTexture.value = texture;
            this.material.uniforms.uNextTexture.value = texture;
            
            gsap.to(this.material.uniforms.uAlpha, {
                value: this.minOpacity,
                duration: 0.3,
                ease: "power2.out"
            });
            
            gsap.to(this.material.uniforms.uIntensity, {
                value: 0.5,
                duration: 0.3,
                ease: "power2.out"
            });
        } else {
            this.material.uniforms.uCurrentTexture.value = this.activeTexture;
            this.material.uniforms.uNextTexture.value = texture;
            
            gsap.to(this.material.uniforms.uProgress, {
                value: 1,
                duration: 0.3,
                ease: "power2.inOut",
                onComplete: () => {
                    this.material.uniforms.uCurrentTexture.value = texture;
                    this.material.uniforms.uProgress.value = 0;
                }
            });
        }
        
        this.activeTexture = texture;
        this.viewButton.style.opacity = '1';
    }

    forceHideImage() {
        if (!this.activeTexture) return;
        
        // Kill all existing tweens
        gsap.killTweensOf(this.material.uniforms.uAlpha);
        gsap.killTweensOf(this.material.uniforms.uIntensity);
        gsap.killTweensOf(this.material.uniforms.uOffset.value);
        
        // Immediately reset all values
        this.material.uniforms.uAlpha.value = 0;
        this.material.uniforms.uIntensity.value = 0;
        this.material.uniforms.uProgress.value = 0;
        this.material.uniforms.uOffset.value.x = 0;
        this.material.uniforms.uOffset.value.y = 0;
        
        // Clear textures
        this.material.uniforms.uCurrentTexture.value = null;
        this.material.uniforms.uNextTexture.value = null;
        this.activeTexture = null;
        
        // Hide view button
        this.viewButton.style.opacity = '0';
    }

    hideImage() {
        if (!this.activeTexture) return;
        
        // Immediately hide the view button
        this.viewButton.style.opacity = '0';
        
        gsap.killTweensOf(this.material.uniforms.uAlpha);
        gsap.killTweensOf(this.material.uniforms.uIntensity);
        gsap.killTweensOf(this.material.uniforms.uOffset.value);
        
        gsap.to(this.material.uniforms.uAlpha, {
            value: 0,
            duration: 0.2,
            ease: "power2.inOut",
            onComplete: () => {
                this.material.uniforms.uCurrentTexture.value = null;
                this.material.uniforms.uNextTexture.value = null;
                this.activeTexture = null;
            }
        });
        
        gsap.to(this.material.uniforms.uIntensity, {
            value: 0,
            duration: 0.2,
            ease: "power2.inOut"
        });
        
        this.material.uniforms.uProgress.value = 0;
        
        gsap.to(this.material.uniforms.uOffset.value, {
            x: 0,
            y: 0,
            duration: 0.2
        });
    }

    updateMousePosition(e) {
        const pos = this.mouseToScene(e.clientX, e.clientY);
        
        const dx = e.clientX - this.previousMousePosition.x;
        const dy = e.clientY - this.previousMousePosition.y;
        const velocity = Math.sqrt(dx * dx + dy * dy);
        
        const targetOpacity = Math.max(this.minOpacity, 1 - (velocity * 0.01));
        
        gsap.to(this.material.uniforms.uAlpha, {
            value: targetOpacity,
            duration: 0.2,
            ease: "power2.out"
        });

        gsap.to(this.plane.position, {
            x: pos.x,
            y: pos.y,
            duration: 0.3,
            ease: 'power2.out'
        });

        const velocityOffset = {
            x: dx * 0.04,
            y: dy * 0.03
        };

        gsap.to(this.material.uniforms.uOffset.value, {
            x: velocityOffset.x,
            y: velocityOffset.y,
            duration: 0.2
        });

        this.previousMousePosition.x = e.clientX;
        this.previousMousePosition.y = e.clientY;
        
        this.viewButton.style.transform = `translate(${e.clientX - 40}px, ${e.clientY - 40}px)`;
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

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (this.material) {
            this.material.uniforms.uTime.value += 0.05;
        }
        this.renderer.render(this.scene, this.camera);
    }

    cleanup() {
        // Kill all GSAP animations
        gsap.killTweensOf(this.material.uniforms.uAlpha);
        gsap.killTweensOf(this.material.uniforms.uIntensity);
        gsap.killTweensOf(this.material.uniforms.uOffset.value);
        gsap.killTweensOf(this.plane.position);
        
        // Clean up Three.js resources
        if (this.geometry) {
            this.geometry.dispose();
        }
        
        if (this.material) {
            this.material.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }

        // Clean up textures
        Object.values(this.textures).forEach(texture => {
            if (texture) {
                texture.dispose();
            }
        });
        
        // Remove DOM elements
        if (this.container) {
            this.container.remove();
        }
        
        if (this.viewButton) {
            this.viewButton.remove();
        }

        // Remove event listeners
        const experienceItems = document.querySelectorAll('.experience-item');
        experienceItems.forEach(item => {
            item.removeEventListener('mouseenter', this.handleMouseEnter);
            item.removeEventListener('mouseleave', this.handleMouseLeave);
        });
        
        document.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('resize', this.handleResize);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const hoverEffect = new HoverEffect();
});
// Initialize effect when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

    new LiquidDistortionEffect();

        // Optional: Cleanup on page unload
        window.addEventListener('unload', () => {
            effect.cleanup();
        });
});
