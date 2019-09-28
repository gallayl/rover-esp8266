/**
 * @typedef {object} VirtualJoystickOptions
 * @property {HTMLElement} container The Container element
 * @property {string} strokeStyle The Stroke style (e.g. 'cyan')
 * @property {HTMLElement | undefined} stickElement The stick element in the DOM
 * @property {HTMLElement | undefined} baseElement The Base element
 * @property {boolean} mouseSupport Allow mouse support
 * @property {boolean} stationaryBase
 * @property {number} baseX The base X Position
 * @property {number} baseY The base X Position
 * @property {boolean} limitStickTravel
 * @property {number} stickRadius
 * @property {boolean} useCssTransform
 */

/**
 * Class representing a Virtual Joystick
 */
export class VirtualJoystick {
  getStickElement() {
    var canvas = document.createElement("canvas");
    canvas.width = 86;
    canvas.height = 86;
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = this.options.strokeStyle;
    ctx.lineWidth = 6;
    ctx.arc(canvas.width / 2, canvas.width / 2, 40, 0, Math.PI * 2, true);
    ctx.stroke();
    return canvas;
  }

  getBaseElement() {
    var canvas = document.createElement("canvas");
    canvas.width = 126;
    canvas.height = 126;

    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = this.options.strokeStyle;
    ctx.lineWidth = 6;
    ctx.arc(canvas.width / 2, canvas.width / 2, 40, 0, Math.PI * 2, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = this.options.strokeStyle;
    ctx.lineWidth = 2;
    ctx.arc(canvas.width / 2, canvas.width / 2, 60, 0, Math.PI * 2, true);
    ctx.stroke();

    return canvas;
  }

  touchScreenAvailable() {
    return "createTouch" in document ? true : false;
  }

  getDefaultOptions() {
    return {
      container: document.body,
      strokeStyle: "cyan",
      mouseSupport: true,
      stationaryBase: false,
      baseX: 0,
      baseY: 0,
      limitStickTravel: false,
      stickRadius: 100,
      useCssTransform: false
    };
  }

  constructor(
    /**
     * @type {Partial<VirtualJoystickOptions>}
     */
    options
  ) {
    this.options = { ...this.getDefaultOptions(), ...options };

    /** init DOM elements */

    if (!this.options.stickElement) {
      this.options.stickElement = this.getStickElement();
    }

    if (!this.options.baseElement) {
      this.options.baseElement = this.getBaseElement();
    }

    this.options.container.style.position = "relative";
    this.options.container.appendChild(this.options.baseElement);
    this.options.baseElement.style.position = "absolute";
    this.options.baseElement.style.display = "none";
    this.options.container.appendChild(this.options.stickElement);
    this.options.stickElement.style.position = "absolute";
    this.options.stickElement.style.display = "none";

    this._pressed = false;
    this._touchIdx = null;

    if (this.options.stationaryBase === true) {
      this.options.baseElement.style.display = "";
      this.options.baseElement.style.left =
        this.options.baseX - this.options.baseElement.width / 2 + "px";
      this.options.baseElement.style.top =
        this.options.baseY - this.options.baseElement.height / 2 + "px";
    }

    this._has3d = this._check3D();

    this._$onTouchStart = this._onTouchStart.bind(this);
    this._$onTouchEnd = this._onTouchEnd.bind(this);
    this._$onTouchMove = this._onTouchMove.bind(this);
    this.options.container.addEventListener(
      "touchstart",
      this._$onTouchStart,
      false
    );
    this.options.container.addEventListener(
      "touchend",
      this._$onTouchEnd,
      false
    );
    this.options.container.addEventListener(
      "touchmove",
      this._$onTouchMove,
      false
    );
    if (this.options.mouseSupport) {
      this._$onMouseDown = this._onMouseDown.bind(this);
      this._$onMouseUp = this._onMouseUp.bind(this);
      this._$onMouseMove = this._onMouseMove.bind(this);
      this.options.container.addEventListener(
        "mousedown",
        this._$onMouseDown,
        false
      );
      this.options.container.addEventListener(
        "mouseup",
        this._$onMouseUp,
        false
      );
      this.options.container.addEventListener(
        "mousemove",
        this._$onMouseMove,
        false
      );
    }
  }

  destroy() {
    this.options.container.removeChild(this.options.baseElement);
    this.options.container.removeChild(this.options.stickElement);

    this.options.container.removeEventListener(
      "touchstart",
      this._$onTouchStart,
      false
    );
    this.options.container.removeEventListener(
      "touchend",
      this._$onTouchEnd,
      false
    );
    this.options.container.removeEventListener(
      "touchmove",
      this._$onTouchMove,
      false
    );
    if (this.options.mouseSupport) {
      this.options.container.removeEventListener(
        "mouseup",
        this._$onMouseUp,
        false
      );
      this.options.container.removeEventListener(
        "mousedown",
        this._$onMouseDown,
        false
      );
      this.options.container.removeEventListener(
        "mousemove",
        this._$onMouseMove,
        false
      );
    }
  }
  //////////////////////////////////////////////////////////////////////////////////
  //										//
  //////////////////////////////////////////////////////////////////////////////////

  deltaY() {
    return (
      ((this._stickY - this.options.baseY) / this.options.stickRadius) * 100
    );
  }
  deltaX() {
    return (
      ((this._stickX - this.options.baseX) / this.options.stickRadius) * 100
    );
  }

  up() {
    if (this._pressed === false) return false;
    var deltaX = this.deltaX();
    var deltaY = this.deltaY();
    if (deltaY >= 0) return false;
    if (Math.abs(deltaX) > 2 * Math.abs(deltaY)) return false;
    return true;
  }

  down() {
    if (this._pressed === false) return false;
    var deltaX = this.deltaX();
    var deltaY = this.deltaY();
    if (deltaY <= 0) return false;
    if (Math.abs(deltaX) > 2 * Math.abs(deltaY)) return false;
    return true;
  }
  right() {
    if (this._pressed === false) return false;
    var deltaX = this.deltaX();
    var deltaY = this.deltaY();
    if (deltaX <= 0) return false;
    if (Math.abs(deltaY) > 2 * Math.abs(deltaX)) return false;
    return true;
  }
  left() {
    if (this._pressed === false) return false;
    var deltaX = this.deltaX();
    var deltaY = this.deltaY();
    if (deltaX >= 0) return false;
    if (Math.abs(deltaY) > 2 * Math.abs(deltaX)) return false;
    return true;
  }

  _onUp() {
    this._pressed = false;
    this.options.stickElement.style.display = "none";

    if (this.options.stationaryBase == false) {
      this.options.baseElement.style.display = "none";

      this.options.baseX = this.options.baseY = 0;
      this._stickX = this._stickY = 0;
    }
  }
  _onDown(x, y) {
    this._pressed = true;
    if (this.options.stationaryBase == false) {
      this.options.baseX = x;
      this.options.baseY = y;
      this.options.baseElement.style.display = "";
      this._move(
        this.options.baseElement.style,
        this.options.baseX - this.options.baseElement.width / 2,
        this.options.baseY - this.options.baseElement.height / 2
      );
    }

    this._stickX = x;
    this._stickY = y;

    if (this.options.limitStickTravel === true) {
      var deltaX = this.deltaX();
      var deltaY = this.deltaY();
      var stickDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (stickDistance > this.options.stickRadius) {
        var stickNormalizedX = deltaX / stickDistance;
        var stickNormalizedY = deltaY / stickDistance;

        this._stickX =
          stickNormalizedX * this.options.stickRadius + this.options.baseX;
        this._stickY =
          stickNormalizedY * this.options.stickRadius + this.options.baseY;
      }
    }

    this.options.stickElement.style.display = "";
    this._move(
      this.options.stickElement.style,
      this._stickX - this.options.stickElement.width / 2,
      this._stickY - this.options.stickElement.height / 2
    );
  }

  _onMove(x, y) {
    if (this._pressed === true) {
      this._stickX = x;
      this._stickY = y;

      if (this.options.limitStickTravel === true) {
        var deltaX = this.deltaX();
        var deltaY = this.deltaY();
        var stickDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (stickDistance > this.options.stickRadius) {
          var stickNormalizedX = deltaX / stickDistance;
          var stickNormalizedY = deltaY / stickDistance;

          this._stickX =
            stickNormalizedX * this.options.stickRadius + this.options.baseX;
          this._stickY =
            stickNormalizedY * this.options.stickRadius + this.options.baseY;
        }
      }

      this._move(
        this.options.stickElement.style,
        this._stickX - this.options.stickElement.width / 2,
        this._stickY - this.options.stickElement.height / 2
      );
    }
  }

  _onMouseUp(event) {
    return this._onUp();
  }

  _onMouseDown(event) {
    event.preventDefault();
    var x = event.clientX;
    var y = event.clientY;
    return this._onDown(x, y);
  }

  _onMouseMove(event) {
    var x = event.clientX;
    var y = event.clientY;
    return this._onMove(x, y);
  }

  _onTouchStart(event) {
    if (this._touchIdx !== null) return;
    var isValid = this.dispatchEvent("touchStartValidation", event);
    if (isValid === false) return;
    this.dispatchEvent("touchStart", event);

    event.preventDefault();
    var touch = event.changedTouches[0];
    this._touchIdx = touch.identifier;
    var x = touch.pageX;
    var y = touch.pageY;
    return this._onDown(x, y);
  }

  _onTouchEnd(event) {
    // if there is no touch in progress, do nothing
    if (this._touchIdx === null) return;

    // dispatch touchEnd
    this.dispatchEvent("touchEnd", event);

    // try to find our touch event
    var touchList = event.changedTouches;
    for (
      var i = 0;
      i < touchList.length && touchList[i].identifier !== this._touchIdx;
      i++
    );
    // if touch event isnt found,
    if (i === touchList.length) return;

    // reset touchIdx - mark it as no-touch-in-progress
    this._touchIdx = null;

    return this._onUp();
  }

  _onTouchMove(event) {
    // if there is no touch in progress, do nothing
    if (this._touchIdx === null) return;

    // try to find our touch event
    var touchList = event.changedTouches;
    for (
      var i = 0;
      i < touchList.length && touchList[i].identifier !== this._touchIdx;
      i++
    );
    // if touch event with the proper identifier isnt found, do nothing
    if (i === touchList.length) return;
    var touch = touchList[i];

    event.preventDefault();

    var x = touch.pageX;
    var y = touch.pageY;
    return this._onMove(x, y);
  }

  _buildJoystickBase() {
    var canvas = document.createElement("canvas");
    canvas.width = 126;
    canvas.height = 126;

    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = this.options.strokeStyle;
    ctx.lineWidth = 6;
    ctx.arc(canvas.width / 2, canvas.width / 2, 40, 0, Math.PI * 2, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = this.options.strokeStyle;
    ctx.lineWidth = 2;
    ctx.arc(canvas.width / 2, canvas.width / 2, 60, 0, Math.PI * 2, true);
    ctx.stroke();

    return canvas;
  }

  _move(style, x, y) {
    style.left = x + "px";
    style.top = y + "px";
  }

  _getTransformProperty() {
    var styles = [
      "webkitTransform",
      "MozTransform",
      "msTransform",
      "OTransform",
      "transform"
    ];

    var el = document.createElement("p");
    var style;

    for (var i = 0; i < styles.length; i++) {
      style = styles[i];
      if (null != el.style[style]) {
        return style;
        break;
      }
    }
  }

  _check3D() {
    var prop = this._getTransformProperty();
    // IE8<= doesn't have `getComputedStyle`
    if (!prop || !window.getComputedStyle) return (module.exports = false);

    var map = {
      webkitTransform: "-webkit-transform",
      OTransform: "-o-transform",
      msTransform: "-ms-transform",
      MozTransform: "-moz-transform",
      transform: "transform"
    };

    // from: https://gist.github.com/lorenzopolidori/3794226
    var el = document.createElement("div");
    el.style[prop] = "translate3d(1px,1px,1px)";
    document.body.insertBefore(el, null);
    var val = getComputedStyle(el).getPropertyValue(map[prop]);
    document.body.removeChild(el);
    var exports = null != val && val.length && "none" != val;
    return exports;
  }
}

/**
 * microevents.js - https://github.com/jeromeetienne/microevent.js
 */
(function(destObj) {
  destObj.addEventListener = function(event, fct) {
    if (this._events === undefined) this._events = {};
    this._events[event] = this._events[event] || [];
    this._events[event].push(fct);
    return fct;
  };
  destObj.removeEventListener = function(event, fct) {
    if (this._events === undefined) this._events = {};
    if (event in this._events === false) return;
    this._events[event].splice(this._events[event].indexOf(fct), 1);
  };
  destObj.dispatchEvent = function(event /* , args... */) {
    if (this._events === undefined) this._events = {};
    if (this._events[event] === undefined) return;
    var tmpArray = this._events[event].slice();
    for (var i = 0; i < tmpArray.length; i++) {
      var result = tmpArray[i].apply(
        this,
        Array.prototype.slice.call(arguments, 1)
      );
      if (result !== undefined) return result;
    }
    return undefined;
  };
})(VirtualJoystick.prototype);
