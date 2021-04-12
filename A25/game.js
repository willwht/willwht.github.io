/*
game.js for Perlenspiel 3.3.xd
Last revision: 2021-04-08 (BM)

Perlenspiel is a scheme by Professor Moriarty (bmoriarty@wpi.edu).
This version of Perlenspiel (3.3.x) is hosted at <https://ps3.perlenspiel.net>
Perlenspiel is Copyright © 2009-21 Brian Moriarty.
This file is part of the standard Perlenspiel 3.3.x devkit distribution.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with the Perlenspiel devkit. If not, see <http://www.gnu.org/licenses/>.
*/

/*
This JavaScript file is a template for creating new Perlenspiel 3.3.x games.
Add code to the event handlers required by your project.
Any unused event-handling function templates can be safely deleted.
Refer to the tutorials and documentation at <https://ps3.perlenspiel.net> for details.
*/

/*
The following comment lines are for JSHint <https://jshint.com>, a tool for monitoring code quality.
You may find them useful if your development environment is configured to support JSHint.
If you don't use JSHint (or are using it with a configuration file), you can safely delete these lines.
*/

/* jshint browser : true, devel : true, esversion : 6, freeze : true */
/* globals PS : true */

"use strict"; // Do NOT delete this directive!

/*
PS.init( system, options )
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

/*

General layout:
	-spawn object
	-every action, decrease counter via FAKE_TICK()
	-if player object attempts to move off grid, return and do not decrease counter (maybe play a noise)
	-if player attempts to move into a space occupied by an interactable object, interact based on the type
		-pushable objects:
			-if the space adjacent to the object in the direction of the player's movement is empty and not off-grid, then
				-move the object to that space
				-move the player to the object's space
			-else do nothing, maybe play a bump sound effect
		-consumables
			-apply the bonus the consumable grants to the player
			-remove the consumable
		-goal
			-re-initialize using next level's data
	-once the counter reaches 0, game over
 */

var CD = ( function() {
	//"use strict";

	var GRID_X = 31;
	var GRID_Y = 31;

	var PLAYER_COLOR = PS.COLOR_CYAN;
	var FLOOR_COLOR = PS.COLOR_GRAY_LIGHT;
	var WALL_COLOR = PS.COLOR_GRAY_DARK;
	var PUSHABLE_COLOR = PS.COLOR_WHITE;
	var COLLECTIBLE_COLOR = PS.COLOR_ORANGE;
	var GOAL_COLOR = PS.COLOR_RED;

	//bead ID stuff for bead data purposes
	var IS_FLOOR = "FLOOR";
	var IS_WALL = "WALL";
	var IS_TIMERUP = "TIMERUP";
	var IS_PUSHBLOCK = "PUSHBLOCK";
	var IS_GOAL = "GOAL";

	//initial timer values for various difficulties (not implemented in this version, just for planning ahead)
	var HARD_COUNTER_START = 100;
	var NORMAL_COUNTER_START = 200;
	var EASY_COUNTER_START = 300;

	//Level data
	var LEVEL_DATA = [
		{	//index 0, level 0
			px : 1,
			py : 1,

			gx : 13,
			gy : 13,

			//walls : [[2,2],[1,2],[2,1]]
		},
		{	//index 0, level 0
			px : 13,
			py : 13,

			gx : 1,
			gy : 1,

			walls : [[2,2],[1,2],[2,1]]
		},
		{	//index 0, level 0
			px : 1,
			py : 1,

			gx : 13,
			gy : 13,

			walls : [[0,2],[2,2],[1,2],[2,1],[4,0],[4,1],[4,2],[12,13],[13,14],[14,13]],

			pushables : [[3,2]]
		},
		{	//index 0, level 0
			px : 13,
			py : 13,

			gx : 1,
			gy : 1,

			walls : [[0,2],[2,2],[1,2],[2,1],[4,0],[4,1],[4,2],[11,14],[12,14],[13,14],[14,14],[15,14],[11,13],[15,13],[11,12],[15,12],[11,11],[15,11],[11,9],[12,9],[13,9]],

			pushables : [[3,3],[12,11],[13,11],[14,11]]
		}
	];

	//variable to determine if gameplay is enabled
	var play;

	//variable for storing the difficulty
	var difficulty;

	//the value to be displayed on the timer
	var counter;

	//player actor's current position [x, y]
	var playerPos;

	//current level
	var currentLevel;

	//"fake" tick function that is called whenever the player performs an action
	//it is "fake" because it only happens at specific times, but simulates the passage of a single unit of time
	var fakeTick = function () {
		//subtract 1 from the counter, and update the text
		counter--;
		PS.statusText(counter);

		if(counter < 0){
			initializeLevel(0);
			counter = HARD_COUNTER_START;
			PS.statusText(counter);
		}

		//time-based objects should also change accordingly here

	};

	var drawPlayer = function (x, y) {
		PS.color(x, y, PLAYER_COLOR);
		PS.data(x, y, IS_FLOOR);
	};

	var initializeLevel = function (level) {

		//disable playing
		play = false;

		//update level variable
		currentLevel = level;

		//clear grid, reset data of beads
		PS.color( PS.ALL, PS.ALL, FLOOR_COLOR );
		PS.data( PS.ALL, PS.ALL, IS_FLOOR ); // all floor

		//place walls, goal, collectibles
		if ( LEVEL_DATA[level].walls !== undefined ) {
			for ( var i = 0; i < LEVEL_DATA[level].walls.length; i++ ) {
				var pos = LEVEL_DATA[level].walls[i];
				var x = pos[0];
				var y = pos[1];
				PS.color( x, y, WALL_COLOR );
				PS.data( x, y, IS_WALL );
			}
		}

		//place pushables
		if ( LEVEL_DATA[level].pushables !== undefined ) {
			for ( var i = 0; i < LEVEL_DATA[level].pushables.length; i++ ) {
				var pos = LEVEL_DATA[level].pushables[i];
				var x = pos[0];
				var y = pos[1];
				PS.color( x, y, PUSHABLE_COLOR );
				PS.data( x, y, IS_PUSHBLOCK );
			}
		}

		//place goal
		if ( LEVEL_DATA[level].gx !== undefined ) {
			PS.color(LEVEL_DATA[level].gx, LEVEL_DATA[level].gy, GOAL_COLOR);
			PS.data(LEVEL_DATA[level].gx, LEVEL_DATA[level].gy, IS_GOAL);
		}

		//place actor
		drawPlayer(LEVEL_DATA[level].px, LEVEL_DATA[level].py);
		playerPos = [LEVEL_DATA[level].px, LEVEL_DATA[level].py];

		//enable input
		play = true;
	};

	var movePlayer = function(x, y){

		if(!play){
			//if unable to play at the moment, then don't
			return;
		}

		if ((playerPos[0] + x) > GRID_X || (playerPos[0] + x) < 0 || (playerPos[1] + y) > GRID_Y || (playerPos[1] + y < 0)){
			//illegal move, return
			return;
		}

		var oldPos = playerPos;

		var nx = (playerPos[0] + x);
		var ny = (playerPos[1] + y);

		var newData = PS.data(nx, ny);

		if (newData === IS_WALL){
			//it's a wall, don't do anything
			return;
		}

		if (newData === IS_TIMERUP){
			//add to counter

		}

		if (newData === IS_PUSHBLOCK){
			//check if block can move

			if ((nx + x) > GRID_X || (nx + x) < 0 || (ny + y) > GRID_Y || (ny + y) < 0){
				//illegal move, return
				return;
			}

			var newData2 = PS.data(nx+x, ny+y);

			if (newData2 === IS_WALL){
				//it's a wall, don't do anything
				return;
			}

			if (newData2 === IS_TIMERUP){
				//would destroy a collectible, return
				return;
			}

			if (newData2 === IS_GOAL){
				//would block the goal, return
				return;
			}

			//move it and player if so, don't if not
			PS.data(nx+x, ny+y, IS_PUSHBLOCK);
			PS.color(nx+x, ny+y, PUSHABLE_COLOR);
		}

		if (newData === IS_GOAL){
			if(LEVEL_DATA.length > currentLevel + 1){
				initializeLevel(currentLevel + 1);
			}else{
				initializeLevel(0);
			}
		}
		else{

		}

		drawPlayer(nx, ny);
		playerPos = [nx, ny];
		PS.color(oldPos[0], oldPos[1], FLOOR_COLOR);

		fakeTick();

	};


	return {
		init : function(){

			counter = HARD_COUNTER_START;
			PS.statusText(counter);

			//PS.statusText("working so far");
			initializeLevel(0);
		},
		keydown : function(key) {
			switch (key) {
				case PS.KEY_ARROW_UP:
				case 87:
				case 119: {
					movePlayer( 0, -1 );
					break;
				}
				case PS.KEY_ARROW_DOWN:
				case 83:
				case 115: {
					movePlayer( 0, 1 );
					break;
				}
				case PS.KEY_ARROW_LEFT:
				case 65:
				case 97: {
					movePlayer( -1, 0 );
					break;
				}
				case PS.KEY_ARROW_RIGHT:
				case 68:
				case 100: {
					movePlayer( 1, 0 );
					break;
				}
				default: {
					break;
				}
			}
		}
	};
} () );

PS.init = function( system, options ) {
	// Uncomment the following code line
	// to verify operation:

	// PS.debug( "PS.init() called\n" );

	// This function should normally begin
	// with a call to PS.gridSize( x, y )
	// where x and y are the desired initial
	// dimensions of the grid.
	// Call PS.gridSize() FIRST to avoid problems!
	// The sample call below sets the grid to the
	// default dimensions (8 x 8).
	// Uncomment the following code line and change
	// the x and y parameters as needed.

	PS.gridSize( 31, 31 );
	PS.border( PS.ALL, PS.ALL, 0 );

	// This is also a good place to display
	// your game title or a welcome message
	// in the status line above the grid.
	// Uncomment the following code line and
	// change the string parameter as needed.

	 //PS.statusText( "Game" );

	// Add any other initialization code you need here.

	// Change this TEAM constant to your team name,
	// using ONLY alphabetic characters (a-z).
	// No numbers, spaces, punctuation or special characters!

	//PS.statusText( "ok this works?" );

	CD.init();

	const TEAM = "teamname";

	// This code should be the last thing
	// called by your PS.init() handler.
	// DO NOT MODIFY IT, except for the change
	// explained in the comment below.

	PS.dbLogin( "imgd2900", TEAM, function ( id, user ) {
		if ( user === PS.ERROR ) {
			return;
		}
		PS.dbEvent( TEAM, "startup", user );
		PS.dbSend( TEAM, PS.CURRENT, { discard : true } );
	}, { active : false } );


	
	// Change the false in the final line above to true
	// before deploying the code to your Web site.
};

/*
PS.touch ( x, y, data, options )
Called when the left mouse button is clicked over bead(x, y), or when bead(x, y) is touched.
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.touch = function( x, y, data, options ) {
	// Uncomment the following code line
	// to inspect x/y parameters:

	// PS.debug( "PS.touch() @ " + x + ", " + y + "\n" );

	// Add code here for mouse clicks/touches
	// over a bead.
};

/*
PS.release ( x, y, data, options )
Called when the left mouse button is released, or when a touch is lifted, over bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.release = function( x, y, data, options ) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.release() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse button/touch is released over a bead.
};

/*
PS.enter ( x, y, button, data, options )
Called when the mouse cursor/touch enters bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.enter = function( x, y, data, options ) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.enter() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse cursor/touch enters a bead.
};

/*
PS.exit ( x, y, data, options )
Called when the mouse cursor/touch exits bead(x, y).
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exit = function( x, y, data, options ) {
	// Uncomment the following code line to inspect x/y parameters:

	// PS.debug( "PS.exit() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse cursor/touch exits a bead.
};

/*
PS.exitGrid ( options )
Called when the mouse cursor/touch exits the grid perimeter.
This function doesn't have to do anything. Any value returned is ignored.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.exitGrid = function( options ) {
	// Uncomment the following code line to verify operation:

	// PS.debug( "PS.exitGrid() called\n" );

	// Add code here for when the mouse cursor/touch moves off the grid.
};

/*
PS.keyDown ( key, shift, ctrl, options )
Called when a key on the keyboard is pressed.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyDown = function( key, shift, ctrl, options ) {
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	CD.keydown(key);

	// Add code here for when a key is pressed.
};

/*
PS.keyUp ( key, shift, ctrl, options )
Called when a key on the keyboard is released.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyUp = function( key, shift, ctrl, options ) {
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyUp(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is released.
};

/*
PS.input ( sensors, options )
Called when a supported input device event (other than those above) is detected.
This function doesn't have to do anything. Any value returned is ignored.
[sensors : Object] = A JavaScript object with properties indicating sensor status; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
NOTE: Currently, only mouse wheel events are reported, and only when the mouse cursor is positioned directly over the grid.
*/

PS.input = function( sensors, options ) {
	// Uncomment the following code lines to inspect first parameter:

	//	 var device = sensors.wheel; // check for scroll wheel
	//
	//	 if ( device ) {
	//	   PS.debug( "PS.input(): " + device + "\n" );
	//	 }

	// Add code here for when an input event is detected.
};

/*
PS.shutdown ( options )
Called when the browser window running Perlenspiel is about to close.
This function doesn't have to do anything. Any value returned is ignored.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
NOTE: This event is generally needed only by applications utilizing networked telemetry.
*/

PS.shutdown = function( options ) {
	// Uncomment the following code line to verify operation:

	// PS.debug( "“Dave. My mind is going. I can feel it.”\n" );

	// Add code here to tidy up when Perlenspiel is about to close.
};

