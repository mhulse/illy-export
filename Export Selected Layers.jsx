/* jshint -W043, laxbreak:true, -W030 */
/* globals app, UserInteractionLevel */

// https://forums.adobe.com/message/4683491#4683491

// jshint ignore:start
#target illustrator
#targetengine main
// jshint ignore:end

var EXPORT = (function($application, $helper, undefined) {
	
	// Private variable container object:
	var _private = {};
	var _doc = null;
	var _history = [];
	var _layers = [];
	var _level = $application.userInteractionLevel; // Gets the current user interaction level.;
	
	// Script setup:
	_private.init = function() {
		
		// Open document(s)?
		if ($application.documents.length > 0) {
			
			_doc = $application.activeDocument;
			
			// Record environment’s current “Interaction Level”:
			_private.setInteractionLevel();
			
			// Record layer visibility:
			_private.layerHistory();
			
			// Load and run action:
			_private.manageAction();
			
			_private.getVisibleLayers();
			
			_private.createImages();
			
			// Unload action:
			_private.manageAction(true);
			
			// Restore layer visibility:
			_private.layerHistory(true);
			
			// Restore environment’s “Interaction Level”:
			_private.setInteractionLevel(true);
			
		} else {
			
			// Nope, let the user know what they did wrong:
			alert('You must open at least one document.');
			
		}
		
	};
	
	_private.setInteractionLevel = function(restore) {
		
		if (restore) {
			
			// Restore the user interaction level:
			$application.userInteractionLevel = _level;
			
		} else {
			
			// Overrides the current user interaction level:
			$application.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
			
		}
		
	};
	
	// Create action file and load it into the actions palette.
	_private.manageAction = function(unload) {
		
		var aia;
		
		if (unload) {
			
			$application.unloadAction('temp', ''); // Action Set Name.
			
		} else {
			
			aia = new File('~/temp.aia'); // Temporary file created in home directory.
			
			// Action string:
			var action = [
				'/version 3',
				'/name [',
					'4', // Group name character count.
					'74656d70', // Group name as a hash.
				']',
				'/isOpen 0',
				'/actionCount 1',
				'/action-1 {',
					'/name [',
						'4', // Action name character count.
						'74656d70', // Action name as a hash.
					']',
					'/keyIndex 0',
					'/colorIndex 0',
					'/isOpen 0',
					'/eventCount 1',
					'/event-1 {',
						'/useRulersIn1stQuadrant 0',
						'/internalName (ai_plugin_Layer)',
						'/localizedName [',
							'5',
							'4c61796572',
						']',
						'/isOpen 0',
						'/isOn 1',
						'/hasDialog 0',
						'/parameterCount 3',
						'/parameter-1 {',
							'/key 1836411236',
							'/showInPalette -1',
							'/type (integer)',
							'/value 7',
						'}',
						'/parameter-2 {',
							'/key 1937008996',
							'/showInPalette -1',
							'/type (integer)',
							'/value 23',
						'}',
						'/parameter-3 {',
							'/key 1851878757',
							'/showInPalette -1',
							'/type (ustring)',
							'/value [',
								'11',
								'48696465204f7468657273',
							']',
						'}',
					'}',
				'}'
			].join('\n');
			
			// Open and write the action string:
			aia.open('w');
			aia.write(action);
			aia.close();
			
			// Load action into actions palette:
			$application.loadAction(aia);
			
			// Remove the temporary file:
			aia.remove();
			
			// Show all layers:
			_private.showOrHideAllLayers(true);
			
			// Run the temporary action:
			$application.doScript('temp', 'temp', false); // Action Name, Action Set Name.
			
		}
		
	};
	
	/**
	 * Get all top-level and visible layers.
	 *
	 * @return {array} Filtered set of active document layers.
	 */
	
	_private.getVisibleLayers = function() {
		
		var result = [];
		var layer;
		var i;
		var il;
		
		// Loop over layers:
		for (i = 0, il = _doc.layers.length; i < il; i++) {
			
			// Current layer object in loop:
			layer = _doc.layers[i];
			
			if (layer.visible) {
				
				// Add layer object to end of return object:
				result.push(layer);
				
			}
			
		}
		
		_layers = result;
		
	};
	
	_private.showOrHideAllLayers = function(visible) {
		
		var count = _doc.layers.length;
		
		while (count--) {
			
			_doc.layers[count].visible = ( !! visible); // Default is hide.
			
		}
		
	};
	
	_private.createImages = function() {
		
		var count = _layers.length;
		var layer;
		
		while (count--) {
			
			layer = _layers[count];
			
			_private.showOrHideAllLayers();
			
			layer.visible = true;
			
			$application.redraw();
			
			_private.exportImage(count);
			
		}
		
	};
	
	_private.exportImage = function(index) {
		
		var options = new ExportOptionsPNG24();
		var destination = new Folder(Folder.desktop + '/illy-export');
		var type = ExportType.PNG24;
		var png;
		
		if ( ! destination.exists) {
			
			destination.create();
			
		}
		
		/*
		antiAliasing     boolean         If true, the exported image be anti-aliased. Default: true
		artBoardClipping boolean         If true, the exported image be clipped to the art board. Default: false
		horizontalScale  number (double) The horizontal scaling factor to apply to the exported image, where 100.0 is 100%. Default: 100.0
		matte            boolean         If true, the art board be matted with a color. Default: true
		matteColor       RGBColor        The color to use when matting the art board. Default: white
		saveAsHTML       boolean         If true, the exported image be saved with an accompanying HTML file. Default: false
		transparency     boolean         If true, the exported image use transparency. Default: true
		typename         string          Read-only. The class name of the referenced object.
		verticalScale    number (double) The vertical scaling factor to apply to the expo
		*/
		
		options.antiAliasing = false; // Better for pixel art.
		options.artBoardClipping = true;
		options.matte = false;
		options.transparency = true;
		
		png = new File(destination.fsName + '/' + index + '.png');
		
		_doc.exportFile(png, type, options);
		
	};
	
	/**
	 * Creates layer visibility history and handles layer visibility restoration.
	 *
	 * @param {boolean} restore If `true`, then restore history as found in `_history` array.
	 * @return {void}
	 */
	
	_private.layerHistory = function(restore) {
		
		var layers = _doc.layers;
		var i;
		var il;
		
		// Loop over all top-level layers in document:
		for (i = 0, il = layers.length; i < il; i++) {
			
			// Do we want to restore previous layer's visibility?
			if (restore) {
				
				// Yes, so get visibility flags from history array:
				layers[i].visible = _history[i];
				
			} else {
				
				// Not now, but create history array for later restoration:
				_history[i] = layers[i].visible;
				
			}
		
		};
		
	};
	
	// Public API:
	return {
		init: function() {
			
			_private.init();
			
		}
	};
	
})(app, $);

EXPORT.init();