/*
 * === ZDA - Time & Date - UTC, day, month, year and local time zone ===
 *
 * NMEA 0183 V3.01 format:
 * 
 * $<TalkerID>ZDA,<UTC>,<Day>,<Month>,<Year>,<LocalHour>,<LocalMin>*<Checksum><CR><LF>
 * 
 * NMEA 0183 V4.10 format (default):
 * 
 * $<TalkerID>ZDA,<UTC>,<Day>,<Month>,<Year>,<LocalHour>,<LocalMin>*<Checksum><CR><LF>
*/

import { initStubFields } from "../packet_stub";
import { parseIntSafe, parseTime } from "../helpers";

export const sentenceId = "ZDA";
export const sentenceName = "Time information";


export function decodeSentence(stub, fields) {
    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        result: "OK",
        dateTime: parseTime(fields[1], fields.slice(2, 5).join("")),
        localZoneHours: parseIntSafe(fields[5]),
        localZoneMinutes: parseIntSafe(fields[6])
    };
}
