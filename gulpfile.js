const { src, dest, series, parallel, watch } = require("gulp");
const rename = require("gulp-rename"); // 示例插件
const sass = require("gulp-sass")(require("sass")); // 示例插件

// 清理任务（可能需要安装 del 插件）
function clean() {
  const del = require("del");
  return del(["dist"]);
}

// Sass编译任务
function styles() {
  return src("src/scss/**/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(dest("src/css"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(sass({ outputStyle: "compressed" }))
    .pipe(dest("src/css"));
}

// Watch任务
function watchFiles() {
  watch("src/scss/**/*.scss", styles);
}

// exports定义任务
exports.clean = clean;
exports.styles = styles;
exports.watch = watchFiles;

// default任务组合
exports.default = series(clean, parallel(styles));
