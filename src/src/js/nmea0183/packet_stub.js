export function initStubFields(stub, id, sentenceName) {
    return {
        sentenceId: id,
        talkerId: stub.talkerId,
        // User info
        chxOk: stub.chxOk,
        sentenceName
    };
}

export function parseStub(field0, chxOk) {

    let talkerId;
    let sentenceId;

    if (field0.charAt(1) === "P") {
        talkerId = "P"; // Proprietary
        sentenceId = field0.substr(2);
    } else {
        talkerId = field0.substr(1, 2);
        sentenceId = field0.substr(3);
    }

    return { talkerId, sentenceId, chxOk: (chxOk ? chxOk : undefined) };
}
