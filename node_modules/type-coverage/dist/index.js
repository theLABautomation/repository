"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const minimist_1 = tslib_1.__importDefault(require("minimist"));
const fs = tslib_1.__importStar(require("fs"));
const util = tslib_1.__importStar(require("util"));
const path = tslib_1.__importStar(require("path"));
const packageJson = tslib_1.__importStar(require("../package.json"));
const type_coverage_core_1 = require("type-coverage-core");
let suppressError = false;
const existsAsync = util.promisify(fs.exists);
const readFileAsync = util.promisify(fs.readFile);
function showToolVersion() {
    console.log(`Version: ${packageJson.version}`);
}
async function executeCommandLine() {
    const argv = minimist_1.default(process.argv.slice(2), { '--': true });
    const showVersion = argv.v || argv.version;
    if (showVersion) {
        showToolVersion();
        return;
    }
    suppressError = argv.suppressError;
    const { correctCount, totalCount, anys } = await type_coverage_core_1.lint(argv.p || argv.project || '.', {
        debug: argv.debug,
        strict: argv.strict,
        enableCache: argv.cache,
        ignoreCatch: argv['ignore-catch'],
        ignoreFiles: argv['ignore-files']
    });
    const percent = Math.floor(10000 * correctCount / totalCount) / 100;
    const atLeast = await getAtLeast(argv);
    const failed = atLeast && percent < atLeast;
    if (argv.detail || failed) {
        for (const { file, line, character, text } of anys) {
            console.log(`${path.resolve(process.cwd(), file)}:${line + 1}:${character + 1}: ${text}`);
        }
    }
    console.log(`${correctCount} / ${totalCount} ${percent.toFixed(2)}%`);
    if (failed) {
        throw new Error(`The type coverage rate(${percent.toFixed(2)}%) is lower than the target(${atLeast}%).`);
    }
}
async function getAtLeast(argv) {
    let atLeast;
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    if (await existsAsync(packageJsonPath)) {
        const currentPackageJson = JSON.parse((await readFileAsync(packageJsonPath)).toString());
        if (currentPackageJson.typeCoverage && currentPackageJson.typeCoverage.atLeast) {
            atLeast = currentPackageJson.typeCoverage.atLeast;
        }
    }
    if (argv['at-least']) {
        atLeast = argv['at-least'];
    }
    return atLeast;
}
executeCommandLine().then(() => {
    console.log('type-coverage success.');
}, (error) => {
    if (error instanceof Error) {
        console.log(error.message);
    }
    else {
        console.log(error);
    }
    if (!suppressError) {
        process.exit(1);
    }
});
