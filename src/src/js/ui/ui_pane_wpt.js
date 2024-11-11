import { UiPane } from "./ui_pane";
import { CONFIG, STATE } from "../config";
import "../../css/pane-wpt.scss";

import Map from "ol/Map.js";
import OSM from "ol/source/OSM.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector";
import View from "ol/View.js";
import { Point } from "ol/geom";
import { Feature } from "ol";
import { fromLonLat } from "ol/proj.js";
import VectorSource from "ol/source/Vector";
import { Circle, Fill, Stroke, Style } from "ol/style";
import { ScaleLine, defaults as defaultControls } from "ol/control";

export class UiPaneWpt extends UiPane {
    #map_el;
    #ol_map;
    #ol_tileLayer;
    #ol_vectorLayer;
    #ol_vectorSource;
    #ol_lastPointStyle;
    #ol_regularStyle;
    #ol_scaleLine;
    #ol_view;
    #ol_featureId = 0;

    constructor() {
        super("pane-wpt");

        this.btnAddPoint = this.el.querySelector("#btnAddPoint");
        this.btnAddPoint.onclick = () => {
            this.btnAddPoint.disabled = true;
            this.removeLastPointStyle();
            globalThis._my_.dispatchEvent(CONFIG.EV_SAVE_PT);
        };

        // new point rcv
        globalThis._my_.events.addEventListener(CONFIG.EV_NEW_PT, (ev) => {
            // const pt = ev.detail;
            // console.log("new point", pt);
            // this.addPoint({ lati: pt.lati, long: pt.long });
        });

        // save confirmation rcv
        globalThis._my_.events.addEventListener(CONFIG.EV_SAVE_PT_DONE, (ev) => {
            const pt = ev.detail;
            console.log("done save point", pt);
            this.btnAddPoint.disabled = false;

            // show point if returned with success
            if (pt.save_point)
                this.addPoint({ lati: pt.lati, long: pt.long });
        });

        // listen for serial port state change
        globalThis._my_.events.addEventListener(CONFIG.STATE, (ev) => {
            switch (ev.detail) {
                case STATE.disconnected:
                    this.btnAddPoint.disabled = true;
                    break;
                case STATE.rover:
                    this.btnAddPoint.disabled = false;
                    break;
            }
        });

        // TEST
        // this.btnAddPoint.disabled = false;

        // MAP
        this.#ol_tileLayer = new TileLayer({
            source: new OSM(),
        });

        this.#ol_vectorSource = new VectorSource();

        this.#ol_vectorLayer = new VectorLayer({
            source: this.#ol_vectorSource,
        });

        this.#ol_view = new View({
            center: fromLonLat([0, 0]),
            zoom: 12
        });

        this.#map_el = this.el.querySelector(".map-div");
        this.#ol_map = new Map({
            target: this.#map_el,
            controls: defaultControls().extend([this.scaleControl()]),
            layers: [this.#ol_tileLayer, this.#ol_vectorLayer],
            view: this.#ol_view
        });

        // Style for regular points
        this.#ol_regularStyle = new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({ color: "blue" }),
                stroke: new Stroke({
                    color: "blue",
                    width: 1
                })
            })
        });

        // Style for the last added point
        this.#ol_lastPointStyle = new Style({
            image: new Circle({
                radius: 7,
                fill: new Fill({ color: "red" }),
                stroke: new Stroke({
                    color: "red",
                    width: 1
                })
            })
        });
    }

    /**
     * 
     */
    addPoint(point = { lati: 52.737913927166666, long: -8.7759595805 }) {
        // Remove the last point style from the previous last point
        this.removeLastPointStyle();

        // Create a feature representing a new point
        const pt = new Point(fromLonLat([point.long, point.lati]));
        const pointFeature = new Feature(pt);

        // Set the last point style for the new point
        pointFeature.setStyle(this.#ol_lastPointStyle);

        // set uniq point id
        pointFeature.setId(this.#ol_featureId++);

        this.#ol_vectorSource.addFeature(pointFeature);

        this.#ol_view.setCenter(pointFeature.getGeometry().getCoordinates());
    }

    /**
     * 
     */
    removeOldestPoint() {
        // Get all features from the vector source
        const features = this.#ol_vectorSource.getFeatures();

        // Remove the last feature (with lowest id)
        if (features.length > 0) {
            // https://stackoverflow.com/a/31844649
            this.#ol_vectorSource.removeFeature(features.reduce((prev, curr) => prev.getId() < curr.getId() ? prev : curr));
        }
    }

    /**
     * 
     */
    removeLastPointStyle() {
        // Get all features from the vector source
        const features = this.#ol_vectorSource.getFeatures();

        features.forEach(el => {
            if (el.getStyle() !== this.#ol_regularStyle) {
                el.setStyle(this.#ol_regularStyle);
            }
        });
    }

    /**
     * 
     * @param {*} scaleType 
     * @param {*} units 
     * @returns 
     */
    scaleControl(scaleType = "scaleline", units = "metric") {
        if (scaleType === "scaleline") {
            this.#ol_scaleLine = new ScaleLine({
                units: units,
            });
        } else {
            this.#ol_scaleLine = new ScaleLine({
                units: units,
                bar: true,
                steps: 2,
                text: false,
                minWidth: 140,
            });
        }
        return this.#ol_scaleLine;
    }
}