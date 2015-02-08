/*!
 *   Copyright 2014-2015 CoNWeT Lab., Universidad Politecnica de Madrid
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */


module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        bower: {
            install: {
                options: {
                    layout: function (type, component, source) {
                        return type;
                    },
                    targetDir: './src/lib'
                }
            }
        },

        compress: {
            widget: {
                options: {
                    mode: 'zip',
                    archive: 'build/<%= pkg.vendor %>_<%= pkg.name %>_<%= pkg.version %>-dev.wgt'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: [
                            'css/**/*',
                            'doc/**/*',
                            'images/**/*',
                            'js/**/*',
                            'lib/**/*',
                            'index.html',
                            'config.xml'
                        ]
                    }
                ]
            }
        },

        clean: ['build'],

        replace: {
            version: {
                overwrite: true,
                src: ['src/config.xml'],
                replacements: [{
                    from: /version=\"[0-9]+\.[0-9]+\.[0-9]+(-dev)?\"/g,
                    to: 'version="<%= pkg.version %>"'
                }]
            }
        },

        jscs: {
            src: 'src/js/**/*',
            options: {
                config: ".jscsrc"
            }
        },

        jshint: {
            options: {
                jshintrc: true
            },
            all: {
                files: {
                    src: ['src/js/**/*', '!src/test/fixtures/']
                }
            },
            grunt: {
                options: {
                    jshintrc: '.jshintrc-node'
                },
                files: {
                    src: ['Gruntfile.js']
                }
            }
        },

        jasmine: {
          test: {
            src: ['src/js/*.js'],
            options: {
              specs: 'src/test/js/*Spec.js',
              helpers: ['src/test/helpers/*.js'],
              vendor: ['bower_components/jquery/dist/jquery.js',
                'bower_components/adapter.js/src/adapter.js',
                'bower_components/kurento-utils/js/kurento-utils.js',
                'bower_components/bootstrap/dist/js/bootstrap.js',
                'bower_components/mock-socket/dist/mock-socket.js',
                'src/test/vendor/*.js']
            }
          },

          coverage: {
            src: '<%= jasmine.test.src %>',
            options: {
              helpers: '<%= jasmine.test.options.helpers %>',
              specs: '<%= jasmine.test.options.specs %>',
              vendor: '<%= jasmine.test.options.vendor %>',
              template: require('grunt-template-jasmine-istanbul'),
              templateOptions : {
                coverage: 'build/coverage/json/coverage.json',
                report: [
                  {type: 'html', options: {dir: 'build/coverage/html'}},
                  {type: 'cobertura', options: {dir: 'build/coverage/xml'}},
                  {type: 'text-summary'}
                ]
              }
            }
          }
        },

    });

    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-jscs");
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.registerTask('test', ['jasmine:coverage']);
    grunt.registerTask('default', [
        'jshint:grunt',
        'jshint',
        'jscs',
        'bower:install',
        'replace:version',
        'compress:widget'
    ]);

};
