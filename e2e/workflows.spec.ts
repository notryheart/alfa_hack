import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function login(page: Page, bank = false) {
  await page.goto("/login");
  if (bank)
    await page.getByRole("button", { name: "Я сотрудник банка" }).click();
  await page.getByRole("button", { name: "Открыть демо", exact: true }).click();
}
test("public landing, working demo, and mobile navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Один общий",
  );
  await page.getByRole("button", { name: "Для банка", exact: true }).click();
  await expect(
    page.getByText("Проверить документ", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  if (process.env.SCREENSHOTS_DIR)
    await page.screenshot({
      path: `${process.env.SCREENSHOTS_DIR}/landing-desktop.png`,
      fullPage: true,
    });
  if (process.env.SCREENSHOTS_DIR)
    await page.screenshot({
      path: `${process.env.SCREENSHOTS_DIR}/hero-desktop.png`,
    });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  if (process.env.SCREENSHOTS_DIR)
    await page.screenshot({
      path: `${process.env.SCREENSHOTS_DIR}/landing-mobile.png`,
      fullPage: true,
    });
  if (process.env.SCREENSHOTS_DIR)
    await page.screenshot({
      path: `${process.env.SCREENSHOTS_DIR}/hero-mobile.png`,
    });
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .getByRole("link", { name: "Как это работает", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Открыть меню" }),
  ).toBeVisible();
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Добрый день, Анна." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Открыть навигацию" }).click();
  await page
    .getByRole("navigation", { name: "Рабочее пространство", exact: true })
    .getByRole("link", { name: "Заявки", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Заявки", exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  if (process.env.SCREENSHOTS_DIR)
    await page.screenshot({
      path: `${process.env.SCREENSHOTS_DIR}/applications-mobile.png`,
      fullPage: true,
    });
  expect(errors).toEqual([]);
});
test("upload → contextual discussion → bank review → explicit request resolution", async ({
  page,
}) => {
  await login(page);
  if (process.env.SCREENSHOTS_DIR)
    await page.screenshot({
      path: `${process.env.SCREENSHOTS_DIR}/dashboard-desktop.png`,
      fullPage: true,
    });
  await page.goto("/app/applications/a-0842/requests/r-turnover");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog")).toContainText(
    "Уточнить обороты по счетам",
  );
  if (process.env.SCREENSHOTS_DIR)
    await page.screenshot({
      path: `${process.env.SCREENSHOTS_DIR}/request-desktop.png`,
    });
  await page.locator("input[type=file]").setInputFiles({
    name: "Обороты_v2.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% Synthetic demo only\n%%EOF"),
  });
  await expect(page.getByRole("status")).toContainText("Версия загружена");
  await expect(page.getByRole("dialog")).toContainText("Открытый запрос");
  await page
    .getByLabel("Ваше сообщение")
    .fill("Добавили помесячную разбивку, прошу проверить.");
  await page.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect(
    page.getByText("Добавили помесячную разбивку, прошу проверить."),
  ).toBeVisible();
  const href = await page
    .getByRole("dialog")
    .getByRole("link", { name: "На проверке" })
    .getAttribute("href");
  await page.keyboard.press("Escape");
  await login(page, true);
  await expect(
    page.getByRole("heading", { name: "Очередь без лишнего шума." }),
  ).toBeVisible();
  await page.goto("/app/applications/a-0842/requests/r-turnover");
  await expect(
    page.getByRole("button", { name: "Отметить решённым" }),
  ).toBeDisabled();
  await page.goto(href!);
  await page
    .getByRole("button", { name: "На исправление", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Опишите конкретное исправление",
  );
  await page
    .getByLabel("Комментарий к проверке")
    .fill("Помесячная разбивка добавлена. Замечаний нет.");
  await page.getByRole("button", { name: "Принять", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Результат проверки");
  await page.goto("/app/applications/a-0842/requests/r-turnover");
  await page.getByRole("button", { name: "Отметить решённым" }).click();
  await expect(page.getByRole("dialog")).toContainText("Запрос решён");
  await page.reload();
  await expect(page.getByRole("dialog")).toContainText("Запрос решён");
});
test("wizard validates and preserves a draft across navigation", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Новая заявка", exact: true }).click();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await page.getByLabel("Запрашиваемая сумма").fill("-1");
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(
    page.getByText("Укажите положительную сумму", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Запрашиваемая сумма").fill("1200000,50");
  await page.getByRole("link", { name: "Заявки", exact: true }).click();
  await page.getByRole("link", { name: "Новая заявка", exact: true }).click();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByLabel("Запрашиваемая сумма")).toHaveValue(
    "1200000,50",
  );
  await page.getByRole("button", { name: "Продолжить" }).click();
  await page.getByRole("button", { name: "Сохранить черновик" }).click();
  await expect(
    page.getByRole("heading", { name: "Отправьте заявку на рассмотрение" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(
    page.getByRole("heading", { name: "Ожидайте следующего шага от банка" }),
  ).toBeVisible();
});
test("role guards, resource guards, and unknown deep links", async ({
  page,
}) => {
  await page.goto(
    "/app/applications/a-0842/documents/s-balance/versions/v-balance-2",
  );
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("button", { name: "Открыть демо", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("ТЕКУЩАЯ ВЕРСИЯ");
  await page.reload();
  await expect(page.getByRole("dialog")).toContainText("Принят");
  await page.goto("/app/applications/a-private/overview");
  await expect(
    page.getByRole("heading", { name: "Нет доступа к этому разделу" }),
  ).toBeVisible();
  await page.goto("/bank/dashboard");
  await expect(
    page.getByRole("heading", { name: "Нет доступа к этому разделу" }),
  ).toBeVisible();
  await page.goto("/admin/integrations");
  await expect(
    page.getByRole("heading", { name: "Нет доступа к этому разделу" }),
  ).toBeVisible();
  await page.goto("/app/applications/a-0842/requests/unknown");
  await expect(
    page.getByRole("heading", { name: "Здесь пока ничего нет" }),
  ).toBeVisible();
});
test("bank creates a request with a new required document and notifications mark as read", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/app/applications/a-0842/requests");
  await page.getByRole("button", { name: "Новый запрос", exact: true }).click();
  await page.getByLabel("Заголовок").fill("Уточнить структуру выручки");
  await page.getByLabel("Пояснение").fill("Добавьте расшифровку за квартал.");
  await page
    .getByLabel("Новый обязательный документ")
    .fill("Расшифровка выручки");
  await page
    .getByRole("button", { name: "Создать запрос", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /Уточнить структуру выручки/ }),
  ).toBeVisible();
  await page.goto("/app/applications/a-0842/overview");
  await expect(
    page.getByText("Расшифровка выручки", { exact: true }),
  ).toBeVisible();
  await page.goto("/app/notifications");
  await page
    .getByRole("button", { name: "Прочитать все", exact: true })
    .click();
  await page.getByRole("button", { name: "Непрочитанные (0)" }).click();
  await expect(
    page.getByRole("heading", { name: "Вы ничего не пропустили" }),
  ).toBeVisible();
});
test("dashboard summary deep links list the same underlying materials", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: /Открытые запросы/ }).click();
  await expect(page.getByRole("status")).toHaveText("Найдено: 2");
  await expect(page.locator(".request-row")).toHaveCount(2);
  await page.goto("/app/dashboard");
  await page.getByRole("link", { name: /Документы требуют действия/ }).click();
  await expect(page.getByRole("status")).toHaveText("Найдено: 2");
  await expect(page.locator(".cross-app-document")).toHaveCount(2);
});
test("accessibility: key screens have no serious or critical WCAG violations", async ({
  page,
}) => {
  const paths = [
    "/",
    "/login",
    "/app/dashboard",
    "/app/applications/a-0842/overview",
    "/app/applications/a-0842/requests/r-turnover",
    "/app/applications/a-0842/documents/s-balance/versions/v-balance-2",
  ];
  await login(page);
  const issues: unknown[] = [];
  for (const path of paths) {
    await page.goto(path);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    issues.push(
      ...result.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => ({
          path,
          rule: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
    );
  }
  expect(issues).toEqual([]);
});

test("mobile workspace stays within viewport and dialog keyboard focus is contained", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  for (const path of [
    "/app/dashboard",
    "/app/applications/a-0842/overview",
    "/app/applications/a-0842/documents",
    "/app/applications/a-0842/requests/r-turnover",
    "/app/applications/a-0842/documents/s-balance/versions/v-balance-1",
  ]) {
    await page.goto(path);
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  }
  await page.goto("/app/applications/a-0842/requests/r-turnover");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Закрыть", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByLabel("Ваше сообщение")).toBeFocused();
  if (process.env.SCREENSHOTS_DIR) {
    await page.screenshot({
      path: `${process.env.SCREENSHOTS_DIR}/request-mobile.png`,
    });
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("system administration does not grant application membership", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Роль в демо").selectOption("admin");
  await page.getByRole("button", { name: "Открыть демо", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Интеграции", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Настройка недоступна" }),
  ).toHaveCount(3);
  await page.goto("/app/notifications");
  await expect(
    page.getByRole("button", { name: "Все (0)", exact: true }),
  ).toBeVisible();
  await page.goto("/app/applications/a-0842/overview");
  await expect(
    page.getByRole("heading", { name: "Нет доступа к этому разделу" }),
  ).toBeVisible();
});
