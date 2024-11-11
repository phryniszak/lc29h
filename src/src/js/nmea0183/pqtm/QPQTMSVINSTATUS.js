import { parseFloatSafe, parseIntSafe } from "../helpers";
import { initStubFields } from "../packet_stub";


export const sentenceId = "QTMSVINSTATUS";
export const sentenceName = "Survey-in status";

const validName = ["invalid", "inprogress", "valid"];

export function decodeSentence(stub, fields) {
    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        result: "OK",
        msgVer: parseIntSafe(fields[1]),
        TOW: parseIntSafe(fields[2]),
        __valid: parseIntSafe(fields[3]),
        valid: validName[parseIntSafe(fields[3])],
        // Res0 4
        // Res1 5
        Obs: parseIntSafe(fields[6]),
        CfgDur: parseIntSafe(fields[7]),
        MeanX: parseFloatSafe(fields[8]),
        MeanY: parseFloatSafe(fields[9]),
        MeanZ: parseFloatSafe(fields[10]),
        MeanAcc: parseFloatSafe(fields[11]),
    };
}