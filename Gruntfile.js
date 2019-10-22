'use string';

module.exports = (grunt) => {
  // eslint-disable-next-line global-require
  require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks

  grunt.initConfig({
    eslint: {
      target: ['./lib/**/*.js'],
    },
  });

  grunt.registerTask('default', ['eslint']);
};
