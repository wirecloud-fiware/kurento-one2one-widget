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
            'default': {
                options: {
                    archive: '<%= pkg.name %>-v<%= pkg.version %>.zip'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'widget',
                        dest: '.',
                        src: [
                            'config.xml',
                            'index.html',
                            'static/**',
                            'bower_components/bootstrap/dist/**/*',
                            'bower_components/fontawesome/css/*',
                            'bower_components/fontawesome/fonts/*',
                            'bower_components/jquery/dist/*',
                            'bower_components/kurento-utils/js/*'
                        ]
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', ['compress:default']);

};
