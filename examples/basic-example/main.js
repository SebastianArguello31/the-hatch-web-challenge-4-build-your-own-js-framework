import { createElement, render } from "../../src/mini-framework.js";

const container = document.getElementById("app");

let count = 0;
let showDescription = true;
let useAlternativeTitle = false;
let nextTaskId = 3;

let tasks = [
    { id: 1, title: "Estudiar el Virtual DOM" },
    { id: 2, title: "Practicar eventos" }
];

function increment() {
    count += 1;
    updateView();
}

function toggleDescription() {
    showDescription = !showDescription;
    updateView();
}

function toggleTitleType() {
    useAlternativeTitle = !useAlternativeTitle;
    updateView();
}

function reverseTasks() {
    tasks = [...tasks].reverse();
    updateView();
}

function addTask() {
    const task = {
        id: nextTaskId,
        title: `Tarea de ejemplo ${nextTaskId}`
    };

    nextTaskId += 1;
    tasks = [...tasks, task];

    updateView();
}

function removeTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    updateView();
}

function createView() {
    return createElement(
        "main",
        { className: "app" },

        createElement(
            useAlternativeTitle ? "h2" : "h1",
            { id: "page-title" },
            "Actualización del Virtual DOM"
        ),

        createElement(
            "p",
            {
                id: "counter",
                title: count === 0 ? "Todavía no hubo clics" : null
            },
            "Clics: ",
            count
        ),

        createElement(
            "button",
            {
                id: "increment",
                type: "button",
                onClick: increment
            },
            "Incrementar"
        ),

        createElement(
            "button",
            {
                type: "button",
                onClick: toggleTitleType
            },
            "Cambiar etiqueta del título"
        ),

        createElement(
            "button",
            {
                type: "button",
                onClick: toggleDescription
            },
            showDescription ? "Ocultar descripción" : "Mostrar descripción"
        ),

        createElement(
            "section",
            { id: "description" },

            showDescription &&
                createElement(
                    "p",
                    null,
                    "Este párrafo puede insertarse y eliminarse."
                )
        ),

        createElement(
            "label",
            { htmlFor: "preserved-input" },
            "Escribe aquí y después incrementa el contador:"
        ),

        createElement("input", {
            id: "preserved-input",
            type: "text",
            placeholder: "El texto debe conservarse"
        }),

        createElement(
            "button",
            {
                type: "button",
                onClick: reverseTasks
            },
            "Invertir tareas"
        ),

        createElement(
            "button",
            {
                type: "button",
                onClick: addTask
            },
            "Añadir tarea de ejemplo"
        ),

        createElement(
            "ul",
            { id: "task-list" },

            tasks.map((task) =>
                createElement(
                    "li",
                    {
                        key: task.id,
                        "data-task-id": task.id
                    },

                    createElement("span", null, task.title),

                    createElement(
                        "button",
                        {
                            type: "button",
                            onClick: () => removeTask(task.id)
                        },
                        "Eliminar"
                    )
                )
            )
        )
    );
}

function updateView() {
    render(createView(), container);
}

updateView();