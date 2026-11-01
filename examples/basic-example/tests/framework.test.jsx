import { createElement, render, createStore } from "../../../src/mini-framework.js";

const results = document.getElementById("results");
const summary = document.getElementById("summary");

let passed = 0;
let total = 0;

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function test(name, run) {
    total += 1;

    const container = document.createElement("div");
    const result = document.createElement("li");
    results.appendChild(result);

    try {
        run(container);
        passed += 1;
        result.textContent = `OK — ${name}`;
    } catch (error) {
        result.textContent = `FALLO — ${name}. ${error.message}`;
        console.error(name, error);
    }
}

test("JSX entrega propiedades e hijos al componente", (container) => {
    function Panel({ title, children }) {
        return (
            <section>
                <h2>{title}</h2>
                <div>{children}</div>
            </section>
        );
    }

    render(
        <Panel title="Pendientes">
            <span>{0}</span>
            {false}
            {null}
        </Panel>,
        container
    );

    assert(
        container.querySelector("h2")?.textContent === "Pendientes",
        "El título debe llegar mediante props."
    );

    const content = container.querySelector("section > div");

    assert(content?.childNodes.length === 1, "Debe existir un único hijo.");
    assert(content.firstChild.textContent === "0", "El cero debe conservarse.");
});

test("Actualizar texto conserva el nodo y el borrador del usuario", (container) => {
    function view(count) {
        return (
        <section>
            <p>{count}</p>
            <input type="text" />
        </section>
        );
    }

    render(view(0), container);

    const paragraph = container.querySelector("p");
    const text = paragraph.firstChild;
    const input = container.querySelector("input");
    input.value = "Mi borrador";

    render(view(1), container);

    assert(container.querySelector("p") === paragraph, "Se reemplazó el párrafo.");
    assert(paragraph.firstChild === text, "Se reemplazó el nodo de texto.");
    assert(text.nodeValue === "1", "El texto debe cambiar a 1.");
    assert(container.querySelector("input") === input, "Se reemplazó el campo.");
    assert(input.value === "Mi borrador", "Se perdió el borrador.");
});

test("Las propiedades cambian y una etiqueta distinta reemplaza al nodo", (container) => {
    render(<input type="checkbox" checked={true} title="Completada" />, container);
    const checkbox = container.firstChild;

    assert(checkbox.checked === true, "La casilla debe empezar marcada.");
    assert(checkbox.title === "Completada", "Falta el título inicial.");

    render(<input type="checkbox" checked={false} />, container);

    assert(container.firstChild === checkbox, "Debe conservarse la casilla.");
    assert(checkbox.checked === false, "La casilla debe desmarcarse.");
    assert(!checkbox.hasAttribute("title"), "Debe quitarse el atributo title.");

    render(<p>Finalizado</p>, container);

    assert(container.childNodes.length === 1, "Debe quedar una sola raíz.");
    assert(container.firstChild.tagName === "P", "La nueva raíz debe ser un párrafo.");
    assert(checkbox.parentNode === null, "La casilla anterior debe quedar fuera.");
});

test("Cambiar y quitar onClick actualiza el manejador del mismo botón", (container) => {
    const calls = [];

    render(<button onClick={() => calls.push("A")}>Probar</button>, container);
    const button = container.firstChild;
    button.click();

    render(<button onClick={() => calls.push("B")}>Probar</button>, container);
    button.click();

    render(<button>Probar</button>, container);
    button.click();

    assert(container.firstChild === button, "El botón fue reemplazado.");
    assert(calls.join(",") === "A,B", `Se recibieron estas llamadas: ${calls.join(",")}`);
});

test("El formulario recibe input y submit con el valor escrito", (container) => {
    let typed = "";
    let submitted = "";

    function handleSubmit(event) {
        event.preventDefault();
        submitted = new FormData(event.currentTarget).get("title");
    }

    render(
        <form onSubmit={handleSubmit}>
            <input name="title" onInput={(event) => { typed = event.currentTarget.value; }}/>
        </form>,
        container
    );

    const input = container.querySelector("input");
    input.value = "Repasar JSX";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    const submit = new Event("submit", { bubbles: true, cancelable: true });
    container.querySelector("form").dispatchEvent(submit);

    assert(typed === "Repasar JSX", "onInput debe leer el valor actual.");
    assert(submitted === typed, "onSubmit debe recibir el mismo texto.");
    assert(submit.defaultPrevented, "El manejador debe cancelar el envío.");
});

test("Las tareas con key conservan su identidad al mover, insertar y eliminar", (container) => {
    function Item({ id }) {
        return <li data-id={id}>Tarea {id}</li>;
    }

    function list(ids) {
        return <ul>{ids.map((id) => <Item key={id} id={id} />)}</ul>;
    }

    render(list([1, 2, 3]), container);

    const listNode = container.firstChild;
    const [first, second, third] = listNode.children;

    render(list([3, 4, 1]), container);

    const ids = Array.from(listNode.children, (node) => node.dataset.id);

    assert(ids.join(",") === "3,4,1", "El orden esperado es 3, 4, 1.");
    assert(listNode.children[0] === third, "La tarea 3 debe conservar su nodo.");
    assert(listNode.children[2] === first, "La tarea 1 debe conservar su nodo.");
    assert(second.parentNode === null, "La tarea 2 debe salir de la lista.");
    assert(!third.hasAttribute("key"), "key es interna al framework.");

    render(list([]), container);
    assert(listNode.children.length === 0, "La lista debe quedar vacía.");

    render(list([5]), container);
    assert(listNode.firstChild?.dataset.id === "5", "Debe poder llenarse otra vez.");
});

test("Un clic recorre FLUX y actualiza el componente suscrito", (container) => {
    const initialState = Object.freeze({ count: 0 });

    function reducer(state, action) {
        if (action.type === "counter/increment") {
            return { ...state, count: state.count + 1 };
        }
        return state;
    }

    const store = createStore(reducer, initialState);
    let renders = 0;

    function Counter({ count }) {
        return (
            <button onClick={() => store.dispatch({ type: "counter/increment" })}>
                {count}
            </button>
        );
    }

    function updateView() {
        renders += 1;
        render(<Counter count={store.getState().count} />, container);
    }

    const unsubscribe = store.subscribe(updateView);
    updateView();

    const button = container.firstChild;
    button.click();

    assert(initialState.count === 0, "Se modificó el estado anterior.");
    assert(store.getState().count === 1, "El store debe pasar de 0 a 1.");
    assert(container.firstChild === button, "El botón debe conservar su identidad.");
    assert(button.textContent === "1", "La vista debe mostrar el nuevo estado.");
    assert(renders === 2, "Se esperaba un montaje y una actualización.");

    store.dispatch({ type: "unknown" });
    assert(renders === 2, "Una acción sin cambios no debe actualizar la vista.");

    unsubscribe();
    button.click();

    assert(store.getState().count === 2, "El store debe seguir aceptando acciones.");
    assert(renders === 2, "La suscripción cancelada volvió a ejecutarse.");
    assert(button.textContent === "1", "La vista dejó de observar el store.");
});

summary.textContent = `${passed} de ${total} pruebas aprobadas.`;