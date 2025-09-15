import { checkMissingTranslations } from "../check-translations";

describe("i18n Translation Check", () => {
  describe("when checking for missing translations", () => {
    it("should detect when translations are missing", async () => {
      const result = await checkMissingTranslations();

      expect(result).toHaveProperty("hasMissingTranslations");

      expect(result.hasMissingTranslations).toBe(false);
    });
  });
});
