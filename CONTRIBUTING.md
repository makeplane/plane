# Contributing to Plane

Thank you for showing an interest in contributing to Plane! All kinds of contributions are valuable to us. In this guide, we will cover how you can quickly onboard and make your first contribution.

## Submitting an issue

Before submitting a new issue, please search the [issues](https://github.com/makeplane/plane/issues) tab. Maybe an issue or discussion already exists and might inform you of workarounds. Otherwise, you can give new information.

While we want to fix all the [issues](https://github.com/makeplane/plane/issues), before fixing a bug we need to be able to reproduce and confirm it. Please provide us with a minimal reproduction scenario using a repository or [Gist](https://gist.github.com/). Having a live, reproducible scenario gives us the information without asking questions back & forth with additional questions like:

- 3rd-party libraries being used and their versions
- a use-case that fails

Without said minimal reproduction, we won't be able to investigate all [issues](https://github.com/makeplane/plane/issues), and the issue might not be resolved.

You can open a new issue with this [issue form](https://github.com/makeplane/plane/issues/new).

## Projects setup and Architecture

### Requirements

- Node.js version v16.18.0
- Python version 3.8+
- Postgres version v14
- Redis version v6.2.7

### Setup the project

The project is a monorepo, with backend api and frontend in a single repo.

The backend is a django project which is kept inside apiserver

1. Clone the repo

```bash
git clone https://github.com/makeplane/plane.git [folder-name]
cd [folder-name]
chmod +x setup.sh
```

2. Run setup.sh

```bash
./setup.sh
```

3. Start the containers

```bash
docker compose -f docker-compose-local.yml up
```

## Missing a Feature?

If a feature is missing, you can directly _request_ a new one [here](https://github.com/makeplane/plane/issues/new?assignees=&labels=feature&template=feature_request.yml&title=%F0%9F%9A%80+Feature%3A+). You also can do the same by choosing "🚀 Feature" when raising a [New Issue](https://github.com/makeplane/plane/issues/new/choose) on our GitHub Repository.
If you would like to _implement_ it, an issue with your proposal must be submitted first, to be sure that we can use it. Please consider the guidelines given below.

## Coding guidelines

To ensure consistency throughout the source code, please keep these rules in mind as you are working:

- All features or bug fixes must be tested by one or more specs (unit-tests).
- We use [Eslint default rule guide](https://eslint.org/docs/rules/), with minor changes. An automated formatter is available using prettier.

## Ways to contribute

- Try Plane Cloud and the self hosting platform and give feedback
- Add new integrations
- Add or update translations
- Help with open [issues](https://github.com/makeplane/plane/issues) or [create your own](https://github.com/makeplane/plane/issues/new/choose)
- Share your thoughts and suggestions with us
- Help create tutorials and blog posts
- Request a feature by submitting a proposal
- Report a bug
- **Improve documentation** - fix incomplete or missing [docs](https://docs.plane.so/), bad wording, examples or explanations.

## Contributing to language support
This guide is designed to help contributors understand how to add or update translations in the application. 

### Understanding translation structure

#### File organization
Translations are organized by language in the locales directory. Each language has its own folder containing JSON files for translations. Here's how it looks:

```
packages/i18n/src/locales/
    ├── en/
    │   ├── core.json       # Critical translations
    │   └── translations.json
    ├── fr/
    │   └── translations.json
    └── [language]/
        └── translations.json   
```
#### Nested structure
To keep translations organized, we use a nested structure for keys. This makes it easier to manage and locate specific translations. For example:

```json
{
  "issue": {
    "label": "Work item",
    "title": {
      "label": "Work item title"
    }
  }
}
```

### Translation formatting guide
We use [IntlMessageFormat](https://formatjs.github.io/docs/intl-messageformat/) to handle dynamic content, such as variables and pluralization. Here's how to format your translations:

#### Examples
- **Simple variables** 
    ```json
    {
    "greeting": "Hello, {name}!"
    }
    ```

- **Pluralization** 
    ```json
    {
    "items": "{count, plural, one {Work item} other {Work items}}"
    }
    ```

### Contributing guidelines

#### Updating existing translations
1. Locate the key in `locales/<language>/translations.json`.

2. Update the value while ensuring the key structure remains intact.
3. Preserve any existing ICU formats (e.g., variables, pluralization).

#### Adding new translation keys
1. When introducing a new key, ensure it is added to **all** language files, even if translations are not immediately available. Use English as a placeholder if needed.

2. Keep the nesting structure consistent across all languages.

3. If the new key requires dynamic content (e.g., variables or pluralization), ensure the ICU format is applied uniformly across all languages.

### Adding new languages
Adding a new language involves several steps to ensure it integrates seamlessly with the project. Follow these instructions carefully:

1. **Update type definitions**  
Add the new language to the TLanguage type in the language definitions file:

    ```typescript
    // types/language.ts
    export type TLanguage = "en" | "fr" | "your-lang";
    ``` 

2. **Add language configuration**  
Include the new language in the list of supported languages:

    ```typescript
    // constants/language.ts
    export const SUPPORTED_LANGUAGES: ILanguageOption[] = [
    { label: "English", value: "en" },
    { label: "Your Language", value: "your-lang" }
    ];
    ```

3. **Create translation files**  
    1.  Create a new folder for your language under locales (e.g., `locales/your-lang/`).

    2. Add a `translations.json` file inside the folder.

    3. Copy the structure from an existing translation file and translate all keys.

4. **Update import logic**  
Modify the language import logic to include your new language:

    ```typescript
    private importLanguageFile(language: TLanguage): Promise<any> {
    switch (language) {
        case "your-lang":
        return import("../locales/your-lang/translations.json");
        // ...
    }
    }
    ```

### Quality checklist
Before submitting your contribution, please ensure the following:

- All translation keys exist in every language file.
- Nested structures match across all language files.
- ICU message formats are correctly implemented.
- All languages load without errors in the application.
- Dynamic values and pluralization work as expected.
- There are no missing or untranslated keys.

#### Pro tips
- When in doubt, refer to the English translations for context.
- Verify pluralization works with different numbers.
- Ensure dynamic values (e.g., `{name}`) are correctly interpolated.
- Double-check that nested key access paths are accurate.

Happy translating! 🌍✨

## Need help? Questions and suggestions

Questions, suggestions, and thoughts are most welcome. We can also be reached in our [Discord Server](https://discord.com/invite/A92xrEGCge).
