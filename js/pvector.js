/**
* Basic Math Vector 
* Used for vector calculations
*/

PVector = (function () {
	
	function clone (object) {
	    function F() {}
	    F.prototype = object;
	    return F;
	}
	
	return {
		create: function (x, y) {
			var obj, F = clone(this);
			obj = new F;
			obj.x = x;
			obj.y = y;
			return obj;
		},
		add: function(v) {
			this.x += v.x;
			this.y += v.y;
			return this;
		},
		sub: function(v) {
			this.x -= v.x;
			this.y -= v.y;
			return this;
		},	
		mult: function(n) {
			this.x *= n;
			this.y *= n;
			return this;
		},	
		div: function(n) {
			this.x = this.x / n;
			this.y = this.y / n;
			return this;
		},
		mag: function() {
			return Math.sqrt((this.x * this.x) + (this.y * this.y));
		},
		limit: function (high) {
			if (this.mag() > high) {
				this.normalize();
				this.mult(high);
			}
		},
		normalize: function () {
			m = this.mag();
			if (m !== 0) {
				return this.div(m);
			}
		},						
		distance: function(v) {
			var x = this.x - v.x,
			y = this.y - v.y;
			return Math.sqrt(x * x + y * y);
		},
		length: function() {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		},
		rotate: function(rad) {
			var cos = Math.cos(rad), sin = Math.sin(rad), x = this.x, y = this.y;
			this.x = x * cos - y * sin;
			this.y = x * sin + y * cos;
			return this;
		}
	};
	
}());


Mover = (function () {
	
	var width = 1000,
		height = 600,
		topspeed = 100;
	
	return {
		location: PVector.create(width/2, height/2),
		velocity: PVector.create(0, 0),
		acceleration: PVector.create(-0.001, 0.01),
		mouseX: null,
		mouseY: null,
		dir: null,
		update: function () {
			
			this.mouse = PVector.create(this.mouseX, this.mouseY);
			this.dir = this.sub(this.mouse, this.location);
			this.dir.normalize();
			this.dir.mult(0.5);
			
			this.acceleration = this.dir;
			this.velocity.add(this.acceleration);
			this.velocity.limit(topspeed);
			this.location.add(this.velocity);
			
			this.checkEdges();
		},
		checkEdges: function () {
			if ((this.location.x > width) || (this.location.x < 0)) {
				this.velocity.x = this.velocity.x * -1;
			}
			if ((this.location.y > height) || (this.location.y < 0)) {
				this.velocity.y = this.velocity.y * -1;
			}
		},
		display: function (context) {
			context.fillStyle = "#fff";
			//context.fillRect(0, 0, width, height);
			context.fillStyle = "#000";
			context.fillRect(this.location.x, this.location.y, 10, 10);
		},
		add: function (v1, v2) {
			return PVector.create(v1.x + v2.x, v1.y + v2.y);
		},
		sub: function (v1, v2) {
			return PVector.create(v1.x - v2.x, v1.y - v2.y);
		}
	};
	
}());
