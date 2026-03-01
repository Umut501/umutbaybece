/* ════════════════════════════════════════════════════
   GLOBAL SYSTEMS
════════════════════════════════════════════════════ */

// ── 1. CURSOR ──────────────────────────────────────
const $dot = document.getElementById('cdot');
const $ring = document.getElementById('cring');
let cx = -200, cy = -200, rx = -200, ry = -200;

document.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; });

(function tickCursor() {
    requestAnimationFrame(tickCursor);
    rx += (cx - rx) * 0.11;
    ry += (cy - ry) * 0.11;
    $dot.style.left = cx + 'px';
    $dot.style.top = cy + 'px';
    $ring.style.left = rx + 'px';
    $ring.style.top = ry + 'px';
})();

// hover state
document.querySelectorAll('a,button,.prj-item,.lgb').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});


// ── 2. NAVBAR scroll + active section ──────────────
const $nav = document.getElementById('gnav');
const $navLinks = document.querySelectorAll('.nav-links a[data-s]');

window.addEventListener('scroll', () => {
    $nav.classList.toggle('filled', window.scrollY > 30);
}, { passive: true });

const secObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            const id = e.target.id;
            $navLinks.forEach(l => l.classList.toggle('on', l.dataset.s === id));
        }
    });
}, { threshold: 0.45 });
document.querySelectorAll('.sec').forEach(s => secObserver.observe(s));

// smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
});


// ── 3. LIQUID GLASS BUTTONS ────────────────────────
function lgSVG(el) {
    const w = el.offsetWidth, h = el.offsetHeight;
    const r = window.getComputedStyle(el).borderRadius || '100px';
    return 'data:image/svg+xml,' + encodeURIComponent(
        `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="red"/></linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="blue"/></linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="black"/>
      <rect width="100%" height="100%" rx="${r}" fill="url(#g1)"/>
      <rect width="100%" height="100%" rx="${r}" fill="url(#g2)" style="mix-blend-mode:difference"/>
      <rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="${r}" fill="white" opacity="0.42" style="filter:blur(9px)"/>
    </svg>`
    );
}

function initLG() {
    const btns = document.querySelectorAll('.lgb[data-fi]');
    btns.forEach(b => {
        const fi = document.getElementById('f' + b.dataset.fi);
        if (fi) fi.querySelector('feImage').setAttribute('href', lgSVG(b));
    });

    window.addEventListener('mousemove', e => {
        btns.forEach(b => {
            const fi = document.getElementById('f' + b.dataset.fi);
            if (!fi) return;
            const map = fi.querySelector('feDisplacementMap');
            const rect = b.getBoundingClientRect();
            const relX = e.clientX - (rect.left + rect.width / 2);
            const relY = e.clientY - (rect.top + rect.height / 2);
            const dist = Math.hypot(relX, relY);
            const over = e.clientX >= rect.left && e.clientX <= rect.right
                && e.clientY >= rect.top && e.clientY <= rect.bottom;

            if (over || (b._st && dist < 80)) {
                b._st = true;
                const ang = Math.atan2(relY, relX);
                const ef = Math.pow(Math.cos(ang * 2), 2);
                const mx = relX * .65 * ef, my = relY * .65 * ef;
                const sx = Math.max(.62, 1 + Math.abs(relX) / 500 * ef);
                const sy = Math.max(.62, 1 + Math.abs(relY) / 230 * ef);
                gsap.to(b, { x: mx, y: my, scaleX: sx, scaleY: sy, duration: .1 });
                const base = 30, s = dist * 3.5 * ef;
                const tl = base + Math.max(0, (-relX - relY) / (dist || 1)) * s;
                const tr = base + Math.max(0, (relX - relY) / (dist || 1)) * s;
                const br = base + Math.max(0, (relX + relY) / (dist || 1)) * s;
                const bl = base + Math.max(0, (-relX + relY) / (dist || 1)) * s;
                gsap.to(b, { borderRadius: `${tl}px ${tr}px ${br}px ${bl}px`, duration: .1 });
                fi.querySelector('feImage').setAttribute('href', lgSVG(b));
                map.setAttribute('scale', -180 - dist * 2 * ef);
            } else if (b._st) {
                b._st = false;
                gsap.to(b, { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: '100px', duration: 2, ease: 'elastic.out(1.8,.15)' });
                gsap.to(map, { attr: { scale: -180 }, duration: 2, ease: 'elastic.out(1.8,.15)' });
            }
        });
    });
}
// init after render so offsetWidth is available
requestAnimationFrame(() => requestAnimationFrame(initLG));

/* ════════════════════════════════════════════════════
   §2  WATER — GLOBAL BACKGROUND (fixed, full viewport)
════════════════════════════════════════════════════ */
(function initWater() {
    // marquee
    const W = ['Practice', 'Upskill', 'Play', 'Improve', 'Innovate', 'Lead', 'Create', 'Grow', 'Inspire'];
    const mt = document.getElementById('mq-track');
    [...W, ...W, ...W, ...W].forEach(w => {
        const s = document.createElement('span'); s.className = 'mw';
        s.innerHTML = w + '<span class="ms"> · </span>'; mt.appendChild(s);
    });

    const cvs = document.getElementById('s2-canvas');
    const R = new THREE.WebGLRenderer({ canvas: cvs, alpha: false, antialias: false });
    R.setPixelRatio(Math.min(devicePixelRatio, 1.5));

    const sc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    let ss = window.innerWidth < 768 ? .25 : .45;
    const SW = () => Math.max(2, Math.floor(window.innerWidth * ss));
    const SH = () => Math.max(2, Math.floor(window.innerHeight * ss));
    R.setSize(window.innerWidth, window.innerHeight);

    const rto = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false };
    let rtA = new THREE.WebGLRenderTarget(SW(), SH(), rto), rtB = rtA.clone();

    /* Dynamic background — reads scroll position and blends between section palettes */
    const bg = document.createElement('canvas'), bgx = bg.getContext('2d');

    // Palette for each section (dark deep-water tones)
    const palettes = [
        { from: '#020111', to: '#004060' },  // s1 intro — midnight navy
        { from: '#0f1e32', to: '#07111d' },  // s2 playground — deep ocean
        { from: '#000810', to: '#001525' },  // s3 about — abyss
        { from: '#0a1520', to: '#08111a' },  // s4 projects — dark under cream
        { from: '#080c10', to: '#020810' },  // s5 contact — ink
    ];

    function lerpColor(a, b, t) {
        const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
        const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
        const br = (bh >> 16) & 0xff, bg2 = (bh >> 8) & 0xff, bb = bh & 0xff;
        const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg2 - ag) * t), bl2 = Math.round(ab + (bb - ab) * t);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl2.toString(16).padStart(2, '0')}`;
    }

    function paintBg() {
        const w = window.innerWidth, h = window.innerHeight;
        bg.width = w; bg.height = h;

        // Figure out which two sections we're between
        const scrollY = window.scrollY;
        const secs = document.querySelectorAll('.sec');
        let secIdx = 0, secT = 0;
        for (let i = 0; i < secs.length; i++) {
            const top = secs[i].offsetTop, bot = top + secs[i].offsetHeight;
            if (scrollY >= top && scrollY < bot) {
                secIdx = i;
                secT = (scrollY - top) / secs[i].offsetHeight;
                break;
            }
        }
        const nextIdx = Math.min(secIdx + 1, palettes.length - 1);
        const p0 = palettes[secIdx], p1 = palettes[nextIdx];
        const c0 = lerpColor(p0.from, p1.from, secT);
        const c1 = lerpColor(p0.to, p1.to, secT);

        const gr = bgx.createRadialGradient(w * .5, h * .42, 0, w * .5, h * .55, Math.hypot(w, h) * .75);
        gr.addColorStop(0, c0); gr.addColorStop(1, c1);
        bgx.fillStyle = gr; bgx.fillRect(0, 0, w, h);

        // Subtle depth bands
        [[.22, .3, .32, 'rgba(50,110,220,.1)'], [.78, .55, .28, 'rgba(255,101,53,.05)'], [.5, .8, .35, 'rgba(40,90,200,.07)']].forEach(([ox, oy, or, oc]) => {
            const rg = bgx.createRadialGradient(ox * w, oy * h, 0, ox * w, oy * h, or * Math.max(w, h));
            rg.addColorStop(0, oc); rg.addColorStop(1, 'rgba(0,0,0,0)');
            bgx.fillStyle = rg; bgx.fillRect(0, 0, w, h);
        });
    }
    paintBg();
    const bgT = new THREE.CanvasTexture(bg);

    // Repaint background on scroll
    window.addEventListener('scroll', () => { paintBg(); bgT.needsUpdate = true; }, { passive: true });

    const FGIFS = [
        'https://png.pngtree.com/png-vector/20250211/ourmid/pngtree-dry-leaf-isolated-on-white-background-1-png-image_15444737.png',
        'https://png.pngtree.com/png-vector/20241227/ourmid/pngtree-yellow-dried-leaf-on-a-transparent-background-png-image_14751189.png'
    ];
    const NF = FGIFS.length;
    const uF = new Array(NF).fill(0).map(() => new THREE.Vector3(-9999, -9999, 0));

    const simM = new THREE.ShaderMaterial({
        uniforms: { uPrev: { value: null }, uRes: { value: new THREE.Vector2(SW(), SH()) }, uMouse: { value: new THREE.Vector3(-9999, -9999, 0) }, uleaf: { value: uF }, uDamp: { value: .996 }, uSpd: { value: 2 }, uF: { value: 12.2 }, uR: { value: 12 }, uFR: { value: 6 } },
        vertexShader: `varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}`,
        fragmentShader: `
      uniform sampler2D uPrev;uniform vec2 uRes;uniform vec3 uMouse;uniform vec3 uleaf[${NF}];
      uniform float uDamp,uSpd,uF,uR,uFR;varying vec2 v;
      void main(){
        vec2 p=1./uRes;vec4 s=texture2D(uPrev,v);float h=s.r,vel=s.g;
        float hR=texture2D(uPrev,v+vec2(p.x,0.)).r,hL=texture2D(uPrev,v-vec2(p.x,0.)).r;
        float hU=texture2D(uPrev,v+vec2(0.,p.y)).r,hD=texture2D(uPrev,v-vec2(0.,p.y)).r;
        float hTR=texture2D(uPrev,v+p).r,hTL=texture2D(uPrev,v+vec2(-p.x,p.y)).r;
        float hBR=texture2D(uPrev,v+vec2(p.x,-p.y)).r,hBL=texture2D(uPrev,v-p).r;
        if(v.x<p.x)hL=hR;if(v.x>1.-p.x)hR=hL;if(v.y<p.y)hD=hU;if(v.y>1.-p.y)hU=hD;
        float lap=(hR+hL+hU+hD)*.2+(hTR+hTL+hBR+hBL)*.05-h;
        vel+=uSpd*lap;h+=vel;h=mix(h,(hR+hL+hU+hD)*.25,.04);vel*=uDamp;h*=uDamp;
        if(uMouse.z>.5){vec2 c=v*uRes;float d=distance(c,uMouse.xy);h+=exp(-d*d/(uR*uR))*uF;}
        for(int i=0;i<${NF};i++){if(uleaf[i].z>.5){vec2 c=v*uRes;float d=distance(c,uleaf[i].xy);h+=exp(-d*d/(uFR*uFR))*uF*.45;}}
        h=clamp(h,-2.,2.);vel=clamp(vel,-2.,2.);
        gl_FragColor=vec4(h,vel,(hR-hL)*.5,(hU-hD)*.5);
      }`
    });
    const disM = new THREE.ShaderMaterial({
        uniforms: { uSim: { value: null }, uBg: { value: bgT } },
        vertexShader: `varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}`,
        fragmentShader: `
      uniform sampler2D uSim,uBg;varying vec2 v;
      void main(){
        vec4 d=texture2D(uSim,v);float h=d.r;vec2 gr=d.zw;
        vec3 col=texture2D(uBg,clamp(v+gr*.028,.001,.999)).rgb;
        vec3 N=normalize(vec3(-gr.x*6.,1.,-gr.y*6.));
        col+=vec3(.88,.94,1.)*pow(max(dot(N,normalize(vec3(-1.2,4.5,2.))),0.),900.)*3.;
        col+=vec3(.25,.55,1.)*pow(max(dot(N,normalize(vec3(2.,3.,-1.))),0.),60.)*.55;
        col+=vec3(.04,.14,.38)*(sin(h*20.)*.5+.5)*abs(h)*.3+vec3(.02,.08,.25)*h*.4;
        vec2 pp=v*2.-1.;col*=1.-dot(pp,pp)*.35;gl_FragColor=vec4(col,1.);
      }`
    });

    const quad = new THREE.PlaneGeometry(2, 2);
    const sMesh = new THREE.Mesh(quad, simM), dMesh = new THREE.Mesh(quad, disM);
    const mu = simM.uniforms.uMouse.value;
    let mOn = false, dragF = null;

    // Mouse always tracks window-level (not section-level)
    document.addEventListener('mousemove', e => {
        mOn = true;
        mu.x = (e.clientX / window.innerWidth) * SW();
        mu.y = (1 - e.clientY / window.innerHeight) * SH();
        if (dragF) {
            const dx = e.clientX - dragF.x, dy = e.clientY - dragF.y;
            if (Math.hypot(dx, dy) > 2) dragF.ta = Math.atan2(dy, dx);
            dragF.x = e.clientX; dragF.y = e.clientY; dragF.tx = e.clientX; dragF.ty = e.clientY;
        }
    });
    // Mouse stays active across the whole page — only hide when window loses focus
    document.addEventListener('mouseleave', () => mOn = false);
    document.addEventListener('mouseenter', () => mOn = true);
    document.addEventListener('mouseup', () => { if (dragF) { dragF.dragging = false; dragF = null; } });

    function onResize() {
        R.setSize(window.innerWidth, window.innerHeight);
        rtA.setSize(SW(), SH()); rtB.setSize(SW(), SH());
        simM.uniforms.uRes.value.set(SW(), SH());
        paintBg(); bgT.needsUpdate = true;
    }
    window.addEventListener('resize', onResize);

    // leaf live in §2 section but positions are viewport-relative
    const s2sec = document.getElementById('s2');
    const leafes = [];
    FGIFS.forEach((gif, i) => {
        const el = document.createElement('img'); el.src = gif; el.className = 'leaf'; s2sec.appendChild(el);
        const isB = i === 1;
        const f = { el, x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, tx: isB ? window.innerWidth - 150 : Math.random() * window.innerWidth, ty: isB ? window.innerHeight - 120 : Math.random() * window.innerHeight, speed: .3 + Math.random() * 1.5, a: 0, ta: 0, dragging: false, isB };
        el.addEventListener('mousedown', e => { e.preventDefault(); dragF = f; f.dragging = true; document.body.classList.add('cursor-drag'); });
        document.addEventListener('mouseup', () => document.body.classList.remove('cursor-drag'));
        leafes.push(f);
    });

    function updleaf() {
        const W = window.innerWidth, H = window.innerHeight;
        leafes.forEach((f, i) => {
            if (!f.dragging) {
                if (f.isB) {
                    f.ty = H - 120;
                    if (Math.hypot(f.tx - f.x, f.ty - f.y) < 80) f.tx = f.tx > W / 2 ? 150 : W - 150;
                    f.ta = Math.atan2(f.ty - f.y, f.tx - f.x);
                    f.x += Math.cos(f.a) * f.speed; f.y += Math.sin(f.a) * f.speed;
                } else {
                    const pw = 125, ph = 60; let b = false;
                    if (f.x < pw) { f.x = pw; f.tx = f.x + 400; b = true; } if (f.x > W - pw) { f.x = W - pw; f.tx = f.x - 400; b = true; }
                    if (f.y < ph) { f.y = ph; f.ty = f.y + 300; b = true; } if (f.y > H - ph) { f.y = H - ph; f.ty = f.y - 300; b = true; }
                    if (Math.hypot(f.tx - f.x, f.ty - f.y) < 50 && !b) { f.tx = pw + Math.random() * (W - pw * 2); f.ty = ph + Math.random() * (H - ph * 2); f.speed = .3 + Math.random() * 1.5; }
                    f.ta = Math.atan2(f.ty - f.y, f.tx - f.x);
                    f.x += Math.cos(f.a) * f.speed; f.y += Math.sin(f.a) * f.speed;
                }
            }
            let da = f.ta - f.a; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
            f.a += da * (f.isB ? .02 : .015);
            const fy = Math.cos(f.a) < 0 ? -1 : 1;
            // leaf positioned fixed in viewport (translate from top of s2 section)

            f.el.style.transform = `translate(calc(${f.x}px - 50%),calc(${f.y}px - 50%)) rotate(${f.a * 180 / Math.PI}deg) scaleY(${fy})${f.isB ? ' scaleX(-1)' : ''}`;
            simM.uniforms.uleaf.value[i].set((f.x / W) * SW(), (1 - f.y / H) * SH(), 1);
        });
    }

    let pt = 0, bad = 0;
    (function wLoop(t) {
        requestAnimationFrame(wLoop);
        updleaf();
        const dt = t - pt; pt = t;
        if (dt > 40) bad++; else bad = Math.max(0, bad - 1);
        if (bad > 15 && ss > .2) { ss -= .05; bad = 0; onResize(); }
        simM.uniforms.uPrev.value = rtB.texture; mu.z = mOn ? 1 : 0;
        R.setRenderTarget(rtA); sc.add(sMesh); R.render(sc, cam); sc.remove(sMesh);
        disM.uniforms.uSim.value = rtA.texture;
        R.setRenderTarget(null); sc.add(dMesh); R.render(sc, cam); sc.remove(dMesh);
        const tmp = rtA; rtA = rtB; rtB = tmp;
    })(0);
})()


    /* ════════════════════════════════════════════════════
       §4  PROJECTS HOVER
    ════════════════════════════════════════════════════ */
    (function initProjects() {
        const sec = document.getElementById('s4');
        const mount = document.getElementById('s4-hover-mount');
        const vcur = document.getElementById('prj-vcursor');

        const ph = new THREE.Scene(), pc = new THREE.PerspectiveCamera(45, sec.offsetWidth / sec.offsetHeight, .1, 1000);
        pc.position.z = 10;
        const pr = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        pr.setSize(sec.offsetWidth, sec.offsetHeight); pr.setPixelRatio(Math.min(devicePixelRatio, 2));
        mount.appendChild(pr.domElement);

        const pg = new THREE.PlaneGeometry(3.5, 2, 200, 100);
        const pm = new THREE.ShaderMaterial({
            uniforms: { uC: { value: null }, uN: { value: null }, uP: { value: 0 }, uO: { value: new THREE.Vector2 }, uA: { value: 0 }, uT: { value: 0 }, uI: { value: 0 } },
            vertexShader: `uniform vec2 uO;uniform float uT,uI;varying vec2 v;
      void main(){v=uv;vec3 p=position;
        float w=sin(uv.y*5.+uT)*uI,w2=sin(uv.x*5.-uT*.5)*uI;
        p.x+=sin(uv.y*2.)*uO.x*(.5+w);p.y+=sin(uv.x*4.)*uO.y*(.5+w2);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
            fragmentShader: `uniform sampler2D uC,uN;uniform float uP,uA;varying vec2 v;
      void main(){vec4 c=mix(texture2D(uC,v),texture2D(uN,v),uP);gl_FragColor=vec4(c.rgb,c.a*uA);}`,
            transparent: true
        });
        const ppl = new THREE.Mesh(pg, pm); ph.add(ppl);

        const tl2 = new THREE.TextureLoader(), ptex = {};
        document.querySelectorAll('.prj-item').forEach(item => {
            const id = item.dataset.pid, img = document.getElementById(id + '-img');
            if (img) ptex[id] = tl2.load(img.src);
        });

        function mts(mx, my) {
            const rect = pr.domElement.getBoundingClientRect();
            const x = ((mx - rect.left) / rect.width) * 2 - 1, y = -((my - rect.top) / rect.height) * 2 + 1;
            const vv = new THREE.Vector3(x, y, 0).unproject(pc);
            const d = vv.sub(pc.position).normalize();
            return pc.position.clone().add(d.multiplyScalar(-pc.position.z / d.z));
        }

        let pmx = 0, pmy = 0;
        document.querySelectorAll('.prj-item').forEach(item => {
            const id = item.dataset.pid;
            item.addEventListener('mouseenter', () => {
                if (!ptex[id]) return;
                if (!pm.uniforms.uC.value) { pm.uniforms.uC.value = pm.uniforms.uN.value = ptex[id]; }
                else {
                    pm.uniforms.uC.value = pm.uniforms.uN.value; pm.uniforms.uN.value = ptex[id];
                    gsap.to(pm.uniforms.uP, { value: 1, duration: .5, ease: 'power2.inOut', onComplete: () => { pm.uniforms.uP.value = 0; pm.uniforms.uC.value = ptex[id]; } });
                }
                gsap.to(pm.uniforms.uA, { value: 1, duration: .3 });
                gsap.to(pm.uniforms.uI, { value: .5, duration: .3 });
                gsap.to(vcur, { scale: 1, opacity: 1, duration: .3, ease: 'back.out(2)' });
            });
            item.addEventListener('mouseleave', () => {
                gsap.to(pm.uniforms.uA, { value: 0, duration: .3 });
                gsap.to(pm.uniforms.uI, { value: 0, duration: .3 });
                gsap.to(vcur, { scale: 0, opacity: 0, duration: .25 });
            });
        });

        document.addEventListener('mousemove', e => {
            pmx = e.clientX; pmy = e.clientY;
            const pos = mts(e.clientX, e.clientY);
            gsap.to(ppl.position, { x: pos.x, y: pos.y, duration: .3, ease: 'power2.out' });
            gsap.to(vcur, { x: e.clientX - 35, y: e.clientY - 35, duration: .15 });
            const vx = (e.clientX - pmx + .02) * .06, vy = (e.clientY - pmy + .02) * .05;
            gsap.to(pm.uniforms.uO.value, { x: vx, y: vy, duration: .1 });
        });

        window.addEventListener('resize', () => {
            pc.aspect = sec.offsetWidth / sec.offsetHeight; pc.updateProjectionMatrix();
            pr.setSize(sec.offsetWidth, sec.offsetHeight);
        });

        (function pLoop() {
            requestAnimationFrame(pLoop);
            pm.uniforms.uT.value += .08;
            pr.render(ph, pc);
        })();
    })();