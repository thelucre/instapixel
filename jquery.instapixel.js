/***********************************************
 InstaPIXEL jQuery Plugin
 Author: 	Eric Howard
 URL: 		http://www.thelucre.com
 GitHub:	https://github.com/thelucre/instapixel
 Veriosn:	v0.0.4	  

 Settings:
 - 'debug' 							[true] false, will output information/errors to the console
 - 'imageURL'						['.jpg'] image url to pixelate and draw to the canvas element
 - 'aspectRatio'				true [false], will maintain the image aspect ratio to the canvas size
 - 'startingPixelSize'	[10], initial size of the pixel drawn, relative to the original image dimensions
 - 'resizeCanvas'				[true] false, will resie the canvas to the passed in canvas size

 Event Triggers:
 - 'imageLoaded'		the image has been loaded to memory, check parameter success to confirm
 - 'imageLoading'		the plugin is loading the current image
 - 'imageParsing'		the image pixels are being parsed 
 - 'imageParsed'		the image pixels have been parsed
 ***********************************************/
(function($) {

	$.fn.instapixel = function( options ) {
		// CONSTANTS
		var INSTAPIXEL = 'InstaPIXEL'
		,	MSG_NOT_CANVAS_ELEMENT = 'The element is not of type <CANVAS>'
		,	MSG_TYPE_ERROR = 'ERROR'
		,	MSG_TYPE_INFO = 'INFO'
		,	MSG_INSTAPIXEL_STARTED = "InstaPIXEL plugin started on element."
		,	MSG_IMAGE_LOAD_ATTEMPT = 'Attempting to load image.'
		,	MSG_IMAGE_LOAD_ERROR = 'Image could not be loaded.'
		,	MSG_IMAGE_LOADED = 'Image successfully loaded.'
		,	MSG_CANVAS_NOT_SUPPORTED = 'The <CANVAS> element is not supported in this browser.';

		// DEFAULT SETTINGS
		var defaults = {
			'debug': 							true 
		,	'imageURL': 					'.jpg' // some dummy
 		,	'aspectRatio': 				false
 		,	'startingPixelSize': 	10
 		,	'resizeCanvas': 			'true' 
		};
		var options = $.extend({}, defaults, options); 
		var imageURL			// stores the loaded image
		,	ctx 						// ctx of the displayed canvas
		,	canv 						// displayed canvas element
		,	tmpcanv 				// buffer canvas for reading pixels
		,	tmpctx; 				// buffer context for reading pixels 
		var self = this; 	// globalized within plugin scope

		message( MSG_TYPE_INFO, MSG_INSTAPIXEL_STARTED, this.selector);

		if(!meetsRequirements()) {
			return;
		}

		canv = this[0];
		ctx = canv.getContext('2d');
		loadImage(options.imageURL);

		// UTILITY FUNCTIONS
		function loadImage( imgurl ) {
			image = new Image;
			image.onload = function() {
				if ('naturalHeight' in this) {
					if (this.naturalHeight + this.naturalWidth === 0) {
						this.onerror();
						return;
					}
				} else if (this.width + this.height == 0) {
					this.onerror();
					return;
				}
				resizeCanvas();
				ctx.drawImage(this, 0, 0, canv.width, canv.height);
				message( MSG_TYPE_INFO, MSG_IMAGE_LOADED, this.src );
				self.trigger("imageLoaded", true);
			};
			image.onerror = function() {
				message( MSG_TYPE_ERROR, MSG_IMAGE_LOAD_ERROR, this.src );
				self.trigger("imageLoaded", false);
			};
			image.src = imgurl;
			message( MSG_TYPE_INFO, MSG_IMAGE_LOAD_ATTEMPT, image.src );
		}

		function message( type, msg, info) {
			if(options.debug) {
				info ? info = " [ " + info + " ] " : info = '';
				console.log( INSTAPIXEL + " " + type + " : " + msg + info );
			}
		}

		function isCanvasSupported(){
			var elem = document.createElement('canvas');
			return !!(elem.getContext && elem.getContext('2d'));
		}

		function resizeCanvas() {
			if(options.resizeCanvas) {
				canv.width = image.width;
				canv.height = image.height;
			}
		}

		function meetsRequirements() {
			if(!isCanvasSupported()) {
				message( MSG_TYPE_ERROR, MSG_CANVAS_NOT_SUPPORTED );
				return false;
			}

			if(!self.is("canvas")) {
				message( MSG_TYPE_ERROR, MSG_NOT_CANVAS_ELEMENT );
				return false;
			}

			return true;
		}
	}

}(jQuery));