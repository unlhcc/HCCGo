module.exports = function(grunt) {

  var destinationFolder = './dist';

  grunt.initConfig({

    nwjs: {
       options: {
       	build_dir: './webkitbuilds',
		platforms: ['osx','linux','win'],
		version: '0.12.3'
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
        command: 'start webkitbuilds/HCCGo/win64/HCCGo.exe'
      }
    },
    
    bower: {
      install: {
        options: {
          targetDir: 'src/lib',
          layout: 'byComponent',
          install: true,
          verbose: true,
		  cleanTargetDir: true
        }
      }
    }
    
  });

  grunt.loadNpmTasks('grunt-nw-builder');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-bower-task');

  grunt.registerTask('default', ['less', 'bower', 'nwjs']);
  grunt.registerTask('run', ['less', 'bower', 'nwjs', 'shell:start_webkit'])


};
