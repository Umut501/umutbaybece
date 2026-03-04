/* ════════════════════════════════════════════════════
   GLOBAL SYSTEMS
════════════════════════════════════════════════════ */

// ── 1. CURSOR ──────────────────────────────────────
const $dot = document.getElementById("cdot");
const $ring = document.getElementById("cring");
let cx = -200,
  cy = -200,
  rx = -200,
  ry = -200;

document.addEventListener("mousemove", (e) => {
  cx = e.clientX;
  cy = e.clientY;
});

(function tickCursor() {
  requestAnimationFrame(tickCursor);
  rx += (cx - rx) * 0.11;
  ry += (cy - ry) * 0.11;
  $dot.style.left = cx + "px";
  $dot.style.top = cy + "px";
  $ring.style.left = rx + "px";
  $ring.style.top = ry + "px";
})();

// hover state
document
  .querySelectorAll("a, button, .prj-item, .liquid-glass")
  .forEach((el) => {
    el.addEventListener("mouseenter", () =>
      document.body.classList.add("cursor-hover"),
    );
    el.addEventListener("mouseleave", () =>
      document.body.classList.remove("cursor-hover"),
    );
  });

// ── 2. NAVBAR scroll + active section ──────────────
const $nav = document.getElementById("gnav");
const $navLinks = document.querySelectorAll(".nav-links a[data-s]");

window.addEventListener(
  "scroll",
  () => {
    $nav.classList.toggle("filled", window.scrollY > 30);
  },
  { passive: true },
);

const secObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const id = e.target.id;
        $navLinks.forEach((l) => l.classList.toggle("on", l.dataset.s === id));
      }
    });
  },
  { threshold: 0.45 },
);
document.querySelectorAll(".sec").forEach((s) => secObserver.observe(s));

// smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const t = document.querySelector(a.getAttribute("href"));
    if (t) {
      e.preventDefault();
      t.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Hamburger Menu Toggle
const hamb = document.getElementById("hamb");
const menuOverlay = document.getElementById("menu-overlay");
const menuBg = document.getElementById("menu-bg");
const menuLinks = document.querySelector(".menu-links");
let isMenuOpen = false;

if (hamb) {
  hamb.addEventListener("click", () => {
    isMenuOpen = !isMenuOpen;
    document.body.classList.toggle("menu-open");

    if (isMenuOpen) {
      // AÇILIŞ: Elastik "Boing" Efekti
      gsap.to(menuBg, {
        scale: 1,
        y: "0%",
        borderRadius: "0px",
        duration: 1.2,
        ease: "elastic.out(1, 0.75)",
      });
      gsap.to(menuLinks, { opacity: 1, y: 0, delay: 0.3, duration: 0.5 });
    } else {
      // KAPANIŞ
      gsap.to(menuBg, {
        scale: 0.8,
        y: "-100%",
        borderRadius: "100px",
        duration: 0.8,
        ease: "power4.in",
      });
      gsap.to(menuLinks, { opacity: 0, duration: 0.3 });
    }
  });
}

// Menüdeki linklere tıklayınca menüyü kapat
document.querySelectorAll(".menu-links a").forEach((link) => {
  link.addEventListener("click", () => {
    isMenuOpen = false;
    document.body.classList.remove("menu-open");
    gsap.to(menuBg, {
      scale: 0.8,
      y: "-100%",
      borderRadius: "100px",
      duration: 0.8,
    });
    gsap.to(menuLinks, { opacity: 0 });
  });
});

// ── 3. LIQUID GLASS BUTTONS (Jhey Tompkins Inspired) ─────────
const lgConfig = { baseScale: -180, dropDistance: 80 };

const arrowPaths = {
  "arrow-up": "M 0.5 0.1 L 0.9 0.5 H 0.7 V 0.9 H 0.3 V 0.5 H 0.1 Z",
  "arrow-down": "M 0.5 0.9 L 0.1 0.5 H 0.3 V 0.1 H 0.7 V 0.5 H 0.9 Z",
  "arrow-left": "M 0.1 0.5 L 0.5 0.1 V 0.3 H 0.9 V 0.7 H 0.5 V 0.9 Z",
  "arrow-right": "M 0.9 0.5 L 0.5 0.9 V 0.7 H 0.1 V 0.3 H 0.5 V 0.1 Z",
};

const bearVectors = `
    <path d="M22,35 Q22,12 50,12 Q78,12 78,35 L78,55 Q88,65 88,95 Q88,120 50,120 Q12,120 12,95 Q12,65 22,55 Z" />
    <circle cx="28" cy="18" r="10" />
    <circle cx="72" cy="18" r="10" />
    <ellipse cx="20" cy="78" rx="12" ry="15" transform="rotate(10 20 78)" />
    <ellipse cx="80" cy="78" rx="12" ry="15" transform="rotate(-10 80 78)" />
    <ellipse cx="32" cy="115" rx="18" ry="12" />
    <ellipse cx="68" cy="115" rx="18" ry="12" />
`;

function getSVGMap(glass, w, h) {
  let shapeElement = "";
  const isShapeArrow = glass.classList.contains("arrow-shape");
  const isBear = glass.classList.contains("bear-shape");

  if (isBear) {
    const scaleX = w / 100;
    const scaleY = h / 130;
    const innerScaleX = (w - 10) / 100;
    const innerScaleY = (h - 10) / 130;

    shapeElement = `
            <g transform="scale(${scaleX}, ${scaleY})" fill="url(#g1)">${bearVectors}</g>
            <g transform="scale(${scaleX}, ${scaleY})" fill="url(#g2)" style="mix-blend-mode:difference">${bearVectors}</g>
            <g transform="translate(5,5) scale(${innerScaleX}, ${innerScaleY})" fill="white" opacity="0.5" style="filter:blur(10px)">${bearVectors}</g>`;
  } else if (isShapeArrow) {
    const arrowType = Array.from(glass.classList).find(
      (cls) => arrowPaths[cls],
    );
    const pathData = arrowPaths[arrowType];

    shapeElement = `
            <path d="${pathData}" transform="scale(${w}, ${h})" fill="url(#g1)" stroke="url(#g1)" stroke-width="0.2" stroke-linejoin="round"/>
            <path d="${pathData}" transform="scale(${w}, ${h})" fill="url(#g2)" stroke="url(#g2)" stroke-width="0.2" stroke-linejoin="round" style="mix-blend-mode:difference"/>
            <path d="${pathData}" transform="translate(5,5) scale(${w - 10}, ${h - 10})" fill="white" stroke="white" stroke-width="0.2" stroke-linejoin="round" opacity="0.5" style="filter:blur(10px)"/>`;
  } else {
    const radius = window.getComputedStyle(glass).borderRadius;
    shapeElement = `
            <rect width="100%" height="100%" rx="${radius}" fill="url(#g1)"/>
            <rect width="100%" height="100%" rx="${radius}" fill="url(#g2)" style="mix-blend-mode:difference"/>
            <rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="${radius}" fill="white" opacity="0.5" style="filter:blur(10px)"/>`;
  }

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="g1" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="red"/></linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="blue"/></linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="black"/>
        ${shapeElement}
    </svg>`)}`;
}

function setupFilters() {
  let svgContainer = document.getElementById("dynamic-filters");
  if (!svgContainer) {
    svgContainer = document.createElement("svg");
    svgContainer.id = "dynamic-filters";
    svgContainer.style.width = "0";
    svgContainer.style.height = "0";
    svgContainer.style.position = "absolute";
    document.body.appendChild(svgContainer);
  }

  const glasses = document.querySelectorAll(".liquid-glass");

  glasses.forEach((glass, i) => {
    // Fallback ID if data-fi is not provided
    let id = glass.getAttribute("data-fi");
    if (!id) {
      id = `lg-${i}`;
      glass.setAttribute("data-fi", id);
    }

    glass.style.backdropFilter = `url(#f-${id}) saturate(1.5)`;

    svgContainer.innerHTML += `
            <filter id="f-${id}" color-interpolation-filters="sRGB">
                <feImage result="m" href="${getSVGMap(glass, glass.offsetWidth, glass.offsetHeight)}" />
                <feDisplacementMap in="SourceGraphic" in2="m" xChannelSelector="R" yChannelSelector="G" scale="${lgConfig.baseScale}" />
            </filter>
        `;
  });
}

// Boing Logic & Follow Mouse
window.addEventListener("mousemove", (e) => {
  const glasses = document.querySelectorAll(".liquid-glass");

  glasses.forEach((glass) => {
    const id = glass.getAttribute("data-fi");
    const filter = document.getElementById(`f-${id}`);
    if (!filter) return;

    const rect = glass.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const relX = e.clientX - centerX;
    const relY = e.clientY - centerY;
    const dist = Math.hypot(relX, relY);

    const isHover =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    const map = filter.querySelector("feDisplacementMap");
    const isCustomShape =
      glass.classList.contains("arrow-shape") ||
      glass.classList.contains("bear-shape");

    if (isHover || (glass.isStuck && dist < lgConfig.dropDistance)) {
      glass.isStuck = true;

      const angle = Math.atan2(relY, relX);
      const edgeFactor = Math.pow(Math.cos(angle * 2), 2);

      let scaleX =
        1 +
        (Math.abs(relX) / 500) * edgeFactor -
        (Math.abs(relY) / 350) * edgeFactor;
      let scaleY =
        1 +
        (Math.abs(relY) / 200) * edgeFactor -
        (Math.abs(relX) / 350) * edgeFactor;

      scaleX = Math.max(0.5, scaleX);
      scaleY = Math.max(0.5, scaleY);

      gsap.to(glass, {
        x: relX * 0.7 * edgeFactor,
        y: relY * 0.7 * edgeFactor,
        scaleX: scaleX,
        scaleY: scaleY,
        duration: 0.1,
      });

      if (!isCustomShape) {
        const baseR = glass.classList.contains("circle")
          ? rect.width / 2
          : glass.classList.contains("square")
            ? 20
            : 40;
        const stretch = dist * 4 * edgeFactor;
        const tl = baseR + Math.max(0, (-relX - relY) / (dist || 1)) * stretch;
        const tr = baseR + Math.max(0, (relX - relY) / (dist || 1)) * stretch;
        const br = baseR + Math.max(0, (relX + relY) / (dist || 1)) * stretch;
        const bl = baseR + Math.max(0, (-relX + relY) / (dist || 1)) * stretch;
        const radiusStr = `${tl}px ${tr}px ${br}px ${bl}px`;

        const feImage = filter.querySelector("feImage");
        feImage.setAttribute(
          "href",
          getSVGMap(glass, glass.offsetWidth, glass.offsetHeight),
        );
        gsap.to(glass, { borderRadius: radiusStr, duration: 0.1 });
      }

      map.setAttribute("scale", lgConfig.baseScale - dist * 2 * edgeFactor);
    } else if (glass.isStuck) {
      glass.isStuck = false;

      const jellyEase = "elastic.out(1.8, 0.15)";
      let baseR = "0px";

      if (!isCustomShape) {
        baseR = glass.classList.contains("circle")
          ? "50%"
          : glass.classList.contains("square")
            ? "20px"
            : "40px";
        const feImage = filter.querySelector("feImage");
        feImage.setAttribute(
          "href",
          getSVGMap(glass, glass.offsetWidth, glass.offsetHeight),
        );
      }

      gsap.to(glass, {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        borderRadius: isCustomShape ? "0px" : baseR,
        duration: 2.0,
        ease: jellyEase,
      });

      gsap.to(map, {
        attr: { scale: lgConfig.baseScale },
        duration: 2.0,
        ease: jellyEase,
      });
    }
  });
});

// Start Liquid Glass filters when DOM is fully loaded or at next frame
requestAnimationFrame(() => requestAnimationFrame(setupFilters));

/* ════════════════════════════════════════════════════
   §4  WATER — GLOBAL BACKGROUND (IMAGE + RIPPLES)
════════════════════════════════════════════════════ */
(function initWater() {
  const cvs = document.getElementById("s2-canvas");
  if (!cvs) return;

  const R = new THREE.WebGLRenderer({
    canvas: cvs,
    alpha: false,
    antialias: false,
  });
  R.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  const sc = new THREE.Scene(),
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  
  let ss = window.innerWidth < 768 ? 0.25 : 0.45;
  const SW = () => Math.max(2, Math.floor(window.innerWidth * ss));
  const SH = () => Math.max(2, Math.floor(window.innerHeight * ss));
  R.setSize(window.innerWidth, window.innerHeight);

  const rto = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  };
  let rtA = new THREE.WebGLRenderTarget(SW(), SH(), rto),
    rtB = rtA.clone();

  // --- IMAGE LOADING REPLACED CANVAS PAINTING ---
  const loader = new THREE.TextureLoader();
  // BURAYA KENDİ RESİM LİNKİNİ YAZ:
  const bgT = loader.load('https://images.unsplash.com/photo-1706523869158-8fcf6ad998ad?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'); 
  bgT.minFilter = THREE.LinearFilter;
  bgT.magFilter = THREE.LinearFilter;
  // ----------------------------------------------

  const simM = new THREE.ShaderMaterial({
    uniforms: {
      uPrev: { value: null },
      uRes: { value: new THREE.Vector2(SW(), SH()) },
      uMouse: { value: new THREE.Vector3(-9999, -9999, 0) },
      uDamp: { value: 0.996 },
      uSpd: { value: 2 },
      uF: { value: 12.2 },
      uR: { value: 24 },
    },
    vertexShader: `varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `
      uniform sampler2D uPrev;uniform vec2 uRes;uniform vec3 uMouse;
      uniform float uDamp,uSpd,uF,uR;varying vec2 v;
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
        h=clamp(h,-2.,2.);vel=clamp(vel,-2.,2.);
        gl_FragColor=vec4(h,vel,(hR-hL)*.5,(hU-hD)*.5);
      }`,
  });

  const disM = new THREE.ShaderMaterial({
    uniforms: { uSim: { value: null }, uBg: { value: bgT } },
    vertexShader: `varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `
      uniform sampler2D uSim,uBg;varying vec2 v;
      void main(){
        vec4 d=texture2D(uSim,v);float h=d.r;vec2 gr=d.zw;
        // uBg artık boyanmış canvas değil, senin yüklediğin resim.
        // gr*.025 değeri resmin su altındaki kırılma miktarını belirler.
       vec3 col=texture2D(uBg,clamp(v+gr*.05,.001,.999)).rgb;
        vec3 N=normalize(vec3(-gr.x*6.,1.,-gr.y*6.));
        col+=vec3(.88,.94,1.)*pow(max(dot(N,normalize(vec3(-1.2,4.5,2.))),0.),900.)*3.;
        col+=vec3(.25,.55,1.)*pow(max(dot(N,normalize(vec3(2.,3.,-1.))),0.),60.)*.55;
        col+=vec3(.04,.14,.38)*(sin(h*20.)*.5+.5)*abs(h)*.3+vec3(.02,.08,.25)*h*.4;
        vec2 pp=v*2.-1.;col*=1.-dot(pp,pp)*-.1;gl_FragColor=vec4(col,1.);
      }`,
  });

  const quad = new THREE.PlaneGeometry(2, 2);
  const sMesh = new THREE.Mesh(quad, simM),
    dMesh = new THREE.Mesh(quad, disM);
  const mu = simM.uniforms.uMouse.value;
  let mOn = false;

  document.addEventListener("mousemove", (e) => {
    mOn = true;
    mu.x = (e.clientX / window.innerWidth) * SW();
    mu.y = (1 - e.clientY / window.innerHeight) * SH();
  });
  document.addEventListener("mouseleave", () => (mOn = false));
  document.addEventListener("mouseenter", () => (mOn = true));

  function onResize() {
    R.setSize(window.innerWidth, window.innerHeight);
    rtA.setSize(SW(), SH());
    rtB.setSize(SW(), SH());
    simM.uniforms.uRes.value.set(SW(), SH());
    // Arka plan resim olduğu için artık paintBg() çağırmıyoruz.
  }
  window.addEventListener("resize", onResize);

  let pt = 0, bad = 0;
  (function wLoop(t) {
    requestAnimationFrame(wLoop);
    const dt = t - pt;
    pt = t;
    if (dt > 40) bad++;
    else bad = Math.max(0, bad - 1);
    if (bad > 15 && ss > 0.2) {
      ss -= 0.05;
      bad = 0;
      onResize();
    }
    simM.uniforms.uPrev.value = rtB.texture;
    mu.z = mOn ? 1 : 0;
    R.setRenderTarget(rtA);
    sc.add(sMesh);
    R.render(sc, cam);
    sc.remove(sMesh);
    disM.uniforms.uSim.value = rtA.texture;
    R.setRenderTarget(null);
    sc.add(dMesh);
    R.render(sc, cam);
    sc.remove(dMesh);
    const tmp = rtA;
    rtA = rtB;
    rtB = tmp;
  })(0);
})();
/* ════════════════════════════════════════════════════
   §5  PROJECTS HOVER
════════════════════════════════════════════════════ */
(function initProjects() {
  const sec = document.getElementById("s4");
  const mount = document.getElementById("s4-hover-mount");
  const vcur = document.getElementById("prj-vcursor");

  if (!sec || !mount) return;

  const ph = new THREE.Scene(),
    pc = new THREE.PerspectiveCamera(
      45,
      sec.offsetWidth / sec.offsetHeight,
      0.1,
      1000,
    );
  pc.position.z = 10;
  const pr = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  pr.setSize(sec.offsetWidth, sec.offsetHeight);
  pr.setPixelRatio(Math.min(devicePixelRatio, 2));
  mount.appendChild(pr.domElement);

  const pg = new THREE.PlaneGeometry(3.5, 2, 200, 100);
  const pm = new THREE.ShaderMaterial({
    uniforms: {
      uC: { value: null },
      uN: { value: null },
      uP: { value: 0 },
      uO: { value: new THREE.Vector2() },
      uA: { value: 0 },
      uT: { value: 0 },
      uI: { value: 0 },
    },
    vertexShader: `uniform vec2 uO;uniform float uT,uI;varying vec2 v;
      void main(){v=uv;vec3 p=position;
        float w=sin(uv.y*5.+uT)*uI,w2=sin(uv.x*5.-uT*.5)*uI;
        p.x+=sin(uv.y*2.)*uO.x*(.5+w);p.y+=sin(uv.x*4.)*uO.y*(.5+w2);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `uniform sampler2D uC,uN;uniform float uP,uA;varying vec2 v;
      void main(){vec4 c=mix(texture2D(uC,v),texture2D(uN,v),uP);gl_FragColor=vec4(c.rgb,c.a*uA);}`,
    transparent: true,
  });
  const ppl = new THREE.Mesh(pg, pm);
  ph.add(ppl);

  const tl2 = new THREE.TextureLoader(),
    ptex = {};
  document.querySelectorAll(".prj-item").forEach((item) => {
    const id = item.dataset.pid,
      img = document.getElementById(id + "-img");
    if (img) ptex[id] = tl2.load(img.src);
  });

  function mts(mx, my) {
    const rect = pr.domElement.getBoundingClientRect();
    const x = ((mx - rect.left) / rect.width) * 2 - 1,
      y = -((my - rect.top) / rect.height) * 2 + 1;
    const vv = new THREE.Vector3(x, y, 0).unproject(pc);
    const d = vv.sub(pc.position).normalize();
    return pc.position.clone().add(d.multiplyScalar(-pc.position.z / d.z));
  }

  let pmx = 0,
    pmy = 0;
  document.querySelectorAll(".prj-item").forEach((item) => {
    const id = item.dataset.pid;
    item.addEventListener("mouseenter", () => {
      if (!ptex[id]) return;
      if (!pm.uniforms.uC.value) {
        pm.uniforms.uC.value = pm.uniforms.uN.value = ptex[id];
      } else {
        pm.uniforms.uC.value = pm.uniforms.uN.value;
        pm.uniforms.uN.value = ptex[id];
        gsap.to(pm.uniforms.uP, {
          value: 1,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: () => {
            pm.uniforms.uP.value = 0;
            pm.uniforms.uC.value = ptex[id];
          },
        });
      }
      gsap.to(pm.uniforms.uA, { value: 1, duration: 0.3 });
      gsap.to(pm.uniforms.uI, { value: 0.5, duration: 0.3 });
      gsap.to(vcur, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(2)",
      });
    });
    item.addEventListener("mouseleave", () => {
      gsap.to(pm.uniforms.uA, { value: 0, duration: 0.3 });
      gsap.to(pm.uniforms.uI, { value: 0, duration: 0.3 });
      gsap.to(vcur, { scale: 0, opacity: 0, duration: 0.25 });
    });
  });

  document.addEventListener("mousemove", (e) => {
    pmx = e.clientX;
    pmy = e.clientY;
    const pos = mts(e.clientX, e.clientY);
    gsap.to(ppl.position, {
      x: pos.x,
      y: pos.y,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(vcur, { x: e.clientX - 35, y: e.clientY - 35, duration: 0.15 });
    const vx = (e.clientX - pmx + 0.02) * 0.06,
      vy = (e.clientY - pmy + 0.02) * 0.05;
    gsap.to(pm.uniforms.uO.value, { x: vx, y: vy, duration: 0.1 });
  });

  window.addEventListener("resize", () => {
    pc.aspect = sec.offsetWidth / sec.offsetHeight;
    pc.updateProjectionMatrix();
    pr.setSize(sec.offsetWidth, sec.offsetHeight);
  });

  (function pLoop() {
    requestAnimationFrame(pLoop);
    pm.uniforms.uT.value += 0.08;
    pr.render(ph, pc);
  })();
})();
