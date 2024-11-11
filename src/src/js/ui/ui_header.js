// import debugModule from "debug";
// const debug = new debugModule("ph:uiHeader");

import { CONFIG, STATE } from "../config";
import { Utils } from "../utils";

export class UiHeader {
    #rtkMode;
    #surveyMode;

    constructor() {
        this.el = document.getElementById("header-el");

        //
        // Update connection status
        //
        globalThis._my_.events.addEventListener(CONFIG.EV_TICK, () => {
            if (globalThis._my_.p2p.isConnected())
                this.ackConn();
        });

        this.ackConnTout = Utils.debounceEventOneArg(() =>
            this.el.querySelector("#ackCON").classList.remove("bg-success"), CONFIG.EV_TICK_INTERVAL * 1.2);

        // listen for module connection
        globalThis._my_.events.addEventListener(CONFIG.STATE, (ev) => {
            const state = ev.detail;
            switch (state) {
                case STATE.base:
                    this.el.querySelector("#ackGPS").classList.add("bg-success");
                    this.el.querySelector("#ackEXT").innerText = "SUR";
                    break;
                case STATE.rover:
                    this.el.querySelector("#ackGPS").classList.add("bg-success");
                    this.el.querySelector("#ackEXT").innerText = "RTK";
                    break;
                case STATE.disconnected:
                    this.el.querySelector("#ackGPS").classList.remove("bg-success");
                    this.el.querySelector("#ackEXT").innerText = "-----";
                    this.updateSurvey(1);
                    break;
            }
        });
    }

    /**
     * 
     */
    ackConn() {
        this.el.querySelector("#ackCON").classList.add("bg-success");
        this.ackConnTout();
    }

    /**
     * Survey-in position validity flag.
     * 0 = Invalid
     * 1 = In-progress
     * 2 = Valid
     */
    updateSurvey(valid) {
        if (this.#surveyMode !== valid)
            switch (valid) {
                case 0:
                    this.el.querySelector("#ackEXT").classList.remove("bg-success");
                    this.el.querySelector("#ackEXT").classList.add("bg-danger");
                    break;
                case 1:
                    this.el.querySelector("#ackEXT").classList.remove("bg-success");
                    this.el.querySelector("#ackEXT").classList.remove("bg-danger");
                    break;
                case 2:
                    this.el.querySelector("#ackEXT").classList.add("bg-success");
                    this.el.querySelector("#ackEXT").classList.remove("bg-danger");
                    break;
            }

        this.#surveyMode = valid;
    }

    /**
     * 
     * @param {*} mode 
     * 5 = Float RTK
     * 4 = integer RTK
     */
    updateRtk(mode) {
        if (this.#rtkMode !== mode)
            switch (mode) {
                case 4:
                    this.el.querySelector("#ackEXT").classList.remove("bg-success-subtle_my");
                    this.el.querySelector("#ackEXT").classList.add("bg-success");
                    break;
                case 5:
                    this.el.querySelector("#ackEXT").classList.remove("bg-success");
                    this.el.querySelector("#ackEXT").classList.add("bg-success-subtle_my");
                    break;
                default:
                    this.el.querySelector("#ackEXT").classList.remove("bg-success");
                    this.el.querySelector("#ackEXT").classList.remove("bg-success-subtle");
                    break;
            }

        this.#rtkMode = mode;
    }
}