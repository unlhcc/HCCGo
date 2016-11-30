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
      build_electron_windows: {
        command: 'cd HCCGo/ && npm run-script packageWin'
      },
	  build_electron_macos: {
	    command: 'cd HCCGo/ && npm run-script packageOsx'
	  },
	  build_electron_linux: {
	    command: 'cd HCCGo/ && npm run-script packageNix'
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
    marked: {
      dist: {
        files: {
          'HCCGo/app/html/beta_notice.html': 'HCCGo/app/markdown/beta_notice.md'
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
  grunt.loadNpmTasks('grunt-marked');
  grunt.registerTask('default', ['less',
                                 'bower',
				 'auto_install']);
  grunt.registerTask('run', ['less',
                             'bower',
                             'marked',
			     'auto_install',
			     'shell:start_electron']);
  grunt.registerTask('packageWin', ['less',
                                    'bower',
                                    'marked',
				    'auto_install',
				    'shell:build_electron_windows']);
  grunt.registerTask('packageOsx', ['less',
                                    'bower',
                                    'marked',
				    'auto_install',
				    'shell:build_electron_macos']);  
  grunt.registerTask('packageNix', ['less',
                                    'bower',
                                    'marked',
				    'auto_install',
				    'shell:build_electron_linux']);
};
