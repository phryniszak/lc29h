import debugModule from "debug";
const debug = new debugModule("ph:uiPaneNmea");
import { UiPane } from "./ui_pane";
import { jsonViewer } from "../../json-view/json-view";

export class UiPaneNmea extends UiPane {
    #jsonViewEl;

    #prev_nmea;

    #arrGSA = [];
    #arrGSV = [];

    constructor() {
        super("pane-nmea");

        // get element where we create json view
        this.#jsonViewEl = this.el.querySelector(".json-top");

        // const nmea = JSON.parse("{\"sentenceId\":\"GSV GPS\",\"talkerId\":\"GP\",\"sentenceName\":\"Satellites in view\",\"numberOfMessages\":3,\"messageNumber\":1,\"satellitesInView\":9,\"satellites\":[{\"prnNumber\":2,\"elevationDegrees\":74,\"azimuthTrue\":89,\"SNRdB\":14},{\"prnNumber\":3,\"elevationDegrees\":58,\"azimuthTrue\":210,\"SNRdB\":29},{\"prnNumber\":4,\"elevationDegrees\":0,\"azimuthTrue\":0,\"SNRdB\":20},{\"prnNumber\":17,\"elevationDegrees\":0,\"azimuthTrue\":0,\"SNRdB\":13},{\"prnNumber\":19,\"elevationDegrees\":0,\"azimuthTrue\":0,\"SNRdB\":15},{\"prnNumber\":21,\"elevationDegrees\":56,\"azimuthTrue\":96,\"SNRdB\":19},{\"prnNumber\":22,\"elevationDegrees\":0,\"azimuthTrue\":0,\"SNRdB\":14},{\"prnNumber\":32,\"elevationDegrees\":25,\"azimuthTrue\":47,\"SNRdB\":22},{\"prnNumber\":49,\"elevationDegrees\":16,\"azimuthTrue\":123,\"SNRdB\":33},{\"prnNumber\":3,\"elevationDegrees\":58,\"azimuthTrue\":210,\"SNRdB\":32},{\"prnNumber\":14,\"elevationDegrees\":0,\"azimuthTrue\":0,\"SNRdB\":18},{\"prnNumber\":32,\"elevationDegrees\":25,\"azimuthTrue\":47,\"SNRdB\":27}],\"signalID\":1}");
        // this.render(nmea);
    }

    /**
     *
     * @param {*} nmea
     */
    render(nmea) {

        // check if we have already the same
        const elements = Array.from(this.#jsonViewEl.querySelectorAll(".json-top > div > label > .json__key"));
        const element = elements.find(el => el.innerText === nmea.sentenceId);

        // append dom if we don't have this sentenceId
        if (element) {
            this.updateJsonView(nmea, element.parentElement);
        } else {
            // display slightly modified nmea object to show sentenceId on the top
            const sentenceId = nmea.sentenceId;
            if (nmea.sentenceId) delete nmea.sentenceId;
            const nmea_ex = { [sentenceId]: nmea };
            this.#jsonViewEl.insertAdjacentHTML("beforeEnd", jsonViewer(nmea_ex));
        }
    }

    /**
     * 
     * @param {*} nmea 
     * @param {*} element 
     */
    updateJsonView(nmea, element) {

        const keys = Object.keys(nmea);
        const elements = Array.from(element.children);

        keys.forEach(key => {
            switch (key) {
                case "sentenceId":
                    break;

                default:
                    // try to find matching element
                    var el = elements.find(el => el.firstElementChild?.innerText === key);
                    if (el) {
                        var value = nmea[key];
                        if (value instanceof Date)
                            el.lastElementChild.innerText = value.toLocaleString();
                        else
                            el.lastElementChild.innerText = value;

                    } else {
                        // in case of array or object dig down little bit more
                        if (!this.updateJsonViewCollapsible(nmea, element, key)) {
                            debug(`updateJsonView: no matching element for key=${key}`);
                        }
                    }
                    break;
            }
        });
    }

    /**
     * 
     * @param {*} nmea 
     * @param {*} element 
     * @param {*} key 
     * @returns 
     */
    updateJsonViewCollapsible(nmea, element, key) {

        const sub_nmea = nmea[key];
        const elements = Array.from(element.children);

        // try to find matching element, this time not a first child element but second
        const el = elements.find(el =>
            el.children[1]?.innerText === key
        );

        // key not found - return
        if (el === undefined) return false;

        // if passed sub_nmea is array and DOM element is also array placement
        if ((key === "satellites") && Array.isArray(sub_nmea) && el.children[2].classList.contains("json__value--type-Array")) {
            // it should be always true
            el.children[2].innerText = `[${[sub_nmea.length]}]`;

            if (nmea.sentenceId.startsWith("GSV")) {
                // GSV
                this.updateJsonViewCollapsibleGSV(sub_nmea, el);
                return true;
            } else if (nmea.sentenceId.startsWith("GSA")) {
                // GSA
                this.updateJsonViewCollapsibleGSA(sub_nmea, el);
                return true;
            }
        }

        debug(`updateJsonViewCollapsible doesn't know how to resolve key=${key}`);
        return false;
    }

    /**
     * 
     * @param {*} sub_nmea 
     * @param {*} el_gsa 
     */
    updateJsonViewCollapsibleGSA(sub_nmea, el_gsa) {

        let els = Array.from(el_gsa.querySelectorAll("div.json__item"));

        const template = "<div class=\"json__item\"><div class=\"json__key\">-</div> \
        <div class=\"json__value json__value--number\">-</div></div>";

        // if to many remove from DOM
        els.forEach((el, index) => {
            if (index < sub_nmea.length) return;
            el.remove();
        });

        // update els
        els = Array.from(el_gsa.querySelectorAll("div.json__item"));

        // not enough in DOM
        sub_nmea.forEach((val, index) => {
            if (index >= els.length)
                el_gsa.insertAdjacentHTML("beforeEnd", template);
        });

        // update els
        els = Array.from(el_gsa.querySelectorAll("div.json__item"));

        // update with values
        sub_nmea.forEach((val, index) => {
            els[index].firstElementChild.innerText = index;
            els[index].lastElementChild.innerText = val;
        });
    }

    /**
     * 
     * @param {*} sub_nmea 
     * @param {*} el_gsv 
     */
    updateJsonViewCollapsibleGSV(sub_nmea, el_gsv) {

        let els = Array.from(el_gsv.querySelectorAll("label.json__item--collapsible"));

        const template =
            "<label class=\"json__item json__item--collapsible\"><input type=\"checkbox\" class=\"json__toggle\"> \
        <div class=\"json__key\">-</div> \
        <div class=\"json__value json__value--type-object\"></div> \
        <div class=\"json__item\"> \
            <div class=\"json__key\">prnNumber</div> \
            <div class=\"json__value json__value--number\">-</div> \
        </div> \
        <div class=\"json__item\"> \
            <div class=\"json__key\">elevationDegrees</div> \
            <div class=\"json__value json__value--number\">-</div> \
        </div> \
        <div class=\"json__item\"> \
            <div class=\"json__key\">azimuthTrue</div> \
            <div class=\"json__value json__value--number\">-</div> \
        </div> \
        <div class=\"json__item\"> \
            <div class=\"json__key\">SNRdB</div> \
            <div class=\"json__value json__value--number\">-</div> \
        </div> \
        </label>";

        // if to many remove from DOM
        els.forEach((el, index) => {
            if (index < sub_nmea.length) return;
            el.remove();
        });

        // update els
        els = Array.from(el_gsv.querySelectorAll("label.json__item--collapsible"));

        // not enough in DOM
        sub_nmea.forEach((val, index) => {
            if (index >= els.length)
                el_gsv.insertAdjacentHTML("beforeEnd", template);
        });

        // update els
        els = Array.from(el_gsv.querySelectorAll("label.json__item--collapsible"));

        // update with values
        sub_nmea.forEach((val, index) => {
            els[index].querySelector("label>div.json__key").innerText = index;
            els[index].querySelectorAll("label>div.json__item").forEach(el =>
                el.lastElementChild.innerText = val[el.firstElementChild.innerText]
            );
        });

    }

    /**
     * 
     * @param {*} nmea 
     * @returns result - true if rendered
     */
    log(nmea) {

        // ignore some messages
        if (nmea.sentenceId == "QTMCFGMSGRATE") return false;
        if (nmea.sentenceId == "QTMSAVEPAR") return false;
        if ((nmea.sentenceId == "QTMCFGSVIN") && (nmea.mode == undefined))
            return false;
        // render only answer with all fields
        if ((nmea.sentenceId == "QTMCFGNMEADP") && (nmea.ALT_DP == undefined))
            return false;

        // remove keys starting with "__"
        for (const key in nmea) {
            if (key.startsWith("__")) delete nmea[key];
        }

        let render = true;

        // remove not needed parts
        if (nmea.chxOk) delete nmea.chxOk;
        if (nmea.result) delete nmea.result;
        // talkerId - can be removed is needed below !!!
        // if (nmea.talkerId) delete nmea.talkerId;

        // some need to be combined together and process separately
        if (this.processGSA(nmea)) render = false;
        if (this.processGSV(nmea)) render = false;

        if (render) {
            this.render(nmea);
        }

        // save previous nmea
        this.#prev_nmea = nmea;

        return true;
    }

    /**
     *
     * @param {*} nmea
     * @returns
     */
    processGSA(nmea) {

        if (this.#prev_nmea === undefined) return false;

        const start = (nmea.sentenceId === "GSA") && (this.#prev_nmea.sentenceId !== "GSA");
        const stop = (nmea.sentenceId !== "GSA") && (this.#prev_nmea.sentenceId === "GSA");

        if (start) {
            // debug("start GSA");
            this.#arrGSA.length = 0;
        }

        if (nmea.sentenceId === "GSA") {
            this.#arrGSA.push(nmea);
            // don't render this
            return true;
        }

        let gsa_GPS, gsa_GLONASS, gsa_Galileo, gsa_BDS, gsa_QZSS;

        if (stop) {
            // debug("stop GSA");

            // GSA finished - now process

            this.#arrGSA.forEach((gsa_nmea) => {
                switch (gsa_nmea.SystemID) {
                    case 1:
                        gsa_nmea.sentenceId = "GSA GPS";
                        if (gsa_GPS === undefined)
                            gsa_GPS = gsa_nmea;
                        else
                            gsa_GPS.satellites = gsa_GPS.satellites.concat(gsa_nmea.satellites);
                        break;
                    case 2:
                        gsa_nmea.sentenceId = "GSA GLONASS";
                        if (gsa_GLONASS === undefined)
                            gsa_GLONASS = gsa_nmea;
                        else
                            gsa_GLONASS.satellites = gsa_GLONASS.satellites.concat(gsa_nmea.satellites);
                        break;
                    case 3:
                        gsa_nmea.sentenceId = "GSA Galileo";
                        if (gsa_Galileo === undefined)
                            gsa_Galileo = gsa_nmea;
                        else
                            gsa_Galileo.satellites = gsa_Galileo.satellites.concat(gsa_nmea.satellites);
                        break;
                    case 4:
                        gsa_nmea.sentenceId = "GSA BDS";
                        if (gsa_BDS === undefined)
                            gsa_BDS = gsa_nmea;
                        else
                            gsa_BDS.satellites = gsa_BDS.satellites.concat(gsa_nmea.satellites);
                        break;
                    case 5:
                        gsa_nmea.sentenceId = "GSA QZSS";
                        if (gsa_QZSS === undefined)
                            gsa_QZSS = gsa_nmea;
                        else
                            gsa_QZSS.satellites = gsa_QZSS.satellites.concat(gsa_nmea.satellites);
                        break;
                    default:
                        throw Error(`not know SystemID: ${gsa_nmea.SystemID} `);
                }
            });

            // now render if has satellites
            if (gsa_GPS?.satellites.length) this.render(gsa_GPS);
            if (gsa_GLONASS?.satellites.length) this.render(gsa_GLONASS);
            if (gsa_Galileo?.satellites.length) this.render(gsa_Galileo);
            if (gsa_BDS?.satellites.length) this.render(gsa_BDS);
            if (gsa_QZSS?.satellites.length) this.render(gsa_QZSS);
        }

        return false;
    }

    /**
     *
     * @param {*} nmea
     */
    processGSV(nmea) {

        if (this.#prev_nmea === undefined) return false;

        const start = (nmea.sentenceId === "GSV") && (this.#prev_nmea.sentenceId !== "GSV");
        const stop = (nmea.sentenceId !== "GSV") && (this.#prev_nmea.sentenceId === "GSV");

        if (start) {
            // debug("start GSV");
            this.#arrGSV.length = 0;
        }

        if (nmea.sentenceId === "GSV") {
            this.#arrGSV.push(nmea);
            // don't render this
            return true;
        }

        let gsv_GPS, gsv_GLONASS, gsv_Galileo, gsv_BDS, gsv_QZSS, gsv_GN;

        if (stop) {
            // debug("stop GSV");

            // GSV finished - now process
            this.#arrGSV.forEach((gsv_nmea) => {
                switch (gsv_nmea.talkerId) {
                    case "GP":
                        gsv_nmea.sentenceId = "GSV GPS";
                        if (gsv_GPS === undefined)
                            gsv_GPS = gsv_nmea;
                        else
                            gsv_GPS.satellites = gsv_GPS.satellites.concat(gsv_nmea.satellites);
                        break;
                    case "GL":
                        gsv_nmea.sentenceId = "GSV GLONASS";
                        if (gsv_GLONASS === undefined)
                            gsv_GLONASS = gsv_nmea;
                        else
                            gsv_GLONASS.satellites = gsv_GLONASS.satellites.concat(gsv_nmea.satellites);
                        break;
                    case "GA":
                        gsv_nmea.sentenceId = "GSV Galileo";
                        if (gsv_Galileo === undefined)
                            gsv_Galileo = gsv_nmea;
                        else
                            gsv_Galileo.satellites = gsv_Galileo.satellites.concat(gsv_nmea.satellites);
                        break;
                    case "GB":
                        gsv_nmea.sentenceId = "GSV BDS";
                        if (gsv_BDS === undefined)
                            gsv_BDS = gsv_nmea;
                        else
                            gsv_BDS.satellites = gsv_BDS.satellites.concat(gsv_nmea.satellites);
                        break;
                    case "GQ":
                        gsv_nmea.sentenceId = "GSV QZSS";
                        if (gsv_QZSS === undefined)
                            gsv_QZSS = gsv_nmea;
                        else
                            gsv_QZSS.satellites = gsv_QZSS.satellites.concat(gsv_nmea.satellites);
                        break;
                    case "GN":
                        gsv_nmea.sentenceId = "GSV Combined";
                        if (gsv_GN === undefined)
                            gsv_GN = gsv_nmea;
                        else
                            gsv_GN.satellites = gsv_GN.satellites.concat(gsv_nmea.satellites);
                        break;
                    default:
                        throw Error(`not know talkerID: ${gsv_nmea.talkerId} `);
                }
            });

            // now render if has satellites
            if (gsv_GPS?.satellites.length) this.render(gsv_GPS);
            if (gsv_GLONASS?.satellites.length) this.render(gsv_GLONASS);
            if (gsv_Galileo?.satellites.length) this.render(gsv_Galileo);
            if (gsv_BDS?.satellites.length) this.render(gsv_BDS);
            if (gsv_QZSS?.satellites.length) this.render(gsv_QZSS);
            if (gsv_GN?.satellites.length) this.render(gsv_GN);
        }

        return false;
    }

    /**
     *
     * @param {*} signalID
     * @param {*} talkerID
     */
    signalID(signalID, talkerID) {
        if ((talkerID === "GP") && (signalID === 1)) return "L1 C/A";
        if ((talkerID === "GP") && (signalID === 8)) return "L5";
        if ((talkerID === "GL") && (signalID === 1)) return "L1";
        if ((talkerID === "GA") && (signalID === 1)) return "E5a";
        if ((talkerID === "GA") && (signalID === 7)) return "E1";
        if ((talkerID === "GB") && (signalID === 1)) return "B1I";
        if ((talkerID === "GB") && (signalID === 5)) return "B2a";
        if ((talkerID === "GQ") && (signalID === 1)) return "L1 C/A";
        if ((talkerID === "GQ") && (signalID === 5)) return "L5";
        debug(`talkerId unknown combination signalID: ${signalID} and talkerID: ${talkerID}`);
    }
}
