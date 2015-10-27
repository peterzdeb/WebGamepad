function sockets(){
    var socket = new WebSocket("ws://localhost:8765");
    window.frequency = 1;
    window.height = 0;
    window.width = 0;
    var hero = {};
    window.heroId = '';
    var units = [];

    socket.onopen = function(event) {
        console.log("Connected.");
    };

    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log('Connection closed');
        } else {
            console.log('disconnection');
        }
            console.log('code: ' + event.code + ' reason: ' + event.reason);
    };

    socket.onmessage = function(event) {
        var answer = JSON.parse(event.data) || event.data;
        console.log(answer);
        if (answer.id)
            document.cookie = "hero_id=" + answer.id;
        if (answer.hasOwnProperty('frequency')) {
            frequency = answer.frequency;
            height = answer.field.height;
            width = answer.field.width;
            heroId = answer.id;
        }
        else if (units.length == 0) {
            units = answer;
            hero = units[heroId];
            restart(hero, units);
        }
        else {
            units = answer;
            hero = units[heroId];
            unitsUpdate(hero, units);
        }
    };

    socket.onerror = function(error) {
        console.log("Error " + error.message);
    };
}


