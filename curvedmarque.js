// Scroll Interactive Marquee - yeni bir JS dosyası oluşturun (scrollMarquee.js)
// veya mevcut portfolio.js dosyanıza ekleyin

function initScrollMarquee() {
  // GSAP ve ScrollTrigger'ın yüklendiğinden emin ol
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not loaded');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  let direction = 1;
  const duration = 8;
  const marquees = document.querySelectorAll(".marquee");

  if (marquees.length === 0) {
    console.warn('No marquee elements found');
    return;
  }

  const tl = gsap.timeline({
    repeat: -1,
    yoyo: false,
    onReverseComplete() {
      this.totalTime(this.rawTime() + this.duration() * 10);
    }
  });

  // Her marquee için animasyon ayarla
  marquees.forEach(marquee => {
    const spans = marquee.querySelectorAll("span");

    tl.to(spans, {
      xPercent: marquee.dataset.reversed === "true" ? -100 : 100,
      repeat: 0,
      ease: "linear",
      duration: duration
    }, "<");
  });

  // Scroll trigger ayarla
  ScrollTrigger.create({
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    onUpdate(self) {
      if (self.direction !== direction) {
        direction *= -1;
      }

      // Scroll hızına göre animasyon hızını ayarla
      const velocity = self.getVelocity();
      const timeScale = Math.abs(velocity) / 500;

      tl.timeScale(timeScale * direction);

      // GSAP ile smooth geçiş
      gsap.to(tl, {
        timeScale: direction,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  });

  console.log('Scroll marquee initialized');
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
  // Diğer GSAP animasyonlarından sonra çalışması için timeout
  setTimeout(initScrollMarquee, 1000);
});

// GSAP yükleme kontrolü
window.addEventListener('load', () => {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    initScrollMarquee();
  }
});