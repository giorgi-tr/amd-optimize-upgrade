require("coffee-script").register();

const gulp = require("gulp");
const coffee = require("gulp-coffee");
const gif = require("gulp-if");
const mocha = require("gulp-mocha").default;
const concat = require("gulp-concat");
const util = require("gulp-util");
const uglify = require("gulp-uglify");
const rjs = require("./src/index.coffee");

const path = require("path");
const through = require("through2");


gulp.task("compile", function (){
  return gulp.src("src/**/*.coffee")
    .pipe(coffee())
    .pipe(gulp.dest("lib"));
});


gulp.task("test", gulp.series("compile", function () {
  return gulp.src("test/*_test.coffee", { read: false })
    .pipe(mocha({
      reporter: "spec",
      require: ["coffee-script/register"]
    }));
}));


function logger() {
  return through.obj(function (file, enc, callback) {
    util.log(">>", util.colors.yellow(path.relative(process.cwd(), file.path)));
    callback(null, file);
  });
}


gulp.task("sample", function () {
  return gulp.src("test/fixtures/core/**/*.js")
    .pipe(rjs("nested_requirejs"))
    .pipe(gulp.dest(".tmp"));
})

gulp.task("example", function () {
  return gulp.src("build/{javascripts,bower_components}/**/*.{js,coffee}")
    .pipe(gif(function (file) { return path.extname(file.path) == ".coffee"; }, coffee()))
    // Traces all modules and outputs them in the correct order. Also wraps shimmed modules.
    .pipe(rjs("index", {
      configFile : gulp.src("build/javascripts/require_config.coffee").pipe(coffee()),
      wrapShim : true,
      baseUrl : "build/javascripts",
      paths : {
        cordova : "empty:",
        underscore : "../bower_components/lodash/dist/lodash"
      }
    }))
    .pipe(concat("index.js"))
    .pipe(logger())
    .pipe(gulp.dest("dist"));
});

gulp.task("example2", function () {
  // Traces all modules and outputs them in the correct order. Also wraps shimmed modules.
  const source = rjs("main", {
    configFile: gulp.src("public/javascripts/require_config.coffee").pipe(coffee()),
    wrapShim: true,
    baseUrl: "public/javascripts",
    paths: {
      routes: "empty:"
    },
    loader: rjs.loader(
      function (moduleName) {
        return path.join("public/javascripts", moduleName + ".{js,coffee}")
      },
      function () {
        return gif(function (file) {
          return path.extname(file.path) == ".coffee";
        }, coffee())
      }
    )
  });

  source.end();
  return source
    .pipe(concat("main.js"))
    .pipe(uglify())
    .pipe(gulp.dest("dist"))
    .pipe(logger());
});

gulp.task("default", gulp.series("compile", "test"));


