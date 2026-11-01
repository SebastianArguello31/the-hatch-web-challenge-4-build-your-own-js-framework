import { createElement, render } from "../../src/mini-framework.js";

function handleClick() {
    console.log("El evento click funciona.");
}

function handleInput(event) {
    console.log("Texto actual:", event.currentTarget.value);
}

function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const taskTitle = String(formData.get("taskTitle") ?? "").trim();

    if (taskTitle === "") {
        console.log("Escribe una tarea antes de enviar.");
        return;
    }

    console.log("Tarea recibida:", taskTitle);
}

const app = createElement(
    "main",
    
    { className: "app" },

    createElement("h1", null, "Mi primer renderizado"),

    createElement("p", null, "Esta interfaz fue creada con nuestro mini-framework."),

    createElement("button", { type: "button", onClick: handleClick }, "Probar clic"),

    createElement(
        "form",
        
        { onSubmit: handleSubmit },

        createElement("label", { htmlFor: "task-title" }, "Nueva tarea"),

        createElement("input", {
            id: "task-title",
            name: "taskTitle",
            type: "text",
            placeholder: "Ejemplo: estudiar JavaScript",
            required: true,
            onInput: handleInput
        }),

        createElement("button", { type: "submit" }, "Probar envío")
    ),

    createElement(
        "label",
        null,
        createElement("input", { type: "checkbox", checked: true, disabled: true }),
        " Casilla marcada y deshabilitada"
    ),

    createElement(
        "ul",
        null,
        ["Elementos", "Texto", "Eventos"].map((text) =>
            createElement("li", { key: text }, text)
        )
    )
);

const container = document.getElementById("app");

render(app, container);