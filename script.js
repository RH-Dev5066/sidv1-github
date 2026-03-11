/* ===================================
   GLOBAL VARIABLES
   =================================== */
let selectedFiles = [];
const MAX_TOTAL_SIZE = 7 * 1024 * 1024; // 7MB

document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroll();
    initHeroSlider();
    initJamStatus();
    initCounters();
    initFilters();
    initAccordion();
    initGaleriFilter();
    initLightbox();
    initRevealAnimation();
    initSmoothScroll();
    initFormValidation();
    initRedirectUrl();
    initFileUpload();
    initNavbarIndicator();
    checkFormStatus();
    initOfficials();
    initConfirmationModal();
});

/* ===================================
   Navbar Scroll Effect
   =================================== */
function initNavbarScroll() {
    const navbar = document.getElementById('mainNavbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            }
        });
    });
}

/* ===================================
   Hero Slider
   =================================== */
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.getElementById('sliderDots');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    
    if (!slides.length || !dotsContainer) return;
    
    let currentIndex = 0;
    let autoplayInterval;
    
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        if (index === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    const dots = document.querySelectorAll('.slider-dot');
    
    function goToSlide(index) {
        slides[currentIndex].classList.remove('active');
        dots[currentIndex].classList.remove('active');
        
        currentIndex = index;
        if (currentIndex >= slides.length) currentIndex = 0;
        if (currentIndex < 0) currentIndex = slides.length - 1;
        
        slides[currentIndex].classList.add('active');
        dots[currentIndex].classList.add('active');
        
        resetAutoplay();
    }
    
    function nextSlide() { goToSlide(currentIndex + 1); }
    function prevSlide() { goToSlide(currentIndex - 1); }
    
    function resetAutoplay() {
        clearInterval(autoplayInterval);
        autoplayInterval = setInterval(nextSlide, 6000);
    }
    
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    resetAutoplay();
    
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
        heroSection.addEventListener('mouseleave', resetAutoplay);
    }
}

/* ===================================
   Jam Status (Dengan API Hari Libur Indonesia)
   =================================== */
let cachedHolidays = [];

async function fetchIndonesianHolidays(year) {
    const apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/ID`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Gagal mengambil data API");
        
        const data = await response.json();
        cachedHolidays = data.map(h => h.date);
        console.log(`Data hari libur tahun ${year} berhasil dimuat (${cachedHolidays.length} hari).`);
    } catch (error) {
        console.warn("Gagal memuat API Hari Libur, menggunakan kalkulasi lokal.", error);
        cachedHolidays = [];
    }
}

function gregorianToHijri(date) {
    let jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
    let l = jd - 1948440 + 10632;
    let n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    let month = Math.floor((24 * l) / 709);
    let day = l - Math.floor((709 * month) / 24);
    let year = 30 * n + j - 30;
    return { year, month, day };
}

function checkIndonesianHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (cachedHolidays.length > 0) {
        return cachedHolidays.includes(dateStr);
    }

    const fixedHolidays = [
        [1, 1], [5, 1], [5, 2], [6, 1], [8, 17], [12, 25]
    ];
    for (let h of fixedHolidays) {
        if (h[0] === month && h[1] === day) return true;
    }

    const hijri = gregorianToHijri(date);
    if (hijri.month === 10 && hijri.day <= 2) return true;
    if (hijri.month === 12 && hijri.day === 10) return true;
    if (hijri.month === 3 && hijri.day === 12) return true;
    if (hijri.month === 1 && hijri.day === 1) return true;

    return false;
}

function initJamStatus() {
    const statusText = document.getElementById('statusText');
    const jamStatus = document.getElementById('jamStatus');
    const jamWaktuDisplay = document.getElementById('jamWaktuWeekday');
    
    const currentYear = new Date().getFullYear();
    fetchIndonesianHolidays(currentYear);

    function updateStatus() {
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours * 60 + minutes;
        
        const isHoliday = checkIndonesianHoliday(now);
        
        const openTime = 8 * 60;
        const closeTime = 16 * 60;
        
        if (jamWaktuDisplay) jamWaktuDisplay.textContent = "08.00 - 16.00 WITA";

        let isOpen = false;
        let statusMessage = '';

        if (day === 0 || day === 6 || isHoliday) {
            isOpen = false;
            statusMessage = 'Tutup';
        } else {
            isOpen = currentTime >= openTime && currentTime < closeTime;
            statusMessage = isOpen ? 'Buka Sekarang' : 'Tutup';
        }
        
        if (statusText) statusText.textContent = statusMessage;
        
        if (jamStatus) {
            const jamStatusDot = jamStatus.querySelector('.status-indicator');
            const jamStatusText = jamStatus.querySelector('.status-text');
            
            if (isOpen) {
                jamStatusDot.classList.remove('closed');
                jamStatusText.textContent = 'Sedang Melayani';
            } else {
                jamStatusDot.classList.add('closed');
                jamStatusText.textContent = 'Sedang Tutup';
            }
        }
    }
    
    updateStatus();
    setInterval(updateStatus, 60000);
}

/* ===================================
   Counter Animation
   =================================== */
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    let animated = false;
    
    function animateCounter(counter) {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString('id-ID');
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString('id-ID');
            }
        };
        updateCounter();
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                counters.forEach(counter => animateCounter(counter));
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

/* ===================================
   Table Filter
   =================================== */
function initFilters() {
    const filterBtns = document.querySelectorAll('.data-filter .filter-btn');
    const tableRows = document.querySelectorAll('#dataTable tbody tr');
    const tableFoot = document.getElementById('tableFoot');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            
            tableRows.forEach(row => {
                if (filter === 'all') {
                    row.classList.remove('hidden');
                } else {
                    const category = row.getAttribute('data-category');
                    row.classList.toggle('hidden', category !== filter);
                }
            });

            if (tableFoot) tableFoot.style.display = filter === 'all' ? '' : 'none';
        });
    });
}

/* ===================================
   Accordion
   =================================== */
function initAccordion() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        
        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            accordionItems.forEach(i => i.classList.remove('active'));
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

/* ===================================
   Toggle Potensi
   =================================== */
function togglePotensi() {
    const hiddenItems = document.querySelectorAll('.potensi-hidden');
    const btn = document.getElementById('togglePotensiBtn');
    const btnText = btn.querySelector('.btn-text');
    
    const isExpanded = btn.classList.contains('expanded');
    
    if (isExpanded) {
        hiddenItems.forEach(item => item.classList.remove('visible'));
        btn.classList.remove('expanded');
        btnText.textContent = 'Lihat Semua Potensi';
        setTimeout(() => {
            document.getElementById('potensi').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else {
        hiddenItems.forEach((item, index) => {
            setTimeout(() => item.classList.add('visible'), index * 80);
        });
        btn.classList.add('expanded');
        btnText.textContent = 'Tampilkan Lebih Sedikit';
    }
}
window.togglePotensi = togglePotensi;

/* ===================================
   Galeri Filter (UPDATED: Easy Config)
   =================================== */
async function initGaleriFilter() {
    const galeriContainer = document.getElementById('galeriMasonry');
    const tabBtns = document.querySelectorAll('.galeri-tabs .tab-btn');
    
    if (!galeriContainer) return;

    // ==================================================
    // PENGATURAN GALERI: UBAH LINK GAMBAR DI BAWAH INI
    // ==================================================
    // Format:
    // url: Link gambar (Bisa link Google Drive langsung atau URL gambar biasa)
    // category: 'kegiatan' (biarkan ini agar muncul di tab)
    // caption: Judul singkat gambar
    // date: Tanggal kegiatan (biarkan new Date() jika tidak ingin mengurutkan)
    
    const manualImages = [

        {
            url: 'Sosialisasi.jpg',
            category: 'kegiatan',
            caption: 'Sosialisasi rukun Sesama teman antara pelajar yang di SD Negeri 56 Paradayya.',
            date: new Date("2026-02-24")
        },
        {
            url: 'https://drive.google.com/file/d/18YU7Pcl4Ur-8XVXzsn_72lfItCwFxcW2/view?usp=sharing',
            category: 'kegiatan',
            caption: 'Seminar Proker KKN UNITAMA',
            date: new Date("2026-02-13")
        },
        // CONTOH: Tambahkan gambar baru di bawah ini
        
        {
            url: 'MUSRENBANG.png',
            category: 'kegiatan',
            caption: 'MUSRENBANG DESA',
            date: new Date("2026-02-02")
        },
        {
            url: 'musyawarah.jpg',
            category: 'kegiatan',
            caption: 'Musyawarah Rencana Pembangunan Desa (MUSRENBANG DESA) Pembahasan dokumen RPJMDESA Periode 2023-2031',
            date: new Date("2026-02-02")
        },
        {
            url: 'PARIPURNA.jpg',
            category: 'kegiatan',
            caption: 'SIDANG PARIPURNA PENYAMPAIAN LAPORAN KETERANGAN PENYELENGGARAAN PEMERINTAH DESA (LKPD)',
            date: new Date("2025-12-31")
        }
        
    ];
    // ==================================================
    // AKHIR PENGATURAN GALERI
    // ==================================================

    // Konfigurasi Feed Instagram (Kosongkan string '' jika tidak digunakan)
    const instagramFeedUrl = ''; 
    
    // Jika URL feed kosong, langsung render data manual saja
    if (!instagramFeedUrl) {
        renderGallery(manualImages, galeriContainer, tabBtns);
        return;
    }

    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(instagramFeedUrl)}`;
    
    let allGalleryData = [...manualImages];

    try {
        console.log("Mengambil data dari: ", apiUrl);
        const response = await fetch(apiUrl);
        const result = await response.json();

        console.log("Hasil API:", result);

        if (result.status === 'ok' && result.items) {
            const timeLimit = new Date();
            timeLimit.setFullYear(timeLimit.getFullYear() - 1);

            result.items.forEach(item => {
                const postDate = new Date(item.pubDate);
                if (postDate < timeLimit) return;

                let imageUrl = '';
                
                // Prioritas 1: Enclosure (Standar)
                if (item.enclosure && item.enclosure.link) {
                    imageUrl = item.enclosure.link;
                } 
                // Prioritas 2: Thumbnail
                else if (item.thumbnail) {
                    imageUrl = item.thumbnail;
                }
                // Prioritas 3: Cari di konten HTML
                else if (item.description) {
                    const imgMatch = item.description.match(/src="(https?:\/\/[^"]+)"/);
                    if (imgMatch) imageUrl = imgMatch[1];
                }

                if (imageUrl) {
                    imageUrl = htmlDecode(imageUrl);
                    
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = item.title || 'Aktivitas Desa';
                    const cleanCaption = tempDiv.textContent.split(" ").slice(0, 8).join(" ") + "...";

                    allGalleryData.push({
                        url: imageUrl,
                        category: 'kegiatan',
                        caption: cleanCaption,
                        date: postDate
                    });
                }
            });
        } else {
            console.error("Gagal mengambil data (Status tidak ok):", result.message);
        }
    } catch (error) {
        console.error("Error saat fetch data Instagram:", error);
    }

    // Urutkan dan Render
    allGalleryData.sort((a, b) => (b.date || 0) - (a.date || 0));
    renderGallery(allGalleryData, galeriContainer, tabBtns);
}

// Fungsi terpisah untuk merender gallery
function renderGallery(data, container, tabBtns) {
    lightboxImages = []; 
    container.innerHTML = ''; 

    if(data.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5">Tidak ada gambar ditemukan.</div>';
        return;
    }

    data.forEach((item, index) => {
        const finalUrl = processImageUrl(item.url);
        lightboxImages.push({ src: finalUrl, caption: item.caption });

        const galeriItem = document.createElement('div');
        galeriItem.className = 'galeri-item';
        galeriItem.setAttribute('data-category', item.category);
        
        galeriItem.innerHTML = `
            <img src="${finalUrl}" alt="${item.caption}" loading="lazy" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Gagal+Load'; this.style.opacity='0.5';">
            <div class="galeri-overlay"><span>${item.caption}</span></div>
        `;
        galeriItem.addEventListener('click', () => openLightbox(index));
        container.appendChild(galeriItem);
    });

    // Logika Tab
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-tab'); 
            const items = document.querySelectorAll('.galeri-item');
            items.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filter === 'kegiatan' || category === filter) {
                    item.classList.remove('hidden');
                    item.style.animation = 'fadeInUp 0.5s ease forwards';
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
}

/* ===================================
   Process Image URL (CRITICAL FOR DRIVE & INSTAGRAM)
   =================================== */
function processImageUrl(url) {
    if (!url) return '';
    url = htmlDecode(url); 

    // 1. Google Drive (Mengubah link view biasa menjadi link thumbnail)
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w4000`;

    // 2. Instagram / Facebook CDN (Wajib Proxy agar muncul)
    if (url.includes('cdninstagram') || url.includes('fbcdn.net') || url.includes('scontent')) {
        return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=800&q=80&output=webp`;
    }

    // 3. Link biasa langsung
    return url;
}

function htmlDecode(input) {
    const doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

/* ===================================
   Lightbox Functions
   =================================== */
let currentScale = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startDragX = 0;
let startDragY = 0;
let startPanX = 0;
let startPanY = 0;
let isPinching = false;
let initialPinchDistance = 0;
let lastPinchMidpoint = { x: 0, y: 0 };
let touchStartX = 0;
let touchEndX = 0;
let currentLightboxIndex = 0;
let lightboxImages = [];

(function injectSharpenFilter() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("style", "position: absolute; width: 0; height: 0;");
    svg.innerHTML = `<defs><filter id="sharpFilter"><feConvolveMatrix order="3" kernelMatrix="0 -1 0   -1 5 -1   0 -1 0" /></filter></defs>`;
    document.body.appendChild(svg);
})();

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const container = document.getElementById('lightboxContainer');
    const lightboxImage = document.getElementById('lightboxImage');
    if (!lightbox || !container || !lightboxImage) return;

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = lightboxImage.getBoundingClientRect();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        let newScale = Math.min(Math.max(1, currentScale + delta), 5);
        if (newScale !== currentScale) {
            const scaleRatio = newScale / currentScale;
            if (newScale > 1) {
                const dx = e.clientX - (rect.left + rect.width / 2);
                const dy = e.clientY - (rect.top + rect.height / 2);
                panX -= dx * (scaleRatio - 1);
                panY -= dy * (scaleRatio - 1);
            }
            currentScale = newScale;
            if (currentScale === 1) { panX = 0; panY = 0; }
            applyZoomTransform();
        }
    });

    lightboxImage.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (currentScale === 1) { currentScale = 2.5; } else { currentScale = 1; panX = 0; panY = 0; }
        applyZoomTransform();
    });

    container.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'IMG') return;
        if (currentScale > 1) {
            isDragging = true; startDragX = e.clientX; startDragY = e.clientY;
            startPanX = panX; startPanY = panY;
            container.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) { panX = startPanX + (e.clientX - startDragX); panY = startPanY + (e.clientY - startDragY); applyZoomTransform(); }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        const container = document.getElementById('lightboxContainer');
        if(container) container.style.cursor = currentScale > 1 ? 'grab' : 'default';
    });

    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            isPinching = true; isDragging = false;
            initialPinchDistance = getDistanceBetweenTouches(e.touches);
            lastPinchMidpoint = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
        } else if (e.touches.length === 1) {
            if (currentScale > 1) { isDragging = true; startDragX = e.touches[0].clientX; startDragY = e.touches[0].clientY; startPanX = panX; startPanY = panY; } 
            else { touchStartX = e.touches[0].clientX; }
        }
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
        if (isPinching && e.touches.length === 2) {
            e.preventDefault();
            const rect = lightboxImage.getBoundingClientRect();
            const currentDistance = getDistanceBetweenTouches(e.touches);
            const scaleRatio = currentDistance / initialPinchDistance;
            let newScale = Math.min(Math.max(1, currentScale * scaleRatio), 5);
            const currentMidpoint = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
            const dx = currentMidpoint.x - (rect.left + rect.width / 2);
            const dy = currentMidpoint.y - (rect.top + rect.height / 2);
            if (Math.abs(newScale - currentScale) > 0.01) { panX -= dx * (scaleRatio - 1); panY -= dy * (scaleRatio - 1); }
            panX += (currentMidpoint.x - lastPinchMidpoint.x); panY += (currentMidpoint.y - lastPinchMidpoint.y);
            lastPinchMidpoint = currentMidpoint;
            currentScale = newScale;
            initialPinchDistance = currentDistance;
            if (currentScale === 1) { panX = 0; panY = 0; }
            applyZoomTransform();
        } else if (isDragging && e.touches.length === 1 && currentScale > 1) {
            e.preventDefault();
            panX = startPanX + (e.touches[0].clientX - startDragX);
            panY = startPanY + (e.touches[0].clientY - startDragY);
            applyZoomTransform();
        } else if (!isDragging && !isPinching && currentScale === 1) { touchEndX = e.touches[0].clientX; }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
        if (isPinching) { isPinching = false; if (currentScale < 1.2) { currentScale = 1; panX = 0; panY = 0; applyZoomTransform(); } }
        if (isDragging) { isDragging = false; } 
        else if (currentScale === 1) {
            handleSwipeGesture();
            if (window.innerWidth <= 768) {
                const rect = container.getBoundingClientRect();
                const clickX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - rect.left;
                const width = rect.width;
                if (clickX < width * 0.4) navigateLightbox(-1);
                else if (clickX > width * 0.6) navigateLightbox(1);
            }
        }
    });

    let lastTap = 0;
    lightboxImage.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            if (currentScale === 1) { currentScale = 2.5; } else { currentScale = 1; panX = 0; panY = 0; }
            applyZoomTransform();
            e.preventDefault();
        }
        lastTap = currentTime;
    });
}

function getDistanceBetweenTouches(touches) {
    return Math.sqrt(Math.pow(touches[1].clientX - touches[0].clientX, 2) + Math.pow(touches[1].clientY - touches[0].clientY, 2));
}

function applyZoomTransform() {
    const lightboxImage = document.getElementById('lightboxImage');
    const container = document.getElementById('lightboxContainer');
    if (lightboxImage) {
        lightboxImage.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
        if (currentScale > 1.1) lightboxImage.style.filter = "url(#sharpFilter)";
        else lightboxImage.style.filter = "none";
        if (container) container.style.cursor = currentScale > 1 ? 'grab' : 'default';
    }
}

function resetZoomState() { currentScale = 1; panX = 0; panY = 0; isDragging = false; isPinching = false; applyZoomTransform(); }

function handleSwipeGesture() {
    if (currentScale > 1) return;
    const threshold = 50;
    if (touchEndX < touchStartX - threshold) navigateLightbox(1);
    if (touchEndX > touchStartX + threshold) navigateLightbox(-1);
}

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    if (!lightbox || !lightboxImage) return;
    currentLightboxIndex = index;
    resetZoomState(); 
    lightboxImage.setAttribute('referrerpolicy', 'no-referrer');
    lightboxImage.src = lightboxImages[index].src;
    lightboxCaption.textContent = lightboxImages[index].caption;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) { lightbox.classList.remove('active'); document.body.style.overflow = ''; resetZoomState(); }
}

function navigateLightbox(direction) {
    if (lightboxImages.length === 0) return;
    currentLightboxIndex += direction;
    if (currentLightboxIndex >= lightboxImages.length) currentLightboxIndex = 0;
    if (currentLightboxIndex < 0) currentLightboxIndex = lightboxImages.length - 1;
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    if (lightboxImage) {
        lightboxImage.style.opacity = '0';
        setTimeout(() => {
            resetZoomState();
            lightboxImage.setAttribute('referrerpolicy', 'no-referrer');
            lightboxImage.src = lightboxImages[currentLightboxIndex].src;
            lightboxCaption.textContent = lightboxImages[currentLightboxIndex].caption;
            lightboxImage.style.opacity = '1';
        }, 200);
    }
}

window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navigateLightbox = navigateLightbox;

/* ===================================
   GOOGLE SHEETS INTEGRATION
   =================================== */
const CONFIG = {
    url: 'https://script.google.com/macros/s/AKfycbztPN3N8LIFkgXQWYTApHvo_LVJNmb1kMyhviEZpJG8LoMeB-nLuZ0naVwTy3o3kmdqbg/exec',
    localData: [
        { jabatan: 'Kepala Desa', nama: 'H. Syamsuddin, B', foto: 'kades.jpeg', status: 'aktif' },
        { jabatan: 'Sekretaris Desa', nama: 'Reskianto, S.Pd.', foto: 'img/2.png', status: 'aktif' },
        { jabatan: 'Kaur Keuangan', nama: 'Muh Haris, S.P.', foto: 'img/7.png', status: 'aktif' },
        { jabatan: 'Kaur Umum', nama: 'Nurlia, S.Pd.', foto: 'img/3.png', status: 'aktif' },
        { jabatan: 'Kaur Perencanaan', nama: '-', foto: 'img/8.png', status: 'kosong' },
        { jabatan: 'Kasi Pemerintahan', nama: 'M. Tahir, S.Pd.', foto: 'img/5.png', status: 'aktif' },
        { jabatan: 'Kasi Kesejahteraan', nama: 'Wilda Afrianti', foto: 'img/4.png', status: 'aktif' },
        { jabatan: 'Kasi Pelayanan', nama: 'Miranti', foto: 'img/6.png', status: 'aktif' }
    ]
};
let officialsCache = null;

async function loadOfficialsData() {
    try {
        const response = await fetch(CONFIG.url);
        if (!response.ok) throw new Error('Gagal koneksi');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
            officialsCache = result.data;
            return officialsCache;
        } throw new Error('Format data salah');
    } catch (error) {
        console.warn("Menggunakan data lokal...");
        officialsCache = CONFIG.localData;
        return officialsCache;
    }
}

function updateAllCards(data) {
    const cardMapping = {
        'card-kepala-desa': 'Kepala Desa',
        'card-sekretaris': 'Sekretaris Desa',
        'card-kaur-keuangan': 'Kaur Keuangan',
        'card-kaur-umum': 'Kaur Umum',
        'card-kaur-perencanaan': 'Kaur Perencanaan',
        'card-kasi-pemerintahan': 'Kasi Pemerintahan',
        'card-kasi-kesejahteraan': 'Kasi Kesejahteraan',
        'card-kasi-pelayanan': 'Kasi Pelayanan'
    };
    Object.entries(cardMapping).forEach(([cardId, roleName]) => {
        const card = document.getElementById(cardId);
        if (!card) return;
        const person = data.find(item => item.jabatan && item.jabatan.toLowerCase().trim() === roleName.toLowerCase());
        if (person) {
            const nameEl = card.querySelector('.name');
            if (nameEl) {
                nameEl.textContent = person.nama || '-';
                nameEl.style.fontStyle = (person.status === 'kosong' || person.nama === '-') ? 'italic' : 'normal';
            }
            const imgEl = card.querySelector('.org-avatar');
            if (imgEl) {
                let rawUrl = person.foto || person.Foto || '';
                if (rawUrl) {
                    let finalUrl = rawUrl.trim();
                    const driveMatch = finalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (driveMatch && driveMatch[1]) finalUrl = `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w400`;
                    imgEl.src = finalUrl;
                    imgEl.onerror = function() { this.src = 'img/8.png'; };
                } else { imgEl.src = 'img/8.png'; }
            }
        }
    });
}

async function initOfficials() {
    const data = await loadOfficialsData();
    updateAllCards(data);
}

/* ===================================
   Reveal Animation
   =================================== */
function initRevealAnimation() {
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealElements.forEach(el => revealObserver.observe(el));
}

/* ===================================
   Navbar Active Indicator
   =================================== */
function initNavbarIndicator() {
    const navbar = document.querySelector('.navbar-custom');
    const navMenu = document.querySelector('.navbar-custom .navbar-nav');
    const navLinks = document.querySelectorAll('.navbar-custom .nav-link');
    const sections = document.querySelectorAll('section[id]');

    if (!navMenu) return;
    let line = document.querySelector('.nav-active-line');
    if (!line) { line = document.createElement('div'); line.className = 'nav-active-line'; navMenu.appendChild(line); }

    function moveLineTo(element) {
        if (!element || window.innerWidth < 992) { line.style.width = '0'; line.style.opacity = '0'; return; }
        const menuRect = navMenu.getBoundingClientRect();
        const linkRect = element.getBoundingClientRect();
        line.style.left = `${linkRect.left - menuRect.left}px`;
        line.style.width = `${linkRect.width}px`;
        if (navbar.classList.contains('scrolled')) line.style.opacity = '1';
    }

    function onScroll() {
        const scrollY = window.scrollY;
        const navbarHeight = navbar.offsetHeight;
        let currentSectionId = scrollY < 100 ? 'beranda' : '';
        if (!currentSectionId) {
            sections.forEach(section => {
                const sectionTop = section.offsetTop - navbarHeight - 100;
                if (scrollY >= sectionTop && scrollY < sectionTop + section.offsetHeight) currentSectionId = section.getAttribute('id');
            });
        }
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') && link.getAttribute('href').substring(1) === currentSectionId) {
                link.classList.add('active');
                moveLineTo(link);
            }
        });
    }
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', () => { const activeLink = document.querySelector('.navbar-custom .nav-link.active'); if (activeLink) moveLineTo(activeLink); });
    onScroll();
}

/* ===================================
   Smooth Scroll
   =================================== */
function initSmoothScroll() { }

/* ===================================
   Dynamic Redirect URL
   =================================== */
function initRedirectUrl() {
    const nextUrlInput = document.getElementById('nextUrl');
    if (nextUrlInput) nextUrlInput.value = window.location.href.split('?')[0].split('#')[0] + '?sent=true#beranda';
}

/* ===================================
   Multi-File Upload Handler (UPDATED)
   =================================== */
function initFileUpload() {
    const wrapper = document.getElementById('fileUploadWrapper');
    const input = document.getElementById('lampiran');
    const fileListContainer = document.getElementById('fileListContainer');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const sizeWarning = document.getElementById('sizeWarning');
    
    if (!wrapper || !input || !fileListContainer) return;

    // Drag & Drop Events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        wrapper.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        wrapper.addEventListener(eventName, () => wrapper.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        wrapper.addEventListener(eventName, () => wrapper.classList.remove('dragover'), false);
    });

    // Handle Drop
    wrapper.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    });

    // Handle Click/Select
    input.addEventListener('change', function() {
        handleFiles(this.files);
    });

    // Clear All Button
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearAllFiles();
        });
    }

    function handleFiles(files) {
        const newFiles = Array.from(files);
        
        // Filter valid file types
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        const validFiles = newFiles.filter(file => validTypes.includes(file.type));

        if (validFiles.length !== newFiles.length) {
            showNotification('error', 'Format Tidak Didukung', 'Beberapa file diabaikan. Gunakan format JPG, PNG, atau PDF.');
        }

        // Add to selected files (avoid duplicates)
        validFiles.forEach(file => {
            const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
            if (!exists) {
                selectedFiles.push(file);
            }
        });

        // Update hidden inputs logic & UI
        updateFileInput(); 
        renderFileList();
        checkTotalSize();
        toggleUploadMode(); // NEW: Toggle UI Mode
    }
}

/* ===================================
   NEW: Toggle Upload Mode
   =================================== */
function toggleUploadMode() {
    const wrapper = document.getElementById('fileUploadWrapper');
    const fileListContainer = document.getElementById('fileListContainer');
    
    if (selectedFiles.length > 0) {
        // Mode: File sudah ada - sembunyikan wrapper utama
        if (wrapper) wrapper.classList.add('has-files');
        if (fileListContainer) fileListContainer.classList.add('active');
    } else {
        // Mode: Tidak ada file - tampilkan wrapper utama
        if (wrapper) wrapper.classList.remove('has-files');
        if (fileListContainer) fileListContainer.classList.remove('active');
    }
}

/* ===================================
   Update File Input - Hidden Inputs Strategy
   =================================== */
function updateFileInput() {
    const hiddenContainer = document.getElementById('hiddenFileInputs');
    
    if (!hiddenContainer) {
        console.error('Container #hiddenFileInputs tidak ditemukan. Tambahkan di HTML.');
        return;
    }

    // 1. Hapus semua input tersembunyi sebelumnya
    hiddenContainer.innerHTML = '';

    // 2. Buat input tersembunyi baru untuk setiap file yang dipilih
    selectedFiles.forEach((file, index) => {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.name = `Lampiran_${index + 1}`; // Nama unik: Lampiran_1, Lampiran_2, dst.
        hiddenInput.hidden = true;
        
        // Masukkan file ke dalam input tersembunyi ini
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        hiddenInput.files = dataTransfer.files;
        
        hiddenContainer.appendChild(hiddenInput);
    });
}

function removeFile(index) {
    const input = document.getElementById('lampiran');
    const sizeWarning = document.getElementById('sizeWarning');
    
    selectedFiles.splice(index, 1);
    
    // Update UI & Hidden Inputs
    renderFileList();
    checkTotalSize();
    updateFileInput();
    toggleUploadMode(); // NEW: Toggle UI Mode
    
    if (selectedFiles.length === 0) {
        if (input) input.value = '';
        if (sizeWarning) sizeWarning.classList.remove('active');
    }
}

function clearAllFiles() {
    const input = document.getElementById('lampiran');
    const sizeWarning = document.getElementById('sizeWarning');
    const hiddenContainer = document.getElementById('hiddenFileInputs');
    
    selectedFiles = [];
    if (input) input.value = ''; 
    
    // Bersihkan hidden inputs
    if (hiddenContainer) hiddenContainer.innerHTML = '';
    
    renderFileList();
    checkTotalSize();
    toggleUploadMode(); // NEW: Toggle UI Mode
    
    if (sizeWarning) sizeWarning.classList.remove('active');
}

function renderFileList() {
    const fileListContainer = document.getElementById('fileListContainer');
    const fileList = document.getElementById('fileList');
    const fileCount = document.getElementById('fileCount');
    
    if (!fileListContainer || !fileList) return;
    
    if (selectedFiles.length === 0) {
        fileListContainer.classList.remove('active');
        return;
    }

    fileListContainer.classList.add('active');
    fileCount.textContent = selectedFiles.length;

    fileList.innerHTML = selectedFiles.map((file, index) => {
        const iconClass = getFileIconClass(file.type);
        const iconSymbol = getFileIcon(file.type);
        
        return `
            <div class="file-item" data-index="${index}">
                <div class="file-icon ${iconClass}">
                    <i class="${iconSymbol}"></i>
                </div>
                <div class="file-info">
                    <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <button type="button" class="remove-btn" onclick="removeFile(${index})" aria-label="Hapus file">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `;
    }).join('');

    // NEW: Tambahkan button "Tambah File" di bawah list
    addMoreFilesButton();
}

/* ===================================
   NEW: Add More Files Button
   =================================== */
function addMoreFilesButton() {
    const fileListContainer = document.getElementById('fileListContainer');
    
    // Hapus button lama jika ada
    let existingBtn = document.getElementById('addMoreFilesBtn');
    if (existingBtn) existingBtn.remove();
    
    // Cek apakah sudah mencapai batas
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize >= MAX_TOTAL_SIZE) return;
    
    // Buat button baru
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.id = 'addMoreFilesBtn';
    addBtn.className = 'add-more-files-btn active';
    addBtn.innerHTML = `<i class="bi bi-plus-circle"></i> Tambah File Lainnya`;
    
    // Event click untuk membuka file picker
    addBtn.addEventListener('click', () => {
        const input = document.getElementById('lampiran');
        if (input) input.click();
    });
    
    // Sisipkan setelah file-list-container (sebagai sibling)
    if (fileListContainer) {
        fileListContainer.insertAdjacentElement('afterend', addBtn);
    }
}

function checkTotalSize() {
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const sizeBarFill = document.getElementById('sizeBarFill');
    const totalSizeText = document.getElementById('totalSizeText');
    const sizeWarning = document.getElementById('sizeWarning');
    const wrapper = document.getElementById('fileUploadWrapper');
    
    const percentage = Math.min((totalSize / MAX_TOTAL_SIZE) * 100, 100);

    if (sizeBarFill) sizeBarFill.style.width = `${percentage}%`;
    if (totalSizeText) totalSizeText.textContent = formatFileSize(totalSize);

    // Reset classes
    if (sizeBarFill) sizeBarFill.classList.remove('warning', 'error');
    if (totalSizeText) totalSizeText.classList.remove('warning', 'error');
    if (sizeWarning) sizeWarning.classList.remove('active');
    if (wrapper) wrapper.classList.remove('size-exceeded');

    if (totalSize > MAX_TOTAL_SIZE) {
        if (sizeBarFill) sizeBarFill.classList.add('error');
        if (totalSizeText) totalSizeText.classList.add('error');
        if (sizeWarning) sizeWarning.classList.add('active');
        if (wrapper) wrapper.classList.add('size-exceeded');
    } else if (totalSize > MAX_TOTAL_SIZE * 0.8) {
        if (sizeBarFill) sizeBarFill.classList.add('warning');
        if (totalSizeText) totalSizeText.classList.add('warning');
    }
}

function getFileIconClass(type) {
    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf') return 'pdf';
    return 'default';
}

function getFileIcon(type) {
    if (type.startsWith('image/')) return 'bi bi-file-earmark-image';
    if (type === 'application/pdf') return 'bi bi-file-earmark-pdf';
    return 'bi bi-file-earmark';
}

// Make functions global
window.removeFile = removeFile;
window.clearAllFiles = clearAllFiles;

/* ===================================
   Notification System
   =================================== */
function showNotification(type, title, message) {
    const modal = document.getElementById('notificationModal');
    const iconWrapper = document.getElementById('notificationIconWrapper');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    if (!modal || !iconWrapper || !titleEl || !messageEl) return;
    
    modal.classList.remove('success', 'error', 'active');
    modal.classList.add(type);
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    if (type === 'success') iconWrapper.innerHTML = `<svg viewBox="0 0 52 52"><circle class="checkmark-circle" cx="26" cy="26" r="24"/><path class="checkmark-check" d="M14 27l7 7 16-16"/></svg>${generateConfetti()}`;
    else iconWrapper.innerHTML = `<svg viewBox="0 0 52 52"><circle class="cross-circle" cx="26" cy="26" r="24"/><path class="cross-line1" d="M18 18l16 16"/><path class="cross-line2" d="M34 18l-16 16"/></svg>`;
    
    requestAnimationFrame(() => modal.classList.add('active'));
    document.body.style.overflow = 'hidden';
}

function closeNotification() {
    const modal = document.getElementById('notificationModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function generateConfetti() {
    const colors = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0'];
    let confettiHTML = '<div class="confetti-container">';
    for (let i = 0; i < 20; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        confettiHTML += `<div class="confetti" style="left:${Math.random()*100}%; background:${color}; animation-delay:${Math.random()*0.5}s;"></div>`;
    }
    return confettiHTML + '</div>';
}

document.addEventListener('click', (e) => { if (e.target.classList.contains('notification-overlay')) closeNotification(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNotification(); });
window.closeNotification = closeNotification;

/* ===================================
   Form Confirmation Variables
   =================================== */
let pendingFormElement = null;

/* ===================================
   Confirmation Modal Functions
   =================================== */
function initConfirmationModal() {
    const btnNo = document.getElementById('btnConfirmNo');
    const btnYes = document.getElementById('btnConfirmYes');
    const overlay = document.querySelector('.confirmation-overlay');
    
    if (btnNo) btnNo.addEventListener('click', closeConfirmation);
    if (btnYes) btnYes.addEventListener('click', confirmYes);
    if (overlay) overlay.addEventListener('click', closeConfirmation);
    
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('confirmationModal');
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeConfirmation();
    });
}

function showConfirmation(form) {
    const modal = document.getElementById('confirmationModal');
    const summaryContainer = document.getElementById('confirmationSummary');
    if (!modal || !summaryContainer) return;
    
    const nama = form.querySelector('#nama').value.trim();
    const email = form.querySelector('#email').value.trim();
    const nik = form.querySelector('#nik').value.trim();
    const telepon = form.querySelector('#telepon').value.trim();
    const alamat = form.querySelector('#alamat').value.trim();
    const subjek = form.querySelector('#subjek').value.trim();
    const pesan = form.querySelector('#pesan').value.trim();
    
    const hasFile = selectedFiles.length > 0;
    
    pendingFormElement = form;
    
    // Info file
    let fileInfo = 'Tidak ada';
    if (hasFile) {
        const totalFileSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
        const fileNames = selectedFiles.map(f => f.name).join(', ');
        fileInfo = `${selectedFiles.length} file (${formatFileSize(totalFileSize)}): ${fileNames.length > 40 ? fileNames.substring(0, 40) + '...' : fileNames}`;
    }
    
    // Masking NIK
    let nikDisplay = nik.substring(0, 4) + '********' + nik.substring(12);
    
    // Masking No. Telepon
    let teleponDisplay = telepon;
    if (telepon.length > 7) {
        teleponDisplay = telepon.substring(0, 4) + '****' + telepon.substring(telepon.length - 3);
    }
    
    // Cek status wajib lampiran
    const config = LAMPIRAN_CONFIG[subjek];
    const lampiranStatus = config && config.wajib ? '<span style="color: #059669;"><i class="bi bi-check-circle-fill"></i> Wajib (Sudah dilampirkan)</span>' : '<span style="color: #6b7280;">Opsional</span>';
    
    summaryContainer.innerHTML = `
        <div class="confirmation-summary-item"><span>Nama</span><span>${escapeHtml(nama)}</span></div>
        <div class="confirmation-summary-item"><span>Email</span><span>${escapeHtml(email)}</span></div>
        <div class="confirmation-summary-item"><span>NIK</span><span>${escapeHtml(nikDisplay)}</span></div>
        <div class="confirmation-summary-item"><span>No. Telepon</span><span>${escapeHtml(teleponDisplay)}</span></div>
        <div class="confirmation-summary-item"><span>Alamat</span><span>${escapeHtml(alamat.length > 50 ? alamat.substring(0, 50) + '...' : alamat)}</span></div>
        <div class="confirmation-summary-item"><span>Subjek</span><span>${escapeHtml(subjek)}</span></div>
        <div class="confirmation-summary-item"><span>Pesan</span><span>${escapeHtml(pesan.length > 60 ? pesan.substring(0, 60) + '...' : pesan)}</span></div>
        <div class="confirmation-summary-item"><span>Lampiran</span><span>${hasFile ? escapeHtml(fileInfo) : lampiranStatus}</span></div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeConfirmation() {
    const modal = document.getElementById('confirmationModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function confirmYes() {
    const btnYes = document.getElementById('btnConfirmYes');
    if (!pendingFormElement) { closeConfirmation(); return; }
    
    if (btnYes) {
        btnYes.disabled = true;
        btnYes.innerHTML = '<span class="spinner-border-sm me-2"></span>Mengirim...';
    }
    setTimeout(() => { pendingFormElement.submit(); }, 100);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div'); div.textContent = text; return div.innerHTML;
}
window.closeConfirmation = closeConfirmation;

/* ===================================
   Email Validation Configuration
   =================================== */
const EMAIL_CONFIG = {
    allowedFreeDomains: [
        'gmail.com', 'yahoo.com', 'yahoo.co.id', 'yahoo.co.uk', 'yahoo.com.sg',
        'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
        'icloud.com', 'me.com', 'mac.com',
        'aol.com', 'mail.com', 'protonmail.com', 'proton.me',
        'zoho.com', 'yandex.com', 'yandex.ru', 'gmx.com', 'gmx.de'
    ],
    allowedSchoolTlds: [
        '.sch.id', '.ac.id', '.edu', '.edu.sg', '.edu.my', '.edu.au', '.ac.uk', '.ac.jp', '.edu.pk'
    ],
    blockedDomains: [
        'tempmail.com', 'temp-mail.org', 'throwaway.com', '10minutemail.com',
        'guerrillamail.com', 'mailinator.com', 'fakeinbox.com', 'temp-mail.com',
        'dispostable.com', 'mailnesia.com', 'tempmailaddress.com', 'mohmal.com',
        'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net',
        'spam4.me', 'grr.la', 'getairmail.com', 'dropmail.me'
    ]
};

/* ===================================
   Email Validation Functions
   =================================== */
function initEmailValidation() {
    const emailInput = document.getElementById('email');
    const emailFeedback = document.getElementById('emailFeedback');
    if (!emailInput || !emailFeedback) return;
    
    let debounceTimer;
    emailInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (this.value.trim() !== '') validateEmailInput(this.value);
            else resetEmailValidation();
        }, 500);
    });
    
    emailInput.addEventListener('blur', function() { if (this.value.trim() !== '') validateEmailInput(this.value); });
    emailInput.addEventListener('focus', function() {
        if (this.classList.contains('is-invalid')) {
            this.classList.remove('is-invalid');
            emailFeedback.classList.remove('error', 'success');
            emailFeedback.style.display = 'none';
        }
    });
}

function validateEmailInput(email) {
    const emailInput = document.getElementById('email');
    const emailFeedback = document.getElementById('emailFeedback');
    if (!emailInput || !emailFeedback) return false;
    
    emailInput.classList.remove('is-invalid', 'is-valid');
    emailFeedback.classList.remove('error', 'success');
    
    if (!email || email.trim() === '') { showEmailError('Email tidak boleh kosong.'); return false; }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { showEmailError('Format email tidak valid. Contoh: nama@domain.com'); return false; }
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) { showEmailError('Domain email tidak ditemukan.'); return false; }

    const validDomainChars = /^[a-z0-9.-]+$/;
    if (!validDomainChars.test(domain)) { showEmailError('Domain mengandung karakter tidak valid.'); return false; }
    if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) { showEmailError('Domain tidak valid.'); return false; }

    if (EMAIL_CONFIG.blockedDomains.includes(domain)) { showEmailError('Email sementara tidak diperbolehkan.'); return false; }

    const isAllowedFreeDomain = EMAIL_CONFIG.allowedFreeDomains.includes(domain);
    const isSchoolDomain = checkSchoolDomain(domain);

    if (!isAllowedFreeDomain && !isSchoolDomain) {
        showEmailError('Gunakan email Gmail, Yahoo, Outlook, atau email institusi pendidikan.');
        return false;
    }
    
    if (email.length > 254) { showEmailError('Email terlalu panjang.'); return false; }
    
    showEmailSuccess(isSchoolDomain);
    return true;
}

function checkSchoolDomain(domain) {
    return EMAIL_CONFIG.allowedSchoolTlds.some(tld => domain.endsWith(tld));
}

function showEmailError(message) {
    const emailInput = document.getElementById('email');
    const emailFeedback = document.getElementById('emailFeedback');
    if (emailInput) { emailInput.classList.remove('is-valid'); emailInput.classList.add('is-invalid'); }
    if (emailFeedback) {
        emailFeedback.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i>${message}`;
        emailFeedback.classList.remove('success'); emailFeedback.classList.add('error'); emailFeedback.style.display = 'block';
    }
}

function showEmailSuccess(isSchool) {
    const emailInput = document.getElementById('email');
    const emailFeedback = document.getElementById('emailFeedback');
    if (emailInput) { emailInput.classList.remove('is-invalid'); emailInput.classList.add('is-valid'); }
    if (emailFeedback) {
        const message = isSchool ? `<i class="bi bi-check-circle-fill"></i>Email institusi valid.` : `<i class="bi bi-check-circle-fill"></i>Email valid.`;
        emailFeedback.innerHTML = message;
        emailFeedback.classList.remove('error'); emailFeedback.classList.add('success'); emailFeedback.style.display = 'block';
    }
}

function resetEmailValidation() {
    const emailInput = document.getElementById('email');
    const emailFeedback = document.getElementById('emailFeedback');
    if (emailInput) emailInput.classList.remove('is-invalid', 'is-valid');
    if (emailFeedback) { emailFeedback.classList.remove('error', 'success'); emailFeedback.style.display = 'none'; emailFeedback.innerHTML = ''; }
}

window.validateEmailInput = validateEmailInput;

/* ===================================
   Form Validation
   =================================== */
function initFormValidation() {
    const form = document.getElementById('kontakForm');
    if (!form) return;
    
    initEmailValidation();
    initNikValidation();
    initTeleponValidation();
    initLampiranDinamis();

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        let firstInvalid = null;
        
        // Reset semua border
        inputs.forEach(input => input.style.borderColor = '');
        
        // Validasi input wajib
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false; 
                if (!firstInvalid) firstInvalid = input; 
                input.style.borderColor = '#ef4444';
            }
        });
        
        // Validasi Email
        const emailInput = form.querySelector('#email');
        if (emailInput && emailInput.value.trim()) {
            if (!validateEmailInput(emailInput.value.trim())) { 
                isValid = false; 
                if (!firstInvalid) firstInvalid = emailInput; 
            }
        }

        // Validasi NIK (WAJIB)
        const nikInput = form.querySelector('#nik');
        if (nikInput) {
            if (!nikInput.value.trim()) {
                isValid = false;
                if (!firstInvalid) firstInvalid = nikInput;
                nikInput.style.borderColor = '#ef4444';
                showNikError('NIK wajib diisi.');
            } else if (!validateNikInput(nikInput.value.trim())) { 
                isValid = false; 
                if (!firstInvalid) firstInvalid = nikInput; 
            }
        }

        // Validasi Telepon (Wajib)
        const teleponInput = form.querySelector('#telepon');
        if (teleponInput) {
            if (!teleponInput.value.trim()) {
                isValid = false;
                if (!firstInvalid) firstInvalid = teleponInput;
                teleponInput.style.borderColor = '#ef4444';
            } else if (!validateTeleponInput(teleponInput.value.trim())) { 
                isValid = false; 
                if (!firstInvalid) firstInvalid = teleponInput; 
            }
        }

        // ===================================
        // VALIDASI LAMPIRAN DINAMIS (WAJIB)
        // ===================================
        const subjekSelect = form.querySelector('#subjek');
        const wrapper = document.getElementById('fileUploadWrapper');
        const lampiranWarning = document.getElementById('lampiranWarning');
        
        if (subjekSelect && subjekSelect.value) {
            const selectedSubjek = subjekSelect.value;
            const config = LAMPIRAN_CONFIG[selectedSubjek];
            
            if (config && config.wajib && selectedFiles.length === 0) {
                isValid = false;
                
                // Tampilkan warning
                if (lampiranWarning) lampiranWarning.classList.add('active');
                
                // Tambahkan class invalid ke wrapper
                if (wrapper) {
                    wrapper.classList.add('is-invalid');
                    if (!firstInvalid) firstInvalid = wrapper.querySelector('.file-upload-input');
                }
                
                showNotification('error', 'Lampiran Wajib', `Mohon lampirkan dokumen pendukung untuk subjek "${selectedSubjek}".`);
            } else {
                // Reset warning jika sudah valid
                if (lampiranWarning) lampiranWarning.classList.remove('active');
                if (wrapper) wrapper.classList.remove('is-invalid');
            }
        }

        // Validasi ukuran file
        const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > MAX_TOTAL_SIZE) {
            isValid = false;
            showNotification('error', 'Ukuran File Terlalu Besar', `Total ukuran file (${formatFileSize(totalSize)}) melebihi batas 7MB.`);
            return;
        }
        
        if (!isValid) {
            showNotification('error', 'Form Tidak Lengkap', 'Mohon lengkapi semua field dengan benar.');
            if (firstInvalid) {
                if (firstInvalid.focus) {
                    firstInvalid.focus();
                } else if (firstInvalid.scrollIntoView) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            return;
        }
        
        showConfirmation(form);
    });
}

/* ===================================
   NIK & Telepon Validation
   =================================== */
function initNikValidation() {
    const nikInput = document.getElementById('nik');
    const nikFeedback = document.getElementById('nikFeedback');
    if (!nikInput) return;

    let debounceTimer;
    nikInput.addEventListener('input', function() {
        // Hanya izinkan angka
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 16);
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (this.value.trim() !== '') {
                validateNikInput(this.value);
            } else {
                resetNikValidation();
            }
        }, 300);
    });

    nikInput.addEventListener('blur', function() {
        if (this.value.trim() !== '') {
            validateNikInput(this.value);
        }
    });

    nikInput.addEventListener('focus', function() {
        if (this.classList.contains('is-invalid')) {
            this.classList.remove('is-invalid');
            nikFeedback.classList.remove('error', 'success');
            nikFeedback.style.display = 'none';
        }
    });
}

function validateNikInput(nik) {
    const nikInput = document.getElementById('nik');
    const nikFeedback = document.getElementById('nikFeedback');
    if (!nikInput || !nikFeedback) return false;

    nikInput.classList.remove('is-invalid', 'is-valid');
    nikFeedback.classList.remove('error', 'success');

    if (nik.length === 0) {
        showNikError('NIK wajib diisi.');
        return false;
    }

    if (nik.length !== 16) {
        showNikError('NIK harus terdiri dari 16 digit angka.');
        return false;
    }

    // Validasi format NIK Indonesia
    const tanggal = parseInt(nik.substring(6, 8));
    const bulan = parseInt(nik.substring(8, 10));

    // Tanggal: 01-31 atau 41-71 (perempuan)
    const tanggalValid = (tanggal >= 1 && tanggal <= 31) || (tanggal >= 41 && tanggal <= 71);
    const bulanValid = bulan >= 1 && bulan <= 12;

    if (!tanggalValid) {
        showNikError('Format NIK tidak valid (digit tanggal salah).');
        return false;
    }

    if (!bulanValid) {
        showNikError('Format NIK tidak valid (digit bulan salah).');
        return false;
    }

    showNikSuccess();
    return true;
}

function showNikError(message) {
    const nikInput = document.getElementById('nik');
    const nikFeedback = document.getElementById('nikFeedback');
    if (nikInput) {
        nikInput.classList.remove('is-valid');
        nikInput.classList.add('is-invalid');
    }
    if (nikFeedback) {
        nikFeedback.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i>${message}`;
        nikFeedback.classList.remove('success');
        nikFeedback.classList.add('error');
        nikFeedback.style.display = 'block';
    }
}

function showNikSuccess() {
    const nikInput = document.getElementById('nik');
    const nikFeedback = document.getElementById('nikFeedback');
    if (nikInput) {
        nikInput.classList.remove('is-invalid');
        nikInput.classList.add('is-valid');
    }
    if (nikFeedback) {
        nikFeedback.innerHTML = `<i class="bi bi-check-circle-fill"></i>Format NIK valid.`;
        nikFeedback.classList.remove('error');
        nikFeedback.classList.add('success');
        nikFeedback.style.display = 'block';
    }
}

function resetNikValidation() {
    const nikInput = document.getElementById('nik');
    const nikFeedback = document.getElementById('nikFeedback');
    if (nikInput) nikInput.classList.remove('is-invalid', 'is-valid');
    if (nikFeedback) {
        nikFeedback.classList.remove('error', 'success');
        nikFeedback.style.display = 'none';
        nikFeedback.innerHTML = '';
    }
}

/* ===================================
   Telepon Validation
   =================================== */
function initTeleponValidation() {
    const teleponInput = document.getElementById('telepon');
    const teleponFeedback = document.getElementById('teleponFeedback');
    if (!teleponInput) return;

    let debounceTimer;
    teleponInput.addEventListener('input', function() {
        // Hanya izinkan angka, +, dan spasi
        this.value = this.value.replace(/[^0-9+\s-]/g, '').slice(0, 15);
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (this.value.trim() !== '') {
                validateTeleponInput(this.value);
            } else {
                resetTeleponValidation();
            }
        }, 300);
    });

    teleponInput.addEventListener('blur', function() {
        if (this.value.trim() !== '') {
            validateTeleponInput(this.value);
        }
    });

    teleponInput.addEventListener('focus', function() {
        if (this.classList.contains('is-invalid')) {
            this.classList.remove('is-invalid');
            teleponFeedback.classList.remove('error', 'success');
            teleponFeedback.style.display = 'none';
        }
    });
}

function validateTeleponInput(telepon) {
    const teleponInput = document.getElementById('telepon');
    const teleponFeedback = document.getElementById('teleponFeedback');
    if (!teleponInput || !teleponFeedback) return false;

    teleponInput.classList.remove('is-invalid', 'is-valid');
    teleponFeedback.classList.remove('error', 'success');

    if (telepon.trim() === '') {
        showTeleponError('Nomor telepon tidak boleh kosong.');
        return false;
    }

    // Bersihkan dari karakter non-digit
    const cleanNumber = telepon.replace(/[^0-9]/g, '');

    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
        showTeleponError('Nomor telepon harus 10-15 digit.');
        return false;
    }

    // Validasi format Indonesia
    // Format: 08xx, +62 8xx, 62 8xx
    const isValidIndonesia = 
        cleanNumber.startsWith('08') ||           // Format lokal: 08123456789
        cleanNumber.startsWith('628') ||          // Format internasional tanpa +: 628123456789
        (cleanNumber.startsWith('62') && cleanNumber.length >= 11); // +62 format

    if (!isValidIndonesia) {
        showTeleponError('Gunakan format Indonesia (08xx atau +62).');
        return false;
    }

    showTeleponSuccess();
    return true;
}

function showTeleponError(message) {
    const teleponInput = document.getElementById('telepon');
    const teleponFeedback = document.getElementById('teleponFeedback');
    if (teleponInput) {
        teleponInput.classList.remove('is-valid');
        teleponInput.classList.add('is-invalid');
    }
    if (teleponFeedback) {
        teleponFeedback.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i>${message}`;
        teleponFeedback.classList.remove('success');
        teleponFeedback.classList.add('error');
        teleponFeedback.style.display = 'block';
    }
}

function showTeleponSuccess() {
    const teleponInput = document.getElementById('telepon');
    const teleponFeedback = document.getElementById('teleponFeedback');
    if (teleponInput) {
        teleponInput.classList.remove('is-invalid');
        teleponInput.classList.add('is-valid');
    }
    if (teleponFeedback) {
        teleponFeedback.innerHTML = `<i class="bi bi-check-circle-fill"></i>Nomor valid.`;
        teleponFeedback.classList.remove('error');
        teleponFeedback.classList.add('success');
        teleponFeedback.style.display = 'block';
    }
}

function resetTeleponValidation() {
    const teleponInput = document.getElementById('telepon');
    const teleponFeedback = document.getElementById('teleponFeedback');
    if (teleponInput) teleponInput.classList.remove('is-invalid', 'is-valid');
    if (teleponFeedback) {
        teleponFeedback.classList.remove('error', 'success');
        teleponFeedback.style.display = 'none';
        teleponFeedback.innerHTML = '';
    }
}

/* ===================================
   Check Form Status
   =================================== */
function checkFormStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('sent')) {
        showNotification('success', 'Pesan Terkirim!', 'Terima kasih telah menghubungi kami.');
        const cleanUrl = window.location.href.split('?')[0].split('#')[0] + '#beranda';
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

/* ===================================
   Utility Functions
   =================================== */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/* ===================================
   CSS Animation
   =================================== */
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .lightbox-image-container img { transition: opacity 0.3s ease; }
`;
document.head.appendChild(styleSheet);

/* ===================================
   Konfigurasi Pesan Lampiran per Subjek
   =================================== */
const LAMPIRAN_CONFIG = {
    'Umum': {
        pesan: 'Lampirkan dokumen pendukung jika diperlukan untuk mempercepat proses.',
        tipe: 'info',
        wajib: false,
        contoh: ['Surat permohonan', 'Dokumen pendukung']
    },
    'Sosial': {
        pesan: 'Lampirkan dokumen berikut untuk pengajuan bantuan sosial:',
        tipe: 'warning',
        wajib: true,
        contoh: ['KTP', 'Kartu Keluarga (KK)', 'Surat Keterangan Tidak Mampu (SKTM)', 'Foto kondisi rumah']
    },
    'Kesehatan': {
        pesan: 'Lampirkan dokumen berikut untuk layanan kesehatan:',
        tipe: 'warning',
        wajib: true,
        contoh: ['KTP', 'Kartu BPJS', 'Surat rujukan dokter (jika ada)', 'Rekam medis']
    },
    'Keamanan': {
        pesan: 'Lampirkan bukti untuk laporan keamanan:',
        tipe: 'warning',
        wajib: true,
        contoh: ['KTP pelapor', 'Foto bukti kejadian', 'Kronologi tertulis']
    },
    'Kebersihan': {
        pesan: 'Lampirkan bukti untuk laporan kebersihan:',
        tipe: 'info',
        wajib: false,
        contoh: ['Foto kondisi lokasi', 'Deskripsi lokasi lengkap']
    },
    'Permintaan': {
        pesan: 'Lampirkan dokumen untuk permohonan surat/layanan:',
        tipe: 'warning',
        wajib: true,
        contoh: ['KTP', 'Kartu Keluarga (KK)', 'Surat pengantar RT/RW', 'Dokumen pendukung sesuai jenis permohonan']
    },
    'Lainnya': {
        pesan: 'Lampirkan dokumen pendukung jika diperlukan.',
        tipe: 'info',
        wajib: false,
        contoh: ['Dokumen relevan']
    }
};

/* ===================================
   Inisialisasi Lampiran Dinamis
   =================================== */
function initLampiranDinamis() {
    const subjekSelect = document.getElementById('subjek');
    const lampiranInfo = document.getElementById('lampiranInfo');
    const lampiranPesan = document.getElementById('lampiranPesan');
    const lampiranRequiredMark = document.getElementById('lampiranRequiredMark');
    const lampiranWarning = document.getElementById('lampiranWarning');
    const wrapper = document.getElementById('fileUploadWrapper');
    
    if (!subjekSelect || !lampiranInfo || !lampiranPesan) return;

    subjekSelect.addEventListener('change', function() {
        const selectedSubjek = this.value;
        
        // Reset warning & invalid state
        if (lampiranWarning) lampiranWarning.classList.remove('active');
        if (wrapper) wrapper.classList.remove('is-invalid');
        
        if (!selectedSubjek) {
            // Reset ke pesan default
            lampiranPesan.textContent = 'Pilih subjek terlebih dahulu untuk melihat persyaratan lampiran.';
            lampiranInfo.className = 'lampiran-info';
            if (lampiranRequiredMark) lampiranRequiredMark.style.display = 'none';
            return;
        }

        const config = LAMPIRAN_CONFIG[selectedSubjek];
        
        if (config) {
            // Set tipe styling
            lampiranInfo.className = `lampiran-info ${config.tipe}`;
            
            // Tampilkan/sembunyikan tanda wajib (*) di label
            if (lampiranRequiredMark) {
                lampiranRequiredMark.style.display = config.wajib ? 'inline' : 'none';
            }
            
            // Bangun HTML pesan
            let htmlContent = `<strong>${config.pesan}</strong>`;
            
            if (config.contoh && config.contoh.length > 0) {
                htmlContent += '<ul>';
                config.contoh.forEach(item => {
                    htmlContent += `<li>${item}</li>`;
                });
                htmlContent += '</ul>';
            }
            
            // Tambahkan status wajib/tidak
            if (config.wajib) {
                htmlContent += '<em style="font-size: 0.8rem; opacity: 0.9;"><i class="bi bi-exclamation-circle me-1"></i>Lampiran wajib diisi</em>';
            } else {
                htmlContent += '<em style="font-size: 0.8rem; opacity: 0.8;"><i class="bi bi-info-circle me-1"></i>Lampiran opsional</em>';
            }
            
            lampiranPesan.innerHTML = htmlContent;
        }
    });
}

/* ===================================
   Modal Produk
   =================================== */
const productData = {
    porang: {
        title: 'Porang',
        image: 'Porang.png',
        description: 'Porang unggulan berkualitas ekspor dengan kandungan glukomanan tinggi. Dibudidayakan oleh petani lokal menggunakan teknik pertanian yang terkontrol dan berkelanjutan. Umbinya bernilai ekonomis tinggi serta diminati industri pangan dan kesehatan.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Porang'
    },
    cengkeh: {
        title: 'Cengkeh',
        image: 'Cengkeh.png',
        description: 'Cengkeh pilihan berstandar premium dengan aroma kuat dan kadar minyak atsiri tinggi. Ditanam dan dirawat oleh petani lokal melalui praktik budidaya yang terencana, ramah lingkungan, dan berorientasi pada kualitas hasil panen.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Cengkeh'
    },
    durian: {
        title: 'Durian',
        image: 'Durian.png',
        description: 'Durian unggul berkualitas premium yang dibudidayakan dengan perawatan intensif dan teknik pemupukan terkontrol. Ditanam oleh petani lokal berpengalaman dengan metode budidaya berkelanjutan yang menjaga kesuburan tanah. Buahnya berdaging tebal, bertekstur lembut, serta memiliki rasa manis legit dengan aroma khas yang menggoda. Cocok untuk konsumsi keluarga maupun peluang usaha bernilai tinggi.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Durian'
    },
    rambutan: {
        title: 'Rambutan',
        image: 'Rambutan.png',
        description: 'Rambutan premium yang dibudidayakan secara alami tanpa penggunaan bahan kimia sintetis, dihasilkan langsung oleh petani desa yang berpengalaman dan berkomitmen pada praktik pertanian ramah lingkungan.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Rambutan'
    },
    coklat: {
        title: 'Coklat',
        image: 'Cokelat.png',
        description: 'Tanaman coklat unggulan dengan biji berkualitas tinggi dan produktivitas stabil. Dibudidayakan oleh petani lokal dengan teknik perawatan terkontrol untuk menghasilkan kakao bercita rasa khas dan bernilai jual tinggi.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Coklat'
    },
    jagung: {
        title: 'Jagung',
        image: 'Jagung.png',
        description: 'Jagung berkualitas unggul dengan biji berisi dan rasa manis alami, siap memenuhi kebutuhan pasar yang terus meningkat. Dibudidayakan oleh petani lokal secara konsisten dan terencana untuk menghasilkan panen yang stabil, produktif, serta menguntungkan.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Jagung'
    },
    merica: {
        title: 'Merica',
        image: 'lada.png',
        description: 'Merica unggulan dengan butiran padat, aroma tajam, dan rasa pedas khas yang memperkaya setiap hidangan. Dibudidayakan petani lokal secara terkontrol untuk menghasilkan rempah berkualitas tinggi dan bernilai jual.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Merica'
    },
    kopi: {
        title: 'Kopi',
        image: 'kopi.png',
        description: 'Kopi pilihan berkualitas unggul dengan cita rasa khas dan aroma yang kuat. Ditanam oleh petani lokal menggunakan teknik budidaya terkontrol untuk menghasilkan biji kopi premium bernilai jual tinggi.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Kopi'
    },
    salak: {
        title: 'Salak',
        image: 'Salak.png',
        description: 'Salak premium dengan rasa manis segar dan tekstur renyah menggoda di setiap gigitan. Ditanam dan dirawat petani lokal secara optimal, menghasilkan buah berkualitas tinggi dan bernilai ekonomis menjanjikan.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Salak'
    },
    nangka: {
        title: 'Nangka',
        image: 'Nangka.png',
        description: 'Nangka unggul berbuah lebat dengan daging tebal, manis alami, dan aroma khas menggoda. Dibudidayakan petani lokal secara terawat untuk kualitas terbaik dan peluang usaha menjanjikan.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Nangka'
    },
    pisang: {
        title: 'Pisang',
        image: 'Pisang.png',
        description: 'Pisang unggulan berkualitas tinggi dengan rasa manis alami dan tekstur lembut, dibudidayakan oleh petani lokal secara berkelanjutan. Cocok untuk konsumsi harian maupun usaha olahan, segar, sehat, dan bernilai jual tinggi.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Pisang'
    },
    langsat: {
        title: 'Langsat',
        image: 'Langsat.png',
        description: 'Langsat unggulan dengan rasa manis segar dan daging buah tebal, cocok untuk konsumsi maupun peluang usaha. Dibudidayakan petani lokal dengan perawatan optimal untuk hasil panen berkualitas dan bernilai jual tinggi.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Langsat'
    },
    sukun: {
        title: 'Sukun',
        image: 'sukun.png',
        description: 'Sukun unggulan berbuah lebat dengan daging tebal dan tekstur lembut, cocok diolah menjadi berbagai produk bernilai jual tinggi. Dibudidayakan petani lokal dengan perawatan optimal untuk hasil panen berkualitas dan peluang usaha menjanjikan.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Sukun'
    },
    talas: {
        title: 'Talas',
        image: 'Talas.png',
        description: 'Talas unggulan dengan umbi besar, tekstur pulen, dan cita rasa gurih alami, cocok untuk konsumsi rumah tangga maupun usaha kuliner. Dibudidayakan petani lokal dengan perawatan optimal sehingga menghasilkan panen berkualitas dan bernilai jual tinggi.',
        contact: 'pembdesbontobontoa01@gmail.com, untuk pemesanan Talas'
    },
};

function openModal(productId) {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const product = productData[productId];
    if (!product || !modal || !modalBody) return;
    modalBody.innerHTML = `
        <img src="${product.image}" alt="${product.title}">
        <div class="modal-body-content">
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            <div class="modal-contact"><strong>Email:</strong> ${product.contact}</div>
        </div>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}
window.openModal = openModal;
window.closeModal = closeModal;