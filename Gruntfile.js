

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    cssmin: {
      combine: {
        files: {
          'public/css/styles.min.css': [
            '_public/css/syntax.css', 
            '_public/css/poole.css', 
            '_public/css/lanyon.css', 
            '_public/css/custom.css', 
          ]
        }
      }
    },

    htmlmin: {
      prod: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true,
          removeEmptyElements: true
        },
        files: [
          {
            expand: true,     // Enable dynamic expansion.
            cwd: '_site/',      // Src matches are relative to this path.
            src: ['**/*.html'], // Actual pattern(s) to match.
            dest: '_site/'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');

  // Default task(s).
  grunt.registerTask('default', ['cssmin']);

};