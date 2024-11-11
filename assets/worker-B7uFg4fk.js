const opfsRoot = await navigator.storage.getDirectory();
const textEncoder = new TextEncoder();
onmessage = async (e) => {
  switch (e.data?.operation) {
    case "write":
      await write(e.data.file, e.data.str, e.data.dir);
      return;
    case "deleteAll":
      await deleteAll();
      postMessage({ operation: "deleteAll" });
      return;
    case "getDirList":
      await listDirectoriesInRoot();
      return;
  }
  console.log("Worker: Unknown message:", e.data);
};
async function isAnyFolderExists() {
  try {
    for await (const entry of opfsRoot.values()) {
      console.log("Entry:", entry);
      if (entry.kind === "directory") {
        console.log(`Folder found: ${entry.name}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error accessing file system:", error);
    return false;
  }
}
async function deleteAll() {
  if (await isAnyFolderExists())
    await opfsRoot.remove({ recursive: true });
}
async function write(file, str, dir) {
  if (dir == void 0) {
    console.error("dir not defined");
    return;
  }
  const sessionDirHandle = await opfsRoot.getDirectoryHandle(dir, { create: true });
  const fileHandle = await sessionDirHandle.getFileHandle(file, { create: true });
  try {
    await navigator.locks.request("createSyncAccessHandle", async () => {
      const accessHandle = await fileHandle.createSyncAccessHandle();
      const size = accessHandle.getSize();
      const content = textEncoder.encode(str);
      accessHandle.write(content, { at: size });
      accessHandle.close();
    });
  } catch (error) {
    console.error(error);
  }
}
async function listDirectoriesInRoot() {
  async function* getEntries(dirHandle) {
    for await (const entry of dirHandle.values()) {
      yield entry;
    }
  }
  const directories = [];
  try {
    for await (const entry of getEntries(opfsRoot)) {
      if (entry.kind === "directory") {
        directories.push(entry.name);
      }
    }
  } catch (error) {
    console.error("Error accessing file system:", error);
  }
  directories.sort().reverse();
  postMessage({ operation: "getDirList", directories });
}
//# sourceMappingURL=worker-B7uFg4fk.js.map
