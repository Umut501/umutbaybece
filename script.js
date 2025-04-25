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

// Initialize hover effect when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const hoverEffect = new HoverEffect();
    
    // Optional: Cleanup on page unload
    window.addEventListener('unload', () => {
        hoverEffect.cleanup();
    });
});

// Profesyonel Minimal Animasyon Efekti
class MinimalAnimation {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.canvasSize = { width: window.innerWidth, height: window.innerHeight };
        this.particleCount = Math.floor(window.innerWidth / 15); // Daha az partikül
        this.colors = ['#e6e6e6', '#d9d9d9', '#cccccc', '#f2f2f2']; // Gri tonları
        this.mousePosition = { x: 0, y: 0 };
        this.mouseRadius = 100;
        
        this.init();
        this.createParticles();
        this.animate();
    }
    
    init() {
        this.canvas.width = this.canvasSize.width;
        this.canvas.height = this.canvasSize.height;
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '0'; // Arka planda kalması için düşük z-index
        document.body.appendChild(this.canvas);
        
        // Fare hareketini izleme
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        });
        
        window.addEventListener('resize', () => {
            this.canvasSize = { width: window.innerWidth, height: window.innerHeight };
            this.canvas.width = this.canvasSize.width;
            this.canvas.height = this.canvasSize.height;
            
            // Resize olduğunda partikül sayısını da güncelle
            const newParticleCount = Math.floor(window.innerWidth / 15);
            if (newParticleCount > this.particleCount) {
                // Ek partikül ekle
                for (let i = 0; i < newParticleCount - this.particleCount; i++) {
                    this.particles.push(this.createParticle());
                }
            } else if (newParticleCount < this.particleCount) {
                // Fazla partikülleri kaldır
                this.particles = this.particles.slice(0, newParticleCount);
            }
            this.particleCount = newParticleCount;
        });
    }
    
    createParticle() {
        return {
            x: Math.random() * this.canvasSize.width,
            y: Math.random() * this.canvasSize.height,
            radius: 1 + Math.random() * 2,
            originalRadius: 1 + Math.random() * 2,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            speed: 0.2 + Math.random() * 0.3,
            direction: Math.random() * Math.PI * 2,
            opacity: 0.1 + Math.random() * 0.4,
            connectedTo: []
        };
    }
    
    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    findConnections() {
        // Partiküller arası bağlantıları belirle
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].connectedTo = [];
            
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) { // Bağlantı mesafesi
                    this.particles[i].connectedTo.push({
                        particle: this.particles[j],
                        distance: distance
                    });
                }
            }
        }
    }
    
    drawConnections() {
        // Partiküller arası bağlantıları çiz
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            for (let j = 0; j < particle.connectedTo.length; j++) {
                const connection = particle.connectedTo[j];
                const opacity = 1 - (connection.distance / 100);
                
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(200, 200, 200, ${opacity * 0.2})`; // Bağlantılar için açık gri
                this.ctx.lineWidth = 0.5;
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(connection.particle.x, connection.particle.y);
                this.ctx.stroke();
            }
        }
    }
    
    drawParticle(particle) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${this.hexToRgb(particle.color)}, ${particle.opacity})`;
        this.ctx.fill();
    }
    
    hexToRgb(hex) {
        // Hex rengi RGB'ye dönüştür
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : 
            '200,200,200';
    }
    
    updateParticle(particle) {
        // Partikül hareketini güncelle
        particle.x += Math.cos(particle.direction) * particle.speed;
        particle.y += Math.sin(particle.direction) * particle.speed;
        
        // Yön değişimini hafifçe rastgele yap
        particle.direction += (Math.random() - 0.5) * 0.01;
        
        // Fare etkileşimi
        const dx = particle.x - this.mousePosition.x;
        const dy = particle.y - this.mousePosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.mouseRadius) {
            // Fareye yakın partikülleri büyüt ve hızlandır
            const force = (this.mouseRadius - distance) / this.mouseRadius;
            particle.radius = particle.originalRadius + (force * 2);
            
            // Fareden uzağa itme
            const angle = Math.atan2(dy, dx);
            particle.x += Math.cos(angle) * force * 0.5;
            particle.y += Math.sin(angle) * force * 0.5;
        } else {
            // Normal boyuta dön
            particle.radius = particle.originalRadius;
        }
        
        // Ekrandan çıkınca karşı tarafa getir
        if (particle.x < 0) {
            particle.x = this.canvasSize.width;
        } else if (particle.x > this.canvasSize.width) {
            particle.x = 0;
        }
        
        if (particle.y < 0) {
            particle.y = this.canvasSize.height;
        } else if (particle.y > this.canvasSize.height) {
            particle.y = 0;
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        
        // Bağlantıları hesapla
        this.findConnections();
        
        // Önce bağlantıları çiz
        this.drawConnections();
        
        // Sonra partikülleri çiz ve güncelle
        this.particles.forEach(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
        });
        
        requestAnimationFrame(() => this.animate());
    }
    
    cleanup() {
        this.canvas.remove();
        document.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('resize', this.handleResize);
    }
}

// Sayfa yüklendiğinde animasyonu başlat
document.addEventListener('DOMContentLoaded', () => {
    const minimalAnimation = new MinimalAnimation();
    
    // Mevcut hover efektini de çalıştır
    const hoverEffect = new HoverEffect();
    
    // Sayfa kapanırken temizlik yapma
    window.addEventListener('unload', () => {
        minimalAnimation.cleanup();
        hoverEffect.cleanup();
    });
});

