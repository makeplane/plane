import { test } from "@playwright/test";

test("test", async ({ page }) => {
  // Navigheaza la aplicatia rulata local
  await page.goto("http://localhost:3000/");

  // Completeaza campul de email din formularul de login
  await page.getByRole("textbox", { name: "Email" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("george.bejan18@gmail.com");
  // Trece la pasul urmator din login (introducerea parolei)
  await page.getByRole("button", { name: "Continue" }).click();
  // Completeaza parola contului
  await page.getByRole("textbox", { name: "Password" }).fill("mFPfgjUhV7qaw6t!");
  // Confirma autentificarea si intra in workspace
  await page.getByRole("button", { name: "Go to workspace" }).click();

  // Selecteaza proiectul de test din sidebar-ul principal
  await page.getByRole("complementary", { name: "Main sidebar" }).getByText("👍Proiect de test").click();
  // Navigheaza catre pagina de "Work items" (task-uri) a proiectului
  await page.getByRole("complementary", { name: "Main sidebar" }).getByRole("link", { name: "Work items" }).click();

  // Bifeaza checkbox-ul de selectie pentru work item-ul "Al treilea"
  await page.getByRole("link", { name: "Select work item Al treilea" }).getByLabel("Select work item").click();
  // Bifeaza checkbox-ul de selectie pentru work item-ul "Al doilea"
  await page.getByRole("link", { name: "Select work item Al doilea" }).getByLabel("Select work item").click();

  // Confirma ca s-au selectat 2 work items (bara de operatii bulk aparuta jos)
  await page
    .locator("div")
    .filter({ hasText: /^2 work items selectedSelect allBacklogClear$/ })
    .first()
    .click();

  // Deschide dropdown-ul (combobox) din bara de operatii bulk folosit pentru schimbarea statusului
  await page.locator('.bulk-operations-root .h-full > [id^="headlessui-combobox-button-"]').click();
  // Referinta catre acelasi buton, folosita pentru a calcula pozitia si a simula drag&drop
  const button = page.locator('.bulk-operations-root .h-full > [id^="headlessui-combobox-button-"]');

  // Obtine coordonatele si dimensiunile butonului pentru a putea pozitiona cursorul mouse-ului
  const box = await button.boundingBox();

  // Daca butonul nu este gasit in DOM, testul se opreste cu eroare explicita
  if (!box) throw new Error("Button not found");

  // Move to center of button
  // Muta cursorul mouse-ului exact in centrul butonului dropdown
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  // Hold mouse button down
  // Apasa si tine apasat butonul stang al mouse-ului (initiaza un drag)
  await page.mouse.down();

  // Drag slightly outside the button while still holding
  // Trage cursorul in afara zonei butonului, cu mouse-ul apasat, pentru a simula un drag/deschidere a listei
  await page.mouse.move(box.x + box.width + 30, box.y + box.height / 2, { steps: 20 });

  // Optional pause if the UI needs time to react
  // await page.waitForTimeout(500);

  // Release mouse button
  // Elibereaza butonul mouse-ului, incheind gestul de drag
  await page.mouse.up();

  // Localizeaza a doua optiune din lista de statusuri afisata in dropdown (combobox options)
  const option = page.locator(
    '.bulk-operations-root .h-full > [id^="headlessui-combobox-options-"] .mt-2:nth-child(2)'
  );

  // Trece cu mouse-ul peste optiune pentru a declansa eventuale efecte de hover/highlight
  await option.hover();

  // Selecteaza optiunea respectiva, aplicand noul status celor 2 work items selectate
  await option.click();
  // Pune testul in pauza (mod debug interactiv Playwright Inspector) pentru inspectie manuala
  await page.pause();
});
