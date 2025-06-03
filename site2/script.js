// Syver - Den Uventede AI-Reisen
document.addEventListener('DOMContentLoaded', () => {
    console.log('Syvers presentasjonsside lastet - Mestvinnende AI-kreatør på Gullhaien 2025');
    
    // Custom cursor
    const cursor = document.querySelector('.cursor');
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX - cursor.offsetWidth / 2 + 'px';
        cursor.style.top = e.clientY - cursor.offsetHeight / 2 + 'px';
    });

    // Add hover effect to interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .tech-tags span, .social-link, .project-list li');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                if (entry.target.classList.contains('story-section')) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe all story sections
    document.querySelectorAll('.story-section').forEach((section) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Parallax effect for the header
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('.glitch-header');
        header.style.transform = `translateY(${scrolled * 0.5}px)`;
    });

    // Add hover effect to video container
    const videoWrapper = document.querySelector('.video-wrapper');
    if (videoWrapper) {
        videoWrapper.addEventListener('mouseenter', () => {
            videoWrapper.style.transform = 'scale(1.02)';
            videoWrapper.style.transition = 'transform 0.3s ease';
        });
        
        videoWrapper.addEventListener('mouseleave', () => {
            videoWrapper.style.transform = 'scale(1)';
        });
    }

    // Add awards data
    const awards = [
        { title: 'Sølv - FINN', festival: 'Gullhaien 2025' },
        { title: 'Bronse - Memory Maker', festival: 'Gullhaien 2025' },
        { title: 'Bronse - Fluks', festival: 'Gullhaien 2025' },
        { title: '1. plass', festival: 'Project Odyssey Lambda' },
        { title: '2. plass', festival: 'Project Odyssey ElevenLabs' }
    ];

    const awardsGrid = document.querySelector('.awards-grid');
    if (awardsGrid) {
        awards.forEach(award => {
            const awardElement = document.createElement('div');
            awardElement.className = 'award-item';
            awardElement.innerHTML = `
                <h4>${award.title}</h4>
                <p>${award.festival}</p>
            `;
            awardsGrid.appendChild(awardElement);
        });
    }

    // Add typing effect to quotes
    const quotes = document.querySelectorAll('blockquote');
    quotes.forEach(quote => {
        const text = quote.textContent;
        quote.textContent = '';
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                quote.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        typeWriter();
    });

    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });

    // Add smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Add particle effect to header
    const header = document.querySelector('.glitch-header');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        header.appendChild(particle);
    }

    // Add this to the existing Intersection Observer code
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe timeline items
    document.querySelectorAll('.timeline-item').forEach((item) => {
        timelineObserver.observe(item);
    });
}); 