// Globals
let song; // audio file
let notes = []; // notes/objects
let score = 0; // player's score
let keyPositions = [160, 320, 480, 640]; //x-positions of keys
let songDurationLimit; //song duration
let startTime; //start time of song
let isPlaying = false; //flag if song is playing
let notesGenerated = false; //flag if notes are generated

// Adjust timing values to stagger note appearance
let noteTimingIncrement = 500; // milliseconds
let currentNoteTiming = 0; // Initial timing for the first note

// Adjust hit threshold for more forgiving gameplay
let hitThreshold = 300; // milliseconds (adjust as needed)

// Adjust hit range for more accurate hit detection
let hitRange = 100; // pixels (adjust as needed)

function preload() {
  // Load song data
  loadStrings("songData.txt", function (data) {
    //song
    let songIndex = 0;
    let songData = data[songIndex].split(",");
    let songFilePath = songData[0];
    songDurationLimit = int(songData[1]);
    fadeDuration = int(songData[2]);
    // Load song
    song = loadSound(songFilePath, function () {
      startTime = millis(); //store start of song
      generateNotes(); // Calls generateNotes
      startGame(); // game start after song is loaded
    });
  });
}

function setup() {
  // Create canvas
  createCanvas(800, 600);

  //keyPos
  // keyPositions = [width * 0.2, width * 0.4, width * 0.6, width * 0.8];
}

function draw() {
  // clear canvas
  background(255);

  // Display keys
  for (let i = 0; i < keyPositions.length; i++) {
    fill(0);
    rect(keyPositions[i] - 25, height - 50, 50, 50);
  }

  // Display score
  fill(0);
  textSize(24);
  text("Score: " + score, 20, 40);

  // Note check
  if (notesGenerated) {
    // Display notes
    for (let i = 0; i < notes.length; i++) {
      // Check if the note exists before accessing its properties
      if (notes[i] && notes[i].hit !== undefined) {
        notes[i].display();
        notes[i].move();
      }else{
        notes.splice(i, 1);
      }
    }
  }
}


//Notes based off note chart
function generateNotes() {
  // Load chart data
  loadStrings("noteData.txt", function (data) {
    // Parse chart data
    for (let i = 0; i < data.length; i++) {
      let noteData = data[i].split(",");
      let duration = int(noteData[1]);
      let lane = int(noteData[2]);
      let speed = int(noteData[3]);
      let newNote = new Note(currentNoteTiming, duration, lane, speed); // Pass adjusted timing value to Note constructor
      notes.push(newNote);
      currentNoteTiming += noteTimingIncrement; // Increment timing for the next note
    }
    notesGenerated = true; // Flag set to true
  });
}

// Note class
class Note {
  constructor(tempTiming, tempDuration, tempLane, tempSpeed) {
    this.hit = false; // Initialize hit flag
    this.lane = tempLane; // Store lane information
    this.x = keyPositions[tempLane]; // Calculate x position based on lane
    this.y = -100; // Start above the canvas
    this.timing = tempTiming;
    this.speed = tempSpeed;
    this.size = 50; // Adjust size as needed
    this.duration = tempDuration; // Duration of button hold (ms)
    this.hitTime = null; // Hit time store
  }

  display() {
    // Determine note color based on hit status
    let noteColor = this.hit ? color(128, 50, 90) : color(212, 90, 120);

    // Check if this.x is a valid number
    if (typeof this.x !== "number" || isNaN(this.x)) {
      // Set a default x-coordinate
      this.x = 0;
    }

    // Draw the note
    fill(noteColor);
    noFill();
    ellipse(this.x, this.y, this.size, this.size);
  }

  move() {
    // Move note vertically
    this.y += this.speed;

    // Remove the note if off-screen
    if (this.y > height + this.size / 2) {
      notes.splice(notes.indexOf(this), 1); // Remove the note from the array
    }
  }

  isHit(currentTime) {
    // Check if the note has already been hit
    if (this.hit) {
      return false;
    }

    // Calculate the timing difference between the note and the current song time
    let timingDifference = abs(currentTime * 1000 - this.timing);

    // Check if the timing difference is within the hit threshold
    if (timingDifference < hitThreshold) {
      // Check if the note's x-coordinate is within a certain range around the key positions
      for (let i = 0; i < keyPositions.length; i++) {
        if (abs(this.x - keyPositions[i]) <= hitRange && this.y > height - 50 - hitRange) {
          // Mark the note as hit and return true
          this.hit = true;
          score += 10; // Increment score only when a note is hit
          this.hitTime = millis(); // Record the hit time
          return true;
        }
      }
    }

    // If the conditions are not met, return false
    return false;
  }
}

//Start game
function startGame() {
  if (song.isPlaying()) {
    song.stop(); // Stop song
  }
  // start song
  song.play();
  startTime = millis();
  isPlaying = true; // flag for song playing
  generateNotes();
}

// Input Handler
function keyPressed() {
  // Key for lane
  let lane = -1;
  let keyColor = this.lane ? color(255, 159, 70) : color(255, 67, 120);
  
  if (keyCode === LEFT_ARROW) {
    lane = 0;
  } else if (keyCode === UP_ARROW) {
    lane = 1;
  } else if (keyCode === DOWN_ARROW) {
    lane = 2;
  } else if (keyCode === RIGHT_ARROW) {
    lane = 3;
  }

  if (lane !== -1) {
    for (let i = 0; i < notes.length; i++) {
      if (
        !notes[i].hit &&
        notes[i].isHit(song.currentTime()) // Check if the note is hit
      ) {
        notes[i].hit = true;
        break;
      }
    }
  }
}
