import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("navegación", () => {
  const routes = [
    ["#/", "Clases en vivo — Upfunnel"],
    ["#/recursos", "Recursos — Upfunnel"],
    ["#/herramientas", "Herramientas — Upfunnel"],
    ["#/productos", "Productos — Upfunnel"],
    ["#/servicios", "Servicios — Upfunnel"],
  ];

  for (const [route, title] of routes) {
    test(`muestra ${route}`, async ({ page }) => {
      await page.goto(`/${route}`);
      await expect(page).toHaveTitle(title);
      await expect(page.locator("[data-page]:visible")).toHaveCount(1);
      await expect(page.locator(`[data-page="${route}"]`)).toBeVisible();
      await expect(
        page.locator(`#navLinks a[data-hash="${route}"]`),
      ).toHaveAttribute("aria-current", "page");
    });
  }

  test("redirige rutas desconocidas", async ({ page }) => {
    await page.goto("/#/desconocida");
    await expect(page).toHaveURL(/#\/$/);
  });
});

test("el menú móvil contiene y restaura el foco", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "La prueba corresponde al menú móvil.");
  await page.goto("/#/");
  const hamburger = page.locator("#hamburger");
  await hamburger.click();
  await expect(hamburger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#mobilePanel a").first()).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(hamburger).toHaveAttribute("aria-expanded", "false");
  await expect(hamburger).toBeFocused();
});

test.describe("formulario de recursos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/");
    await page.locator("#btnGuia").click();
  });

  test("enfoca el primer error y permite omitir WhatsApp", async ({ page }) => {
    await page.locator("#btnEnviar").click();
    await expect(page.locator("#nombre")).toBeFocused();
    await expect(page.locator("#nombre")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await page.locator("#nombre").fill("Gabriel");
    await page.locator("#correo").fill("gabriel@example.com");
    await page.locator("#consentimiento").check();
    await expect(page.locator("#whatsapp")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("envía solo los datos previstos y muestra éxito", async ({ page }) => {
    let requestBody;
    await page.route("**/webhook/guia-skills", async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.locator("#nombre").fill("Gabriel");
    await page.locator("#correo").fill("gabriel@example.com");
    await page.locator("#consentimiento").check();
    await page.locator("#btnEnviar").click();

    await expect(page.locator("#tituloExito")).toBeVisible();
    expect(requestBody).toMatchObject({
      nombre: "Gabriel",
      correo: "gabriel@example.com",
      whatsapp: "",
      recurso: "guia-skills",
      consentimiento: true,
    });
  });

  test("muestra un error controlado cuando falla el webhook", async ({
    page,
  }) => {
    await page.route("**/webhook/guia-skills", (route) =>
      route.fulfill({ status: 503, body: "" }),
    );
    await page.locator("#nombre").fill("Gabriel");
    await page.locator("#correo").fill("gabriel@example.com");
    await page.locator("#consentimiento").check();
    await page.locator("#btnEnviar").click();
    await expect(page.locator("#errorGlobal")).toBeVisible();
    await expect(page.locator("#btnEnviar")).toBeEnabled();
  });

  test("cierra con Escape y devuelve el foco", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.locator("#modal")).not.toHaveClass(/visible/);
    await expect(page.locator("#btnGuia")).toBeFocused();
  });
});

test("comparte la URL actual y anuncia el resultado", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: (value) => {
          window.__copiedUrl = value;
          return Promise.resolve();
        },
      },
      configurable: true,
    });
  });
  await page.goto("/#/");
  await page.locator("#shareBtn").click();
  await expect(page.locator("#copied")).toContainText("Enlace copiado");
  await expect
    .poll(() => page.evaluate(() => window.__copiedUrl))
    .toContain("#/");
});

test("la aplicación queda disponible sin conexión", async ({
  context,
  page,
  isMobile,
}) => {
  test.skip(isMobile, "La instalación PWA se verifica una sola vez.");
  await page.goto("/#/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#hero-title")).toBeVisible();
    await expect(page).toHaveTitle("Clases en vivo — Upfunnel");
  } finally {
    await context.setOffline(false);
  }
});

test.describe("accesibilidad", () => {
  for (const route of [
    "#/",
    "#/recursos",
    "#/herramientas",
    "#/productos",
    "#/servicios",
  ]) {
    test(`sin violaciones automáticas críticas en ${route}`, async ({
      page,
    }) => {
      await page.goto(`/${route}`);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("modal y errores sin violaciones automáticas", async ({ page }) => {
    await page.goto("/#/");
    await page.locator("#btnGuia").click();
    await page.locator("#btnEnviar").click();
    const results = await new AxeBuilder({ page }).include("#modal").analyze();
    expect(results.violations).toEqual([]);
  });
});
