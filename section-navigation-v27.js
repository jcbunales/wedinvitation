(() => {
  const SECTION_IDS = ["home", "details", "schedule", "entourage", "dress", "venue", "rsvp"];

  function activateSection(sectionId, options = {}) {
    const targetId = SECTION_IDS.includes(sectionId) ? sectionId : "home";
    const { updateHash = true, returnToMenu = false } = options;

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
        section.setAttribute("hidden", "");
      }
    });

    document.querySelectorAll("[data-section-target]").forEach(control => {
      const active = control.dataset.sectionTarget === targetId;
      if (control.classList.contains("section-nav-link")) {
        control.classList.toggle("is-active", active);
        if (active) control.setAttribute("aria-current", "page");
        else control.removeAttribute("aria-current");
      }
    });

    if (updateHash) {
      const nextHash = `#${targetId}`;
      if (location.hash !== nextHash) history.pushState({ section: targetId }, "", nextHash);
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduceMotion ? "auto" : "smooth";
    if (targetId === "home" && returnToMenu) {
      const menu = document.getElementById("sectionMenu");
      window.setTimeout(() => menu?.scrollIntoView({ behavior, block: "start" }), 20);
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  }

  // Capture section-link clicks before legacy card animation code can lock
  // pointer events. This is deliberately limited to public section controls.
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

  // Export a tiny diagnostic hook and make the initial DOM state deterministic.
  window.weddingSectionNavigationV27 = { activateSection };
  const initialTarget = location.hash.replace("#", "");
  activateSection(SECTION_IDS.includes(initialTarget) ? initialTarget : "home", { updateHash: false });
})();
