const WEBHOOK_URL = "https://xn8nx.upfunnel.click/webhook/guia-skills";
const REQUEST_TIMEOUT_MS = 12000;

function initializeSharing() {
  const shareButton = document.getElementById("shareBtn");
  const copiedMessage = document.getElementById("copied");
  if (!shareButton || !copiedMessage) return;

  function announceCopied() {
    copiedMessage.textContent = "Enlace copiado. Pásaselo a quien le sirva.";
  }

  function copyFallback(pageUrl) {
    const textArea = document.createElement("textarea");
    textArea.value = pageUrl;
    textArea.readOnly = true;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      announceCopied();
    } catch {
      copiedMessage.textContent =
        "Copia el enlace desde la barra del navegador.";
    } finally {
      textArea.remove();
    }
  }

  shareButton.addEventListener("click", async () => {
    const pageUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: "Clases en vivo gratis con IA, sábados a las 8 p.m. hora Colombia.",
          url: pageUrl,
        });
      } catch (error) {
        if (error.name !== "AbortError") copyFallback(pageUrl);
      }
      return;
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(pageUrl);
        announceCopied();
      } catch {
        copyFallback(pageUrl);
      }
      return;
    }

    copyFallback(pageUrl);
  });
}

function initializeRouter() {
  const mobilePanel = document.getElementById("mobilePanel");
  const hamburger = document.getElementById("hamburger");
  const main = document.getElementById("contenido");
  const footer = document.querySelector("footer");
  const pages = document.querySelectorAll("[data-page]");
  const mobileLinks = [...mobilePanel.querySelectorAll("a")];
  const routeTitles = {
    "#/": "Clases en vivo — Upfunnel",
    "#/recursos": "Recursos — Upfunnel",
    "#/herramientas": "Herramientas — Upfunnel",
    "#/productos": "Productos — Upfunnel",
    "#/servicios": "Servicios — Upfunnel",
  };

  function closeMobileMenu({ restoreFocus = false } = {}) {
    const wasOpen = mobilePanel.classList.contains("abierto");
    hamburger.classList.remove("abierto");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Abrir menú");
    mobilePanel.classList.remove("abierto");
    mobilePanel.inert = true;
    main.inert = false;
    footer.inert = false;
    document.body.style.overflow = "";
    if (wasOpen && restoreFocus) hamburger.focus();
  }

  function openMobileMenu() {
    hamburger.classList.add("abierto");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Cerrar menú");
    mobilePanel.classList.add("abierto");
    mobilePanel.inert = false;
    main.inert = true;
    footer.inert = true;
    document.body.style.overflow = "hidden";
    mobileLinks[0]?.focus();
  }

  hamburger.addEventListener("click", () => {
    if (mobilePanel.classList.contains("abierto"))
      closeMobileMenu({ restoreFocus: true });
    else openMobileMenu();
  });

  mobilePanel.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [hamburger, ...mobileLinks];
    const first = focusable[0];
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function renderRoute(moveFocus = false) {
    let hash = window.location.hash;
    if (!hash || hash === "#") hash = "#/";
    if (!hash.startsWith("#/")) return;

    if (!routeTitles[hash]) {
      window.location.hash = "#/";
      return;
    }

    pages.forEach((page) => {
      page.hidden = page.dataset.page !== hash;
    });

    document.querySelectorAll("#navLinks a, #mobilePanel a").forEach((link) => {
      const active = link.dataset.hash === hash;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    document.title = routeTitles[hash];
    closeMobileMenu();
    window.scrollTo(0, 0);

    if (moveFocus) {
      const activePage = document.querySelector(`[data-page="${hash}"]`);
      const heading = activePage?.querySelector("h1");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      } else {
        main.focus();
      }
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobilePanel.classList.contains("abierto")) {
      closeMobileMenu({ restoreFocus: true });
    }
  });

  window.addEventListener("hashchange", () => renderRoute(true));
  renderRoute();
}

function initializeResourceForm() {
  const modal = document.getElementById("modal");
  const form = document.getElementById("formGuia");
  const submitButton = document.getElementById("btnEnviar");
  const globalError = document.getElementById("errorGlobal");
  const pageWrap = document.querySelector(".wrap");
  const fieldIds = ["nombre", "whatsapp", "correo", "consentimiento"];
  let lastFocused = null;
  let sentSuccessfully = false;
  let activeRequest = null;
  let closeTimer = null;

  function setFormView(isGuide) {
    document.getElementById("vistaForm").hidden = false;
    document.getElementById("vistaExito").hidden = true;
    modal.setAttribute("aria-labelledby", "modalTitulo");
    modal.setAttribute("aria-describedby", "modalLead");
    globalError.classList.remove("ver");
    globalError.textContent = "";
    submitButton.disabled = false;
    submitButton.textContent = isGuide
      ? "Enviarme la guía"
      : "Enviarme el material";

    fieldIds.forEach((id) => {
      const field = document.getElementById(id);
      field.classList.remove("malo");
      field.removeAttribute("aria-invalid");
      document
        .getElementById(`err${id[0].toUpperCase()}${id.slice(1)}`)
        .classList.remove("ver");
    });
  }

  function openModal(event, resourceId) {
    event?.preventDefault();
    clearTimeout(closeTimer);
    activeRequest?.abort();
    activeRequest = null;
    lastFocused = event?.currentTarget || document.activeElement;

    const isGuide = resourceId === "guia-skills";
    if (sentSuccessfully) {
      form.reset();
      sentSuccessfully = false;
    }

    document.getElementById("recurso").value = resourceId || "guia-skills";
    setFormView(isGuide);
    document.getElementById("modalTitulo").textContent = isGuide
      ? "¿A qué correo te mando la guía?"
      : "¿A qué correo te mando el material?";
    document.getElementById("modalLead").textContent = isGuide
      ? "Son 9 páginas con ejercicios. Llega en menos de un minuto y no cuesta nada."
      : "Te llega al correo en menos de un minuto. Sin más pasos.";

    modal.classList.add("abierto");
    modal.inert = false;
    pageWrap.inert = true;
    requestAnimationFrame(() => {
      modal.classList.add("visible");
      document.getElementById("nombre").focus();
    });
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    activeRequest?.abort();
    activeRequest = null;
    modal.classList.remove("visible");
    closeTimer = window.setTimeout(() => {
      modal.classList.remove("abierto");
      modal.inert = true;
      document.body.style.overflow = "";
      pageWrap.inert = false;
      document.getElementById("recurso").value = "guia-skills";
      if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    }, 300);
  }

  function markField(id, isValid) {
    const input = document.getElementById(id);
    const errorId = `err${id[0].toUpperCase()}${id.slice(1)}`;
    const error = document.getElementById(errorId);
    input.classList.toggle("malo", !isValid);
    error.classList.toggle("ver", !isValid);
    if (isValid) input.removeAttribute("aria-invalid");
    else input.setAttribute("aria-invalid", "true");
    return isValid;
  }

  function validateField(id) {
    const field = document.getElementById(id);
    if (id === "nombre")
      return markField(
        id,
        field.value.trim().length >= 2 && field.value.trim().length <= 80,
      );
    if (id === "whatsapp") {
      const digits = field.value.replace(/\D/g, "");
      return markField(
        id,
        !field.value.trim() || (digits.length >= 7 && digits.length <= 15),
      );
    }
    if (id === "correo") {
      return markField(
        id,
        field.value.length <= 254 &&
          /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(field.value.trim()),
      );
    }
    return markField(id, field.checked);
  }

  function validateForm() {
    const validity = fieldIds.map((id) => validateField(id));
    const firstInvalidIndex = validity.findIndex((isValid) => !isValid);
    if (firstInvalidIndex >= 0) {
      const firstInvalidField = document.getElementById(
        fieldIds[firstInvalidIndex],
      );
      firstInvalidField.scrollIntoView({ block: "nearest" });
      firstInvalidField.focus();
    }
    return firstInvalidIndex === -1;
  }

  document
    .getElementById("btnGuia")
    .addEventListener("click", (event) => openModal(event, "guia-skills"));
  document.getElementById("cerrarModal").addEventListener("click", closeModal);
  document.querySelectorAll(".btn-recurso").forEach((button) => {
    button.addEventListener("click", (event) =>
      openModal(event, button.dataset.recurso),
    );
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("abierto"))
      closeModal();
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [
      ...modal.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]):not([tabindex="-1"])',
      ),
    ].filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  fieldIds.forEach((id) => {
    document
      .getElementById(id)
      .addEventListener("blur", () => validateField(id));
  });

  submitButton.addEventListener("pointerdown", (event) => {
    if (!form.checkValidity()) event.preventDefault();
  });

  submitButton.addEventListener("click", (event) => {
    if (!validateForm()) event.preventDefault();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    globalError.classList.remove("ver");
    if (!validateForm()) return;

    submitButton.disabled = true;
    submitButton.textContent = "Enviando…";
    const controller = new AbortController();
    activeRequest = controller;
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );
    const resourceId = document.getElementById("recurso").value;

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          nombre: document.getElementById("nombre").value.trim(),
          whatsapp: document.getElementById("whatsapp").value.trim(),
          correo: document.getElementById("correo").value.trim(),
          recurso: resourceId,
          consentimiento: document.getElementById("consentimiento").checked,
          web: document.getElementById("web").value,
        }),
      });

      const text = await response.text();
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
      }

      if (!response.ok || data.ok === false)
        throw new Error("No se pudo completar la entrega.");
      if (activeRequest !== controller) return;

      sentSuccessfully = true;
      document.getElementById("vistaForm").hidden = true;
      document.getElementById("vistaExito").hidden = false;
      modal.setAttribute("aria-labelledby", "tituloExito");
      modal.removeAttribute("aria-describedby");
      document.getElementById("tituloExito").focus();
    } catch (error) {
      if (error.name === "AbortError" && activeRequest !== controller) return;
      globalError.textContent =
        error.name === "AbortError"
          ? "La solicitud tardó demasiado. Inténtalo otra vez."
          : "No pudimos enviar el recurso. Inténtalo otra vez o escríbeme por WhatsApp.";
      globalError.classList.add("ver");
      submitButton.disabled = false;
      submitButton.textContent =
        resourceId === "guia-skills"
          ? "Enviarme la guía"
          : "Enviarme el material";
    } finally {
      window.clearTimeout(timeoutId);
      if (activeRequest === controller) activeRequest = null;
    }
  });
}

function initializeServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("No se pudo registrar el service worker:", error);
    });
  });
}

initializeSharing();
initializeRouter();
initializeResourceForm();
initializeServiceWorker();
