document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
    fetchLatestRelease();
    initScrollAnimations();
    initCanvasAnimation();
});

/**
 * Theme Toggle Functionality
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle.querySelector('.material-symbols-rounded');

    const updateLogos = (isDark) => {
        const logoImages = document.querySelectorAll('.logo img');
        logoImages.forEach(img => {
            img.src = isDark ? 'assets/images/march_icon_color.png' : 'assets/images/march_icon_color_dark.png';
        });
    };

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
        body.classList.remove('dark-mode');
        icon.textContent = 'light_mode';
        updateLogos(false);
    } else if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        body.classList.add('dark-mode');
        icon.textContent = 'dark_mode';
        updateLogos(true);
    } else {
        updateLogos(body.classList.contains('dark-mode'));
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');

        icon.textContent = isDark ? 'dark_mode' : 'light_mode';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateLogos(isDark);
    });
}

/**
 * Localization
 */
function initLanguage() {
    const langSelector = document.querySelector('.lang-selector');
    const langToggle = document.getElementById('lang-toggle');
    const langMenu = document.getElementById('lang-menu');
    const currentLangText = document.getElementById('current-lang');
    const langItems = document.querySelectorAll('.lang-item');

    const savedLang = localStorage.getItem('lang') || navigator.language.split('-')[0] || 'en';
    const finalLang = i18nData[savedLang] ? savedLang : 'en';

    updateLanguage(finalLang);

    langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = langSelector.classList.toggle('active');
        langToggle.setAttribute('aria-expanded', isActive);
    });

    document.addEventListener('click', () => {
        langSelector.classList.remove('active');
        langToggle.setAttribute('aria-expanded', 'false');
    });

    langItems.forEach(item => {
        item.addEventListener('click', () => {
            const selected = item.getAttribute('data-value');
            updateLanguage(selected);
            localStorage.setItem('lang', selected);
            langSelector.classList.remove('active');
            langToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

function updateLanguage(lang) {
    const data = i18nData[lang];
    if (!data) return;

    const currentItem = document.querySelector(`.lang-item[data-value="${lang}"]`);
    const currentLangText = document.getElementById('current-lang');
    if (currentItem && currentLangText) {
        currentLangText.textContent = currentItem.textContent;
    }

    document.querySelectorAll('.lang-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-value') === lang);
    });

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (data[key]) {
            el.innerHTML = data[key];
        }
    });

    document.title = lang === 'en' ? 'March Photobox' : `March Photobox | ${data.hero_title.replace('<span>', '').replace('</span>', '').replace('<span>', '').replace('</span>', '')}`;
}

/**
 * Fetch GitHub
 */
async function fetchLatestRelease() {
    const repo = 'Ayrlin-Renata/march';
    const downloadBtn = document.getElementById('download-btn');

    // Dev mode / Local check
    if (window.location.protocol === 'file:') {
        console.warn('Running locally. GitHub API might fail due to CORS or private repo. Falling back to releases page.');
        downloadBtn.href = `https://github.com/${repo}/releases`;
        return;
    }

    try {
        let response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        let data;

        if (response.status === 404) {
            // If 404, it might because only pre-releases exist. Fetch all releases instead.
            console.log('No "latest" release found. Attempting to fetch from all releases...');
            response = await fetch(`https://api.github.com/repos/${repo}/releases`);
            const allReleases = await response.json();
            if (allReleases && allReleases.length > 0) {
                data = allReleases[0];
            }
        } else if (response.ok) {
            data = await response.json();
        }

        if (!data) throw new Error('No release data found');

        const exeAsset = data.assets.find(asset => asset.name.endsWith('.exe'));

        if (exeAsset) {
            downloadBtn.href = exeAsset.browser_download_url;

            // Add version label if not already present
            if (!downloadBtn.querySelector('.version-tag')) {
                const btnText = downloadBtn.querySelector('.btn-text');
                const versionSpan = document.createElement('span');
                versionSpan.className = 'version-tag';
                versionSpan.style.fontSize = '0.7rem';
                versionSpan.style.opacity = '0.7';
                versionSpan.textContent = `${data.tag_name}`;
                if (btnText) {
                    btnText.appendChild(versionSpan);
                } else {
                    downloadBtn.appendChild(versionSpan);
                }
            }
        } else {
            downloadBtn.href = data.html_url || `https://github.com/${repo}/releases/latest`;
        }
    } catch (err) {
        console.error('GitHub API Error:', err);
        // Fallback is already set in HTML, but ensure it remains a valid link
        if (downloadBtn.href === '#' || !downloadBtn.href) {
            downloadBtn.href = `https://github.com/${repo}/releases`;
        }
    }
}

/**
 * Simple Reveal Animations on Scroll
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-page').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(el);
    });

    // Hero usually reveals faster
    const hero = document.getElementById('hero');
    if (hero) hero.classList.add('reveal');
}

/**
 * Snaking Canvas Background
 */
function initCanvasAnimation() {
    const canvas = document.getElementById('background-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let lines = [];
    const lineCount = 3;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class SnakingLine {
        constructor() {
            this.points = [];
            this.pointCount = 80;
            this.speed = 0.0009 + Math.random() * 0.0006;
            this.offset = Math.random() * 1000;
            this.seedX = Math.random() * 10;
            this.seedY = Math.random() * 10;

            for (let i = 0; i < this.pointCount; i++) {
                this.points.push({ x: width / 2, y: height / 2 });
            }
        }

        update(time, otherLines) {
            const head = this.points[0];

            const t = time * this.speed + this.offset;
            const targetX = width / 2 + Math.sin(t * 0.4 + this.seedX) * (width * 0.3) + Math.cos(t * 0.15) * (width * 0.15);
            const targetY = height / 2 + Math.cos(t * 0.35 + this.seedY) * (height * 0.3) + Math.sin(t * 0.2) * (height * 0.15);

            // Smoothly move head
            head.x += (targetX - head.x) * 0.02;
            head.y += (targetY - head.y) * 0.02;

            otherLines.forEach(other => {
                if (other === this) return;
                const dx = head.x - other.points[0].x;
                const dy = head.y - other.points[0].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 300) {
                    const force = (300 - dist) * 0.0001;
                    head.x += dx * force;
                    head.y += dy * force;
                }
            });

            // Tail follow 
            for (let i = 1; i < this.pointCount; i++) {
                const p = this.points[i];
                const prev = this.points[i - 1];
                p.x += (prev.x - p.x) * 0.11;
                p.y += (prev.y - p.y) * 0.11;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);

            // Path smoothing 
            for (let i = 1; i < this.points.length - 1; i++) {
                const xc = (this.points[i].x + this.points[i + 1].x) / 2;
                const yc = (this.points[i].y + this.points[i + 1].y) / 2;
                ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
            }

            const colorA = getComputedStyle(document.body).getPropertyValue('--accent-blue').trim();
            const colorB = getComputedStyle(document.body).getPropertyValue('--accent-pink').trim();
            const isDark = document.body.classList.contains('dark-mode');

            // gradient
            const grad = ctx.createLinearGradient(this.points[0].x, this.points[0].y, this.points[this.pointCount - 1].x, this.points[this.pointCount - 1].y);
            grad.addColorStop(0, colorA);
            grad.addColorStop(1, colorB);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.25;

            // Glowing effect
            ctx.shadowBlur = 15;
            ctx.shadowColor = Math.random() > 0.5 ? colorA : colorB;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    function init() {
        lines = [];
        for (let i = 0; i < lineCount; i++) {
            lines.push(new SnakingLine());
        }
    }

    function animate(time) {
        ctx.clearRect(0, 0, width, height);

        lines.forEach(line => {
            line.update(time, lines);
            line.draw();
        });

        requestAnimationFrame(animate);
    }

    init();
    animate(0);
}
