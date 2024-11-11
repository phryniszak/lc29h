import { joinRoom } from "trystero/torrent";
import debugModule from "debug";
import { CONFIG, STATE } from "./config.js";
import { Utils } from "./utils.js";
const debug = new debugModule("ph:p2p_connection");

export class P2P_connection {

    #room;
    #appId;
    #role = "";

    constructor(appId) {

        this.#appId = appId;

        globalThis._my_.events.addEventListener(CONFIG.STATE, (ev) => {
            const state = ev.detail;
            switch (state) {
                case STATE.base:
                    this.startBase();
                    break;
                case STATE.rover:
                    this.startRover();
                    break;
            }
        });
    }

    /**
     * return number of peers in room
     * @returns
     */
    isConnected() {

        if (!this.#room) return 0;

        const count = Object.keys(this.#room.getPeers()).length;
        return count;
    }

    /**
     * Rover connects to self declared namespace
     * @returns
     */
    getBaseNamespace() {
        if (typeof sessionStorage?.id !== "string") {
            sessionStorage.id = Utils.generateUUID();
        }
        return sessionStorage.id;
    }

    /**
     * Base connects to passed namespace by URL search parameters
     */
    getRoverNamespace() {
        const base_namespace = (new URLSearchParams(window.location.search)).get("base");
        if (base_namespace == null) {
            // throw new Error("missing URL base parameter");
            debug("missing URL base parameter");
            return "";
        }
        return base_namespace;
    }

    /**
     * https://stackoverflow.com/questions/74545334/urlsearchparams-not-updating-the-url
     * @param {*} namespace
     */
    setRoverNamespace(namespace) {
        let url = new URL(window.location.href);
        if (!(url.searchParams.has("base"))) {
            url.searchParams.append("base", namespace);
        } else {
            url.searchParams.set("base", namespace);
        }

        history.pushState({}, "", url.href);

        // not fully implemented
        // TODO: reconnect with new parameters
    }

    /**
     * 
     * @returns 
     */
    startBase() {
        // some cleaning if we were connected before
        if (this.isBase()) return;
        if (this.isRover()) { 
            this.#room?.leave(); 
            this.#room = null;
        }
        this.#role = "";

        const namespace = this.getBaseNamespace();
        if ((namespace == null) || namespace == "") {
            globalThis._my_.uiPaneLog.log("P2P missing base id");
            return;
        }

        debug(`base connecting ${this.#appId} ${namespace}`);
        this.#room = joinRoom({ appId: this.#appId }, namespace);
        this.#role = "base";
        this.setupRoom();
        debug("base connected to room");
    }

    /**
     * 
     * @returns 
     */
    startRover() {
        // some cleaning if we were connected before
        if (this.isRover()) return;
        if (this.isBase()) { 
            this.#room?.leave(); 
            this.#room = null;
        }
        this.#role = "";

        const namespace = this.getRoverNamespace();
        if ((namespace == null) || namespace == "") {
            globalThis._my_.uiPaneLog.log("P2P missing base id");
            return;
        }

        debug(`rover connecting ${this.#appId} ${namespace}`);
        this.#room = joinRoom({ appId: this.#appId }, namespace);
        this.#role = "rover";
        this.setupRoom();
        debug("rover connected to room");
    }

    setupRoom() {
        this.#room.onPeerJoin(peerId => {
            debug(`${peerId} joined`);
            globalThis._my_.uiPaneLog.log(`P2P <strong>${peerId}</strong> joined`);
        });
        this.#room.onPeerLeave(peerId => {
            globalThis._my_.uiPaneLog.log(`P2P <strong>${peerId}</strong> left`);
            debug(`${peerId} left`);
        });
        const [sendRTCM, getRTCM] = this.#room.makeAction("rtcm");
        this.sendRTCM = sendRTCM;
        getRTCM((data) => {
            const rtcm = { array: data.slice(2), type: (data[1] << 8) + data[0] };
            // send RTCM correction to rover
            if (globalThis._my_.device.isConnected())
                globalThis._my_.device.write(rtcm.array);

            globalThis._my_.uiPaneRtcm.log(rtcm, "remote");
        });
    }

    isBase() {
        return this.#role == "base";
    }

    isRover() {
        return this.#role == "rover";
    }
}


