import debugModule from "debug";
const debug = new debugModule("ph:uiPaneFile");
import { UiPane } from "./ui_pane";
import { CONFIG } from "../config";
import { Utils } from "../utils";
import { fileSave } from "browser-fs-access";

// opfs file system: https://web.dev/articles/origin-private-file-system
// https://vitejs.dev/guide/features.html#web-workers
// _my_.file_worker = new Worker(
//     new URL("./file_worker", import.meta.url),
//     { type: "module" }
// );

import FileWorker from "../worker.js?worker";

const POS_JSON_FILE = "pos.json";
const NMEA_FILE = "pos.nmea";

export class UiPaneFile extends UiPane {

    #worker;
    #dir_id;
    #savePt = {};

    // #sensor;
    #fileList;

    constructor() {
        super("pane-file");

        this.#worker = new FileWorker();
        this.#dir_id = this.getDirId();

        // https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
        // if (navigator.storage && navigator.storage.persist) {
        //     navigator.storage.persisted().then((persistent) => {
        //         if (persistent) {
        //             debug("Storage will not be cleared except by explicit user action");
        //         } else {
        //             debug("Storage may be cleared by the UA under storage pressure.");
        //         }
        //     });
        // }

        this.#worker.onmessage = (e) => {
            // console.log(e.data);
            switch (e.data?.operation) {
                case "getDirList":
                    this.updateFileList(e.data.directories);
                    break;
                case "deleteAll":
                    // get list of dirs with saved results after delete
                    this.#worker.postMessage({ operation: "getDirList" });
                    break;
            }
        };

        this.setActiveCallback(() => {
            // get list of dirs with saved results
            this.#worker.postMessage({ operation: "getDirList" });
        });

        /**
         * 
         */
        this.el.querySelector("#btnSaveGPX").onclick = () => {
            this.exportFile(this.getSelectedDir(), "gpx");
        };

        /**
         * 
         */
        this.el.querySelector("#btnSaveNMEA").onclick = () => {
            this.exportFile(this.getSelectedDir(), "nmea");
        };

        // listen to nmea messages and save all in worker
        globalThis._my_.events.addEventListener(CONFIG.EV_NMEA, async (ev) => {
            const lineNMEA = ev.detail;
            this.#worker.postMessage({ operation: "write", file: NMEA_FILE, str: (lineNMEA + "\d\n"), dir: this.#dir_id });
        });

        // listen for request to save point
        globalThis._my_.events.addEventListener(CONFIG.EV_SAVE_PT, () => {
            this.#savePt.save_point = true;
            this.toutSavePoint();
            debug("set save_point");
        });

        // time out save point
        this.toutSavePoint = Utils.debounceEventOneArg(() => {
            // remove save point req
            this.#savePt.save_point = false;
            globalThis._my_.dispatchEvent(CONFIG.EV_SAVE_PT_DONE, this.#savePt);
            delete this.#savePt.save_point;
            debug("tout save_point");
        }, CONFIG.EV_TICK_INTERVAL * 1.2);

        /**
         * Delete all opfs files
         */
        this.btnConfirmFileDelete = this.el.querySelector("#btnConfirmFileDelete");
        this.btnConfirmFileDelete.onclick = () => {
            this.#worker.postMessage({ operation: "deleteAll" });
        };

        /**
        * Start new file
        */
        this.btnStartNewFile = this.el.querySelector("#btnStartNewFile");
        this.btnStartNewFile.onclick = () => {
            // force new dir
            this.#dir_id = this.getDirId(true);
            // get list of dirs with saved results
            this.#worker.postMessage({ operation: "getDirList" });

        };


        /**
         * File list
         */
        this.#fileList = this.el.querySelector("#filesList");

        /*
        const options = { frequency: 60, referenceFrame: "device" };
        // eslint-disable-next-line no-undef
        this.#sensor = new AbsoluteOrientationSensor(options);

        this.#sensor.addEventListener("reading", () => {
            console.log(this.#sensor.quaternion);
        });

        this.#sensor.addEventListener("error", (event) => {
            if (event.error.name === "NotReadableError") {
                debug("Sensor is not available.");
            }
        });
        this.#sensor.start();
        */

    }

    /**
     * 
     * @param {boolean} force 
     * @returns 
     */
    getDirId(force) {
        if ((typeof sessionStorage?.id_dir !== "string") || force) {
            // save dir coded as timestamp
            sessionStorage.id_dir = Date.now().toString(16); // Utils.generateUUID();
        }
        return sessionStorage.id_dir;
    }

    /**
     * 
     * @returns 
     */
    getSelectedDir() {
        const elements = Array.from(this.#fileList.children);
        let dir;
        elements.forEach((el) => {
            if (el.classList.contains("active") && el.dataset?.dir) {
                dir = el.dataset.dir;
            }
        });
        return dir;
    }

    /**
     *
     * @param {*} dirs
     */
    updateFileList(dirs) {
        const elements = Array.from(this.#fileList.children);
        elements.forEach((el, index) => {
            if (index < dirs.length) {
                el.innerText = (new Date(parseInt(dirs[index], 16))).toLocaleString();
                el.dataset.dir = dirs[index];
                if (dirs[index] == this.getDirId())
                    el.innerText += "  current";
            } else {
                el.innerText = "";
                delete el.dataset.dir;
            }
        });
    }

    /**
     *
     */
    async exportFile(dir, fileExt) {
        debug(`export file with extension ${fileExt} and dir ${dir}`);
        if ((dir === null) || (dir === undefined)) return;

        let fileHandle, file, options, fileBlob;
        const opfsRoot = await navigator.storage.getDirectory();
        const sessionDirHandle = await opfsRoot.getDirectoryHandle(dir, { create: false });

        switch (fileExt) {

            case "gpx":
                fileHandle = await sessionDirHandle.getFileHandle(POS_JSON_FILE);
                file = await fileHandle.getFile();
                options = {
                    fileName: "position.gpx",
                    extensions: [".gpx"],
                    startIn: "downloads",
                };
                await fileSave(this.file2gpx(await file.text()), options);
                break;
            case "nmea":
                options = {
                    fileName: "position.nmea",
                    extensions: [".nmea"],
                    startIn: "downloads",
                };
                fileHandle = await sessionDirHandle.getFileHandle(NMEA_FILE);
                file = await fileHandle.getFile();
                fileBlob = new Blob([await file.text()], { type: "text/plain" });
                await fileSave(fileBlob, options);
                break;
        }
    }

    //////////////////////////////////////////////////////////////////////

    /**
     *
     * @param {*} text
     * @param {*} writable
     * @returns
     */
    async file2gpx(text) {

        // GPX file header
        const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
            <gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="LC29H - https://github.com/phryniszak/lc29h">`;
        const gpxTrackStart = "<trk><name>Track</name><trkseg>";

        // GPX track points
        let gpxTrack = gpxTrackStart;
        let gpxWpt = "";
        let gpxWptCnt = 0;
        let pos;
        text.split("\n").forEach(str => {
            try {
                pos = JSON.parse(str);
                gpxTrack += `
                <trkpt lat="${pos.lati}" lon="${pos.long}">
                    <ele>${pos.alti}</ele>
                    <time>${(new Date(pos.time)).toISOString()}</time>
                    <fix>${this.getGPXfix(pos.fixG, pos.sate)}</fix>
                    <hdop>${pos.HDOP}</hdop>
                    <vdop>${pos.VDOP}</vdop>
                    <pdop>${pos.PDOP}</pdop>
                </trkpt>`;

                if (pos?.save_point == true) {
                    gpxWpt += `
                    <wpt lat="${pos.lati}" lon="${pos.long}">
                    <ele>${pos.alti}</ele>
                    <fix>${this.getGPXfix(pos.fixG, pos.sate)}</fix>
                    <name>Pt=${gpxWptCnt++}</name>
                    <hdop>${pos.HDOP}</hdop>
                    <vdop>${pos.VDOP}</vdop>
                    <pdop>${pos.PDOP}</pdop>
                    <sat>${pos.sate}</sat>
                    </wpt>`;
                }
            }
            catch (error) {
                debug(`${error.name} ${error.message}`);
            }
        });

        // GPX file footer
        const gpxTrackStop = "</trkseg></trk>";
        gpxTrack += gpxTrackStop;
        const gpxEnd = "</gpx>";

        // Combine all parts into a single GPX content
        const gpxContent = Utils.formatXML(gpxHeader + gpxWpt + gpxTrack + gpxEnd);

        // Create Blob from GPX content
        const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
        return blob;
    }

    /**
     *
     * @param {*} fix
     * @param {*} satellites
     * @returns
     */
    getGPXfix(fix, satellites) {

        // <xsd:enumeration value="none"/>
        // <xsd:enumeration value="2d"/>
        // <xsd:enumeration value="3d"/>
        // <xsd:enumeration value="dgps"/>
        // <xsd:enumeration value="pps"/>
        // https://josm.openstreetmap.de/ticket/20600

        switch (fix) {
            // 0 = Fix not available or invalid
            case 0: return "none";
            // 1 = GPS SPS Mode, fix valid
            case 1: if (satellites < 4) return "2d";
                return "3d";
            // 2 = Differential GPS, SPS Mode, or Satellite Based Augmentation. System (SBAS), fix valid
            case 2: return "dgps";
            // 3 = GPS PPS Mode, fix valid
            case 3: return "pps";
            // 4 = integer Real Time Kinematic (RTK)
            case 4: return "integer rtk";
            // 5 = float Real Time Kinematic (RTK)
            case 5: return "float rtk";
            // 6 = Estimated (dead reckoning) mode
            case 6: return "estimated";
        }
    }

    /**
     *
     * @param {*} nmeaObj
     */
    saveGGA(nmeaObj) {

        if (nmeaObj.result !== "OK") return;

        // https://support.marxact.com/article/111-what-is-dop-pdop-hdop-vdop-and-where-can-i-find-this-information
        // The complete calculation behind DOP values can be complex, but is in general:
        // when the DOP value is lower, the certainty that the position gives will be better.
        // As a rule of thumb, DOP values above 5 result in unacceptable positions
        // for DGNSS and RTK in case high accuracy is needed.
        // in our case it prevents saving not valid results (lat/lon == 0)
        if (this.#savePt?.PDOP < 5) {
            // save as JSON string in worker
            this.#worker.postMessage({
                operation: "write", file: POS_JSON_FILE,
                str: JSON.stringify(this.#savePt) + "\n",
                dir: this.#dir_id
            });
            // send point data
            globalThis._my_.dispatchEvent(CONFIG.EV_NEW_PT, this.#savePt);
            // and confirm request to save data
            if (this.#savePt.save_point) {
                globalThis._my_.dispatchEvent(CONFIG.EV_SAVE_PT_DONE, this.#savePt);
            }
        }

        // delete previous by creating new object
        this.#savePt = {};

        this.#savePt.time = nmeaObj.time.getTime();
        this.#savePt.lati = nmeaObj.latitude;
        this.#savePt.long = nmeaObj.longitude;
        this.#savePt.sate = nmeaObj.satellitesInView;
        this.#savePt.hord = nmeaObj.horizontalDilution;
        this.#savePt.alti = nmeaObj.altitudeMeters;
        this.#savePt.geoi = nmeaObj.geoidalSeparation;
        this.#savePt.fixG = nmeaObj.__fixType;
    }

    /**
     * Save DOP
     * @param {*} nmeaObj
     */
    saveDOP(nmeaObj) {
        if (nmeaObj.result !== "OK") return;
        this.#savePt.PDOP = nmeaObj.PDOP;
        this.#savePt.HDOP = nmeaObj.HDOP;
        this.#savePt.VDOP = nmeaObj.VDOP;
    }
}