/**
 * PACESETTERS G-TRAVELS LIMITED - INTERACTIVE ENGINE
 * Flagship UI Interactions: Navigation, Fleet Lightbox, Network Explorer,
 * Service Modals, and Concierge Dispatch Brief Generator
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ========================================================================
     1. STICKY FROSTED NAVBAR & MOBILE DRAWER
     ======================================================================== */
  const header = document.getElementById('site-header');
  const navToggle = document.getElementById('nav-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

  const updateHeaderScroll = () => {
    if (!header) return;
    if (window.scrollY > 16) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', updateHeaderScroll, { passive: true });
  updateHeaderScroll();

  if (navToggle && mobileDrawer) {
    const closeDrawer = () => {
      mobileDrawer.classList.remove('open');
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      document.body.classList.toggle('nav-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
        closeDrawer();
      }
    });
  }

  /* ========================================================================
     2. SCROLL REVEAL (INTERSECTION OBSERVER)
     ======================================================================== */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ========================================================================
     3. FLEET SHOWROOM FILTERING & LIGHTBOX MODAL
     ======================================================================== */
  const fleetFilterBtns = document.querySelectorAll('[data-fleet-filter]');
  const fleetCards = Array.from(document.querySelectorAll('.fleet-card'));

  fleetFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-fleet-filter');
      fleetFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      fleetCards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        const show = filter === 'all' || cat === filter;
        card.style.display = show ? 'flex' : 'none';
      });
    });
  });

  // Lightbox
  const lightbox = document.getElementById('fleet-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxRequestBtn = document.getElementById('lightbox-request-btn');

  let currentLightboxIndex = -1;

  const getVisibleFleetCards = () =>
    fleetCards.filter((card) => card.style.display !== 'none');

  const openLightboxAt = (index) => {
    const visible = getVisibleFleetCards();
    if (!lightbox || !visible.length) return;
    const safeIdx = ((index % visible.length) + visible.length) % visible.length;
    currentLightboxIndex = safeIdx;
    const card = visible[safeIdx];
    const img = card.querySelector('.fleet-media img');
    const title = card.querySelector('h3')?.textContent || '';
    const desc = card.querySelector('.fleet-body p')?.textContent || '';
    const vehicleVal = card.getAttribute('data-vehicle') || title;

    if (lightboxImg && img) {
      lightboxImg.src = img.getAttribute('src');
      lightboxImg.alt = img.getAttribute('alt') || title;
    }
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxDesc) lightboxDesc.textContent = desc;
    if (lightboxRequestBtn) {
      lightboxRequestBtn.setAttribute('data-vehicle-select', vehicleVal);
    }

    lightbox.classList.add('open');
    document.body.classList.add('modal-open');
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.classList.remove('modal-open');
  };

  fleetCards.forEach((card) => {
    const media = card.querySelector('.fleet-media');
    media?.addEventListener('click', () => {
      const visible = getVisibleFleetCards();
      const idx = visible.indexOf(card);
      openLightboxAt(idx >= 0 ? idx : 0);
    });
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', () => openLightboxAt(currentLightboxIndex - 1));
  lightboxNext?.addEventListener('click', () => openLightboxAt(currentLightboxIndex + 1));

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Request Vehicle from Card or Lightbox
  const selectVehicleInConcierge = (vehicleName) => {
    const vehicleSelect = document.getElementById('concierge-vehicle');
    const conciergeSection = document.getElementById('concierge');
    if (vehicleSelect && vehicleName) {
      const match = Array.from(vehicleSelect.options).find((opt) =>
        opt.value.toLowerCase().includes(vehicleName.toLowerCase()) ||
        opt.textContent.toLowerCase().includes(vehicleName.toLowerCase())
      );
      if (match) vehicleSelect.value = match.value;
    }
    closeLightbox();
    if (conciergeSection) {
      conciergeSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `contact.html?vehicle=${encodeURIComponent(vehicleName)}`;
    }
  };

  document.querySelectorAll('[data-request-vehicle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectVehicleInConcierge(btn.getAttribute('data-request-vehicle'));
    });
  });

  lightboxRequestBtn?.addEventListener('click', () => {
    const v = lightboxRequestBtn.getAttribute('data-vehicle-select') || '';
    selectVehicleInConcierge(v);
  });

  /* ========================================================================
     4. NETWORK EXPLORER TABS (NIGERIA & AFRICAN COUNTRIES)
     ======================================================================== */
  const networkTabs = document.querySelectorAll('[data-network-tab]');
  const networkPanels = document.querySelectorAll('[data-network-panel]');

  networkTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-network-tab');
      networkTabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      networkPanels.forEach((panel) => {
        const isMatch = panel.getAttribute('data-network-panel') === target;
        panel.classList.toggle('active', isMatch);
      });
    });
  });

  /* ========================================================================
     5. SERVICES PAGE CATEGORY FILTER & SERVICE DETAIL MODAL
     ======================================================================== */
  const serviceFilterBtns = document.querySelectorAll('[data-service-filter]');
  const serviceFilterCards = document.querySelectorAll('[data-service-category]');

  serviceFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-service-filter');
      serviceFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      serviceFilterCards.forEach((card) => {
        const cat = card.getAttribute('data-service-category');
        card.style.display = filter === 'all' || cat === filter ? 'flex' : 'none';
      });
    });
  });

  const serviceDetails = {
    'meet-greet': {
      badge: 'Airport Protocol',
      title: 'Meet-and-Greet / Airport Protocol',
      summary:
        'We provide meet-and-greet and airport protocol services to our clients. Special and detailed Country Briefings are given to new arrivals in Nigeria at the airport, including passenger vehicle(s) and escort team(s) as required.',
      bullets: [
        'Seamless arrival reception and expedited airport protocol clearance',
        'Special and detailed Country Briefings for new arrivals in Nigeria',
        'Coordinated passenger vehicle(s) and armed or unarmed escort team(s)',
        'Direct transfer from airport terminals to hotels, offices, or residences'
      ]
    },
    dedicated: {
      badge: 'Executive Transit',
      title: 'Dedicated Escort & Security Drivers',
      summary:
        'Dedicated conveyance and escort for visitors from the airport to hotels, offices, or private residences, executed by highly trained DDC (Defensive Drivers’ Course) and EMT (Evasive and Maneuvering Techniques) Security Drivers and Escort Commanders.',
      bullets: [
        'DDC (Defensive Drivers’ Course) & EMT (Evasive and Maneuvering Techniques) certified drivers',
        'Escort Commanders trained in the art of Executive Protection',
        'All operational vehicles equipped with Real-Time Vehicle Trackers and radios',
        'Structured airport-to-hotel, office, and residence movement schedules'
      ]
    },
    'close-protection': {
      badge: 'Personal Security',
      title: 'Close / Executive Protection',
      summary:
        'Professional bodyguards (CP) available on request, well trained in Martial Arts and Close Protection Courses. Our CP teams are continuously trained to keep their expertise at the cutting edge with strong diplomatic skills.',
      bullets: [
        'Certified Close Protection (CP) officers trained in Martial Arts',
        'Continuous advanced tactical refresher training for cutting-edge readiness',
        'Strong diplomatic poise suitable for executives, dignitaries, and corporate boards',
        'Seamless integration with itineraries, meetings, and private residences'
      ]
    },
    'route-analysis': {
      badge: 'Journey Intelligence',
      title: 'Route Analysis & Network Discovery',
      summary:
        'Detailed intelligence on every selected trip, identifying the quickest, shortest, and most scenic routes with real-time routed network discovery, primary and redundant path visualization, and anomaly detection.',
      bullets: [
        'Quickest, shortest, and most scenic route selection per journey',
        'Real-time and accurate discovery of routed networks',
        'Visualization of primary and redundant paths with historical routing visibility',
        'Detection of routing events, failures, or protocol anomalies impacting reachability'
      ]
    },
    emergency: {
      badge: '24/7 Control Centre',
      title: 'Emergency / Quick Response Services',
      summary:
        'Motorized Emergency Response services attending to kidnaps, robbery attacks, social unrest, and medical emergencies. Our Control Centre operates 24/7, receiving distress calls and alarm triggers for rapid threat minimization.',
      bullets: [
        '24/7 Control Centre monitoring distress calls and alarm system alerts',
        'Motorized rapid response units ready for immediate dispatch',
        'Coverage for kidnaps, robbery attacks, social unrest, and medical emergencies',
        'Direct hotline access: +234 806 334 4509 | +234 901 174 3508 | +234 703 893 8192'
      ]
    },
    'event-security': {
      badge: 'Corporate & Social',
      title: 'Event Security & Crowd Management',
      summary:
        'Customer-friendly event security and crowd management services for social or corporate functions of any size, delivered by fully trained security officers prepared for every operational requirement.',
      bullets: [
        'Customer-friendly access control and guest hospitality posture',
        'Scalable crowd management for social and corporate summits of any size',
        'Pre-event venue assessment and VIP principal arrival coordination',
        'Coordinated perimeter security with dedicated escort and protocol teams'
      ]
    }
  };

  const serviceModal = document.getElementById('service-modal');
  const serviceModalBadge = document.getElementById('service-modal-badge');
  const serviceModalTitle = document.getElementById('service-modal-title');
  const serviceModalSummary = document.getElementById('service-modal-summary');
  const serviceModalList = document.getElementById('service-modal-list');
  const serviceModalCta = document.getElementById('service-modal-cta');
  const serviceModalClose = document.getElementById('service-modal-close');

  const closeServiceModal = () => {
    if (!serviceModal) return;
    serviceModal.classList.remove('open');
    document.body.classList.remove('modal-open');
  };

  document.querySelectorAll('[data-service-key]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const key = trigger.getAttribute('data-service-key');
      const data = serviceDetails[key];
      if (!data || !serviceModal) return;

      if (serviceModalBadge) serviceModalBadge.textContent = data.badge;
      if (serviceModalTitle) serviceModalTitle.textContent = data.title;
      if (serviceModalSummary) serviceModalSummary.textContent = data.summary;
      if (serviceModalList) {
        serviceModalList.innerHTML = data.bullets
          .map(
            (b) => `
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>
              <span>${b}</span>
            </li>`
          )
          .join('');
      }
      if (serviceModalCta) {
        serviceModalCta.setAttribute('data-prefill-service', data.title);
      }

      serviceModal.classList.add('open');
      document.body.classList.add('modal-open');
    });
  });

  serviceModalClose?.addEventListener('click', closeServiceModal);
  serviceModal?.addEventListener('click', (e) => {
    if (e.target === serviceModal) closeServiceModal();
  });

  serviceModalCta?.addEventListener('click', () => {
    const svc = serviceModalCta.getAttribute('data-prefill-service') || '';
    closeServiceModal();
    const svcSelect = document.getElementById('concierge-service');
    const conciergeSection = document.getElementById('concierge');
    if (svcSelect && svc) {
      const match = Array.from(svcSelect.options).find((opt) =>
        opt.textContent.toLowerCase().includes(svc.split('/')[0].trim().toLowerCase())
      );
      if (match) svcSelect.value = match.value;
    }
    if (conciergeSection) {
      conciergeSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `contact.html?service=${encodeURIComponent(svc)}`;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeServiceModal();
    }
  });

  /* ========================================================================
     6. CONCIERGE & CONTACT FORM HANDLER + URL PARAM PREFILL
     ======================================================================== */
  const params = new URLSearchParams(window.location.search);
  const serviceParam = params.get('service');
  const vehicleParam = params.get('vehicle');

  const formServiceSelect = document.getElementById('concierge-service');
  const formVehicleSelect = document.getElementById('concierge-vehicle');

  if (serviceParam && formServiceSelect) {
    const match = Array.from(formServiceSelect.options).find(
      (opt) =>
        opt.value.toLowerCase() === serviceParam.toLowerCase() ||
        opt.textContent.toLowerCase().includes(serviceParam.toLowerCase())
    );
    if (match) formServiceSelect.value = match.value;
  }

  if (vehicleParam && formVehicleSelect) {
    const match = Array.from(formVehicleSelect.options).find(
      (opt) =>
        opt.value.toLowerCase().includes(vehicleParam.toLowerCase()) ||
        opt.textContent.toLowerCase().includes(vehicleParam.toLowerCase())
    );
    if (match) formVehicleSelect.value = match.value;
  }

  const bookingForm = document.getElementById('concierge-form');
  const confirmationBox = document.getElementById('dispatch-confirmation');
  const summaryEl = document.getElementById('dispatch-summary');
  const mailtoBtn = document.getElementById('dispatch-mailto');
  const whatsappBtn = document.getElementById('dispatch-whatsapp');
  const resetFormBtn = document.getElementById('dispatch-reset');

  if (bookingForm && confirmationBox) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fullName = document.getElementById('concierge-name')?.value.trim() || 'Client';
      const org = document.getElementById('concierge-org')?.value.trim() || 'Private / Corporate';
      const email = document.getElementById('concierge-email')?.value.trim() || '';
      const phone = document.getElementById('concierge-phone')?.value.trim() || '';
      const service = document.getElementById('concierge-service')?.value || 'Meet-and-Greet / Airport Protocol';
      const hub = document.getElementById('concierge-hub')?.value || 'Lagos (Headquarters)';
      const vehicle = document.getElementById('concierge-vehicle')?.value || 'Operations Recommended';
      const date = document.getElementById('concierge-date')?.value || 'Flexible / Immediate';
      const notes = document.getElementById('concierge-notes')?.value.trim() || 'Standard protocol';

      const refCode = `PGT-${Math.floor(100000 + Math.random() * 900000)}`;

      if (summaryEl) {
        summaryEl.innerHTML = `
          <strong>Reference:</strong> ${refCode}<br>
          <strong>Principal / Contact:</strong> ${escapeHtml(fullName)} (${escapeHtml(org)})<br>
          <strong>Service:</strong> ${escapeHtml(service)}<br>
          <strong>Operational Hub:</strong> ${escapeHtml(hub)}<br>
          <strong>Fleet Preference:</strong> ${escapeHtml(vehicle)}<br>
          <strong>Target Date:</strong> ${escapeHtml(date)}<br>
          <strong>Contact:</strong> ${escapeHtml(phone)} · ${escapeHtml(email)}
        `;
      }

      if (mailtoBtn) {
        const subject = encodeURIComponent(`[${refCode}] Protocol Request: ${service} (${hub})`);
        const body = encodeURIComponent(
          `Hello Pacesetters G-Travels Operations Desk,\n\n` +
            `Reference: ${refCode}\n` +
            `Name: ${fullName}\n` +
            `Organization: ${org}\n` +
            `Phone: ${phone}\n` +
            `Email: ${email}\n` +
            `Requested Service: ${service}\n` +
            `Operational Hub: ${hub}\n` +
            `Preferred Fleet: ${vehicle}\n` +
            `Target Date: ${date}\n` +
            `Notes: ${notes}\n`
        );
        mailtoBtn.setAttribute('href', `mailto:info@pacesetterstravel.com?subject=${subject}&body=${body}`);
      }

      if (whatsappBtn) {
        const waText = encodeURIComponent(
          `Hello Pacesetters G-Travels Operations Desk,\n\n` +
            `Booking Reference: ${refCode}\n` +
            `Name: ${fullName}\n` +
            `Organization: ${org}\n` +
            `Phone: ${phone}\n` +
            `Email: ${email}\n` +
            `Service: ${service}\n` +
            `Operational Hub: ${hub}\n` +
            `Preferred Fleet: ${vehicle}\n` +
            `Target Date: ${date}\n` +
            `Notes: ${notes}`
        );
        whatsappBtn.setAttribute('href', `https://wa.me/2348063344509?text=${waText}`);
      }

      bookingForm.style.display = 'none';
      confirmationBox.classList.add('visible');
    });

    resetFormBtn?.addEventListener('click', () => {
      bookingForm.reset();
      confirmationBox.classList.remove('visible');
      bookingForm.style.display = 'block';
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
