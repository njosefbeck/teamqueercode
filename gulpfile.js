'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var autoprefixer = require('gulp-autoprefixer');
var runSequence = require('run-sequence');
var deploy = require('gulp-gh-pages');
var replace = require('gulp-replace');

/**
 * Task for compiling Sass files into CSS
 */
gulp.task('sass', function() {
	return gulp.src('app/sass/main.scss')
		.pipe(sass()) // Converts Sass to CSS with gulp-sass
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(gulp.dest('app/css'))
		.pipe(browserSync.reload({
			stream: true
		}));
 });

/**
 * Task for minifying and then concatenating JavaScript files
 */
gulp.task('useref', function() {
	return gulp.src('app/*.html')
		.pipe(useref()) // Concats JS files
		.pipe(gulpIf('*.css', cssnano())) // Minifies only if it's a CSS file
		.pipe(gulpIf('*.js', uglify())) // Uglifies (minifying) only JS files
		.pipe(gulp.dest('dist'));
});

/**
 * Task for optimizing images
 */
gulp.task('images', function() {
	return gulp.src('app/images/**/*.+(png|jpeg|jpg|JPG|gif|svg)')
		.pipe(cache(imagemin())) // Caching images that ran through imagemin
		.pipe(gulp.dest('dist/images'));
});

/**
 * Task for deleting everything in the dist folder
 */
gulp.task('clean', function(callback) {
	del('dist/**/*');
	return cache.clearAll(callback);
});

/**
 * Task for cleaning out the dist folder, but avoiding the images folder
 */
gulp.task('clean:dist', function() {
	return del(['dist/**/*', '!dist/images', '!dist/images/**/*']);
});

/**
*	Task for watching files that change
*/
gulp.task('watch', ['browserSync', 'sass'], function() {
	gulp.watch('app/sass/**/*.scss', ['sass']);
	gulp.watch('app/*.html', browserSync.reload);
	gulp.watch('app/js/**/*.js', browserSync.reload);
});

/**
 * Task for building out dist folder. First, cleans out dist folder, then runs the following
 * tasks simultaneously: sass, useref, images
 */
gulp.task('build', function(callback) {
	runSequence('clean:dist',
				'sass',
				['useref', 'images'],
				callback);
});

/*
 * Task for setting up dev environment: runs sass (compiling sass to css), spins up a server with browserSync and
 * watches files for changes, reloading the browser on save.
 */
 gulp.task('default', function(callback) {
 	runSequence(['sass', 'browserSync', 'watch'], callback);
 });


/**
 * Task for spinning up a server and live-reloading on file changes
 */
gulp.task('browserSync', function() {
	browserSync({
		server: {
			baseDir: 'app'
		}
	});
});

/**
 * Push build to gh-pages
 */
gulp.task('deploy', function() {
	return gulp.src('dist/**/*')
		.pipe(deploy());
});