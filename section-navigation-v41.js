(() => {
  const SECTION_IDS = ["home", "details", "schedule", "entourage", "dress", "venue", "rsvp"];
  const TRANSITION_MS = 360;
  let transitionToken = 0;
  let cleanupTimer = 0;

  function reducedMotion() {
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }

  function currentSectionId() {
    const active = document.querySelector("main > section.section-panel.is-active-section:not([hidden])");
    return active?.id && SECTION_IDS.includes(active.id) ? active.id : "home";
  }

  function clearTransitionClasses() {
    window.clearTimeout(cleanupTimer);
    document.querySelectorAll("main > section.section-panel").forEach(section => {
      section.classList.remove("section-transition-enter", "section-transition-leave");
    });
    document.body.classList.remove(
      "is-section-switching",
      "section-direction-forward",
      "section-direction-backward"
    );
  }

  function applySectionState(targetId) {
    document.body.classList.add("section-tab-mode");
    document.body.classList.remove("vintage-card-transition");

    document.querySelectorAll(".home-launcher-card.is-opening-vintage-card, .home-launcher-card.is-card-dimmed").forEach(card => {
      card.classList.remove("is-opening-vintage-card", "is-card-dimmed");
      card.removeAttribute("aria-expanded");
    });

    SECTION_IDS.forEach(id => {
      const section = document.getElementById(id);
      if (!section) return;
      const active = id === targetId;

      section.classList.add("section-panel");
      section.classList.toggle("is-active-section", active);
      section.setAttribute("aria-hidden", active ? "false" : "true");

      if (active) {
        section.removeAttribute("hidden");
        section.classList.add("is-visible");
      } else {
        section.classList.remove("is-visible", "section-transition-enter", "section-transition-leave");
        section.setAttribute("hidden", "");
      }
    });
  }

  function updateNavigation(targetId) {
    document.querySelectorAll("[data-section-target]").forEach(control => {
      const active = control.dataset.sectionTarget === targetId;
      if (control.classList.contains("section-nav-link")) {
        control.classList.toggle("is-active", active);
        if (active) control.setAttribute("aria-current", "page");
        else control.removeAttribute("aria-current");
      }
    });
  }

  function updateHash(targetId, shouldUpdate) {
    if (!shouldUpdate) return;
    const nextHash = `#${targetId}`;
    if (location.hash !== nextHash) history.pushState({ section: targetId }, "", nextHash);
  }

  function scrollForSection(targetId, returnToMenu) {
    if (targetId === "home" && returnToMenu) {
      const menu = document.getElementById("sectionMenu");
      requestAnimationFrame(() => {
        menu?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
      });
      return;
    }

    // Move to the new section's natural starting point before its reveal.
    // This avoids a second competing scroll animation during the transition.
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function setDirection(fromId, toId) {
    document.body.classList.remove("section-direction-forward", "section-direction-backward");
    const fromIndex = SECTION_IDS.indexOf(fromId);
    const toIndex = SECTION_IDS.indexOf(toId);
    document.body.classList.add(toIndex >= fromIndex ? "section-direction-forward" : "section-direction-backward");
  }

  function animateIncoming(section, token) {
    if (!section || reducedMotion()) {
      document.body.classList.remove("is-section-switching");
      return;
    }

    section.classList.remove("section-transition-enter");
    // Restart cleanly even when the same section was animated moments ago.
    void section.offsetWidth;
    section.classList.add("section-transition-enter");
    document.body.classList.add("is-section-switching");

    cleanupTimer = window.setTimeout(() => {
      if (token !== transitionToken) return;
      section.classList.remove("section-transition-enter");
      document.body.classList.remove("is-section-switching");
    }, TRANSITION_MS + 45);
  }

  function activateSection(sectionId, options = {}) {
    const targetId = SECTION_IDS.includes(sectionId) ? sectionId : "home";
    const {
      updateHash: shouldUpdateHash = true,
      returnToMenu = false,
      animate = true
    } = options;

    const fromId = currentSectionId();
    const sameSection = fromId === targetId;

    updateNavigation(targetId);
    updateHash(targetId, shouldUpdateHash);

    if (sameSection) {
      applySectionState(targetId);
      scrollForSection(targetId, returnToMenu);
      return;
    }

    const token = ++transitionToken;
    clearTransitionClasses();
    setDirection(fromId, targetId);

    // Switch immediately. Removing the old V40 exit delay eliminates the
    // blank pause and makes rapid navigation feel responsive.
    applySectionState(targetId);
    scrollForSection(targetId, returnToMenu);

    if (animate) {
      const incoming = document.getElementById(targetId);
      requestAnimationFrame(() => requestAnimationFrame(() => animateIncoming(incoming, token)));
    }
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-section-target]");
    if (!trigger) return;

    const targetId = trigger.dataset.sectionTarget;
    if (!SECTION_IDS.includes(targetId)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    activateSection(targetId, { returnToMenu: trigger.dataset.returnMenu === "true" });
  }, true);

  window.addEventListener("popstate", () => {
    const targetId = location.hash.replace("#", "");
    activateSection(SECTION_IDS.includes(targetId) ? targetId : "home", { updateHash: false });
  });

  window.weddingSectionNavigationV41 = { activateSection };

  const initialTarget = location.hash.replace("#", "");
  clearTransitionClasses();
  applySectionState(SECTION_IDS.includes(initialTarget) ? initialTarget : "home");
  updateNavigation(SECTION_IDS.includes(initialTarget) ? initialTarget : "home");
})();
