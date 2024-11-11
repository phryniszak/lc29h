/*
 * === GSV - Satellites in view ===
 *
 * NMEA 0183 V3.01 format:
 * 
 * $<TalkerID>GSV,<TotalNumSen>,<SenNum>,<TotalNumSat>{,<SatID>,<SatElev>,<SatAz>,<SatCN0>}*
 * <Checksum><CR><LF>
 * 
 * NMEA 0183 V4.10 format (default):
 * 
 * $<TalkerID>GSV,<TotalNumSen>,<SenNum>,<TotalNumSat>{,<SatID>,<SatElev>,<SatAz>,<SatCN0>},
 * <SignalID>*<Checksum><CR><LF>
 */

import { initStubFields } from "../packet_stub";
import { parseIntSafe } from "../helpers";

export const sentenceId = "GSV";
export const sentenceName = "Satellites in view";

export function decodeSentence(stub, fields) {

    const sats = [];
    let offset = 4;

    while (offset < (fields.length - 4)) {

        sats.push({
            prnNumber: parseIntSafe(fields[offset]),
            elevationDegrees: parseIntSafe(fields[offset + 1]),
            azimuthTrue: parseIntSafe(fields[offset + 2]),
            SNRdB: parseIntSafe(fields[offset + 3])
        });

        offset += 4;
    }

    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        result: "OK",
        numberOfMessages: parseIntSafe(fields[1]),
        messageNumber: parseIntSafe(fields[2]),
        satellitesInView: parseIntSafe(fields[3]),
        satellites: sats,
        signalID: parseIntSafe(fields[offset])
    };
}
