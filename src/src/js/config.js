export const CONFIG = {};

// messages
CONFIG.EV_DEVICE_STATE = "device_state";
CONFIG.EV_DEVICE_RX = "device_rx";
CONFIG.EV_NMEA = "mnea";
CONFIG.EV_RTCM3 = "rtcm3";
CONFIG.EV_DEVICE_TX = "device_tx";
CONFIG.EV_SAVE_PT = "save_pt";
CONFIG.EV_NEW_PT = "new_pt";

// messages device communication state
CONFIG.DEVICE_STATE_CONNECTING = "dev_connecting";
CONFIG.DEVICE_STATE_DISCONNECTED = "dev_disconnected";
CONFIG.DEVICE_STATE_CONNECTED = "dev_connected";

// controller state machine event
CONFIG.STATE = "state";

// P2P connection
CONFIG.SERVER = "server";
CONFIG.CLIENT = "client";

CONFIG.EV_TICK = "tick";
CONFIG.EV_TICK_INTERVAL = 1000;

// delay between each serial port reading loop
CONFIG.SERIAL_LOOP_TIME_TICK = 10;
CONFIG.SERIAL_BUFFER_SIZE = 1024 * 64;

/**
 *
 */
export const STATE = {
    error: "error",
    connected: "connected",
    disconnected: "disconnected",
    check_version: "check_version",
    rover: "rover",
    base: "base",
    base_config: "base_config",
    rover_config: "rover_config",
};

/**
 *
 */
export const TRANSITION = {
    error: "tr_error",
    connected: "tr_connected",
    disconnected: "tr_disconnected",
    check_version: "tr_check_version",
    rover: "tr_rover",
    base: "tr_base",
    base_config: "tr_base_config",
    rover_config: "tr_rover_config"
};

export const SERIAL_DEVICES = [
    { vendorId: 0x10c4, productId: 0xea60 }, // Silicon Labs CP210x UART Bridge
];

export const WEB_SERIAL_DEVICES = SERIAL_DEVICES.map(
    ({ vendorId, productId }) => ({
        usbVendorId: vendorId,
        usbProductId: productId,
    }),
);