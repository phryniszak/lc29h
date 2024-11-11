// import debugModule from "debug";
// const debug = new debugModule("ph:uiPaneP2pConn");
import { CONFIG, STATE } from "../config";
import { UiPane } from "./ui_pane";
import QRCode from "qrcode";

export class UiPaneP2pConn extends UiPane {

    constructor() {
        super("pane-p2p-connection");

        this.setActiveCallback(() => {
            // base
            this.el.querySelector("#inputID").value = globalThis._my_.p2p.getBaseNamespace();
            this.gen_QR_code(globalThis._my_.p2p.getBaseNamespace());

            // rover
            this.elClientInputID.value = globalThis._my_.p2p.getRoverNamespace();
        });

        // show/hide parts for base and rover p2p settings
        globalThis._my_.events.addEventListener(CONFIG.STATE, (ev) => {
            const state = ev.detail;
            switch (state) {
                case STATE.base:
                    this.el.querySelector("#pane-p2p-connection-base").hidden = false;
                    this.el.querySelector("#pane-p2p-connection-rover").hidden = true;
                    break;
                case STATE.rover:
                    this.el.querySelector("#pane-p2p-connection-base").hidden = true;
                    this.el.querySelector("#pane-p2p-connection-rover").hidden = false;
                    break;
            }
        });

        // if started with base id show base
        // if (globalThis._my_.connection?.server_id) {
        //     this.el.querySelector("#pane-p2p-connection-base").hidden = false;
        //     this.el.querySelector("#pane-p2p-connection-rover").hidden = true;
        // }

        // BASE ///////////////////////////////////////////////////////////////

        // btn copy server link
        this.elBtnServerCopyLink = document.getElementById("btnBaseCopyLink");
        this.elBtnServerCopyLink.onclick = () => {
            // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
            navigator.clipboard.writeText(this.getClientURL(globalThis._my_.p2p.getBaseNamespace())).then(
                () => { }, (error) => { console.error(error); },);
        };

        // btn copy server id
        this.elBtnServerCopyID = document.getElementById("btnBaseCopyID");
        this.elBtnServerCopyID.onclick = () => {
            // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
            navigator.clipboard.writeText(globalThis._my_.p2p.getBaseNamespace()).then(
                () => { }, (error) => { console.error(error); },);
        };

        // ROVER /////////////////////////////////////////////////////////////

        // base ID
        this.elClientInputID = document.getElementById("inputClientID");
        this.elClientInputID.addEventListener("change", () => {
            this.btnClientUpdateServerID.disabled = this.elClientInputID.value == globalThis._my_.p2p.getRoverNamespace();
        });

        // update base id
        this.btnClientUpdateServerID = document.getElementById("btnClientUpdateServerID");
        this.btnClientUpdateServerID.onclick = () => {
            globalThis._my_.p2p.setRoverNamespace(this.elClientInputID.value);
        };

    }

    /**
     *
     * @param {*} id
     */
    gen_QR_code(id) {
        QRCode.toCanvas(document.getElementById("elServerQR"),
            this.getClientURL(id),
            { errorCorrectionLevel: "L", scale: 6 }, function (error) {
                if (error) console.error(error);
            });
    }

    /**
     *
     */
    clear_QR_code() {
        const canvas = document.getElementById("elServerQR");
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    /**
     *
     * @param {*} id
     * @returns
     */
    getClientURL(id) {
        let url = window.location.href + "?base=" + id;
        return url;
    }
}
