import debugModule from "debug";
const debug = new debugModule("ph:controller");

import { CONFIG, TRANSITION, STATE } from "./config";
import { Parser } from "./nmea0183/parser";
import { Utils } from "./utils";

export class Controller {

    #parser = new Parser();
    #QTMVERNO = "";
    #state = STATE.disconnected; // STATE.base; // STATE.rover;
    #state_prev;

    #wakeLock = null;

    /**
     *
     */
    constructor() {

        //
        // process NMEA
        //
        globalThis._my_.events.addEventListener(CONFIG.EV_NMEA, (ev) => {

            const lineNMEA = ev.detail;

            let res;
            try {
                // debug(lineNMEA);
                res = this.#parser.parse(lineNMEA.trim());
            } catch (err) {
                // PAIR021 This is a startup message which contains the chipset information.
                // $PAIR021,AG3335M_V2.5.0.AG3335.QT_V1_20230213,D,N,3ca042c,2210201143,2b6,0,2b6,0,cd539df,2210201143,2ed7531,2210201143,,,,,-15.48,-15.48,-14.02,-15.48,0,1,#P,0,0*35
                debug(`NMEA parsing error: ${lineNMEA}`);
            }

            // debug(res);

            if (res && res.sentenceId) {

                // every NMEA function should return result field
                if ((res?.result === null) || (res?.result === undefined))
                    throw Error(`Sentence ${res.sentenceId} is missing res.result`);

                switch (res.sentenceId) {
                    // update version info
                    case "QTMVERNO":
                        if (res.result === "OK") {
                            this.#QTMVERNO = res;
                            this.transition(TRANSITION.check_version);
                        } else {
                            this.transition(TRANSITION.error, "QTMVERNO");
                        }
                        break;
                    case "QTMSVINSTATUS":
                        // update UI header for survey status
                        globalThis._my_.uiHeader.updateSurvey(res.__valid);
                        break;
                    case "GGA":
                        // save position and RTK status
                        globalThis._my_.uiPaneFile.saveGGA(res);
                        // update UI header RTK fix status
                        globalThis._my_.uiHeader.updateRtk(res.__fixType);
                        break;
                    case "QTMDOP":
                        // save DOP
                        globalThis._my_.uiPaneFile.saveDOP(res);
                        break;
                }

                if (res.result === "OK") {
                    if (!globalThis._my_.uiPaneNmea.log(res))
                        // if not rendered send it to debug
                        debug(JSON.stringify(res));

                } else {
                    // only log this - we don't have to be so strict here
                    debug(`error parsing ${res.sentenceId}`);
                }

                // update satellite number on rover page
                // if ((res.sentenceId === "GGA") && (res.result === "OK")) {
                // globalThis._my_.ui_rover.setSatellites(res.satellitesInView);
                // }
            }
        });

        //
        // process RTCM, only for server
        //
        globalThis._my_.events.addEventListener(CONFIG.EV_RTCM3, (ev) => {
            const msgRTCM = ev.detail;

            // if connected send it to client
            if (globalThis._my_.p2p.isConnected()) {
                // encode as ArrayBuffer

                const rtcmType = new ArrayBuffer(2);
                const viewType = new Uint16Array(rtcmType);
                viewType[0] = msgRTCM.type;
                globalThis._my_.p2p.sendRTCM(Utils.concatArray(rtcmType, msgRTCM.array));
            }

            // log RTCM with source description
            globalThis._my_.uiPaneRtcm.log(msgRTCM);
        });

        //
        // listen for serial port state change
        //
        globalThis._my_.events.addEventListener(CONFIG.EV_DEVICE_STATE, (ev) => {
            switch (ev.detail) {
                case CONFIG.DEVICE_STATE_CONNECTED:
                    // setTimeout(() => this.transition(TRANSITION.connected), 100);
                    this.transition(TRANSITION.connected);
                    break;
                case CONFIG.DEVICE_STATE_DISCONNECTED:
                    this.transition(TRANSITION.disconnected);
                    break;
            }
        });

        //
        // listen for state change
        //
        globalThis._my_.events.addEventListener(CONFIG.STATE, (ev) => {
            const state = ev.detail;
            let str;
            switch (state) {
                case STATE.connected:
                    str = this.#parser.encode({ sentenceId: "QTMVERNO" });
                    globalThis._my_.device.write(str);
                    globalThis._my_.uiPaneLog.log("module <strong>connected</strong>");
                    break;
                case STATE.check_version:
                    globalThis._my_.uiPaneLog.log(`module version: <strong>${this.#QTMVERNO.verStr}</strong>`);
                    if (this.isBase()) {
                        this.transition(TRANSITION.base);
                    } else if (this.isRover()) {
                        this.transition(TRANSITION.rover);
                    }
                    break;
                case STATE.rover:
                    globalThis._my_.uiPaneLog.log("module detected as <strong>rover</strong>");
                    globalThis._my_.controller.requestWakeLock();
                    break;
                case STATE.base:
                    globalThis._my_.uiPaneLog.log("module detected as <strong>base</strong>");
                    globalThis._my_.controller.requestWakeLock();
                    break;
                case STATE.base_config:
                    this.sendBaseConfig();
                    this.transition(TRANSITION.base);
                    break;
                case STATE.rover_config:
                    this.sendRoverConfig();
                    this.transition(TRANSITION.rover);
                    break;
                case STATE.disconnected:
                    globalThis._my_.uiPaneLog.log("module <strong>disconnected</strong>");
                    globalThis._my_.controller.releaseWakeLock();
                    break;
                default:
                    break;
            }
        });
    }

    /**
     * here just FSM logic, nothing else
     * @param {*} event
     */
    transition(event, options) {
        debug(`transition event: ${event}, state: ${this.#state}`);
        switch (this.#state) {
            case STATE.disconnected:
                if (event === TRANSITION.connected) {
                    this.#state = STATE.connected;
                }
                break;
            case STATE.connected:
                if (event === TRANSITION.check_version) {
                    this.#state = STATE.check_version;
                }
                break;
            case STATE.check_version:
                if (event === TRANSITION.rover) {
                    // rover
                    this.#state = STATE.rover;
                } else if (event === TRANSITION.base) {
                    // base
                    this.#state = STATE.base;
                }
                break;
            case STATE.rover:
                if (event === TRANSITION.rover_config) {
                    // send rover config
                    this.#state = STATE.rover_config;
                }
                break;
            case STATE.base:
                if (event === TRANSITION.base_config) {
                    // send base config
                    this.#state = STATE.base_config;
                }
                break;
            case STATE.base_config:
                if (event === TRANSITION.base) {
                    // back to base
                    this.#state = STATE.base;
                }
                break;
            case STATE.rover_config:
                if (event === TRANSITION.rover) {
                    // back to rover
                    this.#state = STATE.rover;
                }
                break;

            default:
                throw Error(`Unknown state: ${this.#state}`);
        }

        // disconnected
        if (event === TRANSITION.disconnected) {
            this.#state = STATE.disconnected;
        }

        // error
        if (event === TRANSITION.error) {
            // for the moment dead end
            debug(`error ${options}`);
            this.#state = STATE.error;
        }

        // detect state change and send event when state changed
        if (this.#state_prev !== this.#state) {
            // run state change async
            setTimeout(() => globalThis._my_.dispatchEvent(CONFIG.STATE, this.#state), 0);
            this.#state_prev = this.#state;
            debug(`transition state: ${this.#state}`);
        }
    }

    //////////////////////////////////////////////////////////////////////////

    /**
     *
     * @returns {boolean}
     */
    isBase() {
        return this.#QTMVERNO.verStr?.startsWith("LC29HBS");
    }

    /**
     *
     * @returns {boolean}
     */
    isRover() {
        return this.#QTMVERNO.verStr?.startsWith("LC29HDA");
    }

    /**
     *
     */
    async sendBaseConfig() {
        // 1. send survey config
        const selTime = document.getElementById("selSurveyTime");
        const seconds = parseInt(selTime.selectedOptions[0].dataset.seconds);

        const selAccLimit = document.getElementById("selSurveyAccuracy");
        const accLimit = parseFloat(selAccLimit.selectedOptions[0].dataset.accuracy);

        let str = this.#parser.encode({
            sentenceId: "QTMCFGSVIN",
            rw: "W",
            mode: 1,
            minDur: seconds,
            accLimit3d: accLimit
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        str = this.#parser.encode({
            sentenceId: "QTMCFGSVIN",
            rw: "R",
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        // 2. PQTMCFGMSGRATE
        // - PQTMEPE - Outputs the estimated positioning error
        str = this.#parser.encode({
            sentenceId: "QTMCFGMSGRATE",
            rw: "W",
            msgName: "PQTMEPE",
            rate: 1,
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        str = this.#parser.encode({
            sentenceId: "QTMCFGMSGRATE",
            rw: "R",
            msgName: "PQTMEPE",
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        // 3. PQTMCFGMSGRATE
        // - PQTMSVINSTATUS - Outputs the survey-in feature status
        str = this.#parser.encode({
            sentenceId: "QTMCFGMSGRATE",
            rw: "W",
            msgName: "PQTMSVINSTATUS",
            rate: 1,
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        str = this.#parser.encode({
            sentenceId: "QTMCFGMSGRATE",
            rw: "R",
            msgName: "PQTMSVINSTATUS",
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        // 4. Set PAIR_RTCM_SET_OUTPUT_MODE to RTCM-3 MSM7
        // Whereas MSM6 and MSM7 are high precision messages, containing the same fields
        // as MSM4 and MSM5 representatively, but with a higher resolution.
        str = this.#parser.encode({
            sentenceId: "AIR432",
            rw: "W",
            mode: 1,
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        str = this.#parser.encode({
            sentenceId: "AIR433",
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        // 5. Save it
        str = this.#parser.encode({
            sentenceId: "QTMSAVEPAR",
        });
        globalThis._my_.device.write(str);

        globalThis._my_.uiPaneLog.log(`send <strong>config</strong> MinDur=${seconds}sec`);
        globalThis._my_.uiPaneLog.log(`send <strong>config</strong> 3D_AccLimit=${accLimit}m\n`);
    }

    /**
     *
     */
    async sendRoverConfig() {

        // $PQTMCFGRCVRMODE,W,<1 = Rover>*<Checksum><CR><LF>
        // Configures the receiver working mode.
        globalThis._my_.device.write("$PQTMCFGRCVRMODE,W,1*2A\r\n");
        await Utils.later(50);

        // GGA, GLL, GSA, GSV, RMC and VTG messages are output by default.
        // disable VTG
        // Course Over Ground & Ground Speed. The actual course and speed relative to the ground.
        globalThis._my_.device.write("$PAIR062,5,0*3B\r\n");
        await Utils.later(50);
        // disable RMC
        // Recommended Minimum Specific GNSS Data
        globalThis._my_.device.write("$PAIR062,4,0*3A\r\n");
        await Utils.later(50);

        // Packet Type: 400 PAIR_DGPS_SET_MODE
        // Sets the DGPS correction data source.
        // $PAIR400,<Mode>*<Checksum><CR><LF>
        // This command is not supported on LC29H (BA, CA, DA, EA)
        // globalThis._my_.device.write("$PAIR400,1*23\r\n");
        // await Utils.later(50);

        // PQTMCFGMSGRATE
        // - PQTMDOP - Outputs dilution of precision.
        let str = this.#parser.encode({
            sentenceId: "QTMCFGMSGRATE",
            rw: "W",
            msgName: "PQTMDOP",
            rate: 1,
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        str = this.#parser.encode({
            sentenceId: "QTMCFGMSGRATE",
            rw: "R",
            msgName: "PQTMDOP",
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        // QTMCFGNMEADP - Sets/gets the decimal places of NMEA messages
        str = this.#parser.encode({
            sentenceId: "QTMCFGNMEADP",
            rw: "W",
            UTC_DP: 1, // number of decimal places for UTC seconds 
            POS_DP: 8, // number of decimal places for latitude and longitude
            ALT_DP: 3, // number of decimal places for altitude and geoidal separation
            DOP_DP: 2, // number of decimal places for DOP
            SPD_DP: 1, // number of decimal places for speed
            COG_DP: 1  // number of decimal places for COG
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        str = this.#parser.encode({
            sentenceId: "QTMCFGNMEADP",
            rw: "R",
        });
        globalThis._my_.device.write(str);
        await Utils.later(50);

        // Save it
        str = this.#parser.encode({
            sentenceId: "QTMSAVEPAR",
        });
        globalThis._my_.device.write(str);

        globalThis._my_.uiPaneLog.log("send <strong>config</strong>");
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API 
     */
    async requestWakeLock() {

        // if lock acquired before
        if (this.#wakeLock?.released === false) return;

        try {
            this.#wakeLock = await navigator.wakeLock.request("screen");
        } catch (err) {
            // the wake lock request fails - usually system related, such being low on battery
            globalThis._my_.uiPaneLog.log(`${err.name}, ${err.message}`);
            debug(`${err.name}, ${err.message}`);
        }
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
     */
    async releaseWakeLock() {
        if (this.#wakeLock !== null) {
            await this.#wakeLock.release();
            this.#wakeLock = null;
        }
    }
}