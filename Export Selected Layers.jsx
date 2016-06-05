﻿/* jshint -W043, laxbreak:true, -W030 *//* globals app, $, UserInteractionLevel, ExportOptionsPNG24, Folder, ExportType */// @@@BUILDINFO@@@ Export Selected Layers.jsx !Version! Sat Jun 04 2016 19:43:54 GMT-0700// https://forums.adobe.com/message/4683491#4683491// jshint ignore:start#target illustrator#targetengine main// jshint ignore:end/** * Export selected layers to image files (currently PNG). * * In order for this script to properly function, you MUST have one or more * layers selected! For more information, check out the `README.md`. * * @see https://github.com/mhulse/illy-export * @param {object} $application Illustrator’s `app` global. * @param {object} $helper Illustrator’s `$` global helper object. * @param {object} $exporttype Export “type” used for image export options. * @return {void} */var EXPORT = (function($application, $helper, $exporttype, undefined) {		var _private = {};	var _doc = null;	_history = [];	_layers = [];	_level = {};		/**	 * Script initialization method.	 *	 * @return {void}	 */		_private.init = function() {				// Are there any open document(s)?		if ($application.documents.length > 0) {						// Yes, so set the active document for this script:			_doc = $application.activeDocument;						// Disable alerts:			_private.setUserInteractionLevel();						// Note current state of layer visibility:			_private.recordLayerVisibility();						// Create/load temporary action:			_private.loadTempAction();						// Run the temporary action:			_private.showSelectedLayers();						// Get the visible, selected, layers:			_private.getVisibleLayers();						// Show each visible and selected layer and create an image:			_private.showAndExportSelectedLayers();						// We’re all done here, so remove the temporary action:			_private.unloadTempAction();						// Restore layer visibility back to the state before this script ran:			_private.restoreLayerVisibility();						// Enable alerts:			_private.restoreUserInteractionLevel();					} else {						// Nope, let the user know what they did wrong:			alert('You must open at least one document.');					}			};		/**	 * Record environment’s current “Interaction Level”.	 * Disable alerts so we don’t get interrupted when generating images.	 *	 * This method sets the global `_level` variable with the pre-existing user	 * interaction level from before this scripts invocation.	 *	 * @return {void}	 */		_private.setUserInteractionLevel = function() {				// Save the current user interaction level:		_level = $application.userInteractionLevel;				// Override the current user interaction level:		$application.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;			};		/**	 * Restore environment’s “Interaction Level”.	 *	 * @return {void}	 */		_private.restoreUserInteractionLevel = function() {				// Restore the user interaction level:		$application.userInteractionLevel = _level;			};		/**	 * Create action file and load it into the actions palette.	 *	 * @return {void}	 */		_private.loadTempAction = function() {				var aia = new File('~/temp.aia'); // Temporary file created in home directory.				// Action string:		var action = [			'/version 3',			'/name [',				'4', // Group name character count.				'74656d70', // Group name as a hash.			']',			'/isOpen 0',			'/actionCount 1',			'/action-1 {',				'/name [',					'4', // Action name character count.					'74656d70', // Action name as a hash.				']',				'/keyIndex 0',				'/colorIndex 0',				'/isOpen 0',				'/eventCount 1',				'/event-1 {',					'/useRulersIn1stQuadrant 0',					'/internalName (ai_plugin_Layer)',					'/localizedName [',						'5',						'4c61796572',					']',					'/isOpen 0',					'/isOn 1',					'/hasDialog 0',					'/parameterCount 3',					'/parameter-1 {',						'/key 1836411236',						'/showInPalette -1',						'/type (integer)',						'/value 7',					'}',					'/parameter-2 {',						'/key 1937008996',						'/showInPalette -1',						'/type (integer)',						'/value 23',					'}',					'/parameter-3 {',						'/key 1851878757',						'/showInPalette -1',						'/type (ustring)',						'/value [',							'11',							'48696465204f7468657273',						']',					'}',				'}',			'}'		].join('\n');				// Open and write the action string:		aia.open('w');		aia.write(action);		aia.close();				// Load action into actions palette:		$application.loadAction(aia);				// Remove the temporary file:		aia.remove();			};		/**	 * Runs temporary action used to find and show selected layers.	 *	 * @return {void}	 */		_private.showSelectedLayers = function() {				// Show all layers (required for the above action to work properly):		_private.showAllLayers();				// Run the temporary action:		$application.doScript('temp', 'temp', false); // Action Name, Action Set Name.			}		/**	 * Remove temporary action from Illustrator’s actions palette.	 *	 * @return {void}	 */		_private.unloadTempAction = function() {				$application.unloadAction('temp', ''); // Action Set Name.			};		/**	 * Get all top-level and visible layers.	 *	 * This method populates the `_layers` global with a filtered set of	 * selected document layers.	 *	 * @return {void}	 */		_private.getVisibleLayers = function() {				var result = [];		var layer;		var i;		var il;				// Loop over layers:		for (i = 0, il = _doc.layers.length; i < il; i++) {						// Current layer object in loop:			layer = _doc.layers[i];						// We only want visible layers:			if (layer.visible) {								// Add layer object to end of return object:				result.push(layer);							}					}				// Populate the `_layers` local global:		_layers = result;			};		/**	 * Make all layers in document visible.	 *	 * @return {void}	 */		_private.showAllLayers = function() {				var count = _doc.layers.length;				while (count--) {						_doc.layers[count].visible = true;					}			};		/**	 * Make all layers in document invisible.	 *	 * @return {void}	 */		_private.hideAllLayers = function() {				var count = _doc.layers.length;				while (count--) {						_doc.layers[count].visible = false;					}			};		/**	 * Make visible selected layers and export each as an image.	 *	 * @return {void}	 */		_private.showAndExportSelectedLayers = function() {				var count = _layers.length;		var layer;				while (count--) {						layer = _layers[count];						_private.hideAllLayers();						layer.visible = true;						$application.redraw();						_private.exportDocumentImage(count, _layers[count].name);					}			};		/**	 * Export an image of the current state of the document.	 *	 * @param {integer} index Loop number use for file name.	 * @return {void}	 */		_private.exportDocumentImage = function(index, name) {				var options = new ExportOptionsPNG24();		var destination = new Folder(Folder.desktop + '/illy-export');		var type = $exporttype.PNG24;		var png;				if ( ! destination.exists) {						destination.create();					}				/*		antiAliasing     boolean         If true, the exported image be anti-aliased. Default: true		artBoardClipping boolean         If true, the exported image be clipped to the art board. Default: false		horizontalScale  number (double) The horizontal scaling factor to apply to the exported image, where 100.0 is 100%. Default: 100.0		matte            boolean         If true, the art board be matted with a color. Default: true		matteColor       RGBColor        The color to use when matting the art board. Default: white		saveAsHTML       boolean         If true, the exported image be saved with an accompanying HTML file. Default: false		transparency     boolean         If true, the exported image use transparency. Default: true		typename         string          Read-only. The class name of the referenced object.		verticalScale    number (double) The vertical scaling factor to apply to the expo		*/				options.antiAliasing = false; // Better for pixel art.		options.artBoardClipping = true;		options.matte = false;		options.transparency = true;				png = new File(destination.fsName + '/' + _private.addLeadingZero(index + 1) + '_' + name + '.png');				_doc.exportFile(png, type, options);			};		/**	 * [addLeadingZeros description]	 * @param {[type]} n [description]	 */		_private.addLeadingZero = function(n) {				if ((n < 10) & (n >= 0)) return ('0' + n);				if ((n < 0) & (n > -11)) return ('-0' + Math.abs(n));				return n;			};		/**	 * Record layer visibility before script runs.	 *	 * Sets the `_history` local global with document’s layer visibility status	 * before script was ran.	 *	 * @return {void}	 */		_private.recordLayerVisibility = function() {				var layers = _doc.layers;		var i;		var il;				// Loop over all top-level layers in document:		for (i = 0, il = layers.length; i < il; i++) {						// Create history array for later restoration:			_history[i] = layers[i].visible;				}			};		/**	 * Restore layer visibility before the script ran.	 *	 * @return {void}	 */		_private.restoreLayerVisibility = function() {				var layers = _doc.layers;		var i;		var il;				// Loop over all top-level layers in document:		for (i = 0, il = layers.length; i < il; i++) {						// Get visibility flags from history array:			layers[i].visible = _history[i];					}			};		// Public API:	return {		init: function() {						_private.init();					}	};	})(app, $, ExportType);EXPORT.init();