var gulp = require('gulp');
var jslint = require('gulp-jslint');
 
gulp.task('default', function () {
    return gulp.src(['*.js'])
            .pipe(jslint({ /* this object represents the JSLint directives being passed down */ }))
            .pipe(jslint.reporter( 'stylish', {}));
});
