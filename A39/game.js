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

var WC = (function () {
	//constants
	var GRASS_COLOR = PS.COLOR_GREEN;
	var PLAYER_COLOR = PS.COLOR_MAGENTA;
	var LOW_COLOR = PS.COLOR_BLACK;
	var MID_COLOR = PS.COLOR_BLUE;

	//playability status
	var canPlay = false;

	//check for restart status
	var willRestart = false;

	//instrument names for string arithmetic
	var instruments = [
		"piano_",
		"l_piano_",
		"hchord_",
		"l_hchord_",
		"xylo_"
	]

	//keys for notes to be played
	var keys = [
		["a4",
			"b4",
			"db5",
			"d5",
			"e5",
			"gb5",
			"ab5",
			"a5",
			"b5",
			"db6",
			"d6",
			"e6",
			"gb6",
			"ab6"],
		["a4",
			"b4",
			"c5",
			"d5",
			"e5",
			"f5",
			"g5",
			"a5",
			"b5",
			"c6",
			"d6",
			"e6",
			"f6",
			"g6"],
		["b4",
			"db5",
			"eb5",
			"e5",
			"gb5",
			"ab5",
			"bb5",
			"b5",
			"db6",
			"eb6",
			"e6",
			"gb6",
			"ab6",
			"bb6"],
		["b4",
			"db5",
			"d5",
			"e5",
			"gb5",
			"g5",
			"a5",
			"b5",
			"db6",
			"d6",
			"e6",
			"gb6",
			"g6",
			"a6"],
		["c4",
			"d4",
			"e4",
			"f4",
			"g4",
			"a4",
			"b4",
			"c5",
			"d5",
			"e5",
			"f5",
			"g5",
			"a5",
			"b5"],
		["c4",
			"d4",
			"eb4",
			"f4",
			"g4",
			"ab4",
			"bb4",
			"c5",
			"d5",
			"eb5",
			"f5",
			"g5",
			"ab5",
			"bb5"],
	];

	//flag to tell if the quote displayed should show for a longer or shorter amount of time (first level or subsequent)
	var engaged = false;

	//pointer to which sub-array to pull notes from
	var key;

	//pointer to which instrument to use
	var instrument;

	//string to be displayed on the status line
	var dispString = "Points: ";

	//points just gained storage string, to be displayed in front of points
	var lastGainString;

	//initial measurements of grid

	var GridLength = 16;
	var GridHeight = 16;

	//bounds for size of grid along either axis

	var GridBoundMaxX = 16;
	var GridBoundMinX = 7;

	var GridBoundMaxY = 16;
	var GridBoundMinY = 7;

	//given note sequence for a level
	var noteSeq = [];

	//notes you have placed so far in a level
	var placedNotes = [];

	//remaining overlaps before you lose points
	var remOverlap = 2;

	//point talley for a level
	var points = 0;

	return{
		//generates the visuals of a level
		genLevelBG : function(){
			//change grid size
			var newX = Math.max(GridBoundMinX, Math.floor(Math.random() * GridBoundMaxX));
			var newY = Math.max(GridBoundMinY, Math.floor(Math.random() * GridBoundMaxY));

			PS.gridSize(newX, newY);
			PS.gridFade(120);

			GridLength = newX;
			GridHeight = newY;

			//reset color of all beads
			PS.color(PS.ALL, PS.ALL, PS.COLOR_GRAY_LIGHT);
			PS.border(PS.ALL, PS.ALL, 0);
			PS.gridColor([Math.max(Math.floor(Math.random() * 255), 220), Math.max(Math.floor(Math.random() * 255), 220), Math.max(Math.floor(Math.random() * 255), 220)]);




			//apply piano key pattern
			var oddCheck = true;

			for(var i = 0; i < (GridHeight - 2); i++){	//-2 to exclude grass and player layers
				if (oddCheck){
					PS.color(0,i, PS.COLOR_BLACK);
					oddCheck = false
				}else{
					PS.color(0,i, PS.COLOR_WHITE);
					oddCheck = true;
				}
			}

			//apply grass color
			for(var i = 0; i < GridLength; i++){
				PS.color(i, (GridHeight - 1), GRASS_COLOR);
			}

			//draw player and opponent
			PS.color(1, GridHeight - 2, PLAYER_COLOR);
			PS.color(GridLength - 2, GridHeight - 2, [Math.floor(Math.random() * 244),Math.floor(Math.random() * 244),Math.floor(Math.random() * 244)]);
		},

		//generates a random level to be played
		genRandLevel : function(){
			//clear residual data in case of leftovers
			noteSeq = [];
			placedNotes = [];
			points = 0;

			for(var i = 0; i < GridLength - 4; i++){
				//generate notes within bound of ceiling to level above player, and space between opponent and player
				noteSeq[i] = Math.floor(Math.random() * (GridHeight - 2));
			}
		},

		//plays a note in a given key
		playNote : function(note){

			var shiftedNote = (GridHeight - 2) - note;

			PS.audioPlay(instruments[instrument] + keys[key][shiftedNote]);
		},

		//display two quotes and then display the notes in order of generation, playing a corresponding sound for each
		displayNotes : function(){

			var quotes = [
				"Everything happens for a reason.",
				"Even mistakes can teach lessons.",
				"The answer may not be as it seems.",
				"Do not be afraid to walk your own path.",
				"Do not be afraid to speak your own words.",
				"Mimicry can be useful, but not in excess.",
				"Seek the patterns of your opponent's words.",
				"There is more to a debate than memory.",
				"Repetition makes for a bad speaker.",
				"Pay attention to the color of your words.",
			];

			var shortfast;

			var theTimer;

			var counter = noteSeq.length;
			var counter2 = 1;

			var xPointer = 2;

			key = Math.min(5, Math.floor(Math.random() * 5));
			instrument = Math.min(4, Math.floor(Math.random() * 4));

			if(engaged){
				shortfast = 90;
			}else{
				shortfast = 120;
			}

			//display a random wisdom-esque quote in the status bar
			function sayQuotes(){
				if(counter2>0){
					PS.statusText(quotes[Math.min(9, Math.floor(Math.random() * quotes.length))]);
					counter2--;
				}else{
					PS.timerStop(theTimer);
					theTimer = PS.timerStart(30, showNotes);
				}
			}

			//display the notes in order of generation, playing a corresponding sound for each
			function showNotes(){
				if(counter > 0){
					PS.color(xPointer, noteSeq[noteSeq.length - counter], PS.COLOR_RED);

					WC.playNote(noteSeq[noteSeq.length - counter]);

					counter--;
					xPointer++;
				}else{
					PS.timerStop(theTimer);
					PS.statusText(dispString + "0");
					canPlay = true;
					engaged = true;
				}
			}
			PS.statusText(quotes[Math.min(4, Math.floor(Math.random() * quotes.length))]);
			theTimer = PS.timerStart(shortfast, sayQuotes);
		},

		//chain of functions that set up a level for play
		startSequence : function(){
			PS.statusText("");
			willRestart = false;
			canPlay = false;
			remOverlap = 2;
			this.genLevelBG();
			this.genRandLevel();
			this.displayNotes();
		},

		//detects click location, does math and awards points to the player appropriately based on the click
		awardPoints : function(positionY){

			if(positionY > GridHeight-1){
				return;
			}

			if(positionY < 0){
				return;
			}

			var positionX = placedNotes.length;
			//PS.debug(placedNotes[positionX-1]);

			if(positionX > GridLength - 6){

				if(positionX == 0){
					if(noteSeq[0] == positionY){
						//PS.debug("a");
						points += 1;
						placedNotes[positionX] = positionY;
						PS.color(positionX + 2, positionY, LOW_COLOR);
						PS.statusText("+1 |" + dispString + points.toString());
						this.playNote(positionY);
						if(!willRestart){
							willRestart = true;
							PS.statusText("Final level score: " + points.toString() + "/" + (((GridLength - 4) * 2) + 2).toString() + ". Click to replay.")
							PS.audioPlay( "fx_powerup1" );
							return;
						}else{

						}
						return;
					}else{
						//PS.debug("b");
						points += 2;
						placedNotes[positionX] = positionY;
						PS.color(positionX + 2, positionY, MID_COLOR);
						PS.statusText("+2 |" + dispString + points.toString());
						this.playNote(positionY);
						if(!willRestart){
							willRestart = true;
							PS.statusText("Final level score: " + points.toString() + "/" + (((GridLength - 4) * 2) + 2).toString() + ". Click to replay.")
							PS.audioPlay( "fx_powerup1" );
							return;
						}else{
							PS.audioPlay( "fx_bloop" );
							willRestart = false;
							this.startSequence();
							return;
						}
						return;
					}
				}else{
					if(positionX > 0){
						var trueDiff = Math.abs(noteSeq[positionX] - noteSeq[positionX - 1]);
						var yourDiff = Math.abs(positionY - placedNotes[positionX - 1]);

						//PS.debug(trueDiff);
						//PS.debug(yourDiff);

						if(noteSeq[positionX] == positionY){
							//PS.debug("d");
							if(remOverlap > 0){
								//PS.debug("e");
								points += 3;
								remOverlap--;
								PS.color(positionX + 2, positionY, PLAYER_COLOR);
								placedNotes[positionX] = positionY;
								PS.statusText("+3 |" + dispString + points.toString());
								this.playNote(positionY);
								if(!willRestart){
									willRestart = true;
									PS.statusText("Final level score: " + points.toString() + "/" + (((GridLength - 4) * 2) + 2).toString() + ". Click to replay.")
									PS.audioPlay( "fx_powerup1" );
									return;
								}else{
									PS.audioPlay( "fx_bloop" );
									willRestart = false;
									this.startSequence();
									return;
								}
								return;
							}else{
								//PS.debug("f");
								points += 1;
								PS.color(positionX + 2, positionY, LOW_COLOR);
								placedNotes[positionX] = positionY;
								PS.statusText("+1 |" + dispString + points.toString());
								this.playNote(positionY);
								if(!willRestart){
									willRestart = true;
									PS.statusText("Final level score: " + points.toString() + "/" + (((GridLength - 4) * 2) + 2).toString() + ". Click to replay.")
									PS.audioPlay( "fx_powerup1" );
									return;
								}else{
									PS.audioPlay( "fx_bloop" );
									willRestart = false;
									this.startSequence();
									return;
								}
								return;
							}
						}

						if(yourDiff == trueDiff){
							//PS.debug("g");
							points += 2;
							PS.color(positionX + 2, positionY, MID_COLOR);
							placedNotes[positionX] = positionY;
							PS.statusText("+2 |" + dispString + points.toString());
							this.playNote(positionY);
							if(!willRestart){
								willRestart = true;
								PS.statusText("Final level score: " + points.toString() + "/" + (((GridLength - 4) * 2) + 2).toString() + ". Click to replay.")
								PS.audioPlay( "fx_powerup1" );
								return;
							}else{
								PS.audioPlay( "fx_bloop" );
								willRestart = false;
								this.startSequence();
								return;
							}
							return;
						}else{
							//PS.debug("h");
							points += 1;
							PS.color(positionX + 2, positionY, LOW_COLOR);
							placedNotes[positionX] = positionY;
							PS.statusText("+1 |" + dispString + points.toString());
							this.playNote(positionY);
							if(!willRestart){
								willRestart = true;
								PS.statusText("Final level score: " + points.toString() + "/" + (((GridLength - 4) * 2) + 2).toString() + ". Click to replay.")
								PS.audioPlay( "fx_powerup1" );
								return;
							}else{
								PS.audioPlay( "fx_bloop" );
								willRestart = false;
								this.startSequence();
								return;
							}
							return;
						}
					}
				}
			}else{
				if(positionX == 0){
					if(noteSeq[0] == positionY){
						//PS.debug("a");
						points += 1;
						placedNotes[positionX] = positionY;
						PS.color(positionX + 2, positionY, LOW_COLOR);
						PS.statusText("+1 |" + dispString + points.toString());
						this.playNote(positionY);
						return;
					}else{
						//PS.debug("b");
						points += 2;
						placedNotes[positionX] = positionY;
						PS.color(positionX + 2, positionY, MID_COLOR);
						PS.statusText("+2 |" + dispString + points.toString());
						this.playNote(positionY);
						return;
					}
				}else{
					if(positionX > 0){
						var trueDiff = Math.abs(noteSeq[positionX] - noteSeq[positionX - 1]);
						var yourDiff = Math.abs(positionY - placedNotes[positionX - 1]);

						//PS.debug(trueDiff);
						//PS.debug(yourDiff);

						if(noteSeq[positionX] == positionY){
							//PS.debug("d");
							if(remOverlap > 0){
								//PS.debug("e");
								points += 3;
								remOverlap--;
								PS.color(positionX + 2, positionY, PLAYER_COLOR);
								placedNotes[positionX] = positionY;
								PS.statusText("+3 |" + dispString + points.toString());
								this.playNote(positionY);
								return;
							}else{
								//PS.debug("f");
								points += 1;
								PS.color(positionX + 2, positionY, LOW_COLOR);
								placedNotes[positionX] = positionY;
								PS.statusText("+1 |" + dispString + points.toString());
								this.playNote(positionY);
								return;
							}
						}

						if(yourDiff == trueDiff){
							//PS.debug("g");
							points += 2;
							PS.color(positionX + 2, positionY, MID_COLOR);
							placedNotes[positionX] = positionY;
							PS.statusText("+2 |" + dispString + points.toString());
							this.playNote(positionY);
							return;
						}else{
							//PS.debug("h");
							points += 1;
							PS.color(positionX + 2, positionY, LOW_COLOR);
							placedNotes[positionX] = positionY;
							PS.statusText("+1 |" + dispString + points.toString());
							this.playNote(positionY);
							return;
						}
					}
				}
			}


		},

		//getters below here
		getNoteSeq : function (){
			return noteSeq;
		},

		getHeight : function(){
			return GridHeight;
		},

		getLength : function(){
			return GridLength;
		},

		getPlayable : function(){
			return canPlay;
		},

		getRestartStatus: function(){
			return willRestart;
		}
	}


} () )



/*
PS.init( system, options )
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

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



	// PS.gridSize( 8, 8 );

	//start everything up

	PS.statusText("");
	WC.startSequence();

	// This is also a good place to display
	// your game title or a welcome message
	// in the status line above the grid.
	// Uncomment the following code line and
	// change the string parameter as needed.

	// PS.statusText( "Game" );

	// Add any other initialization code you need here.

	// Change this TEAM constant to your team name,
	// using ONLY alphabetic characters (a-z).
	// No numbers, spaces, punctuation or special characters!

	const TEAM = "topaz";

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

	//if ready to restart, do so when necessary
	if(WC.getRestartStatus()){
		PS.audioPlay( "fx_bloop" );
		//willRestart = false;
		WC.startSequence();
		return;
	}

	//if clicking the wrong place, do nothing
	if(x != 0){
		return;
	}

	if(y > WC.getHeight() - 3){
		return;
	}

	//if not ready, do nothing, else, handle the placement of notes
	if(!WC.getPlayable()){
		return;
	}else{
		WC.awardPoints(y);
	}
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

