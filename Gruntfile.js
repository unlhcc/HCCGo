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
      build_installer_windows: {
        command: 'cd HCCGo/ && npm run-script installerWin'
      },
	  build_electron_macos: {
	    command: 'cd HCCGo/ && npm run-script packageOsx'
	  },
    build_installer_macos: {
	    command: 'cd HCCGo/ && npm run-script installerOsx'
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
          'HCCGo/app/html/beta_notice.html': 'HCCGo/app/markdown/beta_notice.md',
          'HCCGo/app/html/tutorial_help.html': 'HCCGo/app/markdown/tutorial_help.md'
        }
      }
    },
    bowerInstall: {
 
      target: {
     
        // Point to the files that should be updated when 
        // you run `grunt bower-install` 
        src: [
          'HCCGo/**/*.html',   // .html support... 
          'HCCGo/index.html',   // .jade support... 
          'HCCGo/app/css/application.less'  // .scss & .sass support... 
        ],
     
        // Optional: 
        // --------- 
        cwd: '',
        dependencies: true,
        devDependencies: false,
        exclude: [],
        fileTypes: {},
        ignorePath: '',
        overrides: {}
      }
    },
    jsdoc: {
      dist: {
        src: ['HCCGo/app/js'],
        options: {
          destination: 'docs',
          configure: 'jsdoc.json',
          template: './node_modules/minami',
          tutorials: './dev-tutorials',
          readme: './README.md'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-bower-install');
  grunt.loadNpmTasks('grunt-auto-install');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-marked');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.registerTask('default', ['less',
                                 'bowerInstall',
				 'auto_install']);
  grunt.registerTask('run', ['less',
                             'bowerInstall',
                             'marked',
			     'auto_install',
			     'shell:start_electron']);
  grunt.registerTask('packageWin', ['less',
                                    'bowerInstall',
                                    'marked',
				    'auto_install',
				    'shell:build_electron_windows',
            'shell:build_installer_windows']);
  grunt.registerTask('packageOsx', ['less',
                                    'bowerInstall',
                                    'marked',
				    'auto_install',
				    'shell:build_electron_macos',
            'shell:build_installer_macos']);
  grunt.registerTask('packageNix', ['less',
                                    'bowerInstall',
                                    'marked',
				    'auto_install',
				    'shell:build_electron_linux']);
  grunt.registerTask('docs', ['jsdoc']);
};
