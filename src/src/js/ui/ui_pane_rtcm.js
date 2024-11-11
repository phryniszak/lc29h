import { UiPane } from "./ui_pane";
// import "../../css/pane-rtcm.scss";
import { CONFIG } from "../config";

export class UiPaneRtcm extends UiPane {

    #table;

    constructor() {
        super("pane-rtcm");
        this.#table = this.el.querySelector("table > tbody");
        globalThis._my_.events.addEventListener(CONFIG.EV_TICK, this.remove_expired);
    }

    /**
     * 
     * @param {*} msgRTCM 
     */
    log(msgRTCM, source = "local") {
        //
        const els = Array.from(globalThis._my_.uiPaneRtcm.#table.children);
        const el = els.find(el => +el.firstChild.innerText === msgRTCM.type);

        if (el) {
            // if found only update
            // byteLength is valid for Uint8Array and ArrayBuffer
            el.children[1].innerText = msgRTCM.array.byteLength;
            el.dataset.ttl = Date.now();
        } else {
            this.#table.insertAdjacentHTML("beforeend",
                `<tr><td>${msgRTCM.type}</td><td>${msgRTCM.array.length}</td><td>${source}</td></tr>`);
            // we need to track expiry time
            this.#table.lastElementChild.dataset.ttl = Date.now();
        }
    }

    /**
     * 
     */
    remove_expired() {
        const now = Date.now();
        const els = Array.from(globalThis._my_.uiPaneRtcm.#table.children);
        els.forEach(el => {
            if ((now - el.dataset.ttl) > 2000) el.remove();
        });
    }
}
