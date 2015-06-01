window.screenfull = (function () {
    "use strict";

    var screenfull = {
        raw: jasmine.createSpyObj('raw', ['fullscreenchange']),
        isFullscreen: true,
        enabled: true,
        toggle: jasmine.createSpy('toggle')
    };

    return screenfull;

})();
