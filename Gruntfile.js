module.exports = function(grunt) {

  var destinationFolder = './dist';

  grunt.initConfig({

    nodewebkit: {
       options: {
       	build_dir: './webkitbuilds',
      	 mac: true,
         version: '0.8.6'
       },
       src: ['src/**']

    },

    less: {
      production: {
        options: {
          paths: ["src/css"]

        },
        files: {
          "src/css/application.css": "src/css/application.less"
        }
      }
    },

    
    shell: {
      start_webkit: {
        command: 'open  webkitbuilds/HCCGo/osx/HCCGo.app'
      }
    }
  });

  grunt.loadNpmTasks('grunt-node-webkit-builder');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['less', 'nodewebkit']);
  grunt.registerTask('run', ['less', 'nodewebkit', 'shell:start_webkit'])


};
