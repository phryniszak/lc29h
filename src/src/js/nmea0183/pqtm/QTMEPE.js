import { parseFloatSafe, parseIntSafe } from "../helpers";
import { initStubFields } from "../packet_stub";


export const sentenceId = "QTMEPE";
export const sentenceName = "Positioning error";

export function decodeSentence(stub, fields) {
    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        result: "OK",
        msgVer: parseIntSafe(fields[1]),
        EPE_North: parseFloatSafe(fields[2]),
        EPE_East: parseFloatSafe(fields[3]),
        EPE_Down: parseFloatSafe(fields[4]),
        EPE_2D: parseFloatSafe(fields[5]),
        EPE_3D: parseFloatSafe(fields[6]),
    };
}