/*
 * Packet Type: 001 PAIR_ACK
 * Acknowledges a PAIR command. An acknowledgement packet $PAIR001 is returned to inform the
 * sender that the receiver has received the packet.
 * Type: Output
 * Synopsis: $PAIR001,<CommandID>,<Result>*<Checksum><CR><LF>
 *
*/

import { initStubFields } from "../packet_stub";
import { parseIntSafe } from "../helpers";

export const sentenceId = "AIR001";
export const sentenceName = "Acknowledges a PAIR command";

const ResultTypes = ["command send", "command processed", "command not supported"
    , "parameter error", "busy, try again"];


export function decodeSentence(stub, fields) {
    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        commandID: parseIntSafe(fields[1]),
        result: parseIntSafe(fields[2]),
        resultTxt: ResultTypes[parseIntSafe(fields[2])]
    };
}
