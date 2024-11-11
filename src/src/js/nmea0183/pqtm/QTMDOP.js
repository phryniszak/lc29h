import { parseFloatSafe, parseIntSafe } from "../helpers";
import { initStubFields } from "../packet_stub";

export const sentenceId = "QTMDOP";
export const sentenceName = "Dilution of precision.";

export function decodeSentence(stub, fields) {
    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        result: "OK",
        msgVer: parseIntSafe(fields[1]),
        TOW: parseIntSafe(fields[2]),
        GDOP: parseFloatSafe(fields[3]),
        PDOP: parseFloatSafe(fields[4]),
        TDOP: parseFloatSafe(fields[5]),
        VDOP: parseFloatSafe(fields[6]),
        HDOP: parseFloatSafe(fields[7]),
        NDOP: parseFloatSafe(fields[8]),
        EDOP: parseFloatSafe(fields[9]),
    };
}