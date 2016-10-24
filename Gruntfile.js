module.exports = function(grunt) {
  var destinationFolder = './dist';
  grunt.initConfig({
    less: {
      production: {
        options: {
          paths: ["HCCGo/app/css"]
        },
        files: {
          "HCCGo/app/css/application.css": "HCCGo/app/css/application.less"
        }
      }
    },
    shell: {
      start_electron: {
        command: 'cd HCCGo/ && npm start'
      },
      build_electron: {
        command: 'cd HCCGo/ && npm run-script packageWin'
      }
    },
    auto_install: {
      subdir: {
        options: {
          cwd: 'HCCGo/',
	  stdout: true,
	  stderr: true,
	  failOnError: true,
	  npm: '--development'
	}
      }
    },
    bower: {
      install: {
        options: {
          targetDir: 'HCCGo/app/lib',
          layout: 'byComponent',
          install: true,
          verbose: true,
          cleanTargetDir: false
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-auto-install');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.registerTask('default', ['less', 
                                 'bower', 
				 'auto_install']);
  grunt.registerTask('run', ['less', 
                             'bower', 
			     'auto_install', 
			     'shell:start_electron']);
  grunt.registerTask('package', ['less',
                                 'bower',
				 'auto_install',
				 'shell:build_electron']);
};
