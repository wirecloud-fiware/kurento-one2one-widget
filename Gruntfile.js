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


var bower = require('bower');

module.exports = function (grunt) {

  'use strict';

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    bower: {
      install: {
        options: {
          layout: function(type, component, source) {
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

    jshint: {
      all: ['src/js/**/*']
    }

  });

  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-text-replace');

  grunt.registerTask('default', [
    'bower:install',
    'replace:version',
    'compress:widget'
  ]);

};
