/*!
 *   Copyright 2014 CoNWeT Lab., Universidad Politecnica de Madrid
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

module.exports = function(grunt) {

    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

    compress: {
      widget: {
        options: {
          mode: 'zip',
          archive: 'build/<%= pkg.vendor %>_<%= pkg.name %>_<%= pkg.version %>-dev.wgt'
        },
        files: [
          {expand: true, src: ['lib/**/*', 'config.xml', 'index.html', 'js/**/*', 'css/**/*', 'images/**/*'], cwd: 'src'},
          {expand: true, src: ['css/bootstrap.min.css', 'js/bootstrap.min.js'], dest:'lib', cwd: 'src/bower_components/bootstrap/dist'},
          {expand: true, src: ['css/font-awesome.min.css'], dest:'lib', cwd: 'src/bower_components/fontawesome'},
          {expand: true, src: ['fonts/**/*'], dest:'lib', cwd: 'src/bower_components/fontawesome'},
          {expand: true, src: ['jquery.min.js'], dest:'lib/js', cwd: 'src/bower_components/jquery/dist'},
          {expand: true, src: ['js/kurento-utils.min.js'], dest:'lib', cwd: 'src/bower_components/kurento-utils'}
        ]
      }
    },

    clean: ['build'],

    replace: {
      version: {
        src: ['src/config.xml'],
        overwrite: true,
        replacements: [{
          from: /version=\"[0-9]+\.[0-9]+\.[0-9]+(-dev)?\"/g,
          to: 'version="<%= pkg.version %>"'
        }]
      }
    },

    jshint: {
      all: ['src/js/**/*', 'src/test/**/*', 'Gruntfile.js', '!src/test/fixtures/']
    },


    });

    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.registerTask('zip', 'compress:widget');
    grunt.registerTask('version', ['replace:version']);

    grunt.registerTask('default', ['version', 'zip']);

};
