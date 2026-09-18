import { test } from "@playwright/test";

test("test", async ({ page }) => {
  // Navigheaza la aplicatia rulata local
  await page.goto("http://localhost:3000/");

  // Completeaza campul de email din formularul de login
  await page.getByRole("textbox", { name: "Email" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("george.bejan18@gmail.com");
  // Trece la pasul urmator din login (introducerea parolei)
  await page.getByRole("button", { name: "Continue" }).click();
  // Da click pe campul de parola pentru a-l activa/focusa
  await page.getByRole("textbox", { name: "Password" }).click();
  // Completeaza parola contului
  await page.getByRole("textbox", { name: "Password" }).fill("mFPfgjUhV7qaw6t!");
  // Dezvaluie parola introdusa (comuta vizibilitatea campului de parola)
  await page.getByRole("button", { name: "Show password" }).click();
  // Confirma autentificarea si intra in workspace
  await page.getByRole("button", { name: "Go to workspace" }).click();

  // Selecteaza proiectul de test din sidebar-ul principal
  await page.getByRole("complementary", { name: "Main sidebar" }).getByText("👍Proiect de test").click();
  // Navigheaza catre pagina de "Work items" (task-uri) a proiectului
  await page.getByRole("complementary", { name: "Main sidebar" }).getByRole("link", { name: "Work items" }).click();

  // Deschide/selecteaza work item-ul "Al doilea" din lista
  await page.getByRole("link", { name: "Select work item Al doilea" }).click();
  // Apasa butonul "Assign to me" (al 5-lea gasit pe pagina, index 4) pentru a atribui item-ul utilizatorului curent
  await page.getByRole("button", { name: "Assign to me" }).nth(4).click();
});
