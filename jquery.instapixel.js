/***********************************************
 InstaPIXEL - jQuery Plugin
 Author:      Eric Howard - http://www.thelucre.com
 URL:         http://www.instapixel.org
 GitHub:      https://github.com/thelucre/instapixel
 Version:     v0.2.0     
 Description: Pixelates an image and draws onto the selected canvas element
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
 - 'pixelSize'          [10], initial size of the pixel drawn, relative to the original image dimensions
 - 'resizeCanvas'       [true] false, will resize the canvas to the lodaed image size

 Event Triggers:    
 - 'imageLoaded'        the image has been loaded to memory, check parameter success to confirm
 - 'imageLoading'       the plugin is loading the current image
 - 'imageParsing'       the image pixels are being parsed 
 - 'imageParsed'        the image pixels have been parsed
 - 'hiResProcessing'    the hi res version of being built into a new Image element
 - 'hiResProcessed'     the hi res image version has been processed into a new Image element

 Public Methods:
 - setSize( size )             sets the size of the pixelation to draw, does not redraw
 - getSize()                   gets the size of the pixels being drawn
 - setImage( URL, [redraw] )   sets the image url with the option to reload and draw the image
 - getImage( )                 gets the currently loaded image object (src will if base64...)
 - redraw( size )              redraws the canvas at a certain size, or the current size in no parameter given
 - clear()                     clears the current canvas
 - output( inches )            returns an a dataURI image of the current canvas scaled to the width in inches @ 300 dpi

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
        ,   MSG_HI_RES_OUTPUT_INVALID = 'Hi res processing aborted, image size may be too large for browser.'
        ,   MSG_HI_RES_OUTPUT_REQUESTED = 'Hi res output Image object requested.'
        ,   MSG_HI_RES_OUTPUT_DELIVERED = 'Hi res output Image object successfully rendered.'
        ,   MSG_SIZE_SET_TOOSMALL = 'Set size too low. Defaulting size to 1.'
        ,   MSG_SIZE_SET_TOOLARGE = 'Set size larger than canvas. Defaulting to max available.'
        ,   MSG_SIZE_SET_SUCCESS = 'Pixel size set.'
        ,   MSG_PIXEL_DATA_PARSING = 'Attempting to parse pixel data to array.'
        ,   MSG_PIXEL_DATA_PARSED = 'Pixel data parsed to array.'
        ,   MSG_DRAWING_TO_CANVAS = 'Drawing to canvas element.'
        ,   MSG_HI_RES_SIZE_INVALID = 'Output size not a number, zero, or negative number.'
        ,   MSG_CANVAS_CLEARED = 'Canvas pixels have been cleared.'
        ,   MSG_CANVAS_RESIZED = 'Canvas resized.'
        ,   MSG_IMAGE_DIMENSIONS = 'Original image dimensions read.'
        ,   MSG_IMAGE_SET = 'Image set.'
        ,   HI_RES_DPI_CONVERSION = 300/72      // scale conversion from 72dpi to 300dpi 
        ;
        // GLOBALS
        var image       // stores the loaded image
        ,   ctx         // ctx of the displayed canvas
        ,   canv        // displayed canvas element
        ,   tmpcanv     // buffer canvas for reading pixels
        ,   tmpctx      // buffer context for reading pixels 
        ,   pix         // holds pixel color data for the current image
        ,   _size       // private, size used for pixelation amount
        ,   _imgURL     // private, url of image that has been loaded (or attempted to load)
        ;
        // DEFAULT SETTINGS
        var defaults = {
            'debug':         true   // displays processing message and errors
        ,   'imgURL':        '.jpg' // some dummy value, will not load properly
        ,   'pixelSize':     10     // default size of pixelation, relative to the original image size
        ,   'resizeCanvas':  false  // will resize the calling canvas element to the loaded image size
        }
        var plugin = this;          // globalize the plugin 

        plugin.settings = {}

        var $element = $(element),
             element = element;

        plugin.init = function() {
            plugin.settings = $.extend({}, defaults, options);
            plugin.setSize(plugin.settings.pixelSize);
            plugin.setImage( plugin.settings.imgURL );
            message( MSG_TYPE_INFO, MSG_INSTAPIXEL_STARTED, this.selector);
            if(!meetsRequirements()) {  // canvas supported, element is of type canvas
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
        // redraws the pixelated canvas after setting the size passed in.
        plugin.redraw = function( size ) {
            if(plugin.setSize( size )) {
                var pixelData = drawPixelatedToCanvas();
                if(pixelData)
                    ctx.putImageData(pixelData, 0, 0);
            }
        }

        // clean slate, clears the canvas to white.
        plugin.clear = function( ) {
            canv.width = canv.width;
            message( MSG_TYPE_INFO, MSG_CANVAS_CLEARED );
        }

        // creates a hi res image (300dpi) where the canvas element's width will be scaled 
        // to the size passed for the inches parameter
        plugin.output = function( inches ) {
            message( MSG_TYPE_INFO, MSG_HI_RES_OUTPUT_REQUESTED, inches + ' inches');
            $(element).trigger('hiResProcessing');
            var pixelData = drawPixelatedToCanvas( inches );
            var hiResCanvas = document.createElement('canvas')
            ,   hiResCtx    = hiResCanvas.getContext('2d');

            if(!pixelData || !pixelData.width || !pixelData.height) {
                message( MSG_TYPE_ERROR, MSG_HI_RES_OUTPUT_INVALID, inches + " inches requested" );
                return;
            }
            hiResCanvas.width = pixelData.width;
            hiResCanvas.height = pixelData.height;
            hiResCtx.putImageData(pixelData, 0, 0);
            var dataURL = hiResCanvas.toDataURL("image/png");
            message( MSG_TYPE_INFO, MSG_HI_RES_OUTPUT_DELIVERED, inches + ' inches');
            $(element).trigger('hiResProcessed');
            return dataURL;
        }

        /*************************************************
         * PRIVATE METHODS
         *************************************************/
        /*********************************************
         * loads the pix variable with pixel colors from 
         * the buffered tmpcanv canvas
         *********************************************/
        var getPixelDataArray = function ( ) {
            message( MSG_TYPE_INFO, MSG_PIXEL_DATA_PARSING );
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
            message( MSG_TYPE_INFO, MSG_PIXEL_DATA_PARSED );
        } 

        /********************************************
         * draw the pixelated image to the element 
         * scaled to size. if inches is passed, 
         * the output will be scaled to the number
         * of inches wide @ 300dpi
         ********************************************/
        var drawPixelatedToCanvas = function( inches ) {
            if(typeof(pix) === undefined || !pix) { 
                message( MSG_TYPE_ERROR, MSG_NO_IMAGE_LOADED );
                return;
            }
            message( MSG_TYPE_INFO, MSG_DRAWING_TO_CANVAS);

            var newcanv = document.createElement('canvas');
            var newctx = newcanv.getContext('2d');
            var canvScale;
            var tileSize = plugin.getSize();
            var canvTile = tileSize;

            if(inches) {
                if(isNaN(inches) || inches <= 0) {
                    message( MSG_TYPE_ERROR, MSG_HI_RES_SIZE_INVALID)
                    return false;
                }
                newcanv.width = inches / (canv.width / 72) * canv.width * HI_RES_DPI_CONVERSION;
                newcanv.height = (inches * (canv.height / canv.width)) / (canv.width / 72) * canv.width * HI_RES_DPI_CONVERSION;
                canvScale = newcanv.width / canv.width; 
                canvTile *= canvScale;
            } else {
                newcanv.width = canv.width;
                newcanv.height = canv.height;
                canvScale = canv.width / tmpcanv.width; 
            }
            // number of pixels in row or column 
            var tiles = { 'x': Math.floor(newcanv.width / canvTile) 
                        , 'y': Math.floor(newcanv.height / canvTile) };      
            // pad values used to make the number of square tiles even given any size canvas
            // so there will appear to be a perfect fit for all squares drawn
            var pad = { 'x': Math.floor(newcanv.width % canvTile)
                      , 'y': Math.floor(newcanv.height % canvTile) };  // the total extra space on the canvas
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
            var pixelData = newctx.getImageData(0,0,newcanv.width, newcanv.height);
            $(element).trigger("imageParsed");
            return pixelData;
        } 

        // UTILITY FUNCTIONS
        /********************************************
         * attempts to load an image URL.
         * if successful, the images will be parsed
         * for pixelation. if unsuccessful, error
         ********************************************/
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

        /********************************************
         * if debug mode on, all messages will be 
         * written to the console
         ********************************************/
        var message = function( type, msg, info) {
            if(plugin.settings.debug) {
                info ? info = " [ " + info + " ] " : info = '';
                console.log( INSTAPIXEL + " " + type + " : " + msg + info );
            }
        }

        /********************************************
         * checks if the canvas elemetn is legal
         ********************************************/
        var isCanvasSupported = function(){
            var elem = document.createElement('canvas');
            return !!(elem.getContext && elem.getContext('2d'));
        }

        /********************************************
         * resizes te buffer (tmpcanv) canvas and
         * if the resizeCanvas setting is true, also
         * the element selected by the plugin to the 
         * loaded image dimensions
         ********************************************/
        var resizeCanvases = function() {
            if(plugin.settings.resizeCanvas) {
                canv.width = image.width;
                canv.height = image.height;
                message( MSG_TYPE_INFO, MSG_CANVAS_RESIZED, canv.width + " x " + canv.height );
            }
            tmpcanv.width = image.width;
            tmpcanv.height = image.height;
            message( MSG_TYPE_INFO, MSG_IMAGE_DIMENSIONS, image.width + " x " + image.height );
        }

        /********************************************
         * checks for browser support of the canvas 
         * element and verifies that the element
         * selected is, in fact, of the canvas type
         ********************************************/
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
            if( size <= 0 ) {
                message( MSG_TYPE_INFO, MSG_SIZE_SET_TOOSMALL, size );
                size = 1;
            }
            if( size > canv.width ) {
                message( MSG_TYPE_INFO, MSG_SIZE_SET_TOOLARGE, size );
                size = canv.width;
            }
            if( size > canv.height ) {
                message( MSG_TYPE_INFO, MSG_SIZE_SET_TOOLARGE, size );
                size = canv.height;
            }
            plugin._size = Math.floor(size); // should be an integer value
            message( MSG_TYPE_INFO, MSG_SIZE_SET_SUCCESS, size );
            return true;
        }

        plugin.setImage = function( imgURL, redraw ) {
            if(imgURL == '' || imgURL === undefined) {
                message(MSG_TYPE_ERROR, MSG_IMAGE_PATH_INVALID, imgURL);
                return;
            }
            plugin._imgURL = imgURL;
            message( MSG_TYPE_INFO, MSG_IMAGE_SET, imgURL );
            if(redraw) { loadImage( imgURL ); }
        }

        plugin.getImage = function() {
            return plugin._imgURL;
        }

        // seriously, start it up.
        plugin.init();
    }

    $.fn.instapixel = function(options) {
        /********************************************
         * sets the plugin to the selected element's
         * data value. this creates a state-ful 
         * presence for access to the public methods
         * and attributes. kinda hacky.
         * thanks to: http://stefangabos.ro/jquery/jquery-plugin-boilerplate-revisited/
         ********************************************/
        return this.each(function() {
            if (undefined == $(this).data('instapixel')) {
                var plugin = new $.instapixel(this, options);
                $(this).data('instapixel', plugin);
            }
        });
    }
})(jQuery);