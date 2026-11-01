# Referencia técnica

El módulo público es `src/mini-framework.js`.

```javascript
import { createElement, render, createStore } from "./mini-framework.js";
```

Ajusta la ruta según la ubicación del módulo consumidor.

## createElement(type, props, ...children)

Construye y devuelve un elemento virtual. Se ejecuta al describir la vista, 
tanto con llamadas directas como con llamadas generadas a partir de JSX.

- `type` puede ser una etiqueta HTML o una función de componente.
- `props` contiene propiedades como `className`, `checked` u `onClick`.Puede ser `null`.
 - `children` puede incluir elementos virtuales, strings, números y arrays.
  Los arrays se aplanan, los números se convierten a texto y se omiten
  `null`, `undefined` y los booleanos. Se conservan `0` y el texto vacío.

```javascript
createElement("p", { className: "count" }, "Total: ", 0);
```

Resultado:

```javascript
{
  type: "p",
  props: { className: "count" },
  children: ["Total: ", "0"]
}
```

Si `type` es una función, el framework la ejecuta con sus propiedades y un array `children`. El componente debe devolver un elemento virtual con una sola raíz. Una `key` pasada al componente se traslada a su raíz para que el padre pueda reconocerla al comparar hermanos.

## render(virtualNode, container)

Monta o actualiza un árbol en un elemento del DOM. Su valor de retorno es `undefined`.

En el primer montaje exige un contenedor vacío, crea nodos reales e inserta la raíz. El framework guarda el árbol virtual en un `WeakMap`
asociado al contenedor.

En las llamadas siguientes compara el árbol nuevo con el anterior:

1. Para dos textos, modifica el valor del nodo si cambió el contenido.
2. Si cambia el tipo de nodo o su clave, reemplaza el nodo correspondiente.
3. Si conserva la etiqueta y la clave, actualiza sus hijos y propiedades.
4. Inserta los hijos nuevos y elimina los que desaparecieron.
5. Guarda el árbol nuevo para la siguiente llamada.

Cada llamada recibe una nueva descripción. Trata los árboles ya renderizados como inmutables y deja que el framework gestione los descendientes del contenedor.

### Propiedades y eventos

`className` y `htmlFor` corresponden a los atributos HTML `class` y `for`.
Se asignan directamente propiedades de formularios como `value`, `checked` y `disabled`. Utiliza booleanos reales para `checked` y `disabled`.

Los manejadores se pasan como funciones, por ejemplo `onClick={increment}`.
Al cambiar una referencia de función, se elimina el manejador anterior y se registra el nuevo. Al quitar la propiedad, se elimina el manejador.

Si la vista declara `value`, ese valor se sincroniza al renderizar. Si un campo conserva su nodo y la vista nunca declara `value`, el navegador
conserva el texto que escribió el usuario.

### Listas y claves

Los hijos sin clave se comparan por posición. Para tareas que se pueden eliminar o reordenar, usa identificadores estables:

```jsx
<ul>
  {tasks.map((task) => (
    <li key={task.id}>{task.title}</li>
  ))}
</ul>
```

Las claves pueden ser strings o números finitos y deben ser únicas entre hermanos. En este framework, un padre admite todos sus hijos con clave o todos sin clave. Coloca el título de una lista fuera del `<ul>` y usa como hijos del `<ul>` las filas con clave. `key` es información del framework y se omite al escribir atributos HTML.

## createStore(reducer, initialState)

Crea un store con un estado inicial explícito. Devuelve un objeto con `getState`, `dispatch` y `subscribe`.

El reducer recibe `(state, action)` y devuelve el siguiente estado.
Para acciones desconocidas devuelve el mismo `state`. Cuando modifica datos, crea un objeto o array nuevo. 
El store considera inválido queel reducer devuelva `undefined` o despache otra acción mientras se ejecuta.
 
### getState()

Devuelve la referencia al estado actual. Los consumidores pueden leerla.
Para cambiar el estado, despacha una acción.

### dispatch(action)

Recibe un objeto con un `type` de texto no vacío. La aplicación decide qué datos adicionales necesita cada acción.

```javascript
store.dispatch({ type: "task/remove", payload: 2 });
```

Ejecuta el reducer de forma síncrona. Si `Object.is` considera iguales el estado anterior y el resultado, conserva el estado y omite la
notificación. Si cambió, guarda el nuevo estado y llama a los suscriptores. Una llamada completada devuelve la acción recibida.

### subscribe(listener)

Registra una función que se ejecuta sin argumentos después de un cambio.
La función puede consultar `getState()`. Devuelve otra función que cancela la suscripción.

```javascript
const unsubscribe = store.subscribe(updateView);
updateView();  // Montaje inicial.

// Cuando la vista deje de observar el store:
unsubscribe();
```

La suscripción empieza con el siguiente cambio. El montaje inicial se solicita explícitamente.

## Ciclo FLUX

En el ejemplo, un clic provoca la acción `counter/increment`. `dispatch` la entrega al reducer. El store conserva el resultado y avisa a la vista. La vista lee el estado, ejecuta los componentes y entrega a `render` el nuevo árbol virtual. El renderizador conserva el botón y actualiza su texto.

El store y el DOM se conectan en la suscripción. Esa separación permite probar el reducer y el store incluso sin un navegador.

## Límites de esta versión

- Los componentes son funciones síncronas que devuelven una raíz.
- El JSX admite etiquetas y componentes. Los fragmentos `<>...</>` quedanfuera del alcance.
 - Se trabaja con HTML y CSS. Los estilos como objetos y SVG requierensoporte adicional.
 - El algoritmo con claves conserva la identidad de cada elemento. Lacantidad mínima posible de movimientos del DOM queda fuera del alcance.
 - El estado se mantiene en memoria. La persistencia es responsabilidad dela aplicación consumidora.
 
## Verificación

Con el servidor de desarrollo activo, abre `/tests/`. La suite comprueba componentes, texto, propiedades, eventos, formularios, listas y el flujo
desde un clic hasta la actualización de la vista.