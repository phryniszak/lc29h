import { UiPane } from "./ui_pane";
import "../../css/pane-log.scss";

export class UiPaneLog extends UiPane {

    #logEl;

    constructor() {
        super("pane-log");
        this.#logEl = this.el.querySelector(".pane-log-div");
    }

    /**
     * 
     * @param {html, string} txt 
     */
    log(txt) {

        const date = new Date(); // replace this with your date object

        const formatter = new Intl.DateTimeFormat("en", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            // timeZone: "UTC" // adjust the time zone as needed
        });

        const formattedTime = formatter.format(date);

        this.#logEl.insertAdjacentHTML("beforeend", `<p>${formattedTime} ${txt}</p>`);
    }
}
