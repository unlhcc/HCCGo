module.exports = function(grunt) {

  var destinationFolder = './dist';

  grunt.initConfig({

    nodewebkit: {
       options: {
       	build_dir: './webkitbuilds',
	platforms: ['osx','linux','win'],
      	 mac: true,
         version: '0.12.2'
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
        command: 'open webkitbuilds/HCCGo/osx64/HCCGo.app'
      }
    },
    
    bower: {
      install: {
        options: {
          targetDir: 'src/lib',
          layout: 'byType',
          install: true,
          verbose: true
        }
      }
    }
    
  });

  grunt.loadNpmTasks('grunt-node-webkit-builder');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-bower-task');

  grunt.registerTask('default', ['less', 'bower', 'nodewebkit']);
  grunt.registerTask('run', ['less', 'bower', 'nodewebkit', 'shell:start_webkit'])


};
