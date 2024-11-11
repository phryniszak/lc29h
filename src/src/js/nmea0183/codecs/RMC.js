/*
 * === RMC - Recommended minimum navigation information ===
 *
 * NMEA 0183 V3.01 format:
 * 
 * $<TalkerID>RMC,<UTC>,<Status>,<Lat>,<N/S>,<Lon>,<E/W>,<SOG>,<COG>,<Date>,<MagVar>,<Ma
 * gVarDir>,<ModeInd>*<Checksum><CR><LF>
 * 
 * NMEA 0183 V4.10 format (default):
 * 
 * $<TalkerID>RMC,<UTC>,<Status>,<Lat>,<N/S>,<Lon>,<E/W>,<SOG>,<COG>,<Date>,<MagVar>,<Ma
 * gVarDir>,<ModeInd>,<NavStatus>*<Checksum><CR><LF>                                                           12
 */

import { initStubFields } from "../packet_stub";
import { parseTime, parseLatitude, parseLongitude, parseFloatSafe } from "../helpers";

export const sentenceId = "RMC";
export const sentenceName = "Navigation information";

/**
 * 
 * @param {*} mode 
 */
function getFix(mode) {
    switch (mode) {
        case "A": return "Autonomous mode";
        case "D": return "Differential mode";
        case "E": return "Estimated";
        case "F": return "Float RTK";
        case "M": return "Manual input";
        case "N": return "No fix";
        case "R": return "Int RTK";
    }
    return "ERROR";
}


export function decodeSentence(stub, fields) {
    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        result: "OK",
        dateTime: parseTime(fields[1], fields[9], true),
        status: fields[2] === "A" ? "valid" : "warning",
        latitude: parseLatitude(fields[3], fields[4]),
        longitude: parseLongitude(fields[5], fields[6]),
        speedKnots: parseFloatSafe(fields[7]),
        course: parseFloatSafe(fields[8]),
        // variation: parseFloatSafe(fields[10]),
        // variationPole: fields[11] === "E" ? "E" : fields[11] === "W" ? "W" : "",
        fixType: getFix(fields[12]),
        __fixType: fields[12]
    };
}
