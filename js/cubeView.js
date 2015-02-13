/*
 * Polymer Cube Component
 * Author: sang seok lim (sangseok.lim@sk.com)
 */
var CubeView = (function (window, document) {
    var utils = (function () {
        var me = {};

        var _elementStyle = document.createElement('div').style;
        var _vendor = (function () {
            var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
                transform,
                i = 0,
                l = vendors.length;

            for ( ; i < l; i++ ) {
                transform = vendors[i] + 'ransform';
                if ( transform in _elementStyle ){
                    return vendors[i].substr(0, vendors[i].length-1);
                }
            }

            return false;
        })();

        function _prefixStyle (style) {
            if ( _vendor === false ){
                return false;
            }
            if ( _vendor === '' ){
                return style;
            }
            return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
        }

        me.extend = function (target, obj) {
            for ( var i in obj ) {
                target[i] = obj[i];
            }
        };

        var _transform = _prefixStyle('transform');

        me.extend(me, {
            hasTransform: _transform !== false,
            hasPerspective: _prefixStyle('perspective') in _elementStyle,
            hasTouch: 'ontouchstart' in window,
            hasPointer: navigator.msPointerEnabled,
            hasTransition: _prefixStyle('transition') in _elementStyle
        });

        me.extend(me.style = {}, {
            transform: _transform,
            transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
            transitionDuration: _prefixStyle('transitionDuration'),
            transitionProperty: _prefixStyle('transitionProperty'),
            transformOrigin: _prefixStyle('transformOrigin'),
            perspective: _prefixStyle('perspective'),
            perspectiveOrigin: _prefixStyle('perspectiveOrigin'),
            transformStyle: _prefixStyle('transformStyle')
        });

        me.extend(me.eventType = {}, {
            touchstart: 1,
            touchmove: 1,
            touchend: 1,

            mousedown: 2,
            mousemove: 2,
            mouseup: 2,

            MSPointerDown: 3,
            MSPointerMove: 3,
            MSPointerUp: 3
        });
        me.addEvent = function (el, type, fn, capture) {
            el.addEventListener(type, fn, !!capture);
        };

        me.removeEvent = function (el, type, fn, capture) {
            el.removeEventListener(type, fn, !!capture);
        };
        return me;
    })();
    var START_EV = utils.hasTouch ? 'touchstart' : 'mousedown',
        MOVE_EV = utils.hasTouch ? 'touchmove' : 'mousemove',
        END_EV = utils.hasTouch ? 'touchend' : 'mouseup',
        CANCEL_EV = utils.hasTouch ? 'touchcancel' : 'mouseup';

    function support(props) {
        for(var i = 0, l = props.length; i < l; i++) {
            if(typeof el.style[props[i]] !== "undefined") {
                return props[i];
            }
        }
    }
    /*
     * 초기 조건: markup의 순서와 동일하게 유지 됨
     * face  : rotate(xdeg, ydeg)
     * top   : 0
     * front : 1
     * right : 2
     * back  : 3
     * left  : 4
     * bottom: 5
     * 기준하나 양축으로 180도 회전하면 같으니 하나 추가
     * 각 면별로 첫번째 나오는 것이 사용자 입장에서 name tag가 아래로 향하는 올바른 모습으로 보이는 각도임
     */
    var initialFaceDeg = [
        {faceIdx: 0, x: 270,y: 0  },//top
        {faceIdx: 0, x: 270,y: 90 },//top
        {faceIdx: 0, x: 270,y: 180},//top
        {faceIdx: 0, x: 270,y: 270},//top
        {faceIdx: 0, x: 90, y: 180},//top
        {faceIdx: 1, x: 0,  y: 0  },//front
        {faceIdx: 1, x: 180,y: 180},//front
        {faceIdx: 2, x: 0,  y: 270},//right
        {faceIdx: 2, x: 180,y: 90 },//right
        {faceIdx: 3, x: 0,  y: 180},//back은 x축 180 회전
        {faceIdx: 3, x: 180,y: 0  },//back y축 180 회전하는 두가지 경우
        {faceIdx: 4, x: 0,  y: 90 },//left
        {faceIdx: 4, x: 180,y: 270},//left
        {faceIdx: 5, x: 90, y: 0  },//bottom
        {faceIdx: 5, x: 90, y: 90 },//bottom
        {faceIdx: 5, x: 90, y: 180},//bottom
        {faceIdx: 5, x: 90, y: 270},//bottom
        {faceIdx: 5, x: 270,y: 180}//bottom
    ];
    //constructor
    function CubeView (el, options) {
        var i, tmp;
        // this.viewport = typeof el === 'string' ? document.querySelector(el) : el;
        this.viewport = el;
        this.cube = this.viewport.children[0];
        this.faceStyles = [];

        this.faces = [];
        //육면체 loading
        this.faces.push(this.viewport.getElementsByClassName('face top')[0]);
        this.faces.push(this.viewport.getElementsByClassName('face front')[0]);
        this.faces.push(this.viewport.getElementsByClassName('face right')[0]);
        this.faces.push(this.viewport.getElementsByClassName('face back')[0]);
        this.faces.push(this.viewport.getElementsByClassName('face left')[0]);
        this.faces.push(this.viewport.getElementsByClassName('face bottom')[0]);
        //extra card loading if exist
        tmp = this.cube.querySelectorAll('.extra');
        if (tmp.length > 0) {
            for (i=0; i<tmp.length; i++) {
                this.faces.push(tmp[i]);
            }
        }


        this.options = {
            transDuration: "700ms",
            perspective: "800px",
            perspectiveOrigin: "80% 200px",
            onAnimationEnd: function (){},
            eventQueueSize: 5,
            useTransition: false, //touchend시 transition으로 momuntum scrolling 수행
            tranTimingFunc: "cubic-bezier(0.21, 0.78, 0.4, 1.02)",
            transitionThreshold: 5,
            yOffset: 0,
            flatXLeftLimit: 300,
            flatXRightLimit: -450,
            enableOrientationEvent: false,
            enableIdleAnimation: false,
            idleAnimationType: "blink",
            enableExtraGameCard: false
        };

        for ( i in options ) {
            this.options[i] = options[i];
        }

        if (typeof this.options.viewportX !== "undefined") {
            this.viewportX = this.options.viewportX;
        }
        if (typeof this.options.viewportY !== "undefined") {
            this.viewportY = this.options.viewportY;
        }
        //view port setting
        this.viewport.style[utils.style.perspectiveOrigin] = this.options.perspectiveOrigin;
        // cube의 각 face를 setting
        // 2014-11-21 배철민M 수정 : event1,event2 가 각각 front/top 위치 game 순위별로 나머지에 위치
        this.faces[2].style[utils.style.transform] = "rotateX(90deg) translateZ(200px)";//top
        this.faces[3].style[utils.style.transform] = "translateZ(200px)";//front
        this.faces[0].style[utils.style.transform] = "rotateY(90deg) translateZ(200px)";//right
        this.faces[4].style[utils.style.transform] = "rotateY(180deg) translateZ(200px)";//back
        this.faces[1].style[utils.style.transform] = "rotateY(270deg) translateZ(200px)";//left
        this.faces[5].style[utils.style.transform] = "rotateX(270deg) translateZ(200px)";//bottom

        this.saveFaceStyles();

        this._initEvents();
    }

    CubeView.prototype = {
        handleEvent: function (e) {
            switch ( e.type ) {
                case START_EV:
                    this._start(e);
                    break;
                case MOVE_EV:
                    if (this.flattened) {
                        this._translate(e);
                    } else {
                        this._rotate(e);
                    }
                    break;
                case END_EV:
                case CANCEL_EV:
                if (this.flattened) {
                    this._translateEnd(e);
                } else {
                    this._rotateEnd(e);
                }
                    break;
                case 'orientationchange':
                case 'resize':
                    this._resize();
                    break;
                case 'webkitTransitionEnd':
                    this._transitionEnd(e);
                    break;
                case 'keydown':
                    this._keyDown(e);
                case 'deviceorientation':
                    this._deviceOrientHandler(e);
                    break;
            }
        },
        _initEvents: function (remove) {
            utils.addEvent(window, 'orientationchange', this);
            utils.addEvent(window, 'resize', this);

            utils.addEvent(this.viewport, START_EV, this);
            utils.addEvent(this.viewport, MOVE_EV, this);
            utils.addEvent(this.viewport, CANCEL_EV, this);
            utils.addEvent(this.viewport, END_EV, this);

            utils.addEvent(window, "keydown", this);

            if (this.options.enableOrientationEvent && window.DeviceOrientationEvent) {
                utils.addEvent(window,"deviceorientation",this);
            }
        },
        destroy: function () {
            utils.removeEvent(window, 'orientationchange', this);
            utils.removeEvent(window, 'resize', this);

            utils.removeEvent(this.viewport, START_EV, this);
            utils.removeEvent(this.viewport, MOVE_EV, this);
            utils.removeEvent(this.viewport, CANCEL_EV, this);
            utils.removeEvent(this.viewport, END_EV, this);

            utils.removeEvent(window, "keydown", this);

            utils.removeEvent(window, "deviceorientation", this);
        },
        refresh: function () {
        },
        posRecord: {
            start: {},
            all: [],//move 발생할때 최고 5개를 저장하여 momentum animation에서 사용
            last: {}
        },
        //flat mode일때 x, y 좌표
        //mode 변경시마다 매번 0,0으로 reset 됨
        flatX: 0,
        flatY: 0,
        //현재 viewport X 좌표
        viewportX: -30,
        //현재 viewport Y 좌표
        viewportY: -35,
        enabled: true,
        //cube가 아닌 평면으로 변경되어 있는지 여부
        flattened: false,
        //정식으로 start 했는지
        started: false,
        //touch 이벤트 시작
        _start: function (e) {
            var pos;
            pos = e.touches ? e.touches[0] : e;

            if(!this.enabled) {
                return;
            }

            this.started = true;
            if(this.options.useTransition){
                this.clearTransitionProperty( this.cube );
            }

            this.posRecord.start.x = pos.pageX;
            this.posRecord.start.y = pos.pageY;
            this.posRecord.last.x = pos.pageX;
            this.posRecord.last.y = pos.pageY;
            this.posRecord.all = [];
            this.posRecord.all.push({
                x: pos.pageX,
                y: pos.pageY
            });

            if (this.options.enableIdleAnimation) {
                this.stopIdleAnimation();
            }
        },
        //touchmove 이벤트 처리. 실제 viewport를 움직임
        _translate: function (e) {
            var pos,
                x,
                y;
            pos = e.touches ? e.touches[0] : e;

            if (!this.started){
                return;
            }
            e.preventDefault();

            this.posRecord.all.push({
                x: pos.pageX,
                y: pos.pageY
            });
            if (this.posRecord.all.length > this.options.eventQueueSize) {
                this.posRecord.all.shift();
            }
            // 0.5 is scale factor for considering viewport perspective
            // since one pixel in touch does not match to one pixel with perspecive
            x = this.flatX - parseInt((this.posRecord.last.x - pos.pageX)/0.5);

            this._setFlatPos(x);

            this.posRecord.last.x = pos.pageX;
            this.posRecord.last.y = pos.pageY;
        },
        //touchmove 이벤트 처리. 실제 viewport를 움직임
        _rotate: function (e) {
            var pos,
                x,
                y;
            var movementScaleFactor = utils.hasTouch ? 1 : 1;
            pos = e.touches ? e.touches[0] : e;

            if (!this.started){
                return;
            }
            e.preventDefault();

            this.posRecord.all.push({
                x: pos.pageX,
                y: pos.pageY
            });
            if (this.posRecord.all.length > this.options.eventQueueSize) {
                this.posRecord.all.shift();
            }

            if (forward(this.posRecord.last.x, pos.pageX)) {
                this.posRecord.start.x = this.posRecord.last.x;
            }
            if (forward(this.posRecord.last.y, pos.pageY)) {
                this.posRecord.start.y = this.posRecord.last.y;
            }

            x = this.viewportX + parseInt((this.posRecord.last.y - pos.pageY)/movementScaleFactor);
            y = this.viewportY - parseInt((this.posRecord.last.x - pos.pageX)/movementScaleFactor);
            x = x%360;
            y = y%360;

            this._setRotatePos({
                x: x,
                y: y
            });

            this.posRecord.last.x = pos.pageX;
            this.posRecord.last.y = pos.pageY;

            function forward(v1, v2) {
                return v1 >= v2 ? true : false;
            }
        },
        //실제 transform 을 설정
        _setRotatePos: function(coords){
            if(!coords) {
                return;
            }
            if(typeof coords.x === "number") {
                this.viewportX = coords.x;
            }
            if(typeof coords.y === "number") {
                this.viewportY = coords.y;
            }
            this.cube.style[utils.style.transform] = "rotateX("+this.viewportX+"deg) rotateY("+this.viewportY+"deg)";
        },
        //실제 flat mode일때 transform 을 설정
        _setFlatPos: function(x){
            var posStr = "rotateX("+this.viewportX+"deg) rotateY("+this.viewportY+"deg)";
            if (this.options.flatXLeftLimit<x) {
                x = this.options.flatXLeftLimit;
            }
            if (this.options.flatXRightLimit>x){
                x = this.options.flatXRightLimit;
            }
            this.flatX = x;
            posStr += "translate3d("+ x +"px,0,0)";
            this.cube.style[utils.style.transform] = posStr;
        },
        _translateEnd: function (e) {
            var x, y,
                dx, dy,
                pageX, pageY,
                len,
                posRecordAll = this.posRecord.all;

            if (!this.options.useTransition) {
                this.started = false;
                return;
            }

            //FIX ME: 성능 최적화한후에 1로 나누는 경우이면 버려라
            var movementScaleFactor = 2.0;

            pageX = 0;
            pageY = 0;
            len = posRecordAll.length;
            if (len <= 1) {
                dx = 0;
                dy = 0;
            } else {
                dx = posRecordAll[len-1].x - posRecordAll[0].x;
                dy = posRecordAll[len-1].y - posRecordAll[0].y;
            }
            if( Math.abs(dx) < this.options.transitionThreshold && Math.abs(dy) < this.options.transitionThreshold) {
                posRecordAll = [];
                return;
            }

            pageX = posRecordAll[len-1].x + dx;
            pageY = posRecordAll[len-1].y + dy;

            x = this.flatX - parseInt((this.posRecord.last.x - pageX)/0.1);

            utils.addEvent(this.cube, 'webkitTransitionEnd', this);

            this.setTransitionProperty(this.cube);

            this._setFlatPos(x);

            posRecordAll = [];
        },
        _rotateEnd: function (e) {
            var x, y,
                dx, dy,
                pageX, pageY,
                len,
                posRecordAll = this.posRecord.all;

            if (!this.options.useTransition) {
                this.started = false;
                return;
            }

            //FIX ME: 성능 최적화한후에 1로 나누는 경우이면 버려라
            var movementScaleFactor = 2.0;

            pageX = 0;
            pageY = 0;
            len = posRecordAll.length;
            if (len <= 1) {
                dx = 0;
                dy = 0;
            } else {
                dx = posRecordAll[len-1].x - posRecordAll[0].x;
                dy = posRecordAll[len-1].y - posRecordAll[0].y;
            }
            if( Math.abs(dx) < this.options.transitionThreshold && Math.abs(dy) < this.options.transitionThreshold) {
                posRecordAll = [];
                return;
            }

            pageX = posRecordAll[len-1].x + dx;
            pageY = posRecordAll[len-1].y + dy;

            x = this.viewportX + parseInt((this.posRecord.last.y - pageY)/movementScaleFactor);
            y = this.viewportY - parseInt((this.posRecord.last.x - pageX)/movementScaleFactor);

            utils.addEvent(this.cube, 'webkitTransitionEnd', this);

            this.setTransitionProperty(this.cube);

            this._setRotatePos({
                x: x,
                y: y
            });

            posRecordAll = [];
        },
        _transitionEnd: function (e) {
            if (!this.options.useTransition) {
                console.log("useTransition이 off인데 transitionend가 발생함");
                return;
            }
            utils.removeEvent(this.cube, 'webkitTransitionEnd', this);
            this.options.onAnimationEnd();

            this.clearTransitionProperty(this.cube);
            this.started = false;
        },
        _keyDown: function(e){
            var x, y;
            e.preventDefault();
            switch(e.keyCode)
            {
                case 37: // left
                    y =  this.viewportY - 90;
                    break;
                case 38: // up
                    x= this.viewportX + 90;
                    break;
                case 39: // right
                    y = this.viewportY + 90;
                    break;
                case 40: // down
                    x = this.viewportX - 90;
                    break;
                default:
                    break;
            };
            if (this.options.useTransition) {
                this.setTransitionProperty( this.cube );
            }
            this._setRotatePos({
                    x: x,
                    y: y
                })
        },
        reset: function(){
            var x = 0,
                y = 0;
            if(this.flattened){
                this.restoreCubic();
            }
            if (this.options.useTransition) {
                this.started = true;
                this.setTransitionProperty( this.cube );
                utils.addEvent(this.cube, 'webkitTransitionEnd', this);
            }
            this._setRotatePos({x: 0, y:0});
        },
        move: function(x, y){
            if(this.flattened){
                return;
            }
            if (this.options.useTransition) {
                this.setTransitionProperty( this.cube );
            }
            this._setRotatePos({x: x, y:y});
        },
        //sensor 기울기 기록용 변수
        lastXMove: 0,
        _deviceOrientHandler: function(eventData){
            var sensorSensitivity = 10,
                sensorFilterDepth = 10.
                movementUnit = 5;
            // http://www.html5rocks.com/en/tutorials/device/orientation/deviceorientationsample.html
            var tiltLR = eventData.gamma,//left-to-right tile in degrees, where right is positive
                tiltFB = eventData.beta,//beta is front-to-back tilt in degrees, where front is positive
                dir = eventData.alpha,//alpha is the compass direction the device is facing in degrees
                x = this.flatX;

            if (this.started) {
                //사용자 touch 조작시 deviceorientationevent는 처리하지 않음
                return;
            }
            if(!this.flattened){
                return;
            }
            if( tiltLR > sensorSensitivity ) {
                //right
                this.lastXMove++;
                if(this.lastXMove>sensorFilterDepth){
                    x += movementUnit;
                    this.lastXMove = sensorFilterDepth;
                }
            } else if (tiltLR < -sensorSensitivity) {
                //left
                this.lastXMove--;
                if(this.lastXMove<-sensorFilterDepth){
                    x -= movementUnit;
                    this.lastXMove = -sensorFilterDepth;
                }
            } else {
                return;
            }

            if (this.options.useTransition) {
                this.setTransitionProperty( this.cube );
            }

            this._setFlatPos(x);
        },
        setTransitionProperty: function (elm){
            elm.style[utils.style.transitionDuration] = this.options.transDuration;
            elm.style[utils.style.transitionProperty] = utils.style.transform;
            elm.style[utils.style.transitionTimingFunction] = this.options.tranTimingFunc;
        },
        clearTransitionProperty: function (elm){
            elm.style[utils.style.transitionDuration] = "";
            elm.style[utils.style.transitionProperty] = "";
            elm.style[utils.style.transitionTimingFunction] = "";
        },
        enable: function(){
            this.enabled = true;
        },
        disable: function(){
            this.enabled = false;
        },
        flattenCubic: function(){
            var i, len, dx, dy, dz, xOffset, style;
            if (this.flattened) {
                return;
            }
            this.reset();
            this.saveFaceStyles();
            //flatten 시킨다
            xOffset = 410;
            dz = -400;
            len = this.faces.length;
            for (i=0; i<len; i++) {
                style = "";
                dx = -xOffset + xOffset*Math.floor(i/2);
                dy = (i%2) ? 160: -250;
                dz = -400;
                style = "translate3d(" + dx + "px," + dy +"px," + dz + "px" + ")";
                if(this.options.enableExtraGameCard && i>5) {
                    this.faces[i].style.opacity = 1.0;
                }
                this.faces[i].style[utils.style.transform] = style;
            }
            this.flatX = 0;
            this.flatY = 0;
            if (this.options.enableExtraGameCard) {
                this.options.flatXRightLimit = -450 + Math.max( 0, Math.floor(len/2)-2)*(-350);//-450에서 한 column 추가시마다 -300씩 감소
            }

            this.flattened = true;
        },
        //flatten된 face들을 cube로 복원
        restoreCubic: function(){
            if (!this.flattened) {
                return;
            }
            this.restoreFaceStyles();
            this.flattened = false;
            this.reset();
        },
        //cubic과 flatten을 toggle
        toggleCubic: function(){
            if (this.flattened) {
                this.restoreCubic();
            } else {
                this.flattenCubic();
            }
        },
        //face의 style 값을 저장
        saveFaceStyles: function(){
            var i;

            this.faceStyles = [];
            for (i=0; i<this.faces.length; i++) {
                this.faceStyles.push(this.faces[i].style.cssText);
            }
        },
        //face의 style값을 복원
        restoreFaceStyles: function(){
            var i;

            for (i=0; i<this.faces.length; i++) {
                this.faces[i].style.cssText = this.faceStyles[i];
            }
        },
        //화면에 대면중인 face 정보 축출
        getFrontFacingFaceInfo: function(){
            var curXdeg = (this.viewportX+360)%360, //360 보다 작은 양수각으로 변환
                curYdeg = (this.viewportY+360)%360,
                smallestVal,
                faceIdx;

            //현재 (x,y)deg와 가장 근접한 face를 찾아서 돌려준다
            var distances = initialFaceDeg.map(function(cVal, idx, array){
                var xDiff = Math.min( Math.abs(cVal.x - curXdeg), Math.abs(cVal.x + 360 - curXdeg) ),
                    yDiff = Math.min( Math.abs(cVal.y - curYdeg), Math.abs(cVal.y + 360 - curYdeg) );
                return xDiff + yDiff;
            });
            smallestVal = Math.min.apply(Math, distances)
            for (var i=0; i<distances.length; i++){
                if (distances[i] === smallestVal) {
                    faceIdx = initialFaceDeg[i].faceIdx;
                    //면이 정해지면, 해당 면중에 사용자 입장에서 올바로 보이는 각도를 찾아서 돌려준다
                    //올바로 보이는 각도란, initialFaceDeg에서 각면의 복수개의 각들중에 가장 첫번째 저장된 값이다
                    //그래서 아래 for loop에서는 주어진 index에서 가장 작은 위치로 찾아 내려간다
                    for(var j=i-1; j>=0; j--){
                        if (initialFaceDeg[j].faceIdx === faceIdx) {
                            i = j;
                            continue;
                        } else {
                            i = j+1;
                            break;
                        }
                    }
                    break;
                }
            }
            return {
                face: this.faces[faceIdx],
                degs: initialFaceDeg[i]
            };
        },
        getFrontFacingFaceInfoByElement: function(element){
            var i, faceIdx;

            for (i=0; i<this.faces.length; i++) {
                if (this.faces[i] === element) {
                    faceIdx = i;
                    break;
                }
            }
            for (i=0; i<initialFaceDeg.length; i++) {
                if (initialFaceDeg[i].faceIdx === faceIdx) {
                    break;
                }
            }
            return {
                face: this.faces[faceIdx],
                degs: initialFaceDeg[i]
            };
        }
    }

    return CubeView;
})(window, document);