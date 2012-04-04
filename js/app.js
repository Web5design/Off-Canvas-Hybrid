/*global  */
/**
	@module OffCanvas
	@version 1.0
	@author Vince Allen
	@date 04-03-2012
	@requires jQuery, Modernizr, PVector
*/

var OffCanvas = {};

OffCanvas.Utils = {
	clone : function(object) {

		"use strict";

	    function F() {}
	    F.prototype = object;
	    return new F;
	},
	PVectorSub: function (v1, v2) {

		"use strict";

		return PVector.create(v1.x - v2.x, v1.y - v2.y);
	},
	map: function (value, min1, max1, min2, max2) { // returns a new value relative to a new range

		"use strict";

		var unitratio = (value - min1) / (max1 - min1);
		return (unitratio * (max2 - min2)) + min2;
	},
	getEventLocation: function (e) {

		"use strict";

		var x, y;

		if (e.pageX) {
			x = e.pageX;
		} else if (e.clientX) {
			x = e.clientX;
		} else if (e.changedTouches) {
			x = e.changedTouches[0].pageX;
		}

		if (e.pageY) {
			y = e.pageY;
		} else if (e.clientY) {
			y = e.clientY;
		} else if (e.changedTouches) {
			y = e.changedTouches[0].pageY;
		}
													
		return PVector.create(x, y);
	},
	updateOrientation: function (e) {
		OffCanvas.World.init();
	},
	radiansToDegrees: function (radians) {
		return radians * (180/Math.PI);
	}
};

$(document).ready(function () {
	
	var i, x, mediaQ,
		css,
		windowWidth = $(window).width();
	
	if (Modernizr.touch) {
	
		if (windowWidth > 480) { // if window width is greater than 480, device is touch but not an iPhone
			
			// need to copy iPhone media query styles to a new style sheet that sets max-width condition = window width
			
			for (i in document.styleSheets) { // loop thru styelsheets
				if (document.styleSheets[i].rules) { // if stylesheet has rules
					for (x = 0; x < document.styleSheets[i].rules.length; x += 1) { // loop thru rules
						if (document.styleSheets[i].rules[x].type === 4) { // if this rule is a media rule
							if (document.styleSheets[i].rules[x].cssText.indexOf("480px") !== -1) { // this is the rule we want to copy
								mediaQ = document.styleSheets[i].rules[x].cssText.replace("480px", windowWidth + "px"); // replace max-width condition
								
								css = document.createElement("style"); // create new stylesheet
								css.type = "text/css";
								css.innerHTML = mediaQ; // set the contents equal to updated media query
								document.body.appendChild(css); // append the new stylesheet to the document
							}
						}
					}
				}
			}
				

		
		}
				
		$(".container").addClass("container-touch"); // add touch class to .container to disable transitions
		
		
		OffCanvas.World = (function () {
			
			return {
				windowWidth: null,
				maxSpeed: null,
				init: function () {
					this.windowWidth = windowWidth;
					this.maxSpeed = windowWidth * .075;
					this.slideTolerance = windowWidth * .15;
					this.minMoveAngle = 30;
				}
			};
			
		}());
		
		OffCanvas.World.init();
						
		OffCanvas.Mover = (function () {
			
			"use strict";
					
			return {
				acceleration: PVector.create(0,0),
				velocity: PVector.create(0,0),
				location: PVector.create(0,0),
				touchStart: null,
				targetLocation: PVector.create(0,0),
				offsetX: 0,
				isReset: null,
				isDocked: null, 
				myInterval: null,
				mousedown: false,
				init: function () {
						
				},
				draw: function () {

					"use strict";

					if (Modernizr.csstransforms3d) { // if 3d transforms are supported, add translateZ(0px); speeds up rendering

						this.draw = function () { // overwrite this function so we're not always hitting Modernizr
							var x = this.location.x,
								y = this.location.y,
								style = this.el.style,
								transform = 'translateX(' + x + 'px) translateY(' + y + 'px) translateZ(0px)';

							style.webkitTransform = transform;
							style.MozTransform = transform;	
							style.OTransform = transform;
							style.display = "block";
							style.position = "absolute";
						};
						return;
					}
					
					if (Modernizr.csstransforms) { // overwrite this function so we're not always hitting Modernizr

						this.draw = function () {
							var x = this.location.x,
								y = this.location.y,
								style = this.el.style,
								transform = 'translateX(' + x + 'px) translateY(' + y + 'px)';

							style.webkitTransform = transform;
							style.MozTransform = transform;	
							style.OTransform = transform;
							style.display = "block";
							style.position = "absolute";
						};
						return;

					} else {

						this.draw = function () { // overwrite this function so we're not always hitting Modernizr
							var x = this.location.x,
								y = this.location.y;

							$(this.el).css({
								"position": "absolute",
								"left": x,
								"top": y,
								"display": "block"
							});
						};
					}	
				},
				applyForce: function (force) {

					"use strict";

					this.acceleration.add(force);
				}
			};
			
		}());
		
		OffCanvas.Slider = (function () {
			
			"use strict";
				
			return {
				
				configure: function (params) {
					
					var me = this,
						el = params.el,
						id = params.id;
					
					this.id = id || null;						
					this.el = el || null;
					this.width = $(el).width();
					this.height = $(el).height();
					this.lastLoc = PVector.create(0, 0);
					this.isReset = true; // slider begins in the middle
					
					//
					
					this.el.addEventListener("touchstart", function (e) { // do not e.preventDefault();
						me.touchStart = OffCanvas.Utils.getEventLocation(e); // used to calulate distance on touchend; prevents obj from moving toward target	
						me.offsetX = me.touchStart.x - me.location.x;
					}, false);

					this.el.addEventListener("touchmove", function (e) {

						var touchLoc = OffCanvas.Utils.getEventLocation(e),						
							adjacent = me.lastLoc.x - touchLoc.x,
							opposite = me.lastLoc.y - touchLoc.y,
							moveAngle = OffCanvas.Utils.radiansToDegrees(Math.atan(opposite/adjacent));
											
						if (!me.isReset) { // if slider is not in the middle
							e.preventDefault();
							me.location.x = touchLoc.x - me.offsetX; // set the new location
						} else {
							if (Math.abs(me.touchStart.x - me.lastLoc.x) > OffCanvas.World.slideTolerance && Math.abs(moveAngle) < OffCanvas.World.minMoveAngle) { // check against a slide tolerance and move angle; then preventDefault
								me.isReset = false;
								e.preventDefault();
								me.location.x = touchLoc.x - me.offsetX; // set the new location
							} else {
								me.location.x = 0;
							}
						}
							
						me.lastLoc = touchLoc;				
					}, false);

					this.el.addEventListener("touchend", function (e) {

						me.touchEnd = OffCanvas.Utils.getEventLocation(e); // get touchend location

						if (me.touchStart.distance(me.touchEnd) > 0) { // if user swipes slide 1/6 its width
							if (!me.isDocked) {
								if (me.location.x < 0) {
									me.targetLocation = PVector.create(-$(window).width() * .9, 0);
								} else if (me.location.x > 0) {
									me.targetLocation = PVector.create($(window).width() * .9, 0);
								}
								me.isDocked = true;
							} else {
								me.targetLocation = PVector.create(0, 0);
								me.isDocked = false;
							}
						} else if (me.touchStart.distance(me.touchEnd) < 1) { // check for single tap
							if (me.isDocked) {
								me.targetLocation = PVector.create(0, 0);
							}
						}
						me.touchStart  = null; // allow slide to move toward target
					}, false);
					
					return this;	
				},
				update: function () {
					
					// these functions are based on Daniel Shiffman's book Nature of Code; http://www.shiffman.net/teaching/nature/
					
					"use strict";

					var desired, d, m, steer;

					if (!this.touchStart) {

						desired = OffCanvas.Utils.PVectorSub(this.targetLocation, this.location);

						d = desired.mag(); // proximity deceleration -- start
						desired.normalize();

						if (d < OffCanvas.World.windowWidth/4) { // the proximity threshold should vary with screen width
							m = OffCanvas.Utils.map(d, 0, OffCanvas.World.windowWidth/4, 0, OffCanvas.World.maxSpeed);
							desired.mult(m);
						} else {
							desired.mult(OffCanvas.World.maxSpeed);
						} // proximity deceleration -- end

						steer = OffCanvas.Utils.PVectorSub(desired, this.velocity);

						this.applyForce(steer);

					}

					this.velocity.add(this.acceleration);
					this.velocity.limit(OffCanvas.World.maxSpeed);
					this.location.add(this.velocity);

					this.acceleration.mult(0);
					
					if (this.location.x > 0) {
						menu.show();
						contact.hide();
						this.isReset = false;
					}
					
					if (Math.round(this.location.x) === 0) {
						menu.hide();
						contact.hide();
						this.isReset = true;
						this.location.x = 0;
					}
					
					if (this.location.x < 0) {
						menu.hide();
						contact.show();
						this.isReset = false;
					}

				}	
			};			
		}());
		
		OffCanvas.Menu = (function () {
			
			"use strict";
			
			return {
				
				configure: function (params) {
					
					var el = params.el,
						id = params.id;
					
					this.id = id || null;						
					this.el = el || null;
					this.el.style.display = "none";
										
					return this;
					
				},
				update: function () {},
				show: function () {
					this.el.style.display = "block"; 
				},
				hide: function () {
					this.el.style.display = "none"; 
				}
				
			};
			
		}());
		
		OffCanvas.Contact = (function () {
			
			"use strict";
			
			return {
				
				configure: function (params) {
					
					var el = params.el,
						id = params.id;
					
					this.id = id || null;						
					this.el = el || null;
					this.el.style.display = "none";
										
					return this;
					
				},
				update: function () {},
				show: function () {
					this.el.style.display = "block"; 
				},
				hide: function () {
					this.el.style.display = "none"; 
				}
				
			};
			
		}());
		
		OffCanvas.Loop = (function () {
			
			"use strict";
			
			var frame_rate = 16;
			
			return {
				myInterval: null,
				collection: [],
				start: function () {
					this.myInterval = setInterval(function () {
						var i, max;
						for (i = 0, max = OffCanvas.Loop.collection.length; i < max; i += 1) {
							OffCanvas.Loop.collection[i].update();
							OffCanvas.Loop.collection[i].draw();
						}		
		            }, frame_rate);
				}
			};
			
		}());
		
		// add touch classes to dynamic elements
		
		$(".container-page").
		addClass("container-page").
		addClass("container-page-touch");
		
		$(".navigation-bar").
		removeClass("navigation-bar").
		addClass("navigation-bar-touch");
		
		$(".navigation-menu").
		removeClass("navigation-menu").  // remove non-touch class; add touch class
		addClass("navigation-menu-touch").
		bind("touchend", function () {
			if (slider.isDocked) {
				slider.targetLocation = PVector.create(0, 0);
				slider.isDocked = false;
			} else {
				slider.targetLocation = PVector.create($(window).width() * .9, 0);
				slider.isDocked = true;
			}
		});
		
		$(".navigation-contact").
		removeClass("navigation-contact").
		addClass("navigation-contact-touch").
		bind("touchend", function () {
			if (slider.isDocked) {
				slider.targetLocation = PVector.create(0, 0);
				slider.isDocked = false;
			} else {
				slider.targetLocation = PVector.create(-$(window).width() * .9, 0);
				slider.isDocked = true;
			}
		});
		
		$(".container-menu").
		removeClass("container-menu").
		addClass("container-menu-touch");
		
		$(".container-contact").
		removeClass("container-contact").
		addClass("container-contact-touch");
		
		$("body").
		addClass("body-touch");
		
		//
		
		var slider = OffCanvas.Utils.clone(OffCanvas.Mover); // clone Mover
		$.extend(slider, OffCanvas.Slider); // extend to Slider
		slider.configure({ // configure slider
			id: "ContainerContent",
			el: document.getElementById("ContainerContent")
		});
		
		OffCanvas.Loop.collection.push(slider);
		
		//
		
		var menu = OffCanvas.Utils.clone(OffCanvas.Mover); // clone Mover
		$.extend(menu, OffCanvas.Menu); // extend to Menu
		menu.configure({ // configure slider
			id: "ContainerMenu",
			el: document.getElementById("ContainerMenu")
		});
		
		var contact = OffCanvas.Utils.clone(OffCanvas.Mover); // clone Mover
		$.extend(contact, OffCanvas.Contact); // extend to Menu
		contact.configure({ // configure slider
			id: "ContainerContact",
			el: document.getElementById("ContainerContact")
		});		

		//

		OffCanvas.Loop.start();
				
	}
	
});