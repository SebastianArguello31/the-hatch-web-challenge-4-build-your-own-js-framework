# Mini JavaScript Framework

Framework educativo construido con JavaScript y la API del DOM del navegador.
Su objetivo es mostrar cómo una descripción de la interfaz se convierte en
nodos reales y cómo esos nodos se actualizan al cambiar el estado.

El archivo reutilizable es `src/mini-framework.js`.

## Funcionalidades

- Elementos virtuales con propiedades, texto e hijos.
- Componentes funcionales escritos con JavaScript o JSX.
- Eventos como `click`, `input` y `submit`.
- Renderizado inicial y actualización de texto, propiedades e hijos.
- Listas con claves estables para conservar la identidad de sus elementos.
- Estado centralizado mediante acciones, un reducer y suscripciones.

## Tecnologías y requisitos

El framework utiliza JavaScript con módulos ES y la API del DOM.
El ejemplo utiliza HTML, JSX y Vite 8 para el desarrollo y la compilación.

Para ejecutar el ejemplo localmente puedes usar Node.js 22.12 o una versión posterior de la rama 22, con npm.

## Instalación y ejecución

Desde la raíz del repositorio:

```powershell
npm ci
npm run dev
```

`npm ci` utiliza las versiones registradas en `package-lock.json`.
Si estás construyendo el proyecto por etapas y todavía no generaste ese archivo, ejecuta `npm install` para la primera instalación.

Abre la dirección indicada por Vite. La ruta `/` muestra el ejemplo interactivo y `/tests/` abre la página de pruebas en desarrollo.

## Primer ejemplo

Este código supone que el HTML contiene un contenedor vacío con `id="app"`
y que el módulo se encuentra junto a una copia de `mini-framework.js`.

```javascript
import { createElement, render } from "./mini-framework.js";

const container = document.getElementById("app");

render(createElement("p", null, "Hola"), container);
render(createElement("p", null, "Hola de nuevo"), container);
```

La primera llamada crea el párrafo. La segunda conserva el `<p>` y actualiza su texto.

## Compilación del ejemplo

```powershell
npm run build
npm run preview
```

`dist/` contiene la página de ejemplo compilada. Para integrar el framework en otro proyecto, copia `src/mini-framework.js`.

## Estructura

```text
src/mini-framework.js               API pública y motor de renderizado
examples/basic-example/index.html   Entrada HTML del ejemplo
examples/basic-example/main.jsx     Componentes y ejemplo FLUX
examples/basic-example/tests/       Pruebas en navegador
docs/getting-started.md             Guía de integración
docs/technical-reference.md         API, arquitectura y límites
DESARROLLO_COMPLETO.md              Registro educativo del challenge
vite.config.js                      Transformación JSX y compilación
```

## Pruebas

Con `npm run dev` activo, abre `/tests/`. El resultado esperado de la suite de la etapa 7 es **7 de 7 pruebas aprobadas**. 
Cada fallo indicala expectativa que no se cumplió.
 
## Alcance

Cada componente devuelve un único elemento virtual. El primer render requiere un contenedor vacío. 
En una lista con claves, todos los hijosdirectos deben tener una clave única y estable entre hermanos.
 
El store procesa acciones síncronas. La aplicación conecta el estado a la interfaz mediante una suscripción.

## Documentación

- [Incorporar el framework a una aplicación](docs/getting-started.md)
- [Consultar la API y el ciclo de renderizado](docs/technical-reference.md)