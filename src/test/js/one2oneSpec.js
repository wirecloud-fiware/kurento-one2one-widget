describe("Test One2One widget", function () {
	"use strict";

	var widget = null;
	var values = null;
	
	var prefsGetValues = {
		'server-url': 'ws://url1',
		'stand-alone': false
	};
	var contextGetValues = {
		'username': 'user1'
	};

	it("should load the given preferences correctly", function () {
		values = {
			"MashupPlatform.context.get": contextGetValues,
			"MashupPlatform.prefs.get": prefsGetValues
		};
		MashupPlatform.setStrategy(new MyStrategy(), values);

		widget = new Widget('body', '#incoming-modal');

		expect(widget.serverURL).toBe(prefsGetValues['server-url']);
		expect(widget.username).toBe(contextGetValues.username);
		expect(widget.standalone).toBe(prefsGetValues['stand-alone']);

		prefsGetValues['server-url'] = 'ws://url2';
		prefsGetValues['stand-alone'] = true;
		contextGetValues.username = 'user2';

		widget.loadPreferences();

		expect(widget.serverURL).toBe(prefsGetValues['server-url']);
		expect(widget.username).toBe(contextGetValues.username);
		expect(widget.standalone).toBe(prefsGetValues['stand-alone']);
	});
});