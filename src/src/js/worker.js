const opfsRoot = await navigator.storage.getDirectory();
const textEncoder = new TextEncoder();

// _my_.uiPaneFile.#worker.postMessage({ operation: "getDirList"})
// some operations can fail during write operation
// TODO: add some locking mechanism

onmessage = async (e) => {

    switch (e.data?.operation) {
        case "write":
            await write(e.data.file, e.data.str, e.data.dir);
            return;
        case "deleteAll":
            await deleteAll();
            // send it back to re read directories
            postMessage({ operation: "deleteAll" });
            return;
        case "getDirList":
            await listDirectoriesInRoot();
            return;

    }

    console.log("Worker: Unknown message:", e.data);
};

/**
 *
 * @returns
 */
async function isAnyFolderExists() {
    try {
        // Iterate through the entries in the directory
        for await (const entry of opfsRoot.values()) {
            console.log("Entry:", entry);
            if (entry.kind === "directory") {
                console.log(`Folder found: ${entry.name}`);
                return true; // Folder found
            }
        }

        // console.log('No folders found');
        return false; // No folders found
    } catch (error) {
        console.error("Error accessing file system:", error);
        return false;
    }
}

/**
 *
 */
async function deleteAll() {
    if (await isAnyFolderExists())
        await opfsRoot.remove({ recursive: true });
}

/**
 *
 * @param {*} file
 * @param {*} str
 */
async function write(file, str, dir) {

    if (dir == undefined) {
        console.error("dir not defined");
        return;
    }

    const sessionDirHandle = await opfsRoot.getDirectoryHandle(dir, { create: true });
    const fileHandle = await sessionDirHandle.getFileHandle(file, { create: true });
    try {

        await navigator.locks.request("createSyncAccessHandle", async () => {
            // The lock has been acquired.
            const accessHandle = await fileHandle.createSyncAccessHandle();
            // The current size of the file
            const size = accessHandle.getSize();
            // Encode content to write to the file.
            const content = textEncoder.encode(str);
            // Write the content at the beginning of the file.
            accessHandle.write(content, { at: size });
            // Persist changes to disk.
            // accessHandle.flush();
            // Bear in mind that you only need to call this method if you need the changes
            // committed to disk at a specific time, otherwise you can leave the underlying
            // operating system to handle this when it sees fit, which should be OK in most cases.
            // Always close FileSystemSyncAccessHandle if done.
            accessHandle.close();
            // Now the lock will be released.
        });

    }
    catch (error) {
        console.error(error);
    }
}

/**
 * list directories with newest on the top (descending order)
 */
async function listDirectoriesInRoot() {

    // Create an async generator to iterate over the entries in the directory
    async function* getEntries(dirHandle) {
        for await (const entry of dirHandle.values()) {
            yield entry;
        }
    }

    // Array to hold the names of the directories
    const directories = [];

    try {
        // Iterate over the entries and check if they are directories
        for await (const entry of getEntries(opfsRoot)) {
            if (entry.kind === "directory") {
                directories.push(entry.name);
            }
        }
    } catch (error) {
        console.error("Error accessing file system:", error);
    }

    // Log the directories to the console
    // console.log("Directories:", directories);
    // sort newest on the top
    directories.sort().reverse();
    // console.log("Directories sorted:", directories);
    // console.log(parseInt(directories[0], 16));
    // console.log(new Date(parseInt(directories[0], 16)));
    postMessage({ operation: "getDirList", directories: directories });
}