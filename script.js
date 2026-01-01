document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchLatestRelease();
    initScrollAnimations();
});

/**
 * Theme Toggle Functionality
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle.querySelector('.material-symbols-rounded');

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
        body.classList.remove('dark-mode');
        icon.textContent = 'light_mode';
    } else if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        body.classList.add('dark-mode');
        icon.textContent = 'dark_mode';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');

        icon.textContent = isDark ? 'dark_mode' : 'light_mode';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

/**
 * Fetch latest EXE from GitHub
 */
async function fetchLatestRelease() {
    const repo = 'Ayrlin-Renata/march';
    const downloadBtn = document.getElementById('download-btn');

    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        if (!response.ok) throw new Error('Failed to fetch release');

        const data = await response.json();
        // Look for .exe in assets
        const exeAsset = data.assets.find(asset => asset.name.endsWith('.exe'));

        if (exeAsset) {
            downloadBtn.href = exeAsset.browser_download_url;
            // Optionally add version info
            const versionSpan = document.createElement('span');
            versionSpan.style.fontSize = '0.7rem';
            versionSpan.style.opacity = '0.7';
            versionSpan.style.marginLeft = '8px';
            versionSpan.textContent = `v${data.tag_name}`;
            downloadBtn.appendChild(versionSpan);
        } else {
            downloadBtn.href = `https://github.com/${repo}/releases/latest`;
        }
    } catch (err) {
        console.error('GitHub API Error:', err);
        downloadBtn.href = `https://github.com/${repo}/releases/latest`;
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
    hero.classList.add('reveal');

    // Add reveal class to CSS dynamically via script or just handle it here
    const style = document.createElement('style');
    style.textContent = `
        .reveal {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}
