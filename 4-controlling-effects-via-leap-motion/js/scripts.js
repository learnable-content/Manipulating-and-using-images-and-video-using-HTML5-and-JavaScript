var video = document.getElementById('our-video'),
    canvas = document.getElementById('our-canvas'),
    canvasWidth = Math.floor(canvas.clientWidth),
    canvasHeight = Math.floor(canvas.clientHeight),
    context = canvas.getContext('2d'),
    filter = window.location.hash.split('#')[1],
    requestFrame,
    minThreshold,
    maxThreshold; // we store our requestanimationframe in here so we can stop and start it again

window.requestAnimFrame = (function() {
  return window.requestAnimationFrame       ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         function(callback) {
           window.setTimeout(callback, 1000 / 60);
         };
})();

video.addEventListener('play', function() {
  draw(video, context, canvasWidth, canvasHeight, filter);
}, false);

Leap.loop({background: true}, {
  hand: function(hand) {
    var pinchStrength = hand.pinchStrength.toPrecision(2),
        rotation = -1 * (hand.roll() * (180 / Math.PI) - 180);

    console.log(hand.frame.hands.length);

    if (hand.frame.hands.length > 1) {
      if (hand.type == 'left') {
        minThreshold = pinchStrength * 255;
      } else {
        maxThreshold = pinchStrength * 255;
      }
      
      changeFilter('thresholdluminance', {min: minThreshold, max: maxThreshold});
    } else if (hand.frame.hands.length == 1) {
      if (rotation > 130) {
        changeFilter('turnred');
      } else if (rotation > 90) {
        changeFilter('turnblue');
      } else if (rotation > 0) {
        changeFilter('turngreen');
      }
    }
  }
});

function changeFilter(filter, options) {
  cancelAnimationFrame(requestFrame);
  draw(video, context, canvasWidth, canvasHeight, filter, options);
}

draw(video, context, canvasWidth, canvasHeight, filter);

function draw(v, c, w, h, filter, options) {
  var imageData,
    data,
    finalData = [];

  if (v.paused || v.ended) return false;
  
  c.drawImage(v,0,0,w,h);

  imageData = c.getImageData(0,0,w,h);

  data = imageData.data;
  for (var i = 0; i < data.length; i+=4) {
    var red = data[i],
        green = data[i+1],
        blue = data[i+2];
    
    switch (filter) {
      case undefined:
        break;
      case 'greyscale':
        green = red;
        blue = red;
        break;
      case 'blackandwhite':
        var average = (red + green + blue) / 3;
        if (average < 128) red = green = blue = 0;
        else red = green = blue = 255;
        break;
      case 'turnred':
        green = 0;
        blue = 0;
        break;
      case 'turngreen':
        red = 0;
        blue = 0;
        break;
      case 'turnblue':
        red = 0;
        green = 0;
        break;
      case 'turncyan':
        red = 0;
        break;
      case 'turnpink':
        green = 0;
        break;
      case 'turnyellow':
        blue = 0;
        break;
      case 'threshold':
        if (options) {
          if (options.min) {
            if (red < options.min) red = 0;
            if (green < options.min) green = 0;
            if (blue < options.min) blue = 0;
          } if (options.max) {
            if (red > options.max) red = 255;
            if (green > options.max) green = 255;
            if (blue > options.max) blue = 255;
          }
        }
        break;
      case 'luminance':
        // http://www.w3.org/TR/AERT#color-contrast
        var luminance = ((red * 299) + (green * 587) + (blue * 114)) / 1000; // Gives a value from 0 - 255
        if (options) {
          if (options.max && (luminance > options.max)) {
            red = options.max;
            green = options.max;
            blue = options.max;
          }
          if (options.min && (luminance < options.min)) {
            red = options.min;
            green = options.min;
            blue = options.min;
          }
        }
        break;
      case 'thresholdluminance':
        var luminance = ((red * 299) + (green * 587) + (blue * 114)) / 1000; // Gives a value from 0 - 255
        if (options) {
          if (options.max && (luminance > options.max)) {
            red = 255;
            green = 255;
            blue = 255;
          }
          if (options.min && (luminance < options.min)) {
            red = 0;
            green = 0;
            blue = 0;
          }
        }
        break;
      case 'blackandwhiteluminance':
        var luminance = ((red * 299) + (green * 587) + (blue * 114)) / 1000; // Gives a value from 0 - 255
        red = luminance
        green = luminance
        blue = luminance;
        alpha = 255;

        break;
      case 'darkness':
        if (options) {
          if (options.min) {
            if (red > options.min) red = options.min;
            if (green > options.min) green = options.min;
            if (blue > options.min) blue = options.min;
          }
        }
        break;
    }
    data[i] = red;
    data[i+1] = green;
    data[i+2] = blue;
  }
  imageData.data = data;

  c.putImageData(imageData, 0, 0);

  requestFrame = requestAnimFrame(function() {
    draw(v,c,w,h,filter,options);
  });
}