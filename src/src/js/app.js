console.log("start");

// INFO:
// Open connection:
// document.getElementById("btnOpenDevice").click()

// https://github.com/debug-js/debug#browser-support
// localStorage.debug = '*,-simple-peer'
import debugModule from "debug";
const debug = new debugModule("ph:app");

// Import our custom CSS
import "../styles.scss";

// Import all of Bootstrap's JS
// eslint-disable-next-line no-unused-vars
import * as bootstrap from "bootstrap";

import { CONFIG } from "./config";
import { Controller } from "./controller";
import { P2P_connection } from "./p2p_connection.js";

import { UiSidebar } from "./ui/ui_sidebar";
import { UiHeader } from "./ui/ui_header.js";
import { UiPaneGpsConn } from "./ui/ui_pane_gps_conn";
import { UiPaneP2pConn } from "./ui/ui_pane_p2p_conn.js";
import { UiPaneNmea } from "./ui/ui_pane_nmea";
import { UiPaneLog } from "./ui/ui_pane_log";
import { UiPaneRtcm } from "./ui/ui_pane_rtcm";
import { UiPaneFile } from "./ui/ui_pane_file.js";
import { UiPaneAbout } from "./ui/ui_pane_about.js";
import { UiPaneWpt } from "./ui/ui_pane_wpt.js";


// globals
const _my_ = {};
globalThis._my_ = _my_;

// we can lost it later ...
_my_.bootstrap = bootstrap;

// events - global point for all app events
_my_.events = new EventTarget();

// helper for dispatching events
_my_.dispatchEvent = (eventName, detail) => _my_.events.dispatchEvent(new CustomEvent(eventName, { detail: detail }));

// p2p connection between base and rovers
_my_.p2p = new P2P_connection("lc29h");

// controller
_my_.controller = new Controller();

// communication device
_my_.device = null;

//
_my_.uiSidebar = new UiSidebar();
_my_.uiHeader = new UiHeader();

_my_.uiPaneGpsConn = new UiPaneGpsConn();
_my_.uiPaneP2pConn = new UiPaneP2pConn();

_my_.uiPaneLog = new UiPaneLog();
_my_.uiPaneNmea = new UiPaneNmea();
_my_.uiPaneRtcm = new UiPaneRtcm();
_my_.uiPaneFile = new UiPaneFile();
_my_.uiPaneAbout = new UiPaneAbout();
_my_.uiPaneWpt = new UiPaneWpt();
// things below should be done in css...

// https://developer.mozilla.org/en-US/docs/Web/API/Document/readystatechange_event
window.addEventListener("load", () => {
    debug("ready to start");

    // run event async
    // setTimeout(() =>
    //     globalThis._my_.dispatchEvent(CONFIG.MESSAGE_INIT), 0);

    // show when loaded, avoid display shattering after js bundle loaded
    document.body.children[0].hidden = true;
    document.body.children[1].hidden = false;
    resize();
    checkWakeLock();
    checkWebUSB();
    checkWebSerial();
});

// app tick
_my_.interval_id = setInterval(() => _my_.dispatchEvent(CONFIG.EV_TICK), CONFIG.EV_TICK_INTERVAL);

// resize window
window.onresize = () => { resize(); };

// resize header
(new ResizeObserver(resize)).observe(document.getElementById("header-el"));

/**
 * adjust <main> height
 * I know it is little shabby
 */
function resize() {
    const main_el = document.getElementById("main-el");
    const header_el = document.getElementById("header-el");
    const height = window.innerHeight - header_el.getBoundingClientRect().height;

    // main element
    main_el.style.height = height + "px";
    // and waypoint pane, for map 
    // _my_.uiPaneWpt.el.style.height = height + "px";
}

/**
 *
 */
function checkWakeLock() {
    if ("wakeLock" in navigator) {
        // isSupported = true;
        // statusElem.textContent = ;
        _my_.uiPaneLog.log("Screen Wake Lock API <strong>supported</strong>");
    } else {
        // wakeButton.disabled = true;
        // statusElem.textContent = "Wake lock is not supported by this browser.";
        _my_.uiPaneLog.log("Screen Wake Lock API <strong>not supported</strong>");
    }
}

/**
 *
 */
function checkWebUSB() {
    if ("usb" in navigator) {
        _my_.uiPaneLog.log("USB API <strong>supported</strong>");
    } else {
        _my_.uiPaneLog.log("USB API <strong>not supported</strong>");
    }
}

/**
 *
 */
function checkWebSerial() {
    if ("serial" in navigator) {
        // isSupported = true;
        // statusElem.textContent = ;
        _my_.uiPaneLog.log("Web Serial API <strong>supported</strong>");
    } else {
        // wakeButton.disabled = true;
        // statusElem.textContent = "Wake lock is not supported by this browser.";
        _my_.uiPaneLog.log("Web Serial API <strong>not supported</strong>");
    }
}

// browser or tab closing
// window.addEventListener("beforeunload", () => { });