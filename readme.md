InstaPIXEL jQuery Plugin
================================

*For ye, of 8-bit persuasion*

Basic Usage
------------

This plugin will pixelate the attached canvas with any image. Simply call the plugin function from your canvas element and send an image URL as a parameter:

	$('#mycanvas').instapixel( { 'imgURL': 'foobar.jpg' } );

The plugin is stateful, so you only need to call it once. After the initial call, use the data attribute to interact with the plugin:

	$('#mycanvas').data('instapixel').redraw();

One awesome feature is hi-res output. You can have your very own 8-bit abstract art at 12" wide x 300dpi using:

	$('#mycanvas').data('instapixel').output( 12 ); 

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
</table>
