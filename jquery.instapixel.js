/***********************************************

 InstaPIXEL jQuery Plugin
 Author: 	Eric Howard
 URL: 		http://www.thelucre.com
 Veriosn:	v0.0.3	  

 ***********************************************/
(function($) {

    $.fn.instapixel = function( imgurl ) {
    	// CONSTANTS
    	var INSTAPIXEL = 'InstaPIXEL'
    	,	MSG_NOT_CANVAS_ELEMENT = 'The element is not of type <CANVAS>'
    	,	MSG_TYPE_ERROR = 'ERROR'
    	,	MSG_TYPE_INFO = 'INFO'
    	,	MSG_IMAGE_LOAD_ERROR = "Image could not be loaded.";

    	// DEFAULT SETTINGS
    	var settings = {
    		'debug': true
 		,	'aspectRatio' : false 
    	};

    	var img, ctx, canv;

    	if( this.is("canvas") ) {
    		var self = this;
    		canv = this[0];
			ctx = canv.getContext('2d');
			loadImage(imgurl);
    	} else {
    		message( MSG_TYPE_ERROR, MSG_NOT_CANVAS_ELEMENT );
    	}

        // UTILITY FUNCTIONS
        function loadImage( imgurl ) {
        	var image = new Image;
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
		        ctx.drawImage(this, 0, 0, canv.width, canv.height);
		        self.trigger("imageLoaded", true);
		    };
		    image.onerror = function() {
		        message( MSG_TYPE_ERROR, MSG_IMAGE_LOAD_ERROR, this.src );
		        self.trigger("imageLoaded", false);
		    };
		    image.src = imgurl;
		    self.trigger("imageLoading");
        }

        function message( type, msg, info) {
        	if(settings.debug)
        		info ? info = " [ " + info + " ] " : info = '';
        		console.log( INSTAPIXEL + " " + type + " : " + msg + info );
        }
    }

}(jQuery));