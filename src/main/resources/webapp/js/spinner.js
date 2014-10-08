var opts = {
  lines: 9, // The number of lines to draw
  length: 5, // The length of each line
  width: 2, // The line thickness
  radius: 6, // The radius of the inner circle
  corners: 0.4, // Corner roundness (0..1)
  rotate: 68, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#000', // #rgb or #rrggbb or array of colors
  speed: 1.6, // Rounds per second
  trail: 54, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: '50%', // Top position relative to parent
  left: '-10%' // Left position relative to parent
};
var target = document.getElementById('spinner');
var spinner = new Spinner(opts).spin(target);