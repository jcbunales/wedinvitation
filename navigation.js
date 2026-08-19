(() => {
  const SECTION_IDS = ["home", "details", "schedule", "entourage", "dress", "venue", "faqs", "rsvp"];

  function activateSection(sectionId, options = {}) {
    const targetId = SECTION_IDS.includes(sectionId) ? sectionId : "home";
    const { updateHash = true, returnToMenu = false } = options;

    document.body.classList.add("section-tab-mode");
    document.body.classList.remove(
      "vintage-card-transition",
      "is-section-switching",
      "section-direction-forward",
      "section-direction-backward"
    );

    document.querySelectorAll(".home-launcher-card.is-opening-vintage-card, .home-launcher-card.is-card-dimmed").forEach(card => {
      card.classList.remove("is-opening-vintage-card", "is-card-dimmed");
      card.removeAttribute("aria-expanded");
    });

    SECTION_IDS.forEach(id => {
      const section = document.getElementById(id);
      if (!section) return;
      const active = id === targetId;

      section.classList.add("section-panel");
      section.classList.remove("section-transition-enter", "section-transition-leave");
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

    if (targetId === "home" && returnToMenu) {
      document.getElementById("sectionMenu")?.scrollIntoView({ behavior: "auto", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
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

  window.weddingSectionNavigationV42 = { activateSection };
  const initialTarget = location.hash.replace("#", "");
  activateSection(SECTION_IDS.includes(initialTarget) ? initialTarget : "home", { updateHash: false });
})();
