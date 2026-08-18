(() => {
  const SECTION_IDS = ["home", "details", "schedule", "entourage", "dress", "venue", "rsvp"];
  const EXIT_MS = 190;
  const ENTER_MS = 460;
  let transitionToken = 0;

  function reducedMotion() {
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }

  function currentSectionId() {
    const active = document.querySelector("main > section.section-panel.is-active-section:not([hidden])");
    return active?.id && SECTION_IDS.includes(active.id) ? active.id : "home";
  }

  function clearTransitionClasses() {
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
        section.classList.remove("is-visible");
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
      window.setTimeout(() => {
        menu?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
      }, 30);
      return;
    }

    // Start each selected section from its top. Using auto here prevents the
    // page-scroll animation from fighting with the section transition itself.
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function setDirection(fromId, toId) {
    document.body.classList.remove("section-direction-forward", "section-direction-backward");
    const fromIndex = SECTION_IDS.indexOf(fromId);
    const toIndex = SECTION_IDS.indexOf(toId);
    document.body.classList.add(toIndex >= fromIndex ? "section-direction-forward" : "section-direction-backward");
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
    const useAnimation = animate && !reducedMotion();
    const outgoing = document.getElementById(fromId);

    clearTransitionClasses();
    setDirection(fromId, targetId);

    if (!useAnimation || !outgoing || outgoing.hidden) {
      applySectionState(targetId);
      scrollForSection(targetId, returnToMenu);
      const incoming = document.getElementById(targetId);
      if (useAnimation && incoming) {
        incoming.classList.add("section-transition-enter");
        window.setTimeout(() => incoming.classList.remove("section-transition-enter"), ENTER_MS + 40);
      }
      return;
    }

    document.body.classList.add("is-section-switching");
    outgoing.classList.add("section-transition-leave");

    window.setTimeout(() => {
      if (token !== transitionToken) return;

      outgoing.classList.remove("section-transition-leave");
      applySectionState(targetId);
      scrollForSection(targetId, returnToMenu);

      const incoming = document.getElementById(targetId);
      if (!incoming) {
        clearTransitionClasses();
        return;
      }

      // Force a layout read after removing [hidden] so the entrance animation
      // reliably restarts every time a section is selected.
      incoming.classList.remove("section-transition-enter");
      void incoming.offsetWidth;
      incoming.classList.add("section-transition-enter");

      window.setTimeout(() => {
        if (token !== transitionToken) return;
        incoming.classList.remove("section-transition-enter");
        document.body.classList.remove("is-section-switching");
      }, ENTER_MS + 40);
    }, EXIT_MS + 15);
  }

  // Capture public section navigation before older card-animation handlers.
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

  window.weddingSectionNavigationV40 = { activateSection };

  // Initial page state should be deterministic but should not animate before
  // the invitation has even been opened.
  const initialTarget = location.hash.replace("#", "");
  clearTransitionClasses();
  applySectionState(SECTION_IDS.includes(initialTarget) ? initialTarget : "home");
  updateNavigation(SECTION_IDS.includes(initialTarget) ? initialTarget : "home");
})();
