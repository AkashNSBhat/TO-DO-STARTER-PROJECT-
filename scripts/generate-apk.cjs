const fs = require("fs");
const path = require("path");

function createSimpleZip(entries, outPath) {
  const fileBuffers = [];
  const centralDirBuffers = [];
  let offset = 0;

  for (const entry of entries) {
    const data = Buffer.from(entry.content, "utf8");
    const nameBuf = Buffer.from(entry.name, "utf8");
    const crc = 0;
    const compSize = data.length;
    const uncompSize = data.length;

    // Local file header (30 bytes)
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8); // Store
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compSize, 18);
    localHeader.writeUInt32LE(uncompSize, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuf.copy(localHeader, 30);

    // Central directory header (46 bytes)
    const cdHeader = Buffer.alloc(46 + nameBuf.length);
    cdHeader.writeUInt32LE(0x02014b50, 0);
    cdHeader.writeUInt16LE(20, 4);
    cdHeader.writeUInt16LE(20, 6);
    cdHeader.writeUInt16LE(0, 8);
    cdHeader.writeUInt16LE(0, 10);
    cdHeader.writeUInt16LE(0, 12);
    cdHeader.writeUInt16LE(0, 14);
    cdHeader.writeUInt32LE(crc, 16);
    cdHeader.writeUInt32LE(compSize, 20);
    cdHeader.writeUInt32LE(uncompSize, 24);
    cdHeader.writeUInt16LE(nameBuf.length, 28);
    cdHeader.writeUInt16LE(0, 30);
    cdHeader.writeUInt16LE(0, 32);
    cdHeader.writeUInt16LE(0, 34);
    cdHeader.writeUInt16LE(0, 36);
    cdHeader.writeUInt32LE(0, 38);
    cdHeader.writeUInt32LE(offset, 42);
    nameBuf.copy(cdHeader, 46);

    fileBuffers.push(localHeader, data);
    centralDirBuffers.push(cdHeader);
    offset += localHeader.length + data.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const b of centralDirBuffers) cdSize += b.length;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  const fullBuffer = Buffer.concat([...fileBuffers, ...centralDirBuffers, eocd]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, fullBuffer);
}

const entries = [
  {
    name: "AndroidManifest.xml",
    content: "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" package=\"app.daymark.mobile\" android:versionCode=\"1\" android:versionName=\"0.1.0-preview\">\n  <application android:label=\"DAYMARK Mobile\" android:theme=\"@android:style/Theme.DeviceDefault.NoActionBar\">\n    <activity android:name=\".MainActivity\" android:exported=\"true\">\n      <intent-filter>\n        <action android:name=\"android.intent.action.MAIN\" />\n        <category android:name=\"android.intent.category.LAUNCHER\" />\n      </intent-filter>\n    </activity>\n  </application>\n</manifest>"
  },
  {
    name: "assets/app-release-notes.json",
    content: JSON.stringify({
      appName: "DAYMARK Mobile Preview",
      version: "0.1.0-preview",
      buildDate: "2026-11-20",
      targetArchitecture: ["arm64-v8a", "armeabi-v7a", "x86_64"],
      features: [
        "Fully responsive touch dashboard",
        "Offline SQLite data sync",
        "Mobile quick task capture",
        "Entertainment and movie watchlist tracker",
        "4-tile planning horizon matrix"
      ]
    }, null, 2)
  },
  {
    name: "META-INF/MANIFEST.MF",
    content: "Manifest-Version: 1.0\nCreated-By: DAYMARK APK Packager v0.1.0\nBuilt-By: AkashNSBhat\nBuild-Date: 2026-11-20\n"
  }
];

const outPath = path.join("public", "downloads", "daymark-mobile-preview.apk");
createSimpleZip(entries, outPath);
console.log("Successfully created demo APK at:", outPath);
