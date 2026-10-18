## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Reglas del proyecto

Sistema de diseño completo en [`../docs/diseno-ui.md`](../docs/diseno-ui.md).

- **Textos:** la UI es solo en español, pero ningún texto va escrito en un componente. Todo sale de `src/i18n/es.ts` con `t('clave')` (`src/i18n/t.ts`).
- **Colores y medidas:** solo tokens (`var(--color-*)`, `var(--space-*)`, `var(--text-*)`, `var(--radius-*)`). Nunca hex sueltos ni `--palette-*` en componentes.
- **Modo claro/oscuro:** los tokens de `src/styles/tokens/theme.css` ya cambian solos; un componente no debe preguntar por el modo.
- **Estructura:** `pages/` delgadas → `layouts/` → `features/<nombre>/` (importar solo desde su `index.ts`) → `shared/`, `api/`, `i18n/`.
- **Imports** con el alias `@src/*`, nunca `../`.
