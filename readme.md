InstaPIXEL jQuery Plugin
================================

*For ye, of 8-bit persuasion*

[http://thelucre.github.io/instapixel/](http://thelucre.github.io/instapixel/)

Basic Usage
------------

This plugin will pixelate the attached canvas with any image. Simply call the plugin function from your canvas element and send an image URL as a parameter:

	$('#mycanvas').instapixel( { 'imgURL': 'foobar.jpg' } );

The plugin is stateful, so you only need to call it once. After the initial call, use the data attribute to interact with the plugin:

	$('#mycanvas').data('instapixel').redraw();

One awesome feature is hi-res output. You can have your very own 8-bit abstract art at 12" wide x 300dpi using:

	var myDataURL = $('#mycanvas').data('instapixel').output( 12 ); 

Perhaps you should hide the loader when the processing is complete (the big images can take a bit...)
  
	$('#mycanvas').on("hiResProcessed", function() {
		$('#loader').fadeOut();
	});

Options
------------

<table>
  <tr>
    <th>Name</th><th>Values</th><th>Default</th><th>Description</th>
  </tr>
  <tr>
    <td>imgURL</td>
    <td>any image url string</td>
    <td>'.jpg'</td>
    <td>The image to be loaded and pixelated onto the canvas</td>
  </tr>
  <tr>
    <td>debug</td>
    <td>true / false</td>
    <td>true</td>
    <td>Debug mode will output all these great messages to the console</td>
  </tr>
  <tr>
    <td>pixelSize</td>
    <td>any integer > 0</td>
    <td>10</td>
    <td>The pixelation size drawn, relative to the original image size</td>
  </tr>
  <tr>
    <td>resizeCanvas</td>
    <td>true / false</td>
    <td>false</td>
    <td>If true, the canvas element will resize to the original image dimensions</td>
  </tr>
  <tr>
    <td>trueSquare</td>
    <td>true / false</td>
    <td>false</td>
    <td>If true, square pixels will be padded to fit the canvas just right</td>
  </tr>
</table>

Methods
------------

<table>
  <tr>
    <th>Name</th><th>Signature</th><th>Return Value</th><th>Description</th>
  </tr>
  <tr>
    <td>setSize</td>
    <td>( int size )</td>
    <td>bool for success/fail</td>
    <td>set pixel size to draw. does not redraw</td>
  </tr>
  <tr>
    <td>getSize</td>
    <td>none</td>
    <td>int size</td>
    <td>gets the current pixel size being drawn</td>
  </tr>
  <tr>
    <td>setImage</td>
    <td>( str url, [bool redraw]</td>
    <td> none </td>
    <td>set the image to pixelate. pass true to redraw after async image load</td>
  </tr>
  <tr>
    <td>getImage</td>
    <td>none</td>
    <td>str url</td>
    <td>returns the currently drawn image</td>
  </tr>
  <tr>
    <td>redraw</td>
    <td>( [int size] )</td>
    <td>bool for success/fail</td>
    <td>redraw the pixelated canvas. optional size setting parameter</td>
  </tr>
  <tr>
    <td>clear</td>
    <td>none</td>
    <td>none</td>
    <td>clears the parent canvas element</td>
  </tr>
  <tr>
    <td>output</td>
    <td>( float inches )</td>
    <td>dataURL of canvas</td>
    <td>returns a dataURL image of the current canvas scaled to the number of inches passed (relative to width) @ 300dpi</td>
  </tr>
</table>


Event Triggers
------------

<table>
  <tr>
    <th>Name</th><th>Description</th>
  </tr>
  <tr>
    <td>'imageLoaded'</td>
    <td>the image has been loaded to memory, check parameter success to confirm</td>
  </tr>
  <tr>
    <td>'imageLoading'</td>
    <td>the plugin has started loading the current image</td>
  </tr>
  <tr>
    <td>'imageParsing'</td>
    <td>the image pixels are being parsed </td>
  </tr>
  <tr>
    <td>'imageParsed'</td>
    <td>the image pixels have been parsed</td>
  </tr>
  <tr>
    <td>'hiResProcessing'</td>
    <td>the hi res version of being built into a new dataURL image</td>
  </tr>
  <tr>
    <td>'hiResProcessed'</td>
    <td>the hi res image version has been processed into a new dataURL image</td>
  </tr>
