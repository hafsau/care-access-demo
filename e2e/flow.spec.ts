import { expect, test, type Page } from "@playwright/test";

/* Rosa's booking, driven through the real UI. */

const cont = (page: Page, lang: "en" | "es" = "es") => page.getByRole("button", { name: lang === "es" ? "Continuar" : "Continue", exact: true }).click();
const heading = (page: Page) => page.locator("#step-heading");

async function bookAsRosa(page: Page) {
  await page.goto("/prescreen?lang=es");
  await page.getByRole("button", { name: "Empezar" }).click();
  await page.getByLabel("Código postal").fill("90022");
  await page.getByRole("radio", { name: /Maple Street/ }).check();
  await cont(page);
  await page.getByRole("radio", { name: "Para mí" }).check();
  await cont(page);
  await page.getByLabel("Mes").fill("3");
  await page.getByLabel("Día").fill("14");
  await page.getByLabel("Año").fill("1968");
  await cont(page);
  await expect(heading(page)).toHaveText("Sus decisiones");
  await page.getByRole("checkbox", { name: "Sí, usen mis respuestas para mi chequeo" }).check();
  await page.getByRole("radio", { name: "Sí, busquen estudios" }).check();
  await page.getByRole("radio", { name: "Sí, envíenme textos" }).check();
  await page.getByRole("radio", { name: "No quiero llamadas automáticas" }).check();
  await cont(page);
  await page.getByRole("checkbox", { name: "Colesterol alto" }).check();
  await page.getByRole("checkbox", { name: "Un stent en una arteria del corazón" }).check();
  await cont(page);
  await page.getByRole("checkbox", { name: "Prediabetes" }).check();
  await cont(page);
  // Prediabetes ruled out the kidney study: the cancer question now serves the heart study alone.
  await expect(page.getByText("Preguntamos porque 1 estudio cerca de usted lo necesita.")).toBeVisible();
  await page.getByRole("radio", { name: "No", exact: true }).check();
  await cont(page);
  await page.getByLabel("Nombre", { exact: true }).fill("Rosa");
  await page.getByLabel("Apellido").fill("Delgado");
  await page.getByLabel("Número de teléfono").fill("(323) 555-0148");
  await page.locator("fieldset#shared").getByRole("radio", { name: "No" }).check();
  await page.locator("fieldset#voicemail").getByRole("radio", { name: "Sí" }).check();
  await page.getByRole("radio", { name: /Noche/ }).check();
  await page.getByRole("checkbox", { name: "No uso email" }).check();
  await cont(page);
  await page.getByRole("checkbox", { name: "Hispano o latino" }).check();
  await page.getByRole("radio", { name: "Femenino" }).check();
  await cont(page);
  await page.getByRole("radio", { name: /9:20/ }).check();
  await cont(page);
  await expect(heading(page)).toHaveText("Revise sus respuestas");
  await page.getByRole("button", { name: "Hacer mi cita" }).click();
  await expect(heading(page)).toHaveText("Su cita está hecha");
}

test("Rosa books in Spanish, and the coordinator's record follows her choices", async ({ page }) => {
  await bookAsRosa(page);
  await page.getByRole("link", { name: "Coordinator" }).click();
  const rec = page.locator("main");
  await expect(rec.getByRole("heading", { name: "Rosa Delgado" })).toBeVisible();
  await expect(rec.getByText("Spanish-speaking callback")).toBeVisible();
  await expect(rec.getByRole("button", { name: "Start automated call" })).toBeDisabled();
  await expect(rec.getByText(/Rosa said no on Nov 2, .* \(Spanish, wording draft v1\)\. Call her yourself\./)).toBeVisible();
  await expect(rec.getByRole("button", { name: "Call in Spanish" })).toBeEnabled();
  await expect(rec.getByText("Possible match: worth a conversation")).toBeVisible();
  await expect(rec.getByText("She said: High cholesterol, A stent in a heart artery")).toBeVisible();
  await expect(rec.getByText("Not a match")).toBeVisible();
});

test("turning texts off on her phone blocks texting on the coordinator's side", async ({ page }) => {
  await bookAsRosa(page);
  await page.getByRole("button", { name: "Desactivar: Mensajes de texto" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Mensajes de texto: desactivado" })).toBeVisible();
  await page.getByRole("link", { name: "Coordinator" }).click();
  await expect(page.getByText(/Rosa turned this off on Nov 2.*Call her instead\./)).toBeVisible();
});

test("switching language mid-flow keeps her answers", async ({ page }) => {
  await page.goto("/prescreen");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByLabel("ZIP code").fill("90022");
  await page.getByRole("radio", { name: /Maple Street/ }).check();
  await page.getByRole("button", { name: "Ver en español" }).click();
  await expect(page.getByLabel("Código postal")).toHaveValue("90022");
  await expect(page.getByRole("radio", { name: /Maple Street/ })).toBeChecked();
});

test("Continue with gaps moves focus to an error summary that links to each field", async ({ page }) => {
  await page.goto("/prescreen");
  await page.getByRole("button", { name: "Start" }).click();
  await cont(page, "en");
  const summary = page.getByRole("alert").filter({ hasText: "Check this before you continue" });
  await expect(summary).toBeFocused();
  await expect(summary).toContainText("Enter a 5-number ZIP code");
  await summary.getByRole("link", { name: "Enter a 5-number ZIP code" }).click();
  await expect(page.getByLabel("ZIP code")).toBeFocused();
  await expect(page.getByLabel("ZIP code")).toHaveAttribute("aria-invalid", "true");
});

test("no site nearby offers a single, specific opt-in instead of a dead end", async ({ page }) => {
  await page.goto("/prescreen");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByLabel("ZIP code").fill("59001");
  await expect(page.getByText("There's no screening near you yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toHaveCount(0);
});

test("under 18 stops kindly", async ({ page }) => {
  await page.goto("/prescreen");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByLabel("ZIP code").fill("90022");
  await page.getByRole("radio", { name: /Maple Street/ }).check();
  await cont(page, "en");
  await page.getByRole("radio", { name: "Me", exact: true }).check();
  await cont(page, "en");
  await page.getByLabel("Month").fill("6");
  await page.getByLabel("Day").fill("1");
  await page.getByLabel("Year").fill("2010");
  await cont(page, "en");
  await expect(heading(page)).toHaveText("This screening is for adults");
});

test("saying no to study matching skips every health question", async ({ page }) => {
  await page.goto("/prescreen");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByLabel("ZIP code").fill("90022");
  await page.getByRole("radio", { name: /Maple Street/ }).check();
  await cont(page, "en");
  await page.getByRole("radio", { name: "Me", exact: true }).check();
  await cont(page, "en");
  await page.getByLabel("Month").fill("11");
  await page.getByLabel("Day").fill("20");
  await page.getByLabel("Year").fill("1974");
  await cont(page, "en");
  await page.getByRole("checkbox", { name: "Yes, use my answers for my screening" }).check();
  await page.getByRole("radio", { name: "No, just the screening" }).check();
  await page.getByRole("radio", { name: "No texts" }).check();
  await page.getByRole("radio", { name: "No automated calls" }).check();
  await cont(page, "en");
  await expect(heading(page)).toHaveText("How can we reach you?");
});

test("the whole booking works with the keyboard alone", async ({ page }) => {
  await page.goto("/prescreen");
  const press = async (key: string, n = 1) => {
    for (let i = 0; i < n; i++) await page.keyboard.press(key);
  };
  await page.getByRole("button", { name: "Start" }).focus();
  await press("Enter");
  await expect(heading(page)).toBeFocused();
  await page.getByLabel("ZIP code").focus();
  await page.keyboard.type("90022");
  await press("Tab");
  await press("Space"); // first site radio
  await expect(page.getByRole("radio", { name: /Maple Street/ })).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).focus();
  await press("Enter");
  await expect(heading(page)).toHaveText("Who is this screening for?");
  await expect(heading(page)).toBeFocused();
});

test("the split view plays Rosa's booking and shows her record", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await expect(page.getByText("Nothing here yet.")).toBeVisible();
  await page.getByRole("button", { name: "Play Rosa's booking" }).click();
  for (let i = 0; i < 20; i++) await page.clock.runFor(1400);
  await expect(page.getByRole("heading", { name: "Rosa Delgado" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start automated call" })).toBeDisabled();
});
