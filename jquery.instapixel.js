/***********************************************
 InstaPIXEL jQuery Plugin
 Author:    Eric Howard - http://www.thelucre.com
 URL:       http://www.instapixel.org
 GitHub:    https://github.com/thelucre/instapixel
 Version:   v0.1.2     
 
*****************************************************************************************
 The MIT License (MIT)

    Copyright (c) 2013 Eric Howard

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
*****************************************************************************************

 Settings:
 - 'debug'              [true] false, will output information/errors to the console
 - 'imgURL'             ['.jpg'] image url to pixelate and draw to the canvas element
 - 'aspectRatio'        true [false], will maintain the image aspect ratio to the canvas size
 - 'startingPixelSize'  [10], initial size of the pixel drawn, relative to the original image dimensions
 - 'resizeCanvas'       [true] false, will resize the canvas to the passed in canvas size

 Event Triggers:
 - 'imageLoaded'        the image has been loaded to memory, check parameter success to confirm
 - 'imageLoading'       the plugin is loading the current image
 - 'imageParsing'       the image pixels are being parsed 
 - 'imageParsed'        the image pixels have been parsed

 Public Methods:
 - setSize( size )             sets the size of the pixelation to draw, does not redraw
 - getSize()                   gets the size of the pixels being drawn
 - setImage( URL, [redraw?] )  sets the image url with the option to reload and draw the image
 - getImage( )                 gets the currently loaded image url (might be messy if base64...)
 - redraw( size )              redraws the canvas at a certain size, or the current size in no parameter given
 - clear()                     clears the current canvas
 - output( w, h, dpi )         returns an image object of the current canvas at WxH inches x dpi pixels 

 TODO
 X fix any references to 612 pixels
 _ configure draw method for scaling out for hi res
 X experiment with dettaching elements for faster canvas draws
 _ reset() function to clear all global instapixel vars (img, pix, tmpcnv, tmpctx, etc)
 _ aspectRatio code to draw the image
 _ set triggers for output functions processing / complete
 _ constrain pixel size to > 0 and < width || height (floor too, for floats)
 _ if size == 1, jsut draw the original image
 _ set debug message for image dimensions, canvas dimensions, all triggers
 ***********************************************/


(function($) {

    $.instapixel = function(element, options) {

        // CONSTANTS
        var INSTAPIXEL = 'InstaPIXEL'
        ,   MSG_TYPE_ERROR = 'ERROR'
        ,   MSG_TYPE_INFO = 'INFO'
        ,   MSG_NOT_CANVAS_ELEMENT = 'The element is not of type <CANVAS>'
        ,   MSG_INSTAPIXEL_STARTED = "InstaPIXEL plugin started on element."
        ,   MSG_IMAGE_LOAD_ATTEMPT = 'Attempting to load image.'
        ,   MSG_IMAGE_LOAD_ERROR = 'Image could not be loaded.'
        ,   MSG_IMAGE_LOADED = 'Image successfully loaded.'
        ,   MSG_CANVAS_NOT_SUPPORTED = 'The <CANVAS> element is not supported in this browser.'
        ,   MSG_IMAGE_PATH_INVALID = 'Image path is not in a valid format.'
        ,   MSG_NO_IMAGE_LOADED = 'No image has been loaded to the InstaPIXEL object.'
        ,   HI_RES_DPI_CONVERSION = 300/72;

        // GLOBALS
        var image       // stores the loaded image
        ,   ctx         // ctx of the displayed canvas
        ,   canv        // displayed canvas element
        ,   tmpcanv     // buffer canvas for reading pixels
        ,   tmpctx      // buffer context for reading pixels 
        ,   pix         // holds pixel data for the current image
        ;

        // DEFAULT SETTINGS
        var defaults = {
            'debug':         true 
        ,   'imgURL':        '.jpg' // some dummy
        ,   'imgObject':     null
        ,   'aspectRatio':   false
        ,   'pixelSize':     10
        ,   'resizeCanvas':  false
        }

        var plugin = this;      // globalize the plugin 

        plugin.settings = {}
        var _size
        ,   _imgURL;

        var $element = $(element),
             element = element;

        plugin.init = function() {
            plugin.settings = $.extend({}, defaults, options);

            plugin.setSize(plugin.settings.pixelSize);
            plugin.setImage( plugin.settings.imgURL );

            message( MSG_TYPE_INFO, MSG_INSTAPIXEL_STARTED, this.selector);

            if(!meetsRequirements()) {
                return;
            }

            canv = element;
            ctx = canv.getContext('2d');
            tmpcanv = $(element).clone()[0];
            tmpctx = tmpcanv.getContext('2d');
            loadImage( plugin._imgURL );
        }

        /*************************************************
         * PUBLIC METHODS
         *************************************************/
        plugin.redraw = function( size ) {
            // code goes here
            if(plugin.setSize( size )) {
                var pixelData = drawPixelatedToCanvas();
                ctx.putImageData(pixelData, 0, 0);
            }
        }

        plugin.clear = function( ) {
            // code goes here
            canv.width = canv.width;
        }

        plugin.output = function( inches ) {
            var pixelData = drawPixelatedToCanvas( inches );
            var hiResCanvas = document.createElement('canvas')
            ,   hiResCtx    = hiResCanvas.getContext('2d');
            hiResCanvas.width = pixelData.width;
            hiResCanvas.height = pixelData.height;
            hiResCtx.putImageData(pixelData, 0, 0);
            var dataURL = hiResCanvas.toDataURL("image/png");
            return dataURL;
        }

        /*************************************************
         * PRIVATE METHODS
         *************************************************/
         // MAIN PIXEL PROCESSING
        /*********************************************
         * loads the pix vairable with pixel data from 
         * the buffered canvimg canvas
         *********************************************/
        var getPixelDataArray = function ( ) {
            $(element).trigger("imageParsing");
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

        var drawPixelatedToCanvas = function( inches ) {
            if(typeof(pix) === undefined || !pix) { 
                message( MSG_TYPE_ERROR, MSG_NO_IMAGE_LOADED );
                return;
            }

            var newcanv = document.createElement('canvas');
            var newctx = newcanv.getContext('2d');
            var canvScale;
            if(inches) {
                newcanv.width = inches / (canv.width / 72) * canv.width * HI_RES_DPI_CONVERSION;
                newcanv.height = canv.height * ( newcanv.width / canv.width );
                canvScale = newcanv.width / canv.width; 
            } else {
                newcanv.width = canv.width;
                newcanv.height = canv.height;
                canvScale = canv.width / tmpcanv.width; 
            }
        
            var tileSize = plugin.getSize();

            // size of the tile to be drawn
            var canvTile = tileSize * canvScale;

            // number of pixels in row or column 
            var tiles = { 'x': Math.floor(tmpcanv.width / tileSize) 
                        , 'y': Math.floor(tmpcanv.height / tileSize) };      

            // pad values used to make the number of square tiles even given any size canvas
            // so there will appear to be a perfect fit for all squares drawn
            var pad = { 'x': newcanv.width % canvTile
                      , 'y': newcanv.height % canvTile };  // the total extra space on the canvas

            var padamt = {  'x' : pad.x / tiles.x
                        ,   'y' : pad.y / tiles.y };            // the padding per square that will be added to both sides

            for(var x = 0; x < tiles.x; x++) {
              for(var y = 0; y < tiles.y; y++) { 
                    var colorCoords = { 'x': Math.floor(x * tileSize + tileSize / 2)
                                      , 'y': Math.floor(y * tileSize + tileSize / 2) };

                    if(colorCoords.x < 0 ) colorCoords.x = 0;
                    if(colorCoords.y < 0) colorCoords.y = 0;
                    if(colorCoords.x > image.width -1 ) colorCoords.x = image.width -1;
                    if(colorCoords.y > image.height -1) colorCoords.y = image.height -1;
                    if(pix[colorCoords.y] && pix[colorCoords.y][colorCoords.x]) {
                        newctx.fillStyle = pix[colorCoords.y][colorCoords.x];
                        newctx.fillRect(   
                            Math.floor(x * canvTile + x * padamt.x), 
                            Math.floor(y * canvTile + y * padamt.y), 
                            Math.floor((x * canvTile + x * padamt.x ) + canvTile + padamt.x),
                            Math.floor((y * canvTile ) + canvTile + padamt.y ));
                    }
                }
            }

            var pixelimage = newctx.getImageData(0,0,newcanv.width, newcanv.height);
            $(element).trigger("imageParsed");
            return pixelimage;
        }

        // UTILITY FUNCTIONS
        var loadImage = function( imgURL ) {
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
                $(element).trigger("imageLoaded", true);
                getPixelDataArray( );
                plugin.redraw( plugin.getSize() );
            };
            image.onerror = function() {
                message( MSG_TYPE_ERROR, MSG_IMAGE_LOAD_ERROR, this.src );
                $(element).trigger("imageLoaded", false);
            };
            image.src = imgURL;
            message( MSG_TYPE_INFO, MSG_IMAGE_LOAD_ATTEMPT, image.src );
        }

        var message = function( type, msg, info) {
            if(plugin.settings.debug) {
                info ? info = " [ " + info + " ] " : info = '';
                console.log( INSTAPIXEL + " " + type + " : " + msg + info );
            }
        }

        var isCanvasSupported = function(){
            var elem = document.createElement('canvas');
            return !!(elem.getContext && elem.getContext('2d'));
        }

        var resizeCanvases = function() {
            if(plugin.settings.resizeCanvas) {
                canv.width = image.width;
                canv.height = image.height;
            }
            tmpcanv.width = image.width;
            tmpcanv.height = image.height;
        }

        var meetsRequirements = function() {
            if(!isCanvasSupported()) {
                message( MSG_TYPE_ERROR, MSG_CANVAS_NOT_SUPPORTED );
                return false;
            }

            if(!$(element).is("canvas")) {
                message( MSG_TYPE_ERROR, MSG_NOT_CANVAS_ELEMENT );
                return false;
            }

            return true;
        }

        /*************************************************
         * PROPERTIES / GETS & SETS
         *************************************************/
        plugin.getSize = function() {
            return _size;
        }

        plugin.setSize = function(size) {
            if(isNaN(size)) return false;
            _size = size;
            return true;
        }

        plugin.setImage = function( imgURL, redraw ) {
            if(imgURL == '' || imgURL === undefined) {
                message(MSG_TYPE_ERROR, MSG_IMAGE_PATH_INVALID, imgURL);
                return;
            }
            plugin._imgURL = imgURL;
            if(redraw) { loadImage( imgURL ); }
        }

        plugin.getImage = function() {
            return plugin._imgURL;
        }

        plugin.init();

    }

    $.fn.instapixel = function(options) {

        return this.each(function() {
            if (undefined == $(this).data('instapixel')) {
                var plugin = new $.instapixel(this, options);
                $(this).data('instapixel', plugin);
            }
        });

    }

})(jQuery);