/*

 * NMEA 0183 V3.01 format:
 * $<TalkerID>GLL,<Lat>,<N/S>,<Lon>,<E/W>,<UTC>,<Status>,<ModeInd>*<Checksum><CR><LF>
 * NMEA 0183 V4.10 format (default):
 * $<TalkerID>GLL,<Lat>,<N/S>,<Lon>,<E/W>,<UTC>,<Status>,<ModeInd>*<Checksum><CR><LF>
 *
 * === GLL - Geographic position - latitude and longitude ===
 *
 * ------------------------------------------------------------------------------
 *         1       2 3        4 5         6 7  8
 *         |       | |        | |         | |  |
 *  $--GLL,llll.ll,a,yyyyy.yy,a,hhmmss.ss,a,m,*hh<CR><LF>
 * ------------------------------------------------------------------------------
 *
 * Field Number:
 *
 * 1. Latitude
 * 2. N or S (North or South)
 * 3. Longitude
 * 4. E or W (East or West)
 * 5. Universal Time Coordinated (UTC)
 * 6. Status
 *    A - Data Valid
 *    V - Data Invalid
 * 7. FAA mode indicator (NMEA 2.3 and later)
 * 8. Checksum
 */

import { initStubFields } from "../packet_stub";
import { parseTime, parseLatitude, parseLongitude } from "../helpers";

export const sentenceId = "GLL";
export const sentenceName = "Latitude and longitude";

/**
 * 
 * @param {*} mode 
 */
function getMode(mode) {
    switch (mode) {
        case "A": return "Autonomous mode";
        case "D": return "Differential mode";
        case "E": return "Estimated";
        case "M": return "Manual input";
        case "N": return "No fix";
    }
    return "ERROR";
}

export function decodeSentence(stub, fields) {
    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        result: "OK",
        latitude: parseLatitude(fields[1], fields[2]),
        longitude: parseLongitude(fields[3], fields[4]),
        time: parseTime(fields[5]),
        status: fields[6] === "A" ? "valid" : "invalid",
        mode: getMode(fields[7])
    };
}
