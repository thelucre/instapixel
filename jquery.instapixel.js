/***********************************************
 InstaPIXEL jQuery Plugin
 Author: 	Eric Howard
 URL: 		http://www.thelucre.com
 GitHub:	https://github.com/thelucre/instapixel
 Version:	v0.0.5   	  

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
		,		MSG_TYPE_ERROR = 'ERROR'
		,		MSG_TYPE_INFO = 'INFO'
		,		MSG_NOT_CANVAS_ELEMENT = 'The element is not of type <CANVAS>'
		,		MSG_INSTAPIXEL_STARTED = "InstaPIXEL plugin started on element."
		,		MSG_IMAGE_LOAD_ATTEMPT = 'Attempting to load image.'
		,		MSG_IMAGE_LOAD_ERROR = 'Image could not be loaded.'
		,		MSG_IMAGE_LOADED = 'Image successfully loaded.'
		,		MSG_CANVAS_NOT_SUPPORTED = 'The <CANVAS> element is not supported in this browser.';

		// DEFAULT SETTINGS
		var defaults = {
			'debug': 							true 
		,	'imageURL': 					'.jpg' // some dummy
 		,	'aspectRatio': 				false
 		,	'startingPixelSize': 	10
 		,	'resizeCanvas': 			'true' 
		};
		var options = $.extend({}, defaults, options); 
		var image 				// stores the loaded image
		,	ctx 						// ctx of the displayed canvas
		,	canv 						// displayed canvas element
		,	tmpcanv 				// buffer canvas for reading pixels
		,	tmpctx	 				// buffer context for reading pixels 
		,	pix 						// holds pixel data for the current image
		;
		var self = this; 	// globalized within plugin scope

		message( MSG_TYPE_INFO, MSG_INSTAPIXEL_STARTED, this.selector);

		if(!meetsRequirements()) {
			return;
		}

		canv = this[0];
		ctx = canv.getContext('2d');
		tmpcanv = this.clone()[0];
		tmpctx = tmpcanv.getContext('2d');
		loadImage(options.imageURL);

		// MAIN PIXEL PROCESSING
		/*********************************************
		 * loads the pix vairable with pixel data from 
		 * the buffered canvimg canvas
		 *********************************************/
		function getPixelDataArray( ) {
			
			var imageData = tmpctx.getImageData(0, 0, image.width, image.height);
		  var data = imageData.data;
	    pix = { };
	    // iterate over all pixels based on x and y coordinates
	    for(var y = 0; y < image.height; y++) {
	      pix[y] = { };
	      // loop per row index
	      for(var x = 0; x < image.width; x++) {
	        var red = data[((image.width * y) + x) * 4];
	        var green = data[((image.width * y) + x) * 4 + 1];
	        var blue = data[((image.width * y) + x) * 4 + 2];
	        // push onto array
	        pix[y][x] = 'rgb(' + red + ',' + green + ',' + blue + ')';	
	      }
	    }
		} // end getPixelDataArray()

		function drawPixelatedToCanvas() {
			// amount to scale each pixel drawn for cnavas size
			var canvScale = canv.width / tmpcanv.width; // 0.490196078

			var tileSize = options.startingPixelSize;

			// size of the tile to be drawn
			var canvTile = tileSize * canvScale;

			// number of pixels in row or column (scaled for canvas size)
			var tiles = { 'x': Math.floor(tmpcanv.width / canvTile)	
			  		  	  ,	'y': Math.floor(tmpcanv.height / canvTile) };

			// pad values used to make the number of square tiles even given any size canvas
			// so there will appear to be a perfect fit for all squares drawn
			var pad = { 'x': canv.width % canvTile
			  				,	'y': canv.height % canvTile };	// the total extra space on the canvas

			var padamt = {	'x' : pad.x / tiles.x
						   			,	'y' : pad.y / tiles.y };			// the padding per square that will be added to both sides

			for(var x = 0; x < tiles.x; x++) {
			    for(var y = 0; y < tiles.y; y++) { 
			    //console.log(x + ", " + y);
					var colorCoords = { 'x': Math.floor(x * tileSize + tileSize / 2)
									 					,	'y': Math.floor(y * tileSize + tileSize / 2) };

					if(colorCoords.x <= 0 ) colorCoords.x = 1;
					if(colorCoords.y <= 0) colorCoords.y = 1;
					if(colorCoords.x > 612 -1 ) colorCoords.x = 612 -1;
					if(colorCoords.y > 612 -1) colorCoords.y = 612 -1;
					console.log(colorCoords.x + " , " + colorCoords.y);{}
					if(pix[colorCoords.y] && pix[colorCoords.y][colorCoords.x]) {
				        ctx.fillStyle = pix[colorCoords.y][colorCoords.x];
								ctx.fillRect(	Math.floor(x * canvTile + x * padamt.x), 
										Math.floor(y * canvTile + y * padamt.y), 
										Math.floor((x * canvTile + x * padamt.x ) + canvTile + padamt.x),
										Math.floor((y * canvTile ) + canvTile + padamt.y ));
					}
				}
			}
		}

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
				resizeCanvases();
				tmpctx.drawImage(this, 0, 0, canv.width, canv.height);
				message( MSG_TYPE_INFO, MSG_IMAGE_LOADED, this.src );
				self.trigger("imageLoaded", true);
				getPixelDataArray( );
				drawPixelatedToCanvas( );
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

		function resizeCanvases() {
			if(options.resizeCanvas) {
				canv.width = image.width;
				canv.height = image.height;
			}
			tmpcanv.width = image.width;
			tmpcanv.height = image.height;
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