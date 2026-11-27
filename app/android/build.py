"""Build the Android app (an APK that opens the game server) with an installed Android SDK.

  python build.py --build-tools <sdk>/build-tools/35.0.0 --platform <sdk>/platforms/android-35/android.jar \
      --keystore my.keystore --key-alias forge --output NebulaForge.apk --url https://game.example.com

Without --url the app asks for the server address on first start, which is meant for test builds.
--allow-http lets a test build open a plain http:// address such as http://13.125.0.10 ; never use it for a store build.
The keystore password is read from the environment variable NEBULA_KEY_PASSWORD.
"""
import argparse, os, re, shutil, subprocess, tempfile
from pathlib import Path
from zipfile import ZipFile, ZIP_STORED

app = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument("--build-tools", type=Path, required=True)
parser.add_argument("--platform", type=Path, required=True, help="Path to android.jar")
parser.add_argument("--keystore", type=Path, required=True)
parser.add_argument("--key-alias", default="forge-test")
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--url", default="", help="Game server address built into the app")
parser.add_argument("--allow-http", action="store_true")
parser.add_argument("--package", default="", help="Application id, e.g. kr.nebulaforge.game for the store build")
parser.add_argument("--version-name", default="")
parser.add_argument("--version-code", default="")
args = parser.parse_args()
if args.url and not re.fullmatch(r"https?://[A-Za-z0-9.-]+(:\d+)?/?", args.url):
    raise SystemExit("--url must look like https://game.example.com")
if args.url.startswith("http://") and not args.allow_http:
    raise SystemExit("An http:// address needs --allow-http (test builds only).")
bt, jar, out = args.build_tools.resolve(), args.platform.resolve(), args.output.resolve()
out.parent.mkdir(parents=True, exist_ok=True)

def run(*cmd):
    subprocess.run(list(map(str, cmd)), check=True)

with tempfile.TemporaryDirectory() as work:
    tmp = Path(work)
    res = tmp / "res"
    shutil.copytree(app / "res", res)
    (res / "values/config.xml").write_text(
        '<resources>\n    <string name="server_url" translatable="false">%s</string>\n    <bool name="allow_http">%s</bool>\n</resources>\n'
        % (args.url, "true" if args.allow_http else "false"), encoding="utf-8")
    manifest = (app / "AndroidManifest.xml").read_text(encoding="utf-8")
    if args.allow_http:
        manifest = manifest.replace('android:usesCleartextTraffic="false"', 'android:usesCleartextTraffic="true"')
    if args.version_name:
        manifest = re.sub(r'android:versionName="[^"]*"', 'android:versionName="%s"' % args.version_name, manifest)
    if args.version_code:
        manifest = re.sub(r'android:versionCode="[^"]*"', 'android:versionCode="%s"' % args.version_code, manifest)
    (tmp / "AndroidManifest.xml").write_text(manifest, encoding="utf-8")
    gen, classes, dex = (tmp / d for d in ("gen", "classes", "dex"))
    for d in (gen, classes, dex): d.mkdir()
    resources, base = tmp / "compiled.zip", tmp / "app.apk"
    run(bt / "aapt2", "compile", "--dir", res, "-o", resources)
    link = [bt / "aapt2", "link", "-o", base, "-I", jar, "--manifest", tmp / "AndroidManifest.xml", "--java", gen]
    # The Java code refers to its resources as kr.nebulaforge.game.test.R whatever the application id is.
    if args.package: link += ["--rename-manifest-package", args.package]
    run(*link, resources)
    sources = list((app / "src").rglob("*.java")) + list(gen.rglob("*.java"))
    compiler = [shutil.which("javac")] if shutil.which("javac") else ["java", "-m", "jdk.compiler/com.sun.tools.javac.Main"]
    run(*compiler, "-encoding", "UTF-8", "-source", "8", "-target", "8", "-Xlint:-options",
        "-bootclasspath", os.pathsep.join(map(str, (bt / "core-lambda-stubs.jar", jar))), "-d", classes, *sources)
    run(bt / "d8", "--lib", jar, "--min-api", "26", "--output", dex, *classes.rglob("*.class"))
    with ZipFile(base, "a") as apk:
        apk.write(dex / "classes.dex", "classes.dex", ZIP_STORED)
    aligned = tmp / "aligned.apk"
    run(bt / "zipalign", "-f", "4", base, aligned)
    run(bt / "apksigner", "sign", "--ks", args.keystore, "--ks-key-alias", args.key_alias,
        "--ks-pass", "env:NEBULA_KEY_PASSWORD", "--v4-signing-enabled", "false", "--out", out, aligned)
    run(bt / "apksigner", "verify", out)
    print("Built", out, "(%d KB)" % (out.stat().st_size // 1024), "server:", args.url or "asked at first start")
