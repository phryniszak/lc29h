/*
 * === VTG - Track made good and ground speed ===
 *
 * NMEA 0183 V3.01 format:
 * 
 * $<TalkerID>VTG,<COGT>,T,<COGM>,M,<SOGN>,N,<SOGK>,K,<ModeInd>*<Checksum><CR><LF>
 * 
 * NMEA 0183 V4.10 format (default):
 * 
 * $<TalkerID>VTG,<COGT>,T,<COGM>,M,<SOGN>,N,<SOGK>,K,<ModeInd>*<Checksum><CR><LF>
*/

import { initStubFields } from "../packet_stub";
import { parseFloatSafe } from "../helpers";

export const sentenceId = "VTG";
export const sentenceName = "Track and ground speed";

export function decodeSentence(stub, fields) {
    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        result: "OK",
        trackTrue: parseFloatSafe(fields[1]),
        trackMagnetic: parseFloatSafe(fields[3]),
        speedKnots: parseFloatSafe(fields[5]),
        speedKmph: parseFloatSafe(fields[7]),
        faaMode: fields[9]
    };
}