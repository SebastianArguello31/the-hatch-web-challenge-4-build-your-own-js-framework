# Incorporar el framework a otra aplicación

Al terminar tendrás un contador que aumenta al pulsar un botón.
Necesitas un navegador y un servidor HTTP local para servir los módulos ES.

## 1. Preparar los archivos

Copia `src/mini-framework.js` desde el repositorio del framework.
Organiza la aplicación de esta manera:

```text
mi-contador/
├── index.html
├── main.js
└── mini-framework.js
```

Cuando integres el archivo en un proyecto que vayas a entregar, anota
en su README el repositorio de origen y la revisión que copiaste.

## 2. Crear la entrada HTML

Contenido de `index.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mi contador</title>
  </head>
  <body>
    <main>
      <h1>Mi contador</h1>
      <div id="app"></div>
    </main>

    <script type="module" src="./main.js"></script>
  </body>
</html>
```

Mantén vacío el interior de `#app` antes de la primera llamada a `render`.
Incluso los espacios o saltos de línea dentro del contenedor pueden crear un nodo de texto.

## 3. Conectar el botón con el estado

Contenido de `main.js`:

```javascript
import { createElement, createStore, render } from "./mini-framework.js";

function reducer(state, action) {
  if (action.type === "counter/increment") {
    return { count: state.count + 1 };
  }

  return state;
}

const store = createStore(reducer, { count: 0 });
const container = document.getElementById("app");

function increment() {
  store.dispatch({ type: "counter/increment" });
}

function Counter({ count }) {
  return createElement(
    "button",
    { type: "button", onClick: increment },
    "Clics: ",
    count
  );
}

function updateView() {
  const view = createElement(Counter, { count: store.getState().count });
  render(view, container);
}

store.subscribe(updateView);
updateView();
```

`updateView()` realiza el montaje inicial. A partir de ahí, cada clic despacha una acción. 
El reducer devuelve el nuevo estado, el storenotifica a `updateView` y `render` actualiza el texto del botón.
 
## 4. Ejecutar y comprobar

Desde la carpeta `mi-contador`, si tienes Python instalado en Windows:

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Abre `http://127.0.0.1:8000/`. El botón debe empezar en `Clics: 0` y
mostrar `Clics: 3` después de tres clics. Detén el servidor con `Ctrl+C`.

## 5. Escribir el componente con JSX

En el ejemplo del repositorio, Vite transforma JSX a llamadas a `createElement`. Con esa configuración, el mismo componente se escribe así:

```jsx
function Counter({ count }) {
  return (
    <button type="button" onClick={increment}>
      Clics: {count}
    </button>
  );
}
```

Para utilizar JSX en la aplicación consumidora, usa una entrada `.jsx`, actualiza la ruta del script en el HTML e importa `createElement` en cada módulo que contenga JSX. Para Vite 8, la configuración de la transformación es la siguiente:

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "classic",
      pragma: "createElement"
    }
  }
});
```

Aquí `index.html` está en la raíz de la aplicación consumidora. El valor `root: "examples/basic-example"` del repositorio del framework corresponde a la ubicación de su ejemplo.

## Problemas frecuentes

- **El navegador muestra un error al importar el módulo.** Abre la páginadesde el servidor HTTP y comprueba que la ruta de importación parte delarchivo que contiene el `import`.
 - **`render` rechaza el contenedor.** Comprueba que el identificador coincidecon el HTML y que el contenedor del primer montaje está vacío.
 - **`createElement is not defined` al utilizar JSX.** Importa `createElement`en el módulo `.jsx` que aparece en el error.
 - **El estado cambia en el depurador pero la pantalla sigue igual.** Comprueba la suscripción de la vista y que el reducer devuelve un objeto nuevo cuando cambia el estado.