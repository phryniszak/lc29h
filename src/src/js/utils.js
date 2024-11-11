export const Utils = {};

/**
 * 
 * @param {*} func 
 * @param {*} delay 
 * @returns 
 */
Utils.debounce = (func, delay) => {
    let timeout = undefined;
    let lastTime = 0;
    return function (args) {
        // Call immediately if last call was more than the delay ago.
        // Otherwise, set a timeout. This means the first call is fast
        // (for the common case of a single update), and subsequent updates
        // are batched.
        let now = Date.now();

        if (now - lastTime > delay) {
            lastTime = now;
            func.call(null, args);
        } else {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                timeout = undefined;
                lastTime = Date.now();
                func.call(null, args);
            }, delay);
        }
    };
};

/**
 * https://www.seanmcp.com/articles/listen-for-class-change-in-javascript/
 * @param {*} node 
 * @param {*} callback 
 * @returns 
 */
Utils.onClassChange = (node, callback) => {
    let lastClassString = node.classList.toString();

    const mutationObserver = new MutationObserver((mutationList) => {
        for (const item of mutationList) {
            if (item.attributeName === "class") {
                const classString = node.classList.toString();
                if (classString !== lastClassString) {
                    callback.call();
                    lastClassString = classString;
                    break;
                }
            }
        }
    });

    mutationObserver.observe(node, { attributes: true });

    return mutationObserver;
};

// https://gist.github.com/nmsdvid/8807205
/**
 * 
 * @param {*} callback 
 * @param {*} time 
 * @param {*} interval 
 * @returns 
 */
Utils.debounceEvent = (callback, time = 250, interval) =>
    (...args) =>
        clearTimeout(interval, interval = setTimeout(() => callback(...args), time));


/**
 * 
 */
Utils.debounceEventOneArg = (callback, time = 250, interval) =>
    (args) =>
        clearTimeout(interval, interval = setTimeout(() => callback(args), time));
/**
 * 
 * @param {*} delay 
 * @returns 
 */
Utils.later = (delay) => {
    return new Promise(function (resolve) {
        setTimeout(resolve, delay);
    });
};

/**
 * https://www.freecodecamp.org/news/how-to-compare-arrays-in-javascript/
*/
Utils.compareArrays = (a, b) =>
    a.length === b.length && a.every((element, index) => element === b[index]);

/**
 * Creates a new ArrayBuffer from concatenating two existing ones
 * https://gist.github.com/72lions/4528834
 *
 * @param {ArrayBuffer | null} buffer1 The first buffer.
 * @param {ArrayBuffer | null} buffer2 The second buffer.
 * @return {ArrayBuffer | null} The new ArrayBuffer created out of the two.
 */
Utils.concatArray = function (buffer1, buffer2) {

    if (!buffer1) {
        return buffer2;
    } else if (!buffer2) {
        return buffer1;
    }

    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp;
};

/**
 * 
 */
Utils.compareUint8Array = (a, b) => {
    if (a.constructor.name !== "Uint8Array" || b.constructor.name !== "Uint8Array") {
        return undefined;
    }

    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
};

/**
 * 
 * @param {Uint8Array} array 
 * @param {Uint8Array} fragment 
 * @returns {number} position
 */
Utils.findArray = (array, fragment) => {

    // not enough elements to execute search or empty array
    if ((array.length < fragment.length) || (fragment.length == 0)) {
        return (-1);
    }

    for (let index = 0; index < (array.length - fragment.length + 1); index++) {

        let startIndex = index;
        let found = true;

        for (let arr_index = 0; arr_index < fragment.length; arr_index++) {
            if (fragment[arr_index] !== array[startIndex]) {
                found = false;
                break;
            }
            startIndex++;
        }

        // we found it !!!
        if (found) {
            return index;
        }
    }

    // sorry, no...
    return -1;
};

/**
 * from https://jsfiddle.net/fbn5j7ya/
 * @param {*} xml 
 * @param {*} tab 
 * @param {*} nl 
 * @returns 
 */
Utils.formatXML = (xml, tab = "\t", nl = "\n") => {
    let formatted = "", indent = "";
    const nodes = xml.slice(1, -1).split(/>\s*</);
    if (nodes[0][0] == "?") formatted += "<" + nodes.shift() + ">" + nl;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node[0] == "/") indent = indent.slice(tab.length); // decrease indent
        formatted += indent + "<" + node + ">" + nl;
        if (node[0] != "/" && node[node.length - 1] != "/" && node.indexOf("</") == -1) indent += tab; // increase indent
    }
    return formatted;
};

/**
 * 
 * @returns 
 */
Utils.generateUUID = () => {
    return Math.random().toString(36).substring(2, 12);
};