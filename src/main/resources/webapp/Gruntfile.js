(function() {

  'use strict';

  module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);
    
    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    var appConfig = {
      app: 'app',
      dist: 'dist',
      angularApp: 'angular-app'
    };

    grunt.initConfig({

      // Project settings
      config: appConfig,
      angularApp: '<%= config.app %>/<%= config.angularApp %>',

      jsFiles: [
        '<%= config.app %>/assets/js/*.js',
        '<%= angularApp %>/**/*.js'
      ],

      cssFiles: '<%= config.app %>/assets/styles/**/*.css',

      // Watches files for changes and runs tasks based on the changed files
      watch: {
        bower: {
          files: 'bower.json',
          tasks: ['wiredep']
        },
        js: {
          files: ['<%= jsFiles %>'],
          tasks: ['newer:jshint:all'],
          options: {
            livereload: '<%= connect.options.livereload %>'
          }
        },
        templates: {
          files: ['<%= angularApp %>/**/*.html'],
          tasks: ['html2js:main']
        },
        // jsTest: {
        //   files: ['test/spec/{,*/}*.js'],
        //   tasks: []
        // },
        styles: {
          files: ['<%= cssFiles %>'],
          tasks: ['newer:copy:styles', 'autoprefixer'],
        },
        gruntfile: {
          files: ['Gruntfile.js']
        },
        livereload: {
          options: {
            livereload: '<%= connect.options.livereload %>'
          },
          files: [
            '<%= config.app %>/**/*.html',
            '.tmp/styles/{,*/}*.css',
            '<%= config.app %>/assets/img/**/*.{png,jpg,jpeg,gif,webp,svg}'
          ]
        },
      },

      // The actual grunt server settings
      connect: {
        options: {
          port: 9000,
          hostname: 'localhost',
          livereload: 35729
        },
        livereload: {
          options: {
            open: true,
            middleware: function(connect) {
              return [
                connect.static('.tmp'),
                connect().use(
                  '/bower_components',
                  connect.static('./bower_components')
                ),
                connect.static(appConfig.app)
              ];
            }
          }
        },
        test: {},
        dist: {}
      },

      // Make sure code styles are up to par and there are no obvious mistakes
      jshint: {
        options: {
          jshintrc: '.jshintrc',
          reporter: require('jshint-stylish')
        },
        all: {
          src: [
            'Gruntfile.js',
            '<%= jsFiles %>',
          ]
        },
        test: {
          options: {
            jshintrc: 'test/.jshintrc',
          },
          src: ['test/spec/{,*/}*.js']
        }
      },

      // Empties folders to start fresh
      clean: {
        dist: {
          files: [{
            dot: true,
            src: [
              '.tmp',
              '<%= config.dist %>/{,*/}*',
              '!<%= config.dist %>/.git{,*/}*'
            ]
          }]
        },
        server: '.tmp'
      },


      // Add vendor prefixed styles
      autoprefixer: {
        options: {
          browsers: ['last 1 version']
        },
        dist: {
          files: [{
            expand: true,
            cwd: '.tmp/styles/',
            src: '{,*/}*.css',
            dest: '.tmp/styles/'
          }]
        }
      },

      // Renames files for browser caching purposes
      filerev: {
        dist: {
          src: [
            '<%= config.dist %>/scripts/{,*/}*.js',
            '<%= config.dist %>/styles/{,*/}*.css',
            '<%= config.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
            '<%= config.dist %>/styles/fonts/*'
          ]
        }
      },

      // Reads HTML for usemin blocks to enable smart builds that automatically
      // concat, minify and revision files. Creates configurations in memory so
      // additional tasks can operate on them
      useminPrepare: {
        html: '<%= config.app %>/index.html',
        options: {
          dest: '<%= config.dist %>',
          flow: {
            html: {
              steps: {
                js: ['concat', 'uglifyjs'],
                css: ['concat', 'cssmin']
              },
              post: {}
            }
          }
        }
      },

      // Performs rewrites based on filerev and the useminPrepare configuration
      usemin: {
        html: ['<%= config.dist %>/**/*.html'],
        css: ['<%= config.dist %>/styles/{,*/}*.css'],
        options: {
          assetsDirs: ['<%= config.dist %>','<%= config.dist %>/images']
        }
      },

      // Automatically inject Bower components into the app
      wiredep: {
        app: {
          src: ['<%= config.app %>/index.html'],
          ignorePath: /\.\.\//
        }
      },

      imagemin: {
        dist: {
          files: [{
            expand: true,
            cwd: '<%= config.app %>/assets/images',
            src: '{,*/}*.{png,jpg,jpeg,gif}',
            dest: '<%= config.dist %>/assets/images'
          }]
        }
      },

      svgmin: {
        dist: {
          files: [{
            expand: true,
            cwd: '<%= config.app %>/assets/images',
            src: '{,*/}*.svg',
            dest: '<%= config.dist %>/assets/images'
          }]
        }
      },

      // Replace Google CDN references
      cdnify: {
        dist: {
          html: ['<%= config.dist %>/*.html']
        }
      },

      htmlmin: {
        dist: {
          options: {
            collapseWhitespace: true,
            conservativeCollapse: true,
            collapseBooleanAttributes: true,
            removeCommentsFromCDATA: true,
            removeOptionalTags: true
          },
          files: [{
            expand: true,
            cwd: '<%= config.dist %>',
            src: ['*.html', '<%= config.angularApp %>/**/*.html'],
            dest: '<%= config.dist %>'
          }]
        }
      },

      // ng-annotate tries to make the code safe for minification automatically
      // by using the Angular long form for dependency injection.
      ngAnnotate: {
        dist: {
          files: [{
            expand: true,
            cwd: '.tmp/concat/scripts',
            src: ['*.js', '!oldieshim.js'],
            dest: '.tmp/concat/scripts'
          }]
        }
      },

      // Copies remaining files to places other tasks can use
      copy: {
        dist: {
          files: [{
            expand: true,
            dot: true,
            cwd: '<%= config.app %>',
            dest: '<%= config.dist %>',
            src: [
              '*.{ico,png,txt}',
              '.htaccess',
              '*.html',
              // '<%= config.angularApp %>/**/*.html',
              'assets/images/{,*/}*.{webp}',
              'assets/fonts/{,*/}*.*'
            ]
          }, {
            expand: true,
            cwd: '.tmp/images',
            dest: '<%= config.dist %>/assets/images',
            src: ['generated/*']
          }, {
            expand: true,
            cwd: 'bower_components/components-font-awesome',
            src: 'fonts/*',
            dest: '<%= config.dist %>'
          }]
        },
        styles: {
          expand: true,
          cwd: '<%= config.app %>/assets/styles',
          dest: '.tmp/styles/',
          src: '{,*/}*.css'
        }
      },

      // Run some tasks in parallel to speed up the build process
      concurrent: {
        server: [
          'copy:styles'
        ],
        test: [
          'copy:styles'
        ],
        dist: [
          'copy:styles',
          'imagemin',
          'svgmin'
        ]
      },

      html2js: {
        options: {
          base: 'app',
          module: 'app.templates',
          singleModule: true,
          useStrict: true,
          htmlmin: {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true,
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          }
        },
        main: {
          src: ['<%= angularApp %>/**/*.html'],
          dest: '<%= angularApp %>/templates.js'
        }
      },

      // concat: {
      //   options: {
      //     separator: ';'
      //   },
      //   dist: {
      //     src: [ '<%config.dist %>/scripts/app.js', '.tmp/templates.js' ],
      //     dest: '<%= config.dist %>/scripts/app2.js'
      //   }
      // }
      
      // concat: {
      //   options: {
      //     separator: ';'
      //   },
      //   dist: {
      //     src: [ '<%= config.dist %>/scripts/app.js', '.tmp/templates.js' ],
      //     dest: '<%= config.dist %>/scripts/app.js'
      //   }
      // }
    });


    grunt.registerTask('serve', 'Compile then start a connect web server', function(target) {
      if (target === 'dist') {
        return grunt.task.run(['build', 'connect:dist:keepalive']);
      }

      grunt.task.run([
        'clean:server',
        'wiredep',
        'concurrent:server',
        'autoprefixer',
        'html2js:main',
        'connect:livereload',
        'watch'
      ]);
    });

    grunt.registerTask('test', []);

    grunt.registerTask('build', [
      'clean:dist',
      'wiredep',
      'useminPrepare',
      'concurrent:dist',
      'autoprefixer',
      'html2js:main',
      'concat',
      'ngAnnotate',
      'copy:dist',
      'cdnify',
      'cssmin',
      'uglify',
      'filerev',
      'usemin',
      'htmlmin'
    ]);

    grunt.registerTask('default', [
      'newer:jshint',
      'test',
      'build'
    ]);
  };
})();