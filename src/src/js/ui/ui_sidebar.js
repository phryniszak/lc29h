import { Offcanvas } from "bootstrap";

export class UiSidebar {

    constructor() {
        // const nav = document.querySelector(".nav");
        // nav.addEventListener("show.bs.tab", ev =>
        //     console.log(ev));

        const el = document.getElementById("sidebar-el");
        el.onclick = (ev) => {
            if (ev.target instanceof HTMLButtonElement) {
                Offcanvas.getOrCreateInstance("#sidebar-el").hide();
            }
        };
    }
}