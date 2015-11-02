var FPS = 60;
var TURN_ADDING = 2;
var SPEED_ADDING = 0.2;
var MAX_SPEED = 70;

var KEYCODE_UP = 38;
var KEYCODE_DOWN = 40;
var KEYCODE_LEFT = 37;
var KEYCODE_RIGHT = 39;
var KEYCODE_SPACE = 32;


var leftPress;
var rightPress;
var upPress;
var downPress;

var canvas;                //Main canvas
var stage;                 //Main display stage

var hero;                  //the actual hero
var alive;                 //whether the player is alive

var messageField;          //Message display field
var scoreField;            //score Field
var newSpeed;

//register key functions



function GameController(canvas) {
    this.hero = null;
    this.units = {};
    this.rotate = false;
    this.speed = false;
    this.canvas = canvas;

    var controller = this;
    document.onkeydown = function (e) {
        controller.handleKeyDown(e);
    };
    document.onkeyup = function (e) {
        controller.handleKeyUp(e);
    };


    this.prepareGame = function () {
        this.stage = new createjs.Stage(this.canvas);
        this.messageField = new createjs.Text("Welcome: Click to play", "bold 24px Arial", "#000");
        this.messageField.maxWidth = 1000;
        this.messageField.textAlign = "center";
        this.messageField.textBaseline = "middle";
        this.messageField.x = this.canvas.width / 2;
        this.messageField.y = this.canvas.height / 2;
        this.stage.addChild(this.messageField);
        this.stage.update();     //update the stage to show text
    };

    this.startGame = function () {
        var socket = createSocket(this);
        this.stage.removeChild(this.messageField);
        this.stage.update();
    };

    this.onData = function (event) {
        var answer = JSON.parse(event.data);
        console.log(answer);

        for (var key in answer){
            switch (key) {
                case 'init':
                    this.restart(answer.init);
                    break;
                case 'new':
                    this.newUnit(answer.new);
                    break;
                case 'update':
                    this.updateUnit(answer.update);
                    break;
            }
        }

    };

    this.restart = function (init) {
        //hide anything on stage and show the score
        var unitsObj = init['units'];
        var hero_id = init['hero_id'];
        var game_field = init['game'];
        this.frequency = init['frequency'];
        this.canvas.width = game_field.width;
        this.canvas.hight = game_field.hight;
        this.stage.removeAllChildren();
        scoreField = new createjs.Text("0", "bold 18px Arial", "#FFFFFF");
        scoreField.textAlign = "right";
        scoreField.x = this.canvas.width - 20;
        scoreField.y = 20;
        scoreField.maxWidth = 1000;
        scoreField.text = (0).toString();
        this.stage.addChild(scoreField);

        //create Units
        this.units = {};

        //ensure stage is blank and add the hero
        this.stage.clear();
        this.stage.addChild(this.hero);

        for (var i in unitsObj) {
            this.newUnit(unitsObj[i]);
        }
        this.hero = this.units[hero_id];

        //reset key presses
        this.leftPress = this.rightPress = this.upPress = this.downPress = false;

        this.stage.update();

        //start game timer
        if (!createjs.Ticker.hasEventListener("tick")) {
            createjs.Ticker.setFPS(FPS);
            var controller = this;
            createjs.Ticker.addEventListener("tick", function () {
                controller.tick()
            });
        }
        console.log(createjs.Ticker.getInterval())
    };

    this.showSpeed = function (value) {
        scoreField.text = Number(value).toString();
    };

    this.newUnit = function (unitData) {
        var unit = new createjs.Bitmap("static/images/" + unitData.type + ".png");
        for (var property in unitData) {
            unit[property] = unitData[property];
        }
        this.units[unitData.id] = unit;
        this.stage.addChild(unit);
        this.stage.update();

    };

    this.updateUnit = function (unitData) {
        var id = unitData['id'];

        var unit = this.units[id];
        for (var key in unitData) {
            if (unit.hasOwnProperty(key)) {
                unit[key] = unitData[key]
            }
        }
        this.units[id].speedTick = this.units[id].speed / this.frequency / FPS
    };

    this.tick = function (event) {
        this.showSpeed(this.hero.speed);

        var units = this.units;
        for (var i in units) {
            var unit = units[i];
            if (unit.speedTick && unit.speed != 0) {
                if (unit.x != unit.x1 || unit.y != unit.y1) {
                    unit.x = this.canvas.width - unit.x;
                    unit.y = this.canvas.height - unit.y;
                    unit.x += Math.sin(unit.rotation * (Math.PI / -180)) * unit.speedTick;
                    unit.y += Math.cos(unit.rotation * (Math.PI / -180)) * unit.speedTick;
                    unit.x = this.canvas.width - unit.x;
                    unit.y = this.canvas.height - unit.y;
                }
            }
        }

        this.stage.update();

    };

    this.handleKeyDown = function (e) {
        //cross browser issues exist
        if (!e) {
            var e = window.event;
        }
        switch (e.keyCode) {
            case KEYCODE_LEFT:
                if (!this.leftPress) {
                    this.leftPress = true;
                    this.sendAction('rotate', 'left')
                }
                return false;
            case KEYCODE_RIGHT:
                if (!this.leftPress) {
                    this.leftPress = true;
                    this.sendAction('rotate', 'right')
                }
                return false;
            case KEYCODE_UP:
                //TODO: What is the meaning of `speed` as boolean. Non sense to me
                if (!this.speed) {
                    this.speed = true;
                    this.sendAction('change_speed', 'front');
                }
                return false;
            case KEYCODE_DOWN:
                if (!this.speed) {
                    this.speed = true;
                    this.sendAction('change_speed', 'back');
                }
                return false;
            case KEYCODE_SPACE:
                console.log('space');
                return false;
        }
    };

    this.handleKeyUp = function (e) {
        //cross browser issues exist
        if (!e) {
            var e = window.event;
        }
        switch (e.keyCode) {
            case KEYCODE_LEFT:
                if (this.leftPress) {
                    this.leftPress = false;
                    this.sendAction('rotate', 'stop')
                }
                break;
            case KEYCODE_RIGHT:
                if (this.leftPress) {
                    this.leftPress = false;
                    this.sendAction('rotate', 'stop')
                }
                break;
            case KEYCODE_UP:
                if (this.speed) {
                    this.speed = false;
                    this.sendAction('change_speed', 'stop')
                }
                break;
            case KEYCODE_DOWN:
                if (this.speed) {
                    this.speed = false;
                    this.sendAction('change_speed', 'stop')
                }
                break;
        }
    };

    this.sendAction = function (action, value) {
        var http = new XMLHttpRequest();
        var url = "api/hero/" + this.hero.id + "/action/" + action + "/" + value;
        http.open("POST", url, true);
        http.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        http.send(JSON.stringify({'value': value}));
    }

}