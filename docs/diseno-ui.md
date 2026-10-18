[← Volver a Arquitectura](arquitectura.md)

# Sistema de Diseño del Frontend

Referencia visual: [servicelab.ai](https://www.servicelab.ai/). Se toma su paleta (cian sobre navy) y su tipografía (Poppins), con **modo claro y modo oscuro**.

## Principios

1. **Claro y sobrio.** Fondos neutros, el cian solo para acciones y elementos de marca.
2. **Nada de valores sueltos.** Colores, espacios, radios y tamaños de texto salen siempre de un token (`var(--...)`).
3. **Nada de textos sueltos.** Todo texto visible sale de `src/i18n/es.ts` vía `t('clave')`.
4. **Accesible.** Contraste mínimo 4.5:1 para texto, objetivo táctil de 44px y foco visible. Los estados nunca se comunican solo con color: siempre van con icono o texto.
5. **Ambos modos desde el inicio.** Cada token de color tiene su valor claro y oscuro; un componente no decide el modo.

## Paleta

| Rol | Claro | Oscuro | Uso |
|-----|-------|--------|-----|
| Marca / acción | `#23a6dc` | `#23a6dc` | Botón principal, indicadores activos. Texto encima: navy `#0c1b33` |
| Enlace | `#156b93` | `#72ceff` | Enlaces y texto de marca |
| Acento | `#1f3c88` | `#6ee7e2` | Resaltes puntuales, nunca texto largo |
| Fondo | `#f5f7fb` | `#06111f` | Fondo de la página |
| Superficie | `#ffffff` | `#081a2d` | Cards, header, modales |
| Texto | `#0c1b33` | `#eaf6ff` | Texto principal |
| Texto secundario | `#4b5563` | `#a8c5dc` | Descripciones, metadatos |
| Éxito / Aviso / Error | `#2e7d32` / `#a86500` / `#c62828` | `#66bb6a` / `#ffb300` / `#ef5350` | Estados, siempre con icono o texto |

## Tokens

Viven en `frontend/src/styles/tokens/` en tres niveles:

| Archivo | Nivel | ¿Lo usan los componentes? |
|---------|-------|---------------------------|
| `primitives.css` | Paleta cruda: `--palette-cyan-500`, `--palette-navy-900`, ... | **No** |
| `theme.css` | Semánticos de color: `--color-bg`, `--color-text`, `--color-primary`, ... | **Sí** |
| `scale.css` | Tipografía, espaciado, radios, movimiento, capas | **Sí** |

- Un color nuevo entra primero como primitivo y luego se expone con un nombre semántico (por **rol**, no por tono: `--color-danger`, no `--color-red`).
- Los semánticos se definen una sola vez con `light-dark(<claro>, <oscuro>)`.

### Modo claro / oscuro

- `theme.css` usa `color-scheme`: sin preferencia manda el sistema operativo; con `data-theme="light|dark"` en `<html>` manda el switch.
- El switch (`shared/components/ThemeToggle.astro`) guarda la elección en `localStorage` (`shared/lib/theme.ts`).
- `BaseLayout` aplica el tema con un script inline **antes de pintar**, para evitar el parpadeo.

## Tipografía

Poppins (400, 500, 600), con `system-ui` de respaldo.

| Token | Tamaño | Uso |
|-------|--------|-----|
| `--text-2xl` | 1.9–2.5rem | Título de página (`h1`) |
| `--text-xl` | 1.6rem | Título de sección (`h2`) |
| `--text-lg` | 1.25rem | Título de card (`h3`) |
| `--text-md` | 1rem | Cuerpo |
| `--text-sm` | 0.9rem | Texto secundario |
| `--text-xs` | 0.78rem | Etiquetas |

## Espaciado y forma

- Escala base de 4px: `--space-1` (4px) a `--space-16` (64px).
- Radios: `--radius-sm` (inputs, badges), `--radius-md` (botones), `--radius-lg` (cards), `--radius-full` (pills, avatares).
- Contenido centrado con ancho máximo `--size-content` (72rem).
- Elevación con `--shadow-sm` / `--shadow-md` (más densas en oscuro).

## Componentes (guía para cuando se implementen)

| Componente | Especificación |
|------------|----------------|
| Botón principal | Fondo `--color-primary`, texto `--color-on-primary`, `--radius-md`, alto `--size-touch`. Hover `--color-primary-hover` |
| Botón secundario | Fondo `--color-surface`, borde `--color-border-strong`, texto `--color-text` |
| Card | Fondo `--color-surface`, borde `--color-border`, `--radius-lg`, `--shadow-sm`, padding `--space-6` |
| Badge de estado | Fondo `--color-*-soft`, texto `--color-*`, icono + texto, `--radius-full` |
| Input | Fondo `--color-surface`, borde `--color-border-strong`, foco `--color-focus-ring` |

## Textos (i18n)

La app es **solo en español**, pero los textos se manejan como en un archivo de internacionalización:

```ts
// src/i18n/es.ts
tasks: { title: 'Tareas', effort: '{hours} h' }

// en un componente
t('tasks.title')                 // 'Tareas'
t('tasks.effort', { hours: 4 })  // '4 h'
```

- Las claves se agrupan por feature (`tasks.*`, `workers.*`) y lo transversal en `common.*`.
- `t()` es tipado: una clave que no existe no compila.
- Si algún día hay otro idioma, basta con agregar `en.ts` con la misma forma (`Messages`) y elegir el diccionario en `t.ts`.

## Estructura de carpetas

```
frontend/src/
├── api/                  # api.generated.ts (generado) + client.ts
├── features/             # una carpeta por feature
│   └── tasks/
│       ├── components/       # componentes React (islands)
│       └── index.ts          # API pública: las páginas importan solo de aquí
├── i18n/
│   ├── es.ts                 # todos los textos
│   └── t.ts                  # t('clave', params) tipado
├── layouts/
│   ├── BaseLayout.astro      # <html>, fuentes, tema inicial, estilos globales
│   └── components/           # piezas del layout (AppHeader)
├── pages/                # rutas: delgadas, solo layout + features
├── shared/               # reutilizable, sin dependencias de features
│   ├── components/           # ThemeToggle y futuros Button, Card, Badge...
│   └── lib/                  # utilidades (theme.ts)
└── styles/
    ├── tokens/               # primitives.css, theme.css, scale.css
    ├── base.css              # reset y estilos de elementos HTML
    └── global.css            # punto de entrada (importa todo lo anterior)
```

**Dependencias solo hacia abajo:** `pages → layouts → features → shared / api / i18n`.
